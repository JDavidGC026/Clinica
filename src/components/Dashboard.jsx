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

  useEffect(() => {
    const storedClinicName = localStorage.getItem('clinic_name');
    if (storedClinicName) {
        setClinicName(storedClinicName);
    }

    loadDashboardData();
  }, []);

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

      const today = new Date().toDateString();
      const todayAppointments = appointments.filter(apt => 
        new Date(apt.date).toDateString() === today
      ).length;

      const pendingAppointments = appointments.filter(apt => 
        apt.status === 'programada'
      ).length;

      setStats({
        todayAppointments,
        totalProfessionals: professionals.length,
        totalPatients: patients.length,
        pendingAppointments,
        totalDisciplines: disciplines.length,
      });
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
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Citas de Hoy', value: stats.todayAppointments, icon: Calendar, color: 'from-primary to-accent-alt', bgColor: 'bg-primary/10' },
    { title: 'Profesionales Activos', value: stats.totalProfessionals, icon: Users, color: 'from-green-500 to-green-600', bgColor: 'bg-green-500/10' },
    { title: 'Disciplinas', value: stats.totalDisciplines, icon: Briefcase, color: 'from-secondary-alt to-accent-alt-dark', bgColor: 'bg-secondary-alt/10' },
    { title: 'Pacientes Registrados', value: stats.totalPatients, icon: TrendingUp, color: 'from-pink-500 to-rose-500', bgColor: 'bg-pink-500/10' },
    { title: 'Citas Pendientes', value: stats.pendingAppointments, icon: Clock, color: 'from-amber-500 to-orange-500', bgColor: 'bg-amber-500/10' }
  ];

  const recentActivities = [
    { id: 1, type: 'appointment', message: 'Nueva cita: Dr. García', time: '10:30 AM' },
    { id: 2, type: 'patient', message: 'Nuevo paciente: M. Rodríguez', time: '09:15 AM' },
    { id: 3, type: 'appointment', message: 'Cita completada: Dr. Ruiz', time: '08:45 AM' },
    { id: 4, type: 'system', message: 'Recordatorios enviados', time: '08:00 AM' }
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
                <div className={`p-2 sm:p-3 rounded-lg bg-gradient-to-r ${card.color}`}>
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
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
              <div>
                <p className="font-medium text-sm text-card-foreground">Ana Martínez</p>
                <p className="text-xs text-muted-foreground">Consulta General</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-primary">11:00</p>
                <p className="text-xs text-muted-foreground">Hoy</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-500/5 rounded-lg">
              <div>
                <p className="font-medium text-sm text-card-foreground">Carlos López</p>
                <p className="text-xs text-muted-foreground">Revisión</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-green-600">14:30</p>
                <p className="text-xs text-muted-foreground">Hoy</p>
              </div>
            </div>
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