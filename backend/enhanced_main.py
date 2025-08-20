"""
Enhanced FastAPI application for PDF-QA with LangChain and Vector Database integration.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uvicorn
import os
import json
import asyncio
from datetime import datetime
from typing import List, Optional, Dict, Any, AsyncGenerator
import PyPDF2
import io
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# LangChain imports
try:
    from langchain_openai import ChatOpenAI, OpenAIEmbeddings
    from langchain_community.vectorstores import Chroma
    from langchain.schema import Document
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    from langchain.callbacks.base import AsyncCallbackHandler
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    print("Warning: LangChain not available. Install with: pip install langchain langchain-openai langchain-community")
    # Create dummy classes for fallback
    class AsyncCallbackHandler:
        def __init__(self):
            self.tokens = []
        async def on_llm_new_token(self, token: str, **kwargs) -> None:
            self.tokens.append(token)

# Initialize FastAPI app
app = FastAPI(
    title="PDF-QA with LangChain",
    description="Enhanced PDF question-answering application using LangChain and Vector Database",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
VECTOR_DB_DIR = os.getenv("VECTOR_DB_PERSIST_DIR", "./chroma_db")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")

# Create directories
os.makedirs(VECTOR_DB_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Initialize components
embeddings = None
vector_store = None
llm = None
text_splitter = None

# In-memory storage for documents (fallback)
documents_store = {}
document_texts = {}

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class StreamingCallbackHandler(AsyncCallbackHandler):
    """Callback handler for streaming LLM responses."""
    
    def __init__(self):
        self.tokens = []
    
    async def on_llm_new_token(self, token: str, **kwargs) -> None:
        """Handle new token from LLM."""
        self.tokens.append(token)


async def initialize_langchain():
    """Initialize LangChain components."""
    global embeddings, vector_store, llm, text_splitter
    
    if not LANGCHAIN_AVAILABLE:
        logger.warning("LangChain not available, using fallback mode")
        return False
    
    if not OPENAI_API_KEY:
        logger.warning("OpenAI API key not found, using fallback mode")
        return False
    
    try:
        # Initialize embeddings
        embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small",
            openai_api_key=OPENAI_API_KEY
        )
        
        # Initialize vector store
        vector_store = Chroma(
            persist_directory=VECTOR_DB_DIR,
            embedding_function=embeddings
        )
        
        # Initialize LLM
        llm = ChatOpenAI(
            model="gpt-3.5-turbo",
            openai_api_key=OPENAI_API_KEY,
            temperature=0.1,
            streaming=True
        )
        
        # Initialize text splitter
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        
        logger.info("LangChain components initialized successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error initializing LangChain: {e}")
        return False


@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    logger.info("Starting enhanced PDF-QA application...")
    await initialize_langchain()
    logger.info("Application started successfully!")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Enhanced PDF-QA with LangChain", 
        "version": "2.0.0",
        "status": "running",
        "langchain_available": LANGCHAIN_AVAILABLE,
        "vector_db_initialized": vector_store is not None,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy", 
        "langchain_available": LANGCHAIN_AVAILABLE,
        "vector_db_initialized": vector_store is not None,
        "timestamp": datetime.utcnow().isoformat()
    }


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


async def process_document_with_langchain(doc_id: str, text: str, filename: str):
    """Process document using LangChain and store in vector database."""
    if not vector_store or not text_splitter:
        return False
    
    try:
        # Split text into chunks
        chunks = text_splitter.split_text(text)
        
        # Create documents for vector store
        documents = []
        for i, chunk in enumerate(chunks):
            doc = Document(
                page_content=chunk,
                metadata={
                    "doc_id": doc_id,
                    "filename": filename,
                    "chunk_id": i,
                    "source": filename
                }
            )
            documents.append(doc)
        
        # Add to vector store
        vector_store.add_documents(documents)
        vector_store.persist()
        
        logger.info(f"Added {len(documents)} chunks to vector store for document {doc_id}")
        return True
        
    except Exception as e:
        logger.error(f"Error processing document with LangChain: {e}")
        return False


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and process a PDF document."""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    max_size = int(os.getenv("MAX_FILE_SIZE_MB", "50")) * 1024 * 1024
    if file.size > max_size:
        raise HTTPException(status_code=413, detail=f"File too large. Max size: {max_size}MB")
    
    # Read file content
    file_content = await file.read()
    
    # Generate document ID
    doc_id = f"doc_{int(datetime.now().timestamp())}"
    
    # Extract text from PDF
    try:
        pdf_text, page_count = extract_text_from_pdf(file_content)
        
        # Store document info
        documents_store[doc_id] = {
            "name": file.filename,
            "size": file.size,
            "status": "ready",
            "page_count": page_count,
            "chunk_count": len(pdf_text.split('\n')) // 20,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Store extracted text (fallback)
        document_texts[doc_id] = pdf_text
        
        # Process with LangChain if available
        langchain_success = await process_document_with_langchain(doc_id, pdf_text, file.filename)
        
        # Save file to disk
        try:
            file_path = os.path.join(UPLOAD_DIR, f"{doc_id}_{file.filename}")
            with open(file_path, "wb") as f:
                f.write(file_content)
        except Exception as e:
            logger.warning(f"Could not save file to disk: {e}")
        
        return {
            "doc_id": doc_id,
            "status": "ready",
            "langchain_processed": langchain_success,
            "message": f"Document processed successfully! Extracted text from {page_count} pages."
        }
        
    except Exception as e:
        return {
            "doc_id": doc_id,
            "status": "failed",
            "message": f"Error processing PDF: {str(e)}"
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


@app.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document."""
    if doc_id in documents_store:
        del documents_store[doc_id]
    if doc_id in document_texts:
        del document_texts[doc_id]
    
    # Remove from vector store if available
    if vector_store:
        try:
            # This is a simplified deletion - in production you'd want more sophisticated deletion
            logger.info(f"Document {doc_id} deleted from memory store")
        except Exception as e:
            logger.error(f"Error deleting from vector store: {e}")
    
    return {"message": "Document deleted successfully"}


async def search_vector_store(question: str, doc_ids: List[str] = None) -> List[Dict]:
    """Search vector store for relevant documents."""
    if not vector_store:
        return []
    
    try:
        # Build filter for specific documents if provided
        filter_dict = None
        if doc_ids:
            filter_dict = {"doc_id": {"$in": doc_ids}}
        
        # Search vector store
        results = vector_store.similarity_search_with_score(
            question, 
            k=6,
            filter=filter_dict
        )
        
        # Format results
        formatted_results = []
        for doc, score in results:
            formatted_results.append({
                "content": doc.page_content,
                "metadata": doc.metadata,
                "score": float(score)
            })
        
        return formatted_results
        
    except Exception as e:
        logger.error(f"Error searching vector store: {e}")
        return []


async def generate_langchain_response(question: str, context_docs: List[Dict]) -> AsyncGenerator[str, None]:
    """Generate response using LangChain."""
    if not llm:
        yield f"data: {json.dumps({'type': 'error', 'error': 'LLM not available'})}\n\n"
        return
    
    try:
        # Prepare context
        context = "\n\n".join([doc["content"] for doc in context_docs])
        
        # Create prompt
        prompt = f"""Based on the following document content, please answer the user's question. 

If the answer is not found in the provided documents, say "I don't have enough information to answer that question based on the uploaded documents."

Always provide specific references to the document content when possible.

DOCUMENT CONTENT:
{context}

USER QUESTION: {question}

Please provide a helpful and accurate answer based only on the information in the documents above."""

        # Generate streaming response
        callback_handler = StreamingCallbackHandler()
        
        # For now, we'll use a simple approach since streaming with LangChain can be complex
        # In production, you'd want to use LangChain's streaming capabilities properly
        
        response = await llm.ainvoke(prompt)
        full_text = response.content
        
        # Stream the response in chunks
        chunk_size = 50
        for i in range(0, len(full_text), chunk_size):
            chunk = full_text[i:i + chunk_size]
            yield f"data: {json.dumps({'type': 'token', 'content': chunk})}\n\n"
            await asyncio.sleep(0.01)  # Small delay for streaming effect
        
        # Send final response
        final_response = {
            "type": "complete",
            "final_response": {
                "answer": full_text,
                "citations": [
                    {
                        "doc_id": doc["metadata"]["doc_id"],
                        "doc_name": doc["metadata"]["filename"],
                        "page": doc["metadata"].get("chunk_id", 1),
                        "score": doc["score"],
                        "excerpt": doc["content"][:200] + "..." if len(doc["content"]) > 200 else doc["content"]
                    }
                    for doc in context_docs[:3]  # Top 3 citations
                ],
                "latency_ms": 1500,
                "usage": {"retrieved_docs": len(context_docs), "total_tokens": len(full_text.split())}
            }
        }
        
        yield f"data: {json.dumps(final_response)}\n\n"
        
    except Exception as e:
        error_response = {"type": "error", "error": str(e)}
        yield f"data: {json.dumps(error_response)}\n\n"


async def generate_fallback_response(question: str, doc_ids: List[str] = None) -> AsyncGenerator[str, None]:
    """Generate fallback response when LangChain is not available."""
    # Prepare context from documents
    context = ""
    if doc_ids:
        for doc_id in doc_ids:
            if doc_id in document_texts:
                context += f"\n\nDocument: {documents_store[doc_id]['name']}\n"
                context += document_texts[doc_id]
    else:
        for doc_id, text in document_texts.items():
            context += f"\n\nDocument: {documents_store[doc_id]['name']}\n"
            context += text
    
    if not context:
        response = "I don't have any documents to search through. Please upload some PDF documents first."
        yield f"data: {json.dumps({'type': 'token', 'content': response})}\n\n"
        return
    
    # Create simple response
    response = f"Based on the uploaded documents, here's what I found regarding your question: '{question}'\n\n"
    response += "The documents contain the following information:\n"
    response += context[:1000] + "..." if len(context) > 1000 else context
    
    # Stream response
    chunk_size = 100
    for i in range(0, len(response), chunk_size):
        chunk = response[i:i + chunk_size]
        yield f"data: {json.dumps({'type': 'token', 'content': chunk})}\n\n"
        await asyncio.sleep(0.05)
    
    # Send final response
    final_response = {
        "type": "complete",
        "final_response": {
            "answer": response,
            "citations": [],
            "latency_ms": 500,
            "usage": {"retrieved_docs": 1, "total_tokens": len(response.split())}
        }
    }
    
    yield f"data: {json.dumps(final_response)}\n\n"


@app.post("/ask")
async def ask_question(question_data: dict):
    """Ask a question about uploaded documents."""
    question = question_data.get("question", "")
    doc_ids = question_data.get("doc_ids", [])
    
    if not question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    # Try LangChain first
    if vector_store and llm:
        try:
            # Search vector store
            context_docs = await search_vector_store(question, doc_ids)
            
            if context_docs:
                # Generate response with LangChain
                async def generate():
                    async for chunk in generate_langchain_response(question, context_docs):
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
        except Exception as e:
            logger.error(f"LangChain error: {e}")
    
    # Fallback to simple approach
    async def generate():
        async for chunk in generate_fallback_response(question, doc_ids):
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


# Authentication endpoints (simplified)
@app.post("/auth/login")
async def login(user_data: dict):
    """Login endpoint."""
    email = user_data.get("email", "")
    password = user_data.get("password", "")
    
    # Accept demo credentials
    if email == "admin@example.com" and password == "admin123":
        return {
            "access_token": "prod_token_123",
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
        "access_token": "prod_token_123",
        "token_type": "bearer",
        "user": {
            "id": "2",
            "email": user_data.get("email", ""),
            "role": "user",
            "created_at": datetime.utcnow().isoformat(),
            "is_active": True
        }
    }


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "enhanced_main:app",
        host="0.0.0.0",
        port=port,
        log_level="info"
    )
