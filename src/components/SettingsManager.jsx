import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Mail, Key, FileText, Briefcase, Server, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import EmailService from '@/services/EmailService';

const CLINIC_NAME_DEFAULT = "Grupo Médico Delux";

const SettingsManager = () => {
  const [emailConfig, setEmailConfig] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: ''
  });
  const [clinicName, setClinicName] = useState(CLINIC_NAME_DEFAULT);
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');

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
    }

    const savedPhone = localStorage.getItem('clinic_phone');
    if (savedPhone) {
      setClinicPhone(savedPhone);
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
      appointment_date: '15 de Enero de 2024 a las 10:00',
      appointment_type: 'Consulta General',
      folio: 'GMD-240115-TEST'
    };

    EmailService.previewTemplate('appointment-confirmation', testData);
    toast({
      title: 'Vista previa generada',
      description: 'Se ha abierto una ventana con el template de ejemplo.',
    });
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
          </div>
          
          {/* Configuración de Email SMTP */}
          <div>
            <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
              <Server className="w-5 h-5 mr-2 text-primary" />
              Configuración de Email SMTP
            </h2>
            <div className="bg-muted/30 p-4 rounded-lg mb-4">
              <p className="text-sm text-muted-foreground">
                <strong>Nota:</strong> Actualmente el sistema simula el envío de correos y genera templates HTML. 
                Para envío real, configura estos parámetros SMTP que serán utilizados en producción.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Servidor SMTP
                </label>
                <input
                  type="text"
                  name="smtpHost"
                  value={emailConfig.smtpHost}
                  onChange={handleEmailConfigChange}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Puerto SMTP
                </label>
                <input
                  type="number"
                  name="smtpPort"
                  value={emailConfig.smtpPort}
                  onChange={handleEmailConfigChange}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  placeholder="587"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Usuario SMTP
                </label>
                <input
                  type="email"
                  name="smtpUser"
                  value={emailConfig.smtpUser}
                  onChange={handleEmailConfigChange}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  placeholder="tu-email@gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Contraseña SMTP
                </label>
                <input
                  type="password"
                  name="smtpPassword"
                  value={emailConfig.smtpPassword}
                  onChange={handleEmailConfigChange}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  placeholder="Contraseña o App Password"
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
                  placeholder="noreply@tuclinica.com"
                />
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
                  placeholder="Tu Clínica"
                />
              </div>
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