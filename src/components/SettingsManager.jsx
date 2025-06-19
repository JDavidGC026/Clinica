import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Mail, Key, FileText, Briefcase, Server, Eye, Send, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import EmailService from '@/services/EmailService';

const CLINIC_NAME_DEFAULT = "Clínica Delux";

const SettingsManager = () => {
  const [emailConfig, setEmailConfig] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: 'Clínica Delux'
  });
  const [clinicName, setClinicName] = useState(CLINIC_NAME_DEFAULT);
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    // Cargar configuración de email
    const savedConfig = EmailService.getConfig();
    if (savedConfig) {
      setEmailConfig(savedConfig);
    }

    // Cargar información de la clínica
    const savedClinicName = localStorage.getItem('clinic_name');
    if (savedClinicName) {
      setClinicName(savedClinicName);
    } else {
      localStorage.setItem('clinic_name', CLINIC_NAME_DEFAULT);
    }

    const savedAddress = localStorage.getItem('clinic_address');
    if (savedAddress) {
      setClinicAddress(savedAddress);
    } else {
      localStorage.setItem('clinic_address', 'Av. Paseo de la Reforma 123, Col. Juárez, CDMX, México');
      setClinicAddress('Av. Paseo de la Reforma 123, Col. Juárez, CDMX, México');
    }

    const savedPhone = localStorage.getItem('clinic_phone');
    if (savedPhone) {
      setClinicPhone(savedPhone);
    } else {
      localStorage.setItem('clinic_phone', '+52 55 1234 5678');
      setClinicPhone('+52 55 1234 5678');
    }
  }, []);

  const handleEmailConfigChange = (e) => {
    const { name, value } = e.target;
    setEmailConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClinicInfoChange = (field, value) => {
    switch (field) {
      case 'name':
        setClinicName(value);
        break;
      case 'address':
        setClinicAddress(value);
        break;
      case 'phone':
        setClinicPhone(value);
        break;
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    
    // Guardar configuración de email
    EmailService.updateConfig(emailConfig);
    
    // Guardar información de la clínica
    localStorage.setItem('clinic_name', clinicName || CLINIC_NAME_DEFAULT);
    localStorage.setItem('clinic_address', clinicAddress);
    localStorage.setItem('clinic_phone', clinicPhone);
    
    toast({
      title: '¡Configuración guardada!',
      description: 'Tus ajustes se han guardado correctamente.',
    });
  };

  const handleTestEmail = () => {
    // Previsualizar un template de ejemplo
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

    if (!emailConfig.smtpUser || !emailConfig.smtpPassword) {
      toast({
        title: 'Configuración incompleta',
        description: 'Por favor configura las credenciales SMTP de Gmail primero.',
        variant: 'destructive'
      });
      return;
    }

    setIsTesting(true);

    try {
      // Guardar configuración antes de probar
      EmailService.updateConfig(emailConfig);

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
          description: `Email de prueba enviado a ${testEmail} usando ${result.method}`,
        });
      }

    } catch (error) {
      toast({
        title: 'Error al enviar email',
        description: error.message || 'Verifica las credenciales SMTP de Gmail.',
        variant: 'destructive'
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground mt-1">Administra las integraciones y ajustes de la aplicación.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl shadow-lg p-6 border border-border/50"
      >
        <form onSubmit={handleSave} className="space-y-8">
          {/* Información de la Clínica */}
          <div>
            <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-primary" />
              Información de la Clínica
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Nombre de la Clínica
                </label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => handleClinicInfoChange('name', e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  placeholder="Nombre de tu clínica"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Teléfono de Contacto
                </label>
                <input
                  type="tel"
                  value={clinicPhone}
                  onChange={(e) => handleClinicInfoChange('phone', e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  placeholder="Teléfono principal"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={clinicAddress}
                  onChange={(e) => handleClinicInfoChange('address', e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  placeholder="Dirección completa de la clínica"
                />
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="font-medium text-card-foreground mb-2">⏰ Zona Horaria Configurada:</h4>
              <p className="text-sm text-muted-foreground">
                <strong>Ciudad de México (GMT-6)</strong> - Todas las fechas y horarios del sistema están configurados para la zona horaria de México.
              </p>
            </div>
          </div>
          
          {/* Configuración de Email SMTP */}
          <div>
            <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
              <Server className="w-5 h-5 mr-2 text-primary" />
              Configuración de Gmail SMTP
            </h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4 border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">📧 Configuración de Gmail</h4>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                Para usar Gmail SMTP, necesitas generar una <strong>"Contraseña de aplicación"</strong>:
              </p>
              <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4">
                <li>1. Ve a <a href="https://myaccount.google.com/security" target="_blank" className="underline">Configuración de seguridad de Google</a></li>
                <li>2. Habilita "Verificación en 2 pasos"</li>
                <li>3. Genera una "Contraseña de aplicación" específica</li>
                <li>4. Usa esa contraseña aquí (no tu contraseña normal)</li>
              </ol>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Email de Gmail *
                </label>
                <input
                  type="email"
                  name="smtpUser"
                  value={emailConfig.smtpUser}
                  onChange={handleEmailConfigChange}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  placeholder="tu-email@gmail.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Contraseña de Aplicación *
                </label>
                <input
                  type="password"
                  name="smtpPassword"
                  value={emailConfig.smtpPassword}
                  onChange={handleEmailConfigChange}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  placeholder="Contraseña de aplicación de Gmail"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Email Remitente
                </label>
                <input
                  type="email"
                  name="fromEmail"
                  value={emailConfig.fromEmail}
                  onChange={handleEmailConfigChange}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  placeholder="noreply@clinicadelux.com"
                />
                <p className="text-xs text-muted-foreground mt-1">Deja vacío para usar el email de Gmail</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Nombre Remitente
                </label>
                <input
                  type="text"
                  name="fromName"
                  value={emailConfig.fromName}
                  onChange={handleEmailConfigChange}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  placeholder="Clínica Delux"
                />
              </div>
            </div>

            {/* Prueba de Email */}
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-3 flex items-center">
                <TestTube className="w-4 h-4 mr-2" />
                Probar Envío de Email
              </h4>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="email-de-prueba@ejemplo.com"
                  className="flex-1 px-3 py-2 border border-green-300 dark:border-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-green-900/30 text-foreground"
                />
                <Button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={isTesting || !emailConfig.smtpUser || !emailConfig.smtpPassword}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isTesting ? 'Enviando...' : 'Enviar Prueba'}
                </Button>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                Esto enviará un email de confirmación de cita de ejemplo para probar la configuración.
              </p>
            </div>
          </div>

          {/* Templates de Email */}
          <div>
            <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-primary" />
              Templates de Email
            </h3>
            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-4">
                Los templates de email están integrados en el código y se generan automáticamente con los datos de la clínica.
                Incluyen diseños responsivos y profesionales para:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                <li>• Confirmación de citas</li>
                <li>• Recordatorios de citas</li>
                <li>• Cancelaciones</li>
                <li>• Mensajes de bienvenida</li>
                <li>• Notificaciones para profesionales</li>
                <li>• Formato de fecha y hora para Ciudad de México</li>
              </ul>
              <Button type="button" onClick={handleTestEmail} variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Ver Template de Ejemplo
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-gradient-to-r from-primary to-accent-alt hover:opacity-90"
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar Configuración
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default SettingsManager;