import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, Clock, Pill, ArrowRight, Heart } from 'lucide-react';

const PatientView: React.FC = () => {
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
  
  // Mock data - in real app, this would be loaded based on sessionId
  const patientSummary = {
    patientName: 'John Doe',
    doctorName: 'Dr. Smith',
    date: new Date().toLocaleDateString(),
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
    medications: [
      { name: 'Sumatriptan', dosage: '50mg as needed', purpose: 'For severe headaches' },
      { name: 'Ibuprofen', dosage: '400mg every 6 hours', purpose: 'For regular pain relief' }
    ],
    followUpDate: '2 weeks'
  };

  return (
    <motion.div 
      className="min-h-screen bg-gray-50"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div 
        className="bg-white shadow-sm"
        variants={itemVariants}
      >
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center">
            <Heart className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Visit Summary</h1>
              <p className="text-gray-600">Easy-to-understand summary of your consultation</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Visit Info */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm p-6 mb-6"
          variants={itemVariants}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Visit Date</p>
                <p className="font-medium">{patientSummary.date}</p>
              </div>
            </div>
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Doctor</p>
                <p className="font-medium">{patientSummary.doctorName}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-orange-600 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Follow-up</p>
                <p className="font-medium">In {patientSummary.followUpDate}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Summary */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm p-6 mb-6"
          variants={itemVariants}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-6 h-6 text-blue-600 mr-2" />
            What We Discussed
          </h2>
          <div className="prose prose-blue max-w-none">
            <p className="text-gray-700 leading-relaxed">{patientSummary.summary}</p>
          </div>
        </motion.div>

        {/* Key Points */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm p-6 mb-6"
          variants={itemVariants}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Points</h2>
          <div className="space-y-3">
            {patientSummary.keyPoints.map((point, index) => (
              <div key={index} className="flex items-start">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <p className="text-gray-700">{point}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Medications */}
        {patientSummary.medications.length > 0 && (
          <motion.div 
            className="bg-white rounded-xl shadow-sm p-6 mb-6"
            variants={itemVariants}
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Pill className="w-6 h-6 text-purple-600 mr-2" />
              Your Medications
            </h2>
            <div className="space-y-4">
              {patientSummary.medications.map((med, index) => (
                <div key={index} className="border-l-4 border-purple-200 pl-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">{med.name}</h3>
                    <span className="text-sm text-gray-500">{med.dosage}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{med.purpose}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Next Steps */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm p-6 mb-6"
          variants={itemVariants}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <ArrowRight className="w-6 h-6 text-blue-600 mr-2" />
            What to Do Next
          </h2>
          <div className="space-y-3">
            {patientSummary.nextSteps.map((step, index) => (
              <div key={index} className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5 text-xs font-semibold text-blue-700">
                  {index + 1}
                </div>
                <p className="text-gray-700">{step}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Important Notice */}
        <motion.div 
          className="bg-amber-50 border border-amber-200 rounded-xl p-6"
          variants={itemVariants}
        >
          <h3 className="font-semibold text-amber-900 mb-2">Important Reminder</h3>
          <p className="text-amber-800 text-sm mb-3">
            This summary is meant to help you remember our conversation. It doesn't replace your medical records or professional medical advice.
          </p>
          <div className="text-sm text-amber-700">
            <p><strong>If you experience any concerning symptoms, contact us immediately:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Severe or worsening headache</li>
              <li>Fever</li>
              <li>Vision changes or neurological symptoms</li>
            </ul>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          className="text-center mt-8 pt-6 border-t border-gray-200"
          variants={itemVariants}
        >
          <p className="text-gray-500 text-sm">
            Generated by EchoNotes • Privacy-first medical transcription
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PatientView;
