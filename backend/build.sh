#!/bin/bash
# Build script for Render deployment

echo "🚀 Installing Python dependencies..."
pip install -r requirements.txt

echo "📁 Creating necessary directories..."
mkdir -p uploads
mkdir -p chroma_db

echo "✅ Build completed successfully!"
