import { executeQuery } from '../config.js';

export class ClinicalNoteModel {
  static async getByProfessionalAndPatient(professionalId, patientId) {
    const query = `
      SELECT * FROM clinical_notes 
      WHERE professional_id = ? AND patient_id = ?
    `;
    const results = await executeQuery(query, [professionalId, patientId]);
    return results[0] || null;
  }

  static async createOrUpdate(professionalId, patientId, notes) {
    const existing = await this.getByProfessionalAndPatient(professionalId, patientId);
    
    if (existing) {
      const query = `
        UPDATE clinical_notes 
        SET notes = ? 
        WHERE professional_id = ? AND patient_id = ?
      `;
      await executeQuery(query, [notes, professionalId, patientId]);
    } else {
      const query = `
        INSERT INTO clinical_notes (professional_id, patient_id, notes) 
        VALUES (?, ?, ?)
      `;
      await executeQuery(query, [professionalId, patientId, notes]);
    }

    return this.getByProfessionalAndPatient(professionalId, patientId);
  }

  static async getByProfessional(professionalId) {
    const query = `
      SELECT cn.*, p.name as patient_name 
      FROM clinical_notes cn
      JOIN patients p ON cn.patient_id = p.id
      WHERE cn.professional_id = ?
      ORDER BY cn.updated_at DESC
    `;
    return await executeQuery(query, [professionalId]);
  }
}