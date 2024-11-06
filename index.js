require('dotenv').config();

const express = require("express");
const { Pool } = require("pg");
const { Ollama } = require("ollama");
const cors = require('cors');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const ollama = new Ollama();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

app.use(session({
  secret: process.env.SESSION_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
}));

async function getOllamaEmbedding(text) {
  try {
    const response = await ollama.embed({
      model: "mistral",
      input: text,
    });
    console.log("Embedding from Ollama:", response.embeddings);
    return response.embeddings;
  } catch (error) {
    console.error("Failed to get embedding from Ollama:", error.message);
    throw error;
  }
}

async function storeQuestion(questionText, topic, difficulty) {
  try {
    // Get embedding from Ollama
    const embeddingArray = await getOllamaEmbedding(questionText);

    if (!embeddingArray || !Array.isArray(embeddingArray)) {
      throw new Error("Invalid embedding format received from Ollama");
    }

    const embeddingString = `[${embeddingArray.join(",")}]`;

    const query = `
      INSERT INTO questions (question_text, topic, difficulty, embedding)
      VALUES ($1, $2, $3, $4::vector)
    `;

    await pool.query(query, [questionText, topic, difficulty, embeddingString]);
    console.log("Question stored successfully with embedding.");
  } catch (err) {
    console.error("Failed to store question:", err);
  }
}

async function extractSkillsFromJobDescription(jobDescription) {
  try {
    const response = await ollama.chat({
      model: "mistral",
      messages: [
        {
          role: "user",
          content: `Extract skill-related terms from the following job description: ${jobDescription}`,
        },
      ],
    });

    const extractedSkills = response.message.content;
    const embedding = await ollama.embed({
      model: "mistral",
      input: extractedSkills,
    });

    return embedding.embeddings;
  } catch (error) {
    console.error("Failed to parse and embed job description:", error.message);
    throw error;
  }
}

async function getPGAIFeedback(userCode, questionText) {
  try {
    const prompt = `
      Question: ${questionText}
      User's Answer: ${userCode}
      
      Analyze the user's answer with the following criteria:
      - Correctness: Is the answer logically correct and does it solve the problem?
      - Efficiency: Is the code efficient in terms of time and space complexity?
      - Code Quality: Comment on code readability, style, and structure.
      - Suggestions: Provide constructive feedback for improvement.
      
      Please provide detailed feedback based on these points.
    `;

    const response = await ollama.chat({
      model: "mistral",
      messages: [{ role: "user", content: prompt }],
    });

    return response.message.content;
  } catch (error) {
    console.error("Failed to get PGAI feedback:", error);
    return "Unable to process feedback at this time.";
  }
}

app.post("/questions", async (req, res) => {
  const { questionText, topic, difficulty } = req.body;
  try {
    await storeQuestion(questionText, topic, difficulty);
    res.status(201).send("Question added successfully");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error adding question");
  }
});


app.post("/jobs/parse", async (req, res) => {
  const { jobDescription } = req.body;
  
  try {
    const jobEmbedding = await extractSkillsFromJobDescription(jobDescription);

    if (!jobEmbedding || !Array.isArray(jobEmbedding)) {
      throw new Error("Invalid embedding format received from Ollama");
    }

    const embeddingString = `[${jobEmbedding.join(",")}]`;

    const recentQuestionIds = req.session.recentQuestionIds || [];

    const result = await pool.query(
      `
      WITH job_embedding AS (
        SELECT ai.ollama_embed(
          'mistral',
           $1,
           host => $2
        ) AS embedding
      )
      SELECT id, question_text, topic, difficulty,
             (embedding <-> (SELECT embedding FROM job_embedding)) AS distance
      FROM questions
      WHERE ($3::int[] IS NULL OR id != ALL($2::int[])) -- Only exclude if recentQuestionIds exists
      ORDER BY distance
      LIMIT 1;
      `,
      [embeddingString, process.env.QUERY_HOST ,recentQuestionIds.length > 0 ? recentQuestionIds : null]
    );

    if (result.rows.length > 0) {
      const questionId = result.rows[0].id;

      req.session.recentQuestionIds = [...recentQuestionIds, questionId];
      if (req.session.recentQuestionIds.length > 5) {
        req.session.recentQuestionIds.shift();
      }

      console.log(result.rows[0]);

      res.json({ recommendedQuestion: result.rows[0] });
    } else {
      res.status(404).send("No questions available for this job description.");
    }
  } catch (err) {
    console.error("Error processing job description:", err);
    res.status(500).send("Error processing job description.");
  }
});

app.post("/interview/submit-answer", async (req, res) => {
  const { questionId, userAnswer } = req.body;
  try {
    const questionResult = await pool.query(
      "SELECT question_text FROM questions WHERE id = $1",
      [questionId]
    );

    if (questionResult.rows.length === 0) {
      return res.status(404).json({ message: "Question not found" });
    }

    const questionText = questionResult.rows[0].question_text;

    const feedback = await getPGAIFeedback(userAnswer, questionText);

    res.json({ feedback });
  } catch (err) {
    console.error("Failed to process answer:", err);
    res.status(500).send("Error processing answer");
  }
});

app.get("/questions/recommend", async (req, res) => {
  const { query } = req.query;
  try {
    const embedding = await getOllamaEmbedding(query);
    console.log("Embedding generated:", embedding);

    if (!Array.isArray(embedding)) {
      throw new Error("Embedding is not an array or has incorrect dimensions.");
    }

    const embeddingString = `[${embedding.join(",")}]`;

    const result = await pool.query(
      `
      SELECT id, question_text, topic, difficulty,
      (embedding <-> $1::vector) AS distance
      FROM questions
      ORDER BY distance
      LIMIT 5;
      `,
      [embeddingString]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error retrieving recommendations:", err); 
    res.status(500).send("Error retrieving recommendations");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
