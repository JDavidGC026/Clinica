import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { emailTemplates } from '@/components/email/emailTemplates';

const EmailHistoryList = () => {
  const [emailHistory, setEmailHistory] = useState([]);

  const loadEmailHistory = () => {
    const saved = localStorage.getItem('clinic_email_history');
    if (saved) {
      setEmailHistory(JSON.parse(saved).sort((a,b) => new Date(b.sentAt) - new Date(a.sentAt)));
    }
  };

  useEffect(() => {
    loadEmailHistory();
    const handleStorageChange = () => {
        loadEmailHistory();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'enviado': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pendiente': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Mail className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type) => emailTemplates[type]?.name || type;

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 h-full">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
        <Mail className="w-5 h-5 mr-2" />
        Historial de Notificaciones
      </h2>
      <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-2">
        {emailHistory.length > 0 ? emailHistory.map((email) => (
          <motion.div
            key={email.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  {getStatusIcon(email.status)}
                  <span className="text-sm font-medium text-gray-900 truncate">{getTypeLabel(email.type)}</span>
                </div>
                <p className="text-sm text-gray-600 truncate">{email.subject}</p>
                <p className="text-xs text-gray-500 truncate">Para: {email.recipient}</p>
              </div>
              <div className="text-right text-xs text-gray-500 shrink-0 ml-2">
                <p>{new Date(email.sentAt).toLocaleDateString('es-ES')}</p>
                <p>{new Date(email.sentAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="text-center py-8 h-full flex flex-col justify-center items-center">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay notificaciones enviadas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailHistoryList;