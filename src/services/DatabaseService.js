import { DisciplineModel } from '../database/models/Discipline.js';
import { ProfessionalModel } from '../database/models/Professional.js';
import { PatientModel } from '../database/models/Patient.js';
import { AppointmentModel } from '../database/models/Appointment.js';
import { ExpenseModel } from '../database/models/Expense.js';
import { EmailHistoryModel } from '../database/models/EmailHistory.js';
import { ClinicalNoteModel } from '../database/models/ClinicalNote.js';
import { SettingModel } from '../database/models/Setting.js';

class DatabaseService {
  // Método para verificar si la base de datos está disponible
  async isAvailable() {
    try {
      await DisciplineModel.getAll();
      return true;
    } catch (error) {
      console.warn('Base de datos no disponible, usando localStorage:', error.message);
      return false;
    }
  }

  // Disciplinas
  async getDisciplines() {
    if (await this.isAvailable()) {
      return await DisciplineModel.getAll();
    }
    return JSON.parse(localStorage.getItem('clinic_disciplines') || '[]');
  }

  async saveDisciplines(disciplines) {
    if (await this.isAvailable()) {
      // Para MySQL, manejar individualmente
      return disciplines;
    }
    localStorage.setItem('clinic_disciplines', JSON.stringify(disciplines));
    return disciplines;
  }

  async createDiscipline(discipline) {
    if (await this.isAvailable()) {
      return await DisciplineModel.create(discipline);
    }
    const disciplines = JSON.parse(localStorage.getItem('clinic_disciplines') || '[]');
    disciplines.push(discipline);
    localStorage.setItem('clinic_disciplines', JSON.stringify(disciplines));
    return discipline;
  }

  async updateDiscipline(id, discipline) {
    if (await this.isAvailable()) {
      return await DisciplineModel.update(id, discipline);
    }
    const disciplines = JSON.parse(localStorage.getItem('clinic_disciplines') || '[]');
    const index = disciplines.findIndex(d => d.id === id);
    if (index !== -1) {
      disciplines[index] = { ...disciplines[index], ...discipline };
      localStorage.setItem('clinic_disciplines', JSON.stringify(disciplines));
    }
    return discipline;
  }

  async deleteDiscipline(id) {
    if (await this.isAvailable()) {
      return await DisciplineModel.delete(id);
    }
    const disciplines = JSON.parse(localStorage.getItem('clinic_disciplines') || '[]');
    const filtered = disciplines.filter(d => d.id !== id);
    localStorage.setItem('clinic_disciplines', JSON.stringify(filtered));
    return true;
  }

  // Profesionales
  async getProfessionals() {
    if (await this.isAvailable()) {
      return await ProfessionalModel.getAll();
    }
    return JSON.parse(localStorage.getItem('clinic_professionals') || '[]');
  }

  async createProfessional(professional) {
    if (await this.isAvailable()) {
      return await ProfessionalModel.create(professional);
    }
    const professionals = JSON.parse(localStorage.getItem('clinic_professionals') || '[]');
    const newProfessional = { ...professional, id: Date.now() };
    professionals.push(newProfessional);
    localStorage.setItem('clinic_professionals', JSON.stringify(professionals));
    return newProfessional;
  }

  async updateProfessional(id, professional) {
    if (await this.isAvailable()) {
      return await ProfessionalModel.update(id, professional);
    }
    const professionals = JSON.parse(localStorage.getItem('clinic_professionals') || '[]');
    const index = professionals.findIndex(p => p.id.toString() === id.toString());
    if (index !== -1) {
      professionals[index] = { ...professionals[index], ...professional };
      localStorage.setItem('clinic_professionals', JSON.stringify(professionals));
    }
    return professional;
  }

  async deleteProfessional(id) {
    if (await this.isAvailable()) {
      return await ProfessionalModel.delete(id);
    }
    const professionals = JSON.parse(localStorage.getItem('clinic_professionals') || '[]');
    const filtered = professionals.filter(p => p.id.toString() !== id.toString());
    localStorage.setItem('clinic_professionals', JSON.stringify(filtered));
    return true;
  }

  // Pacientes
  async getPatients() {
    if (await this.isAvailable()) {
      return await PatientModel.getAll();
    }
    return JSON.parse(localStorage.getItem('clinic_patients') || '[]');
  }

  async createPatient(patient) {
    if (await this.isAvailable()) {
      return await PatientModel.create(patient);
    }
    const patients = JSON.parse(localStorage.getItem('clinic_patients') || '[]');
    const newPatient = { ...patient, id: Date.now() };
    patients.push(newPatient);
    localStorage.setItem('clinic_patients', JSON.stringify(patients));
    return newPatient;
  }

  async updatePatient(id, patient) {
    if (await this.isAvailable()) {
      return await PatientModel.update(id, patient);
    }
    const patients = JSON.parse(localStorage.getItem('clinic_patients') || '[]');
    const index = patients.findIndex(p => p.id.toString() === id.toString());
    if (index !== -1) {
      patients[index] = { ...patients[index], ...patient };
      localStorage.setItem('clinic_patients', JSON.stringify(patients));
    }
    return patient;
  }

  async deletePatient(id) {
    if (await this.isAvailable()) {
      return await PatientModel.delete(id);
    }
    const patients = JSON.parse(localStorage.getItem('clinic_patients') || '[]');
    const filtered = patients.filter(p => p.id.toString() !== id.toString());
    localStorage.setItem('clinic_patients', JSON.stringify(filtered));
    return true;
  }

