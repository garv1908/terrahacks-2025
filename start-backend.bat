@echo off
REM Echo Backend Startup Script for Windows

echo 🩺 Starting Echo Backend...

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

REM Navigate to backend directory
cd backend

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate

REM Install requirements
echo 📚 Installing dependencies...
pip install -r requirements.txt

REM Check if Ollama is running
echo 🤖 Checking Ollama status...
curl -s http://localhost:11434/api/version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Ollama is not running. Please start Ollama and pull a model:
    echo    1. Install Ollama from https://ollama.ai
    echo    2. Run: ollama pull llama3.2
    echo    3. Ollama should be running on localhost:11434
    echo.
    echo 🚀 Starting Flask server anyway (will use fallback for AI processing)...
) else (
    echo ✅ Ollama is running!
)

REM Start Flask app
echo 🚀 Starting Flask server on http://localhost:5000
python app.py

pause
