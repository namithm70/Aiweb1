"""
FastAPI main application for PDF-QA with RAG system.
"""

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
import uvicorn
import os
from dotenv import load_dotenv
import asyncio
from typing import List, Optional
import json
import logging
from datetime import datetime

from config import Settings
from models import User, Document, QuestionRequest, ChatResponse
from auth import AuthManager, get_current_user
from pdf_processor import PDFProcessor
from rag_chain import RAGChain
from database import DatabaseManager

# Load environment variables
load_dotenv()

# Initialize settings
settings = Settings()

# Initialize FastAPI app
app = FastAPI(
    title="PDF-QA with RAG",
    description="A comprehensive PDF question-answering application using RAG",
    version="1.0.0"
)

# CORS middleware - Allow all origins for development/production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Initialize components
auth_manager = AuthManager(settings.SECRET_KEY)
pdf_processor = PDFProcessor(settings)
rag_chain = RAGChain(settings)
db_manager = DatabaseManager(settings.DATABASE_URL)

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    logger.info("Starting PDF-QA application...")
    
    # Create upload directories
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.VECTOR_DB_PERSIST_DIR, exist_ok=True)
    
    # Initialize database
    await db_manager.init_db()
    
    # Initialize RAG chain
    await rag_chain.initialize()
    
    logger.info("Application started successfully!")


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

@app.get("/test-cors")
async def test_cors():
    """Test CORS endpoint."""
    return {"message": "CORS is working!", "timestamp": datetime.utcnow().isoformat()}


# Authentication endpoints
@app.post("/auth/register")
async def register(user_data: dict):
    """Register a new user."""
    try:
        user = await auth_manager.create_user(
            email=user_data["email"],
            password=user_data["password"]
        )
        token = auth_manager.create_access_token({"sub": user.email})
        return {"access_token": token, "token_type": "bearer", "user": user.dict()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/auth/login")
async def login(user_data: dict):
    """Authenticate user and return token."""
    try:
        user = await auth_manager.authenticate_user(
            user_data["email"], 
            user_data["password"]
        )
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        token = auth_manager.create_access_token({"sub": user.email})
        return {"access_token": token, "token_type": "bearer", "user": user.dict()}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.post("/auth/register")
async def register(user_data: dict):
    """Register a new user."""
    try:
        user = await auth_manager.create_user(
            email=user_data["email"],
            password=user_data["password"]
        )
        token = auth_manager.create_access_token({"sub": user.email})
        return {"access_token": token, "token_type": "bearer", "user": user.dict()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Document management endpoints
@app.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload and process a PDF document."""
    try:
        # Validate file
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        if file.size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
            raise HTTPException(status_code=413, detail=f"File too large. Max size: {settings.MAX_FILE_SIZE_MB}MB")
        
        # Save document metadata
        document = await db_manager.create_document(
            name=file.filename,
            user_id=current_user.id,
            size=file.size,
            mime_type=file.content_type
        )
        
        # Save uploaded file
        file_path = os.path.join(settings.UPLOAD_DIR, f"{document.id}_{file.filename}")
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Process document in background
        background_tasks.add_task(
            process_document_background, 
            document.id, 
            file_path, 
            current_user.id
        )
        
        return {
            "doc_id": document.id,
            "status": "processing",
            "message": "Document uploaded successfully and is being processed"
        }
    
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def process_document_background(doc_id: str, file_path: str, user_id: str):
    """Background task to process uploaded document."""
    try:
        logger.info(f"Processing document {doc_id}...")
        
        # Update status to processing
        await db_manager.update_document_status(doc_id, "processing")
        
        # Process PDF
        chunks = await pdf_processor.process_pdf(file_path, doc_id)
        
        # Store in vector database
        await rag_chain.add_document_chunks(chunks, doc_id, user_id)
        
        # Update status to ready
        await db_manager.update_document_status(doc_id, "ready", len(chunks))
        
        logger.info(f"Document {doc_id} processed successfully with {len(chunks)} chunks")
        
    except Exception as e:
        logger.error(f"Error processing document {doc_id}: {str(e)}")
        await db_manager.update_document_status(doc_id, "failed", error=str(e))


@app.get("/documents")
async def list_documents(current_user: User = Depends(get_current_user)):
    """List user's documents."""
    try:
        documents = await db_manager.get_user_documents(current_user.id)
        return {"documents": documents}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/documents/{doc_id}")
async def delete_document(
    doc_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """Delete a document and its embeddings."""
    try:
        # Verify ownership
        document = await db_manager.get_document(doc_id)
        if not document or document.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Delete in background
        background_tasks.add_task(delete_document_background, doc_id, current_user.id)
        
        return {"message": "Document deletion initiated"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def delete_document_background(doc_id: str, user_id: str):
    """Background task to delete document and vectors."""
    try:
        # Remove from vector database
        await rag_chain.delete_document(doc_id, user_id)
        
        # Delete file
        document = await db_manager.get_document(doc_id)
        if document:
            file_path = os.path.join(settings.UPLOAD_DIR, f"{doc_id}_{document.name}")
            if os.path.exists(file_path):
                os.remove(file_path)
        
        # Delete from database
        await db_manager.delete_document(doc_id)
        
        logger.info(f"Document {doc_id} deleted successfully")
        
    except Exception as e:
        logger.error(f"Error deleting document {doc_id}: {str(e)}")


@app.post("/ask")
async def ask_question(
    question_data: QuestionRequest,
    current_user: User = Depends(get_current_user)
):
    """Ask a question and get streaming response."""
    try:
        # Validate question
        if not question_data.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        
        # Generate streaming response
        async def generate_response():
            try:
                async for chunk in rag_chain.ask_question(
                    question=question_data.question,
                    user_id=current_user.id,
                    doc_ids=question_data.doc_ids,
                    k=question_data.k
                ):
                    yield f"data: {json.dumps(chunk)}\n\n"
                
            except Exception as e:
                error_chunk = {"error": str(e), "type": "error"}
                yield f"data: {json.dumps(error_chunk)}\n\n"
        
        return StreamingResponse(
            generate_response(),
            media_type="text/stream-server-sent-events",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
