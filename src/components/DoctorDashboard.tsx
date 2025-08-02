import React, { useState, useEffect } from 'react';
import { Plus, FileText, Clock, User, Calendar } from 'lucide-react';
import type { Recording } from '../types';

const DoctorDashboard: React.FC = () => {
  const [recordings, setRecordings] = useState<Recording[]>([]);

  useEffect(() => {
    // Load recordings from localStorage
    const savedRecordings = localStorage.getItem('echonotes-recordings');
    if (savedRecordings) {
      setRecordings(JSON.parse(savedRecordings));
    }
  }, []);

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
      case 'recording': return 'text-red-600 bg-red-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-medical-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
            </div>
            <button
              onClick={startNewSession}
              className="inline-flex items-center px-4 py-2 bg-medical-600 hover:bg-medical-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Session
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="w-8 h-8 text-medical-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                <p className="text-2xl font-semibold text-gray-900">{recordings.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="w-8 h-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Today's Sessions</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {recordings.filter(r => 
                    new Date(r.date).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {recordings.filter(r => r.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Sessions</h2>
          </div>
          
          {recordings.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
              <p className="text-gray-500 mb-6">Start your first recording session to begin generating medical notes.</p>
              <button
                onClick={startNewSession}
                className="inline-flex items-center px-4 py-2 bg-medical-600 hover:bg-medical-700 text-white font-medium rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Start First Session
              </button>
            </div>
          ) : (
            <div className="overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {recordings.map((recording) => (
                  <li key={recording.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <User className="w-10 h-10 text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{recording.patientName}</p>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(recording.date).toLocaleDateString()}
                            <Clock className="w-4 h-4 ml-4 mr-1" />
                            {formatDuration(recording.duration)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(recording.status)}`}>
                          {recording.status}
                        </span>
                        <button className="text-medical-600 hover:text-medical-700 font-medium text-sm">
                          View Details
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
