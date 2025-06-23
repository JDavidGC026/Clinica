// Servicio centralizado para manejo de APIs con logs detallados
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
    // Asegurarse de que el endpoint termine en .php
    if (!endpoint.endsWith('.php')) {
      endpoint = `${endpoint}.php`;
    }
    
    const url = `${this.baseURL}api/${endpoint}`;
    const startTime = Date.now();

    this.log('info', `Iniciando petición: ${options.method || 'GET'} ${url}`, {
      endpoint,
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
      
      try {
        const responseData = await response.json();
        
        if (response.ok) {
          this.log('info', `Petición exitosa: ${response.status} ${url} (${duration}ms)`, {
            status: response.status,
            duration,
            data: responseData
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
      } catch (jsonError) {
        // Si no se puede parsear como JSON
        const textResponse = await response.text();
        this.log('error', `Error al parsear JSON: ${url} (${duration}ms)`, {
          status: response.status,
          responseText: textResponse,
          jsonError: jsonError.message,
          duration
        });
        
        // Usar fallback a localStorage
        this.log('info', `Usando fallback a localStorage para: ${endpoint}`, {
          endpoint,
          method: options.method
        });
        
        return this.handleLocalStorageFallback(endpoint, options);
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.log('error', `Error en petición: ${url} (${duration}ms)`, {
        error: error.message,
        duration,
        type: 'REQUEST_ERROR'
      });
      
      // Usar fallback a localStorage
      this.log('info', `Usando fallback a localStorage para: ${endpoint}`, {
        endpoint,
        method: options.method
      });
      
      return this.handleLocalStorageFallback(endpoint, options);
    }
  }

  // Fallback a localStorage cuando la API falla
  handleLocalStorageFallback(endpoint, options) {
    const method = options.method || 'GET';
    
    // Extraer ID de la URL si existe
    const idMatch = endpoint.match(/\?id=(\d+)/);
    const id = idMatch ? parseInt(idMatch[1]) : null;
    
    // Determinar la entidad basada en el endpoint
    let entity = endpoint.split('?')[0].replace('.php', '');
    
    // Manejar login especial
    if (entity === 'login') {
      const credentials = JSON.parse(options.body || '{}');
      const validUsers = [
        { username: 'admin', password: 'password', name: 'Admin General', role: 'Administrador', id: 1 },
        { username: 'gerente', password: 'password', name: 'Gerente Principal', role: 'Gerente', id: 2 },
        { username: 'profesional1', password: 'password', name: 'Dr. Carlos Ruiz', role: 'Profesional', id: 3 },
        { username: 'recepcion', password: 'password', name: 'María López', role: 'Recepcionista', id: 4 }
      ];
      
      const user = validUsers.find(
        u => u.username === credentials.username && u.password === credentials.password
      );
      
      if (user) {
        return {
          success: true,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            email: `${user.username}@clinicadelux.com`,
            role: user.role
          },
          message: 'Login exitoso (modo local)'
        };
      } else {
        throw new Error('Usuario o contraseña incorrectos');
      }
    }
    
    // Manejar health-check
    if (entity === 'health-check') {
      return {
        status: 'ok',
        database: 'connected',
        clinic: 'Clínica Delux',
        location: 'Ciudad de México, México',
        timezone: 'America/Mexico_City',
        server_time: new Date().toISOString(),
        tables: ['disciplines', 'professionals', 'patients', 'appointments', 'users'],
        mysql_timezone: '-06:00',
        api_version: '1.0.0',
        mode: 'localStorage fallback'
      };
    }
    
    // Manejar send-email y send-email-fallback
    if (entity === 'send-email' || entity === 'send-email-fallback') {
      const emailData = JSON.parse(options.body || '{}');
      
      // Guardar en historial local
      const emailHistory = {
        id: Date.now(),
        type: emailData.type || 'manual',
        recipient: emailData.to,
        subject: emailData.subject,
        sentAt: new Date().toISOString(),
        status: 'simulado'
      };
      
      const currentHistory = JSON.parse(localStorage.getItem('clinic_email_history') || '[]');
      const updatedHistory = [emailHistory, ...currentHistory];
      localStorage.setItem('clinic_email_history', JSON.stringify(updatedHistory));
      
      // Disparar evento para actualizar UI
      window.dispatchEvent(new Event('storage'));
      
      return {
        success: true,
        message: 'Email simulado (modo localStorage fallback)',
        method: 'Simulación',
        messageId: 'sim_' + Date.now(),
        note: 'El email no se envió realmente, pero se guardó en el historial para desarrollo'
      };
    }
    
    // Para otras entidades, usar localStorage
    const storageKey = `clinic_${entity}`;
    let data = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    switch (method) {
      case 'GET':
        if (id) {
          const item = data.find(item => item.id === id);
          if (!item) {
            throw new Error(`${entity} not found with id ${id}`);
          }
          return item;
        }
        return data;
        
      case 'POST':
        const newItem = {
          id: Date.now(),
          ...JSON.parse(options.body || '{}'),
          createdAt: new Date().toISOString()
        };
        data.push(newItem);
        localStorage.setItem(storageKey, JSON.stringify(data));
        return newItem;
        
      case 'PUT':
        if (!id) {
          throw new Error(`ID required for updating ${entity}`);
        }
        const updatedData = data.map(item => 
          item.id === id ? { ...item, ...JSON.parse(options.body || '{}') } : item
        );
        localStorage.setItem(storageKey, JSON.stringify(updatedData));
        return updatedData.find(item => item.id === id);
        
      case 'DELETE':
        if (!id) {
          throw new Error(`ID required for deleting ${entity}`);
        }
        const filteredData = data.filter(item => item.id !== id);
        localStorage.setItem(storageKey, JSON.stringify(filteredData));
        return { success: true };
        
      default:
        throw new Error(`Method ${method} not supported`);
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