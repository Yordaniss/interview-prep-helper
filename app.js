async function fetchQuestions() {
  const jobDescription = document.getElementById("jobDescription").value;
  if (!jobDescription) {
    alert("Please enter a job description.");
    return;
  }

  try {
    const response = await fetch("http://127.0.0.1:3000/jobs/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobDescription }),
    });

    if (!response.ok) {
      throw new Error("Error fetching questions");
    }

    const data = await response.json();
    displayQuestions(data.recommendedQuestion);
  } catch (error) {
    console.error(error);
    alert("Failed to fetch questions.");
  }
}

function displayQuestions(question) {
  const questionsSection = document.getElementById("questions-section");
  const questionsDiv = document.getElementById("questions");

  questionsSection.style.display = "block";
  questionsDiv.innerHTML = ""; 

  const questionEl = document.createElement("div");
  questionEl.classList.add("question");

  questionEl.innerHTML = `
        <p><strong>Question:</strong> ${question.question_text}</p>
        <textarea id="answer-${question.id}" placeholder="Your answer here..."></textarea>
        <button onclick="submitAnswer(${question.id})">Submit Answer</button>
      `;

  questionsDiv.appendChild(questionEl);
}

async function submitAnswer(questionId) {
  const answer = document.getElementById(`answer-${questionId}`).value;

  try {
    const response = await fetch(
      "http://127.0.0.1:3000/interview/submit-answer",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, userAnswer: answer }),
      }
    );

    if (!response.ok) {
      throw new Error("Error submitting answer");
    }

    const feedbackData = await response.json();
    displayFeedback(feedbackData.feedback);
  } catch (error) {
    console.error(error);
    alert("Failed to submit answer.");
  }
}

function displayFeedback(feedback) {
  const feedbackSection = document.getElementById("feedback-section");
  const feedbackDiv = document.getElementById("feedback");

  feedbackSection.style.display = "block";
  feedbackDiv.innerHTML = `<p><strong>Feedback:</strong> ${feedback}</p>`;
}
