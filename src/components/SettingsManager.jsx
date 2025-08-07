import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Mail, Key, FileText, Briefcase, Server, Eye, Send, TestTube, Edit, Database, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import EmailService from '@/services/EmailService';
import EmailTemplateEditor from '@/components/EmailTemplateEditor';

const CLINIC_NAME_DEFAULT = "Clínica Delux";

const SettingsManager = () => {
  const [emailConfig, setEmailConfig] = useState({
    smtp_host: 'smtp.gmail.com',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    from_email: '',
    from_name: 'Clínica Delux',
    smtp_secure: 'tls',
    smtp_auth: '1'
  });
  const [clinicName, setClinicName] = useState(CLINIC_NAME_DEFAULT);
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isInitializingDB, setIsInitializingDB] = useState(false);

  useEffect(() => {
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

    // Cargar configuración de email desde BD
    loadEmailConfigFromDatabase();
  }, []);

  const loadEmailConfigFromDatabase = async () => {
    try {
      setIsLoadingConfig(true);
      const config = await EmailService.getConfig();
      if (config) {
        setEmailConfig(config);
      }
    } catch (error) {
      console.error('Error cargando configuración de email:', error);
      toast({
        title: "Información",
        description: "No se pudo cargar la configuración desde la base de datos. Usando configuración local.",
        variant: "default"
      });
    } finally {
      setIsLoadingConfig(false);
    }
  };

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
    
    // Guardar información de la clínica
    localStorage.setItem('clinic_name', clinicName || CLINIC_NAME_DEFAULT);
    localStorage.setItem('clinic_address', clinicAddress);
    localStorage.setItem('clinic_phone', clinicPhone);
    
    toast({
      title: '¡Configuración guardada!',
      description: 'La información de la clínica se ha guardado correctamente.',
    });
  };

  const handleSaveEmailConfig = async (e) => {
    e.preventDefault();
    
    try {
      // Guardar configuración de email en BD
      await EmailService.updateConfig(emailConfig);
      
      toast({
        title: '¡Configuración SMTP guardada!',
        description: 'Las credenciales se han guardado de forma segura en la base de datos.',
      });
    } catch (error) {
      console.error('Error guardando configuración SMTP:', error);
      toast({
        title: 'Error al guardar',
        description: 'No se pudo guardar en la base de datos, pero se guardó localmente como respaldo.',
        variant: "destructive"
      });
    }
  };

  const handleInitializeDatabase = async () => {
    try {
      setIsInitializingDB(true);
      const result = await EmailService.initializeDatabase();
      
      if (result.success) {
        toast({
          title: '✅ Base de datos inicializada',
          description: `Tablas creadas: ${result.tables_created.join(', ')}`,
        });
        
        // Recargar configuración
        await loadEmailConfigFromDatabase();
      }
    } catch (error) {
      console.error('Error inicializando base de datos:', error);
      toast({
        title: 'Error de inicialización',
        description: 'No se pudo inicializar la base de datos. Verifica la conexión.',
        variant: "destructive"
      });
    } finally {
      setIsInitializingDB(false);
    }
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

  // Funciones para configuraciones rápidas
  const setHostingerConfig = () => {
    setEmailConfig({
      smtp_host: 'smtp.hostinger.com',
      smtp_port: '465',
      smtp_secure: 'ssl',
      smtp_auth: '1',
      smtp_user: 'soporte@grupodelux.dvguzman.com',
      smtp_password: '', // Usuario debe ingresar su contraseña
      from_email: 'soporte@grupodelux.dvguzman.com',
      from_name: 'Grupo Médico Delux - Soporte'
    });
    toast({
      title: '🟠 Configuración Hostinger aplicada',
      description: 'Ahora debes ingresar tu contraseña de correo Hostinger.',
    });
  };

  const setGmailConfig = () => {
    setEmailConfig({
      smtp_host: 'smtp.gmail.com',
      smtp_port: '587',
      smtp_secure: 'tls',
      smtp_auth: '1',
      smtp_user: '', // Usuario debe ingresar su email
      smtp_password: '', // Usuario debe ingresar contraseña de aplicación
      from_email: '',
      from_name: 'Grupo Médico Delux'
    });
    toast({
      title: '📧 Configuración Gmail aplicada',
      description: 'Ahora debes ingresar tu email y contraseña de aplicación de Gmail.',
    });
  };

  const setOutlookConfig = () => {
    setEmailConfig({
      smtp_host: 'smtp-mail.outlook.com',
      smtp_port: '587',
      smtp_secure: 'tls',
      smtp_auth: '1',
      smtp_user: '', // Usuario debe ingresar su email
      smtp_password: '', // Usuario debe ingresar su contraseña
      from_email: '',
      from_name: 'Grupo Médico Delux'
    });
    toast({
      title: '🔵 Configuración Outlook aplicada',
      description: 'Ahora debes ingresar tu email y contraseña de Outlook.',
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

    if (!emailConfig.smtp_user || !emailConfig.smtp_password) {
      toast({
        title: 'Configuración incompleta',
        description: 'Por favor configura las credenciales SMTP primero.',
        variant: 'destructive'
      });
      return;
    }

    setIsTesting(true);

    try {
      // Guardar configuración antes de probar
      await EmailService.updateConfig(emailConfig);

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
        description: error.message || 'Verifica las credenciales SMTP.',
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

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email SMTP</TabsTrigger>
          <TabsTrigger value="templates">Templates de Email</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl shadow-lg p-6 border border-border/50"
          >
            <form onSubmit={handleSave} className="space-y-6">
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
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          {/* Inicialización de BD */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl shadow-lg p-6 border border-border/50"
          >
            <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
              <Database className="w-5 h-5 mr-2 text-primary" />
              Configuración de Base de Datos
            </h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4 border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">🗄️ Almacenamiento Seguro</h4>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                Las credenciales SMTP se almacenan de forma segura en la base de datos con encriptación. 
                Si es la primera vez que usas el sistema, inicializa las tablas necesarias.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleInitializeDatabase}
                  disabled={isInitializingDB}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Database className="w-4 h-4 mr-2" />
                  {isInitializingDB ? 'Inicializando...' : 'Inicializar BD'}
                </Button>
                <Button
                  onClick={loadEmailConfigFromDatabase}
                  disabled={isLoadingConfig}
                  variant="outline"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingConfig ? 'animate-spin' : ''}`} />
                  Recargar Config
                </Button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl shadow-lg p-6 border border-border/50"
          >
            <form onSubmit={handleSaveEmailConfig} className="space-y-6">
              {/* Configuración de Email SMTP */}
              <div>
                <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
                  <Server className="w-5 h-5 mr-2 text-primary" />
                  Configuración de Email SMTP
                  {isLoadingConfig && <RefreshCw className="w-4 h-4 ml-2 animate-spin text-primary" />}
                </h2>
                {/* Configuraciones preestablecidas */}
                <div className="mb-6">
                  <h4 className="font-medium text-card-foreground mb-3">⚡ Configuraciones Rápidas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setHostingerConfig()}
                      className="p-4 h-auto flex flex-col items-start space-y-1"
                    >
                      <div className="font-medium text-sm">🟠 Hostinger</div>
                      <div className="text-xs text-muted-foreground">SSL - Puerto 465</div>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setGmailConfig()}
                      className="p-4 h-auto flex flex-col items-start space-y-1"
                    >
                      <div className="font-medium text-sm">📧 Gmail</div>
                      <div className="text-xs text-muted-foreground">TLS - Puerto 587</div>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOutlookConfig()}
                      className="p-4 h-auto flex flex-col items-start space-y-1"
                    >
                      <div className="font-medium text-sm">🔵 Outlook</div>
                      <div className="text-xs text-muted-foreground">TLS - Puerto 587</div>
                    </Button>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">📧 Configuración de Email SMTP</h4>
                  <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                    <div>
                      <strong>Para Hostinger:</strong> Usa las credenciales de tu correo personalizado (soporte@grupodelux.dvguzman.com)
                    </div>
                    <div>
                      <strong>Para Gmail:</strong> Necesitas generar una "Contraseña de aplicación" en 
                      <a href="https://myaccount.google.com/security" target="_blank" className="underline ml-1">Configuración de seguridad</a>
                    </div>
                    <div>
                      <strong>Para Outlook:</strong> Usa tu email y contraseña normales
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Email de Gmail *
                    </label>
                    <input
                      type="email"
                      name="smtp_user"
                      value={emailConfig.smtp_user}
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
                      name="smtp_password"
                      value={emailConfig.smtp_password}
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
                      name="from_email"
                      value={emailConfig.from_email}
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
                      name="from_name"
                      value={emailConfig.from_name}
                      onChange={handleEmailConfigChange}
                      className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                      placeholder="Clínica Delux"
                    />
                  </div>
                </div>

                {/* Configuraciones avanzadas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Servidor SMTP
                    </label>
                    <input
                      type="text"
                      name="smtp_host"
                      value={emailConfig.smtp_host}
                      onChange={handleEmailConfigChange}
                      className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Puerto
                    </label>
                    <input
                      type="number"
                      name="smtp_port"
                      value={emailConfig.smtp_port}
                      onChange={handleEmailConfigChange}
                      className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                      placeholder="587"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Encriptación
                    </label>
                    <select
                      name="smtp_secure"
                      value={emailConfig.smtp_secure}
                      onChange={handleEmailConfigChange}
                      className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    >
                      <option value="tls">TLS</option>
                      <option value="ssl">SSL</option>
                    </select>
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
                      disabled={isTesting || !emailConfig.smtp_user || !emailConfig.smtp_password}
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

              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-primary to-accent-alt hover:opacity-90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Guardar en Base de Datos
                </Button>
              </div>
            </form>
          </motion.div>

          {/* Templates de Email */}
          <div className="bg-card rounded-xl shadow-lg p-6 border border-border/50">
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
              <div className="flex gap-2">
                <Button type="button" onClick={handleTestEmail} variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Template de Ejemplo
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <EmailTemplateEditor />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsManager;