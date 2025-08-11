import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Eye, RotateCcw, Copy, FileText, Mail, Users, UserCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const EmailTemplateEditor = () => {
  const [templates, setTemplates] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState('appointment-confirmation');
  const [editingTemplate, setEditingTemplate] = useState({ subject: '', html: '', text: '' });
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState({
    patient_name: 'Juan Pérez (Ejemplo)',
    professional_name: 'Dr. García (Ejemplo)',
    appointment_date: '15 de enero de 2024 a las 10:00',
    appointment_type: 'Consulta General',
    folio: 'CDX-240115-TEST',
    patient_email: 'juan@ejemplo.com',
    patient_phone: '+52 55 1234 5678'
  });

  const templateTypes = [
    {
      id: 'appointment-confirmation',
      name: 'Confirmación de Citas',
      icon: FileText,
      description: 'Email enviado cuando se confirma una cita',
      color: 'text-green-600'
    },
    {
      id: 'appointment-reminder-patient',
      name: 'Recordatorio para Pacientes',
      icon: Users,
      description: 'Recordatorio de cita enviado a pacientes',
      color: 'text-yellow-600'
    },
    {
      id: 'appointment-reminder-professional',
      name: 'Recordatorio para Profesionales',
      icon: UserCheck,
      description: 'Recordatorio de cita enviado a profesionales',
      color: 'text-blue-600'
    },
    {
      id: 'appointment-cancellation',
      name: 'Cancelación de Citas',
      icon: X,
      description: 'Email enviado cuando se cancela una cita',
      color: 'text-red-600'
    },
    {
      id: 'welcome',
      name: 'Bienvenida',
      icon: Mail,
      description: 'Email de bienvenida para nuevos pacientes',
      color: 'text-purple-600'
    }
  ];

  const defaultTemplates = {
    'appointment-confirmation': {
      subject: 'Confirmación de Cita - {{clinic_name}}',
      html: `<!DOCTYPE html>
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
      <h1>{{clinic_name}}</h1>
      <h2>✅ Confirmación de Cita</h2>
    </div>
    <div class="content">
      <p>Estimado/a <strong>{{patient_name}}</strong>,</p>
      <p>Su cita ha sido confirmada exitosamente. A continuación encontrará los detalles:</p>
      
      <div class="appointment-details">
        <h3 style="margin-top: 0; color: #d946ef;">Detalles de la Cita</h3>
        <div class="detail-row">
          <span class="detail-label">Fecha y Hora:</span>
          <span class="detail-value">{{appointment_date}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Profesional:</span>
          <span class="detail-value">{{professional_name}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Tipo de Consulta:</span>
          <span class="detail-value">{{appointment_type}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Folio:</span>
          <span class="detail-value">{{folio}}</span>
        </div>
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
      <p><strong>{{clinic_name}}</strong></p>
      <p>{{clinic_address}}</p>
      <p>Teléfono: {{clinic_phone}}</p>
      <p>Este es un mensaje automático, por favor no responda a este correo.</p>
    </div>
  </div>
</body>
</html>`,
      text: `{{clinic_name}} - Confirmación de Cita

Estimado/a {{patient_name}},

Su cita ha sido confirmada exitosamente.

Detalles de la Cita:
- Fecha y Hora: {{appointment_date}} (Horario de Ciudad de México)
- Profesional: {{professional_name}}
- Tipo de Consulta: {{appointment_type}}
- Folio: {{folio}}

Instrucciones importantes:
- Por favor llegue 15 minutos antes de su cita
- Traiga un documento de identificación válido
- Si necesita cancelar o reprogramar, contáctenos con al menos 24 horas de anticipación

Gracias por confiar en nosotros.

{{clinic_name}}`
    },
    'appointment-reminder-patient': {
      subject: '🔔 Recordatorio de Cita - {{clinic_name}}',
      html: `<!DOCTYPE html>
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 {{clinic_name}}</h1>
      <h2>Recordatorio de Cita</h2>
    </div>
    <div class="content">
      <p>Estimado/a <strong>{{patient_name}}</strong>,</p>
      
      <div class="reminder-box">
        <h3 style="margin-top: 0; color: #d97706; text-align: center;">⏰ Su cita está próxima</h3>
        <p style="text-align: center; font-size: 16px; margin: 0;">
          Le recordamos que tiene una cita programada para <strong>{{appointment_date}}</strong>
        </p>
      </div>
      
      <div class="appointment-details">
        <h3 style="margin-top: 0; color: #f59e0b;">Detalles de la Cita</h3>
        <div class="detail-row">
          <span class="detail-label">Fecha y Hora:</span>
          <span class="detail-value">{{appointment_date}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Profesional:</span>
          <span class="detail-value">{{professional_name}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Tipo de Consulta:</span>
          <span class="detail-value">{{appointment_type}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Folio:</span>
          <span class="detail-value">{{folio}}</span>
        </div>
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
      <p><strong>{{clinic_name}}</strong></p>
      <p>{{clinic_address}}</p>
      <p>Teléfono: {{clinic_phone}}</p>
    </div>
  </div>
</body>
</html>`,
      text: `🔔 {{clinic_name}} - Recordatorio de Cita

Estimado/a {{patient_name}},

Le recordamos que tiene una cita programada para {{appointment_date}}.

Detalles:
- Profesional: {{professional_name}}
- Tipo: {{appointment_type}}
- Folio: {{folio}}

Recordatorios:
- Llegue 15 minutos antes
- Traiga identificación
- Si toma medicamentos, traiga la lista

{{clinic_name}}`
    },
    'appointment-reminder-professional': {
      subject: '📋 Recordatorio de Cita - {{clinic_name}}',
      html: `<!DOCTYPE html>
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 {{clinic_name}}</h1>
      <h2>Recordatorio de Cita</h2>
    </div>
    <div class="content">
      <p>Estimado/a <strong>Dr(a). {{professional_name}}</strong>,</p>
      
      <div class="reminder-box">
        <h3 style="margin-top: 0; color: #1d4ed8; text-align: center;">📅 Próxima Cita Programada</h3>
        <p style="text-align: center; font-size: 16px; margin: 0;">
          Tiene una cita programada para <strong>{{appointment_date}}</strong>
        </p>
      </div>
      
      <div class="appointment-details">
        <h3 style="margin-top: 0; color: #3b82f6;">Detalles de la Cita</h3>
        <div class="detail-row">
          <span class="detail-label">Fecha y Hora:</span>
          <span class="detail-value">{{appointment_date}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Tipo de Consulta:</span>
          <span class="detail-value">{{appointment_type}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Folio:</span>
          <span class="detail-value">{{folio}}</span>
        </div>
      </div>

      <div class="patient-info">
        <h3 style="margin-top: 0; color: #0369a1;">👤 Información del Paciente</h3>
        <div class="detail-row">
          <span class="detail-label">Nombre:</span>
          <span class="detail-value">{{patient_name}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value">{{patient_email}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Teléfono:</span>
          <span class="detail-value">{{patient_phone}}</span>
        </div>
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
      <p><strong>{{clinic_name}}</strong></p>
      <p>{{clinic_address}}</p>
      <p>Teléfono: {{clinic_phone}}</p>
    </div>
  </div>
</body>
</html>`,
      text: `📋 {{clinic_name}} - Recordatorio de Cita

Dr(a). {{professional_name}},

Tiene una cita programada para {{appointment_date}}.

Paciente: {{patient_name}}
Tipo: {{appointment_type}}
Folio: {{folio}}

Prepare el material necesario para la consulta.

{{clinic_name}}`
    },
    'appointment-cancellation': {
      subject: 'Cancelación de Cita - {{clinic_name}}',
      html: `<!DOCTYPE html>
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
    .appointment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
    .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-label { font-weight: bold; color: #6b7280; }
    .detail-value { color: #111827; }
    .footer { text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{clinic_name}}</h1>
      <h2>❌ Cancelación de Cita</h2>
    </div>
    <div class="content">
      <p>Estimado/a <strong>{{patient_name}}</strong>,</p>
      <p>Le informamos que su cita ha sido cancelada. Los detalles de la cita cancelada son:</p>
      
      <div class="appointment-details">
        <h3 style="margin-top: 0; color: #ef4444;">Detalles de la Cita Cancelada</h3>
        <div class="detail-row">
          <span class="detail-label">Fecha y Hora:</span>
          <span class="detail-value">{{appointment_date}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Profesional:</span>
          <span class="detail-value">{{professional_name}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Tipo de Consulta:</span>
          <span class="detail-value">{{appointment_type}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Folio:</span>
          <span class="detail-value">{{folio}}</span>
        </div>
      </div>

      <p>Si desea reprogramar su cita, por favor contáctenos.</p>
      <p>Lamentamos cualquier inconveniente que esto pueda causar.</p>
    </div>
    <div class="footer">
      <p><strong>{{clinic_name}}</strong></p>
      <p>{{clinic_address}}</p>
      <p>Teléfono: {{clinic_phone}}</p>
    </div>
  </div>
</body>
</html>`,
      text: `{{clinic_name}} - Cancelación de Cita

Estimado/a {{patient_name}},

Le informamos que su cita ha sido cancelada.

Detalles de la cita cancelada:
- Fecha y Hora: {{appointment_date}}
- Profesional: {{professional_name}}
- Tipo de Consulta: {{appointment_type}}
- Folio: {{folio}}

Si desea reprogramar, contáctenos.

{{clinic_name}}`
    },
    'welcome': {
      subject: 'Bienvenido/a a {{clinic_name}}',
      html: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenida</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 10px 10px; }
    .welcome-box { background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #10b981; text-align: center; }
    .footer { text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{clinic_name}}</h1>
      <h2>🎉 ¡Bienvenido/a!</h2>
    </div>
    <div class="content">
      <div class="welcome-box">
        <h3 style="margin-top: 0; color: #059669;">¡Nos complace tenerle como paciente!</h3>
        <p style="font-size: 16px; margin: 0;">
          Estimado/a <strong>{{patient_name}}</strong>, bienvenido/a a nuestra familia médica.
        </p>
      </div>
      
      <p>En {{clinic_name}} nos comprometemos a brindarle la mejor atención médica posible.</p>
      
      <p><strong>Servicios que ofrecemos:</strong></p>
      <ul>
        <li>Consultas médicas especializadas</li>
        <li>Atención personalizada</li>
        <li>Seguimiento continuo de su salud</li>
        <li>Recordatorios de citas automáticos</li>
      </ul>

      <p>Si tiene alguna pregunta o necesita programar una cita, no dude en contactarnos.</p>
      <p>¡Esperamos poder servirle pronto!</p>
    </div>
    <div class="footer">
      <p><strong>{{clinic_name}}</strong></p>
      <p>{{clinic_address}}</p>
      <p>Teléfono: {{clinic_phone}}</p>
    </div>
  </div>
</body>
</html>`,
      text: `¡Bienvenido/a a {{clinic_name}}!

Estimado/a {{patient_name}},

Nos complace tenerle como paciente.

En {{clinic_name}} nos comprometemos a brindarle la mejor atención médica posible.

Si tiene alguna pregunta, contáctenos.

{{clinic_name}}`
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplate && templates[selectedTemplate]) {
      setEditingTemplate(templates[selectedTemplate]);
    }
  }, [selectedTemplate, templates]);

  const loadTemplates = () => {
    const saved = localStorage.getItem('clinic_email_templates');
    if (saved) {
      try {
        const parsedTemplates = JSON.parse(saved);
        setTemplates({ ...defaultTemplates, ...parsedTemplates });
      } catch (error) {
        console.error('Error loading templates:', error);
        setTemplates(defaultTemplates);
      }
    } else {
      setTemplates(defaultTemplates);
    }
  };

  const saveTemplate = () => {
    const updatedTemplates = {
      ...templates,
      [selectedTemplate]: editingTemplate
    };
    
    setTemplates(updatedTemplates);
    localStorage.setItem('clinic_email_templates', JSON.stringify(updatedTemplates));
    
    toast({
      title: "Template guardado",
      description: `El template "${templateTypes.find(t => t.id === selectedTemplate)?.name}" ha sido actualizado.`,
    });
  };

  const resetTemplate = () => {
    if (defaultTemplates[selectedTemplate]) {
      setEditingTemplate(defaultTemplates[selectedTemplate]);
      toast({
        title: "Template restaurado",
        description: "Se ha restaurado el template por defecto.",
      });
    }
  };

  const previewTemplate = () => {
    const processedHtml = processTemplate(editingTemplate.html, previewData);
    const previewWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
    previewWindow.document.write(processedHtml);
    previewWindow.document.close();
  };

  const processTemplate = (template, data) => {
    const clinicName = localStorage.getItem('clinic_name') || 'Clínica Delux';
    const clinicAddress = localStorage.getItem('clinic_address') || 'Av. Paseo de la Reforma 123, Col. Juárez, CDMX, México';
    const clinicPhone = localStorage.getItem('clinic_phone') || '+52 55 1234 5678';
    
    const allData = {
      ...data,
      clinic_name: clinicName,
      clinic_address: clinicAddress,
      clinic_phone: clinicPhone
    };

    let processed = template;
    Object.keys(allData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, allData[key] || '');
    });
    
    return processed;
  };

  const copyTemplate = () => {
    navigator.clipboard.writeText(editingTemplate.html);
    toast({
      title: "Template copiado",
      description: "El HTML del template ha sido copiado al portapapeles.",
    });
  };

  const handleTemplateChange = (field, value) => {
    setEditingTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const selectedTemplateInfo = templateTypes.find(t => t.id === selectedTemplate);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-card-foreground mb-2">Editor de Templates de Email</h2>
        <p className="text-muted-foreground">Personaliza los templates de correo electrónico que se envían automáticamente.</p>
      </div>

      {/* Selector de Template */}
      <div className="bg-card rounded-xl shadow-lg p-6 border border-border/50">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Seleccionar Template</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templateTypes.map((template) => {
            const Icon = template.icon;
            return (
              <motion.div
                key={template.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTemplate(template.id)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedTemplate === template.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-6 h-6 ${template.color}`} />
                  <div>
                    <h4 className="font-medium text-card-foreground">{template.name}</h4>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Editor */}
      {selectedTemplate && (
        <div className="bg-card rounded-xl shadow-lg border border-border/50">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {selectedTemplateInfo && (
                  <selectedTemplateInfo.icon className={`w-6 h-6 ${selectedTemplateInfo.color}`} />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground">
                    {selectedTemplateInfo?.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplateInfo?.description}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={previewTemplate} variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Vista Previa
                </Button>
                <Button onClick={copyTemplate} variant="outline" size="sm">
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar HTML
                </Button>
                <Button onClick={resetTemplate} variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restaurar
                </Button>
                <Button onClick={saveTemplate} className="button-primary-gradient" size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <Tabs defaultValue="html" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="subject">Asunto</TabsTrigger>
                <TabsTrigger value="html">HTML</TabsTrigger>
                <TabsTrigger value="text">Texto Plano</TabsTrigger>
              </TabsList>
              
              <TabsContent value="subject" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Asunto del Email
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.subject}
                    onChange={(e) => handleTemplateChange('subject', e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    placeholder="Asunto del email..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Usa variables como {{clinic_name}}, {{patient_name}}, etc.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="html" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Template HTML
                  </label>
                  <textarea
                    value={editingTemplate.html}
                    onChange={(e) => handleTemplateChange('html', e.target.value)}
                    rows={20}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground font-mono text-sm"
                    placeholder="HTML del template..."
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="text" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Versión en Texto Plano
                  </label>
                  <textarea
                    value={editingTemplate.text}
                    onChange={(e) => handleTemplateChange('text', e.target.value)}
                    rows={15}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    placeholder="Versión en texto plano del email..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Esta versión se usa como respaldo para clientes que no soportan HTML.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}

      {/* Variables Disponibles */}
      <div className="bg-card rounded-xl shadow-lg p-6 border border-border/50">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Variables Disponibles</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            '{{clinic_name}}',
            '{{clinic_address}}',
            '{{clinic_phone}}',
            '{{patient_name}}',
            '{{patient_email}}',
            '{{patient_phone}}',
            '{{professional_name}}',
            '{{appointment_date}}',
            '{{appointment_type}}',
            '{{folio}}'
          ].map((variable) => (
            <div
              key={variable}
              onClick={() => navigator.clipboard.writeText(variable)}
              className="p-2 bg-muted/30 rounded-lg text-sm font-mono cursor-pointer hover:bg-muted/50 transition-colors"
              title="Clic para copiar"
            >
              {variable}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Haz clic en cualquier variable para copiarla al portapapeles. Estas variables se reemplazan automáticamente con los datos reales al enviar el email.
        </p>
      </div>

      {/* Datos de Prueba */}
      <div className="bg-card rounded-xl shadow-lg p-6 border border-border/50">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Datos de Prueba para Vista Previa</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Nombre del Paciente</label>
            <input
              type="text"
              value={previewData.patient_name}
              onChange={(e) => setPreviewData(prev => ({ ...prev, patient_name: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Nombre del Profesional</label>
            <input
              type="text"
              value={previewData.professional_name}
              onChange={(e) => setPreviewData(prev => ({ ...prev, professional_name: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Fecha y Hora de Cita</label>
            <input
              type="text"
              value={previewData.appointment_date}
              onChange={(e) => setPreviewData(prev => ({ ...prev, appointment_date: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Tipo de Consulta</label>
            <input
              type="text"
              value={previewData.appointment_type}
              onChange={(e) => setPreviewData(prev => ({ ...prev, appointment_type: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateEditor;