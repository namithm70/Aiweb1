"""
FastAPI main application for PDF-QA with Gemini AI.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import google.generativeai as genai
import uvicorn
import os
import json
import asyncio
from datetime import datetime
from typing import List, Optional
import PyPDF2
import io

from gemini_config import GeminiConfig

# Initialize configuration
config = GeminiConfig()
config.validate()

# Configure Gemini
genai.configure(api_key=config.GEMINI_API_KEY)
model = genai.GenerativeModel(config.GEMINI_MODEL)

# Initialize FastAPI app
app = FastAPI(
    title="PDF-QA with Gemini AI",
    description="A comprehensive PDF question-answering application using Gemini AI",
    version="1.0.0"
)

# CORS middleware - Allow specific origins for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://aiweb1.vercel.app",  # Your Vercel frontend
        "https://aiweb1-git-main-namithm70.vercel.app",  # Vercel preview deployments
        "http://localhost:3000",  # For local development
        "http://127.0.0.1:3000"   # For local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directory
os.makedirs(config.UPLOAD_DIR, exist_ok=True)

# In-memory storage for documents (in production, use a proper database)
documents_store = {}
document_texts = {}

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "PDF-QA with Gemini AI - CORS Fixed", 
        "version": "1.0.1",
        "status": "running",
        "ai_model": config.GEMINI_MODEL,
        "cors_enabled": True,
        "allowed_origins": [
            "https://aiweb1.vercel.app",
            "https://aiweb1-git-main-namithm70.vercel.app",
            "http://localhost:3000"
        ],
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Authentication endpoints (simplified for demo)
@app.post("/auth/login")
async def login(user_data: dict):
    """Login endpoint."""
    email = user_data.get("email", "")
    password = user_data.get("password", "")
    
    # Accept demo credentials
    if email == "admin@example.com" and password == "admin123":
        return {
            "access_token": "demo_token_123",
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
    """Register endpoint."""
    return {
        "access_token": "demo_token_123",
        "token_type": "bearer",
        "user": {
            "id": "2",
            "email": user_data.get("email", ""),
            "role": "user",
            "created_at": datetime.utcnow().isoformat(),
            "is_active": True
        }
    }

@app.get("/auth/me")
async def get_current_user():
    """Get current user endpoint."""
    # For demo purposes, return a default user
    # In production, this would validate the JWT token
    return {
        "id": "1",
        "email": "admin@example.com",
        "role": "admin",
        "created_at": datetime.utcnow().isoformat(),
        "is_active": True
    }

@app.get("/documents")
async def list_documents():
    """List user's documents."""
    docs = []
    for doc_id, doc_info in documents_store.items():
        docs.append({
            "id": doc_id,
            "user_id": "1",
            "name": doc_info["name"],
            "size": doc_info["size"],
            "mime_type": "application/pdf",
            "status": doc_info["status"],
            "page_count": doc_info.get("page_count", 0),
            "chunk_count": doc_info.get("chunk_count", 0),
            "created_at": doc_info["created_at"],
            "updated_at": doc_info["updated_at"]
        })
    return {"documents": docs}

def extract_text_from_pdf(file_content: bytes) -> tuple[str, int]:
    """Extract text from PDF bytes."""
    try:
        pdf_file = io.BytesIO(file_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        text = ""
        for page_num, page in enumerate(pdf_reader.pages):
            page_text = page.extract_text()
            if page_text:
                text += f"\n--- Page {page_num + 1} ---\n"
                text += page_text
        
        return text, len(pdf_reader.pages)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading PDF: {str(e)}")

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and process a PDF document."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    if file.size > config.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File too large. Max size: {config.MAX_FILE_SIZE_MB}MB")
    
    # Read file content
    try:
        file_content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")
    
    # Generate document ID
    doc_id = f"doc_{int(datetime.now().timestamp())}"
    
    # Extract text from PDF
    try:
        pdf_text, page_count = extract_text_from_pdf(file_content)
        
        if not pdf_text.strip():
            return {
                "doc_id": doc_id,
                "status": "failed",
                "message": "No text could be extracted from the PDF. The file might be scanned images or corrupted."
            }
        
        # Store document info
        documents_store[doc_id] = {
            "name": file.filename,
            "size": file.size,
            "status": "ready",
            "page_count": page_count,
            "chunk_count": len(pdf_text.split('\n')) // 20,  # Rough estimate
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Store extracted text
        document_texts[doc_id] = pdf_text
        
        # Save file to disk
        try:
            file_path = os.path.join(config.UPLOAD_DIR, f"{doc_id}_{file.filename}")
            with open(file_path, "wb") as f:
                f.write(file_content)
        except Exception as e:
            # File save failed, but we still have the text in memory
            print(f"Warning: Failed to save file to disk: {e}")
        
        return {
            "doc_id": doc_id,
            "status": "ready",
            "message": f"Document processed successfully! Extracted text from {page_count} pages."
        }
        
    except Exception as e:
        return {
            "doc_id": doc_id,
            "status": "failed",
            "message": f"Error processing PDF: {str(e)}"
        }

@app.get("/documents/{doc_id}")
async def get_document(doc_id: str):
    """Get a specific document."""
    if doc_id not in documents_store:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc_info = documents_store[doc_id]
    return {
        "id": doc_id,
        "user_id": "1",
        "name": doc_info["name"],
        "size": doc_info["size"],
        "mime_type": "application/pdf",
        "status": doc_info["status"],
        "page_count": doc_info.get("page_count", 0),
        "chunk_count": doc_info.get("chunk_count", 0),
        "created_at": doc_info["created_at"],
        "updated_at": doc_info["updated_at"]
    }

@app.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document."""
    if doc_id in documents_store:
        del documents_store[doc_id]
    if doc_id in document_texts:
        del document_texts[doc_id]
    
    # Remove file from disk
    for file in os.listdir(config.UPLOAD_DIR):
        if file.startswith(f"{doc_id}_"):
            os.remove(os.path.join(config.UPLOAD_DIR, file))
            break
    
    return {"message": "Document deleted successfully"}

async def generate_streaming_response(prompt: str):
    """Generate streaming response from Gemini."""
    try:
        response = model.generate_content(prompt, stream=True)
        
        full_text = ""
        for chunk in response:
            if chunk.text:
                full_text += chunk.text
                yield f"data: {json.dumps({'type': 'token', 'content': chunk.text})}\n\n"
        
        # Send final response with citations
        final_response = {
            "type": "complete",
            "final_response": {
                "answer": full_text,
                "citations": [
                    {
                        "doc_id": "processed_docs",
                        "doc_name": "Uploaded Documents",
                        "page": 1,
                        "score": 0.95,
                        "excerpt": full_text[:200] + "..." if len(full_text) > 200 else full_text
                    }
                ],
                "latency_ms": 1500,
                "usage": {"retrieved_docs": 1, "total_tokens": len(full_text.split())}
            }
        }
        
        yield f"data: {json.dumps(final_response)}\n\n"
        
    except Exception as e:
        error_response = {"type": "error", "error": str(e)}
        yield f"data: {json.dumps(error_response)}\n\n"

@app.post("/ask")
async def ask_question(question_data: dict):
    """Ask a question about uploaded documents using Gemini AI."""
    question = question_data.get("question", "")
    doc_ids = question_data.get("doc_ids", [])
    
    if not question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    # Prepare context from documents
    context = ""
    if doc_ids:
        # Use specific documents
        for doc_id in doc_ids:
            if doc_id in document_texts:
                context += f"\n\nDocument: {documents_store[doc_id]['name']}\n"
                context += document_texts[doc_id]
    else:
        # Use all available documents
        for doc_id, text in document_texts.items():
            context += f"\n\nDocument: {documents_store[doc_id]['name']}\n"
            context += text
    
    if not context:
        # Return streaming response even when no documents
        async def generate_no_docs():
            message = "I don't have any documents to search through. Please upload some PDF documents first."
            yield f"data: {json.dumps({'type': 'token', 'content': message})}\n\n"
            final_response = {
                "type": "complete",
                "final_response": {
                    "answer": message,
                    "citations": [],
                    "latency_ms": 50,
                    "usage": {"retrieved_docs": 0, "total_tokens": 0}
                }
            }
            yield f"data: {json.dumps(final_response)}\n\n"
        
        return StreamingResponse(
            generate_no_docs(),
            media_type="text/stream-server-sent-events",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
            }
        )
    
    # Create prompt for Gemini
    prompt = f"""Based on the following document content, please answer the user's question. 
    
If the answer is not found in the provided documents, say "I don't have enough information to answer that question based on the uploaded documents."

Always provide specific references to the document content when possible.

DOCUMENT CONTENT:
{context}

USER QUESTION: {question}

Please provide a helpful and accurate answer based only on the information in the documents above."""
    
    # Return streaming response
    async def generate():
        async for chunk in generate_streaming_response(prompt):
            yield chunk
    
    return StreamingResponse(
        generate(),
        media_type="text/stream-server-sent-events",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
        }
    )

if __name__ == "__main__":
    uvicorn.run(
        "gemini_main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
