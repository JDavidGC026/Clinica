class CacheManager {
  constructor() {
    this.cacheVersion = '1.0.1'; // Incrementar versión para forzar limpieza
    this.cacheName = `clinic-cache-${this.cacheVersion}`;
  }

  // Limpiar todo el cache del navegador
  async clearBrowserCache() {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const deletePromises = cacheNames.map(cacheName => caches.delete(cacheName));
        await Promise.all(deletePromises);
        console.log('✅ Cache del navegador limpiado completamente');
        return true;
      }
    } catch (error) {
      console.error('Error limpiando cache del navegador:', error);
      return false;
    }
  }

  // Limpiar localStorage selectivamente
  clearLocalStorageCache() {
    try {
      // Mantener solo configuraciones esenciales
      const keysToKeep = [
        'clinic_name',
        'clinic_address', 
        'clinic_phone',
        'clinic_email_config',
        'clinic_email_templates',
        'clinic_auth',
        'clinic_user',
        'clinic_timezone',
        'clinic_locale',
        'clinic_currency',
        'clinic_country',
        'clinic_city'
      ];
      
      const allKeys = Object.keys(localStorage);
      let removedCount = 0;
      
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
          removedCount++;
        }
      });

      console.log(`✅ LocalStorage limpiado: ${removedCount} elementos removidos`);
      return true;
    } catch (error) {
      console.error('Error limpiando localStorage:', error);
      return false;
    }
  }

  // Limpiar sessionStorage
  clearSessionStorage() {
    try {
      sessionStorage.clear();
      console.log('✅ SessionStorage limpiado');
      return true;
    } catch (error) {
      console.error('Error limpiando sessionStorage:', error);
      return false;
    }
  }

  // Limpiar cache de datos específicos (mantener configuración)
  clearDataCache() {
    try {
      const dataKeys = [
        'clinic_appointments',
        'clinic_patients',
        'clinic_professionals',
        'clinic_disciplines',
        'clinic_users',
        'clinic_expenses',
        'clinic_email_history',
        'clinic_sync_queue',
        'api_logs'
      ];

      let removedCount = 0;
      dataKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          removedCount++;
        }
      });

      console.log(`✅ Cache de datos limpiado: ${removedCount} elementos removidos`);
      return true;
    } catch (error) {
      console.error('Error limpiando cache de datos:', error);
      return false;
    }
  }

  // Limpiar cache completo (para login/logout)
  async clearAllCache() {
    try {
      const results = await Promise.all([
        this.clearBrowserCache(),
        this.clearLocalStorageCache(),
        this.clearSessionStorage()
      ]);

      const success = results.every(result => result === true);
      
      if (success) {
        console.log('✅ Cache completo limpiado exitosamente');
        
        // Forzar recarga de la página para asegurar que no queden residuos
        setTimeout(() => {
          window.location.reload(true);
        }, 100);
      }

      return success;
    } catch (error) {
      console.error('Error en limpieza completa de cache:', error);
      return false;
    }
  }

  // NUEVO: Invalidar cache específico después de operaciones CRUD
  async invalidateEntityCache(entity) {
    try {
      // Limpiar datos específicos de la entidad
      const entityKey = `clinic_${entity}`;
      localStorage.removeItem(entityKey);
      
      // Limpiar cola de sincronización para esta entidad
      const syncQueue = JSON.parse(localStorage.getItem('clinic_sync_queue') || '[]');
      const filteredQueue = syncQueue.filter(item => item.entity !== entity);
      localStorage.setItem('clinic_sync_queue', JSON.stringify(filteredQueue));
      
      console.log(`✅ Cache invalidado para entidad: ${entity}`);
      
      // Disparar evento para que los componentes se actualicen
      window.dispatchEvent(new CustomEvent('cacheInvalidated', {
        detail: { entity }
      }));
      
      return true;
    } catch (error) {
      console.error(`Error invalidando cache para ${entity}:`, error);
      return false;
    }
  }

  // NUEVO: Forzar actualización inmediata de datos
  async forceRefreshEntity(entity) {
    try {
      // Invalidar cache local
      await this.invalidateEntityCache(entity);
      
      // Forzar recarga desde la base de datos
      const apiService = (await import('./ApiService')).default;
      
      let freshData;
      switch (entity) {
        case 'users':
          freshData = await apiService.getUsers();
          break;
        case 'appointments':
          freshData = await apiService.getAppointments();
          break;
        case 'patients':
          freshData = await apiService.getPatients();
          break;
        case 'professionals':
          freshData = await apiService.getProfessionals();
          break;
        case 'disciplines':
          freshData = await apiService.getDisciplines();
          break;
        default:
          throw new Error(`Entidad no soportada: ${entity}`);
      }
      
      console.log(`✅ Datos actualizados para ${entity}:`, freshData.length, 'elementos');
      
      // Disparar evento de actualización
      window.dispatchEvent(new CustomEvent('dataForceRefreshed', {
        detail: { entity, data: freshData }
      }));
      
      return freshData;
    } catch (error) {
      console.error(`Error forzando actualización de ${entity}:`, error);
      throw error;
    }
  }

  // Verificar si hay cache obsoleto
  async checkForObsoleteCache() {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const obsoleteCaches = cacheNames.filter(name => 
          name.includes('clinic') && !name.includes(this.cacheVersion)
        );

        if (obsoleteCaches.length > 0) {
          console.log(`🔄 Encontrados ${obsoleteCaches.length} caches obsoletos`);
          
          // Eliminar caches obsoletos
          const deletePromises = obsoleteCaches.map(name => caches.delete(name));
          await Promise.all(deletePromises);
          
          console.log('✅ Caches obsoletos eliminados');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error verificando cache obsoleto:', error);
      return false;
    }
  }

  // Obtener información del cache
  async getCacheInfo() {
    try {
      const info = {
        browserCaches: 0,
        localStorageItems: 0,
        sessionStorageItems: 0,
        totalSize: 0
      };

      // Contar caches del navegador
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        info.browserCaches = cacheNames.length;
      }

      // Contar elementos en localStorage
      info.localStorageItems = Object.keys(localStorage).length;

      // Contar elementos en sessionStorage
      info.sessionStorageItems = Object.keys(sessionStorage).length;

      // Estimar tamaño (aproximado)
      let totalSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length;
        }
      }
      info.totalSize = Math.round(totalSize / 1024); // KB

      return info;
    } catch (error) {
      console.error('Error obteniendo información de cache:', error);
      return null;
    }
  }

  // Limpiar cache automáticamente en actualizaciones
  async handleAppUpdate() {
    try {
      const lastVersion = localStorage.getItem('app_version');
      const currentVersion = this.cacheVersion;

      if (lastVersion && lastVersion !== currentVersion) {
        console.log(`🔄 Actualización detectada: ${lastVersion} → ${currentVersion}`);
        
        // Limpiar cache de datos pero mantener configuración
        await this.clearDataCache();
        await this.checkForObsoleteCache();
        
        // Actualizar versión
        localStorage.setItem('app_version', currentVersion);
        
        console.log('✅ Cache actualizado para nueva versión');
        return true;
      }

      // Si es la primera vez, establecer versión
      if (!lastVersion) {
        localStorage.setItem('app_version', currentVersion);
      }

      return false;
    } catch (error) {
      console.error('Error manejando actualización de app:', error);
      return false;
    }
  }

  // CORREGIDO: Configurar headers para evitar cache del navegador
  static getNoCacheHeaders() {
    return {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
  }
}

export default new CacheManager();