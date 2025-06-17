import React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const AutomatedNotifications = () => {
  const handleActivation = () => {
    const config = JSON.parse(localStorage.getItem('clinic_email_config'));
    if (!config || !config.serviceId || !config.publicKey) {
      toast({
        title: "Configuración requerida",
        description: "Por favor, completa la configuración de Email en la página de Configuración primero.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "🚧 Esta función no está implementada aún",
        description: "¡Pero ya tienes la configuración lista! Puedes solicitar la automatización en tu próximo prompt! 🚀"
      });
    }
  };

  const notificationOptions = [
    { title: 'Recordatorio 24h antes', description: 'Enviar recordatorio automático' },
    { title: 'Confirmación automática', description: 'Al crear nueva cita' },
    { title: 'Nueva cita asignada', description: 'Notificar al psicólogo' },
    { title: 'Resumen diario', description: 'Citas del día siguiente' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Notificaciones Automáticas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Para Pacientes</h3>
          {notificationOptions.slice(0, 2).map(opt => (
            <div key={opt.title} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{opt.title}</p>
                <p className="text-xs text-gray-500">{opt.description}</p>
              </div>
              <Button size="sm" onClick={handleActivation}>Activar</Button>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Para Psicólogos</h3>
          {notificationOptions.slice(2, 4).map(opt => (
            <div key={opt.title} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{opt.title}</p>
                <p className="text-xs text-gray-500">{opt.description}</p>
              </div>
              <Button size="sm" onClick={handleActivation}>Activar</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AutomatedNotifications;