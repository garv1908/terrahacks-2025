# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# 🩺 Echo - AI-Generated Medical Notes Platform

A privacy-first web application that transcribes and summarizes doctor-patient conversations into structured clinical notes, featuring distinct doctor and patient views.

## ✨ Features

- **🎙️ Local Audio Recording**: Browser-based audio capture with real-time duration tracking
- **🔒 Privacy-First**: All AI processing (Whisper + Ollama) runs locally
- **👩‍⚕️ Doctor View**: Structured SOAP format clinical notes with review/edit capabilities
- **👤 Patient View**: Simplified, jargon-free summaries with consent-based sharing
- **📝 Consent Management**: Digital consent workflow for recording and summary sharing
- **🎨 Mobile-Responsive**: Clean, modern UI that works on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Flask (Python)
- **AI Models**: Whisper (transcription) + Ollama (summarization)
- **Storage**: Local storage (MVP) / JSON files
- **Icons**: Lucide React

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v18+)
2. **Python** (v3.8+)
3. **Ollama** - [Install from ollama.ai](https://ollama.ai)
4. **FFmpeg** (for Whisper audio processing)

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173/`

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Start Flask server
python app.py
```

The API will be available at `http://localhost:5000/`

### AI Models Setup

1. **Install Ollama**: Download from [ollama.ai](https://ollama.ai)

2. **Pull a language model**:
   ```bash
   ollama pull llama3.2  # or another model of your choice
   ```

3. **Install Whisper**:
   ```bash
   pip install openai-whisper
   ```

## 📱 User Flow

### Doctor Workflow
1. **Login** → Doctor dashboard
2. **New Session** → Patient consent form
3. **Recording** → Real-time audio capture
4. **Processing** → Whisper transcription + Ollama summarization
5. **Review** → Edit SOAP notes and patient summary
6. **Share** → Generate secure patient link

### Patient Workflow
1. **Access Link** → Patient summary view
2. **Review** → Easy-to-read consultation summary
3. **Feedback** → Optional satisfaction feedback

## 🏗️ Project Structure

```
terrahacks-2025/
├── src/
│   ├── components/
│   │   ├── DoctorDashboard.tsx    # Doctor's main interface
│   │   ├── ConsentForm.tsx        # Patient consent workflow
│   │   ├── RecordingSession.tsx   # Audio recording interface
│   │   └── PatientView.tsx        # Patient summary display
│   ├── hooks/
│   │   └── useAudioRecorder.ts    # Audio recording custom hook
│   ├── services/
│   │   └── api.ts                 # Backend API integration
│   ├── types/
│   │   └── index.ts               # TypeScript interfaces
│   └── App.tsx                    # Main app component
├── backend/
│   ├── app.py                     # Flask API server
│   └── requirements.txt           # Python dependencies
└── README.md
```

## 🎯 Demo Script

1. **Role Selection**: Choose "Doctor Login"
2. **Consent Form**: Fill patient information and consent checkboxes
3. **Recording**: Start/stop audio recording (mock or real)
4. **AI Processing**: Watch Whisper + Ollama generate notes
5. **Review**: Show structured doctor notes
6. **Patient View**: Switch to patient-friendly summary
7. **Privacy**: Highlight local processing and consent features

## 🚫 Current Limitations (MVP)

- No persistent database (uses localStorage)
- Mock authentication system
- No real-time speaker diarization
- No EMR integration
- Not HIPAA-compliant (demo purposes)

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000/api
OLLAMA_HOST=http://localhost:11434
```

## 🎨 Design System

- **Primary Colors**: Medical blue (#0891b2) and standard blue (#3b82f6)
- **Typography**: System fonts with clear hierarchy
- **Components**: Glass-morphism effects and smooth transitions
- **Mobile-first**: Responsive design for all screen sizes

## 📄 License

This project is for demonstration purposes only. Not intended for production medical use.

## 🤝 Contributing

This is a hackathon project. Feel free to fork and improve!

---

**Built for TerraHacks 2025** 🌍

## 🤖 **API Integration Complete!**

The RecordingSession component now makes real API calls to the Flask backend:

- **✅ Automatic Backend Detection**: Checks if Flask server is running
- **✅ Real AI Processing**: Uses Whisper + Ollama when available  
- **✅ Graceful Fallback**: Mock data when backend offline
- **✅ Status Indicators**: Visual feedback for backend connection

### **Quick Start with Real AI:**

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend (Windows)
start-backend.bat

# Or Linux/Mac:
./start-backend.sh
```

The app automatically switches from demo mode to real AI processing! 🚀

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
