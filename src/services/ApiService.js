// Servicio de API mejorado con almacenamiento híbrido
import HybridStorageService from './HybridStorageService';

class ApiService {
  constructor() {
    this.baseURL = this.detectBaseURL();
    this.logs = [];
    this.maxLogs = 100;
    this.hybridStorage = HybridStorageService;
  }

  detectBaseURL() {
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
    let cleanEndpoint = endpoint.replace(/\.php$/, '');
    const [baseEndpoint, queryParams] = cleanEndpoint.split('?');
    const finalEndpoint = queryParams ? `${baseEndpoint}.php?${queryParams}` : `${baseEndpoint}.php`;
    const url = `${this.baseURL}api/${finalEndpoint}`;
    
    const startTime = Date.now();

    this.log('info', `Iniciando petición: ${options.method || 'GET'} ${url}`, {
      endpoint: finalEndpoint,
      options: { ...options, body: options.body ? JSON.parse(options.body) : undefined }
    });

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
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

  // Métodos híbridos para cada entidad
  async getHealthCheck() {
    return this.get('health-check');
  }

  // Usuarios
  async login(credentials) {
    return this.post('login', credentials);
  }

  async getUsers() {
    try {
      // Intentar cargar desde BD
      const serverData = await this.get('users');
      
      // Guardar en almacenamiento híbrido
      localStorage.setItem('clinic_users', JSON.stringify(serverData));
      
      return serverData;
    } catch (error) {
      // Fallback a datos locales
      this.log('warn', 'Cargando usuarios desde almacenamiento local', { error: error.message });
      return this.hybridStorage.getFromLocalStorage('users');
    }
  }

  // Disciplinas con almacenamiento híbrido
  async getDisciplines() {
    try {
      const serverData = await this.get('disciplines');
      localStorage.setItem('clinic_disciplines', JSON.stringify(serverData));
      return serverData;
    } catch (error) {
      this.log('warn', 'Cargando disciplinas desde almacenamiento local', { error: error.message });
      return this.hybridStorage.getFromLocalStorage('disciplines');
    }
  }

  async createDiscipline(disciplineData) {
    try {
      // Intentar crear en BD
      const serverResponse = await this.post('disciplines', disciplineData);
      
      // Actualizar almacenamiento local
      await this.hybridStorage.saveData('disciplines', serverResponse, 'create', serverResponse.id);
      
      return serverResponse;
    } catch (error) {
      // Guardar solo localmente
      this.log('warn', 'Guardando disciplina solo localmente', { error: error.message });
      return await this.hybridStorage.saveData('disciplines', disciplineData, 'create');
    }
  }

  async updateDiscipline(id, disciplineData) {
    try {
      const serverResponse = await this.put(`disciplines?id=${id}`, disciplineData);
      await this.hybridStorage.saveData('disciplines', serverResponse, 'update', id);
      return serverResponse;
    } catch (error) {
      this.log('warn', 'Actualizando disciplina solo localmente', { error: error.message });
      return await this.hybridStorage.saveData('disciplines', { ...disciplineData, id }, 'update', id);
    }
  }

  async deleteDiscipline(id) {
    try {
      await this.delete(`disciplines?id=${id}`);
      await this.hybridStorage.saveData('disciplines', { id }, 'delete', id);
      return { success: true };
    } catch (error) {
      this.log('warn', 'Eliminando disciplina solo localmente', { error: error.message });
      return await this.hybridStorage.saveData('disciplines', { id }, 'delete', id);
    }
  }

  // Profesionales con almacenamiento híbrido
  async getProfessionals() {
    try {
      const serverData = await this.get('professionals');
      localStorage.setItem('clinic_professionals', JSON.stringify(serverData));
      return serverData;
    } catch (error) {
      this.log('warn', 'Cargando profesionales desde almacenamiento local', { error: error.message });
      return this.hybridStorage.getFromLocalStorage('professionals');
    }
  }

  async createProfessional(professionalData) {
    try {
      const serverResponse = await this.post('professionals', professionalData);
      await this.hybridStorage.saveData('professionals', serverResponse, 'create', serverResponse.id);
      return serverResponse;
    } catch (error) {
      this.log('warn', 'Guardando profesional solo localmente', { error: error.message });
      return await this.hybridStorage.saveData('professionals', professionalData, 'create');
    }
  }

  async updateProfessional(id, professionalData) {
    try {
      const serverResponse = await this.put(`professionals?id=${id}`, professionalData);
      await this.hybridStorage.saveData('professionals', serverResponse, 'update', id);
      return serverResponse;
    } catch (error) {
      this.log('warn', 'Actualizando profesional solo localmente', { error: error.message });
      return await this.hybridStorage.saveData('professionals', { ...professionalData, id }, 'update', id);
    }
  }

  async deleteProfessional(id) {
    try {
      await this.delete(`professionals?id=${id}`);
      await this.hybridStorage.saveData('professionals', { id }, 'delete', id);
      return { success: true };
    } catch (error) {
      this.log('warn', 'Eliminando profesional solo localmente', { error: error.message });
      return await this.hybridStorage.saveData('professionals', { id }, 'delete', id);
    }
  }

  // Pacientes con almacenamiento híbrido
  async getPatients() {
    try {
      const serverData = await this.get('patients');
      localStorage.setItem('clinic_patients', JSON.stringify(serverData));
      return serverData;
    } catch (error) {
      this.log('warn', 'Cargando pacientes desde almacenamiento local', { error: error.message });
      return this.hybridStorage.getFromLocalStorage('patients');
    }
  }

  async createPatient(patientData) {
    try {
      const serverResponse = await this.post('patients', patientData);
      await this.hybridStorage.saveData('patients', serverResponse, 'create', serverResponse.id);
      return serverResponse;
    } catch (error) {
      this.log('warn', 'Guardando paciente solo localmente', { error: error.message });
      return await this.hybridStorage.saveData('patients', patientData, 'create');
    }
  }

  async updatePatient(id, patientData) {
    try {
      const serverResponse = await this.put(`patients?id=${id}`, patientData);
      await this.hybridStorage.saveData('patients', serverResponse, 'update', id);
      return serverResponse;
    } catch (error) {
      this.log('warn', 'Actualizando paciente solo localmente', { error: error.message });
      return await this.hybridStorage.saveData('patients', { ...patientData, id }, 'update', id);
    }
  }

  async deletePatient(id) {
    try {
      await this.delete(`patients?id=${id}`);
      await this.hybridStorage.saveData('patients', { id }, 'delete', id);
      return { success: true };
    } catch (error) {
      this.log('warn', 'Eliminando paciente solo localmente', { error: error.message });
      return await this.hybridStorage.saveData('patients', { id }, 'delete', id);
    }
  }

  // Citas con almacenamiento híbrido
  async getAppointments() {
    try {
      const serverData = await this.get('appointments');
      localStorage.setItem('clinic_appointments', JSON.stringify(serverData));
      return serverData;
    } catch (error) {
      this.log('warn', 'Cargando citas desde almacenamiento local', { error: error.message });
      return this.hybridStorage.getFromLocalStorage('appointments');
    }
  }

  async createAppointment(appointmentData) {
    try {
      const serverResponse = await this.post('appointments', appointmentData);
      await this.hybridStorage.saveData('appointments', serverResponse, 'create', serverResponse.id);
      return serverResponse;
    } catch (error) {
      this.log('warn', 'Guardando cita solo localmente', { error: error.message });
      return await this.hybridStorage.saveData('appointments', appointmentData, 'create');
    }
  }

  async updateAppointment(id, appointmentData) {
    try {
      const serverResponse = await this.put(`appointments?id=${id}`, appointmentData);
      await this.hybridStorage.saveData('appointments', serverResponse, 'update', id);
      return serverResponse;
    } catch (error) {
      this.log('warn', 'Actualizando cita solo localmente', { error: error.message });
      return await this.hybridStorage.saveData('appointments', { ...appointmentData, id }, 'update', id);
    }
  }

  async deleteAppointment(id) {
    try {
      await this.delete(`appointments?id=${id}`);
      await this.hybridStorage.saveData('appointments', { id }, 'delete', id);
      return { success: true };
    } catch (error) {
      this.log('warn', 'Eliminando cita solo localmente', { error: error.message });
      return await this.hybridStorage.saveData('appointments', { id }, 'delete', id);
    }
  }

  // Emails
  async sendEmail(emailData) {
    return this.post('send-email', emailData);
  }

  async sendEmailFallback(emailData) {
    return this.post('send-email-fallback', emailData);
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

  // Métodos de sincronización
  async forceSyncAll() {
    return await this.hybridStorage.forceSyncAll();
  }

  getSyncStats() {
    return this.hybridStorage.getSyncStats();
  }
}

const apiService = new ApiService();
apiService.loadLogs();

export default apiService;