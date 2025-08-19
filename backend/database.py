"""
Database management module for the PDF-QA application.
"""

import uuid
import sqlite3
import aiosqlite
from datetime import datetime
from typing import List, Optional, Dict, Any
import json
import os

from models import Document, DocumentStatus, User, UserCreate, UserRole


class DatabaseManager:
    """Manages database operations."""
    
    def __init__(self, database_url: str):
        self.database_url = database_url
        # Extract database path from URL for SQLite
        if database_url.startswith("sqlite:///"):
            self.db_path = database_url.replace("sqlite:///", "")
        else:
            self.db_path = "pdf_qa.db"
    
    async def init_db(self):
        """Initialize database with required tables."""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                # Enable foreign keys
                await db.execute("PRAGMA foreign_keys = ON")
                
                # Create users table
                await db.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        id TEXT PRIMARY KEY,
                        email TEXT UNIQUE NOT NULL,
                        password_hash TEXT NOT NULL,
                        role TEXT NOT NULL DEFAULT 'user',
                        is_active BOOLEAN DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Create documents table
                await db.execute("""
                    CREATE TABLE IF NOT EXISTS documents (
                        id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        name TEXT NOT NULL,
                        size INTEGER NOT NULL,
                        mime_type TEXT DEFAULT 'application/pdf',
                        status TEXT DEFAULT 'processing',
                        page_count INTEGER,
                        chunk_count INTEGER,
                        error TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                """)
                
                # Create conversations table
                await db.execute("""
                    CREATE TABLE IF NOT EXISTS conversations (
                        id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        title TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                """)
                
                # Create messages table
                await db.execute("""
                    CREATE TABLE IF NOT EXISTS messages (
                        id TEXT PRIMARY KEY,
                        conversation_id TEXT NOT NULL,
                        role TEXT NOT NULL,
                        content TEXT NOT NULL,
                        citations TEXT, -- JSON string
                        latency_ms INTEGER,
                        token_usage TEXT, -- JSON string
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (conversation_id) REFERENCES conversations (id)
                    )
                """)
                
                # Create jobs table
                await db.execute("""
                    CREATE TABLE IF NOT EXISTS jobs (
                        id TEXT PRIMARY KEY,
                        type TEXT NOT NULL,
                        status TEXT DEFAULT 'pending',
                        data TEXT, -- JSON string
                        error TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        completed_at TIMESTAMP
                    )
                """)
                
                await db.commit()
                print("Database initialized successfully")
                
        except Exception as e:
            print(f"Database initialization error: {e}")
            raise
    
    async def create_document(
        self, 
        name: str, 
        user_id: str, 
        size: int, 
        mime_type: str = "application/pdf"
    ) -> Document:
        """Create a new document record."""
        doc_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT INTO documents 
                (id, user_id, name, size, mime_type, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (doc_id, user_id, name, size, mime_type, "processing", now, now))
            await db.commit()
        
        return Document(
            id=doc_id,
            user_id=user_id,
            name=name,
            size=size,
            mime_type=mime_type,
            status=DocumentStatus.PROCESSING,
            created_at=now,
            updated_at=now
        )
    
    async def get_document(self, doc_id: str) -> Optional[Document]:
        """Get document by ID."""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("""
                SELECT * FROM documents WHERE id = ?
            """, (doc_id,))
            row = await cursor.fetchone()
            
            if row:
                return Document(
                    id=row["id"],
                    user_id=row["user_id"],
                    name=row["name"],
                    size=row["size"],
                    mime_type=row["mime_type"],
                    status=DocumentStatus(row["status"]),
                    page_count=row["page_count"],
                    chunk_count=row["chunk_count"],
                    error=row["error"],
                    created_at=datetime.fromisoformat(row["created_at"].replace('Z', '+00:00')) if row["created_at"] else datetime.utcnow(),
                    updated_at=datetime.fromisoformat(row["updated_at"].replace('Z', '+00:00')) if row["updated_at"] else datetime.utcnow()
                )
            return None
    
    async def get_user_documents(self, user_id: str) -> List[Document]:
        """Get all documents for a user."""
        documents = []
        
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("""
                SELECT * FROM documents 
                WHERE user_id = ? 
                ORDER BY created_at DESC
            """, (user_id,))
            rows = await cursor.fetchall()
            
            for row in rows:
                documents.append(Document(
                    id=row["id"],
                    user_id=row["user_id"],
                    name=row["name"],
                    size=row["size"],
                    mime_type=row["mime_type"],
                    status=DocumentStatus(row["status"]),
                    page_count=row["page_count"],
                    chunk_count=row["chunk_count"],
                    error=row["error"],
                    created_at=datetime.fromisoformat(row["created_at"].replace('Z', '+00:00')) if row["created_at"] else datetime.utcnow(),
                    updated_at=datetime.fromisoformat(row["updated_at"].replace('Z', '+00:00')) if row["updated_at"] else datetime.utcnow()
                ))
        
        return documents
    
    async def update_document_status(
        self, 
        doc_id: str, 
        status: str, 
        chunk_count: Optional[int] = None,
        page_count: Optional[int] = None,
        error: Optional[str] = None
    ):
        """Update document status and metadata."""
        now = datetime.utcnow()
        
        async with aiosqlite.connect(self.db_path) as db:
            if chunk_count is not None or page_count is not None:
                await db.execute("""
                    UPDATE documents 
                    SET status = ?, chunk_count = ?, page_count = ?, error = ?, updated_at = ?
                    WHERE id = ?
                """, (status, chunk_count, page_count, error, now, doc_id))
            else:
                await db.execute("""
                    UPDATE documents 
                    SET status = ?, error = ?, updated_at = ?
                    WHERE id = ?
                """, (status, error, now, doc_id))
            await db.commit()
    
    async def delete_document(self, doc_id: str):
        """Delete document record."""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
            await db.commit()
    
    async def create_conversation(self, user_id: str, title: str) -> str:
        """Create a new conversation."""
        conv_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT INTO conversations (id, user_id, title, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
            """, (conv_id, user_id, title, now, now))
            await db.commit()
        
        return conv_id
    
    async def add_message(
        self, 
        conversation_id: str, 
        role: str, 
        content: str,
        citations: List[Dict] = None,
        latency_ms: int = None,
        token_usage: Dict = None
    ) -> str:
        """Add message to conversation."""
        msg_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        citations_json = json.dumps(citations) if citations else None
        usage_json = json.dumps(token_usage) if token_usage else None
        
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT INTO messages 
                (id, conversation_id, role, content, citations, latency_ms, token_usage, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (msg_id, conversation_id, role, content, citations_json, latency_ms, usage_json, now))
            await db.commit()
        
        return msg_id
    
    async def get_conversation_messages(self, conversation_id: str) -> List[Dict]:
        """Get all messages in a conversation."""
        messages = []
        
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("""
                SELECT * FROM messages 
                WHERE conversation_id = ? 
                ORDER BY created_at ASC
            """, (conversation_id,))
            rows = await cursor.fetchall()
            
            for row in rows:
                message = {
                    "id": row["id"],
                    "conversation_id": row["conversation_id"],
                    "role": row["role"],
                    "content": row["content"],
                    "citations": json.loads(row["citations"]) if row["citations"] else [],
                    "latency_ms": row["latency_ms"],
                    "token_usage": json.loads(row["token_usage"]) if row["token_usage"] else {},
                    "created_at": row["created_at"]
                }
                messages.append(message)
        
        return messages
    
    async def create_job(self, job_type: str, data: Dict = None) -> str:
        """Create a background job."""
        job_id = str(uuid.uuid4())
        now = datetime.utcnow()
        data_json = json.dumps(data) if data else None
        
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT INTO jobs (id, type, status, data, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (job_id, job_type, "pending", data_json, now, now))
            await db.commit()
        
        return job_id
    
    async def update_job_status(self, job_id: str, status: str, error: str = None):
        """Update job status."""
        now = datetime.utcnow()
        completed_at = now if status == "completed" else None
        
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                UPDATE jobs 
                SET status = ?, error = ?, updated_at = ?, completed_at = ?
                WHERE id = ?
            """, (status, error, now, completed_at, job_id))
            await db.commit()
