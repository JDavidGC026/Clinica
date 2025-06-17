import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, User, Mail, Phone, Briefcase, DollarSign, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AppointmentForm = ({ appointment, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    professionalId: '',
    professionalName: '',
    date: '',
    time: '',
    type: 'consulta-inicial',
    notes: '',
    status: 'programada',
    paymentStatus: 'pendiente',
    cost: '',
    folio: ''
  });

  const [professionals, setProfessionals] = useState([]);
  const [disciplines, setDisciplines] = useState([]);

  useEffect(() => {
    const savedProfessionals = localStorage.getItem('clinic_professionals');
    if (savedProfessionals) {
      setProfessionals(JSON.parse(savedProfessionals));
    }
    const savedDisciplines = localStorage.getItem('clinic_disciplines');
    if (savedDisciplines) {
      setDisciplines(JSON.parse(savedDisciplines));
    }

    if (appointment) {
      setFormData({
        ...appointment,
        professionalId: appointment.professionalId || appointment.psychologistId,
        professionalName: appointment.professionalName || appointment.psychologistName,
        cost: appointment.cost || '',
        paymentStatus: appointment.paymentStatus || 'pendiente',
        folio: appointment.folio || ''
      });
    } else {
      setFormData(prev => ({ ...prev, folio: generateFolio() }));
    }
  }, [appointment]);

  const generateFolio = () => {
    const prefix = "GMD"; // Grupo Médico Delux
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${year}${month}${day}-${randomSuffix}`;
  };

  const getDisciplineName = (disciplineId) => {
    return disciplines.find(d => d.id === disciplineId)?.name || 'N/A';
  };

  const appointmentTypes = [
    { value: 'consulta-inicial', label: 'Consulta Inicial' },
    { value: 'terapia-individual', label: 'Terapia Individual' },
    { value: 'terapia-pareja', label: 'Terapia de Pareja' },
    { value: 'terapia-familiar', label: 'Terapia Familiar' },
    { value: 'evaluacion', label: 'Evaluación' },
    { value: 'seguimiento', label: 'Seguimiento' },
    { value: 'otro', label: 'Otro Tipo de Consulta' }
  ];

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
  ];

  const paymentStatusOptions = [
    { value: 'pendiente', label: 'Pendiente de Pago' },
    { value: 'pagado', label: 'Pagado' },
    { value: 'cancelado_sin_costo', label: 'Cancelado (sin costo)' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'professionalId') {
      const selectedProfessional = professionals.find(p => p.id.toString() === value);
      if (selectedProfessional) {
        setFormData(prev => ({
          ...prev,
          professionalName: selectedProfessional.name
        }));
      }
    }
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
              {appointment ? 'Editar Cita' : 'Nueva Cita'}
            </h2>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          {formData.folio && <p className="text-sm text-muted-foreground mt-1">Folio: {formData.folio}</p>}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-card-foreground flex items-center">
                <User className="w-5 h-5 mr-2 text-primary" />
                Información del Paciente
              </h3>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Nombre Completo *</label>
                <input type="text" name="patientName" value={formData.patientName} onChange={handleChange} className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Email *</label>
                <input type="email" name="patientEmail" value={formData.patientEmail} onChange={handleChange} className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Teléfono</label>
                <input type="tel" name="patientPhone" value={formData.patientPhone} onChange={handleChange} className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-card-foreground flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary" />
                Detalles de la Cita
              </h3>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Profesional *</label>
                <select name="professionalId" value={formData.professionalId} onChange={handleChange} className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground" required>
                  <option value="">Seleccionar profesional</option>
                  {professionals.map(prof => (
                    <option key={prof.id} value={prof.id}>{prof.name} - {getDisciplineName(prof.disciplineId)}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Fecha *</label>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} min={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Hora *</label>
                  <select name="time" value={formData.time} onChange={handleChange} className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground" required>
                    <option value="">Seleccionar hora</option>
                    {timeSlots.map(time => (<option key={time} value={time}>{time}</option>))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Tipo de Consulta *</label>
                <select name="type" value={formData.type} onChange={handleChange} className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground" required>
                  {appointmentTypes.map(type => (<option key={type.value} value={type.value}>{type.label}</option>))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 pt-4 border-t border-border">
             <h3 className="text-lg font-semibold text-card-foreground flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-primary" />
                Información de Pago
              </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Costo de la Consulta (MXN) *</label>
                <input type="number" name="cost" value={formData.cost} onChange={handleChange} placeholder="Ej: 500" className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground" required min="0" step="0.01" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Estado del Pago *</label>
                <select name="paymentStatus" value={formData.paymentStatus} onChange={handleChange} className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground" required>
                  {paymentStatusOptions.map(status => (<option key={status.value} value={status.value}>{status.label}</option>))}
                </select>
              </div>
            </div>
          </div>

          {appointment && (
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-lg font-semibold text-card-foreground flex items-center">
                <FileText className="w-5 h-5 mr-2 text-primary" />
                Estado de la Cita
              </h3>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Estado General</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground">
                  <option value="programada">Programada</option>
                  <option value="en-progreso">En Progreso</option>
                  <option value="completada">Completada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Notas Adicionales</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground" placeholder="Información adicional sobre la cita..." />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-border">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" className="button-primary-gradient">
              {appointment ? 'Actualizar Cita' : 'Crear Cita'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AppointmentForm;