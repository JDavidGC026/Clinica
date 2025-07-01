import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, User, Mail, Phone, Clock, Briefcase, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ProfessionalForm = ({ professional, disciplines, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    disciplineId: '',
    password: '',
    schedule: {
      monday: { start: '', end: '', available: false },
      tuesday: { start: '', end: '', available: false },
      wednesday: { start: '', end: '', available: false },
      thursday: { start: '', end: '', available: false },
      friday: { start: '', end: '', available: false },
      saturday: { start: '', end: '', available: false },
      sunday: { start: '', end: '', available: false }
    }
  });

  const days = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  useEffect(() => {
    if (professional) {
      // Asegurarse de que schedule sea un objeto válido
      const schedule = professional.schedule || {
        monday: { start: '', end: '', available: false },
        tuesday: { start: '', end: '', available: false },
        wednesday: { start: '', end: '', available: false },
        thursday: { start: '', end: '', available: false },
        friday: { start: '', end: '', available: false },
        saturday: { start: '', end: '', available: false },
        sunday: { start: '', end: '', available: false }
      };
      
      setFormData({
        ...professional,
        password: '', // No mostrar contraseña existente
        schedule: schedule
      });
    }
  }, [professional]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleScheduleChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          [field]: value
        }
      }
    }));
  };

  const handleAvailabilityChange = (day, available) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          available,
          start: available ? prev.schedule[day].start || '08:00' : '',
          end: available ? prev.schedule[day].end || '16:00' : ''
        }
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-border"
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-card-foreground">
              {professional ? 'Editar Profesional' : 'Nuevo Profesional'}
            </h2>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-card-foreground flex items-center">
              <User className="w-5 h-5 mr-2 text-primary" />
              Información Personal
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Disciplina *
                </label>
                <select
                  name="disciplineId"
                  value={formData.disciplineId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  required
                >
                  <option value="">Seleccionar disciplina</option>
                  {disciplines && disciplines.map(discipline => (
                    <option key={discipline.id} value={discipline.id}>
                      {discipline.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Contraseña {professional ? '(dejar vacío para mantener)' : '*'}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  placeholder={professional ? "Nueva contraseña (opcional)" : "Contraseña para login"}
                  required={!professional}
                />
                {!professional && (
                  <p className="text-xs text-muted-foreground mt-1">
                    El profesional podrá hacer login con su email y esta contraseña
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-card-foreground flex items-center">
              <Clock className="w-5 h-5 mr-2 text-primary" />
              Horarios de Trabajo
            </h3>
            
            <div className="space-y-3">
              {days.map(day => (
                <div key={day.key} className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
                  <div className="w-24">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.schedule && formData.schedule[day.key]?.available || false}
                        onChange={(e) => handleAvailabilityChange(day.key, e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-card-foreground">{day.label}</span>
                    </label>
                  </div>
                  
                  {formData.schedule && formData.schedule[day.key]?.available && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="time"
                        value={formData.schedule[day.key].start || ''}
                        onChange={(e) => handleScheduleChange(day.key, 'start', e.target.value)}
                        className="px-2 py-1 border border-input rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                      />
                      <span className="text-muted-foreground">a</span>
                      <input
                        type="time"
                        value={formData.schedule[day.key].end || ''}
                        onChange={(e) => handleScheduleChange(day.key, 'end', e.target.value)}
                        className="px-2 py-1 border border-input rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center">
              <Key className="w-4 h-4 mr-2" />
              Acceso al Sistema
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              El profesional podrá iniciar sesión en el sistema usando su <strong>email</strong> como usuario y la contraseña configurada. 
              Tendrá acceso al Portal Profesional donde podrá ver sus pacientes, gestionar notas clínicas y generar recetas.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-border">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="button-primary-gradient"
            >
              {professional ? 'Actualizar Profesional' : 'Crear Profesional'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ProfessionalForm;