import { executeQuery } from '../config.js';

export class ProfessionalModel {
  static async getAll() {
    const query = `
      SELECT p.*, d.name as discipline_name 
      FROM professionals p 
      LEFT JOIN disciplines d ON p.discipline_id = d.id 
      ORDER BY p.name
    `;
    const results = await executeQuery(query);
    return results.map(this.formatProfessional);
  }

  static async getById(id) {
    const query = `
      SELECT p.*, d.name as discipline_name 
      FROM professionals p 
      LEFT JOIN disciplines d ON p.discipline_id = d.id 
      WHERE p.id = ?
    `;
    const results = await executeQuery(query, [id]);
    return results[0] ? this.formatProfessional(results[0]) : null;
  }

  static async create(professionalData) {
    const {
      name, email, phone, disciplineId, license, experience, schedule
    } = professionalData;

    const query = `
      INSERT INTO professionals 
      (name, email, phone, discipline_id, license, experience, schedule) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await executeQuery(query, [
      name, email, phone, disciplineId, license, experience, JSON.stringify(schedule)
    ]);

    return this.getById(result.insertId);
  }

  static async update(id, professionalData) {
    const {
      name, email, phone, disciplineId, license, experience, schedule
    } = professionalData;

    const query = `
      UPDATE professionals 
      SET name = ?, email = ?, phone = ?, discipline_id = ?, 
          license = ?, experience = ?, schedule = ?
      WHERE id = ?
    `;
    
    await executeQuery(query, [
      name, email, phone, disciplineId, license, experience, 
      JSON.stringify(schedule), id
    ]);

    return this.getById(id);
  }

  static async delete(id) {
    const query = 'DELETE FROM professionals WHERE id = ?';
    await executeQuery(query, [id]);
    return true;
  }

  static formatProfessional(professional) {
    return {
      ...professional,
      disciplineId: professional.discipline_id,
      schedule: typeof professional.schedule === 'string' 
        ? JSON.parse(professional.schedule) 
        : professional.schedule
    };
  }
}