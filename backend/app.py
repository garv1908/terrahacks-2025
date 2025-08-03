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
        
        # Prepare single prompt for Ollama to generate both doctor and patient notes
        combined_prompt = f"""Based on the medical consultation transcription below, generate BOTH clinical documentation and a patient summary.

Transcription: {transcription}

Respond with ONLY a JSON object in this exact format (no explanatory text, no markdown, no code blocks):

{{
  "doctorNotes": {{
    "subjective": "Patient's reported symptoms and concerns",
    "objective": "Physical findings and observations",
    "assessment": "Medical diagnosis or impression", 
    "plan": "Treatment plan and follow-up instructions",
    "medications": ["medication1", "medication2"],
    "followUp": "Follow-up instructions"
  }},
  "patientSummary": {{
    "summary": "Brief summary of what was discussed in simple terms",
    "keyPoints": ["key point 1", "key point 2", "key point 3"],
    "nextSteps": ["step 1", "step 2", "step 3"],
    "medications": ["medication 1 in plain language", "medication 2 in plain language"]
  }}
}}"""

        model = 'llama3.1:8b'  # Use the more reliable model  
        
        # Call Ollama for combined notes
        result = subprocess.run([
            'curl', '-X', 'POST', 'http://localhost:11434/api/generate',
            '-H', 'Content-Type: application/json',
            '-d', json.dumps({
                'model': model,
                'prompt': combined_prompt,
                'stream': False
            })
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            return jsonify({'error': 'Failed to generate notes with Ollama'}), 500
        
        # Parse Ollama response
        print("Combined result stdout:", result.stdout[:500])  # First 500 chars
        
        response = json.loads(result.stdout)
        print("Raw response content:", response.get('response', '')[:300])
        
        # Clean and parse the response
        def clean_and_parse_response(response_text):
            """Clean markdown artifacts and parse JSON from LLM response"""
            try:
                # First, remove any lines that contain ```
                lines = response_text.split('\n')
                cleaned_lines = [line for line in lines if '```' not in line]
                cleaned_text = '\n'.join(cleaned_lines)
                
                # Try direct JSON parsing on cleaned text
                try:
                    return json.loads(cleaned_text)
                except json.JSONDecodeError:
                    pass
                
                # Look for JSON within the cleaned text (find first { to last })
                start_idx = cleaned_text.find('{')
                if start_idx != -1:
                    # Find the matching closing brace
                    brace_count = 0
                    end_idx = start_idx
                    for i, char in enumerate(cleaned_text[start_idx:], start_idx):
                        if char == '{':
                            brace_count += 1
                        elif char == '}':
                            brace_count -= 1
                            if brace_count == 0:
                                end_idx = i + 1
                                break
                    
                    json_str = cleaned_text[start_idx:end_idx]
                    return json.loads(json_str)
                
                raise json.JSONDecodeError("No valid JSON found", response_text, 0)
                
            except Exception as e:
                print(f"Parsing error: {e}")
                raise
        
        try:
            raw_response = response['response']
            print(f"Parsing combined response: {raw_response[:100]}...")
            
            parsed_data = clean_and_parse_response(raw_response)
            
            doctor_notes = parsed_data.get('doctorNotes', {})
            patient_summary = parsed_data.get('patientSummary', {})
            
            print("✅ Successfully parsed combined JSON from LLM response")
            
        except (json.JSONDecodeError, KeyError) as json_error:
            print(f"❌ JSON parsing error: {json_error}")
            print(f"Raw response: {response.get('response', 'No response')[:300]}")
            
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
