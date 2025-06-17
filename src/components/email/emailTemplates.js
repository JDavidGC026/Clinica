export const emailTemplates = {
  'appointment-confirmation': {
    name: 'Confirmación de Cita',
    subject: 'Confirmación de Cita - PsicoClinic',
    content: `Estimado/a {{patient_name}},

Su cita ha sido confirmada con los siguientes detalles:

Detalles: {{appointment_date}}
Psicólogo: {{psychologist_name}}

Saludos cordiales,
Equipo PsicoClinic`
  },
  'appointment-reminder': {
    name: 'Recordatorio de Cita',
    subject: 'Recordatorio de Cita - PsicoClinic',
    content: `Estimado/a {{patient_name}},

Le recordamos su próxima cita:

Detalles: {{appointment_date}}
Psicólogo: {{psychologist_name}}

Por favor, confirme su asistencia.

Saludos cordiales,
Equipo PsicoClinic`
  },
  'appointment-cancellation': {
    name: 'Cancelación de Cita',
    subject: 'Cancelación de Cita - PsicoClinic',
    content: `Estimado/a {{patient_name}},

Lamentamos informarle que su cita para {{appointment_date}} ha sido cancelada.

Nos pondremos en contacto para reprogramar.

Saludos cordiales,
Equipo PsicoClinic`
  },
  'welcome': {
    name: 'Bienvenida',
    subject: 'Bienvenido/a a PsicoClinic',
    content: `Estimado/a {{patient_name}},

¡Bienvenido/a a PsicoClinic!

Nos complace tenerle como paciente.

Saludos cordiales,
Equipo PsicoClinic`
  },
  'psychologist-new-appointment': {
    name: 'Nueva Cita Asignada',
    subject: 'Nueva Cita Asignada - PsicoClinic',
    content: `Hola {{psychologist_name}},

Se te ha asignado una nueva cita:

Paciente: {{patient_name}}
Fecha: {{appointment_date}}

Puedes ver los detalles en el calendario.

Saludos,
Equipo PsicoClinic`
  },
  'psychologist-daily-summary': {
    name: 'Resumen Diario de Citas',
    subject: 'Tu agenda para mañana - PsicoClinic',
    content: `Hola {{psychologist_name}},

Este es un resumen de tu agenda para mañana:

{{daily_schedule}}

¡Que tengas un excelente día!

Saludos,
Equipo PsicoClinic`
  },
};