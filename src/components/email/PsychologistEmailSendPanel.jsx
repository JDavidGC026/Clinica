import React, { useState, useEffect } from 'react';
import { Send, Check, ChevronsUpDown, User, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { emailTemplates } from '@/components/email/emailTemplates';
import emailjs from '@emailjs/browser';
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
  const [selectedTemplate, setSelectedTemplate] = useState('psychologist-daily-summary');
  const [psychologists, setPsychologists] = useState([]);
  const [selectedPsychologist, setSelectedPsychologist] = useState(null);
  const [open, setOpen] = useState(false)
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const savedPsychologists = localStorage.getItem('clinic_psychologists');
    if (savedPsychologists) {
      setPsychologists(JSON.parse(savedPsychologists));
    }
  }, []);
  
  const getTomorrowAppointments = (psychologistId) => {
    const appointments = JSON.parse(localStorage.getItem('clinic_appointments') || '[]');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const psychologistAppointments = appointments.filter(a => 
        a.psychologistId === psychologistId && 
        new Date(a.date).toDateString() === tomorrow.toDateString()
    ).sort((a,b) => a.time.localeCompare(b.time));

    if (psychologistAppointments.length === 0) {
        return "No tienes citas programadas para mañana.";
    }

    return psychologistAppointments.map(a => `- ${a.time}: Cita con ${a.patientName}`).join('\n');
  }

  const handleSendEmail = () => {
    if (!selectedPsychologist) {
        toast({ title: "Error", description: "Por favor, selecciona un psicólogo.", variant: "destructive" });
        return;
    }

    setIsSending(true);
    const config = JSON.parse(localStorage.getItem('clinic_email_config'));
    const templateKey = selectedTemplate;
    
    if (!config || !config.serviceId || !config.publicKey || !config.templateIds[templateKey]) {
      toast({
        title: "Configuración requerida",
        description: "Por favor, ve a Configuración para añadir tus credenciales de EmailJS.",
        variant: "destructive"
      });
      setIsSending(false);
      return;
    }

    const templateParams = {
      psychologist_name: selectedPsychologist.name,
      to_email: selectedPsychologist.email,
      daily_schedule: getTomorrowAppointments(selectedPsychologist.id),
      patient_name: 'Paciente de Ejemplo',
      appointment_date: 'Fecha de Ejemplo'
    };

    if (templateKey === 'psychologist-new-appointment') {
        toast({ title: "Función no implementada", description: "El envío de esta notificación debe ser automático. Puedes solicitar esta automatización."});
        setIsSending(false);
        return;
    }

    emailjs.send(config.serviceId, config.templateIds[templateKey], templateParams, config.publicKey)
      .then((response) => {
        toast({ title: "¡Correo enviado!", description: `Notificación enviada a ${selectedPsychologist.name}.` });
        
        const newEmail = {
          id: Date.now(),
          type: selectedTemplate,
          recipient: selectedPsychologist.email,
          subject: emailTemplates[selectedTemplate].subject,
          sentAt: new Date().toISOString(),
          status: 'enviado'
        };
        const currentHistory = JSON.parse(localStorage.getItem('clinic_email_history') || '[]');
        const updatedHistory = [newEmail, ...currentHistory];
        localStorage.setItem('clinic_email_history', JSON.stringify(updatedHistory));
        window.dispatchEvent(new Event('storage'));
        
      }, (err) => {
        toast({ title: "Error al enviar", description: "Revisa tu configuración y la consola.", variant: "destructive" });
        console.error('FAILED...', err);
      }).finally(() => {
        setIsSending(false);
      });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Psicólogo</label>
           <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {selectedPsychologist
                  ? selectedPsychologist.name
                  : "Selecciona un psicólogo..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Buscar psicólogo..." />
                <CommandList>
                  <CommandEmpty>No se encontró ningún psicólogo.</CommandEmpty>
                  <CommandGroup>
                    {psychologists.map((psychologist) => (
                      <CommandItem
                        key={psychologist.id}
                        value={psychologist.name}
                        onSelect={() => {
                          setSelectedPsychologist(psychologist)
                          setOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedPsychologist?.id === psychologist.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {psychologist.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Notificación</label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="psychologist-daily-summary">Resumen Diario de Citas</option>
            <option value="psychologist-new-appointment">Nueva Cita Asignada</option>
          </select>
        </div>
        
        <Button onClick={handleSendEmail} disabled={isSending || !selectedPsychologist} className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700">
          <Send className="w-4 h-4 mr-2" />
          {isSending ? 'Enviando...' : 'Enviar Correo'}
        </Button>
      </div>
    </div>
  );
};

export default PsychologistEmailSendPanel;