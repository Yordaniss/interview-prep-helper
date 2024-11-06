# AI Interview Prep Helper with PostgreSQL, Ollama and Open-Source Vector Extensions 🚀

## Project Overview
This project demonstrates a lightweight AI application that leverages open-source tools, using PostgreSQL as the vector database with AI extensions. By embedding job descriptions and questions into vector format, this application can identify relevant questions based on job requirements, offer tailored question recommendations, and provide AI-generated feedback on responses.

## The key tools used in this project include:

- PostgreSQL with pgvector for storing and querying vector embeddings.
- pgAI for processing and retrieving feedback on user answers.
- Ollama as an AI tool for embedding and generating text responses.

## Project Components
The application has three primary parts:

- Job Description Parsing and Question Recommendation: Given a job description, the application extracts key skills and identifies relevant questions from the database.
- AI-Driven Answer Feedback: Upon submitting an answer to a question, the application leverages AI feedback based on correctness, efficiency, code quality, and recommendations.
- Embeddings and Vector Search: Job descriptions and questions are embedded as vectors in PostgreSQL, allowing efficient similarity-based search using pgvector.

## Technologies Used:

1. PostgreSQL serves as the primary database for this application.
We use it to store both traditional data (such as question text, topics, and difficulty levels) and vector embeddings, making it ideal for AI-powered searches.

2. pgvector is a PostgreSQL extension that allows us to store and query high-dimensional vector embeddings. This is crucial for similarity searches in AI applications, as it lets us find embeddings that are most similar to a given input.
This extension enables storage of vector data types and supports operations like cosine distance for similarity measurement, which we use to rank questions based on their relevance to the job description.

3. pgAI provides an interface to integrate AI models directly within PostgreSQL. We use it to generate tailored feedback for users based on their submitted answers to questions.
This feedback is generated by providing user responses as input to the AI model, which evaluates it on multiple aspects, including correctness, efficiency, and code quality.
4. Ollama is used to handle text generation and embedding creation tasks. It enables embeddings for both job descriptions and questions, which we store as vectors in PostgreSQL.
Ollama’s language model, specified here as "mistral," processes user queries and provides responses, helping generate tailored AI feedback on responses and extracting skills from job descriptions.

## Application Structure
### Code Files
- index.js: Contains the main server logic for the AI application, connecting to PostgreSQL, handling endpoints, and integrating Ollama for embedding and feedback generation.
- app.js: Handles the client-side logic for fetching and displaying recommended questions and feedback based on user inputs.
## Key Functions
- Embedding Creation: Using Ollama, the application creates embeddings for job descriptions and questions, which are stored as vectors in PostgreSQL.
- Job Description Parsing: Given a job description, the application extracts skill-related terms, which are then embedded and stored.
- Question Recommendation: Based on vector similarity searches, relevant questions are retrieved from PostgreSQL using pgvecto indexes.
- Answer Feedback Generation: Using pgAI, the application provides constructive feedback on user answers, analyzing correctness, efficiency, and other criteria.

## Setup and Installation
### Prerequisites
- Docker
- Node.js and npm
- PostgreSQL with required extensions: pgvector and pgAI.
Installation

### Clone the repository:

git clone https://github.com/yourusername/yourproject.git

### Install Dependencies:

npm install

### Configure Environment Variables: Create a .env file with the following details:


- PG_USER=your_pg_user
- PG_PASSWORD=your_pg_password
- PG_DATABASE=your_database_name
- PG_HOST=localhost
- PG_PORT=5432

- SESSION_KEY=your_session_key
- QUERY_HOST=your_query_host

### Start the Application: Start the PostgreSQL database, ensuring it has the pgvector and pgai extensions enabled. Run:

- docker-compose up
- node index.js

### How to Use
- ⭐ Job Description Input: Enter a job description to get relevant questions.
- 📔 Answer Submission: Submit answers to questions and receive feedback based on several criteria.
- 🗣️ Question Recommendations: Based on vector similarity, get recommended questions that align with the skills extracted from the job description.

### Future Improvements
- Adding additional distance metrics in pgvector for more flexible similarity searches.
- Expanding the embedding model to support more domains or specific industry requirements.
- Improving session handling for better user experience across multiple recommendations.