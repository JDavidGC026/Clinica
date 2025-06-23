import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, Home, UserPlus, CalendarDays, Mail, LogOut, Menu, X, Settings, ShieldCheck, Briefcase, FileText, Activity, DollarSign, BarChart3, Stethoscope, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/components/ui/use-toast';
import Dashboard from '@/components/Dashboard';
import AppointmentManager from '@/components/AppointmentManager';
import ProfessionalManager from '@/components/ProfessionalManager';
import CalendarView from '@/components/CalendarView';
import PatientManager from '@/components/PatientManager';
import EmailManager from '@/components/EmailManager';
import LoginForm from '@/components/LoginForm';
import SettingsManager from '@/components/SettingsManager';
import DisciplineManager from '@/components/DisciplineManager';
import ReportManager from '@/components/ReportManager';
import FinanceManager from '@/components/FinanceManager';
import ProfessionalPortal from '@/components/ProfessionalPortal';
import ApiLogsViewer from '@/components/ApiLogsViewer';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import PWAUpdateNotification from '@/components/PWAUpdateNotification';
import OfflineIndicator from '@/components/OfflineIndicator';
import apiService from '@/services/ApiService';

const ROLES = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  PROFESSIONAL: 'Profesional',
  RECEPTIONIST: 'Recepcionista',
};

