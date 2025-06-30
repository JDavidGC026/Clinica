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
  const [dbConnected, setDbConnected] = useState(false);

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
    
    // Verificar conexión a la base de datos
    checkDatabaseConnection();
  }, []);

  const checkDatabaseConnection = async () => {
    try {
      await apiService.getHealthCheck();
      setDbConnected(true);
    } catch (error) {
      setDbConnected(false);
      console.error('Error conectando a la base de datos:', error);
    }
  };

  const handleLogin = async (userData) => {
    setIsLoading(true);
    try {
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
        description: "No se pudo conectar a la base de datos. Verifica la configuración.",
        variant: "destructive"
      });
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
            <div className="mt-2 flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${dbConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-xs text-primary-foreground/70">
                {dbConnected ? 'BD Conectada' : 'BD Desconectada'}
              </span>
            </div>
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
    if (!dbConnected) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <Activity size={64} className="text-destructive mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">Error de Conexión</h2>
          <p className="text-muted-foreground mb-4">No se puede conectar a la base de datos. Verifica la configuración.</p>
          <Button onClick={checkDatabaseConnection} className="button-primary-gradient">
            Reintentar Conexión
          </Button>
        </div>
      );
    }

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