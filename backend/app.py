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
from database import CSVDatabase

app = Flask(__name__)
CORS(app, origins='*', allow_headers=['Content-Type', 'Authorization'], methods=['GET', 'POST', 'OPTIONS'])

# Initialize CSV database
db = CSVDatabase()

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
            
            # Try direct Whisper transcription first (simpler approach)
            try:
                print("Direct Whisper transcription...")
                
                # Check file size and content
                file_size = os.path.getsize(temp_file_path)
                print(f"Audio file size: {file_size} bytes")
                
                if file_size == 0:
                    raise ValueError("Audio file is empty")
                
                result = whisper_model.transcribe(temp_file_path)
                
            except Exception as whisper_error:
                print(f"Direct Whisper error: {whisper_error}")
                
                # Use ffmpeg to convert to a format Whisper can definitely handle
                try:
                    print("Converting audio with ffmpeg...")
                    
                    # Create output path for converted file
                    converted_wav_path = temp_file_path.replace(file_extension, '_converted.wav')
                    
                    # Use ffmpeg to convert to 16kHz mono WAV
                    ffmpeg_cmd = [
                        'ffmpeg', '-y',  # -y to overwrite output file
                        '-i', temp_file_path,  # input file
                        '-ar', '16000',  # sample rate 16kHz
                        '-ac', '1',      # mono audio
                        '-c:a', 'pcm_s16le',  # 16-bit PCM encoding
                        converted_wav_path
                    ]
                    
                    print(f"Running ffmpeg command: {' '.join(ffmpeg_cmd)}")
                    result_ffmpeg = subprocess.run(ffmpeg_cmd, capture_output=True, text=True, check=True)
                    
                    print(f"ffmpeg conversion successful. Output: {converted_wav_path}")
                    
                    # Now try Whisper on the converted file
                    if os.path.exists(converted_wav_path):
                        converted_size = os.path.getsize(converted_wav_path)
                        print(f"Converted file size: {converted_size} bytes")
                        
                        result = whisper_model.transcribe(converted_wav_path)
                        
                        # Clean up converted file
                        os.unlink(converted_wav_path)
                        print(f"Cleaned up converted file: {converted_wav_path}")
                    else:
                        raise FileNotFoundError("Converted file was not created")
                        
                except subprocess.CalledProcessError as ffmpeg_error:
                    print(f"ffmpeg error: {ffmpeg_error}")
                    print(f"ffmpeg stderr: {ffmpeg_error.stderr}")
                    return jsonify({
                        'error': f'Audio conversion failed. Please check that your audio recording is valid.'
                    }), 500
                    
                except Exception as conversion_error:
                    print(f"Conversion error: {conversion_error}")
                    return jsonify({
                        'error': f'Unable to process audio file. Please try recording again with a different format.'
                    }), 500
            
            transcription_text = result["text"].strip()
            segments = result.get("segments", [])
            
            print(f"Transcription successful: {transcription_text}...")
            
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
        doctor_prompt = f"""You are a medical AI assistant. Based on the following medical consultation transcription, generate a structured clinical note in SOAP format.

Transcription:
{transcription}

Please provide a JSON response with the following structure. Return ONLY valid JSON, no other text:

{{
  "subjective": "Patient's reported symptoms and concerns",
  "objective": "Physical findings and observations", 
  "assessment": "Medical diagnosis or impression",
  "plan": "Treatment plan and follow-up instructions",
  "medications": ["medication1", "medication2"],
  "followUp": "Follow-up instructions"
}}"""

        patient_prompt = f"""Based on this medical consultation, create a simple, patient-friendly summary in plain language.

Transcription:
{transcription}

Provide a JSON response with the following structure. Return ONLY valid JSON, no other text:

{{
  "summary": "Brief summary of what was discussed in simple terms",
  "keyPoints": ["key point 1", "key point 2", "key point 3"],
  "nextSteps": ["step 1", "step 2", "step 3"],
  "medications": ["medication 1 in plain language", "medication 2 in plain language"]
}}"""
        model = 'llama3.1:8b'  # Use the more reliable model  
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
        print("Doctor result stdout:", doctor_result.stdout[:500])  # First 500 chars
        print("Patient result stdout:", patient_result.stdout[:500])
        
        doctor_response = json.loads(doctor_result.stdout)
        patient_response = json.loads(patient_result.stdout)
        
        print("Doctor response content:", doctor_response.get('response', '')[:200])
        print("Patient response content:", patient_response.get('response', '')[:200])
        
        # Extract generated text and parse JSON
        try:
            doctor_notes = json.loads(doctor_response['response'])
            patient_summary = json.loads(patient_response['response'])
            print("✅ Successfully parsed JSON from LLM responses")
        except json.JSONDecodeError as json_error:
            print(f"❌ JSON decode error: {json_error}")
            print(f"Raw doctor response: {doctor_response.get('response', 'No response')}")
            print(f"Raw patient response: {patient_response.get('response', 'No response')}")
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

@app.route('/api/recordings', methods=['POST'])
def save_recording():
    """Save a recording to the CSV database"""
    try:
        data = request.json
        success = db.save_recording(data)
        
        if success:
            return jsonify({'status': 'success', 'message': 'Recording saved successfully'})
        else:
            return jsonify({'status': 'error', 'message': 'Failed to save recording'}), 500
            
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/recordings/<recording_id>', methods=['GET'])
def get_recording(recording_id):
    """Get a specific recording by ID"""
    try:
        recording = db.get_recording(recording_id)
        
        if recording:
            return jsonify({'status': 'success', 'recording': recording})
        else:
            return jsonify({'status': 'error', 'message': 'Recording not found'}), 404
            
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/recordings', methods=['GET'])
def get_all_recordings():
    """Get all recordings from the database"""
    try:
        recordings = db.get_all_recordings()
        return jsonify({'status': 'success', 'recordings': recordings})
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/recordings/<recording_id>', methods=['DELETE'])
def delete_recording(recording_id):
    """Delete a recording from the database"""
    try:
        success = db.delete_recording(recording_id)
        
        if success:
            return jsonify({'status': 'success', 'message': 'Recording deleted successfully'})
        else:
            return jsonify({'status': 'error', 'message': 'Failed to delete recording'}), 500
            
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
