// Servicio centralizado para manejo de APIs con logs detallados
class ApiService {
  constructor() {
    this.baseURL = this.detectBaseURL();
    this.logs = [];
    this.maxLogs = 100;
  }

  detectBaseURL() {
    // Detectar automáticamente la URL base según el entorno
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('/public_html/')) {
      // Hosting compartido con public_html
      return currentPath.split('/public_html/')[0] + '/public_html/';
    } else if (currentPath.includes('/html/')) {
      // Hosting compartido con html
      return currentPath.split('/html/')[0] + '/html/';
    } else {
      // Desarrollo local o raíz del dominio
      return './';
    }
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
    const url = `${this.baseURL}api/${endpoint}`;
    const startTime = Date.now();

    this.log('info', `Iniciando petición: ${options.method || 'GET'} ${url}`, {
      endpoint,
      options: { ...options, body: options.body ? '[BODY_PRESENT]' : undefined }
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
      const responseData = await response.json();

      if (response.ok) {
        this.log('info', `Petición exitosa: ${response.status} ${url} (${duration}ms)`, {
          status: response.status,
          duration,
          dataSize: JSON.stringify(responseData).length
        });
        return responseData;
      } else {
        this.log('error', `Error HTTP: ${response.status} ${url} (${duration}ms)`, {
          status: response.status,
          statusText: response.statusText,
          error: responseData,
          duration
        });
        throw new Error(responseData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        this.log('error', `Error de conexión: ${url} (${duration}ms)`, {
          error: error.message,
          duration,
          type: 'CONNECTION_ERROR'
        });
        throw new Error('Error de conexión. Verifica tu conexión a internet y que el servidor esté funcionando.');
      } else {
        this.log('error', `Error en petición: ${url} (${duration}ms)`, {
          error: error.message,
          duration,
          type: 'REQUEST_ERROR'
        });
        throw error;
      }
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
    return this.get('health-check.php');
  }

  // Usuarios
  async login(credentials) {
    return this.post('login.php', credentials);
  }

  async getUsers() {
    return this.get('users.php');
  }

  async createUser(userData) {
    return this.post('users.php', userData);
  }

  async updateUser(id, userData) {
    return this.put(`users.php?id=${id}`, userData);
  }

  async deleteUser(id) {
    return this.delete(`users.php?id=${id}`);
  }

  // Disciplinas
  async getDisciplines() {
    return this.get('disciplines.php');
  }

  async createDiscipline(disciplineData) {
    return this.post('disciplines.php', disciplineData);
  }

  async updateDiscipline(id, disciplineData) {
    return this.put(`disciplines.php?id=${id}`, disciplineData);
  }

  async deleteDiscipline(id) {
    return this.delete(`disciplines.php?id=${id}`);
  }

  // Profesionales
  async getProfessionals() {
    return this.get('professionals.php');
  }

  async createProfessional(professionalData) {
    return this.post('professionals.php', professionalData);
  }

  async updateProfessional(id, professionalData) {
    return this.put(`professionals.php?id=${id}`, professionalData);
  }

  async deleteProfessional(id) {
    return this.delete(`professionals.php?id=${id}`);
  }

  // Pacientes
  async getPatients() {
    return this.get('patients.php');
  }

  async createPatient(patientData) {
    return this.post('patients.php', patientData);
  }

  async updatePatient(id, patientData) {
    return this.put(`patients.php?id=${id}`, patientData);
  }

  async deletePatient(id) {
    return this.delete(`patients.php?id=${id}`);
  }

  // Citas
  async getAppointments() {
    return this.get('appointments.php');
  }

  async createAppointment(appointmentData) {
    return this.post('appointments.php', appointmentData);
  }

  async updateAppointment(id, appointmentData) {
    return this.put(`appointments.php?id=${id}`, appointmentData);
  }

  async deleteAppointment(id) {
    return this.delete(`appointments.php?id=${id}`);
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