import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail, CheckCircle, Clock, AlertCircle, Eye, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import EmailService from '@/services/EmailService';

const EmailManager = () => {
  const [emailHistory, setEmailHistory] = useState([]);
  const [testEmail, setTestEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);

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

  const loadEmailHistory = () => {
    const saved = localStorage.getItem('clinic_email_history');
    if (saved) {
      setEmailHistory(JSON.parse(saved).sort((a,b) => new Date(b.sentAt) - new Date(a.sentAt)));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'enviado': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pendiente': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Mail className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleTestEmail = () => {
    const testData = {
      patient_name: 'Juan Pérez (Ejemplo)',
      professional_name: 'Dr. García (Ejemplo)',
      appointment_date: '15 de enero de 2024 a las 10:00',
      appointment_type: 'Consulta General',
      folio: 'CDX-240115-TEST'
    };

    EmailService.previewTemplate('appointment-confirmation', testData);
    toast({
      title: 'Vista previa generada',
      description: 'Se ha abierto una ventana con el template de ejemplo.',
    });
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa un email de prueba.',
        variant: 'destructive'
      });
      return;
    }

    setIsTesting(true);

    try {
      const testData = {
        patient_name: 'Paciente de Prueba',
        professional_name: 'Dr. García (Ejemplo)',
        appointment_date: '15 de enero de 2024 a las 10:00',
        appointment_type: 'Consulta de Prueba',
        folio: 'CDX-TEST-' + Date.now()
      };

      const result = await EmailService.sendEmail('appointment-confirmation', testEmail, testData);

      if (result.success) {
        toast({
          title: '✅ Email enviado exitosamente!',
          description: `Email de prueba enviado a ${testEmail}`,
        });
      }

    } catch (error) {
      toast({
        title: 'Error al enviar email',
        description: error.message || 'Error al enviar el email de prueba.',
        variant: 'destructive'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const stats = {
    total: emailHistory.length,
    confirmations: emailHistory.filter(e => e.type === 'appointment-confirmation').length,
    reminders: emailHistory.filter(e => e.type === 'appointment-reminder').length,
    today: emailHistory.filter(e => new Date(e.sentAt).toDateString() === new Date().toDateString()).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Gestión de Notificaciones</h1>
          <p className="text-muted-foreground mt-1">Envía emails a pacientes y profesionales</p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Enviados', value: stats.total, icon: Mail, color: 'text-blue-500' },
          { label: 'Confirmaciones', value: stats.confirmations, icon: CheckCircle, color: 'text-green-500' },
          { label: 'Recordatorios', value: stats.reminders, icon: Clock, color: 'text-yellow-500' },
          { label: 'Hoy', value: stats.today, icon: AlertCircle, color: 'text-purple-500' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-card rounded-xl shadow-lg p-4 border border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="text-2xl font-bold text-card-foreground">{item.value}</p>
                </div>
                <Icon className={`w-8 h-8 ${item.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Panel de prueba */}
      <div className="bg-card rounded-xl shadow-lg p-6 border border-border/50">
        <h2 className="text-xl font-semibold text-card-foreground mb-6 flex items-center">
          <TestTube className="w-5 h-5 mr-2 text-primary" />
          Probar Sistema de Emails
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-card-foreground mb-4">Vista Previa</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ve cómo se ven los templates de email sin enviar nada.
            </p>
            <Button onClick={handleTestEmail} variant="outline" className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              Ver Template de Ejemplo
            </Button>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-card-foreground mb-4">Envío de Prueba</h3>
            <div className="space-y-3">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="email-de-prueba@ejemplo.com"
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              />
              <Button
                onClick={handleSendTestEmail}
                disabled={isTesting || !testEmail}
                className="w-full button-primary-gradient"
              >
                <Send className="w-4 h-4 mr-2" />
                {isTesting ? 'Enviando...' : 'Enviar Email de Prueba'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de emails */}
      <div className="bg-card rounded-xl shadow-lg border border-border/50">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-card-foreground flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Historial de Notificaciones ({emailHistory.length})
          </h2>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {emailHistory.length > 0 ? (
            <div className="space-y-2 p-4">
              {emailHistory.map((email) => (
                <motion.div
                  key={email.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border border-border/50 rounded-lg hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {getStatusIcon(email.status)}
                        <span className="text-sm font-medium text-card-foreground truncate">{email.type}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{email.subject}</p>
                      <p className="text-xs text-muted-foreground truncate">Para: {email.recipient}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground shrink-0 ml-2">
                      <p>{new Date(email.sentAt).toLocaleDateString('es-ES')}</p>
                      <p>{new Date(email.sentAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Mail className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No hay notificaciones enviadas</p>
            </div>
          )}
        </div>
      </div>

      {/* Información sobre templates */}
      <div className="bg-card rounded-xl shadow-lg p-6 border border-border/50">
        <h2 className="text-xl font-semibold text-card-foreground mb-4">Templates Disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="font-medium text-card-foreground">Para Pacientes</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Confirmación de citas</li>
              <li>• Recordatorios de citas</li>
              <li>• Cancelaciones</li>
              <li>• Mensajes de bienvenida</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="font-medium text-card-foreground">Para Profesionales</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Nueva cita asignada</li>
              <li>• Resumen diario de citas</li>
              <li>• Notificaciones del sistema</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm text-muted-foreground">
            <strong>Nota:</strong> Los templates incluyen diseño responsivo, colores de la marca, 
            información dinámica y formato de fecha/hora para Ciudad de México.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailManager;