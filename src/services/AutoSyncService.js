import apiService from './ApiService';
import HybridStorageService from './HybridStorageService';

class AutoSyncService {
  constructor() {
    this.syncInProgress = false;
    this.lastSyncTimes = {};
    this.syncInterval = 30000; // 30 segundos
    this.forceRefreshInterval = 300000; // 5 minutos para refresh completo
  }

  // Sincronizar datos específicos para una sección
  async syncSectionData(sectionView, forceRefresh = false) {
    if (this.syncInProgress && !forceRefresh) {
      console.log('⏳ Sincronización ya en progreso, saltando...');
      return;
    }

    this.syncInProgress = true;
    
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
        'reports': ['appointments', 'patients', 'professionals'],
        'emails': [], // No necesita sincronización automática
        'settings': [], // No necesita sincronización automática
        'api-logs': [] // No necesita sincronización automática
      };

      const entitiesToSync = sectionDataMap[sectionView] || [];
      
      if (entitiesToSync.length === 0) {
        console.log(`ℹ️ No hay datos para sincronizar en sección: ${sectionView}`);
        return { synced: 0, errors: 0 };
      }

      console.log(`🔄 Iniciando sincronización para sección: ${sectionView}`);
      
      const results = {
        synced: 0,
        errors: 0,
        entities: []
      };

      // Verificar si necesita sincronización (basado en tiempo)
      const now = Date.now();
      const lastSync = this.lastSyncTimes[sectionView] || 0;
      const timeSinceLastSync = now - lastSync;

      if (!forceRefresh && timeSinceLastSync < this.syncInterval) {
        console.log(`⏭️ Sincronización reciente para ${sectionView}, saltando...`);
        return results;
      }

      // Sincronizar cada entidad necesaria
      for (const entity of entitiesToSync) {
        try {
          console.log(`📥 Sincronizando ${entity}...`);
          
          let data;
          switch (entity) {
            case 'appointments':
              data = await apiService.getAppointments();
              break;
            case 'patients':
              data = await apiService.getPatients();
              break;
            case 'professionals':
              data = await apiService.getProfessionals();
              break;
            case 'disciplines':
              data = await apiService.getDisciplines();
              break;
            default:
              console.warn(`⚠️ Entidad no reconocida: ${entity}`);
              continue;
          }

          if (data) {
            results.synced++;
            results.entities.push(entity);
            console.log(`✅ ${entity} sincronizado: ${data.length} elementos`);
          }
          
        } catch (error) {
          console.error(`❌ Error sincronizando ${entity}:`, error);
          results.errors++;
        }
      }

      // Actualizar tiempo de última sincronización
      this.lastSyncTimes[sectionView] = now;
      
      console.log(`✅ Sincronización completada para ${sectionView}:`, results);
      
      // Disparar evento de sincronización completada
      window.dispatchEvent(new CustomEvent('sectionSyncCompleted', {
        detail: { 
          section: sectionView,
          results,
          timestamp: now
        }
      }));

      return results;
      
    } catch (error) {
      console.error(`❌ Error en sincronización de sección ${sectionView}:`, error);
      return { synced: 0, errors: 1 };
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sincronización inteligente basada en prioridad
  async smartSync(sectionView) {
    try {
      // Verificar conectividad
      if (!navigator.onLine) {
        console.log('📱 Sin conexión, usando datos locales');
        return { synced: 0, errors: 0, offline: true };
      }

      // Verificar si la BD está disponible
      try {
        await apiService.getHealthCheck();
      } catch (error) {
        console.log('🔌 BD no disponible, usando datos locales');
        return { synced: 0, errors: 0, dbUnavailable: true };
      }

      // Determinar si necesita sincronización forzada
      const now = Date.now();
      const lastSync = this.lastSyncTimes[sectionView] || 0;
      const timeSinceLastSync = now - lastSync;
      const forceRefresh = timeSinceLastSync > this.forceRefreshInterval;

      if (forceRefresh) {
        console.log(`🔄 Forzando refresh completo para ${sectionView}`);
      }

      return await this.syncSectionData(sectionView, forceRefresh);
      
    } catch (error) {
      console.error('Error en sincronización inteligente:', error);
      return { synced: 0, errors: 1 };
    }
  }

  // Obtener estadísticas de sincronización
  getSyncStats() {
    const now = Date.now();
    const stats = {
      sections: {},
      totalSyncs: 0,
      oldestSync: null,
      newestSync: null
    };

    Object.entries(this.lastSyncTimes).forEach(([section, timestamp]) => {
      const age = now - timestamp;
      stats.sections[section] = {
        lastSync: new Date(timestamp).toISOString(),
        ageMinutes: Math.round(age / 60000),
        needsSync: age > this.syncInterval
      };
      
      stats.totalSyncs++;
      
      if (!stats.oldestSync || timestamp < stats.oldestSync) {
        stats.oldestSync = timestamp;
      }
      
      if (!stats.newestSync || timestamp > stats.newestSync) {
        stats.newestSync = timestamp;
      }
    });

    return stats;
  }

  // Limpiar estadísticas de sincronización
  clearSyncStats() {
    this.lastSyncTimes = {};
    console.log('🧹 Estadísticas de sincronización limpiadas');
  }

  // Configurar intervalo de sincronización
  setSyncInterval(milliseconds) {
    this.syncInterval = Math.max(10000, milliseconds); // Mínimo 10 segundos
    console.log(`⏱️ Intervalo de sincronización configurado: ${this.syncInterval}ms`);
  }

  // Verificar si una sección necesita sincronización
  needsSync(sectionView) {
    const lastSync = this.lastSyncTimes[sectionView] || 0;
    const timeSinceLastSync = Date.now() - lastSync;
    return timeSinceLastSync > this.syncInterval;
  }
}

export default new AutoSyncService();