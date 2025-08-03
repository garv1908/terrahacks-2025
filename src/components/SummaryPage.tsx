import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, User, Calendar, Clock, Pill, CheckCircle } from 'lucide-react';
import { apiService } from '../services/api';

interface Recording {
  id: string;
  patient_name: string;
  doctor_name: string;
  date: string;
  duration: number;
  transcription: string;
  doctor_notes: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    medications: string[];
    followUp: string;
  };
  patient_summary: {
    summary: string;
    keyPoints: string[];
    nextSteps: string[];
    medications: string[];
  };
  status: string;
}

const SummaryPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [recording, setRecording] = useState<Recording | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'doctor' | 'patient'>('doctor');

  useEffect(() => {
    if (sessionId) {
      loadRecording(sessionId);
    }
  }, [sessionId]);

  const loadRecording = async (id: string) => {
    try {
      setLoading(true);
      
      // Try backend first
      try {
        const response = await apiService.getRecording(id);
        if (response.status === 'success') {
          setRecording(response.recording);
          return;
        }
      } catch (err) {
        console.log('Backend not available, trying localStorage...');
      }
      
      // Fallback to localStorage
      const savedRecordings = localStorage.getItem('echonotes-recordings');
      if (savedRecordings) {
        const recordings = JSON.parse(savedRecordings);
        const foundRecording = recordings.find((r: any) => r.id === id);
        
        if (foundRecording) {
          // Convert localStorage format to expected format
          const convertedRecording = {
            id: foundRecording.id,
            patient_name: foundRecording.patientName,
            doctor_name: foundRecording.doctorName,
            date: foundRecording.date,
            duration: foundRecording.duration,
            transcription: foundRecording.transcription,
            doctor_notes: foundRecording.doctorNotes,
            patient_summary: foundRecording.patientSummary,
            status: foundRecording.status
          };
          setRecording(convertedRecording);
          return;
        }
      }
      
      setError('Recording not found');
    } catch (err) {
      console.error('Error loading recording:', err);
      setError('Failed to load recording');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error || !recording) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Recording Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
            
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('doctor')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'doctor' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Doctor View
              </button>
              <button
                onClick={() => setViewMode('patient')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'patient' 
                    ? 'bg-white text-green-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Patient View
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center">
              <User className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Patient</p>
                <p className="font-semibold">{recording.patient_name}</p>
              </div>
            </div>
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Doctor</p>
                <p className="font-semibold">{recording.doctor_name}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-purple-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-semibold">{formatDate(recording.date)}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-orange-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-semibold">{formatDuration(recording.duration)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {viewMode === 'doctor' ? (
            <DoctorView recording={recording} />
          ) : (
            <PatientView recording={recording} />
          )}
        </motion.div>
      </div>
    </div>
  );
};

const DoctorView: React.FC<{ recording: Recording }> = ({ recording }) => {
  return (
    <div className="space-y-6">
      {/* Clinical Notes */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <FileText className="w-6 h-6 text-blue-600 mr-2" />
          Clinical Documentation (SOAP Notes)
        </h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-blue-600 mb-2">Subjective</h3>
            <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">{recording.doctor_notes.subjective}</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-green-600 mb-2">Objective</h3>
            <p className="text-gray-700 bg-green-50 p-3 rounded-lg">{recording.doctor_notes.objective}</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-purple-600 mb-2">Assessment</h3>
            <p className="text-gray-700 bg-purple-50 p-3 rounded-lg">{recording.doctor_notes.assessment}</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-orange-600 mb-2">Plan</h3>
            <p className="text-gray-700 bg-orange-50 p-3 rounded-lg">{recording.doctor_notes.plan}</p>
          </div>
          
          {recording.doctor_notes.medications && recording.doctor_notes.medications.length > 0 && (
            <div>
              <h3 className="font-semibold text-red-600 mb-2 flex items-center">
                <Pill className="w-4 h-4 mr-2" />
                Medications
              </h3>
              <ul className="bg-red-50 p-3 rounded-lg space-y-1">
                {recording.doctor_notes.medications.map((med, index) => (
                  <li key={index} className="text-gray-700 flex items-center">
                    <CheckCircle className="w-3 h-3 text-green-600 mr-2" />
                    {med}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {recording.doctor_notes.followUp && (
            <div>
              <h3 className="font-semibold text-indigo-600 mb-2">Follow-up</h3>
              <p className="text-gray-700 bg-indigo-50 p-3 rounded-lg">{recording.doctor_notes.followUp}</p>
            </div>
          )}
        </div>
      </div>

      {/* Raw Transcription */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Full Transcription</h2>
        <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
          <p className="text-gray-700 whitespace-pre-wrap">{recording.transcription}</p>
        </div>
      </div>
    </div>
  );
};

const PatientView: React.FC<{ recording: Recording }> = ({ recording }) => {
  if (!recording.patient_summary) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
        <p className="text-gray-600">Patient summary not available for this recording.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Visit Summary */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Visit Summary</h2>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-gray-700 text-lg leading-relaxed">{recording.patient_summary.summary}</p>
        </div>
      </div>

      {/* Key Points */}
      {recording.patient_summary.keyPoints && recording.patient_summary.keyPoints.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Important Points to Remember</h2>
          <ul className="space-y-2">
            {recording.patient_summary.keyPoints.map((point, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Steps */}
      {recording.patient_summary.nextSteps && recording.patient_summary.nextSteps.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">What You Should Do Next</h2>
          <ol className="space-y-2">
            {recording.patient_summary.nextSteps.map((step, index) => (
              <li key={index} className="flex items-start">
                <span className="bg-blue-600 text-white text-sm rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  {index + 1}
                </span>
                <span className="text-gray-700">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Medications */}
      {recording.patient_summary.medications && recording.patient_summary.medications.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Pill className="w-6 h-6 text-red-600 mr-2" />
            Your Medications
          </h2>
          <div className="space-y-3">
            {recording.patient_summary.medications.map((med, index) => (
              <div key={index} className="bg-red-50 p-3 rounded-lg">
                <p className="text-gray-700 font-medium">{med}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryPage;
