// Servicio de email MEJORADO con soporte para base de datos
class EmailService {
  constructor() {
    this.config = null;
    this.loadConfigFromDatabase();
  }

  // Cargar configuración desde la base de datos
  async loadConfigFromDatabase() {
    try {
      const response = await fetch('./api/settings-correo.php', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const config = await response.json();
        this.config = config;
        
        // También guardar en localStorage como respaldo
        localStorage.setItem('clinic_email_config', JSON.stringify(config));
        
        return config;
      } else {
        // Fallback a localStorage si la BD no está disponible
        return this.loadConfigFromLocalStorage();
      }
    } catch (error) {
      console.error('Error cargando configuración de email desde BD:', error);
      // Fallback a localStorage
      return this.loadConfigFromLocalStorage();
    }
  }

  // Fallback: cargar desde localStorage
  loadConfigFromLocalStorage() {
    const saved = localStorage.getItem('clinic_email_config');
    if (saved) {
      this.config = JSON.parse(saved);
      return this.config;
    }
    
    // Configuración por defecto
    this.config = {
      smtp_host: 'smtp.gmail.com',
      smtp_port: '587',
      smtp_user: '',
      smtp_password: '',
      from_email: '',
      from_name: 'Clínica Delux',
      smtp_secure: 'tls',
      smtp_auth: '1'
    };
    
    return this.config;
  }

