// Servicio de API mejorado con invalidación automática de cache
import HybridStorageService from './HybridStorageService';
import CacheManager from './CacheManager';

class ApiService {
  constructor() {
    this.baseURL = this.detectBaseURL();
    this.logs = [];
    this.maxLogs = 100;
    this.hybridStorage = HybridStorageService;
  }

  detectBaseURL() {
    // En desarrollo, usar el proxy de Vite
    if (window.location.hostname === 'localhost' && window.location.port === '3000') {
      return '/';
    }
    // En producción, usar ruta relativa
    return './';
  }

  log(level, message, data = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      url: window.location.href
    };

    this.logs.unshift(logEntry);
    
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    localStorage.setItem('api_logs', JSON.stringify(this.logs));
    console[level](`[API] ${message}`, data || '');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}api/${endpoint}`;
    
    const startTime = Date.now();

    this.log('info', `Iniciando petición: ${options.method || 'GET'} ${url}`, {
      endpoint: endpoint,
      options: { ...options, body: options.body ? JSON.parse(options.body) : undefined }
    });

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          // CORREGIDO: Usar la referencia correcta al método estático
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          ...options.headers
        },
        ...options
      });

      const duration = Date.now() - startTime;
      const responseClone = response.clone();
      
      try {
        const responseData = await response.json();
        
        if (responseClone.ok) {
          this.log('info', `Petición exitosa: ${responseClone.status} ${url} (${duration}ms)`, {
            status: responseClone.status,
            duration,
            data: responseData
          });
          return responseData;
        } else {
          this.log('error', `Error HTTP: ${responseClone.status} ${url} (${duration}ms)`, {
            status: responseClone.status,
            statusText: responseClone.statusText,
            error: responseData,
            duration
          });
          throw new Error(responseData.error || `HTTP ${responseClone.status}: ${responseClone.statusText}`);
        }
      } catch (jsonError) {
        const textResponse = await responseClone.text();
        this.log('error', `Error al parsear JSON: ${url} (${duration}ms)`, {
          status: responseClone.status,
          responseText: textResponse,
          jsonError: jsonError.message,
          duration
        });
        
        throw new Error(`Error de conexión con la base de datos: ${textResponse}`);
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.log('error', `Error en petición: ${url} (${duration}ms)`, {
        error: error.message,
        duration,
        type: 'REQUEST_ERROR'
      });
      
      throw error;
    }
  }

  // Métodos HTTP específicos
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Métodos híbridos para cada entidad con invalidación automática de cache
  async getHealthCheck() {
    return this.get('health-check.php');
  }

  // Usuarios con invalidación de cache
  async login(credentials) {
    return this.post('login.php', credentials);
  }

  async getUsers() {
    // No guardar en localStorage ni usar fallback: datos siempre en vivo
    // Invalidar rastros anteriores por si existen
    await CacheManager.invalidateEntityCache('users');
    const serverData = await this.get('users.php');
    // Notificar actualización para que listas se refresquen
    window.dispatchEvent(new CustomEvent('dataUpdated', {
      detail: { entity: 'users', data: serverData, source: 'database' }
    }));
    return serverData;
  }

  // Disciplinas con invalidación automática
  async getDisciplines() {
    try {
      await CacheManager.invalidateEntityCache('disciplines');
      const serverData = await this.get('disciplines.php');
      localStorage.setItem('clinic_disciplines', JSON.stringify(serverData));
      
      window.dispatchEvent(new CustomEvent('dataUpdated', {
        detail: { entity: 'disciplines', data: serverData, source: 'database' }
      }));
      
      return serverData;
    } catch (error) {
      this.log('warn', 'Cargando disciplinas desde almacenamiento local', { error: error.message });
      return this.hybridStorage.getFromLocalStorage('disciplines');
    }
  }

  async createDiscipline(disciplineData) {
    try {
      const serverResponse = await this.post('disciplines.php', disciplineData);
      
      // Invalidar cache inmediatamente después de crear
      await CacheManager.invalidateEntityCache('disciplines');
      
      await this.hybridStorage.saveData('disciplines', serverResponse, 'create', serverResponse.id);
      
      // Forzar actualización de datos
      setTimeout(() => this.getDisciplines(), 100);
      
      return serverResponse;
    } catch (error) {
      this.log('warn', 'Guardando disciplina solo localmente', { error: error.message });
      return await this.hybridStorage.saveData('disciplines', disciplineData, 'create');
    }
  }

  async updateDiscipline(id, disciplineData) {
    try {
      const serverResponse = await this.put(`disciplines.php?id=${id}`, disciplineData);
      
      await CacheManager.invalidateEntityCache('disciplines');
      await this.hybridStorage.saveData('disciplines', serverResponse, 'update', id);
      
      setTimeout(() => this.getDisciplines(), 100);
      
      return serverResponse;
    } catch (error) {
      this.log('warn', 'Actualizando disciplina solo localmente', { error: error.message });
      return await this.hybridStorage.saveData('disciplines', { ...disciplineData, id }, 'update', id);
    }
  }

  async deleteDiscipline(id) {
    try {
      // 1. Eliminar del servidor primero
      const result = await this.delete(`disciplines.php?id=${id}`);
      
      // 2. Limpiar TODOS los caches relacionados
      await CacheManager.invalidateEntityCache('disciplines');
      localStorage.removeItem('clinic_disciplines');
      sessionStorage.removeItem('clinic_disciplines');
      
      // 3. Actualizar storage local
      await this.hybridStorage.saveData('disciplines', { id }, 'delete', id);
      
      // 4. Forzar actualización inmediata del estado
      const freshData = await this.get('disciplines.php');
      localStorage.setItem('clinic_disciplines', JSON.stringify(freshData));
      
      // 5. Notificar a los componentes sobre el cambio
      window.dispatchEvent(new CustomEvent('disciplineDeleted', { 
        detail: { id, freshData } 
      }));
      
      this.log('success', `Disciplina ${id} eliminada correctamente`);
      return { success: true, data: freshData };
      
    } catch (error) {
      this.log('error', 'Error eliminando disciplina', { id, error: error.message });
      
      // Si falla el servidor, intentar eliminar localmente
      try {
        const result = await this.hybridStorage.saveData('disciplines', { id }, 'delete', id);
        
        // Limpiar caches locales también
        localStorage.removeItem('clinic_disciplines');
        sessionStorage.removeItem('clinic_disciplines');
        
        this.log('warn', 'Disciplina eliminada solo localmente');
        return { success: true, offline: true };
        
      } catch (localError) {
        this.log('error', 'Error eliminando disciplina localmente', { id, error: localError.message });
        throw new Error(`Error eliminando disciplina: ${error.message}`);
      }
    }
  }

  // Profesionales con invalidación automática
  async getProfessionals() {
    try {
      await CacheManager.invalidateEntityCache('professionals');
      const serverData = await this.get('professionals.php');
      localStorage.setItem('clinic_professionals', JSON.stringify(serverData));
      
      window.dispatchEvent(new CustomEvent('dataUpdated', {
        detail: { entity: 'professionals', data: serverData, source: 'database' }
      }));
      
      return serverData;
    } catch (error) {
      this.log('warn', 'Cargando profesionales desde almacenamiento local', { error: error.message });
      return this.hybridStorage.getFromLocalStorage('professionals');
    }
  }

  async createProfessional(professionalData) {
    try {
      const serverResponse = await this.post('professionals.php', professionalData);
      
      await CacheManager.invalidateEntityCache('professionals');
      await this.hybridStorage.saveData('professionals', serverResponse, 'create', serverResponse.id);
      
      setTimeout(() => this.getProfessionals(), 100);
      
      return serverResponse;
    } catch (error) {
      this.log('warn', 'Guardando profesional solo localmente', { error: error.message });
      return await this.hybridStorage.saveData('professionals', professionalData, 'create');
    }
  }

  async updateProfessional(id, professionalData) {
    try {
      const serverResponse = await this.put(`professionals.php?id=${id}`, professionalData);
      
      await CacheManager.invalidateEntityCache('professionals');
      await this.hybridStorage.saveData('professionals', serverResponse, 'update', id);
      
      setTimeout(() => this.getProfessionals(), 100);
      
      return serverResponse;
    } catch (error) {
      this.log('warn', 'Actualizando profesional solo localmente', { error: error.message });
      return await this.hybridStorage.saveData('professionals', { ...professionalData, id }, 'update', id);
    }
  }

  async deleteProfessional(id) {
    try {
      await this.delete(`professionals.php?id=${id}`);
      
      await CacheManager.invalidateEntityCache('professionals');
      await this.hybridStorage.saveData('professionals', { id }, 'delete', id);
      
      setTimeout(() => this.getProfessionals(), 100);
      
      return { success: true };
    } catch (error) {
      this.log('warn', 'Eliminando profesional solo localmente', { error: error.message });
      return await this.hybridStorage.saveData('professionals', { id }, 'delete', id);
    }
  }

  // Pacientes con invalidación automática
  async getPatients() {
    try {
      await CacheManager.invalidateEntityCache('patients');
      const serverData = await this.get('patients.php');
      localStorage.setItem('clinic_patients', JSON.stringify(serverData));
      
      window.dispatchEvent(new CustomEvent('dataUpdated', {
        detail: { entity: 'patients', data: serverData, source: 'database' }
      }));
      
      return serverData;
    } catch (error) {
      this.log('warn', 'Cargando pacientes desde almacenamiento local', { error: error.message });
      return this.hybridStorage.getFromLocalStorage('patients');
    }
  }

  async createPatient(patientData) {
    try {
      const serverResponse = await this.post('patients.php', patientData);
      
      await CacheManager.invalidateEntityCache('patients');
      await this.hybridStorage.saveData('patients', serverResponse, 'create', serverResponse.id);
      
      setTimeout(() => this.getPatients(), 100);
      
      return serverResponse;
    } catch (error) {
      this.log('warn', 'Guardando paciente solo localmente', { error: error.message });
      return await this.hybridStorage.saveData('patients', patientData, 'create');
    }
  }

  async updatePatient(id, patientData) {
    try {
      const serverResponse = await this.put(`patients.php?id=${id}`, patientData);
      
      await CacheManager.invalidateEntityCache('patients');
      await this.hybridStorage.saveData('patients', serverResponse, 'update', id);
      
      setTimeout(() => this.getPatients(), 100);
      
      return serverResponse;
    } catch (error) {
      this.log('warn', 'Actualizando paciente solo localmente', { error: error.message });
      return await this.hybridStorage.saveData('patients', { ...patientData, id }, 'update', id);
    }
  }

  async deletePatient(id) {
    try {
      await this.delete(`patients.php?id=${id}`);
      
      await CacheManager.invalidateEntityCache('patients');
      await this.hybridStorage.saveData('patients', { id }, 'delete', id);
      
      setTimeout(() => this.getPatients(), 100);
      
      return { success: true };
    } catch (error) {
      this.log('warn', 'Eliminando paciente solo localmente', { error: error.message });
      return await this.hybridStorage.saveData('patients', { id }, 'delete', id);
    }
  }

  // Citas con invalidación automática
  async getAppointments() {
    try {
      await CacheManager.invalidateEntityCache('appointments');
      const serverData = await this.get('appointments.php');
      localStorage.setItem('clinic_appointments', JSON.stringify(serverData));
      
      window.dispatchEvent(new CustomEvent('dataUpdated', {
        detail: { entity: 'appointments', data: serverData, source: 'database' }
      }));
      
      return serverData;
    } catch (error) {
      this.log('warn', 'Cargando citas desde almacenamiento local', { error: error.message });
      return this.hybridStorage.getFromLocalStorage('appointments');
    }
  }

  async createAppointment(appointmentData) {
    try {
      const serverResponse = await this.post('appointments.php', appointmentData);
      
      await CacheManager.invalidateEntityCache('appointments');
      await this.hybridStorage.saveData('appointments', serverResponse, 'create', serverResponse.id);
      
      setTimeout(() => this.getAppointments(), 100);
      
      return serverResponse;
    } catch (error) {
      this.log('warn', 'Guardando cita solo localmente', { error: error.message });
      return await this.hybridStorage.saveData('appointments', appointmentData, 'create');
    }
  }

  async updateAppointment(id, appointmentData) {
    try {
      const serverResponse = await this.put(`appointments.php?id=${id}`, appointmentData);
      
      await CacheManager.invalidateEntityCache('appointments');
      await this.hybridStorage.saveData('appointments', serverResponse, 'update', id);
      
      setTimeout(() => this.getAppointments(), 100);
      
      return serverResponse;
    } catch (error) {
      this.log('warn', 'Actualizando cita solo localmente', { error: error.message });
      return await this.hybridStorage.saveData('appointments', { ...appointmentData, id }, 'update', id);
    }
  }

  async deleteAppointment(id) {
    try {
      await this.delete(`appointments.php?id=${id}`);
      
      await CacheManager.invalidateEntityCache('appointments');
      await this.hybridStorage.saveData('appointments', { id }, 'delete', id);
      
      setTimeout(() => this.getAppointments(), 100);
      
      return { success: true };
    } catch (error) {
      this.log('warn', 'Eliminando cita solo localmente', { error: error.message });
      return await this.hybridStorage.saveData('appointments', { id }, 'delete', id);
    }
  }

  // Roles
  async getRoles() {
    try {
      // Incluir permisos y categorías para que el frontend tenga toda la información necesaria
      const serverData = await this.get('roles.php?include_permissions=1&include_categories=1');
      return serverData;
    } catch (error) {
      this.log('warn', 'Error cargando roles', { error: error.message });
      throw error;
    }
  }

  async createRole(roleData) {
    try {
      const serverResponse = await this.post('roles.php', roleData);
      return serverResponse;
    } catch (error) {
      this.log('warn', 'Error creando rol', { error: error.message });
      throw error;
    }
  }

  async updateRole(id, roleData) {
    try {
      const serverResponse = await this.put(`roles.php?id=${id}`, roleData);
      return serverResponse;
    } catch (error) {
      this.log('warn', 'Error actualizando rol', { error: error.message });
      throw error;
    }
  }

  async deleteRole(id) {
    try {
      await this.delete(`roles.php?id=${id}`);
      return { success: true };
    } catch (error) {
      this.log('warn', 'Error eliminando rol', { error: error.message });
      throw error;
    }
  }

  // Role Categories
  async getRoleCategories() {
    try {
      const serverData = await this.get('role-categories.php');
      return serverData;
    } catch (error) {
      this.log('warn', 'Error cargando categorías de roles', { error: error.message });
      throw error;
    }
  }

  async createRoleCategory(categoryData) {
    try {
      const serverResponse = await this.post('role-categories.php', categoryData);
      return serverResponse;
    } catch (error) {
      this.log('warn', 'Error creando categoría de rol', { error: error.message });
      throw error;
    }
  }

  async updateRoleCategory(id, categoryData) {
    try {
      const serverResponse = await this.put(`role-categories.php?id=${id}`, categoryData);
      return serverResponse;
    } catch (error) {
      this.log('warn', 'Error actualizando categoría de rol', { error: error.message });
      throw error;
    }
  }

  async deleteRoleCategory(id) {
    try {
      await this.delete(`role-categories.php?id=${id}`);
      return { success: true };
    } catch (error) {
      this.log('warn', 'Error eliminando categoría de rol', { error: error.message });
      throw error;
    }
  }

  // Emails
  async sendEmail(emailData) {
    return this.post('send-email.php', emailData);
  }

  async sendEmailFallback(emailData) {
    return this.post('send-email-fallback.php', emailData);
  }

  // Métodos de utilidad para logs
  getLogs(level = null) {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
    localStorage.removeItem('api_logs');
    this.log('info', 'Logs limpiados');
  }

  exportLogs() {
    const logsData = {
      exported_at: new Date().toISOString(),
      total_logs: this.logs.length,
      logs: this.logs
    };
    
    const blob = new Blob([JSON.stringify(logsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api_logs_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.log('info', 'Logs exportados');
  }

  loadLogs() {
    try {
      const savedLogs = localStorage.getItem('api_logs');
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
      }
    } catch (error) {
      console.error('Error cargando logs:', error);
      this.logs = [];
    }
  }


  // Notas Clínicas
  async getClinicalNotes(patientId, professionalId) {
    return this.get(`clinical-notes.php?patient_id=${patientId}&professional_id=${professionalId}`);
  }

  async saveClinicalNotes(patientId, professionalId, notes) {
    return this.post('clinical-notes.php', {
      patient_id: patientId,
      professional_id: professionalId,
      notes: notes
    });
  }

  // Métodos de sincronización
  async forceSyncAll() {
    return await this.hybridStorage.forceSyncAll();
  }

  getSyncStats() {
    return this.hybridStorage.getSyncStats();
  }

  // NUEVO: Método para forzar actualización completa
  async forceRefreshAll() {
    try {
      console.log('🔄 Forzando actualización completa de todos los datos...');
      
      // Limpiar todo el cache de datos
      await CacheManager.clearDataCache();
      
      // Recargar todas las entidades
      const entities = ['appointments', 'patients', 'professionals', 'disciplines'];
      const results = {};
      
      for (const entity of entities) {
        try {
          results[entity] = await CacheManager.forceRefreshEntity(entity);
        } catch (error) {
          console.error(`Error actualizando ${entity}:`, error);
          results[entity] = null;
        }
      }
      
      console.log('✅ Actualización completa finalizada:', results);
      return results;
    } catch (error) {
      console.error('Error en actualización completa:', error);
      throw error;
    }
  }
}

const apiService = new ApiService();
apiService.loadLogs();

export default apiService;
