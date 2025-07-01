import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, User, Mail, Phone, Briefcase, DollarSign, FileText, ChevronsUpDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import apiService from '@/services/ApiService';
import { toast } from '@/components/ui/use-toast';

const AppointmentForm = ({ appointment, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    patientId: '',
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
  const [patients, setPatients] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [patientOpen, setPatientOpen] = useState(false);
  const [professionalOpen, setProfessionalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [professionalsData, disciplinesData, patientsData] = await Promise.all([
          apiService.getProfessionals(),
          apiService.getDisciplines(),
          apiService.getPatients()
        ]);
        
        setProfessionals(professionalsData);
        setDisciplines(disciplinesData);
        setPatients(patientsData);
      } catch (error) {
        console.error('Error cargando datos para el formulario:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos necesarios.",
          variant: "destructive"
        });
        setProfessionals([]);
        setDisciplines([]);
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();

    if (appointment) {
      // Corregir el formato de fecha para evitar problemas de zona horaria
      const appointmentDate = appointment.date ? new Date(appointment.date + 'T00:00:00') : null;
      const formattedDate = appointmentDate ? appointmentDate.toISOString().split('T')[0] : '';
      
      setFormData({
        ...appointment,
        date: formattedDate,
        professionalId: appointment.professionalId || appointment.psychologistId,
        professionalName: appointment.professionalName || appointment.psychologistName,
        cost: appointment.cost || '',
        paymentStatus: appointment.paymentStatus || 'pendiente',
        folio: appointment.folio || ''
      });

      // Buscar y establecer paciente seleccionado
      if (appointment.patientId) {
        const patient = patientsData?.find(p => p.id.toString() === appointment.patientId.toString());
        if (patient) {
          setSelectedPatient(patient);
        }
      }

      // Buscar y establecer profesional seleccionado
      if (appointment.professionalId) {
        const professional = professionalsData?.find(p => p.id.toString() === appointment.professionalId.toString());
        if (professional) {
          setSelectedProfessional(professional);
        }
      }
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
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({
      ...prev,
      patientId: patient.id,
      patientName: patient.name,
      patientEmail: patient.email,
      patientPhone: patient.phone || ''
    }));
    setPatientOpen(false);
  };

  const handleProfessionalSelect = (professional) => {
    setSelectedProfessional(professional);
    setFormData(prev => ({
      ...prev,
      professionalId: professional.id,
      professionalName: professional.name
    }));
    setProfessionalOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      toast({
        title: "Error",
        description: "Debe seleccionar un paciente existente.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedProfessional) {
      toast({
        title: "Error",
        description: "Debe seleccionar un profesional.",
        variant: "destructive"
      });
      return;
    }
    
    // Asegurar que la fecha se mantenga correcta sin conversión de zona horaria
    const submitData = {
      ...formData,
      date: formData.date // Mantener el formato YYYY-MM-DD tal como está
    };
    
    onSubmit(submitData);
  };

  // Obtener la fecha mínima (hoy) en formato local
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  if (loading && !appointment) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-xl shadow-2xl w-full max-w-3xl p-6 border border-border"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-card-foreground">
              Cargando formulario...
            </h2>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </motion.div>
      </div>
    );
  }

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
                <label className="block text-sm font-medium text-muted-foreground mb-1">Seleccionar Paciente *</label>
                <Popover open={patientOpen} onOpenChange={setPatientOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={patientOpen}
                      className="w-full justify-between"
                    >
                      {selectedPatient
                        ? selectedPatient.name
                        : "Selecciona un paciente..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar paciente..." />
                      <CommandList>
                        <CommandEmpty>No se encontró ningún paciente.</CommandEmpty>
                        <CommandGroup>
                          {patients.map((patient) => (
                            <CommandItem
                              key={patient.id}
                              value={patient.name}
                              onSelect={() => handlePatientSelect(patient)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedPatient?.id === patient.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div>
                                <div className="font-medium">{patient.name}</div>
                                <div className="text-xs text-muted-foreground">{patient.email}</div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {patients.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No hay pacientes registrados. Primero registra pacientes en la sección "Pacientes".
                  </p>
                )}
              </div>

              {selectedPatient && (
                <div className="bg-muted/30 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Información del Paciente:</h4>
                  <div className="text-xs space-y-1">
                    <div><strong>Email:</strong> {selectedPatient.email}</div>
                    <div><strong>Teléfono:</strong> {selectedPatient.phone || 'No disponible'}</div>
                    {selectedPatient.age && <div><strong>Edad:</strong> {selectedPatient.age} años</div>}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-card-foreground flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary" />
                Detalles de la Cita
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Profesional *</label>
                <Popover open={professionalOpen} onOpenChange={setProfessionalOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={professionalOpen}
                      className="w-full justify-between"
                    >
                      {selectedProfessional
                        ? selectedProfessional.name
                        : "Selecciona un profesional..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar profesional..." />
                      <CommandList>
                        <CommandEmpty>No se encontró ningún profesional.</CommandEmpty>
                        <CommandGroup>
                          {professionals.map((prof) => (
                            <CommandItem
                              key={prof.id}
                              value={prof.name}
                              onSelect={() => handleProfessionalSelect(prof)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedProfessional?.id === prof.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div>
                                <div className="font-medium">{prof.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {getDisciplineName(prof.disciplineId || prof.discipline_id)}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Fecha *</label>
                  <input 
                    type="date" 
                    name="date" 
                    value={formData.date} 
                    onChange={handleChange} 
                    min={getTodayDate()}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground" 
                    required 
                  />
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