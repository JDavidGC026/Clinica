// Servicio centralizado para manejo de APIs - Corregido
class ApiService {
  constructor() {
    this.baseURL = this.detectBaseURL();
    this.logs = [];
    this.maxLogs = 100;
  }

  detectBaseURL() {
    // Siempre usar rutas relativas para mayor compatibilidad
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
    
    // Mantener solo los últimos logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Guardar en localStorage para persistencia
    localStorage.setItem('api_logs', JSON.stringify(this.logs));

    // Log en consola también
    console[level](`[API] ${message}`, data || '');
  }

  async request(endpoint, options = {}) {
    // Limpiar endpoint - remover .php si ya existe
    let cleanEndpoint = endpoint.replace(/\.php$/, '');
    
    // Separar endpoint base de parámetros
    const [baseEndpoint, queryParams] = cleanEndpoint.split('?');
    
    // Construir URL final
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
      
      // Clonar la respuesta para poder leerla múltiples veces
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
        // Si no se puede parsear como JSON, usar el clon
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

  // Métodos específicos para cada entidad
  async getHealthCheck() {
    return this.get('health-check');
  }

  // Usuarios
  async login(credentials) {
    return this.post('login', credentials);
  }

  async getUsers() {
    return this.get('users');
  }

  async createUser(userData) {
    return this.post('users', userData);
  }

  async updateUser(id, userData) {
    return this.put(`users?id=${id}`, userData);
  }

  async deleteUser(id) {
    return this.delete(`users?id=${id}`);
  }

  // Disciplinas
  async getDisciplines() {
    return this.get('disciplines');
  }

  async createDiscipline(disciplineData) {
    return this.post('disciplines', disciplineData);
  }

  async updateDiscipline(id, disciplineData) {
    return this.put(`disciplines?id=${id}`, disciplineData);
  }

  async deleteDiscipline(id) {
    return this.delete(`disciplines?id=${id}`);
  }

  // Profesionales
  async getProfessionals() {
    return this.get('professionals');
  }

  async createProfessional(professionalData) {
    return this.post('professionals', professionalData);
  }

  async updateProfessional(id, professionalData) {
    return this.put(`professionals?id=${id}`, professionalData);
  }

  async deleteProfessional(id) {
    return this.delete(`professionals?id=${id}`);
  }

  // Pacientes
  async getPatients() {
    return this.get('patients');
  }

  async createPatient(patientData) {
    return this.post('patients', patientData);
  }

  async updatePatient(id, patientData) {
    return this.put(`patients?id=${id}`, patientData);
  }

  async deletePatient(id) {
    return this.delete(`patients?id=${id}`);
  }

  // Citas
  async getAppointments() {
    return this.get('appointments');
  }

  async createAppointment(appointmentData) {
    return this.post('appointments', appointmentData);
  }

  async updateAppointment(id, appointmentData) {
    return this.put(`appointments?id=${id}`, appointmentData);
  }

  async deleteAppointment(id) {
    return this.delete(`appointments?id=${id}`);
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

  // Cargar logs desde localStorage al inicializar
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
}

// Crear instancia global
const apiService = new ApiService();
apiService.loadLogs();

export default apiService;