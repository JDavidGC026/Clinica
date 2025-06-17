import React, { useState, useEffect } from 'react';
import { Send, Check, ChevronsUpDown } from 'lucide-react';
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

const EmailSendPanel = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('appointment-reminder');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [open, setOpen] = useState(false)
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const savedPatients = localStorage.getItem('clinic_patients');
    if (savedPatients) {
      setPatients(JSON.parse(savedPatients));
    }
  }, []);

  const handleSendEmail = () => {
    if (!selectedPatient) {
        toast({ title: "Error", description: "Por favor, selecciona un paciente.", variant: "destructive" });
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
    
    const appointments = JSON.parse(localStorage.getItem('clinic_appointments') || '[]');
    const nextAppointment = appointments
      .filter(a => a.patientId === selectedPatient.id && new Date(a.date) > new Date())
      .sort((a,b) => new Date(a.date) - new Date(b.date))[0];

    const templateParams = {
      patient_name: selectedPatient.name,
      psychologist_name: nextAppointment?.psychologistName || 'Psicólogo Asignado',
      appointment_date: nextAppointment ? `${new Date(nextAppointment.date).toLocaleDateString('es-ES')} a las ${nextAppointment.time}` : 'Próxima cita pendiente',
      to_email: selectedPatient.email
    };

    emailjs.send(config.serviceId, config.templateIds[templateKey], templateParams, config.publicKey)
      .then((response) => {
        toast({ title: "¡Correo enviado!", description: `Notificación enviada a ${selectedPatient.name}.` });
        
        const newEmail = {
          id: Date.now(),
          type: selectedTemplate,
          recipient: selectedPatient.email,
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
      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
        <Send className="w-5 h-5 mr-2" />
        Enviar Notificación Manual
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Paciente</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Notificación</label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {Object.entries(emailTemplates).map(([key, template]) => (
              <option key={key} value={key}>{template.name}</option>
            ))}
          </select>
        </div>
        
        <Button onClick={handleSendEmail} disabled={isSending || !selectedPatient} className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700">
          <Send className="w-4 h-4 mr-2" />
          {isSending ? 'Enviando...' : 'Enviar Correo'}
        </Button>
      </div>
    </div>
  );
};

export default EmailSendPanel;