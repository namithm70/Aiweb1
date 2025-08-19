"""
RAG (Retrieval-Augmented Generation) chain for question answering.
"""

import os
import json
import logging
import time
from typing import List, Dict, Any, Optional, AsyncGenerator
import asyncio

# LangChain imports
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.schema import Document
from langchain.prompts import ChatPromptTemplate
from langchain.schema.runnable import RunnablePassthrough, RunnableParallel
from langchain.schema.output_parser import StrOutputParser
from langchain.callbacks.base import AsyncCallbackHandler

from models import DocumentChunk, Citation, StreamChunk, ChatResponse


logger = logging.getLogger(__name__)


class StreamingCallbackHandler(AsyncCallbackHandler):
    """Callback handler for streaming LLM responses."""
    
    def __init__(self):
        self.tokens = []
        self.current_token = ""
    
    async def on_llm_new_token(self, token: str, **kwargs) -> None:
        """Handle new token from LLM."""
        self.current_token = token
        self.tokens.append(token)


class RAGChain:
    """Handles retrieval-augmented generation for document Q&A."""
    
    def __init__(self, settings):
        self.settings = settings
        self.embeddings = None
        self.vector_store = None
        self.llm = None
        self.retriever = None
        self.chain = None
        
        # System prompt for the LLM
        self.system_prompt = """You are a helpful AI assistant that answers questions based solely on the provided context from PDF documents.

IMPORTANT RULES:
1. Only answer using information from the provided context
2. If the answer isn't in the context, say "I don't have enough information to answer that question."
3. Always include citations in your answer using the format [S1], [S2], etc. for each source
4. Be concise but thorough
5. If multiple sources contain relevant information, cite all of them
6. Do not make up information or use knowledge outside the provided context

Context:
{context}

Question: {question}

Answer:"""
    
    async def initialize(self):
        """Initialize the RAG chain components."""
        try:
            logger.info("Initializing RAG chain...")
            
            # Validate OpenAI API key
            if not self.settings.OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY is required")
            
            # Initialize embeddings
            self.embeddings = OpenAIEmbeddings(
                model=self.settings.EMBEDDING_MODEL,
                openai_api_key=self.settings.OPENAI_API_KEY
            )
            
            # Initialize vector store
            self.vector_store = Chroma(
                persist_directory=self.settings.VECTOR_DB_PERSIST_DIR,
                embedding_function=self.embeddings
            )
            
            # Initialize LLM
            self.llm = ChatOpenAI(
                model=self.settings.LLM_MODEL,
                openai_api_key=self.settings.OPENAI_API_KEY,
                temperature=0.1,
                streaming=True
            )
            
            # Initialize retriever
            self.retriever = self.vector_store.as_retriever(
                search_type="mmr",
                search_kwargs={
                    "k": self.settings.RETRIEVAL_K,
                    "fetch_k": 20
                }
            )
            
            # Create the RAG chain
            self._create_chain()
            
            logger.info("RAG chain initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing RAG chain: {e}")
            raise
    
    def _create_chain(self):
        """Create the RAG chain using LangChain LCEL."""
        prompt = ChatPromptTemplate.from_template(self.system_prompt)
        
        # Create the chain
        self.chain = (
            RunnableParallel({
                "context": self.retriever | self._format_docs,
                "question": RunnablePassthrough()
            })
            | prompt
            | self.llm
            | StrOutputParser()
        )
    
    def _format_docs(self, docs: List[Document]) -> str:
        """Format retrieved documents for the prompt."""
        formatted_docs = []
        for i, doc in enumerate(docs, 1):
            metadata = doc.metadata
            page = metadata.get('page', 'Unknown')
            source = f"[S{i}] (Page {page})"
            formatted_docs.append(f"{source}: {doc.page_content}")
        
        return "\n\n".join(formatted_docs)
    
    async def add_document_chunks(
        self, 
        chunks: List[DocumentChunk], 
        doc_id: str, 
        user_id: str
    ):
        """Add document chunks to the vector store."""
        try:
            logger.info(f"Adding {len(chunks)} chunks to vector store for doc {doc_id}")
            
            documents = []
            metadatas = []
            ids = []
            
            for chunk in chunks:
                # Create LangChain Document
                doc = Document(
                    page_content=chunk.text,
                    metadata={
                        "doc_id": doc_id,
                        "user_id": user_id,
                        "page": chunk.page,
                        "char_start": chunk.metadata.char_start,
                        "char_end": chunk.metadata.char_end,
                        "source": chunk.metadata.source,
                        "chunk_id": chunk.id
                    }
                )
                
                documents.append(doc)
                metadatas.append(doc.metadata)
                ids.append(chunk.id)
            
            # Add to vector store
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.vector_store.add_documents(
                    documents=documents,
                    metadatas=metadatas,
                    ids=ids
                )
            )
            
            logger.info(f"Successfully added {len(chunks)} chunks to vector store")
            
        except Exception as e:
            logger.error(f"Error adding chunks to vector store: {e}")
            raise
    
    async def delete_document(self, doc_id: str, user_id: str):
        """Delete all chunks for a document from vector store."""
        try:
            logger.info(f"Deleting document {doc_id} from vector store")
            
            # Get all chunk IDs for this document
            # Note: Chroma doesn't have a direct way to delete by metadata filter
            # So we need to query first, then delete by IDs
            results = self.vector_store.similarity_search(
                query="",  # Empty query to get all
                k=10000,  # Large number to get all chunks
                filter={"doc_id": doc_id, "user_id": user_id}
            )
            
            if results:
                chunk_ids = [doc.metadata["chunk_id"] for doc in results]
                await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: self.vector_store.delete(ids=chunk_ids)
                )
                
                logger.info(f"Deleted {len(chunk_ids)} chunks for document {doc_id}")
            
        except Exception as e:
            logger.error(f"Error deleting document from vector store: {e}")
            raise
    
    async def ask_question(
        self,
        question: str,
        user_id: str,
        doc_ids: Optional[List[str]] = None,
        k: int = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Ask a question and stream the response with citations.
        
        Args:
            question: The question to ask
            user_id: User ID for access control
            doc_ids: Optional list of document IDs to restrict search
            k: Number of documents to retrieve (default from settings)
            
        Yields:
            Stream chunks with tokens and final response with citations
        """
        start_time = time.time()
        
        try:
            # Set up retrieval parameters
            if k is None:
                k = self.settings.RETRIEVAL_K
            
            # Create retriever with user-specific filter
            retriever_kwargs = {
                "k": k,
                "fetch_k": k * 3
            }
            
            # Add document filters if specified
            if doc_ids:
                retriever_kwargs["filter"] = {
                    "user_id": user_id,
                    "doc_id": {"$in": doc_ids}
                }
            else:
                retriever_kwargs["filter"] = {"user_id": user_id}
            
            # Update retriever
            retriever = self.vector_store.as_retriever(
                search_type="mmr",
                search_kwargs=retriever_kwargs
            )
            
            # Retrieve relevant documents
            logger.info(f"Retrieving documents for question: {question[:50]}...")
            relevant_docs = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: retriever.get_relevant_documents(question)
            )
            
            if not relevant_docs:
                yield {
                    "type": "complete",
                    "final_response": {
                        "answer": "I don't have any relevant documents to answer your question. Please upload some PDF documents first.",
                        "citations": [],
                        "latency_ms": int((time.time() - start_time) * 1000)
                    }
                }
                return
            
            # Format context and create citations
            context = self._format_docs(relevant_docs)
            citations = self._create_citations(relevant_docs)
            
            # Yield citations first
            for citation in citations:
                yield {
                    "type": "citation",
                    "citation": citation.dict()
                }
            
            # Stream LLM response
            streaming_handler = StreamingCallbackHandler()
            
            # Create temporary chain for this request
            prompt = ChatPromptTemplate.from_template(self.system_prompt)
            llm_with_callbacks = self.llm.with_config(
                {"callbacks": [streaming_handler]}
            )
            
            temp_chain = (
                RunnableParallel({
                    "context": lambda x: context,
                    "question": RunnablePassthrough()
                })
                | prompt
                | llm_with_callbacks
                | StrOutputParser()
            )
            
            # Generate response
            full_response = ""
            async for chunk in temp_chain.astream(question):
                if chunk:
                    full_response += chunk
                    yield {
                        "type": "token",
                        "content": chunk
                    }
            
            # Final response
            latency_ms = int((time.time() - start_time) * 1000)
            
            yield {
                "type": "complete",
                "final_response": {
                    "answer": full_response,
                    "citations": [c.dict() for c in citations],
                    "latency_ms": latency_ms,
                    "usage": {
                        "retrieved_docs": len(relevant_docs),
                        "total_tokens": len(full_response.split())  # Rough estimate
                    }
                }
            }
            
            logger.info(f"Question answered in {latency_ms}ms with {len(citations)} citations")
            
        except Exception as e:
            logger.error(f"Error in ask_question: {e}")
            yield {
                "type": "error",
                "error": str(e)
            }
    
    def _create_citations(self, docs: List[Document]) -> List[Citation]:
        """Create citation objects from retrieved documents."""
        citations = []
        
        for i, doc in enumerate(docs, 1):
            metadata = doc.metadata
            
            citation = Citation(
                doc_id=metadata.get("doc_id", ""),
                doc_name=f"Document {metadata.get('doc_id', 'Unknown')[:8]}",  # Truncated doc ID
                page=metadata.get("page", 0),
                score=0.85,  # Placeholder - Chroma doesn't return scores directly
                excerpt=doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                char_start=metadata.get("char_start"),
                char_end=metadata.get("char_end")
            )
            
            citations.append(citation)
        
        return citations
    
    async def get_document_summary(self, doc_id: str, user_id: str) -> str:
        """Get a summary of a document by asking about its main topics."""
        try:
            summary_question = "What are the main topics and key points covered in this document?"
            
            full_response = ""
            async for chunk in self.ask_question(
                question=summary_question,
                user_id=user_id,
                doc_ids=[doc_id],
                k=10
            ):
                if chunk.get("type") == "token":
                    full_response += chunk.get("content", "")
                elif chunk.get("type") == "complete":
                    return chunk.get("final_response", {}).get("answer", "")
            
            return full_response
            
        except Exception as e:
            logger.error(f"Error generating document summary: {e}")
            return "Unable to generate summary"
    
    async def health_check(self) -> Dict[str, Any]:
        """Check the health of RAG components."""
        try:
            # Test embeddings
            test_embed = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.embeddings.embed_query("test query")
            )
            
            # Test vector store
            collection_count = self.vector_store._collection.count()
            
            # Test LLM
            test_response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.llm.predict("Hello")
            )
            
            return {
                "status": "healthy",
                "embeddings": "working",
                "vector_store": f"working ({collection_count} documents)",
                "llm": "working"
            }
            
        except Exception as e:
            logger.error(f"RAG health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e)
            }
