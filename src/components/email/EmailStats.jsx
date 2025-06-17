import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, Bell, Calendar } from 'lucide-react';

const EmailStats = () => {
  const [stats, setStats] = useState({ total: 0, confirmations: 0, reminders: 0, today: 0 });

  const calculateStats = () => {
    const history = JSON.parse(localStorage.getItem('clinic_email_history') || '[]');
    setStats({
      total: history.length,
      confirmations: history.filter(e => e.type === 'appointment-confirmation').length,
      reminders: history.filter(e => e.type === 'appointment-reminder').length,
      today: history.filter(e => new Date(e.sentAt).toDateString() === new Date().toDateString()).length,
    });
  };

  useEffect(() => {
    calculateStats();
    window.addEventListener('storage', calculateStats);
    return () => window.removeEventListener('storage', calculateStats);
  }, []);

  const statItems = [
    { label: 'Total Enviados', value: stats.total, icon: Mail, color: 'text-blue-500' },
    { label: 'Confirmaciones', value: stats.confirmations, icon: CheckCircle, color: 'text-green-500' },
    { label: 'Recordatorios', value: stats.reminders, icon: Bell, color: 'text-yellow-500' },
    { label: 'Hoy', value: stats.today, icon: Calendar, color: 'text-purple-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map(item => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{item.label}</p>
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
              </div>
              <Icon className={`w-8 h-8 ${item.color}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EmailStats;