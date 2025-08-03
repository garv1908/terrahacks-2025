import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, User, ArrowRight } from 'lucide-react';
import DoctorDashboard from './components/DoctorDashboard';
import PatientView from './components/PatientView';
import RecordingSession from './components/RecordingSession';
import ConsentForm from './components/ConsentForm';
import SummaryPage from './components/SummaryPage';
import type { UserRole } from './types';

function App() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const RoleSelector = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-6">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            EchoNotes
          </h1>
          <p className="text-gray-600 text-lg">
            AI-powered medical transcription
          </p>
        </motion.div>

        <div className="space-y-4">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setUserRole('doctor')}
            className="w-full bg-blue-600 text-white p-6 rounded-xl shadow-lg hover:bg-blue-700 transition-colors duration-200 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-500 p-3 rounded-lg">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg">Healthcare Provider</h3>
                  <p className="text-blue-100 text-sm">Record and manage consultations</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setUserRole('patient')}
            className="w-full bg-green-600 text-white p-6 rounded-xl shadow-lg hover:bg-green-700 transition-colors duration-200 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-green-500 p-3 rounded-lg">
                  <User className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg">Patient</h3>
                  <p className="text-green-100 text-sm">View your consultation summary</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </motion.button>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-8 pt-6 border-t border-gray-200"
        >
          <p className="text-sm text-gray-500 text-center">
            Privacy-first medical transcription with local AI processing
          </p>
        </motion.div>
      </motion.div>
    </div>
  );

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={
            <AnimatePresence mode="wait">
              {!userRole ? (
                <motion.div
                  key="role-selector"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <RoleSelector />
                </motion.div>
              ) : userRole === 'doctor' ? (
                <motion.div
                  key="doctor-dashboard"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <DoctorDashboard />
                </motion.div>
              ) : (
                <motion.div
                  key="patient-view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <PatientView />
                </motion.div>
              )}
            </AnimatePresence>
          } />
          <Route path="/consent" element={<ConsentForm />} />
          <Route path="/recording/:sessionId" element={<RecordingSession />} />
          <Route path="/summary/:sessionId" element={<SummaryPage />} />
          <Route path="/patient/:sessionId" element={<PatientView />} />
          <Route path="/session/:sessionId" element={<PatientView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
