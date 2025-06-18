import React, { useState, useEffect } from 'react';
import { Send, Check, ChevronsUpDown, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import EmailService from '@/services/EmailService';
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

const EmailSendPanel = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('appointment-reminder');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [open, setOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const savedPatients = localStorage.getItem('clinic_patients');
    if (savedPatients) {
      setPatients(JSON.parse(savedPatients));
    }
  }, []);

  const emailTemplates = {
    'appointment-confirmation': { name: 'Confirmación de Cita', description: 'Confirma una cita programada' },
    'appointment-reminder': { name: 'Recordatorio de Cita', description: 'Recuerda una cita próxima' },
    'appointment-cancellation': { name: 'Cancelación de Cita', description: 'Notifica cancelación de cita' },
    'welcome': { name: 'Bienvenida', description: 'Mensaje de bienvenida para nuevos pacientes' }
  };

  const handleSendEmail = async () => {
    if (!selectedPatient) {
      toast({ title: "Error", description: "Por favor, selecciona un paciente.", variant: "destructive" });
      return;
    }

    setIsSending(true);

    try {
      // Obtener datos de la próxima cita del paciente
      const appointments = JSON.parse(localStorage.getItem('clinic_appointments') || '[]');
      const nextAppointment = appointments
        .filter(a => 
          (a.patientId === selectedPatient.id || a.patientName === selectedPatient.name) && 
          new Date(a.date) > new Date()
        )
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

      const professionals = JSON.parse(localStorage.getItem('clinic_professionals') || '[]');
      const professional = nextAppointment ? 
        professionals.find(p => p.id.toString() === nextAppointment.professionalId) : null;

      const emailData = {
        patient_name: selectedPatient.name,
        professional_name: professional?.name || nextAppointment?.professionalName || 'Profesional Asignado',
        appointment_date: nextAppointment ? 
          `${new Date(nextAppointment.date).toLocaleDateString('es-ES')} a las ${nextAppointment.time}` : 
          'Próxima cita pendiente',
        appointment_type: nextAppointment?.type || 'Consulta General',
        folio: nextAppointment?.folio || '',
        patient_notes: nextAppointment?.notes || ''
      };

      const result = await EmailService.sendEmail(selectedTemplate, selectedPatient.email, emailData);

      if (result.success) {
        toast({ 
          title: "¡Correo enviado!", 
          description: `Notificación enviada a ${selectedPatient.name}.` 
        });
      }

    } catch (error) {
      toast({ 
        title: "Error al enviar", 
        description: error.message || "Ocurrió un error al enviar el correo.", 
        variant: "destructive" 
      });
      console.error('Error enviando email:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handlePreviewEmail = () => {
    if (!selectedPatient) {
      toast({ title: "Error", description: "Por favor, selecciona un paciente para previsualizar.", variant: "destructive" });
      return;
    }

    // Datos de ejemplo para previsualización
    const appointments = JSON.parse(localStorage.getItem('clinic_appointments') || '[]');
    const nextAppointment = appointments
      .filter(a => 
        (a.patientId === selectedPatient.id || a.patientName === selectedPatient.name) && 
        new Date(a.date) > new Date()
      )
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

    const professionals = JSON.parse(localStorage.getItem('clinic_professionals') || '[]');
    const professional = nextAppointment ? 
      professionals.find(p => p.id.toString() === nextAppointment.professionalId) : null;

    const previewData = {
      patient_name: selectedPatient.name,
      professional_name: professional?.name || nextAppointment?.professionalName || 'Dr. Ejemplo',
      appointment_date: nextAppointment ? 
        `${new Date(nextAppointment.date).toLocaleDateString('es-ES')} a las ${nextAppointment.time}` : 
        '15 de Enero de 2024 a las 10:00',
      appointment_type: nextAppointment?.type || 'Consulta General',
      folio: nextAppointment?.folio || 'GMD-240115-ABCD',
      patient_notes: nextAppointment?.notes || ''
    };

    EmailService.previewTemplate(selectedTemplate, previewData);
  };

  return (
    <div className="bg-card rounded-xl shadow-lg p-4 sm:p-6 border border-border/50">
      <h2 className="text-xl font-semibold text-card-foreground mb-6 flex items-center">
        <Send className="w-5 h-5 mr-2 text-primary" />
        Enviar Notificación Manual
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Seleccionar Paciente</label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
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
                        onSelect={() => {
                          setSelectedPatient(patient)
                          setOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedPatient?.id === patient.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {patient.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Tipo de Notificación</label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
          >
            {Object.entries(emailTemplates).map(([key, template]) => (
              <option key={key} value={key}>{template.name}</option>
            ))}
          </select>
          {emailTemplates[selectedTemplate] && (
            <p className="text-xs text-muted-foreground mt-1">
              {emailTemplates[selectedTemplate].description}
            </p>
          )}
        </div>

        <div className="flex space-x-2">
          <Button 
            onClick={handlePreviewEmail} 
            variant="outline" 
            disabled={!selectedPatient}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            Previsualizar
          </Button>
          <Button 
            onClick={handleSendEmail} 
            disabled={isSending || !selectedPatient} 
            className="flex-1 button-primary-gradient"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSending ? 'Enviando...' : 'Enviar Correo'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmailSendPanel;