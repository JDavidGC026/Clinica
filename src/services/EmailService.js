// Servicio de email que simula el envío usando templates internos
class EmailService {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    const saved = localStorage.getItem('clinic_email_config');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: '',
      fromName: ''
    };
  }

  // Templates de correo internos
  getEmailTemplate(type, data = {}) {
    const clinicName = localStorage.getItem('clinic_name') || 'Clínica Delux';
    const clinicAddress = localStorage.getItem('clinic_address') || 'Av. Paseo de la Reforma 123, Col. Juárez, CDMX, México';
    const clinicPhone = localStorage.getItem('clinic_phone') || '+52 55 1234 5678';
    
    const templates = {
      'appointment-confirmation': {
        subject: `Confirmación de Cita - ${clinicName}`,
        html: this.generateConfirmationTemplate(data, clinicName, clinicAddress, clinicPhone),
        text: this.generateConfirmationText(data, clinicName)
      },
      'appointment-reminder': {
        subject: `Recordatorio de Cita - ${clinicName}`,
        html: this.generateReminderTemplate(data, clinicName, clinicAddress, clinicPhone),
        text: this.generateReminderText(data, clinicName)
      },
      'appointment-cancellation': {
        subject: `Cancelación de Cita - ${clinicName}`,
        html: this.generateCancellationTemplate(data, clinicName, clinicAddress, clinicPhone),
        text: this.generateCancellationText(data, clinicName)
      },
      'welcome': {
        subject: `Bienvenido/a a ${clinicName}`,
        html: this.generateWelcomeTemplate(data, clinicName, clinicAddress, clinicPhone),
        text: this.generateWelcomeText(data, clinicName)
      },
      'professional-new-appointment': {
        subject: `Nueva Cita Asignada - ${clinicName}`,
        html: this.generateProfessionalNewAppointmentTemplate(data, clinicName),
        text: this.generateProfessionalNewAppointmentText(data, clinicName)
      },
      'professional-daily-summary': {
        subject: `Tu agenda para mañana - ${clinicName}`,
        html: this.generateProfessionalDailySummaryTemplate(data, clinicName),
        text: this.generateProfessionalDailySummaryText(data, clinicName)
      }
    };

    return templates[type] || null;
  }

  // Formatear fecha y hora para Ciudad de México
  formatMexicoDateTime(dateString, timeString = null) {
    const date = new Date(dateString + (timeString ? `T${timeString}:00` : 'T00:00:00'));
    
    const options = {
      timeZone: 'America/Mexico_City',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    };

    const timeOptions = {
      timeZone: 'America/Mexico_City',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };

    const formattedDate = date.toLocaleDateString('es-MX', options);
    const formattedTime = timeString ? date.toLocaleTimeString('es-MX', timeOptions) : '';
    
    return timeString ? `${formattedDate} a las ${formattedTime}` : formattedDate;
  }

  // Template HTML para confirmación de cita
  generateConfirmationTemplate(data, clinicName, clinicAddress, clinicPhone) {
    const appointmentDateTime = this.formatMexicoDateTime(data.appointment_date?.split(' ')[0], data.appointment_date?.split(' ')[3]);
    
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación de Cita</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #d946ef, #a855f7); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .appointment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d946ef; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: bold; color: #6b7280; }
          .detail-value { color: #111827; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px; }
          .timezone-note { background: #fef3c7; padding: 10px; border-radius: 6px; margin: 15px 0; font-size: 14px; color: #92400e; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${clinicName}</h1>
            <h2>Confirmación de Cita</h2>
          </div>
          <div class="content">
            <p>Estimado/a <strong>${data.patient_name || 'Paciente'}</strong>,</p>
            <p>Su cita ha sido confirmada exitosamente. A continuación encontrará los detalles:</p>
            
            <div class="appointment-details">
              <h3 style="margin-top: 0; color: #d946ef;">Detalles de la Cita</h3>
              <div class="detail-row">
                <span class="detail-label">Fecha y Hora:</span>
                <span class="detail-value">${appointmentDateTime || 'Por confirmar'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Profesional:</span>
                <span class="detail-value">${data.professional_name || 'Por asignar'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Tipo de Consulta:</span>
                <span class="detail-value">${data.appointment_type || 'Consulta General'}</span>
              </div>
              ${data.folio ? `
              <div class="detail-row">
                <span class="detail-label">Folio:</span>
                <span class="detail-value">${data.folio}</span>
              </div>
              ` : ''}
            </div>

            <div class="timezone-note">
              <strong>⏰ Zona Horaria:</strong> Todas las horas están en horario de Ciudad de México (GMT-6).
            </div>

            <p><strong>Instrucciones importantes:</strong></p>
            <ul>
              <li>Por favor llegue 15 minutos antes de su cita</li>
              <li>Traiga un documento de identificación válido</li>
              <li>Si necesita cancelar o reprogramar, contáctenos con al menos 24 horas de anticipación</li>
            </ul>

            <p>Si tiene alguna pregunta, no dude en contactarnos.</p>
          </div>
          <div class="footer">
            <p><strong>${clinicName}</strong></p>
            <p>${clinicAddress}</p>
            <p>Teléfono: ${clinicPhone}</p>
            <p>Este es un mensaje automático, por favor no responda a este correo.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Template texto plano para confirmación
  generateConfirmationText(data, clinicName) {
    const appointmentDateTime = this.formatMexicoDateTime(data.appointment_date?.split(' ')[0], data.appointment_date?.split(' ')[3]);
    
    return `
${clinicName} - Confirmación de Cita

Estimado/a ${data.patient_name || 'Paciente'},

Su cita ha sido confirmada exitosamente.

Detalles de la Cita:
- Fecha y Hora: ${appointmentDateTime || 'Por confirmar'} (Horario de Ciudad de México)
- Profesional: ${data.professional_name || 'Por asignar'}
- Tipo de Consulta: ${data.appointment_type || 'Consulta General'}
${data.folio ? `- Folio: ${data.folio}` : ''}

Instrucciones importantes:
- Por favor llegue 15 minutos antes de su cita
- Traiga un documento de identificación válido
- Si necesita cancelar o reprogramar, contáctenos con al menos 24 horas de anticipación

Gracias por confiar en nosotros.

${clinicName}
    `;
  }

  // Template HTML para recordatorio de cita
  generateReminderTemplate(data, clinicName, clinicAddress, clinicPhone) {
    const appointmentDateTime = this.formatMexicoDateTime(data.appointment_date?.split(' ')[0], data.appointment_date?.split(' ')[3]);
    
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recordatorio de Cita</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #fffbeb; padding: 30px; border-radius: 0 0 10px 10px; }
          .reminder-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
          .urgent { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #f59e0b; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px; }
          .timezone-note { background: #fef3c7; padding: 10px; border-radius: 6px; margin: 15px 0; font-size: 14px; color: #92400e; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${clinicName}</h1>
            <h2>🔔 Recordatorio de Cita</h2>
          </div>
          <div class="content">
            <p>Estimado/a <strong>${data.patient_name || 'Paciente'}</strong>,</p>
            
            <div class="urgent">
              <p><strong>⏰ Le recordamos su próxima cita:</strong></p>
            </div>
            
            <div class="reminder-box">
              <h3 style="margin-top: 0; color: #f59e0b;">Detalles de su Cita</h3>
              <p><strong>📅 Fecha y Hora:</strong> ${appointmentDateTime || 'Por confirmar'}</p>
              <p><strong>👨‍⚕️ Profesional:</strong> ${data.professional_name || 'Por asignar'}</p>
              <p><strong>🏥 Tipo de Consulta:</strong> ${data.appointment_type || 'Consulta General'}</p>
              ${data.folio ? `<p><strong>📋 Folio:</strong> ${data.folio}</p>` : ''}
            </div>

            <div class="timezone-note">
              <strong>⏰ Zona Horaria:</strong> Todas las horas están en horario de Ciudad de México (GMT-6).
            </div>

            <p><strong>Por favor confirme su asistencia respondiendo a este correo o llamando a nuestras oficinas.</strong></p>
            
            <p>Recordatorios importantes:</p>
            <ul>
              <li>Llegue 15 minutos antes de su cita</li>
              <li>Traiga su documento de identificación</li>
              <li>Si no puede asistir, avísenos con anticipación</li>
            </ul>
          </div>
          <div class="footer">
            <p><strong>${clinicName}</strong></p>
            <p>${clinicAddress}</p>
            <p>Teléfono: ${clinicPhone}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Template texto para recordatorio
  generateReminderText(data, clinicName) {
    const appointmentDateTime = this.formatMexicoDateTime(data.appointment_date?.split(' ')[0], data.appointment_date?.split(' ')[3]);
    
    return `
${clinicName} - Recordatorio de Cita

Estimado/a ${data.patient_name || 'Paciente'},

Le recordamos su próxima cita:

📅 Fecha y Hora: ${appointmentDateTime || 'Por confirmar'} (Horario de Ciudad de México)
👨‍⚕️ Profesional: ${data.professional_name || 'Por asignar'}
🏥 Tipo de Consulta: ${data.appointment_type || 'Consulta General'}
${data.folio ? `📋 Folio: ${data.folio}` : ''}

Por favor confirme su asistencia.

Recordatorios importantes:
- Llegue 15 minutos antes de su cita
- Traiga su documento de identificación
- Si no puede asistir, avísenos con anticipación

${clinicName}
    `;
  }

  // Template para cancelación
  generateCancellationTemplate(data, clinicName, clinicAddress, clinicPhone) {
    const appointmentDateTime = this.formatMexicoDateTime(data.appointment_date?.split(' ')[0], data.appointment_date?.split(' ')[3]);
    
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cancelación de Cita</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #fef2f2; padding: 30px; border-radius: 0 0 10px 10px; }
          .cancellation-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${clinicName}</h1>
            <h2>❌ Cancelación de Cita</h2>
          </div>
          <div class="content">
            <p>Estimado/a <strong>${data.patient_name || 'Paciente'}</strong>,</p>
            
            <div class="cancellation-box">
              <h3 style="margin-top: 0; color: #ef4444;">Cita Cancelada</h3>
              <p>Lamentamos informarle que su cita programada para el <strong>${appointmentDateTime || 'fecha programada'}</strong> con <strong>${data.professional_name || 'nuestro profesional'}</strong> ha sido cancelada.</p>
              ${data.cancellation_reason ? `<p><strong>Motivo:</strong> ${data.cancellation_reason}</p>` : ''}
            </div>

            <p>Nos pondremos en contacto con usted a la brevedad para reprogramar su cita en una nueva fecha y hora que sea conveniente para ambas partes.</p>
            
            <p>Si tiene alguna pregunta o desea reprogramar inmediatamente, no dude en contactarnos.</p>
            
            <p>Lamentamos cualquier inconveniente que esto pueda causar.</p>
          </div>
          <div class="footer">
            <p><strong>${clinicName}</strong></p>
            <p>${clinicAddress}</p>
            <p>Teléfono: ${clinicPhone}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateCancellationText(data, clinicName) {
    const appointmentDateTime = this.formatMexicoDateTime(data.appointment_date?.split(' ')[0], data.appointment_date?.split(' ')[3]);
    
    return `
${clinicName} - Cancelación de Cita

Estimado/a ${data.patient_name || 'Paciente'},

Lamentamos informarle que su cita programada para el ${appointmentDateTime || 'fecha programada'} con ${data.professional_name || 'nuestro profesional'} ha sido cancelada.

${data.cancellation_reason ? `Motivo: ${data.cancellation_reason}` : ''}

Nos pondremos en contacto con usted para reprogramar su cita.

Lamentamos cualquier inconveniente.

${clinicName}
    `;
  }

  // Template de bienvenida
  generateWelcomeTemplate(data, clinicName, clinicAddress, clinicPhone) {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenido</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 10px 10px; }
          .welcome-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 ¡Bienvenido/a!</h1>
            <h2>${clinicName}</h2>
          </div>
          <div class="content">
            <p>Estimado/a <strong>${data.patient_name || 'Paciente'}</strong>,</p>
            
            <div class="welcome-box">
              <h3 style="margin-top: 0; color: #10b981;">¡Bienvenido/a a nuestra familia!</h3>
              <p>Nos complace tenerle como paciente en <strong>${clinicName}</strong>. Estamos comprometidos a brindarle la mejor atención médica posible.</p>
            </div>

            <p><strong>¿Qué puede esperar de nosotros?</strong></p>
            <ul>
              <li>Atención personalizada y profesional</li>
              <li>Instalaciones modernas y equipamiento de última generación</li>
              <li>Un equipo médico altamente calificado</li>
              <li>Horarios flexibles para su comodidad</li>
            </ul>

            <p>Si tiene alguna pregunta o necesita programar una cita, no dude en contactarnos. Estamos aquí para ayudarle.</p>
          </div>
          <div class="footer">
            <p><strong>${clinicName}</strong></p>
            <p>${clinicAddress}</p>
            <p>Teléfono: ${clinicPhone}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateWelcomeText(data, clinicName) {
    return `
¡Bienvenido/a a ${clinicName}!

Estimado/a ${data.patient_name || 'Paciente'},

Nos complace tenerle como paciente. Estamos comprometidos a brindarle la mejor atención médica posible.

¿Qué puede esperar de nosotros?
- Atención personalizada y profesional
- Instalaciones modernas y equipamiento de última generación
- Un equipo médico altamente calificado
- Horarios flexibles para su comodidad

Si tiene alguna pregunta, no dude en contactarnos.

${clinicName}
    `;
  }

  // Templates para profesionales
  generateProfessionalNewAppointmentTemplate(data, clinicName) {
    const appointmentDateTime = this.formatMexicoDateTime(data.appointment_date?.split(' ')[0], data.appointment_date?.split(' ')[3]);
    
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nueva Cita Asignada</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #eff6ff; padding: 30px; border-radius: 0 0 10px 10px; }
          .appointment-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px; }
          .timezone-note { background: #fef3c7; padding: 10px; border-radius: 6px; margin: 15px 0; font-size: 14px; color: #92400e; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${clinicName}</h1>
            <h2>📅 Nueva Cita Asignada</h2>
          </div>
          <div class="content">
            <p>Hola <strong>${data.professional_name || 'Doctor/a'}</strong>,</p>
            
            <div class="appointment-box">
              <h3 style="margin-top: 0; color: #3b82f6;">Nueva Cita en su Agenda</h3>
              <p><strong>👤 Paciente:</strong> ${data.patient_name || 'Nombre del paciente'}</p>
              <p><strong>📅 Fecha y Hora:</strong> ${appointmentDateTime || 'Fecha y hora'}</p>
              <p><strong>🏥 Tipo de Consulta:</strong> ${data.appointment_type || 'Consulta General'}</p>
              ${data.folio ? `<p><strong>📋 Folio:</strong> ${data.folio}</p>` : ''}
              ${data.patient_notes ? `<p><strong>📝 Notas:</strong> ${data.patient_notes}</p>` : ''}
            </div>

            <div class="timezone-note">
              <strong>⏰ Zona Horaria:</strong> Todas las horas están en horario de Ciudad de México (GMT-6).
            </div>

            <p>Puede ver los detalles completos en el sistema de gestión de la clínica.</p>
            
            <p>¡Que tenga un excelente día!</p>
          </div>
          <div class="footer">
            <p><strong>${clinicName}</strong></p>
            <p>Sistema de Gestión Interno</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateProfessionalNewAppointmentText(data, clinicName) {
    const appointmentDateTime = this.formatMexicoDateTime(data.appointment_date?.split(' ')[0], data.appointment_date?.split(' ')[3]);
    
    return `
${clinicName} - Nueva Cita Asignada

Hola ${data.professional_name || 'Doctor/a'},

Se le ha asignado una nueva cita:

👤 Paciente: ${data.patient_name || 'Nombre del paciente'}
📅 Fecha y Hora: ${appointmentDateTime || 'Fecha y hora'} (Horario de Ciudad de México)
🏥 Tipo de Consulta: ${data.appointment_type || 'Consulta General'}
${data.folio ? `📋 Folio: ${data.folio}` : ''}
${data.patient_notes ? `📝 Notas: ${data.patient_notes}` : ''}

Puede ver los detalles completos en el sistema de gestión.

${clinicName}
    `;
  }

  generateProfessionalDailySummaryTemplate(data, clinicName) {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resumen Diario</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #faf5ff; padding: 30px; border-radius: 0 0 10px 10px; }
          .schedule-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
          .appointment-item { padding: 10px; margin: 5px 0; background: #f3f4f6; border-radius: 4px; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px; }
          .timezone-note { background: #fef3c7; padding: 10px; border-radius: 6px; margin: 15px 0; font-size: 14px; color: #92400e; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${clinicName}</h1>
            <h2>📋 Su Agenda para Mañana</h2>
          </div>
          <div class="content">
            <p>Hola <strong>${data.professional_name || 'Doctor/a'}</strong>,</p>
            
            <div class="schedule-box">
              <h3 style="margin-top: 0; color: #8b5cf6;">Resumen de Citas</h3>
              ${data.daily_schedule ? `
                <div style="white-space: pre-line; font-family: monospace; background: #f9fafb; padding: 15px; border-radius: 4px;">
${data.daily_schedule}
                </div>
              ` : '<p>No tiene citas programadas para mañana.</p>'}
            </div>

            <div class="timezone-note">
              <strong>⏰ Zona Horaria:</strong> Todas las horas están en horario de Ciudad de México (GMT-6).
            </div>

            <p>Recuerde revisar las notas de cada paciente antes de las consultas.</p>
            
            <p>¡Que tenga un excelente día!</p>
          </div>
          <div class="footer">
            <p><strong>${clinicName}</strong></p>
            <p>Sistema de Gestión Interno</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateProfessionalDailySummaryText(data, clinicName) {
    return `
${clinicName} - Su Agenda para Mañana

Hola ${data.professional_name || 'Doctor/a'},

Este es un resumen de su agenda para mañana (Horario de Ciudad de México):

${data.daily_schedule || 'No tiene citas programadas para mañana.'}

Recuerde revisar las notas de cada paciente antes de las consultas.

¡Que tenga un excelente día!

${clinicName}
    `;
  }

  // Método principal para enviar email
  async sendEmail(type, recipientEmail, data = {}) {
    try {
      const template = this.getEmailTemplate(type, data);
      if (!template) {
        throw new Error(`Template de tipo '${type}' no encontrado`);
      }

      // Simular envío de email (en producción aquí iría la lógica real de envío)
      console.log('📧 Enviando email:', {
        to: recipientEmail,
        subject: template.subject,
        type: type,
        data: data
      });

      // Simular delay de envío
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Guardar en historial
      const emailHistory = {
        id: Date.now(),
        type: type,
        recipient: recipientEmail,
        subject: template.subject,
        sentAt: new Date().toISOString(),
        status: 'enviado'
      };

      const currentHistory = JSON.parse(localStorage.getItem('clinic_email_history') || '[]');
      const updatedHistory = [emailHistory, ...currentHistory];
      localStorage.setItem('clinic_email_history', JSON.stringify(updatedHistory));
      
      // Disparar evento para actualizar UI
      window.dispatchEvent(new Event('storage'));

      return {
        success: true,
        messageId: `msg_${Date.now()}`,
        template: template
      };

    } catch (error) {
      console.error('Error enviando email:', error);
      
      // Guardar error en historial
      const emailHistory = {
        id: Date.now(),
        type: type,
        recipient: recipientEmail,
        subject: `Error: ${type}`,
        sentAt: new Date().toISOString(),
        status: 'error'
      };

      const currentHistory = JSON.parse(localStorage.getItem('clinic_email_history') || '[]');
      const updatedHistory = [emailHistory, ...currentHistory];
      localStorage.setItem('clinic_email_history', JSON.stringify(updatedHistory));
      
      throw error;
    }
  }

  // Método para previsualizar template
  previewTemplate(type, data = {}) {
    const template = this.getEmailTemplate(type, data);
    if (!template) {
      return null;
    }

    // Crear ventana de previsualización
    const previewWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
    previewWindow.document.write(template.html);
    previewWindow.document.close();
    
    return template;
  }

  // Configurar SMTP (para futuro uso real)
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('clinic_email_config', JSON.stringify(this.config));
  }

  getConfig() {
    return this.config;
  }
}

export default new EmailService();