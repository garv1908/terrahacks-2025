import { useState, useRef, useCallback } from 'react';
import type { AudioRecorderState } from '../types';

export const useAudioRecorder = () => {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    duration: 0,
    audioBlob: null,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<number | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setState(prev => ({ ...prev, audioBlob, isRecording: false }));
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setState(prev => ({ ...prev, isRecording: true, error: null }));

      // Start timer
      intervalRef.current = window.setInterval(() => {
        setState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to access microphone. Please check permissions.' 
      }));
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [state.isRecording]);

  const resetRecording = useCallback(() => {
    setState({
      isRecording: false,
      duration: 0,
      audioBlob: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    resetRecording,
  };
};
