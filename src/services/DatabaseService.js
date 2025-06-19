// Servicio de base de datos híbrido para producción
class DatabaseService {
  constructor() {
    this.isClient = typeof window !== 'undefined';
    this.mysqlAvailable = false;
    this.checkMySQLAvailability();
  }

  async checkMySQLAvailability() {
    if (!this.isClient) return false;
    
    try {
      // En el navegador, verificamos si hay un endpoint de API disponible
      const response = await fetch('/api/health-check', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      this.mysqlAvailable = response.ok;
    } catch (error) {
      console.warn('MySQL no disponible, usando localStorage:', error.message);
      this.mysqlAvailable = false;
    }
    return this.mysqlAvailable;
  }

  async apiRequest(endpoint, method = 'GET', data = null) {
    if (!this.isClient) return null;
    
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      
      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(`/api${endpoint}`, options);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.warn(`API request failed for ${endpoint}:`, error);
      return null;
    }
  }

  // Disciplinas
  async getDisciplines() {
    const apiData = await this.apiRequest('/disciplines');
    if (apiData) return apiData;
    
    return JSON.parse(localStorage.getItem('clinic_disciplines') || '[]');
  }

  async createDiscipline(discipline) {
    const apiData = await this.apiRequest('/disciplines', 'POST', discipline);
    if (apiData) return apiData;
    
    const disciplines = JSON.parse(localStorage.getItem('clinic_disciplines') || '[]');
    disciplines.push(discipline);
    localStorage.setItem('clinic_disciplines', JSON.stringify(disciplines));
    return discipline;
  }

  async updateDiscipline(id, discipline) {
    const apiData = await this.apiRequest(`/disciplines/${id}`, 'PUT', discipline);
    if (apiData) return apiData;
    
    const disciplines = JSON.parse(localStorage.getItem('clinic_disciplines') || '[]');
    const index = disciplines.findIndex(d => d.id === id);
    if (index !== -1) {
      disciplines[index] = { ...disciplines[index], ...discipline };
      localStorage.setItem('clinic_disciplines', JSON.stringify(disciplines));
    }
    return discipline;
  }

  async deleteDiscipline(id) {
    const apiData = await this.apiRequest(`/disciplines/${id}`, 'DELETE');
    if (apiData !== null) return true;
    
    const disciplines = JSON.parse(localStorage.getItem('clinic_disciplines') || '[]');
    const filtered = disciplines.filter(d => d.id !== id);
    localStorage.setItem('clinic_disciplines', JSON.stringify(filtered));
    return true;
  }

  // Profesionales
  async getProfessionals() {
    const apiData = await this.apiRequest('/professionals');
    if (apiData) return apiData;
    
    return JSON.parse(localStorage.getItem('clinic_professionals') || '[]');
  }

  async createProfessional(professional) {
    const apiData = await this.apiRequest('/professionals', 'POST', professional);
    if (apiData) return apiData;
    
    const professionals = JSON.parse(localStorage.getItem('clinic_professionals') || '[]');
    const newProfessional = { ...professional, id: Date.now() };
    professionals.push(newProfessional);
    localStorage.setItem('clinic_professionals', JSON.stringify(professionals));
    return newProfessional;
  }

  async updateProfessional(id, professional) {
    const apiData = await this.apiRequest(`/professionals/${id}`, 'PUT', professional);
    if (apiData) return apiData;
    
    const professionals = JSON.parse(localStorage.getItem('clinic_professionals') || '[]');
    const index = professionals.findIndex(p => p.id.toString() === id.toString());
    if (index !== -1) {
      professionals[index] = { ...professionals[index], ...professional };
      localStorage.setItem('clinic_professionals', JSON.stringify(professionals));
    }
    return professional;
  }

  async deleteProfessional(id) {
    const apiData = await this.apiRequest(`/professionals/${id}`, 'DELETE');
    if (apiData !== null) return true;
    
    const professionals = JSON.parse(localStorage.getItem('clinic_professionals') || '[]');
    const filtered = professionals.filter(p => p.id.toString() !== id.toString());
    localStorage.setItem('clinic_professionals', JSON.stringify(filtered));
    return true;
  }

  // Pacientes
  async getPatients() {
    const apiData = await this.apiRequest('/patients');
    if (apiData) return apiData;
    
    return JSON.parse(localStorage.getItem('clinic_patients') || '[]');
  }

  async createPatient(patient) {
    const apiData = await this.apiRequest('/patients', 'POST', patient);
    if (apiData) return apiData;
    
    const patients = JSON.parse(localStorage.getItem('clinic_patients') || '[]');
    const newPatient = { ...patient, id: Date.now() };
    patients.push(newPatient);
    localStorage.setItem('clinic_patients', JSON.stringify(patients));
    return newPatient;
  }

  async updatePatient(id, patient) {
    const apiData = await this.apiRequest(`/patients/${id}`, 'PUT', patient);
    if (apiData) return apiData;
    
    const patients = JSON.parse(localStorage.getItem('clinic_patients') || '[]');
    const index = patients.findIndex(p => p.id.toString() === id.toString());
    if (index !== -1) {
      patients[index] = { ...patients[index], ...patient };
      localStorage.setItem('clinic_patients', JSON.stringify(patients));
    }
    return patient;
  }

