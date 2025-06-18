// Este archivo ya no es necesario ya que los templates están integrados en EmailService
// Se mantiene para compatibilidad con imports existentes

export const emailTemplates = {
  'appointment-confirmation': {
    name: 'Confirmación de Cita',
    subject: 'Confirmación de Cita - Clínica',
  },
  'appointment-reminder': {
    name: 'Recordatorio de Cita',
    subject: 'Recordatorio de Cita - Clínica',
  },
  'appointment-cancellation': {
    name: 'Cancelación de Cita',
    subject: 'Cancelación de Cita - Clínica',
  },
  'welcome': {
    name: 'Bienvenida',
    subject: 'Bienvenido/a a la Clínica',
  },
  'professional-new-appointment': {
    name: 'Nueva Cita Asignada',
    subject: 'Nueva Cita Asignada - Clínica',
  },
  'professional-daily-summary': {
    name: 'Resumen Diario de Citas',
    subject: 'Tu agenda para mañana - Clínica',
  },
};