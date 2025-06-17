import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Mail, Key, FileText, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { emailTemplates } from '@/components/email/emailTemplates';

const CLINIC_NAME_DEFAULT = "Grupo Médico Delux";

const SettingsManager = () => {
  const [config, setConfig] = useState({
    serviceId: '',
    publicKey: '',
    templateIds: {
      'appointment-confirmation': '',
      'appointment-reminder': '',
      'appointment-cancellation': '',
      'welcome': '',
      'professional-new-appointment': '', 
      'professional-daily-summary': '',
    }
  });
  const [clinicName, setClinicName] = useState(CLINIC_NAME_DEFAULT);

  useEffect(() => {
    const savedConfig = localStorage.getItem('clinic_email_config');
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      const updatedTemplateIds = { ...config.templateIds, ...parsedConfig.templateIds };
      setConfig({ ...parsedConfig, templateIds: updatedTemplateIds });
    }
    const savedClinicName = localStorage.getItem('clinic_name');
    if (savedClinicName) {
      setClinicName(savedClinicName);
    } else {
      localStorage.setItem('clinic_name', CLINIC_NAME_DEFAULT);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTemplateIdChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      templateIds: {
        ...prev.templateIds,
        [name]: value
      }
    }));
  };

  const handleClinicNameChange = (e) => {
    setClinicName(e.target.value);
  };

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('clinic_email_config', JSON.stringify(config));
    localStorage.setItem('clinic_name', clinicName || CLINIC_NAME_DEFAULT);
    toast({
      title: '¡Configuración guardada!',
      description: 'Tus ajustes se han guardado correctamente.',
    });
  };
  
  const templateLabels = {
    'appointment-confirmation': 'Confirmación de Cita (Paciente)',
    'appointment-reminder': 'Recordatorio de Cita (Paciente)',
    'appointment-cancellation': 'Cancelación de Cita (Paciente)',
    'welcome': 'Bienvenida (Paciente)',
    'professional-new-appointment': 'Nueva Cita Asignada (Profesional)',
    'professional-daily-summary': 'Resumen Diario de Citas (Profesional)',
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
          <div>
            <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-primary" />
              Información de la Clínica
            </h2>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Nombre de la Clínica
              </label>
              <input
                type="text"
                name="clinicName"
                value={clinicName}
                onChange={handleClinicNameChange}
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                placeholder="Nombre de tu clínica"
                required
              />
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
              <Mail className="w-5 h-5 mr-2 text-primary" />
              Configuración de Email (EmailJS)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Public Key
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <input
                    type="text"
                    name="publicKey"
                    value={config.publicKey}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    placeholder="Tu Public Key de EmailJS"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Service ID
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <input
                    type="text"
                    name="serviceId"
                    value={config.serviceId}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    placeholder="Tu Service ID de EmailJS"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-primary" />
              IDs de Plantillas de Email
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.keys(config.templateIds).map(templateKey => (
                <div key={templateKey}>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    {templateLabels[templateKey] || emailTemplates[templateKey]?.name || templateKey}
                  </label>
                  <input
                    type="text"
                    name={templateKey}
                    value={config.templateIds[templateKey]}
                    onChange={handleTemplateIdChange}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    placeholder={`Template ID`}
                    required
                  />
                </div>
              ))}
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