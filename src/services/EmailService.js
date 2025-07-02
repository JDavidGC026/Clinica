// Servicio de email MEJORADO con PHPMailer
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
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: '',
      fromName: 'Clínica Delux'
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

  // Otros templates (recordatorio, cancelación, bienvenida)
  generateReminderTemplate(data, clinicName, clinicAddress, clinicPhone) {
    // Similar estructura pero con colores amarillos para recordatorio
    return this.generateConfirmationTemplate(data, clinicName, clinicAddress, clinicPhone)
      .replace(/linear-gradient\(135deg, #d946ef, #a855f7\)/g, 'linear-gradient(135deg, #f59e0b, #d97706)')
      .replace(/#d946ef/g, '#f59e0b')
      .replace(/Confirmación de Cita/g, '🔔 Recordatorio de Cita');
  }

  generateReminderText(data, clinicName) {
    return this.generateConfirmationText(data, clinicName).replace('Confirmación de Cita', 'Recordatorio de Cita');
  }

  generateCancellationTemplate(data, clinicName, clinicAddress, clinicPhone) {
    // Similar estructura pero con colores rojos para cancelación
    return this.generateConfirmationTemplate(data, clinicName, clinicAddress, clinicPhone)
      .replace(/linear-gradient\(135deg, #d946ef, #a855f7\)/g, 'linear-gradient(135deg, #ef4444, #dc2626)')
      .replace(/#d946ef/g, '#ef4444')
      .replace(/Confirmación de Cita/g, '❌ Cancelación de Cita');
  }

  generateCancellationText(data, clinicName) {
    return this.generateConfirmationText(data, clinicName).replace('Confirmación de Cita', 'Cancelación de Cita');
  }

  generateWelcomeTemplate(data, clinicName, clinicAddress, clinicPhone) {
    // Template de bienvenida con colores verdes
    return this.generateConfirmationTemplate(data, clinicName, clinicAddress, clinicPhone)
      .replace(/linear-gradient\(135deg, #d946ef, #a855f7\)/g, 'linear-gradient(135deg, #10b981, #059669)')
      .replace(/#d946ef/g, '#10b981')
      .replace(/Confirmación de Cita/g, '🎉 ¡Bienvenido/a!');
  }

  generateWelcomeText(data, clinicName) {
    return `¡Bienvenido/a a ${clinicName}!\n\nEstimado/a ${data.patient_name || 'Paciente'},\n\nNos complace tenerle como paciente.\n\n${clinicName}`;
  }

  // Método principal para enviar email con PHPMailer
  async sendEmail(type, recipientEmail, data = {}) {
    try {
      const template = this.getEmailTemplate(type, data);
      if (!template) {
        throw new Error(`Template de tipo '${type}' no encontrado`);
      }

      // Verificar configuración SMTP
      if (!this.config.smtpUser || !this.config.smtpPassword) {
        throw new Error('Configuración SMTP incompleta. Configure las credenciales en Configuración.');
      }

      // Preparar datos para PHPMailer
      const emailData = {
        to: recipientEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
        smtp_user: this.config.smtpUser,
        smtp_password: this.config.smtpPassword,
        from_email: this.config.fromEmail || this.config.smtpUser,
        from_name: this.config.fromName || 'Clínica Delux',
        type: type
      };

      // Enviar usando PHPMailer
      const response = await fetch('./api/phpmailer-send.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });

      const result = await response.json();

      if (result.success) {
        // Guardar en historial local también
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
          messageId: result.messageId,
          method: 'PHPMailer + Gmail SMTP'
        };
      } else {
        throw new Error(result.error || 'Error desconocido al enviar email');
      }

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

  // Configurar SMTP (para Gmail)
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('clinic_email_config', JSON.stringify(this.config));
  }

  getConfig() {
    return this.config;
  }

  // Verificar configuración
  isConfigured() {
    return !!(this.config.smtpUser && this.config.smtpPassword);
  }
}

export default new EmailService();