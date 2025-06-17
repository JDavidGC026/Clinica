import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dayAppointments, setDayAppointments] = useState([]);

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const dateStr = selectedDate.toDateString();
      const dayAppts = appointments.filter(apt => 
        new Date(apt.date).toDateString() === dateStr
      ).sort((a, b) => a.time.localeCompare(b.time));
      setDayAppointments(dayAppts);
    }
  }, [selectedDate, appointments]);

  const loadAppointments = () => {
    const saved = localStorage.getItem('clinic_appointments');
    if (saved) {
      setAppointments(JSON.parse(saved));
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
    // If your dayNames starts with Sunday, this is fine. If it starts with Monday, you might need to adjust.
    // My dayNames starts with Domingo (Sunday), so this should be correct.
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
    return appointments.filter(apt => new Date(apt.date).toDateString() === date.toDateString());
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const isToday = (date) => new Date().toDateString() === date.toDateString();
  const isSelected = (date) => selectedDate && date.toDateString() === selectedDate.toDateString();
  
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Calendario</h1>
          <p className="text-gray-600 mt-1">Vista general de citas programadas</p>
        </div>
        <Button
          onClick={() => toast({ title: "🚧 Funcionalidad no implementada", description: "Crear citas desde el calendario aún no está disponible. Puedes hacerlo desde 'Gestión de Citas'."})}
          className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg sm:text-xl font-semibold text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs sm:text-sm font-medium text-gray-500 mb-2">
            {dayNames.map(day => <div key={day}>{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {daysOfMonth.map((day, index) => (
              <div
                key={index}
                onClick={() => day && setSelectedDate(day.date)}
                className={`relative h-12 sm:h-20 flex items-center justify-center text-xs sm:text-sm rounded-lg cursor-pointer transition-all
                  ${day ? 'hover:bg-gray-100' : 'bg-gray-50'}
                  ${day && isToday(day.date) ? 'bg-blue-100 text-blue-600 font-bold' : ''}
                  ${day && isSelected(day.date) ? 'bg-purple-500 text-white' : ''}`}
              >
                {day && <span>{day.date.getDate()}</span>}
                {day && day.appointments.length > 0 && (
                  <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected(day.date) ? 'bg-white' : 'bg-purple-500'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          {selectedDate && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              {dayAppointments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay citas.</p>
              ) : (
                <div className="space-y-3 max-h-[40vh] lg:max-h-[60vh] overflow-y-auto pr-2">
                  {dayAppointments.map(apt => (
                    <div key={apt.id} className="p-3 bg-gray-50 rounded-lg border-l-4" style={{borderColor: getStatusColor(apt.status)}}>
                      <p className="font-bold text-gray-800 text-sm">{apt.time}</p>
                      <p className="text-sm text-gray-700">{apt.patientName}</p>
                      <p className="text-xs text-gray-500">{apt.professionalName || apt.psychologistName}</p>
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