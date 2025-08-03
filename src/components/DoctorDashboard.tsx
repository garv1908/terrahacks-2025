import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, FileText, Clock, User, Calendar, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api';
import type { Recording } from '../types';

const DoctorDashboard: React.FC = () => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    // First check backend status
    await checkBackendStatus();
    // Then load recordings with the correct status
    await loadRecordings();
  };

  const checkBackendStatus = async () => {
    try {
      await apiService.healthCheck();
      setBackendStatus('online');
      return true;
    } catch (error) {
      setBackendStatus('offline');
      return false;
    }
  };

  const loadRecordings = async () => {
    try {
      setLoading(true);
      
      // Try to load from backend first if it's online
      try {
        const response = await apiService.getAllRecordings();
        if (response.status === 'success') {
          // Convert backend format to frontend format
          const backendRecordings = response.recordings.map((r: any) => ({
            id: r.id,
            patientName: r.patient_name,
            doctorName: r.doctor_name,
            date: new Date(r.date),
            duration: parseInt(r.duration),
            transcription: r.transcription,
            doctorNotes: r.doctor_notes,
            patientSummary: r.patient_summary,
            status: r.status,
            consentGiven: true
          }));
          setRecordings(backendRecordings);
          return;
        }
      } catch (error) {
        console.log('Backend not available, falling back to localStorage');
      }
      
      // Fallback to localStorage
      const savedRecordings = localStorage.getItem('echonotes-recordings');
      if (savedRecordings) {
        const localRecordings = JSON.parse(savedRecordings).map((r: any) => ({
          ...r,
          date: new Date(r.date)
        }));
        setRecordings(localRecordings);
      }
    } catch (error) {
      console.error('Error loading recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshRecordings = () => {
    loadRecordings();
  };

  const startNewSession = () => {
    window.location.href = '/consent';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: Recording['status']) => {
    switch (status) {
      case 'recording': return 'text-red-600 bg-red-50 border-red-200';
      case 'processing': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white border-b border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-xl mr-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Manage your consultation sessions</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={startNewSession}
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition-colors duration-200"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Session
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Stats */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{recordings.length}</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Today's Sessions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {recordings.filter(r => 
                    new Date(r.date).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {recordings.filter(r => r.status === 'completed').length}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Recent Sessions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white shadow-sm rounded-xl border border-gray-200"
        >
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Sessions</h2>
          </div>
          
          {recordings.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-center py-16"
            >
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No sessions yet</h3>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                Start your first recording session to begin generating medical notes with AI assistance.
              </p>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={startNewSession}
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition-colors duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                Start First Session
              </motion.button>
            </motion.div>
          ) : (
            <div className="overflow-hidden">
              <motion.ul 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="divide-y divide-gray-200"
              >
                {recordings.map((recording) => (
                  <motion.li 
                    key={recording.id} 
                    variants={itemVariants}
                    className="px-6 py-5 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-semibold text-gray-900">{recording.patientName}</p>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>{new Date(recording.date).toLocaleDateString()}</span>
                            <span className="mx-2">•</span>
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{formatDuration(recording.duration)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(recording.status)}`}>
                          {recording.status.charAt(0).toUpperCase() + recording.status.slice(1)}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => window.location.href = `/summary/${recording.id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors duration-200"
                        >
                          View Details
                        </motion.button>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default DoctorDashboard;
