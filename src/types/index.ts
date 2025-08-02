export interface Recording {
  id: string;
  patientName: string;
  doctorName: string;
  date: Date;
  duration: number;
  audioBlob?: Blob;
  transcription?: string;
  doctorNotes?: DoctorNotes;
  patientSummary?: PatientSummary;
  status: 'recording' | 'processing' | 'completed';
  consentGiven: boolean;
}

export interface DoctorNotes {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  rawTranscription: string;
  medications?: string[];
  followUp?: string;
}

export interface PatientSummary {
  summary: string;
  keyPoints: string[];
  nextSteps: string[];
  medications?: string[];
  followUpDate?: string;
  redactedSections?: string[];
}

export interface ConsentData {
  patientName: string;
  doctorName: string;
  recordingConsent: boolean;
  summaryConsent: boolean;
  timestamp: Date;
}

export type UserRole = 'doctor' | 'patient';

export interface AudioRecorderState {
  isRecording: boolean;
  duration: number;
  audioBlob: Blob | null;
  error: string | null;
}