const CLINIC_NAME = "Clínica Delux";

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedAuth = localStorage.getItem('clinic_auth');
    const savedUser = localStorage.getItem('clinic_user');
    const savedClinicName = localStorage.getItem('clinic_name');
    if (!savedClinicName) {
      localStorage.setItem('clinic_name', CLINIC_NAME);
    }
    
    if (savedAuth === 'true' && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setIsAuthenticated(true);
      setCurrentUser(parsedUser);
      if (!isViewAllowed(currentView, parsedUser.role)) {
        setCurrentView('dashboard');
      }
    }

    // Manejar parámetros URL para PWA shortcuts
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const view = urlParams.get('view');
    
    if (action === 'new-appointment' && savedAuth === 'true') {
      setCurrentView('appointments');
    } else if (view && savedAuth === 'true') {
      setCurrentView(view);
    }
    
    // Inicializar datos de ejemplo si no existen
    initializeExampleData();
  }, []);

  const initializeExampleData = () => {
    // Disciplinas
    if (!localStorage.getItem('clinic_disciplines')) {
      const initialDisciplines = [
        { id: 'medicina-general', name: 'Medicina General' },
        { id: 'pediatria', name: 'Pediatría' },
        { id: 'ginecologia', name: 'Ginecología' },
        { id: 'traumatologia-ortopedia', name: 'Traumatología y Ortopedia' },
        { id: 'urologia', name: 'Urología' },
        { id: 'medicina-interna', name: 'Medicina Interna' },
        { id: 'gastroenterologia', name: 'Gastroenterología' },
        { id: 'nutricion', name: 'Nutrición' },
        { id: 'dermatologia', name: 'Dermatología' },
        { id: 'psicologia-clinica', name: 'Psicología Clínica' },
      ];
      localStorage.setItem('clinic_disciplines', JSON.stringify(initialDisciplines));
    }
    
    // Profesionales
    if (!localStorage.getItem('clinic_professionals')) {
      const initialProfessionals = [
        {
          id: 1, name: 'Dr. Ana García', email: 'ana.garcia@clinicadelux.com', phone: '+52 55 1234 5678', disciplineId: 'medicina-general', license: 'COL-12345', experience: '8 años',
          schedule: { monday: { start: '09:00', end: '17:00', available: true }, tuesday: { start: '09:00', end: '17:00', available: true }, wednesday: { start: '09:00', end: '17:00', available: true }, thursday: { start: '09:00', end: '17:00', available: true }, friday: { start: '09:00', end: '15:00', available: true }, saturday: { start: '', end: '', available: false }, sunday: { start: '', end: '', available: false } },
          status: 'activo'
        },
        {
          id: 2, name: 'Dr. Carlos Ruiz', email: 'carlos.ruiz@clinicadelux.com', phone: '+52 55 2345 6789', disciplineId: 'pediatria', license: 'PED-67890', experience: '12 años',
          schedule: { monday: { start: '10:00', end: '18:00', available: true }, tuesday: { start: '10:00', end: '18:00', available: true }, wednesday: { start: '10:00', end: '18:00', available: true }, thursday: { start: '10:00', end: '18:00', available: true }, friday: { start: '10:00', end: '16:00', available: true }, saturday: { start: '09:00', end: '13:00', available: true }, sunday: { start: '', end: '', available: false } },
          status: 'activo'
        },
        {
          id: 3, name: 'Dra. María Fernández', email: 'maria.fernandez@clinicadelux.com', phone: '+52 55 3456 7890', disciplineId: 'ginecologia', license: 'GIN-11111', experience: '15 años',
          schedule: { monday: { start: '08:00', end: '16:00', available: true }, tuesday: { start: '08:00', end: '16:00', available: true }, wednesday: { start: '08:00', end: '16:00', available: true }, thursday: { start: '08:00', end: '16:00', available: true }, friday: { start: '08:00', end: '14:00', available: true }, saturday: { start: '', end: '', available: false }, sunday: { start: '', end: '', available: false } },
          status: 'activo'
        },
        {
          id: 4, name: 'Dr. Luis Martínez', email: 'luis.martinez@clinicadelux.com', phone: '+52 55 4567 8901', disciplineId: 'traumatologia-ortopedia', license: 'TRA-22222', experience: '10 años',
          schedule: { monday: { start: '07:00', end: '15:00', available: true }, tuesday: { start: '07:00', end: '15:00', available: true }, wednesday: { start: '07:00', end: '15:00', available: true }, thursday: { start: '07:00', end: '15:00', available: true }, friday: { start: '07:00', end: '13:00', available: true }, saturday: { start: '', end: '', available: false }, sunday: { start: '', end: '', available: false } },
          status: 'activo'
        }
      ];
      localStorage.setItem('clinic_professionals', JSON.stringify(initialProfessionals));
    }
    
    // Pacientes
    if (!localStorage.getItem('clinic_patients')) {
      const initialPatients = [
        {
          id: 1, name: 'Juan Pérez García', email: 'juan.perez@email.com', phone: '+52 55 1111 2222', age: 35, gender: 'masculino', 
          address: 'Av. Insurgentes 123, Col. Roma, CDMX', emergencyContact: 'María Pérez', emergencyPhone: '+52 55 3333 4444',
          medicalHistory: 'Hipertensión controlada', allergies: 'Ninguna conocida', medications: 'Losartán 50mg', notes: 'Paciente regular',
          createdAt: new Date().toISOString()
        },
        {
          id: 2, name: 'Ana Martínez López', email: 'ana.martinez@email.com', phone: '+52 55 5555 6666', age: 28, gender: 'femenino',
          address: 'Calle Reforma 456, Col. Juárez, CDMX', emergencyContact: 'Carlos Martínez', emergencyPhone: '+52 55 7777 8888',
          medicalHistory: 'Ninguna', allergies: 'Polen', medications: 'Ninguna', notes: 'Primera consulta',
          createdAt: new Date().toISOString()
        },
        {
          id: 3, name: 'Carlos Rodríguez Sánchez', email: 'carlos.rodriguez@email.com', phone: '+52 55 9999 0000', age: 42, gender: 'masculino',
          address: 'Av. Universidad 789, Col. Del Valle, CDMX', emergencyContact: 'Laura Rodríguez', emergencyPhone: '+52 55 1234 5678',
          medicalHistory: 'Diabetes tipo 2', allergies: 'Penicilina', medications: 'Metformina 850mg', notes: 'Control mensual',
          createdAt: new Date().toISOString()
        },
        {
          id: 4, name: 'María González Hernández', email: 'maria.gonzalez@email.com', phone: '+52 55 2468 1357', age: 31, gender: 'femenino',
          address: 'Calle Madero 321, Col. Centro, CDMX', emergencyContact: 'José González', emergencyPhone: '+52 55 9876 5432',
          medicalHistory: 'Ninguna', allergies: 'Mariscos', medications: 'Vitaminas prenatales', notes: 'Embarazo de 20 semanas',
          createdAt: new Date().toISOString()
        },
        {
          id: 5, name: 'Pedro Jiménez Morales', email: 'pedro.jimenez@email.com', phone: '+52 55 1357 2468', age: 55, gender: 'masculino',
          address: 'Av. Patriotismo 654, Col. San Pedro, CDMX', emergencyContact: 'Carmen Jiménez', emergencyPhone: '+52 55 5432 1098',
          medicalHistory: 'Artritis reumatoide', allergies: 'Aspirina', medications: 'Metotrexato', notes: 'Seguimiento reumatológico',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('clinic_patients', JSON.stringify(initialPatients));
    }
    
    // Citas
    if (!localStorage.getItem('clinic_appointments')) {
      // Generar fechas para las citas (hoy y próximos días)
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const formatDate = (date) => {
        return date.toISOString().split('T')[0];
      };
      
      const initialAppointments = [
        {
          id: 1, patientId: 1, patientName: 'Juan Pérez García', patientEmail: 'juan.perez@email.com', patientPhone: '+52 55 1111 2222',
          professionalId: 1, professionalName: 'Dr. Ana García', date: formatDate(today), time: '10:00', type: 'consulta-inicial',
          notes: 'Primera consulta por hipertensión', status: 'programada', paymentStatus: 'pendiente', cost: 800,
          folio: 'GMD-2023001', createdAt: new Date().toISOString()
        },
        {
          id: 2, patientId: 2, patientName: 'Ana Martínez López', patientEmail: 'ana.martinez@email.com', patientPhone: '+52 55 5555 6666',
          professionalId: 2, professionalName: 'Dr. Carlos Ruiz', date: formatDate(tomorrow), time: '11:30', type: 'consulta-inicial',
          notes: 'Revisión general', status: 'programada', paymentStatus: 'pagado', cost: 700,
          folio: 'GMD-2023002', createdAt: new Date().toISOString()
        },
        {
          id: 3, patientId: 3, patientName: 'Carlos Rodríguez Sánchez', patientEmail: 'carlos.rodriguez@email.com', patientPhone: '+52 55 9999 0000',
          professionalId: 3, professionalName: 'Dra. María Fernández', date: formatDate(nextWeek), time: '09:00', type: 'seguimiento',
          notes: 'Control de diabetes', status: 'programada', paymentStatus: 'pendiente', cost: 600,
          folio: 'GMD-2023003', createdAt: new Date().toISOString()
        },
        {
          id: 4, patientId: 4, patientName: 'María González Hernández', patientEmail: 'maria.gonzalez@email.com', patientPhone: '+52 55 2468 1357',
          professionalId: 3, professionalName: 'Dra. María Fernández', date: formatDate(today), time: '16:00', type: 'seguimiento',
          notes: 'Control de embarazo', status: 'programada', paymentStatus: 'pagado', cost: 900,
          folio: 'GMD-2023004', createdAt: new Date().toISOString()
        },
        {
          id: 5, patientId: 5, patientName: 'Pedro Jiménez Morales', patientEmail: 'pedro.jimenez@email.com', patientPhone: '+52 55 1357 2468',
          professionalId: 4, professionalName: 'Dr. Luis Martínez', date: formatDate(tomorrow), time: '12:00', type: 'seguimiento',
          notes: 'Revisión de artritis', status: 'programada', paymentStatus: 'pendiente', cost: 750,
          folio: 'GMD-2023005', createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('clinic_appointments', JSON.stringify(initialAppointments));
    }
  };

  const handleLogin = async (userData) => {
    setIsLoading(true);
    try {
      // Intentar login con API
      const response = await apiService.login(userData);
      
      if (response && response.success) {
        setIsAuthenticated(true);
        setCurrentUser(response.user);
        localStorage.setItem('clinic_auth', 'true');
        localStorage.setItem('clinic_user', JSON.stringify(response.user));
        setCurrentView('dashboard');
        toast({
          title: "¡Bienvenido!",
          description: `Hola ${response.user.name}, has iniciado sesión correctamente.`,
        });
      } else {
        toast({
          title: "Error de autenticación",
          description: "Usuario o contraseña incorrectos.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error de login:", error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar al servidor. Usando modo offline.",
        variant: "destructive"
      });
      
      // Fallback a usuarios locales
      const validUsers = [
        { username: 'admin', password: 'password', name: 'Admin General', role: 'Administrador', id: 1 },
        { username: 'gerente', password: 'password', name: 'Gerente Principal', role: 'Gerente', id: 2 },
        { username: 'profesional1', password: 'password', name: 'Dr. Carlos Ruiz', role: 'Profesional', id: 3 },
        { username: 'recepcion', password: 'password', name: 'María López', role: 'Recepcionista', id: 4 }
      ];
      
      const user = validUsers.find(
        u => u.username === userData.username && u.password === userData.password
      );
      
      if (user) {
        setIsAuthenticated(true);
        setCurrentUser(user);
        localStorage.setItem('clinic_auth', 'true');
        localStorage.setItem('clinic_user', JSON.stringify(user));
        setCurrentView('dashboard');
        toast({
          title: "¡Bienvenido!",
          description: `Hola ${user.name}, has iniciado sesión correctamente (modo offline).`,
        });
      } else {
        toast({
          title: "Error de autenticación",
          description: "Usuario o contraseña incorrectos.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('dashboard');
    localStorage.removeItem('clinic_auth');
    localStorage.removeItem('clinic_user');
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente.",
    });
  };

  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.PROFESSIONAL, ROLES.RECEPTIONIST] },
    { id: 'professional-portal', label: 'Portal Profesional', icon: Stethoscope, roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.PROFESSIONAL] },
    { id: 'appointments', label: 'Gestión de Citas', icon: Calendar, roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.PROFESSIONAL, ROLES.RECEPTIONIST] },
    { id: 'calendar', label: 'Calendario', icon: CalendarDays, roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.PROFESSIONAL, ROLES.RECEPTIONIST] },
    { id: 'professionals', label: 'Profesionales', icon: Users, roles: [ROLES.ADMIN, ROLES.MANAGER] },
    { id: 'disciplines', label: 'Disciplinas', icon: Briefcase, roles: [ROLES.ADMIN, ROLES.MANAGER] },
    { id: 'patients', label: 'Pacientes', icon: UserPlus, roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.PROFESSIONAL, ROLES.RECEPTIONIST] },
    { id: 'finances', label: 'Ingresos/Egresos', icon: BarChart3, roles: [ROLES.ADMIN, ROLES.MANAGER] },
    { id: 'emails', label: 'Notificaciones', icon: Mail, roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.PROFESSIONAL, ROLES.RECEPTIONIST] },
    { id: 'reports', label: 'Reportes', icon: FileText, roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.PROFESSIONAL, ROLES.RECEPTIONIST] },
    { id: 'api-logs', label: 'Logs de API', icon: Bug, roles: [ROLES.ADMIN, ROLES.MANAGER] },
    { id: 'settings', label: 'Configuración', icon: Settings, roles: [ROLES.ADMIN, ROLES.MANAGER] },
  ];

  const isViewAllowed = (viewId, userRole) => {
    const menuItem = allMenuItems.find(item => item.id === viewId);
    return menuItem ? menuItem.roles.includes(userRole) : false;
  };
  
  const getVisibleMenuItems = (userRole) => {
    if (!userRole) return [];
    return allMenuItems.filter(item => item.roles.includes(userRole));
  };

  const handleSetView = (view) => {
    if (currentUser && isViewAllowed(view, currentUser.role)) {
      setCurrentView(view);
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    } else {
      toast({
        title: "Acceso Denegado",
        description: "No tienes permiso para acceder a esta sección.",
        variant: "destructive",
      });
    }
  }

  const SidebarContent = () => {
    const visibleItems = getVisibleMenuItems(currentUser?.role);
    return (
      <>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center text-white">
              <Activity className="w-8 h-8 mr-2 text-accent-foreground-alt"/> {CLINIC_NAME}
            </h1>
            <p className="text-primary-foreground/80 text-sm">Sistema de Gestión</p>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden text-white" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="mb-8">
          <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-white">{currentUser?.name}</p>
              <p className="text-xs text-primary-foreground/80">{currentUser?.role}</p>
            </div>
          </div>
        </div>

        <nav className="space-y-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSetView(item.id)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all ${
                  currentView === item.id 
                    ? 'bg-white/20 text-white' 
                    : 'text-primary-foreground/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </motion.button>
            );
          })}
        </nav>

        <div className="mt-auto pt-8">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full text-primary-foreground/80 hover:text-white hover:bg-white/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </>
    );
  }

  const renderContent = () => {
    if (currentUser && !isViewAllowed(currentView, currentUser.role)) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <ShieldCheck size={64} className="text-destructive mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">Acceso Denegado</h2>
            <p className="text-muted-foreground">No tienes permiso para ver esta página. Por favor, selecciona una opción válida del menú.</p>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'professional-portal':
        return <ProfessionalPortal currentUser={currentUser} />;
      case 'appointments':
        return <AppointmentManager />;
      case 'professionals':
        return <ProfessionalManager />;
      case 'disciplines':
        return <DisciplineManager />;
      case 'calendar':
        return <CalendarView />;
      case 'patients':
        return <PatientManager />;
      case 'finances':
        return <FinanceManager />;
      case 'emails':
        return <EmailManager />;
      case 'reports':
        return <ReportManager />;
      case 'api-logs':
        return <ApiLogsViewer />;
      case 'settings':
        return <SettingsManager />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary to-accent-alt">
        <LoginForm onLogin={handleLogin} clinicName={CLINIC_NAME} isLoading={isLoading} />
        <Toaster />
        <PWAInstallPrompt />
        <OfflineIndicator />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 w-64 sidebar-gradient text-primary-foreground p-6 shadow-2xl z-50 flex flex-col"
            >
              <SidebarContent />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
          </>
        )}
      </AnimatePresence>

      <div className="hidden lg:flex lg:flex-col w-64 sidebar-gradient text-primary-foreground p-6 shadow-2xl">
        <SidebarContent />
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4 lg:p-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mb-4 text-foreground"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </Button>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <Toaster />
      <PWAInstallPrompt />
      <PWAUpdateNotification />
      <OfflineIndicator />
    </div>
  );
}

export default App;