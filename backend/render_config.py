"""
Production configuration for Render deployment.
"""

import os
from typing import Optional

class RenderConfig:
    """Configuration for Render deployment."""
    
    def __init__(self):
        # Gemini API key from environment
        self.GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
        
        # Model settings
        self.GEMINI_MODEL = "gemini-pro"
        self.GEMINI_EMBEDDING_MODEL = "text-embedding-004"
        
        # RAG settings
        self.CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1200"))
        self.CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "200"))
        self.RETRIEVAL_K = int(os.getenv("RETRIEVAL_K", "6"))
        
        # File settings
        self.MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "50"))
        self.UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/opt/render/project/src/uploads")
        
        # Security
        self.SECRET_KEY = os.getenv("SECRET_KEY", "your_super_secret_jwt_key_here_minimum_32_characters")
        
        # Server settings
        self.DEBUG = os.getenv("DEBUG", "false").lower() == "true"
        self.LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
        
        # CORS settings for production
        self.CORS_ORIGINS = [
            "https://pdf-qa-frontend-xxxx.vercel.app",  # Replace with your Vercel URL
            "http://localhost:3000",  # For development
            "http://127.0.0.1:3000"
        ]
    
    def validate(self):
        """Validate configuration."""
        if not self.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        if len(self.SECRET_KEY) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        
        return True
