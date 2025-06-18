import React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Settings, Zap, Clock, Bell } from 'lucide-react';

const AutomatedNotifications = () => {
  const handleActivation = () => {
    const emailConfig = JSON.parse(localStorage.getItem('clinic_email_config') || '{}');
    if (!emailConfig.smtpHost || !emailConfig.smtpUser) {
      toast({
        title: "Configuración requerida",
        description: "Por favor, completa la configuración SMTP en la página de Configuración primero.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "🚧 Esta función no está implementada aún",
        description: "¡Pero ya tienes la configuración lista! Los templates están preparados para automatización. 🚀"
      });
    }
  };

  const notificationOptions = [
    { 
      title: 'Recordatorio 24h antes', 
      description: 'Enviar recordatorio automático a pacientes',
      icon: Clock,
      color: 'text-amber-500'
    },
    { 
      title: 'Confirmación automática', 
      description: 'Al crear nueva cita enviar confirmación',
      icon: Zap,
      color: 'text-green-500'
    },
    { 
      title: 'Nueva cita asignada', 
      description: 'Notificar al profesional automáticamente',
      icon: Bell,
      color: 'text-blue-500'
    },
    { 
      title: 'Resumen diario', 
      description: 'Citas del día siguiente a profesionales',
      icon: Settings,
      color: 'text-purple-500'
    },
  ];

  return (
    <div className="bg-card rounded-xl shadow-lg p-4 sm:p-6 border border-border/50">
      <h2 className="text-xl font-semibold text-card-foreground mb-6">Notificaciones Automáticas</h2>
      
      <div className="bg-muted/30 p-4 rounded-lg mb-6">
        <p className="text-sm text-muted-foreground">
          <strong>Sistema de Templates Integrado:</strong> Los correos se generan automáticamente usando templates HTML 
          profesionales integrados en el código. Cada template incluye diseño responsivo, colores de la marca y 
          toda la información relevante de la clínica.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-card-foreground">Para Pacientes</h3>
          {notificationOptions.slice(0, 2).map(opt => {
            const Icon = opt.icon;
            return (
              <div key={opt.title} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border/50">
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${opt.color}`} />
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{opt.title}</p>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                </div>
                <Button size="sm" onClick={handleActivation} variant="outline">
                  Activar
                </Button>
              </div>
            );
          })}
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-card-foreground">Para Profesionales</h3>
          {notificationOptions.slice(2, 4).map(opt => {
            const Icon = opt.icon;
            return (
              <div key={opt.title} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border/50">
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${opt.color}`} />
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{opt.title}</p>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                </div>
                <Button size="sm" onClick={handleActivation} variant="outline">
                  Activar
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
        <h4 className="font-medium text-card-foreground mb-2">Características de los Templates:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Diseño responsivo para móviles y desktop</li>
          <li>• Colores y branding de la clínica</li>
          <li>• Información dinámica (nombre, fecha, profesional, etc.)</li>
          <li>• Versiones HTML y texto plano</li>
          <li>• Fácil personalización desde configuración</li>
        </ul>
      </div>
    </div>
  );
};

export default AutomatedNotifications;