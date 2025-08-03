#!/bin/bash

# EchoNotes Backend Startup Script

echo "Starting backend..."


# Navigate to backend directory
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source "venv\Scripts\activate"

# Install requirements
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Check if Ollama is running
echo "🤖 Checking Ollama status..."
if ! curl -s http://localhost:11434/api/version > /dev/null; then
    # echo "⚠️  Ollama is not running. Please start Ollama and pull a model:"
    # echo "   1. Install Ollama from https://ollama.ai"
    # echo "   2. Run: ollama pull llama3.2"
    # echo "   3. Ollama should be running on localhost:11434"
    echo "Starting Ollama on llama3:8b"
    ollama run llama3:8b
    echo "Ollama started"
    echo "🚀 Starting Flask server anyway (will use fallback for AI processing)..."
else
    echo "✅ Ollama is running!"
fi

cd ..

if ! curl -s http://localhost:5173 > /dev/null; then
    echo "Starting Vite dev server..."
    npm run dev
else
    echo "Vite dev server is already running."
fi

npm run dev

cd backend

# Start Flask app
echo "🚀 Starting Flask server on http://localhost:5000"
python app.py
