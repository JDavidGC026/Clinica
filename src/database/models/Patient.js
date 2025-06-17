import { executeQuery } from '../config.js';

export class PatientModel {
  static async getAll() {
    const query = 'SELECT * FROM patients ORDER BY name';
    return await executeQuery(query);
  }

  static async getById(id) {
    const query = 'SELECT * FROM patients WHERE id = ?';
    const results = await executeQuery(query, [id]);
    return results[0] || null;
  }

  static async create(patientData) {
    const {
      name, email, phone, age, gender, address, emergencyContact,
      emergencyPhone, medicalHistory, allergies, medications, notes
    } = patientData;

    const query = `
      INSERT INTO patients 
      (name, email, phone, age, gender, address, emergency_contact, 
       emergency_phone, medical_history, allergies, medications, notes) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await executeQuery(query, [
      name, email, phone, age, gender, address, emergencyContact,
      emergencyPhone, medicalHistory, allergies, medications, notes
    ]);

    return this.getById(result.insertId);
  }

  static async update(id, patientData) {
    const {
      name, email, phone, age, gender, address, emergencyContact,
      emergencyPhone, medicalHistory, allergies, medications, notes
    } = patientData;

    const query = `
      UPDATE patients 
      SET name = ?, email = ?, phone = ?, age = ?, gender = ?, 
          address = ?, emergency_contact = ?, emergency_phone = ?, 
          medical_history = ?, allergies = ?, medications = ?, notes = ?
      WHERE id = ?
    `;
    
    await executeQuery(query, [
      name, email, phone, age, gender, address, emergencyContact,
      emergencyPhone, medicalHistory, allergies, medications, notes, id
    ]);

    return this.getById(id);
  }

  static async delete(id) {
    const query = 'DELETE FROM patients WHERE id = ?';
    await executeQuery(query, [id]);
    return true;
  }

  static async search(searchTerm) {
    const query = `
      SELECT * FROM patients 
      WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?
      ORDER BY name
    `;
    const searchPattern = `%${searchTerm}%`;
    return await executeQuery(query, [searchPattern, searchPattern, searchPattern]);
  }
}