#!/bin/bash

# PDF-QA with RAG Setup Script

echo "🚀 Setting up PDF-QA with RAG application..."

# Check if required tools are installed
check_requirements() {
    echo "📋 Checking requirements..."
    
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python 3 is required but not installed."
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is required but not installed."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is required but not installed."
        exit 1
    fi
    
    echo "✅ All requirements satisfied!"
}

# Setup environment variables
setup_env() {
    echo "🔧 Setting up environment variables..."
    
    if [ ! -f .env ]; then
        cp env.example .env
        echo "📝 Created .env file from template"
        echo "⚠️  Please edit .env and add your OpenAI API key!"
    else
        echo "✅ .env file already exists"
    fi
}

# Setup backend
setup_backend() {
    echo "🐍 Setting up backend..."
    
    cd backend
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        echo "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install requirements
    echo "Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # Create necessary directories
    mkdir -p uploads chroma_db
    
    echo "✅ Backend setup complete!"
    
    cd ..
}

# Setup frontend
setup_frontend() {
    echo "⚛️ Setting up frontend..."
    
    cd frontend
    
    # Install dependencies
    echo "Installing Node.js dependencies..."
    npm install
    
    echo "✅ Frontend setup complete!"
    
    cd ..
}

# Run the setup
main() {
    check_requirements
    setup_env
    setup_backend
    setup_frontend
    
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Edit the .env file and add your OpenAI API key"
    echo "2. Start the backend:"
    echo "   cd backend && source venv/bin/activate && uvicorn main:app --reload"
    echo "3. In a new terminal, start the frontend:"
    echo "   cd frontend && npm run dev"
    echo "4. Open http://localhost:3000 in your browser"
    echo ""
    echo "📚 Documentation: See README.md for more details"
    echo "🐛 Issues: Report at https://github.com/your-repo/issues"
}

main "$@"
