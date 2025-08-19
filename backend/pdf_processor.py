"""
PDF processing module for extracting and chunking text.
"""

import os
from typing import List, Dict, Any
from pathlib import Path
import logging

try:
    from PyPDF2 import PdfReader
except ImportError:
    try:
        from pypdf import PdfReader
    except ImportError:
        from pypdf2 import PdfFileReader as PdfReader

from langchain.text_splitter import RecursiveCharacterTextSplitter
from models import DocumentChunk, ChunkMetadata


logger = logging.getLogger(__name__)


class PDFProcessor:
    """Handles PDF text extraction and chunking."""
    
    def __init__(self, settings):
        self.settings = settings
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
    
    async def process_pdf(self, file_path: str, doc_id: str) -> List[DocumentChunk]:
        """
        Process a PDF file and return chunked text with metadata.
        
        Args:
            file_path: Path to the PDF file
            doc_id: Document ID for tracking
            
        Returns:
            List of DocumentChunk objects
        """
        try:
            logger.info(f"Processing PDF: {file_path}")
            
            # Verify file exists
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"PDF file not found: {file_path}")
            
            # Extract text from PDF
            pages_text = await self._extract_text_from_pdf(file_path)
            
            if not pages_text:
                raise ValueError("No text could be extracted from the PDF")
            
            # Create chunks with metadata
            chunks = await self._create_chunks_with_metadata(pages_text, doc_id)
            
            logger.info(f"Successfully processed PDF: {len(chunks)} chunks created")
            return chunks
            
        except Exception as e:
            logger.error(f"Error processing PDF {file_path}: {str(e)}")
            raise
    
    async def _extract_text_from_pdf(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Extract text from PDF pages.
        
        Returns:
            List of dictionaries with page number and text
        """
        pages_text = []
        
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PdfReader(file)
                
                for page_num, page in enumerate(pdf_reader.pages, 1):
                    try:
                        # Extract text from page
                        text = page.extract_text()
                        
                        # Clean up text
                        text = self._clean_text(text)
                        
                        if text.strip():  # Only add pages with text
                            pages_text.append({
                                'page': page_num,
                                'text': text,
                                'char_count': len(text)
                            })
                        
                    except Exception as e:
                        logger.warning(f"Error extracting text from page {page_num}: {e}")
                        continue
                
                logger.info(f"Extracted text from {len(pages_text)} pages")
                return pages_text
                
        except Exception as e:
            logger.error(f"Error reading PDF file {file_path}: {e}")
            raise
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize extracted text."""
        if not text:
            return ""
        
        # Remove excessive whitespace
        lines = []
        for line in text.split('\n'):
            line = line.strip()
            if line:
                lines.append(line)
        
        # Join lines with single newline
        cleaned_text = '\n'.join(lines)
        
        # Remove excessive spaces
        cleaned_text = ' '.join(cleaned_text.split())
        
        return cleaned_text
    
    async def _create_chunks_with_metadata(
        self, 
        pages_text: List[Dict[str, Any]], 
        doc_id: str
    ) -> List[DocumentChunk]:
        """
        Create text chunks with metadata.
        
        Args:
            pages_text: List of page text dictionaries
            doc_id: Document ID
            
        Returns:
            List of DocumentChunk objects with metadata
        """
        chunks = []
        chunk_id_counter = 1
        
        for page_data in pages_text:
            page_num = page_data['page']
            page_text = page_data['text']
            
            if not page_text.strip():
                continue
            
            # Split page text into chunks
            page_chunks = self.text_splitter.split_text(page_text)
            
            for chunk_text in page_chunks:
                if not chunk_text.strip():
                    continue
                
                # Find character positions (approximate)
                char_start = page_text.find(chunk_text[:50]) if len(chunk_text) >= 50 else 0
                char_end = char_start + len(chunk_text)
                
                # Create chunk metadata
                metadata = ChunkMetadata(
                    doc_id=doc_id,
                    user_id="",  # Will be set when storing
                    page=page_num,
                    char_start=char_start,
                    char_end=char_end,
                    source=f"page_{page_num}"
                )
                
                # Create document chunk
                chunk = DocumentChunk(
                    id=f"{doc_id}_chunk_{chunk_id_counter}",
                    doc_id=doc_id,
                    page=page_num,
                    text=chunk_text,
                    metadata=metadata
                )
                
                chunks.append(chunk)
                chunk_id_counter += 1
        
        logger.info(f"Created {len(chunks)} chunks from {len(pages_text)} pages")
        return chunks
    
    def get_document_stats(self, chunks: List[DocumentChunk]) -> Dict[str, Any]:
        """Get statistics about the processed document."""
        if not chunks:
            return {"pages": 0, "chunks": 0, "total_chars": 0}
        
        pages = set(chunk.page for chunk in chunks)
        total_chars = sum(len(chunk.text) for chunk in chunks)
        
        return {
            "pages": len(pages),
            "chunks": len(chunks),
            "total_chars": total_chars,
            "avg_chunk_size": total_chars // len(chunks) if chunks else 0
        }
    
    async def validate_pdf(self, file_path: str) -> bool:
        """
        Validate if a file is a readable PDF.
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            True if valid PDF, False otherwise
        """
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PdfReader(file)
                
                # Check if we can read at least one page
                if len(pdf_reader.pages) == 0:
                    return False
                
                # Try to extract text from first page
                first_page = pdf_reader.pages[0]
                text = first_page.extract_text()
                
                return True
                
        except Exception as e:
            logger.warning(f"PDF validation failed for {file_path}: {e}")
            return False
    
    async def get_pdf_info(self, file_path: str) -> Dict[str, Any]:
        """
        Get basic information about a PDF file.
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            Dictionary with PDF information
        """
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PdfReader(file)
                
                info = {
                    "pages": len(pdf_reader.pages),
                    "encrypted": pdf_reader.is_encrypted,
                    "metadata": {}
                }
                
                # Try to get metadata
                if hasattr(pdf_reader, 'metadata') and pdf_reader.metadata:
                    metadata = pdf_reader.metadata
                    info["metadata"] = {
                        "title": metadata.get("/Title", ""),
                        "author": metadata.get("/Author", ""),
                        "subject": metadata.get("/Subject", ""),
                        "creator": metadata.get("/Creator", ""),
                        "producer": metadata.get("/Producer", ""),
                        "creation_date": str(metadata.get("/CreationDate", "")),
                        "modification_date": str(metadata.get("/ModDate", ""))
                    }
                
                return info
                
        except Exception as e:
            logger.error(f"Error getting PDF info for {file_path}: {e}")
            return {"pages": 0, "encrypted": False, "metadata": {}}
    
    def estimate_processing_time(self, file_size_mb: float) -> int:
        """
        Estimate processing time in seconds based on file size.
        
        Args:
            file_size_mb: File size in megabytes
            
        Returns:
            Estimated processing time in seconds
        """
        # Rough estimate: ~10-30 seconds per MB depending on content
        base_time = 15  # seconds per MB
        return max(5, int(file_size_mb * base_time))
