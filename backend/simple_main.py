"""
Simplified FastAPI main application for PDF-QA (basic version without AI features).
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from datetime import datetime
import json

# Initialize FastAPI app
app = FastAPI(
    title="PDF-QA with RAG",
    description="A comprehensive PDF question-answering application using RAG",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directory
os.makedirs("uploads", exist_ok=True)

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "PDF-QA with RAG API", 
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Simple authentication endpoints (mock for now)
@app.post("/auth/login")
async def login(user_data: dict):
    """Mock login endpoint."""
    email = user_data.get("email", "")
    password = user_data.get("password", "")
    
    # Mock authentication - accept the demo credentials
    if email == "admin@example.com" and password == "admin123":
        return {
            "access_token": "mock_token_123",
            "token_type": "bearer",
            "user": {
                "id": "1",
                "email": email,
                "role": "admin",
                "created_at": datetime.utcnow().isoformat(),
                "is_active": True
            }
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/auth/register")
async def register(user_data: dict):
    """Mock register endpoint."""
    return {
        "access_token": "mock_token_123",
        "token_type": "bearer",
        "user": {
            "id": "2",
            "email": user_data.get("email", ""),
            "role": "user",
            "created_at": datetime.utcnow().isoformat(),
            "is_active": True
        }
    }

# Document management endpoints
@app.get("/documents")
async def list_documents():
    """List user's documents."""
    return {"documents": [
        {
            "id": "demo-doc-1",
            "user_id": "1",
            "name": "sample_document.pdf",
            "size": 1024000,
            "mime_type": "application/pdf",
            "status": "ready",
            "page_count": 10,
            "chunk_count": 25,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
    ]}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload a PDF document (basic version)."""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Save the file
    file_path = os.path.join("uploads", file.filename)
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    return {
        "doc_id": f"doc_{datetime.now().timestamp()}",
        "status": "processing",
        "message": "Document uploaded successfully. AI processing will be available when OpenAI API key is configured."
    }

@app.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document."""
    return {"message": "Document deleted successfully"}

@app.post("/ask")
async def ask_question(question_data: dict):
    """Ask a question (mock response for now)."""
    question = question_data.get("question", "")
    
    # Mock response
    mock_response = {
        "answer": f"This is a mock response to your question: '{question}'. The AI features will work when you add your OpenAI API key and install the required packages.",
        "citations": [
            {
                "doc_id": "demo-doc-1",
                "doc_name": "sample_document.pdf",
                "page": 1,
                "score": 0.95,
                "excerpt": "This is a sample excerpt from the document that relates to your question."
            }
        ],
        "latency_ms": 150,
        "usage": {
            "retrieved_docs": 1,
            "total_tokens": 50
        }
    }
    
    return mock_response

if __name__ == "__main__":
    uvicorn.run(
        "simple_main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
