import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Clock, TrendingUp, AlertCircle, Briefcase } from 'lucide-react';
import apiService from '@/services/ApiService';

const Dashboard = () => {
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalProfessionals: 0,
    totalPatients: 0,
    pendingAppointments: 0,
    totalDisciplines: 0,
  });
  const [clinicName, setClinicName] = useState("Grupo Médico Delux");
  const [loading, setLoading] = useState(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const storedClinicName = localStorage.getItem('clinic_name');
    if (storedClinicName) {
        setClinicName(storedClinicName);
    }

    loadDashboardData();
  }, []);

  const formatDateLabel = (dateStr) => {
    try {
      const today = new Date();
      const target = new Date(dateStr + 'T00:00:00');
      const isToday = target.toDateString() === today.toDateString();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const isYesterday = target.toDateString() === yesterday.toDateString();
      if (isToday) return 'Hoy';
      if (isYesterday) return 'Ayer';
      return target.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar datos desde la API
      const [appointments, professionals, patients, disciplines] = await Promise.all([
        apiService.getAppointments(),
        apiService.getProfessionals(),
        apiService.getPatients(),
        apiService.getDisciplines()
      ]);

      // Estadísticas
      const today = new Date().toDateString();
      const todayAppointments = (appointments || []).filter(apt => 
        new Date(apt.date).toDateString() === today
      ).length;

      const pendingAppointments = (appointments || []).filter(apt => 
        (apt.status || '').toLowerCase() === 'programada'
      ).length;

      setStats({
        todayAppointments,
        totalProfessionals: (professionals || []).length,
        totalPatients: (patients || []).length,
        pendingAppointments,
        totalDisciplines: (disciplines || []).length,
      });

      // Próximas citas (siguientes 5 futuras)
      const now = new Date();
      const enriched = (appointments || []).map(a => {
        // Combinar date y time si existen por separado
        let start = null;
        try {
          // Normalizar hora (HH:mm o HH:mm:ss)
          const time = (a.time || '00:00').slice(0,5);
          start = new Date(`${a.date}T${time}:00`);
        } catch {
          start = new Date(a.date);
        }
        return { ...a, _start: start };
      });

      const upcoming = enriched
        .filter(a => a._start && a._start >= now && ((a.status || '').toLowerCase() !== 'cancelada'))
        .sort((a, b) => a._start - b._start)
        .slice(0, 5)
        .map(a => ({
          id: a.id,
          patient: a.patient_name || a.patient_full_name || 'Paciente',
          professional: a.professional_name || a.professional_full_name || 'Profesional',
          type: a.type || 'Consulta',
          time: a._start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          dateLabel: formatDateLabel(a.date)
        }));
      setUpcomingAppointments(upcoming);

      // Actividad reciente (últimas 6 citas por fecha/hora)
      const recent = enriched
        .filter(a => a._start)
        .sort((a, b) => b._start - a._start)
        .slice(0, 6)
        .map(a => ({
          id: a.id,
          type: 'appointment',
          message: `${a.patient_name || a.patient_full_name || 'Paciente'} con ${a.professional_name || a.professional_full_name || 'Profesional'} — ${a.type || 'Consulta'}`,
          time: `${formatDateLabel(a.date)} · ${a._start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
        }));
      setRecentActivities(recent);

    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
      // En caso de error, mostrar valores por defecto
      setStats({
        todayAppointments: 0,
        totalProfessionals: 0,
        totalPatients: 0,
        pendingAppointments: 0,
        totalDisciplines: 0,
      });
      setUpcomingAppointments([]);
      setRecentActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Citas de Hoy', value: stats.todayAppointments, icon: Calendar, color: 'bg-primary', bgColor: 'bg-primary/10' },
    { title: 'Profesionales Activos', value: stats.totalProfessionals, icon: Users, color: 'bg-green-500', bgColor: 'bg-green-500/10' },
    { title: 'Disciplinas', value: stats.totalDisciplines, icon: Briefcase, color: 'bg-secondary-alt', bgColor: 'bg-secondary-alt/10' },
    { title: 'Pacientes Registrados', value: stats.totalPatients, icon: TrendingUp, color: 'bg-pink-500', bgColor: 'bg-pink-500/10' },
    { title: 'Citas Pendientes', value: stats.pendingAppointments, icon: Clock, color: 'bg-amber-500', bgColor: 'bg-amber-500/10' }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Cargando datos de {clinicName}...</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="bg-muted/20 rounded-xl p-4 sm:p-6 animate-pulse">
              <div className="h-12 bg-muted rounded mb-4"></div>
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-8 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-x-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Resumen general de {clinicName}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-sm text-muted-foreground">Última actualización</p>
          <p className="text-lg font-semibold text-foreground">
            {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${card.bgColor} rounded-xl p-4 sm:p-6 card-hover border border-border/50`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 sm:p-3 rounded-lg ${card.color}`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
              <p className="text-sm sm:text-base font-medium text-muted-foreground mt-2">{card.title}</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{card.value}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-card rounded-xl shadow-lg p-4 sm:p-6 border border-border/50">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">Actividad Reciente</h2>
          <div className="space-y-4">
            {recentActivities.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin actividad reciente</p>
            )}
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {activity.type === 'appointment' && <Calendar className="w-5 h-5 text-primary" />}
                  {activity.type === 'patient' && <Users className="w-5 h-5 text-green-500" />}
                  {activity.type === 'system' && <AlertCircle className="w-5 h-5 text-amber-500" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-card-foreground">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-card rounded-xl shadow-lg p-4 sm:p-6 border border-border/50">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">Próximas Citas</h2>
          <div className="space-y-4">
            {upcomingAppointments.length === 0 && (
              <p className="text-sm text-muted-foreground">No hay próximas citas</p>
            )}
            {upcomingAppointments.map((apt, idx) => (
              <div key={apt.id || idx} className={`flex items-center justify-between p-3 rounded-lg ${idx === 0 ? 'bg-primary/5' : 'bg-muted/30'}`}>
                <div>
                  <p className="font-medium text-sm text-card-foreground">{apt.patient}</p>
                  <p className="text-xs text-muted-foreground">{apt.type} · {apt.professional}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${idx === 0 ? 'text-primary' : 'text-foreground'}`}>{apt.time}</p>
                  <p className="text-xs text-muted-foreground">{apt.dateLabel}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl shadow-lg p-4 sm:p-6 border border-border/50">
        <h2 className="text-xl font-semibold text-card-foreground mb-4">Resumen Semanal</h2>
        <div className="grid grid-cols-7 gap-2 h-32">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, index) => {
            const height = Math.random() * 80 + 20;
            return (
              <div key={day} className="flex flex-col items-center justify-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: index * 0.1 }}
                  className="w-full bg-gradient-to-t from-secondary-alt to-primary rounded-t"
                />
                <p className="text-xs text-muted-foreground mt-2">{day}</p>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
