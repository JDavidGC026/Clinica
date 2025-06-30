import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/services/ApiService';

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
      const dateStr = selectedDate.toDateString();
      const dayAppts = appointments.filter(apt => 
        new Date(apt.date).toDateString() === dateStr
      ).sort((a, b) => a.time.localeCompare(b.time));
      setDayAppointments(dayAppts);
    }
  }, [selectedDate, appointments]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const appointmentsData = await apiService.getAppointments();
      setAppointments(appointmentsData);
      
      // Seleccionar la fecha actual por defecto
      const today = new Date();
      setSelectedDate(today);
      
      // Filtrar citas para la fecha actual
      const todayStr = today.toDateString();
      const todayAppts = appointmentsData.filter(apt => 
        new Date(apt.date).toDateString() === todayStr
      ).sort((a, b) => a.time.localeCompare(b.time));
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
    const startingDayOfWeek = firstDay.getDay(); // 0 for Sunday, 1 for Monday, etc.

    const days = [];
    // Adjust startingDayOfWeek to be 0 for Sunday, 1 for Monday ... 6 for Saturday to match typical calendar layouts
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
    
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.getFullYear() === date.getFullYear() && 
             aptDate.getMonth() === date.getMonth() && 
             aptDate.getDate() === date.getDate();
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
        </div>
        <Button
          onClick={() => toast({ title: "🚧 Funcionalidad no implementada", description: "Crear citas desde el calendario aún no está disponible. Puedes hacerlo desde 'Gestión de Citas'."})}
          className="w-full sm:w-auto button-primary-gradient"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Cita
        </Button>
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
                          title={`${apt.patientName} - ${apt.time}`}
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
                {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              {dayAppointments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No hay citas para este día.</p>
              ) : (
                <div className="space-y-3 max-h-[40vh] lg:max-h-[60vh] overflow-y-auto pr-2">
                  {dayAppointments.map(apt => (
                    <div key={apt.id} className="p-3 bg-muted/30 rounded-lg border-l-4" style={{borderColor: getStatusColor(apt.status)}}>
                      <p className="font-bold text-card-foreground text-sm">{apt.time}</p>
                      <p className="text-sm text-card-foreground">{apt.patientName}</p>
                      <p className="text-xs text-muted-foreground">{apt.professionalName || apt.psychologistName}</p>
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