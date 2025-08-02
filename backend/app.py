from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import subprocess
import tempfile
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

@app.route('/api/transcribe', methods=['POST'])
def transcribe_audio():
    """Transcribe audio using Whisper"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        
        # Save audio to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
            audio_file.save(temp_audio.name)
            
            # Run Whisper transcription
            # Note: This requires whisper to be installed: pip install openai-whisper
            result = subprocess.run([
                'whisper', temp_audio.name, 
                '--model', 'base', 
                '--output_format', 'json',
                '--output_dir', tempfile.gettempdir()
            ], capture_output=True, text=True)
            
            if result.returncode != 0:
                return jsonify({'error': 'Transcription failed'}), 500
            
            # Read transcription result
            base_name = os.path.splitext(os.path.basename(temp_audio.name))[0]
            json_file = os.path.join(tempfile.gettempdir(), f"{base_name}.json")
            
            with open(json_file, 'r') as f:
                transcription_data = json.load(f)
            
            # Cleanup
            os.unlink(temp_audio.name)
            os.unlink(json_file)
            
            return jsonify({
                'transcription': transcription_data['text'],
                'segments': transcription_data.get('segments', [])
            })
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-notes', methods=['POST'])
def generate_notes():
    """Generate clinical notes using Ollama"""
    try:
        data = request.json
        transcription = data.get('transcription', '')
        
        if not transcription:
            return jsonify({'error': 'No transcription provided'}), 400
        
        # Prepare prompts for Ollama
        doctor_prompt = f"""
You are a medical AI assistant. Based on the following medical consultation transcription, generate a structured clinical note in SOAP format:

Transcription:
{transcription}

Please provide:
1. Subjective: Patient's reported symptoms and concerns
2. Objective: Physical findings and observations
3. Assessment: Medical diagnosis or impression
4. Plan: Treatment plan and follow-up instructions

Format as JSON with keys: subjective, objective, assessment, plan, medications (array), followUp
"""

        patient_prompt = f"""
Based on this medical consultation, create a simple, patient-friendly summary in plain language:

Transcription:
{transcription}

Provide:
1. A brief summary of what was discussed
2. Key points the patient should remember
3. Next steps in simple terms
4. Any medications in plain language

Avoid medical jargon. Make it easy to understand for a general audience.
Format as JSON with keys: summary, keyPoints (array), nextSteps (array), medications (array)
"""
        
        # Call Ollama for doctor notes
        doctor_result = subprocess.run([
            'curl', '-X', 'POST', 'http://localhost:11434/api/generate',
            '-H', 'Content-Type: application/json',
            '-d', json.dumps({
                'model': 'llama3.2',  # or whatever model you have
                'prompt': doctor_prompt,
                'stream': False
            })
        ], capture_output=True, text=True)
        
        # Call Ollama for patient summary
        patient_result = subprocess.run([
            'curl', '-X', 'POST', 'http://localhost:11434/api/generate',
            '-H', 'Content-Type: application/json',
            '-d', json.dumps({
                'model': 'llama3.2',
                'prompt': patient_prompt,
                'stream': False
            })
        ], capture_output=True, text=True)
        
        if doctor_result.returncode != 0 or patient_result.returncode != 0:
            return jsonify({'error': 'Failed to generate notes with Ollama'}), 500
        
        # Parse Ollama responses
        doctor_response = json.loads(doctor_result.stdout)
        patient_response = json.loads(patient_result.stdout)
        
        # Extract generated text and parse JSON
        try:
            doctor_notes = json.loads(doctor_response['response'])
            patient_summary = json.loads(patient_response['response'])
        except json.JSONDecodeError:
            # Fallback if LLM doesn't return valid JSON
            doctor_notes = {
                'subjective': 'Patient reports symptoms as transcribed',
                'objective': 'Physical examination findings noted',
                'assessment': 'Clinical assessment pending review',
                'plan': 'Treatment plan to be determined',
                'medications': [],
                'followUp': 'Follow-up as needed'
            }
            patient_summary = {
                'summary': 'Please refer to your clinical notes for details',
                'keyPoints': ['Consultation completed'],
                'nextSteps': ['Follow up with your healthcare provider'],
                'medications': []
            }
        
        return jsonify({
            'doctorNotes': doctor_notes,
            'patientSummary': patient_summary
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
