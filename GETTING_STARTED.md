# Getting Started with PDF-QA RAG Application

Welcome to your comprehensive PDF Question-Answering application built with RAG (Retrieval-Augmented Generation)! This guide will help you get up and running quickly.

## 🎯 What You've Built

A complete, production-ready PDF-QA system with:

- **FastAPI Backend** with streaming responses
- **React/Next.js Frontend** with modern UI
- **RAG Pipeline** using LangChain + OpenAI
- **Chroma Vector Database** for embeddings
- **JWT Authentication** with user management
- **Real-time Chat Interface** with citations
- **Document Management** with upload/delete
- **Streaming Responses** for better UX
- **Docker Support** for easy deployment

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- OpenAI API key
- (Optional) Docker for containerized deployment

### Option 1: Manual Setup

1. **Clone and Setup**
   ```bash
   # If using the setup script (Linux/Mac):
   ./setup.sh
   
   # Or manually:
   cp env.example .env
   # Edit .env and add your OpenAI API key
   ```

2. **Start Backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```

3. **Start Frontend** (in new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/docs

### Option 2: Docker Setup

```bash
# Set your OpenAI API key in .env file
cp env.example .env
# Edit .env file

# Start all services
docker-compose up --build
```

## 🔑 Default Credentials

For testing, use these default credentials:
- **Email**: admin@example.com
- **Password**: admin123

## 📋 Basic Usage Flow

1. **Sign In** with the default credentials
2. **Upload PDFs** via the Documents page
3. **Wait for Processing** (status changes to "Ready")
4. **Start Chatting** - ask questions about your documents
5. **Get Answers** with citations back to source pages

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   React UI      │◄──►│   FastAPI      │◄──►│   Chroma DB     │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │                 │
                       │   OpenAI API    │
                       │                 │
                       └─────────────────┘
```

### Data Flow

1. **Upload**: PDF → Text Extraction → Chunking → Embeddings → Vector Store
2. **Query**: Question → Retrieval → LLM + Context → Streaming Response → UI

## 📁 Project Structure

```
pdf-qa-app/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main application
│   ├── config.py           # Configuration
│   ├── models.py           # Data models
│   ├── auth.py             # Authentication
│   ├── database.py         # Database operations
│   ├── pdf_processor.py    # PDF processing
│   ├── rag_chain.py        # RAG implementation
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── pages/          # Next.js pages
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/           # Utilities
│   │   └── types/         # TypeScript types
│   └── package.json       # Node dependencies
├── docker-compose.yml      # Docker configuration
├── setup.sh               # Setup script
└── README.md              # Main documentation
```

## ⚙️ Configuration

### Environment Variables

Key variables in `.env`:

```bash
# Required
OPENAI_API_KEY=your_api_key_here

# Optional (have defaults)
SECRET_KEY=your_jwt_secret
LLM_MODEL=gpt-3.5-turbo
EMBEDDING_MODEL=text-embedding-3-large
CHUNK_SIZE=1200
CHUNK_OVERLAP=200
MAX_FILE_SIZE_MB=100
```

## 🎨 Key Features Explained

### 1. Document Processing
- **PDF Upload**: Drag & drop interface with progress tracking
- **Text Extraction**: Uses PyPDF2 for text extraction
- **Chunking**: RecursiveCharacterTextSplitter with overlaps
- **Embeddings**: OpenAI text-embedding-3-large
- **Storage**: Chroma vector database with metadata

### 2. RAG Pipeline
- **Retrieval**: MMR (Maximum Marginal Relevance) search
- **Context**: Top-k relevant chunks with metadata
- **Generation**: OpenAI GPT models with structured prompts
- **Citations**: Automatic citation generation with page numbers

### 3. Streaming Chat
- **Real-time**: Server-sent events for token streaming
- **Citations**: Live citation display during response
- **Context**: Multi-document search with filtering
- **History**: Conversation persistence

### 4. Authentication
- **JWT Tokens**: Secure authentication with refresh
- **User Roles**: Admin/User role support
- **Session Management**: Automatic token refresh
- **Security**: CORS, input validation, rate limiting

## 🔧 Customization

### Adding New Document Types

1. Extend `pdf_processor.py` to handle other formats
2. Update upload validation in frontend
3. Add new MIME types to configuration

### Changing LLM Models

Update `.env`:
```bash
LLM_MODEL=gpt-4-turbo-preview
EMBEDDING_MODEL=text-embedding-3-small
```

### UI Customization

- Modify `tailwind.config.js` for theming
- Update components in `frontend/src/components/`
- Customize styling in `frontend/styles/globals.css`

## 📊 Monitoring & Debugging

### Backend Logs
```bash
# View backend logs
cd backend && tail -f app.log
```

### Frontend Logs
```bash
# View browser console for frontend errors
# Check network tab for API calls
```

### Vector Database
```bash
# Check Chroma collections
curl http://localhost:8000/health
```

## 🚨 Troubleshooting

### Common Issues

1. **OpenAI API Errors**
   - Check API key validity
   - Verify billing/usage limits
   - Check model availability

2. **Upload Failures**
   - Verify file size < 100MB
   - Check PDF format validity
   - Ensure sufficient disk space

3. **No Search Results**
   - Verify documents are in "ready" status
   - Check vector database persistence
   - Review embedding model compatibility

4. **Frontend Connection Issues**
   - Verify backend is running on port 8000
   - Check CORS configuration
   - Review proxy settings in Next.js config

### Performance Tips

1. **For Large Documents**
   - Reduce chunk size for better granularity
   - Increase retrieval k for more context
   - Consider hybrid search for better recall

2. **For Better Accuracy**
   - Use GPT-4 for complex questions
   - Enable contextual compression
   - Add reranking for top results

## 📈 Next Steps

### Production Deployment

1. **Security**
   - Use environment secrets manager
   - Enable HTTPS/TLS
   - Add rate limiting middleware
   - Implement proper CORS policies

2. **Scalability**
   - Use managed vector database (Pinecone/Qdrant Cloud)
   - Add Redis for caching
   - Implement load balancing
   - Use object storage (S3) for files

3. **Monitoring**
   - Add logging infrastructure
   - Set up error tracking (Sentry)
   - Implement health checks
   - Monitor costs and usage

### Feature Enhancements

1. **Document Support**
   - Add OCR for scanned PDFs
   - Support Word/PowerPoint/Excel
   - Handle tables and images
   - Multi-language support

2. **Advanced RAG**
   - Hybrid search (sparse + dense)
   - Contextual compression
   - Multi-query retrieval
   - Agent-based workflows

3. **Collaboration**
   - Multi-tenant architecture
   - Team workspaces
   - Document sharing
   - Real-time collaboration

## 🆘 Support

- **Documentation**: Check README.md for detailed setup
- **Issues**: Create GitHub issues for bugs
- **Community**: Join discussions for feature requests
- **Professional**: Contact for enterprise support

---

**Happy coding! 🚀** Your PDF-QA application is ready to handle document analysis at scale. Start by uploading your first PDF and asking questions!
