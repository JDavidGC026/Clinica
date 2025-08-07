// Templates de email disponibles en el sistema
export const emailTemplates = {
  'appointment-confirmation': {
    name: 'Confirmación de Cita',
    description: 'Confirma una cita programada'
  },
  'appointment-reminder': {
    name: 'Recordatorio de Cita', 
    description: 'Recuerda una cita próxima'
  },
  'appointment-cancellation': {
    name: 'Cancelación de Cita',
    description: 'Notifica cancelación de cita'
  },
  'welcome': {
    name: 'Bienvenida',
    description: 'Mensaje de bienvenida para nuevos pacientes'
  },
  'professional-new-appointment': {
    name: 'Nueva Cita Asignada',
    description: 'Notifica sobre una nueva cita asignada'
  },
  'professional-daily-summary': {
    name: 'Resumen Diario de Citas',
    description: 'Envía el resumen de citas del día siguiente'
  }
};

export default emailTemplates;