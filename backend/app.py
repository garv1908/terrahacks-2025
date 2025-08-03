from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import subprocess
import tempfile
import json
from datetime import datetime
import whisper
import librosa
import soundfile as sf
import numpy as np

app = Flask(__name__)
CORS(app)

# Load Whisper model once at startup
print("Loading Whisper model...")
whisper_model = whisper.load_model("base")
# whisper_model = whisper.load_model("tiny")
print("Whisper model loaded successfully")

@app.route('/api/transcribe', methods=['POST'])
def transcribe_audio():
    """Transcribe audio using Whisper"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        
        # Determine file extension from filename or default to webm
        if audio_file.filename and '.' in audio_file.filename:
            file_extension = os.path.splitext(audio_file.filename)[1]
        else:
            file_extension = '.webm'  # Default for browser recordings
            
        print(f"Received audio file: {audio_file.filename}, extension: {file_extension}")
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_audio:
            audio_file.save(temp_audio.name)
            temp_file_path = temp_audio.name
            
        print(f"Saved audio to: {temp_file_path}")
        
        try:
            # Run Whisper transcription using Python library
            print(f"Running Whisper on: {temp_file_path}")
            
            # Verify file exists before transcription
            if not os.path.exists(temp_file_path):
                raise FileNotFoundError(f"Audio file not found: {temp_file_path}")
            
            # Load audio using librosa to ensure compatibility
            try:
                print("Loading audio with librosa...")
                audio_data, sample_rate = librosa.load(temp_file_path, sr=16000)  # Whisper prefers 16kHz
                print(f"Audio loaded: shape={audio_data.shape}, sr={sample_rate}")
                
                # Pass audio data directly to Whisper (no file needed)
                print("Transcribing audio data with Whisper...")
                result = whisper_model.transcribe(audio_data)
                
            except Exception as audio_error:
                print(f"Audio processing error: {audio_error}")
                # Fallback: try to create a simple WAV and use that
                try:
                    print("Creating simplified WAV file...")
                    audio_data, sample_rate = librosa.load(temp_file_path, sr=16000)
                    
                    # Create a simple WAV file that Whisper might handle better
                    simple_wav_path = temp_file_path.replace(file_extension, '_simple.wav')
                    sf.write(simple_wav_path, audio_data, sample_rate, subtype='PCM_16')
                    print(f"Simple WAV saved to: {simple_wav_path}")
                    
                    # Try transcribing the simplified WAV
                    result = whisper_model.transcribe(simple_wav_path)
                    
                    # Clean up the simple WAV
                    if os.path.exists(simple_wav_path):
                        os.unlink(simple_wav_path)
                        
                except Exception as fallback_error:
                    print(f"Fallback error: {fallback_error}")
                    return jsonify({'error': f'Audio processing failed: {str(fallback_error)}'}), 500
            
            transcription_text = result["text"].strip()
            segments = result.get("segments", [])
            
            print(f"Transcription successful: {transcription_text[:100]}...")
            
            return jsonify({
                'transcription': transcription_text,
                'segments': segments
            })
            
        except Exception as whisper_error:
            print(f"Whisper transcription error: {whisper_error}")
            return jsonify({'error': f'Transcription failed: {str(whisper_error)}'}), 500
        finally:
            # Cleanup - ensure file is deleted even if error occurs
            if os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                    print(f"Cleaned up temp file: {temp_file_path}")
                except OSError as e:
                    print(f"Failed to cleanup temp file: {e}")
            
    except Exception as e:
        print(f"Error in transcribe_audio: {str(e)}")
        import traceback
        traceback.print_exc()
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
        model = 'llama3.2'
        # Call Ollama for doctor notes
        doctor_result = subprocess.run([
            'curl', '-X', 'POST', 'http://localhost:11434/api/generate',
            '-H', 'Content-Type: application/json',
            '-d', json.dumps({
                'model': model,
                'prompt': doctor_prompt,
                'stream': False
            })
        ], capture_output=True, text=True)
        print(doctor_result.stdout)  # Debugging output 
        
        # Call Ollama for patient summary
        patient_result = subprocess.run([
            'curl', '-X', 'POST', 'http://localhost:11434/api/generate',
            '-H', 'Content-Type: application/json',
            '-d', json.dumps({
                'model': model,
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
