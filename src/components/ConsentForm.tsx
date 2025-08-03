import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserCheck, FileText, Shield, CheckCircle, ArrowRight } from 'lucide-react';
import type { ConsentData } from '../types';

const ConsentForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ConsentData>({
    patientName: '',
    doctorName: 'Dr. Smith', // Mock doctor name
    recordingConsent: false,
    summaryConsent: false,
    timestamp: new Date(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientName || !formData.recordingConsent) {
      alert('Please provide patient name and recording consent');
      return;
    }

    // Generate session ID
    const sessionId = Date.now().toString();
    
    // Save consent data
    localStorage.setItem(`consent-${sessionId}`, JSON.stringify(formData));
    
    // Navigate to recording session
    navigate(`/recording/${sessionId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-2xl w-full"
      >
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-6">
            <UserCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Patient Consent</h1>
          <p className="text-gray-600 text-lg">Please review and provide consent for recording and AI processing</p>
        </motion.div>

        <motion.form 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          onSubmit={handleSubmit} 
          className="space-y-6"
        >
          {/* Patient Information */}
          <div>
            <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-2">
              Patient Name
            </label>
            <input
              type="text"
              id="patientName"
              value={formData.patientName}
              onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
              placeholder="Enter patient full name"
              required
            />
          </div>

          <div>
            <label htmlFor="doctorName" className="block text-sm font-medium text-gray-700 mb-2">
              Attending Physician
            </label>
            <input
              type="text"
              id="doctorName"
              value={formData.doctorName}
              onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              readOnly
            />
          </div>

          {/* Consent Checkboxes */}
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-medical-600" />
              Consent Agreement
            </h3>
            
            <div className="space-y-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.recordingConsent}
                  onChange={(e) => setFormData({ ...formData, recordingConsent: e.target.checked })}
                  className="mt-1 w-5 h-5 text-medical-600 border-gray-300 rounded focus:ring-medical-500"
                  required
                />
                <div className="flex-1">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-medical-600" />
                    <span className="font-medium text-gray-900">Recording Consent (Required)</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    I consent to having this medical consultation recorded for the purpose of generating clinical notes. 
                    All audio processing will be done locally on this device.
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.summaryConsent}
                  onChange={(e) => setFormData({ ...formData, summaryConsent: e.target.checked })}
                  className="mt-1 w-5 h-5 text-medical-600 border-gray-300 rounded focus:ring-medical-500"
                />
                <div className="flex-1">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-primary-600" />
                    <span className="font-medium text-gray-900">Patient Summary Sharing (Optional)</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    I consent to receiving a simplified, patient-friendly summary of this consultation. 
                    The summary will exclude sensitive medical jargon and can be redacted by the physician.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Privacy & Security Notice</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• All audio processing is performed locally on this device</li>
              <li>• No audio data is transmitted to external servers</li>
              <li>• AI models (Whisper + Ollama) run entirely offline</li>
              <li>• You can request deletion of recordings at any time</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <motion.button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              disabled={!formData.patientName || !formData.recordingConsent}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors duration-200 flex items-center justify-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Start Recording Session
              <ArrowRight className="w-5 h-5 ml-2" />
            </motion.button>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default ConsentForm;
