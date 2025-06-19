// Servicio de base de datos híbrido - PRIORIZA MySQL sobre localStorage
class DatabaseService {
  constructor() {
    this.isClient = typeof window !== 'undefined';
    this.mysqlAvailable = false;
    this.initializeData();
    this.checkMySQLAvailability();
  }

  async checkMySQLAvailability() {
    if (!this.isClient) return false;
    
    try {
      const response = await fetch('/api/health-check', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      this.mysqlAvailable = response.ok;
      console.log(`MySQL ${this.mysqlAvailable ? 'disponible' : 'no disponible'} - usando ${this.mysqlAvailable ? 'MySQL' : 'localStorage'}`);
    } catch (error) {
      console.warn('MySQL no disponible, usando localStorage:', error.message);
      this.mysqlAvailable = false;
    }
    return this.mysqlAvailable;
  }

  // Inicializar datos de prueba si no existen
  initializeData() {
    if (!this.isClient) return;

    // Datos de prueba para disciplinas
    const disciplines = JSON.parse(localStorage.getItem('clinic_disciplines') || '[]');
    if (disciplines.length === 0) {
      const initialDisciplines = [
        { id: 'medicina-general', name: 'Medicina General' },
        { id: 'pediatria', name: 'Pediatría' },
        { id: 'ginecologia', name: 'Ginecología' },
        { id: 'cardiologia', name: 'Cardiología' },
        { id: 'dermatologia', name: 'Dermatología' },
        { id: 'psicologia-clinica', name: 'Psicología Clínica' },
        { id: 'nutricion', name: 'Nutrición' },
        { id: 'oftalmologia', name: 'Oftalmología' },
        { id: 'traumatologia', name: 'Traumatología' },
        { id: 'neurologia', name: 'Neurología' }
      ];
      localStorage.setItem('clinic_disciplines', JSON.stringify(initialDisciplines));
    }

    // Datos de prueba para profesionales
    const professionals = JSON.parse(localStorage.getItem('clinic_professionals') || '[]');
    if (professionals.length === 0) {
      const initialProfessionals = [
        {
          id: 1,
          name: 'Dra. Ana García Martínez',
          email: 'ana.garcia@clinicadelux.com',
          phone: '+52 55 1234 5678',
          disciplineId: 'psicologia-clinica',
          license: 'PSI-12345',
          experience: '8 años',
          schedule: {
            monday: { start: '09:00', end: '17:00', available: true },
            tuesday: { start: '09:00', end: '17:00', available: true },
            wednesday: { start: '09:00', end: '17:00', available: true },
            thursday: { start: '09:00', end: '17:00', available: true },
            friday: { start: '09:00', end: '15:00', available: true },
            saturday: { start: '', end: '', available: false },
            sunday: { start: '', end: '', available: false }
          },
          status: 'activo'
        },
        {
          id: 2,
          name: 'Dr. Carlos Ruiz López',
          email: 'carlos.ruiz@clinicadelux.com',
          phone: '+52 55 2345 6789',
          disciplineId: 'medicina-general',
          license: 'MED-67890',
          experience: '12 años',
          schedule: {
            monday: { start: '10:00', end: '18:00', available: true },
            tuesday: { start: '10:00', end: '18:00', available: true },
            wednesday: { start: '10:00', end: '18:00', available: true },
            thursday: { start: '10:00', end: '18:00', available: true },
            friday: { start: '10:00', end: '16:00', available: true },
            saturday: { start: '09:00', end: '13:00', available: true },
            sunday: { start: '', end: '', available: false }
          },
          status: 'activo'
        },
        {
          id: 3,
          name: 'Dra. María Elena Fernández',
          email: 'maria.fernandez@clinicadelux.com',
          phone: '+52 55 3456 7890',
          disciplineId: 'pediatria',
          license: 'PED-11111',
          experience: '15 años',
          schedule: {
            monday: { start: '08:00', end: '16:00', available: true },
            tuesday: { start: '08:00', end: '16:00', available: true },
            wednesday: { start: '08:00', end: '16:00', available: true },
            thursday: { start: '08:00', end: '16:00', available: true },
            friday: { start: '08:00', end: '14:00', available: true },
            saturday: { start: '', end: '', available: false },
            sunday: { start: '', end: '', available: false }
          },
          status: 'activo'
        },
        {
          id: 4,
          name: 'Dr. Roberto Mendoza Silva',
          email: 'roberto.mendoza@clinicadelux.com',
          phone: '+52 55 4567 8901',
          disciplineId: 'cardiologia',
          license: 'CAR-22222',
          experience: '20 años',
          schedule: {
            monday: { start: '07:00', end: '15:00', available: true },
            tuesday: { start: '07:00', end: '15:00', available: true },
            wednesday: { start: '07:00', end: '15:00', available: true },
            thursday: { start: '07:00', end: '15:00', available: true },
            friday: { start: '07:00', end: '13:00', available: true },
            saturday: { start: '', end: '', available: false },
            sunday: { start: '', end: '', available: false }
          },
          status: 'activo'
        }
      ];
      localStorage.setItem('clinic_professionals', JSON.stringify(initialProfessionals));
    }

    // Datos de prueba para pacientes
    const patients = JSON.parse(localStorage.getItem('clinic_patients') || '[]');
    if (patients.length === 0) {
      const initialPatients = [
        {
          id: 1,
          name: 'Juan Pérez González',
          email: 'juan.perez@email.com',
          phone: '+52 55 1111 2222',
          age: 35,
          gender: 'masculino',
          address: 'Av. Reforma 123, Col. Centro, CDMX',
          emergencyContact: 'María Pérez (Esposa)',
          emergencyPhone: '+52 55 3333 4444',
          medicalHistory: 'Hipertensión controlada',
          allergies: 'Penicilina',
          medications: 'Losartán 50mg',
          notes: 'Paciente colaborativo, puntual en citas',
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Ana Martínez Silva',
          email: 'ana.martinez@email.com',
          phone: '+52 55 5555 6666',
          age: 28,
          gender: 'femenino',
          address: 'Calle Insurgentes 456, Col. Roma Norte, CDMX',
          emergencyContact: 'Carlos Martínez (Hermano)',
          emergencyPhone: '+52 55 7777 8888',
          medicalHistory: 'Sin antecedentes relevantes',
          allergies: 'Ninguna conocida',
          medications: 'Ninguna',
          notes: 'Primera consulta, derivada por medicina general',
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          name: 'Roberto García Mendoza',
          email: 'roberto.garcia@email.com',
          phone: '+52 55 9999 0000',
          age: 42,
          gender: 'masculino',
          address: 'Av. Universidad 789, Col. Del Valle, CDMX',
          emergencyContact: 'Laura García (Esposa)',
          emergencyPhone: '+52 55 1234 9876',
          medicalHistory: 'Diabetes tipo 2, diagnosticada hace 3 años',
          allergies: 'Sulfonamidas',
          medications: 'Metformina 850mg, Glibenclamida 5mg',
          notes: 'Requiere seguimiento nutricional',
          createdAt: new Date().toISOString()
        },
        {
          id: 4,
          name: 'Carmen López Herrera',
          email: 'carmen.lopez@email.com',
          phone: '+52 55 2468 1357',
          age: 45,
          gender: 'femenino',
          address: 'Calle Polanco 321, Col. Polanco, CDMX',
          emergencyContact: 'José López (Esposo)',
          emergencyPhone: '+52 55 9876 5432',
          medicalHistory: 'Migraña crónica',
          allergies: 'Aspirina',
          medications: 'Sumatriptán 50mg PRN',
          notes: 'Paciente con historial de migrañas severas',
          createdAt: new Date().toISOString()
        },
        {
          id: 5,
          name: 'Luis Fernando Castro',
          email: 'luis.castro@email.com',
          phone: '+52 55 1357 2468',
          age: 52,
          gender: 'masculino',
          address: 'Av. Satélite 654, Col. Satélite, Estado de México',
          emergencyContact: 'Patricia Castro (Esposa)',
          emergencyPhone: '+52 55 8642 9753',
          medicalHistory: 'Hipercolesterolemia, antecedente de infarto hace 2 años',
          allergies: 'Ninguna conocida',
          medications: 'Atorvastatina 40mg, Aspirina 100mg',
          notes: 'Paciente cardiópata, requiere seguimiento estricto',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('clinic_patients', JSON.stringify(initialPatients));
    }

    // Datos de prueba para citas
    const appointments = JSON.parse(localStorage.getItem('clinic_appointments') || '[]');
    if (appointments.length === 0) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date(today);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const initialAppointments = [
        {
          id: 1,
          patientId: 1,
          patientName: 'Juan Pérez González',
          patientEmail: 'juan.perez@email.com',
          patientPhone: '+52 55 1111 2222',
          professionalId: 1,
          professionalName: 'Dra. Ana García Martínez',
          date: tomorrow.toISOString().split('T')[0],
          time: '10:00',
          type: 'consulta-inicial',
          notes: 'Primera consulta psicológica',
          status: 'programada',
          paymentStatus: 'pendiente',
          cost: 800.00,
          folio: this.generateFolio(),
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          patientId: 2,
          patientName: 'Ana Martínez Silva',
          patientEmail: 'ana.martinez@email.com',
          patientPhone: '+52 55 5555 6666',
          professionalId: 2,
          professionalName: 'Dr. Carlos Ruiz López',
          date: dayAfterTomorrow.toISOString().split('T')[0],
          time: '14:30',
          type: 'consulta-inicial',
          notes: 'Consulta general de rutina',
          status: 'programada',
          paymentStatus: 'pendiente',
          cost: 600.00,
          folio: this.generateFolio(),
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          patientId: 3,
          patientName: 'Roberto García Mendoza',
          patientEmail: 'roberto.garcia@email.com',
          patientPhone: '+52 55 9999 0000',
          professionalId: 3,
          professionalName: 'Dra. María Elena Fernández',
          date: nextWeek.toISOString().split('T')[0],
          time: '09:00',
          type: 'seguimiento',
          notes: 'Control de diabetes',
          status: 'programada',
          paymentStatus: 'pendiente',
          cost: 700.00,
          folio: this.generateFolio(),
          createdAt: new Date().toISOString()
        },
        {
          id: 4,
          patientId: 4,
          patientName: 'Carmen López Herrera',
          patientEmail: 'carmen.lopez@email.com',
          patientPhone: '+52 55 2468 1357',
          professionalId: 4,
          professionalName: 'Dr. Roberto Mendoza Silva',
          date: tomorrow.toISOString().split('T')[0],
          time: '11:00',
          type: 'consulta-inicial',
          notes: 'Evaluación cardiológica',
          status: 'programada',
          paymentStatus: 'pagado',
          cost: 1200.00,
          folio: this.generateFolio(),
          createdAt: new Date().toISOString()
        },
        {
          id: 5,
          patientId: 5,
          patientName: 'Luis Fernando Castro',
          patientEmail: 'luis.castro@email.com',
          patientPhone: '+52 55 1357 2468',
          professionalId: 4,
          professionalName: 'Dr. Roberto Mendoza Silva',
          date: dayAfterTomorrow.toISOString().split('T')[0],
          time: '08:00',
          type: 'seguimiento',
          notes: 'Control post-infarto',
          status: 'programada',
          paymentStatus: 'pendiente',
          cost: 1000.00,
          folio: this.generateFolio(),
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('clinic_appointments', JSON.stringify(initialAppointments));
    }

    // Configurar nombre de clínica
    localStorage.setItem('clinic_name', 'Clínica Delux');
    localStorage.setItem('clinic_address', 'Av. Paseo de la Reforma 123, Col. Juárez, CDMX, México');
    localStorage.setItem('clinic_phone', '+52 55 1234 5678');
  }

  generateFolio() {
    const prefix = "CDX"; // Clínica Delux
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${year}${month}${day}-${randomSuffix}`;
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