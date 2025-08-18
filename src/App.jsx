import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, Home, UserPlus, CalendarDays, Mail, LogOut, Menu, X, Settings, ShieldCheck, Briefcase, FileText, Activity, DollarSign, BarChart3, Stethoscope, Bug, RefreshCw } from 'lucide-react';
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
import UserManager from '@/components/UserManager';
import RoleManager from '@/components/RoleManager';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import PWAUpdateNotification from '@/components/PWAUpdateNotification';
import OfflineIndicator from '@/components/OfflineIndicator';
import SyncStatusIndicator from '@/components/SyncStatusIndicator';
import apiService from '@/services/ApiService';
import CacheManager from '@/services/CacheManager';

const ROLES = {
  SUPER_ADMIN: 'Super Administrador',
  SUPERVISOR: 'Supervisor',
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  MEDICOS_EXTERNOS: 'Médicos Externos',
  PROFESSIONAL: 'Profesional',
  RECEPTIONIST: 'Recepcionista',
  ASISTENTE_MEDICO: 'Asistente Médico',
  GESTION_PACIENTES: 'Gestion de Pacientes',
};

const CLINIC_NAME = "Clínica Delux";

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      if (!isViewAllowed(currentView, parsedUser.role, parsedUser.permissions)) {
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

    // Configurar listeners para eventos de sincronización
    const handleSyncSuccess = () => {
      setDbConnected(true);
    };

    const handleDataUpdated = (event) => {
      if (event.detail.source === 'database') {
        setDbConnected(true);
      }
    };

    // NUEVO: Listener para invalidación de cache
    const handleCacheInvalidated = (event) => {
      console.log('🔄 Cache invalidado para:', event.detail.entity);
      // Forzar re-render de componentes
      window.dispatchEvent(new Event('storage'));
    };

    // NUEVO: Listener para actualización forzada de datos
    const handleDataForceRefreshed = (event) => {
      console.log('✅ Datos actualizados para:', event.detail.entity);
      toast({
        title: "Datos actualizados",
        description: `Se han actualizado los datos de ${event.detail.entity}`,
      });
    };

    window.addEventListener('syncSuccess', handleSyncSuccess);
    window.addEventListener('dataUpdated', handleDataUpdated);
    window.addEventListener('cacheInvalidated', handleCacheInvalidated);
    window.addEventListener('dataForceRefreshed', handleDataForceRefreshed);

    // Manejar actualizaciones de app
    CacheManager.handleAppUpdate();

    return () => {
      window.removeEventListener('syncSuccess', handleSyncSuccess);
      window.removeEventListener('dataUpdated', handleDataUpdated);
      window.removeEventListener('cacheInvalidated', handleCacheInvalidated);
      window.removeEventListener('dataForceRefreshed', handleDataForceRefreshed);
    };
  }, []);

  const checkDatabaseConnection = async () => {
    try {
      await apiService.getHealthCheck();
      setDbConnected(true);
    } catch (error) {
      setDbConnected(false);
      console.error('Error conectando a la base de datos:', error);
      
      // Mostrar notificación de modo offline
      toast({
        title: "Modo Híbrido Activado",
        description: "Trabajando con datos locales. Los cambios se sincronizarán automáticamente.",
        variant: "default"
      });
    }
  };

  // NUEVO: Función para forzar actualización de datos
  const handleForceRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await apiService.forceRefreshAll();
      toast({
        title: "✅ Datos actualizados",
        description: "Se han cargado los datos más recientes de la base de datos.",
      });
    } catch (error) {
      console.error('Error forzando actualización:', error);
      toast({
        title: "Error de actualización",
        description: "No se pudieron actualizar todos los datos: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Función para limpiar cache al iniciar sesión
  const clearApplicationCache = async () => {
    try {
      // Usar la nueva función de limpieza suave
      await CacheManager.clearCacheForLogin(); // Función optimizada
      console.log('✅ Cache de aplicación limpiado');
      
      toast({
        title: "Cache limpiado",
        description: "Se ha limpiado el cache para evitar conflictos con actualizaciones.",
      });

    } catch (error) {
      console.error('Error limpiando cache:', error);
    }
  };

  // Función para sincronizar datos al cambiar de sección
  const syncDataForSection = async (sectionView) => {
    if (!dbConnected) return;

    setIsSyncing(true);
    
    try {
      // Mapear secciones a entidades de datos
      const sectionDataMap = {
        'appointments': ['appointments', 'patients', 'professionals'],
        'patients': ['patients'],
        'professionals': ['professionals', 'disciplines'],
        'disciplines': ['disciplines'],
        'calendar': ['appointments', 'patients', 'professionals'],
        'dashboard': ['appointments', 'patients', 'professionals', 'disciplines'],
        'professional-portal': ['appointments', 'patients', 'professionals'],
        'finances': ['appointments'],
        'reports': ['appointments', 'patients', 'professionals']
      };

      const entitiesToSync = sectionDataMap[sectionView] || [];
      
      if (entitiesToSync.length > 0) {
        console.log(`🔄 Sincronizando datos para sección: ${sectionView}`);
        
        // Sincronizar cada entidad necesaria
        const syncPromises = entitiesToSync.map(async (entity) => {
          try {
            switch (entity) {
              case 'appointments':
                await apiService.getAppointments();
                break;
              case 'patients':
                await apiService.getPatients();
                break;
              case 'professionals':
                await apiService.getProfessionals();
                break;
              case 'disciplines':
                await apiService.getDisciplines();
                break;
            }
          } catch (error) {
            console.warn(`Error sincronizando ${entity}:`, error);
          }
        });

        await Promise.all(syncPromises);
        
        console.log(`✅ Sincronización completada para: ${sectionView}`);
      }
      
    } catch (error) {
      console.error('Error en sincronización automática:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogin = async (userData) => {
    setIsLoading(true);
    try {
      // Limpiar cache antes del login
      await clearApplicationCache();
      
      const response = await apiService.login(userData);
      
      if (response && response.success) {
        setIsAuthenticated(true);
        setCurrentUser(response.user);
        localStorage.setItem('clinic_auth', 'true');
        localStorage.setItem('clinic_user', JSON.stringify(response.user));
        setCurrentView('dashboard');
        setDbConnected(true);
        
        toast({
          title: "¡Bienvenido!",
          description: `Hola ${response.user.name}, has iniciado sesión correctamente.`,
        });

        // Sincronizar datos iniciales después del login
        setTimeout(() => {
          syncDataForSection('dashboard');
        }, 1000);
        
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

  const handleLogout = async () => {
    // En logout sí podemos hacer limpieza completa con recarga
    await CacheManager.clearAllCache(true); // true = forzar recarga
    
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('dashboard');
    localStorage.removeItem('clinic_auth');
    localStorage.removeItem('clinic_user');
    
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente. Cache limpiado.",
    });
  };

  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, roles: [ROLES.SUPER_ADMIN, ROLES.SUPERVISOR, ROLES.ADMIN, ROLES.MANAGER, ROLES.MEDICOS_EXTERNOS, ROLES.PROFESSIONAL, ROLES.RECEPTIONIST, ROLES.ASISTENTE_MEDICO, ROLES.GESTION_PACIENTES] },
    { id: 'professional-portal', label: 'Portal Profesional', icon: Stethoscope, roles: [ROLES.SUPER_ADMIN, ROLES.SUPERVISOR, ROLES.ADMIN, ROLES.MANAGER, ROLES.MEDICOS_EXTERNOS, ROLES.PROFESSIONAL] },
    { id: 'appointments', label: 'Gestión de Citas', icon: Calendar, roles: [ROLES.SUPER_ADMIN, ROLES.SUPERVISOR, ROLES.ADMIN, ROLES.MANAGER, ROLES.MEDICOS_EXTERNOS, ROLES.PROFESSIONAL, ROLES.RECEPTIONIST, ROLES.ASISTENTE_MEDICO] },
    { id: 'calendar', label: 'Calendario', icon: CalendarDays, roles: [ROLES.SUPER_ADMIN, ROLES.SUPERVISOR, ROLES.ADMIN, ROLES.MANAGER, ROLES.MEDICOS_EXTERNOS, ROLES.PROFESSIONAL, ROLES.RECEPTIONIST, ROLES.ASISTENTE_MEDICO] },
    { id: 'professionals', label: 'Profesionales', icon: Users, roles: [ROLES.SUPER_ADMIN, ROLES.SUPERVISOR, ROLES.ADMIN, ROLES.MANAGER] },
    { id: 'disciplines', label: 'Disciplinas', icon: Briefcase, roles: [ROLES.SUPER_ADMIN, ROLES.SUPERVISOR, ROLES.ADMIN, ROLES.MANAGER] },
    { id: 'users', label: 'Usuarios', icon: Users, roles: [ROLES.SUPER_ADMIN, ROLES.SUPERVISOR, ROLES.ADMIN] },
    { id: 'roles', label: 'Roles', icon: ShieldCheck, roles: [ROLES.SUPER_ADMIN, ROLES.SUPERVISOR, ROLES.ADMIN] },
    { id: 'patients', label: 'Pacientes', icon: UserPlus, roles: [ROLES.SUPER_ADMIN, ROLES.SUPERVISOR, ROLES.ADMIN, ROLES.MANAGER, ROLES.MEDICOS_EXTERNOS, ROLES.PROFESSIONAL, ROLES.RECEPTIONIST, ROLES.ASISTENTE_MEDICO, ROLES.GESTION_PACIENTES] },
    { id: 'finances', label: 'Ingresos/Egresos', icon: BarChart3, roles: [ROLES.SUPER_ADMIN, ROLES.SUPERVISOR, ROLES.ADMIN, ROLES.MANAGER] },
    { id: 'emails', label: 'Notificaciones', icon: Mail, roles: [ROLES.SUPER_ADMIN, ROLES.SUPERVISOR, ROLES.ADMIN, ROLES.MANAGER, ROLES.MEDICOS_EXTERNOS, ROLES.PROFESSIONAL, ROLES.RECEPTIONIST, ROLES.ASISTENTE_MEDICO] },
    { id: 'reports', label: 'Reportes', icon: FileText, roles: [ROLES.SUPER_ADMIN, ROLES.SUPERVISOR, ROLES.ADMIN, ROLES.MANAGER, ROLES.MEDICOS_EXTERNOS, ROLES.PROFESSIONAL, ROLES.RECEPTIONIST, ROLES.ASISTENTE_MEDICO] },
    { id: 'api-logs', label: 'Logs de API', icon: Bug, roles: [ROLES.SUPER_ADMIN, ROLES.SUPERVISOR, ROLES.ADMIN, ROLES.MANAGER] },
    { id: 'settings', label: 'Configuración', icon: Settings, roles: [ROLES.SUPER_ADMIN, ROLES.SUPERVISOR, ROLES.ADMIN, ROLES.MANAGER] },
  ];

  // Permisos por vista (permite módulos legacy y nuevos *_manage)
  const permissionMap = {
    dashboard: [], // Siempre visible tras login
    'professional-portal': [{ module: 'professional-portal', level: 'read' }],
    appointments: [
      { module: 'appointments', level: 'read' },
      { module: 'appointments_manage', level: 'read' },
      { module: 'calendar', level: 'read' },
    ],
    calendar: [
      { module: 'calendar', level: 'read' },
      { module: 'appointments', level: 'read' },
    ],
    professionals: [
      { module: 'professionals', level: 'read' },
      { module: 'professionals_manage', level: 'read' },
    ],
    disciplines: [
      { module: 'disciplines', level: 'read' },
      { module: 'disciplines_manage', level: 'read' },
    ],
    users: [
      { module: 'users', level: 'read' },
      { module: 'users_manage', level: 'write' },
    ],
    roles: [
      { module: 'roles', level: 'read' },
      { module: 'roles_manage', level: 'write' },
    ],
    patients: [
      { module: 'patients', level: 'read' },
      { module: 'patients_manage', level: 'read' },
    ],
    finances: [
      { module: 'finances', level: 'read' },
    ],
    emails: [
      { module: 'emails', level: 'read' },
    ],
    reports: [
      { module: 'reports', level: 'read' },
      { module: 'reports_view', level: 'read' },
    ],
    'api-logs': [
      { module: 'api-logs', level: 'read' },
    ],
    settings: [
      { module: 'settings', level: 'read' },
      { module: 'settings_manage', level: 'write' },
    ],
  };

  const levelValue = (lvl) => (lvl === 'read' ? 1 : lvl === 'write' ? 2 : lvl === 'admin' ? 3 : 0);

  const hasModulePermission = (permissions, module, required = 'read') => {
    if (!permissions) return false;
    const lvl = permissions[module];
    if (!lvl) return false;
    return levelValue(lvl) >= levelValue(required);
  };

  const isViewAllowed = (viewId, userRole, userPermissions = null) => {
    const menuItem = allMenuItems.find(item => item.id === viewId);
    // 1) Compatibilidad: si el rol está en la whitelist legacy, permitir
    if (menuItem && menuItem.roles.includes(userRole)) return true;
    // 2) Si hay mapa de permisos, evaluar módulos requeridos
    const reqs = permissionMap[viewId];
    if (!reqs) return false;
    if (reqs.length === 0) return true; // vistas sin requisitos explícitos
    return reqs.some(req => hasModulePermission(userPermissions, req.module, req.level || 'read'));
  };
  
  const getVisibleMenuItems = (userRole, userPermissions = null) => {
    if (!userRole) return [];
    return allMenuItems.filter(item => isViewAllowed(item.id, userRole, userPermissions));
  };

  const handleSetView = async (view) => {
    if (currentUser && isViewAllowed(view, currentUser.role, currentUser.permissions)) {
      setCurrentView(view);
      
      // Sincronizar datos automáticamente al cambiar de sección
      await syncDataForSection(view);
      
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

  const SidebarContent = ({ isMobile = false }) => {
    const visibleItems = getVisibleMenuItems(currentUser?.role, currentUser?.permissions);
    return (
      <div className="h-full sidebar-flex-container mobile-sidebar">
        {/* Encabezado del Sidebar */}
        <div className="sidebar-header-fixed">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center mb-3">
                <img 
                  src="./logo.png" 
                  alt="Logo Delux" 
                  className="w-[220px] h-[180px] rounded-lg mr-3 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'inline';
                  }}
                />
                <Activity className="w-8 h-8 mr-2 text-accent-foreground-alt" style={{display: 'none'}}/>
              </div>
              <p className="text-primary-foreground/80 text-sm">Sistema de Gestión</p>
              <div className="mt-2 flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${dbConnected ? 'bg-green-400' : 'bg-yellow-400'}`}>
                </div>
                <span className="text-xs text-primary-foreground/70">
                  {dbConnected ? 'BD Conectada' : 'Modo Híbrido'}
                </span>
                {(isSyncing || isRefreshing) && (
                  <div className="ml-2 flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-primary-foreground/70 ml-1">
                      {isRefreshing ? 'Actualizando...' : 'Sync...'}
                    </span>
                  </div>
                )}
              </div>
              
              {dbConnected && (
                <div className="mt-2">
                  <Button
                    onClick={handleForceRefresh}
                    disabled={isRefreshing}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-primary-foreground/80 hover:text-white hover:bg-white/10 p-1 h-auto"
                  >
                    <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Actualizando...' : 'Actualizar datos'}
                  </Button>
                </div>
              )}
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
        </div>

        {/* Menú de Navegación con Scroll */}
        <div className="sidebar-nav custom-scrollbar flex-1 min-h-0">
          <nav className="space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSetView(item.id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all menu-item-mobile ${
                    currentView === item.id 
                      ? 'bg-white/20 text-white' 
                      : 'text-primary-foreground/80 hover:bg-white/10 hover:text-white'
                  }`}
                  disabled={isSyncing || isRefreshing}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {(isSyncing || isRefreshing) && currentView === item.id && (
                    <div className="ml-auto">
                      <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* Footer del Sidebar */}
        <div className="sidebar-footer-fixed">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full text-primary-foreground/80 hover:text-white hover:bg-white/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (currentUser && !isViewAllowed(currentView, currentUser.role, currentUser.permissions)) {
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
      case 'users':
        return <UserManager />;
      case 'roles':
        return <RoleManager />;
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
      <div className="min-h-screen min-h-dvh flex items-center justify-center p-3 sm:p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-900 relative overflow-hidden">
        {/* Decoración sutil de fondo */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl" />

        <LoginForm onLogin={handleLogin} clinicName={CLINIC_NAME} isLoading={isLoading} />
        <Toaster />
        <PWAInstallPrompt />
        <OfflineIndicator />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-dvh flex bg-background main-container">
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 w-80 sm:w-64 sidebar-gradient text-primary-foreground p-4 sm:p-6 shadow-2xl z-50 flex flex-col mobile-sidebar"
            >
              <SidebarContent isMobile={true} />
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
        <SidebarContent isMobile={true} />
      </div>

      <div className="flex-1 overflow-auto main-content">
        <div className="p-3 sm:p-4 lg:p-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mb-3 sm:mb-4 text-foreground menu-toggle-button"
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
      <SyncStatusIndicator />
    </div>
  );
}

export default App;