  // Citas
  async getAppointments() {
    if (await this.isAvailable()) {
      return await AppointmentModel.getAll();
    }
    return JSON.parse(localStorage.getItem('clinic_appointments') || '[]');
  }

  async createAppointment(appointment) {
    if (await this.isAvailable()) {
      return await AppointmentModel.create(appointment);
    }
    const appointments = JSON.parse(localStorage.getItem('clinic_appointments') || '[]');
    const newAppointment = { ...appointment, id: Date.now() };
    appointments.push(newAppointment);
    localStorage.setItem('clinic_appointments', JSON.stringify(appointments));
    return newAppointment;
  }

  async updateAppointment(id, appointment) {
    if (await this.isAvailable()) {
      return await AppointmentModel.update(id, appointment);
    }
    const appointments = JSON.parse(localStorage.getItem('clinic_appointments') || '[]');
    const index = appointments.findIndex(a => a.id.toString() === id.toString());
    if (index !== -1) {
      appointments[index] = { ...appointments[index], ...appointment };
      localStorage.setItem('clinic_appointments', JSON.stringify(appointments));
    }
    return appointment;
  }

  async deleteAppointment(id) {
    if (await this.isAvailable()) {
      return await AppointmentModel.delete(id);
    }
    const appointments = JSON.parse(localStorage.getItem('clinic_appointments') || '[]');
    const filtered = appointments.filter(a => a.id.toString() !== id.toString());
    localStorage.setItem('clinic_appointments', JSON.stringify(filtered));
    return true;
  }

  // Gastos
  async getExpenses() {
    if (await this.isAvailable()) {
      return await ExpenseModel.getAll();
    }
    return JSON.parse(localStorage.getItem('clinic_expenses') || '[]');
  }

  async createExpense(expense) {
    if (await this.isAvailable()) {
      return await ExpenseModel.create(expense);
    }
    const expenses = JSON.parse(localStorage.getItem('clinic_expenses') || '[]');
    expenses.push(expense);
    localStorage.setItem('clinic_expenses', JSON.stringify(expenses));
    return expense;
  }

  async updateExpense(id, expense) {
    if (await this.isAvailable()) {
      return await ExpenseModel.update(id, expense);
    }
    const expenses = JSON.parse(localStorage.getItem('clinic_expenses') || '[]');
    const index = expenses.findIndex(e => e.id === id);
    if (index !== -1) {
      expenses[index] = { ...expenses[index], ...expense };
      localStorage.setItem('clinic_expenses', JSON.stringify(expenses));
    }
    return expense;
  }

  async deleteExpense(id) {
    if (await this.isAvailable()) {
      return await ExpenseModel.delete(id);
    }
    const expenses = JSON.parse(localStorage.getItem('clinic_expenses') || '[]');
    const filtered = expenses.filter(e => e.id !== id);
    localStorage.setItem('clinic_expenses', JSON.stringify(filtered));
    return true;
  }

  // Historial de emails
  async getEmailHistory() {
    if (await this.isAvailable()) {
      return await EmailHistoryModel.getAll();
    }
    return JSON.parse(localStorage.getItem('clinic_email_history') || '[]');
  }

  async createEmailHistory(email) {
    if (await this.isAvailable()) {
      return await EmailHistoryModel.create(email);
    }
    const history = JSON.parse(localStorage.getItem('clinic_email_history') || '[]');
    const newEmail = { ...email, id: Date.now() };
    history.unshift(newEmail);
    localStorage.setItem('clinic_email_history', JSON.stringify(history));
    return newEmail;
  }

  async getEmailStats() {
    if (await this.isAvailable()) {
      return await EmailHistoryModel.getStats();
    }
    const history = JSON.parse(localStorage.getItem('clinic_email_history') || '[]');
    const today = new Date().toDateString();
    return {
      total: history.length,
      confirmations: history.filter(e => e.type === 'appointment-confirmation').length,
      reminders: history.filter(e => e.type === 'appointment-reminder').length,
      today: history.filter(e => new Date(e.sentAt).toDateString() === today).length
    };
  }

  // Notas clínicas
  async getClinicalNote(professionalId, patientId) {
    if (await this.isAvailable()) {
      const note = await ClinicalNoteModel.getByProfessionalAndPatient(professionalId, patientId);
      return note?.notes || '';
    }
    return localStorage.getItem(`clinical_notes_${professionalId}_${patientId}`) || '';
  }

  async saveClinicalNote(professionalId, patientId, notes) {
    if (await this.isAvailable()) {
      return await ClinicalNoteModel.createOrUpdate(professionalId, patientId, notes);
    }
    localStorage.setItem(`clinical_notes_${professionalId}_${patientId}`, notes);
    return notes;
  }

  // Configuración
  async getSetting(key) {
    if (await this.isAvailable()) {
      return await SettingModel.get(key);
    }
    return localStorage.getItem(key);
  }

  async setSetting(key, value) {
    if (await this.isAvailable()) {
      return await SettingModel.set(key, value);
    }
    localStorage.setItem(key, value);
    return value;
  }

  async getAllSettings() {
    if (await this.isAvailable()) {
      return await SettingModel.getAll();
    }
    // Para localStorage, retornar configuraciones conocidas
    return {
      clinic_name: localStorage.getItem('clinic_name'),
      clinic_address: localStorage.getItem('clinic_address'),
      clinic_phone: localStorage.getItem('clinic_phone'),
      clinic_email_config: localStorage.getItem('clinic_email_config')
    };
  }
}

export default new DatabaseService();