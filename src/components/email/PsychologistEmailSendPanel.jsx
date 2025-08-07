import React, { useState, useEffect } from 'react';
import { Send, Check, ChevronsUpDown, User, Calendar, Eye } from 'lucide-react';
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

const PsychologistEmailSendPanel = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('professional-daily-summary');
  const [professionals, setProfessionals] = useState([]);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [open, setOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const savedProfessionals = localStorage.getItem('clinic_professionals');
    if (savedProfessionals) {
      setProfessionals(JSON.parse(savedProfessionals));
    }
  }, []);
  
  const getTomorrowAppointments = (professionalId) => {
    const appointments = JSON.parse(localStorage.getItem('clinic_appointments') || '[]');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const professionalAppointments = appointments.filter(a => 
        a.professionalId === professionalId && 
        new Date(a.date).toDateString() === tomorrow.toDateString()
    ).sort((a,b) => a.time.localeCompare(b.time));

    if (professionalAppointments.length === 0) {
        return "No tiene citas programadas para mañana.";
    }

    return professionalAppointments.map(a => `- ${a.time}: Cita con ${a.patientName}`).join('\n');
  }

  const professionalEmailTemplates = {
    'professional-daily-summary': { 
      name: 'Resumen Diario de Citas', 
      description: 'Envía el resumen de citas del día siguiente' 
    },
    'professional-new-appointment': { 
      name: 'Nueva Cita Asignada', 
      description: 'Notifica sobre una nueva cita asignada' 
    }
  };

  const handleSendEmail = async () => {
    if (!selectedProfessional) {
      toast({ title: "Error", description: "Por favor, selecciona un profesional.", variant: "destructive" });
      return;
    }

    if (selectedTemplate === 'professional-new-appointment') {
      toast({ 
        title: "Función no implementada", 
        description: "El envío de esta notificación debe ser automático cuando se cree una cita.",
        variant: "default"
      });
      return;
    }

    setIsSending(true);

    try {
      const emailData = {
        professional_name: selectedProfessional.name,
        daily_schedule: getTomorrowAppointments(selectedProfessional.id),
        patient_name: 'Paciente de Ejemplo',
        appointment_date: 'Fecha de Ejemplo'
      };

      const result = await EmailService.sendEmail(selectedTemplate, selectedProfessional.email, emailData);

      if (result.success) {
        toast({ 
          title: "¡Correo enviado!", 
          description: `Notificación enviada a ${selectedProfessional.name}.` 
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
    if (!selectedProfessional) {
      toast({ title: "Error", description: "Por favor, selecciona un profesional para previsualizar.", variant: "destructive" });
      return;
    }

    const previewData = {
      professional_name: selectedProfessional.name,
      daily_schedule: getTomorrowAppointments(selectedProfessional.id),
      patient_name: 'Juan Pérez',
      appointment_date: '15 de Enero de 2024 a las 10:00',
      appointment_type: 'Consulta General',
      folio: 'GMD-240115-ABCD'
    };

    EmailService.previewTemplate(selectedTemplate, previewData);
  };

  return (
    <div className="bg-card rounded-xl shadow-lg p-4 sm:p-6 border border-border/50">
      <h2 className="text-xl font-semibold text-card-foreground mb-6 flex items-center">
        <Send className="w-5 h-5 mr-2 text-primary" />
        Notificaciones para Profesionales
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Seleccionar Profesional</label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
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
                    {professionals.map((professional) => (
                      <CommandItem
                        key={professional.id}
                        value={professional.name}
                        onSelect={() => {
                          setSelectedProfessional(professional)
                          setOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedProfessional?.id === professional.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {professional.name}
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
            {Object.entries(professionalEmailTemplates).map(([key, template]) => (
              <option key={key} value={key}>{template.name}</option>
            ))}
          </select>
          {professionalEmailTemplates[selectedTemplate] && (
            <p className="text-xs text-muted-foreground mt-1">
              {professionalEmailTemplates[selectedTemplate].description}
            </p>
          )}
        </div>

        <div className="flex space-x-2">
          <Button 
            onClick={handlePreviewEmail} 
            variant="outline" 
            disabled={!selectedProfessional}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            Previsualizar
          </Button>
          <Button 
            onClick={handleSendEmail} 
            disabled={isSending || !selectedProfessional} 
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

export default PsychologistEmailSendPanel;