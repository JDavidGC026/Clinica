import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, User, Clock, Mail, Phone, Send, FileText, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/services/ApiService';
import EmailService from '@/services/EmailService';
import MexicoDateUtils from '@/utils/dateUtils';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dayAppointments, setDayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    if (selectedDate && appointments.length > 0) {
      // Usar formato de fecha correcto para comparación
      const selectedDateStr = MexicoDateUtils.formatDateFromDB(selectedDate.toISOString());
      const dayAppts = appointments.filter(apt => {
        const aptDateStr = MexicoDateUtils.formatDateFromDB(apt.date);
        return aptDateStr === selectedDateStr;
      }).sort((a, b) => a.time.localeCompare(b.time));
      setDayAppointments(dayAppts);
    }
  }, [selectedDate, appointments]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const appointmentsData = await apiService.getAppointments();
      console.log('📅 Citas cargadas para calendario:', appointmentsData);
      setAppointments(appointmentsData);
      
      // Seleccionar la fecha actual por defecto
      const today = new Date();
      setSelectedDate(today);
      
      // Filtrar citas para la fecha actual
      const todayStr = MexicoDateUtils.formatDateFromDB(today.toISOString());
      const todayAppts = appointmentsData.filter(apt => {
        const aptDateStr = MexicoDateUtils.formatDateFromDB(apt.date);
        return aptDateStr === todayStr;
      }).sort((a, b) => a.time.localeCompare(b.time));
      setDayAppointments(todayAppts);
    } catch (error) {
      console.error('Error cargando citas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las citas para el calendario.",
        variant: "destructive"
      });
      setAppointments([]);
      setDayAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const dayNames = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = new Date(year, month, day);
      days.push({
        date: currentDay,
        appointments: getAppointmentsForDate(currentDay)
      });
    }
    return days;
  };

  const getAppointmentsForDate = (date) => {
    if (!appointments || appointments.length === 0) return [];
    
    const dateStr = MexicoDateUtils.formatDateFromDB(date.toISOString());
    return appointments.filter(apt => {
      const aptDateStr = MexicoDateUtils.formatDateFromDB(apt.date);
      return aptDateStr === dateStr;
    });
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return today.getFullYear() === date.getFullYear() && 
           today.getMonth() === date.getMonth() && 
           today.getDate() === date.getDate();
  };
  
  const isSelected = (date) => {
    return selectedDate && 
           date.getFullYear() === selectedDate.getFullYear() && 
           date.getMonth() === selectedDate.getMonth() && 
           date.getDate() === selectedDate.getDate();
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'programada': return 'bg-blue-500';
      case 'completada': return 'bg-green-500';
      case 'cancelada': return 'bg-red-500';
      case 'en-progreso': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColorClass = (status) => {
    switch (status) {
      case 'programada': return 'border-l-blue-500 bg-blue-50';
      case 'completada': return 'border-l-green-500 bg-green-50';
      case 'cancelada': return 'border-l-red-500 bg-red-50';
      case 'en-progreso': return 'border-l-yellow-500 bg-yellow-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'pagado': return 'text-green-600 bg-green-100';
      case 'pendiente': return 'text-amber-600 bg-amber-100';
      case 'cancelado_sin_costo': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPaymentStatusLabel = (status) => {
    switch (status) {
      case 'pagado': return 'Pagado';
      case 'pendiente': return 'Pendiente';
      case 'cancelado_sin_costo': return 'Cancelado (S/C)';
      default: return status || 'Pendiente';
    }
  };

  const handleSendReminder = async (appointment) => {
    if (!appointment.patient_email) {
      toast({
        title: "Error",
        description: "No hay email registrado para este paciente.",
        variant: "destructive"
      });
      return;
    }

    if (!EmailService.isConfigured()) {
      toast({
        title: "Configuración requerida",
        description: "Configure las credenciales SMTP en Configuración primero.",
        variant: "destructive"
      });
      return;
    }

    try {
      const emailData = {
        patient_name: appointment.patient_name,
        professional_name: appointment.professional_name,
        appointment_date: MexicoDateUtils.formatDateTimeForDisplay(appointment.date, appointment.time),
        appointment_type: appointment.type,
        folio: appointment.folio
      };

      await EmailService.sendEmail('appointment-reminder-patient', appointment.patient_email, emailData);
      
      toast({
        title: "Recordatorio enviado",
        description: `Recordatorio enviado a ${appointment.patient_email}`,
      });
    } catch (error) {
      console.error('Error enviando recordatorio:', error);
      toast({
        title: "Error al enviar recordatorio",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const daysOfMonth = getDaysInMonth(currentDate);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Calendario</h1>
            <p className="text-muted-foreground mt-1">Cargando citas...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card rounded-xl shadow-lg p-6 border border-border/50 animate-pulse">
            <div className="h-8 bg-muted rounded mb-4 w-1/3 mx-auto"></div>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {[...Array(35)].map((_, i) => (
                <div key={i} className="h-12 bg-muted/20 rounded-lg"></div>
              ))}
            </div>
          </div>
          <div className="bg-card rounded-xl shadow-lg p-6 border border-border/50 animate-pulse">
            <div className="h-6 bg-muted rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted/20 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Calendario</h1>
          <p className="text-muted-foreground mt-1">Vista general de citas programadas</p>
          <p className="text-xs text-blue-600 mt-1">🇲🇽 Zona horaria: Ciudad de México (GMT-6)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-xl shadow-lg p-4 sm:p-6 border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg sm:text-xl font-semibold text-center text-card-foreground">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs sm:text-sm font-medium text-muted-foreground mb-2">
            {dayNames.map(day => <div key={day}>{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {daysOfMonth.map((day, index) => (
              <div
                key={index}
                onClick={() => day && setSelectedDate(day.date)}
                className={`relative h-12 sm:h-20 flex items-center justify-center text-xs sm:text-sm rounded-lg cursor-pointer transition-all
                  ${day ? 'hover:bg-muted/50' : 'bg-muted/20'}
                  ${day && isToday(day.date) ? 'bg-blue-100 text-blue-600 font-bold' : ''}
                  ${day && isSelected(day.date) ? 'bg-primary text-primary-foreground' : ''}`}
              >
                {day && <span>{day.date.getDate()}</span>}
                {day && day.appointments.length > 0 && (
                  <div className="absolute bottom-1 flex gap-0.5 justify-center">
                    {day.appointments.length <= 3 ? (
                      day.appointments.map((apt, i) => (
                        <div 
                          key={i} 
                          className={`w-1.5 h-1.5 rounded-full ${getStatusColor(apt.status)}`} 
                          title={`${apt.patient_name} - ${apt.time}`}
                        />
                      ))
                    ) : (
                      <>
                        <div className={`w-1.5 h-1.5 rounded-full bg-primary`} />
                        <div className="text-[10px] text-muted-foreground ml-0.5">
                          +{day.appointments.length}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-lg p-4 sm:p-6 border border-border/50">
          {selectedDate && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary" />
                {MexicoDateUtils.formatDateForDisplay(MexicoDateUtils.formatDateFromDB(selectedDate.toISOString()))}
              </h3>
              {dayAppointments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No hay citas para este día.</p>
              ) : (
                <div className="space-y-4 max-h-[40vh] lg:max-h-[60vh] overflow-y-auto pr-2">
                  {dayAppointments.map(apt => (
                    <div key={apt.id} className={`p-4 rounded-lg border-l-4 ${getStatusColorClass(apt.status)}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-bold text-card-foreground text-sm">{apt.time}</span>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(apt.payment_status)}`}>
                          {getPaymentStatusLabel(apt.payment_status)}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-card-foreground">{apt.patient_name}</span>
                        </div>
                        
                        {apt.patient_email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground truncate">{apt.patient_email}</span>
                          </div>
                        )}
                        
                        {apt.patient_phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{apt.patient_phone}</span>
                          </div>
                        )}
                        
                        <div className="text-xs text-muted-foreground">
                          <strong>Profesional:</strong> {apt.professional_name}
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          <strong>Tipo:</strong> {apt.type}
                        </div>
                        
                        {apt.folio && (
                          <div className="text-xs text-muted-foreground">
                            <strong>Folio:</strong> {apt.folio}
                          </div>
                        )}
                        
                        {apt.cost && parseFloat(apt.cost) > 0 && (
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              ${parseFloat(apt.cost).toFixed(2)} MXN
                            </span>
                          </div>
                        )}
                        
                        {apt.notes && (
                          <div className="text-xs text-muted-foreground">
                            <strong>Notas:</strong> {apt.notes}
                          </div>
                        )}
                      </div>
                      
                      {apt.patient_email && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendReminder(apt)}
                            className="w-full text-xs"
                          >
                            <Send className="w-3 h-3 mr-2" />
                            Enviar Recordatorio
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;