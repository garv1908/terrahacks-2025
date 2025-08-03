import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Loader, FileText, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import type { Recording, AudioRecorderState } from '../types';
import { apiService } from '../services/api';

const RecordingSession: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<number | null>(null);

  const [recorderState, setRecorderState] = useState<AudioRecorderState>({
    isRecording: false,
    duration: 0,
    audioBlob: null,
    error: null,
  });

  const [processing, setProcessing] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    // Check if consent exists
    const consentData = localStorage.getItem(`consent-${sessionId}`);
    if (!consentData) {
      navigate('/consent');
    }

    // Check backend status
    checkBackendStatus();
  }, [sessionId, navigate]);

  const checkBackendStatus = async () => {
    try {
      await apiService.healthCheck();
      setBackendStatus('online');
    } catch (error) {
      setBackendStatus('offline');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Try to use webm format with opus codec, fallback to wav
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/wav';
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        console.log(`Audio recorded: ${audioBlob.size} bytes, type: ${mimeType}`);
        setRecorderState(prev => ({ ...prev, audioBlob, isRecording: false }));
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setRecorderState(prev => ({ ...prev, isRecording: true, error: null }));

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecorderState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);

    } catch (error) {
      console.error('Microphone access error:', error);
      setRecorderState(prev => ({ 
        ...prev, 
        error: 'Failed to access microphone. Please check permissions.' 
      }));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recorderState.isRecording) {
      mediaRecorderRef.current.stop();
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const processRecording = async () => {
    if (!recorderState.audioBlob || !sessionId) return;

    setProcessing(true);

    try {
      // Get consent data
      console.log('Fetching consent data...');
      if (!localStorage.getItem(`consent-${sessionId}`)) {
        console.log('No consent data found, stopping processing...');
        return;
      }
      const consentData = JSON.parse(localStorage.getItem(`consent-${sessionId}`) || '{}');
      
      let transcription: string;
      let doctorNotes: any;
      let patientSummary: any;

      console.log('Processing recording...');
      console.log('Consent Data:', consentData);
      if (backendStatus === 'online') {
        // Use real API
        console.log('Transcribing audio...');
        const transcriptionResponse = await apiService.transcribeAudio(recorderState.audioBlob);
        transcription = transcriptionResponse.transcription;
        
        console.log('Generating clinical notes...');
        const notesResponse = await apiService.generateNotes(transcription);
        doctorNotes = notesResponse.doctorNotes;
        patientSummary = notesResponse.patientSummary;
      } else {
        // Fallback to mock data
        console.log('Using mock data (backend offline)');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
        
        transcription = `Patient presents with chief complaint of persistent headaches lasting 3 weeks. Reports throbbing pain, primarily frontal and temporal regions. Pain rated 7/10, worse in mornings. Associated symptoms include mild nausea, occasional photophobia. No recent trauma, fever, or neurological deficits noted. Patient has been taking over-the-counter ibuprofen with minimal relief.

Physical examination reveals normal vital signs. Neurological examination within normal limits. No focal deficits observed. Fundoscopic examination unremarkable.

Assessment: Tension-type headaches, possibly with mild migraine features. No red flags for secondary headache.

Plan: 
1. Recommend stress management techniques
2. Prescribe sumatriptan 50mg as needed for severe episodes
3. Continue ibuprofen 400mg every 6 hours as needed
4. Follow up in 2 weeks if symptoms persist
5. Return immediately if severe headache, fever, or neurological symptoms develop`;

        doctorNotes = {
          subjective: 'Patient reports persistent headaches for 3 weeks, throbbing pain rated 7/10, worse in mornings, associated with mild nausea and photophobia.',
          objective: 'Vital signs stable. Neurological exam normal. No focal deficits. Fundoscopic exam unremarkable.',
          assessment: 'Tension-type headaches with possible migraine features. No red flags for secondary headache.',
          plan: 'Stress management, sumatriptan 50mg PRN, ibuprofen 400mg q6h PRN, f/u in 2 weeks.',
          medications: ['Sumatriptan 50mg PRN', 'Ibuprofen 400mg q6h PRN'],
          followUp: '2 weeks'
        };

        patientSummary = {
          summary: `You visited today about headaches that have been bothering you for the past 3 weeks. The doctor examined you and found that these are likely tension headaches, possibly with some migraine features. Your physical exam was normal, which is reassuring.`,
          keyPoints: [
            'Your headaches appear to be tension-type with possible migraine features',
            'Physical examination was completely normal',
            'No concerning signs that require immediate attention'
          ],
          nextSteps: [
            'Try stress management techniques like relaxation exercises',
            'Take the prescribed medication as needed for severe headaches',
            'Continue ibuprofen for regular pain relief',
            'Follow up in 2 weeks if headaches continue'
          ],
          medications: ['Sumatriptan (for severe headaches)', 'Ibuprofen (for regular pain relief)']
        };
      }
      
      const recording: Recording = {
        id: sessionId,
        patientName: consentData.patientName,
        doctorName: consentData.doctorName,
        date: new Date(),
        duration: recorderState.duration,
        audioBlob: recorderState.audioBlob,
        transcription: transcription,
        doctorNotes: {
          ...doctorNotes,
          rawTranscription: transcription
        },
        patientSummary: consentData.summaryConsent ? patientSummary : undefined,
        status: 'completed',
        consentGiven: true
      };

      // Save recording
      const existingRecordings = JSON.parse(localStorage.getItem('echonotes-recordings') || '[]');
      existingRecordings.push(recording);
      localStorage.setItem('echonotes-recordings', JSON.stringify(existingRecordings));

      // Navigate back to dashboard
      navigate('/');
      
    } catch (error) {
      console.error('Processing error:', error);
      setRecorderState(prev => ({ 
        ...prev, 
        error: 'Failed to process recording. Please ensure the Flask backend is running and try again.' 
      }));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-lg w-full"
      >
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-8"
        >
          <motion.div 
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
              recorderState.isRecording ? 'bg-red-100' : 'bg-blue-100'
            }`}
            animate={recorderState.isRecording ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: recorderState.isRecording ? Infinity : 0, duration: 1.5 }}
          >
            <AnimatePresence mode="wait">
              {processing ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <Loader className="w-10 h-10 text-blue-600" />
              </motion.div>
              ) : (
              <motion.div
                key="mic"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <Mic className={`w-10 h-10 ${recorderState.isRecording ? 'text-red-600' : 'text-blue-600'}`} />
              </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {processing ? 'Processing Recording...' : 'Recording Session'}
          </h1>
          
          <motion.div 
            className="text-4xl font-mono font-bold text-blue-600 mb-4"
            animate={recorderState.isRecording ? { opacity: [1, 0.7, 1] } : {}}
            transition={{ repeat: recorderState.isRecording ? Infinity : 0, duration: 2 }}
          >
            {formatTime(recorderState.duration)}
          </motion.div>

          <AnimatePresence>
            {recorderState.isRecording && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-sm text-gray-600 mb-4"
              >
                <div className="flex items-center justify-center">
                  <motion.div 
                    className="w-3 h-3 bg-red-500 rounded-full mr-2"
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                  Recording in progress...
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {recorderState.error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-800 text-sm">{recorderState.error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {backendStatus === 'offline' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-amber-600 mr-2" />
                <div className="text-amber-800 text-sm">
                  <strong>Backend Offline:</strong> Flask server not detected.
                  <br />
                  <span className="text-xs">Start the backend with: <code className="bg-amber-100 px-1 rounded">cd backend && python app.py</code></span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {backendStatus === 'online' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <p className="text-green-800 text-sm">
                  Backend connected - Whisper and Ollama ready
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {processing && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="mr-2"
                >
                  <Loader className="w-5 h-5 text-blue-600" />
                </motion.div>
                <div className="text-blue-800 text-sm">
                  {backendStatus === 'online' 
                    ? 'Processing audio with local AI models...'
                    : 'Processing with mock data (backend offline)...'
                  }
                  <br />
                  <span className="text-xs text-blue-600">
                    {backendStatus === 'online' 
                      ? 'Step 1: Transcribing with Whisper → Step 2: Generating notes with Ollama'
                      : 'Using demo transcription and AI-generated notes for demonstration'
                    }
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-4"
        >
          <AnimatePresence mode="wait">
            {!recorderState.isRecording && !recorderState.audioBlob && !processing && (
              <motion.button
                key="start-recording"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={startRecording}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-colors duration-200 flex items-center justify-center"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </motion.button>
            )}

            {recorderState.isRecording && (
              <motion.button
                key="stop-recording"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={stopRecording}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-colors duration-200 flex items-center justify-center"
              >
                <Square className="w-5 h-5 mr-2" />
                Stop Recording
              </motion.button>
            )}

            {recorderState.audioBlob && !processing && (
              <motion.div
                key="audio-controls"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gray-50 rounded-xl p-4"
                >
                  <audio controls className="w-full">
                    <source src={URL.createObjectURL(recorderState.audioBlob)} type="audio/wav" />
                    Your browser does not support audio playback.
                  </audio>
                </motion.div>
                
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setRecorderState(prev => ({ ...prev, audioBlob: null, duration: 0 }));
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors duration-200"
                  >
                    Re-record
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={processRecording}
                    className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Generate Notes
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
            className="w-full px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RecordingSession;