  // Cargar templates personalizados o usar por defecto
  loadCustomTemplates() {
    const saved = localStorage.getItem('clinic_email_templates');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error loading custom templates:', error);
        return {};
      }
    }
    return {};
  }

  // Templates de correo internos (ahora como fallback)
  getEmailTemplate(type, data = {}) {
    const clinicName = localStorage.getItem('clinic_name') || 'Clínica Delux';
    const clinicAddress = localStorage.getItem('clinic_address') || 'Av. Paseo de la Reforma 123, Col. Juárez, CDMX, México';
    const clinicPhone = localStorage.getItem('clinic_phone') || '+52 55 1234 5678';
    
    // Intentar cargar template personalizado primero
    const customTemplates = this.loadCustomTemplates();
    if (customTemplates[type]) {
      const customTemplate = customTemplates[type];
      return {
        subject: this.processTemplate(customTemplate.subject, data, clinicName, clinicAddress, clinicPhone),
        html: this.processTemplate(customTemplate.html, data, clinicName, clinicAddress, clinicPhone),
        text: this.processTemplate(customTemplate.text, data, clinicName, clinicAddress, clinicPhone)
      };
    }

    // Fallback a templates por defecto
    const templates = {
      'appointment-confirmation': {
        subject: `Confirmación de Cita - ${clinicName}`,
        html: this.generateConfirmationTemplate(data, clinicName, clinicAddress, clinicPhone),
        text: this.generateConfirmationText(data, clinicName)
      },
      'appointment-reminder-patient': {
        subject: `🔔 Recordatorio de Cita - ${clinicName}`,
        html: this.generatePatientReminderTemplate(data, clinicName, clinicAddress, clinicPhone),
        text: this.generatePatientReminderText(data, clinicName)
      },
      'appointment-reminder-professional': {
        subject: `📋 Recordatorio de Cita - ${clinicName}`,
        html: this.generateProfessionalReminderTemplate(data, clinicName, clinicAddress, clinicPhone),
        text: this.generateProfessionalReminderText(data, clinicName)
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

  // CORREGIDO: Procesar template con variables
  processTemplate(template, data, clinicName, clinicAddress, clinicPhone) {
    // NUEVA función para formatear fecha y hora correctamente
    const appointmentDateTime = this.formatAppointmentDateTime(data);
    
    const allData = {
      ...data,
      clinic_name: clinicName,
      clinic_address: clinicAddress,
      clinic_phone: clinicPhone,
      appointment_date: appointmentDateTime,
      patient_name: data.patient_name || 'Paciente',
      professional_name: data.professional_name || 'Por asignar',
      appointment_type: data.appointment_type || 'Consulta General',
      folio: data.folio || '',
      patient_email: data.patient_email || 'No disponible',
      patient_phone: data.patient_phone || 'No disponible'
    };

    let processed = template;
    Object.keys(allData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, allData[key] || '');
    });
    
    return processed;
  }

  // NUEVA: Función mejorada para formatear fecha y hora de citas
  formatAppointmentDateTime(data) {
    try {
      console.log('📅 Formateando fecha de cita:', data);
      
      // Extraer fecha y hora de diferentes formatos posibles
      let dateStr = '';
      let timeStr = '';
      
      // Caso 1: appointment_date contiene fecha y hora separadas por " a las "
      if (data.appointment_date && data.appointment_date.includes(' a las ')) {
        const parts = data.appointment_date.split(' a las ');
        dateStr = parts[0];
        timeStr = parts[1];
      }
      // Caso 2: appointment_date solo contiene fecha, time está separado
      else if (data.appointment_date && data.time) {
        dateStr = data.appointment_date;
        timeStr = data.time;
      }
      // Caso 3: date y time están separados
      else if (data.date && data.time) {
        dateStr = data.date;
        timeStr = data.time;
      }
      // Caso 4: appointment_date contiene solo fecha
      else if (data.appointment_date) {
        dateStr = data.appointment_date;
        timeStr = '';
      }
      // Caso 5: date sin time
      else if (data.date) {
        dateStr = data.date;
        timeStr = '';
      }
      
      console.log('📅 Fecha extraída:', { dateStr, timeStr });
      
      // Validar y procesar fecha
      if (!dateStr) {
        return 'Fecha por confirmar';
      }
      
      // Limpiar fecha (remover tiempo si viene junto)
      if (dateStr.includes('T')) {
        dateStr = dateStr.split('T')[0];
      }
      
      // Validar formato de fecha YYYY-MM-DD
      if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        console.warn('⚠️ Formato de fecha no válido:', dateStr);
        return dateStr + (timeStr ? ` a las ${timeStr}` : '');
      }
      
      // Crear fecha sin problemas de zona horaria
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      // Verificar que la fecha sea válida
      if (isNaN(date.getTime())) {
        console.warn('⚠️ Fecha inválida:', dateStr);
        return dateStr + (timeStr ? ` a las ${timeStr}` : '');
      }
      
      // Formatear fecha en español para México
      const dateOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Mexico_City'
      };
      
      const formattedDate = date.toLocaleDateString('es-MX', dateOptions);
      
      // Procesar hora si existe
      if (timeStr && timeStr.trim()) {
        // Limpiar hora
        timeStr = timeStr.trim();
        
        // Validar formato de hora HH:MM
        if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
          const [hours, minutes] = timeStr.split(':').map(Number);
          
          // Crear fecha con hora para formatear correctamente
          const dateWithTime = new Date(year, month - 1, day, hours, minutes);
          
          if (!isNaN(dateWithTime.getTime())) {
            const timeOptions = {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              timeZone: 'America/Mexico_City'
            };
            
            const formattedTime = dateWithTime.toLocaleTimeString('es-MX', timeOptions);
            return `${formattedDate} a las ${formattedTime}`;
          }
        }
        
        // Si la hora no se puede formatear, usar tal como viene
        return `${formattedDate} a las ${timeStr}`;
      }
      
      // Solo fecha sin hora
      return formattedDate;
      
    } catch (error) {
      console.error('❌ Error formateando fecha de cita:', error, data);
      
      // Fallback: devolver datos originales
      if (data.appointment_date) {
        return data.appointment_date;
      } else if (data.date && data.time) {
        return `${data.date} a las ${data.time}`;
      } else if (data.date) {
        return data.date;
      }
      
      return 'Fecha por confirmar';
    }
  }

  // OBSOLETO: Mantener por compatibilidad pero no usar
  formatMexicoDateTime(dateString, timeString = null) {
    console.warn('⚠️ formatMexicoDateTime está obsoleto, usar formatAppointmentDateTime');
    return this.formatAppointmentDateTime({ 
      date: dateString, 
      time: timeString 
    });
  }

  // Template HTML para confirmación de cita (CORREGIDO)
  generateConfirmationTemplate(data, clinicName, clinicAddress, clinicPhone) {
    const appointmentDateTime = this.formatAppointmentDateTime(data);
    
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
            <h2>✅ Confirmación de Cita</h2>
          </div>
          <div class="content">
            <p>Estimado/a <strong>${data.patient_name || 'Paciente'}</strong>,</p>
            <p>Su cita ha sido confirmada exitosamente. A continuación encontrará los detalles:</p>
            
            <div class="appointment-details">
              <h3 style="margin-top: 0; color: #d946ef;">Detalles de la Cita</h3>
              <div class="detail-row">
                <span class="detail-label">Fecha y Hora:</span>
                <span class="detail-value">${appointmentDateTime}</span>
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

  // Template de recordatorio para PACIENTES (CORREGIDO)
  generatePatientReminderTemplate(data, clinicName, clinicAddress, clinicPhone) {
    const appointmentDateTime = this.formatAppointmentDateTime(data);
    
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
          .appointment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: bold; color: #6b7280; }
          .detail-value { color: #111827; }
          .reminder-box { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #f59e0b; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px; }
          .timezone-note { background: #fef3c7; padding: 10px; border-radius: 6px; margin: 15px 0; font-size: 14px; color: #92400e; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 ${clinicName}</h1>
            <h2>Recordatorio de Cita</h2>
          </div>
          <div class="content">
            <p>Estimado/a <strong>${data.patient_name || 'Paciente'}</strong>,</p>
            
            <div class="reminder-box">
              <h3 style="margin-top: 0; color: #d97706; text-align: center;">⏰ Su cita está próxima</h3>
              <p style="text-align: center; font-size: 16px; margin: 0;">
                Le recordamos que tiene una cita programada para <strong>${appointmentDateTime}</strong>
              </p>
            </div>
            
            <div class="appointment-details">
              <h3 style="margin-top: 0; color: #f59e0b;">Detalles de la Cita</h3>
              <div class="detail-row">
                <span class="detail-label">Fecha y Hora:</span>
                <span class="detail-value">${appointmentDateTime}</span>
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

            <p><strong>📋 Recordatorios importantes:</strong></p>
            <ul>
              <li>✅ Llegue 15 minutos antes de su cita</li>
              <li>🆔 Traiga un documento de identificación válido</li>
              <li>💊 Si toma medicamentos, traiga la lista actualizada</li>
              <li>📞 Si no puede asistir, llámenos con anticipación</li>
            </ul>

            <p>Esperamos verle pronto. Si tiene alguna pregunta, no dude en contactarnos.</p>
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

  // Template de recordatorio para PROFESIONALES (CORREGIDO)
  generateProfessionalReminderTemplate(data, clinicName, clinicAddress, clinicPhone) {
    const appointmentDateTime = this.formatAppointmentDateTime(data);
    
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recordatorio de Cita - Profesional</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f0f9ff; padding: 30px; border-radius: 0 0 10px 10px; }
          .appointment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .patient-info { background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: bold; color: #6b7280; }
          .detail-value { color: #111827; }
          .reminder-box { background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #3b82f6; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px; }
          .timezone-note { background: #fef3c7; padding: 10px; border-radius: 6px; margin: 15px 0; font-size: 14px; color: #92400e; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 ${clinicName}</h1>
            <h2>Recordatorio de Cita</h2>
          </div>
          <div class="content">
            <p>Estimado/a <strong>Dr(a). ${data.professional_name || 'Profesional'}</strong>,</p>
            
            <div class="reminder-box">
              <h3 style="margin-top: 0; color: #1d4ed8; text-align: center;">📅 Próxima Cita Programada</h3>
              <p style="text-align: center; font-size: 16px; margin: 0;">
                Tiene una cita programada para <strong>${appointmentDateTime}</strong>
              </p>
            </div>
            
            <div class="appointment-details">
              <h3 style="margin-top: 0; color: #3b82f6;">Detalles de la Cita</h3>
              <div class="detail-row">
                <span class="detail-label">Fecha y Hora:</span>
                <span class="detail-value">${appointmentDateTime}</span>
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

            <div class="patient-info">
              <h3 style="margin-top: 0; color: #0369a1;">👤 Información del Paciente</h3>
              <div class="detail-row">
                <span class="detail-label">Nombre:</span>
                <span class="detail-value">${data.patient_name || 'No disponible'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${data.patient_email || 'No disponible'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Teléfono:</span>
                <span class="detail-value">${data.patient_phone || 'No disponible'}</span>
              </div>
            </div>

            <div class="timezone-note">
              <strong>⏰ Zona Horaria:</strong> Todas las horas están en horario de Ciudad de México (GMT-6).
            </div>

            <p><strong>📋 Recordatorios profesionales:</strong></p>
            <ul>
              <li>📁 Revise el historial del paciente antes de la cita</li>
              <li>🩺 Prepare el material necesario para la consulta</li>
              <li>📞 Si hay algún cambio, notifique al paciente con anticipación</li>
              <li>📝 Tenga listos los formatos de notas clínicas</li>
            </ul>

            <p>Gracias por su dedicación profesional.</p>
          </div>
          <div class="footer">
            <p><strong>${clinicName}</strong></p>
            <p>${clinicAddress}</p>
            <p>Teléfono: ${clinicPhone}</p>
            <p>Este es un mensaje automático del sistema de gestión.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Template texto plano para confirmación (CORREGIDO)
  generateConfirmationText(data, clinicName) {
    const appointmentDateTime = this.formatAppointmentDateTime(data);
    
    return `
${clinicName} - Confirmación de Cita

Estimado/a ${data.patient_name || 'Paciente'},

Su cita ha sido confirmada exitosamente.

Detalles de la Cita:
- Fecha y Hora: ${appointmentDateTime} (Horario de Ciudad de México)
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

  // Templates texto plano para recordatorios (CORREGIDOS)
  generatePatientReminderText(data, clinicName) {
    const appointmentDateTime = this.formatAppointmentDateTime(data);
    
    return `
🔔 ${clinicName} - Recordatorio de Cita

Estimado/a ${data.patient_name || 'Paciente'},

Le recordamos que tiene una cita programada para ${appointmentDateTime}.

Detalles:
- Profesional: ${data.professional_name || 'Por asignar'}
- Tipo: ${data.appointment_type || 'Consulta General'}
${data.folio ? `- Folio: ${data.folio}` : ''}

Recordatorios:
- Llegue 15 minutos antes
- Traiga identificación
- Si toma medicamentos, traiga la lista

${clinicName}
    `;
  }

  generateProfessionalReminderText(data, clinicName) {
    const appointmentDateTime = this.formatAppointmentDateTime(data);
    
    return `
📋 ${clinicName} - Recordatorio de Cita

Dr(a). ${data.professional_name || 'Profesional'},

Tiene una cita programada para ${appointmentDateTime}.

Paciente: ${data.patient_name || 'No disponible'}
Tipo: ${data.appointment_type || 'Consulta General'}
${data.folio ? `Folio: ${data.folio}` : ''}

Prepare el material necesario para la consulta.

${clinicName}
    `;
  }

  // Otros templates (cancelación, bienvenida) - CORREGIDOS
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

  // Método principal para enviar email con configuración desde BD
  async sendEmail(type, recipientEmail, data = {}) {
    try {
      console.log('📧 Enviando email:', { type, recipientEmail, data });
      
      const template = this.getEmailTemplate(type, data);
      if (!template) {
        throw new Error(`Template de tipo '${type}' no encontrado`);
      }

      // Cargar configuración desde BD
      await this.loadConfigFromDatabase();

      // Verificar configuración SMTP
      if (!this.config || !this.config.smtp_user || !this.config.smtp_password) {
        throw new Error('Configuración SMTP incompleta. Configure las credenciales en Configuración.');
      }

      // Preparar datos para PHPMailer
      const emailData = {
        to: recipientEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
        smtp_user: this.config.smtp_user,
        smtp_password: this.config.smtp_password,
        from_email: this.config.from_email || this.config.smtp_user,
        from_name: this.config.from_name || 'Clínica Delux',
        type: type
      };

      console.log('📧 Template generado:', {
        subject: template.subject,
        appointmentDateTime: this.formatAppointmentDateTime(data)
      });

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
          method: 'PHPMailer + Gmail SMTP (BD Config)'
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

  // Configurar SMTP (ahora guarda en BD)
  async updateConfig(newConfig) {
    try {
      const response = await fetch('./api/settings-correo.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConfig)
      });

      const result = await response.json();
      
      if (result.success) {
        // Actualizar configuración local
        this.config = { ...this.config, ...newConfig };
        
        // También guardar en localStorage como respaldo
        localStorage.setItem('clinic_email_config', JSON.stringify(this.config));
        
        return result;
      } else {
        throw new Error(result.error || 'Error guardando configuración');
      }
    } catch (error) {
      console.error('Error guardando configuración SMTP:', error);
      
      // Fallback: guardar solo en localStorage
      this.config = { ...this.config, ...newConfig };
      localStorage.setItem('clinic_email_config', JSON.stringify(this.config));
      
      throw error;
    }
  }

  async getConfig() {
    if (!this.config) {
      await this.loadConfigFromDatabase();
    }
    return this.config;
  }

  // Verificar configuración
  async isConfigured() {
    if (!this.config) {
      await this.loadConfigFromDatabase();
    }
    return !!(this.config && this.config.smtp_user && this.config.smtp_password);
  }

  // Inicializar base de datos
  async initializeDatabase() {
    try {
      const response = await fetch('./api/init-database.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error inicializando base de datos:', error);
      throw error;
    }
  }
}

export default new EmailService();