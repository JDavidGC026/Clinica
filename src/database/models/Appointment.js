import { executeQuery } from '../config.js';

export class AppointmentModel {
  static async getAll() {
    const query = `
      SELECT a.*, p.name as patient_full_name, pr.name as professional_full_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN professionals pr ON a.professional_id = pr.id
      ORDER BY a.date DESC, a.time ASC
    `;
    return await executeQuery(query);
  }

  static async getById(id) {
    const query = `
      SELECT a.*, p.name as patient_full_name, pr.name as professional_full_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN professionals pr ON a.professional_id = pr.id
      WHERE a.id = ?
    `;
    const results = await executeQuery(query, [id]);
    return results[0] || null;
  }

  static async create(appointmentData) {
    const {
      patientName, patientEmail, patientPhone, professionalId, professionalName,
      date, time, type, notes, status, paymentStatus, cost, folio
    } = appointmentData;

    // Buscar paciente por email
    let patientId = null;
    const patientQuery = 'SELECT id FROM patients WHERE email = ?';
    const patientResults = await executeQuery(patientQuery, [patientEmail]);
    if (patientResults.length > 0) {
      patientId = patientResults[0].id;
    }

    const query = `
      INSERT INTO appointments 
      (patient_id, patient_name, patient_email, patient_phone, professional_id, 
       professional_name, date, time, type, notes, status, payment_status, cost, folio) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await executeQuery(query, [
      patientId, patientName, patientEmail, patientPhone, professionalId,
      professionalName, date, time, type, notes, status, paymentStatus, cost, folio
    ]);

    return this.getById(result.insertId);
  }

  static async update(id, appointmentData) {
    const {
      patientName, patientEmail, patientPhone, professionalId, professionalName,
      date, time, type, notes, status, paymentStatus, cost
    } = appointmentData;

    // Buscar paciente por email
    let patientId = null;
    const patientQuery = 'SELECT id FROM patients WHERE email = ?';
    const patientResults = await executeQuery(patientQuery, [patientEmail]);
    if (patientResults.length > 0) {
      patientId = patientResults[0].id;
    }

    const query = `
      UPDATE appointments 
      SET patient_id = ?, patient_name = ?, patient_email = ?, patient_phone = ?, 
          professional_id = ?, professional_name = ?, date = ?, time = ?, 
          type = ?, notes = ?, status = ?, payment_status = ?, cost = ?
      WHERE id = ?
    `;
    
    await executeQuery(query, [
      patientId, patientName, patientEmail, patientPhone, professionalId,
      professionalName, date, time, type, notes, status, paymentStatus, cost, id
    ]);

    return this.getById(id);
  }

  static async delete(id) {
    const query = 'DELETE FROM appointments WHERE id = ?';
    await executeQuery(query, [id]);
    return true;
  }

  static async getByDateRange(startDate, endDate) {
    const query = `
      SELECT a.*, p.name as patient_full_name, pr.name as professional_full_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN professionals pr ON a.professional_id = pr.id
      WHERE a.date BETWEEN ? AND ?
      ORDER BY a.date, a.time
    `;
    return await executeQuery(query, [startDate, endDate]);
  }

  static async getByProfessional(professionalId) {
    const query = `
      SELECT a.*, p.name as patient_full_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      WHERE a.professional_id = ?
      ORDER BY a.date DESC, a.time
    `;
    return await executeQuery(query, [professionalId]);
  }

  static async getByPatient(patientId) {
    const query = `
      SELECT a.*, pr.name as professional_full_name
      FROM appointments a
      LEFT JOIN professionals pr ON a.professional_id = pr.id
      WHERE a.patient_id = ?
      ORDER BY a.date DESC, a.time
    `;
    return await executeQuery(query, [patientId]);
  }
}