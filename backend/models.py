"""
Pydantic models and database schemas for the PDF-QA application.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class DocumentStatus(str, Enum):
    """Document processing status."""
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class UserRole(str, Enum):
    """User roles."""
    USER = "user"
    ADMIN = "admin"


# Pydantic Models for API
class UserBase(BaseModel):
    """Base user model."""
    email: EmailStr
    role: UserRole = UserRole.USER


class UserCreate(UserBase):
    """User creation model."""
    password: str = Field(..., min_length=8)


class User(UserBase):
    """User model with ID."""
    id: str
    created_at: datetime
    is_active: bool = True
    
    class Config:
        from_attributes = True


class DocumentBase(BaseModel):
    """Base document model."""
    name: str
    size: int
    mime_type: str = "application/pdf"


class DocumentCreate(DocumentBase):
    """Document creation model."""
    user_id: str


class Document(DocumentBase):
    """Document model with metadata."""
    id: str
    user_id: str
    status: DocumentStatus = DocumentStatus.PROCESSING
    page_count: Optional[int] = None
    chunk_count: Optional[int] = None
    error: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ChunkMetadata(BaseModel):
    """Metadata for document chunks."""
    doc_id: str
    user_id: str
    page: int
    char_start: int
    char_end: int
    source: str


class DocumentChunk(BaseModel):
    """Document chunk model."""
    id: str
    doc_id: str
    page: int
    text: str
    metadata: ChunkMetadata
    

class Citation(BaseModel):
    """Citation model for answers."""
    doc_id: str
    doc_name: str
    page: int
    score: float
    excerpt: str
    char_start: Optional[int] = None
    char_end: Optional[int] = None


class QuestionRequest(BaseModel):
    """Request model for asking questions."""
    question: str = Field(..., min_length=1, max_length=1000)
    doc_ids: Optional[List[str]] = None
    k: int = Field(default=6, ge=1, le=20)
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    """Response model for chat."""
    answer: str
    citations: List[Citation]
    usage: Optional[Dict[str, Any]] = None
    latency_ms: Optional[int] = None
    conversation_id: Optional[str] = None


class StreamChunk(BaseModel):
    """Streaming response chunk."""
    type: str  # "token", "citation", "complete", "error"
    content: Optional[str] = None
    citation: Optional[Citation] = None
    final_response: Optional[ChatResponse] = None
    error: Optional[str] = None


class ConversationBase(BaseModel):
    """Base conversation model."""
    title: str
    user_id: str


class Conversation(ConversationBase):
    """Conversation model."""
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class MessageRole(str, Enum):
    """Message roles."""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class MessageBase(BaseModel):
    """Base message model."""
    role: MessageRole
    content: str
    conversation_id: str


class Message(MessageBase):
    """Message model with metadata."""
    id: str
    citations: List[Citation] = []
    latency_ms: Optional[int] = None
    token_usage: Optional[Dict[str, int]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class JobStatus(str, Enum):
    """Background job status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class JobType(str, Enum):
    """Background job types."""
    INDEX_DOCUMENT = "index_document"
    DELETE_DOCUMENT = "delete_document"
    REINDEX_DOCUMENT = "reindex_document"


class Job(BaseModel):
    """Background job model."""
    id: str
    type: JobType
    status: JobStatus
    data: Dict[str, Any] = {}
    error: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Response models
class UploadResponse(BaseModel):
    """Response for document upload."""
    doc_id: str
    status: DocumentStatus
    message: str


class DocumentListResponse(BaseModel):
    """Response for document list."""
    documents: List[Document]


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    timestamp: datetime


class AuthResponse(BaseModel):
    """Authentication response."""
    access_token: str
    token_type: str
    user: User
