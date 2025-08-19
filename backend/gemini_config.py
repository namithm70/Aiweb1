"""
Configuration for Gemini AI integration.
"""

import os
from typing import Optional

class GeminiConfig:
    """Configuration for Gemini AI."""
    
    def __init__(self):
        # Gemini API key
        self.GEMINI_API_KEY = "AIzaSyBlleLp9VP938yWNY_DIlwCbej6u2eQ_ZE"
        
        # Model settings
        self.GEMINI_MODEL = "gemini-pro"
        self.GEMINI_EMBEDDING_MODEL = "text-embedding-004"
        
        # RAG settings
        self.CHUNK_SIZE = 1200
        self.CHUNK_OVERLAP = 200
        self.RETRIEVAL_K = 6
        
        # File settings
        self.MAX_FILE_SIZE_MB = 100
        self.UPLOAD_DIR = "./uploads"
        
        # Security
        self.SECRET_KEY = "your_super_secret_jwt_key_here_minimum_32_characters_gemini"
    
    def validate(self):
        """Validate configuration."""
        if not self.GEMINI_API_KEY or self.GEMINI_API_KEY.startswith("your_"):
            raise ValueError("GEMINI_API_KEY must be set")
        return True
