# PDF-QA with RAG

A comprehensive PDF question-answering application built with RAG (Retrieval-Augmented Generation) using LangChain, FastAPI, and React.

## Features

- 📄 PDF Upload & Processing
- 🔍 Intelligent Question Answering with Citations
- 💬 Streaming Chat Interface
- 📊 Document Management
- 🔐 Authentication & Authorization
- 📈 Monitoring & Analytics

## Architecture

- **Backend**: FastAPI (Python) with LangChain
- **Frontend**: React with Next.js
- **Vector DB**: Chroma (ChromaDB)
- **LLM**: OpenAI GPT models
- **Embeddings**: OpenAI text-embedding-3-large
- **Storage**: Local filesystem (S3-compatible for production)

## Quick Start

1. **Setup Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your OpenAI API key
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key
- `SECRET_KEY`: JWT secret key for authentication
- `DATABASE_URL`: Database connection string (optional)

## Project Structure

```
├── backend/          # FastAPI backend
├── frontend/         # React frontend
├── docker-compose.yml
└── README.md
```

## Development

See individual README files in backend/ and frontend/ directories for detailed setup instructions.
