import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail, CheckCircle, Clock, AlertCircle, Eye, TestTube, Users, UserCheck, Calendar, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import EmailService from '@/services/EmailService';
import apiService from '@/services/ApiService';

const EmailManager = () => {
  const [emailHistory, setEmailHistory] = useState([]);
  const [testEmail, setTestEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointments, setSelectedAppointments] = useState([]);
  const [reminderType, setReminderType] = useState('patient'); // 'patient' o 'professional'
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);

  useEffect(() => {
    loadEmailHistory();
    loadAppointments();
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

  const loadAppointments = async () => {
    setIsLoadingAppointments(true);
    try {
      const appointmentsData = await apiService.getAppointments();
      console.log('📅 Total de citas obtenidas:', appointmentsData.length);
      console.log('📅 Citas completas:', appointmentsData);
      
      // Filtrar solo citas programadas y futuras
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Resetear horas para comparación de fecha
      
      console.log('📅 Fecha de hoy:', today.toISOString());
      
      const upcomingAppointments = appointmentsData.filter(apt => {
        const aptDate = new Date(apt.date);
        console.log(`📅 Evaluando cita: ${apt.patient_name}, fecha: ${apt.date}, estado: ${apt.status}, fecha parseada: ${aptDate.toISOString()}`);
        
        const isScheduled = apt.status === 'programada';
        const isFuture = aptDate >= today;
        
        console.log(`📅 Es programada: ${isScheduled}, Es futura: ${isFuture}`);
        
        return isScheduled && isFuture;
      }).sort((a, b) => new Date(a.date) - new Date(b.date));
      
      console.log('📅 Citas próximas filtradas:', upcomingAppointments.length);
      console.log('📅 Citas próximas:', upcomingAppointments);
      
      setAppointments(upcomingAppointments);
      
      toast({
        title: "Citas actualizadas",
        description: `Se encontraron ${upcomingAppointments.length} citas próximas.`,
      });
      
    } catch (error) {
      console.error('❌ Error cargando citas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las citas: " + (error.message || 'Error desconocido'),
        variant: "destructive"
      });
      setAppointments([]);
    } finally {
      setIsLoadingAppointments(false);
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

  const handleAppointmentSelection = (appointmentId) => {
    setSelectedAppointments(prev => {
      if (prev.includes(appointmentId)) {
        return prev.filter(id => id !== appointmentId);
      } else {
        return [...prev, appointmentId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedAppointments.length === appointments.length) {
      setSelectedAppointments([]);
    } else {
      setSelectedAppointments(appointments.map(apt => apt.id));
    }
  };

  const handleSendReminders = async () => {
    if (selectedAppointments.length === 0) {
      toast({
        title: 'Error',
        description: 'Selecciona al menos una cita para enviar recordatorios.',
        variant: 'destructive'
      });
      return;
    }

    if (!EmailService.isConfigured()) {
      toast({
        title: 'Configuración requerida',
        description: 'Configure las credenciales SMTP en Configuración primero.',
        variant: 'destructive'
      });
      return;
    }

    setIsSendingReminders(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const appointmentId of selectedAppointments) {
        const appointment = appointments.find(apt => apt.id === appointmentId);
        if (!appointment) continue;

        try {
          const emailData = {
            patient_name: appointment.patient_name,
            professional_name: appointment.professional_name,
            appointment_date: `${appointment.date} a las ${appointment.time}`,
            appointment_type: appointment.type,
            folio: appointment.folio,
            patient_email: appointment.patient_email,
            patient_phone: appointment.patient_phone
          };

          if (reminderType === 'patient') {
            if (appointment.patient_email) {
              await EmailService.sendEmail('appointment-reminder-patient', appointment.patient_email, emailData);
              successCount++;
            }
          } else if (reminderType === 'professional') {
            if (appointment.professional_info?.email) {
              await EmailService.sendEmail('appointment-reminder-professional', appointment.professional_info.email, emailData);
              successCount++;
            }
          }

          // Pequeña pausa entre envíos para no sobrecargar el servidor
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`Error enviando recordatorio para cita ${appointmentId}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: `✅ Recordatorios enviados`,
          description: `${successCount} recordatorios enviados exitosamente${errorCount > 0 ? `, ${errorCount} fallaron` : ''}.`,
        });
      }

      if (errorCount > 0 && successCount === 0) {
        toast({
          title: 'Error',
          description: `No se pudieron enviar los recordatorios (${errorCount} errores).`,
          variant: 'destructive'
        });
      }

      setSelectedAppointments([]);
      loadEmailHistory();

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error general al enviar recordatorios.',
        variant: 'destructive'
      });
    } finally {
      setIsSendingReminders(false);
    }
  };

  const stats = {
    total: emailHistory.length,
    confirmations: emailHistory.filter(e => e.type === 'appointment-confirmation').length,
    reminders: emailHistory.filter(e => e.type?.includes('reminder')).length,
    today: emailHistory.filter(e => new Date(e.sentAt).toDateString() === new Date().toDateString()).length,
  };

  return (
    <div className="space-y-6 overflow-x-auto">
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

      {/* Recordatorios de Citas */}
      <div className="bg-card rounded-xl shadow-lg p-6 border border-border/50">
        <h2 className="text-xl font-semibold text-card-foreground mb-6 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-primary" />
          Enviar Recordatorios de Citas
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-muted-foreground mb-2">Tipo de Recordatorio</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="patient"
                    checked={reminderType === 'patient'}
                    onChange={(e) => setReminderType(e.target.value)}
                    className="mr-2"
                  />
                  <Users className="w-4 h-4 mr-1" />
                  Para Pacientes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="professional"
                    checked={reminderType === 'professional'}
                    onChange={(e) => setReminderType(e.target.value)}
                    className="mr-2"
                  />
                  <UserCheck className="w-4 h-4 mr-1" />
                  Para Profesionales
                </label>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Citas Próximas ({appointments.length})
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={loadAppointments}
                    disabled={isLoadingAppointments}
                    title="Refrescar citas"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingAppointments ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedAppointments.length === appointments.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                  </Button>
                </div>
              </div>
              
              <div className="max-h-64 overflow-y-auto border border-border rounded-lg">
                {appointments.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <div className="mb-2">📅 No hay citas próximas programadas</div>
                    <div className="text-xs">
                      Para que aparezcan citas aquí deben:
                      <br />• Tener estado "programada"
                      <br />• Tener fecha de hoy o futura
                      <br />• Presione el botón 🔄 para refrescar
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {appointments.map(appointment => (
                      <label
                        key={appointment.id}
                        className="flex items-center p-3 hover:bg-muted/30 rounded-lg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAppointments.includes(appointment.id)}
                          onChange={() => handleAppointmentSelection(appointment.id)}
                          className="mr-3"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-card-foreground truncate">
                              {appointment.patient_name}
                            </p>
                            <span className="text-xs text-muted-foreground ml-2">
                              {new Date(appointment.date).toLocaleDateString('es-ES')} {appointment.time}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {appointment.professional_name} - {appointment.type}
                          </p>
                          {reminderType === 'patient' && !appointment.patient_email && (
                            <p className="text-xs text-red-500">Sin email</p>
                          )}
                          {reminderType === 'professional' && !appointment.professional_info?.email && (
                            <p className="text-xs text-red-500">Sin email profesional</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleSendReminders}
              disabled={isSendingReminders || selectedAppointments.length === 0}
              className="w-full button-primary-gradient"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSendingReminders 
                ? `Enviando... (${selectedAppointments.length})` 
                : `Enviar Recordatorios (${selectedAppointments.length})`
              }
            </Button>
          </div>

          <div>
            <h3 className="text-lg font-medium text-card-foreground mb-4">Vista Previa de Templates</h3>
            <div className="space-y-3">
              <Button
                onClick={() => EmailService.previewTemplate('appointment-reminder-patient', {
                  patient_name: 'Juan Pérez (Ejemplo)',
                  professional_name: 'Dr. García (Ejemplo)',
                  appointment_date: '15 de enero de 2024 a las 10:00',
                  appointment_type: 'Consulta General',
                  folio: 'CDX-240115-TEST'
                })}
                variant="outline"
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Template para Pacientes
              </Button>
              
              <Button
                onClick={() => EmailService.previewTemplate('appointment-reminder-professional', {
                  patient_name: 'Juan Pérez (Ejemplo)',
                  professional_name: 'Dr. García (Ejemplo)',
                  appointment_date: '15 de enero de 2024 a las 10:00',
                  appointment_type: 'Consulta General',
                  folio: 'CDX-240115-TEST',
                  patient_email: 'juan@ejemplo.com',
                  patient_phone: '+52 55 1234 5678'
                })}
                variant="outline"
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Template para Profesionales
              </Button>
            </div>
          </div>
        </div>
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
                        <span className="text-sm font-medium text-card-foreground truncate">
                          {email.type === 'appointment-reminder-patient' ? '🔔 Recordatorio Paciente' :
                           email.type === 'appointment-reminder-professional' ? '📋 Recordatorio Profesional' :
                           email.type}
                        </span>
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
              <li>• ✅ Confirmación de citas</li>
              <li>• 🔔 Recordatorios de citas (diseño amarillo)</li>
              <li>• ❌ Cancelaciones</li>
              <li>• 🎉 Mensajes de bienvenida</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="font-medium text-card-foreground">Para Profesionales</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 📋 Recordatorios de citas (diseño azul)</li>
              <li>• 👤 Información detallada del paciente</li>
              <li>• 📅 Resumen de citas del día</li>
              <li>• 🩺 Recordatorios profesionales</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm text-muted-foreground">
            <strong>Nota:</strong> Los templates incluyen diseño responsivo, colores diferenciados por tipo, 
            información dinámica y formato de fecha/hora para Ciudad de México. Los recordatorios para profesionales
            incluyen información adicional del paciente para facilitar la preparación de la consulta.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailManager;