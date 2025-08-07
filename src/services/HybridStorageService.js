class HybridStorageService {
  constructor() {
    this.syncQueue = [];
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.lastSyncAttempt = null;
    this.syncInterval = null;
    
    // Configurar listeners
    this.setupEventListeners();
    
    // Iniciar sincronización automática
    this.startAutoSync();
  }

  setupEventListeners() {
    // Detectar cambios de conectividad
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingChanges();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Sincronizar cuando la ventana vuelve a tener foco
    window.addEventListener('focus', () => {
      if (this.isOnline) {
        this.syncPendingChanges();
      }
    });
  }

  startAutoSync() {
    // Sincronizar cada 30 segundos si hay conexión
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncPendingChanges();
      }
    }, 30000);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Generar ID único para operaciones
  generateId() {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Guardar datos localmente y en cola de sincronización
  async saveData(entity, data, operation = 'create', id = null) {
    const timestamp = new Date().toISOString();
    const localId = id || this.generateId();
    
    // Guardar localmente inmediatamente
    const localData = {
      ...data,
      id: localId,
      _localId: localId,
      _lastModified: timestamp,
      _syncStatus: 'pending',
      _operation: operation
    };

    this.saveToLocalStorage(entity, localData, operation);

    // Agregar a cola de sincronización
    const syncItem = {
      id: localId,
      entity,
      data: localData,
      operation,
      timestamp,
      attempts: 0,
      maxAttempts: 3
    };

    this.addToSyncQueue(syncItem);

    // Intentar sincronizar inmediatamente si hay conexión
    if (this.isOnline) {
      this.syncPendingChanges();
    }

    return localData;
  }

  // Cargar datos (primero local, luego sincronizar con BD)
  async loadData(entity) {
    // Cargar datos locales inmediatamente
    const localData = this.getFromLocalStorage(entity);
    
    // Intentar cargar desde BD en segundo plano
    if (this.isOnline) {
      this.syncFromDatabase(entity).catch(error => {
        console.warn(`Error sincronizando ${entity} desde BD:`, error);
      });
    }

    return localData;
  }

  // Guardar en localStorage
  saveToLocalStorage(entity, data, operation) {
    try {
      const storageKey = `clinic_${entity}`;
      let existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');

      if (operation === 'create') {
        existingData.push(data);
      } else if (operation === 'update') {
        const index = existingData.findIndex(item => 
          item.id === data.id || item._localId === data._localId
        );
        if (index !== -1) {
          existingData[index] = { ...existingData[index], ...data };
        } else {
          existingData.push(data);
        }
      } else if (operation === 'delete') {
        existingData = existingData.filter(item => 
          item.id !== data.id && item._localId !== data._localId
        );
      }

      localStorage.setItem(storageKey, JSON.stringify(existingData));
      
      // Disparar evento para actualizar UI
      window.dispatchEvent(new CustomEvent('localDataChanged', { 
        detail: { entity, operation, data } 
      }));

    } catch (error) {
      console.error(`Error guardando ${entity} localmente:`, error);
    }
  }

  // Obtener de localStorage
  getFromLocalStorage(entity) {
    try {
      const storageKey = `clinic_${entity}`;
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch (error) {
      console.error(`Error cargando ${entity} localmente:`, error);
      return [];
    }
  }

  // Agregar a cola de sincronización
  addToSyncQueue(item) {
    // Evitar duplicados
    const existingIndex = this.syncQueue.findIndex(
      queueItem => queueItem.id === item.id && queueItem.entity === item.entity
    );

    if (existingIndex !== -1) {
      // Actualizar item existente
      this.syncQueue[existingIndex] = item;
    } else {
      this.syncQueue.push(item);
    }

    // Guardar cola en localStorage
    localStorage.setItem('clinic_sync_queue', JSON.stringify(this.syncQueue));
  }

  // Cargar cola de sincronización
  loadSyncQueue() {
    try {
      const saved = localStorage.getItem('clinic_sync_queue');
      this.syncQueue = saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error cargando cola de sincronización:', error);
      this.syncQueue = [];
    }
  }

  // Sincronizar cambios pendientes con la BD
  async syncPendingChanges() {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;
    this.lastSyncAttempt = new Date().toISOString();

    try {
      // Cargar cola si no está cargada
      if (this.syncQueue.length === 0) {
        this.loadSyncQueue();
      }

      const itemsToSync = [...this.syncQueue];
      const successfulSyncs = [];
      const failedSyncs = [];

      for (const item of itemsToSync) {
        try {
          await this.syncSingleItem(item);
          successfulSyncs.push(item);
        } catch (error) {
          console.error(`Error sincronizando ${item.entity}:`, error);
          item.attempts = (item.attempts || 0) + 1;
          
          if (item.attempts >= item.maxAttempts) {
            console.error(`Máximo de intentos alcanzado para ${item.entity} ${item.id}`);
            // Marcar como error permanente pero mantener localmente
            this.markAsFailedSync(item);
          } else {
            failedSyncs.push(item);
          }
        }
      }

      // Actualizar cola con items fallidos
      this.syncQueue = failedSyncs;
      localStorage.setItem('clinic_sync_queue', JSON.stringify(this.syncQueue));

      // Notificar resultados
      if (successfulSyncs.length > 0) {
        console.log(`✅ Sincronizados ${successfulSyncs.length} elementos`);
        
        // Disparar evento de sincronización exitosa
        window.dispatchEvent(new CustomEvent('syncSuccess', {
          detail: { 
            synced: successfulSyncs.length,
            pending: this.syncQueue.length
          }
        }));
      }

    } catch (error) {
      console.error('Error en sincronización general:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sincronizar un elemento individual
  async syncSingleItem(item) {
    const { entity, data, operation } = item;
    
    // Preparar datos para envío (remover campos internos)
    const cleanData = { ...data };
    delete cleanData._localId;
    delete cleanData._lastModified;
    delete cleanData._syncStatus;
    delete cleanData._operation;

    let response;
    
    switch (operation) {
      case 'create':
        response = await this.apiRequest('POST', entity, cleanData);
        break;
      case 'update':
        response = await this.apiRequest('PUT', `${entity}?id=${cleanData.id}`, cleanData);
        break;
      case 'delete':
        response = await this.apiRequest('DELETE', `${entity}?id=${cleanData.id}`);
        break;
      default:
        throw new Error(`Operación no soportada: ${operation}`);
    }

    // Actualizar datos locales con respuesta de la BD
    if (response && operation !== 'delete') {
      this.updateLocalDataWithServerResponse(entity, data._localId, response);
    }

    return response;
  }

  // Sincronizar desde base de datos
  async syncFromDatabase(entity) {
    try {
      const serverData = await this.apiRequest('GET', entity);
      const localData = this.getFromLocalStorage(entity);
      
      // Combinar datos locales y del servidor
      const mergedData = this.mergeLocalAndServerData(localData, serverData);
      
      // Guardar datos combinados
      localStorage.setItem(`clinic_${entity}`, JSON.stringify(mergedData));
      
      // Disparar evento de actualización
      window.dispatchEvent(new CustomEvent('dataUpdated', {
        detail: { entity, data: mergedData, source: 'database' }
      }));

      return mergedData;
    } catch (error) {
      console.error(`Error sincronizando ${entity} desde BD:`, error);
      throw error;
    }
  }

  // Combinar datos locales y del servidor
  mergeLocalAndServerData(localData, serverData) {
    const merged = [...serverData];
    
    // Agregar elementos locales que no están en el servidor
    localData.forEach(localItem => {
      if (localItem._syncStatus === 'pending') {
        // Mantener elementos pendientes de sincronización
        const existsInServer = serverData.find(serverItem => 
          serverItem.id === localItem.id || 
          (localItem.email && serverItem.email === localItem.email)
        );
        
        if (!existsInServer) {
          merged.push(localItem);
        }
      }
    });

    return merged;
  }

  // Actualizar datos locales con respuesta del servidor
  updateLocalDataWithServerResponse(entity, localId, serverResponse) {
    const storageKey = `clinic_${entity}`;
    let localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    const index = localData.findIndex(item => item._localId === localId);
    if (index !== -1) {
      // Actualizar con datos del servidor pero mantener algunos campos locales
      localData[index] = {
        ...serverResponse,
        _syncStatus: 'synced',
        _lastModified: new Date().toISOString()
      };
      
      localStorage.setItem(storageKey, JSON.stringify(localData));
    }
  }

  // Marcar como fallo de sincronización
  markAsFailedSync(item) {
    const { entity, data } = item;
    const storageKey = `clinic_${entity}`;
    let localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    const index = localData.findIndex(item => item._localId === data._localId);
    if (index !== -1) {
      localData[index]._syncStatus = 'failed';
      localStorage.setItem(storageKey, JSON.stringify(localData));
    }
  }

  // Realizar petición a la API
  async apiRequest(method, endpoint, data = null) {
    const url = `./api/${endpoint}.php`;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return method !== 'DELETE' ? await response.json() : null;
  }

  // Obtener estadísticas de sincronización
  getSyncStats() {
    const entities = ['appointments', 'patients', 'professionals', 'disciplines'];
    const stats = {
      total: 0,
      synced: 0,
      pending: 0,
      failed: 0,
      lastSync: this.lastSyncAttempt
    };

    entities.forEach(entity => {
      const data = this.getFromLocalStorage(entity);
      data.forEach(item => {
        stats.total++;
        if (item._syncStatus === 'synced') {
          stats.synced++;
        } else if (item._syncStatus === 'pending') {
          stats.pending++;
        } else if (item._syncStatus === 'failed') {
          stats.failed++;
        }
      });
    });

    stats.queueLength = this.syncQueue.length;
    return stats;
  }

  // Forzar sincronización completa
  async forceSyncAll() {
    const entities = ['appointments', 'patients', 'professionals', 'disciplines'];
    
    for (const entity of entities) {
      try {
        await this.syncFromDatabase(entity);
      } catch (error) {
        console.error(`Error sincronizando ${entity}:`, error);
      }
    }

    await this.syncPendingChanges();
  }

  // Limpiar datos de sincronización
  clearSyncData() {
    this.syncQueue = [];
    localStorage.removeItem('clinic_sync_queue');
  }
}

export default new HybridStorageService();