import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface TranscriptionResponse {
  transcription: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

export interface NotesResponse {
  doctorNotes: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    rawTranscription: string;
    medications: string[];
    followUp: string;
  };
  patientSummary: {
    summary: string;
    keyPoints: string[];
    nextSteps: string[];
    medications: string[];
  };
}

class ApiService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 300000, // 30 seconds for AI processing
  });

  async transcribeAudio(audioBlob: Blob): Promise<TranscriptionResponse> {
    const formData = new FormData();
    
    // Determine file extension based on blob type
    const fileExtension = audioBlob.type.includes('webm') ? '.webm' : 
                         audioBlob.type.includes('wav') ? '.wav' : '.webm';
    
    formData.append('audio', audioBlob, `recording${fileExtension}`);

    const response = await this.api.post<TranscriptionResponse>('/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async generateNotes(transcription: string): Promise<NotesResponse> {
    const response = await this.api.post<NotesResponse>('/generate-notes', {
      transcription,
    });

    return response.data;
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.api.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();