  async deletePatient(id) {
    const apiData = await this.apiRequest(`/patients/${id}`, 'DELETE');
    if (apiData !== null) return true;
    
    const patients = JSON.parse(localStorage.getItem('clinic_patients') || '[]');
    const filtered = patients.filter(p => p.id.toString() !== id.toString());
    localStorage.setItem('clinic_patients', JSON.stringify(filtered));
    return true;
  }

  // Citas
  async getAppointments() {
    const apiData = await this.apiRequest('/appointments');
    if (apiData) return apiData;
    
    return JSON.parse(localStorage.getItem('clinic_appointments') || '[]');
  }

  async createAppointment(appointment) {
    const apiData = await this.apiRequest('/appointments', 'POST', appointment);
    if (apiData) return apiData;
    
    const appointments = JSON.parse(localStorage.getItem('clinic_appointments') || '[]');
    const newAppointment = { ...appointment, id: Date.now() };
    appointments.push(newAppointment);
    localStorage.setItem('clinic_appointments', JSON.stringify(appointments));
    return newAppointment;
  }

  async updateAppointment(id, appointment) {
    const apiData = await this.apiRequest(`/appointments/${id}`, 'PUT', appointment);
    if (apiData) return apiData;
    
    const appointments = JSON.parse(localStorage.getItem('clinic_appointments') || '[]');
    const index = appointments.findIndex(a => a.id.toString() === id.toString());
    if (index !== -1) {
      appointments[index] = { ...appointments[index], ...appointment };
      localStorage.setItem('clinic_appointments', JSON.stringify(appointments));
    }
    return appointment;
  }

  async deleteAppointment(id) {
    const apiData = await this.apiRequest(`/appointments/${id}`, 'DELETE');
    if (apiData !== null) return true;
    
    const appointments = JSON.parse(localStorage.getItem('clinic_appointments') || '[]');
    const filtered = appointments.filter(a => a.id.toString() !== id.toString());
    localStorage.setItem('clinic_appointments', JSON.stringify(filtered));
    return true;
  }

  // Gastos
  async getExpenses() {
    const apiData = await this.apiRequest('/expenses');
    if (apiData) return apiData;
    
    return JSON.parse(localStorage.getItem('clinic_expenses') || '[]');
  }

  async createExpense(expense) {
    const apiData = await this.apiRequest('/expenses', 'POST', expense);
    if (apiData) return apiData;
    
    const expenses = JSON.parse(localStorage.getItem('clinic_expenses') || '[]');
    expenses.push(expense);
    localStorage.setItem('clinic_expenses', JSON.stringify(expenses));
    return expense;
  }

  async updateExpense(id, expense) {
    const apiData = await this.apiRequest(`/expenses/${id}`, 'PUT', expense);
    if (apiData) return apiData;
    
    const expenses = JSON.parse(localStorage.getItem('clinic_expenses') || '[]');
    const index = expenses.findIndex(e => e.id === id);
    if (index !== -1) {
      expenses[index] = { ...expenses[index], ...expense };
      localStorage.setItem('clinic_expenses', JSON.stringify(expenses));
    }
    return expense;
  }

  async deleteExpense(id) {
    const apiData = await this.apiRequest(`/expenses/${id}`, 'DELETE');
    if (apiData !== null) return true;
    
    const expenses = JSON.parse(localStorage.getItem('clinic_expenses') || '[]');
    const filtered = expenses.filter(e => e.id !== id);
    localStorage.setItem('clinic_expenses', JSON.stringify(filtered));
    return true;
  }

  // Historial de emails
  async getEmailHistory() {
    const apiData = await this.apiRequest('/email-history');
    if (apiData) return apiData;
    
    return JSON.parse(localStorage.getItem('clinic_email_history') || '[]');
  }

  async createEmailHistory(email) {
    const apiData = await this.apiRequest('/email-history', 'POST', email);
    if (apiData) return apiData;
    
    const history = JSON.parse(localStorage.getItem('clinic_email_history') || '[]');
    const newEmail = { ...email, id: Date.now() };
    history.unshift(newEmail);
    localStorage.setItem('clinic_email_history', JSON.stringify(history));
    return newEmail;
  }

  // Notas clínicas
  async getClinicalNote(professionalId, patientId) {
    const apiData = await this.apiRequest(`/clinical-notes/${professionalId}/${patientId}`);
    if (apiData) return apiData.notes || '';
    
    return localStorage.getItem(`clinical_notes_${professionalId}_${patientId}`) || '';
  }

  async saveClinicalNote(professionalId, patientId, notes) {
    const apiData = await this.apiRequest('/clinical-notes', 'POST', {
      professionalId,
      patientId,
      notes
    });
    if (apiData) return apiData;
    
    localStorage.setItem(`clinical_notes_${professionalId}_${patientId}`, notes);
    return notes;
  }

  // Configuración
  async getSetting(key) {
    const apiData = await this.apiRequest(`/settings/${key}`);
    if (apiData) return apiData.value;
    
    return localStorage.getItem(key);
  }

  async setSetting(key, value) {
    const apiData = await this.apiRequest('/settings', 'POST', { key, value });
    if (apiData) return apiData;
    
    localStorage.setItem(key, value);
    return value;
  }
}

export default new DatabaseService();