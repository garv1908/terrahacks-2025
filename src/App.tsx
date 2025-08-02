import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';
import DoctorDashboard from './components/DoctorDashboard';
import PatientView from './components/PatientView';
import RecordingSession from './components/RecordingSession';
import ConsentForm from './components/ConsentForm';
import type { UserRole } from './types';

function App() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const RoleSelector = () => (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 to-primary-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-medical-500 rounded-full mb-4">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">EchoNotes</h1>
          <p className="text-gray-600">AI-Generated Medical Notes Platform</p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => setUserRole('doctor')}
            className="w-full bg-medical-600 hover:bg-medical-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Doctor Login
          </button>
          <button
            onClick={() => setUserRole('patient')}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Patient Access
          </button>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Privacy-first medical transcription with local AI processing
          </p>
        </div>
      </div>
    </div>
  );

  if (!userRole) {
    return <RoleSelector />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {userRole === 'doctor' && (
            <>
              <Route path="/" element={<DoctorDashboard />} />
              <Route path="/consent" element={<ConsentForm />} />
              <Route path="/recording/:sessionId" element={<RecordingSession />} />
              <Route path="/patient/:sessionId" element={<PatientView />} />
            </>
          )}
          {userRole === 'patient' && (
            <>
              <Route path="/" element={<PatientView />} />
              <Route path="/session/:sessionId" element={<PatientView />} />
            </>
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
