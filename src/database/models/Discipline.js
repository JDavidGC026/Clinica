import { executeQuery } from '../config.js';

export class DisciplineModel {
  static async getAll() {
    const query = 'SELECT * FROM disciplines ORDER BY name';
    return await executeQuery(query);
  }

  static async getById(id) {
    const query = 'SELECT * FROM disciplines WHERE id = ?';
    const results = await executeQuery(query, [id]);
    return results[0] || null;
  }

  static async create(disciplineData) {
    const { id, name } = disciplineData;
    const query = 'INSERT INTO disciplines (id, name) VALUES (?, ?)';
    await executeQuery(query, [id, name]);
    return this.getById(id);
  }

  static async update(id, disciplineData) {
    const { name } = disciplineData;
    const query = 'UPDATE disciplines SET name = ? WHERE id = ?';
    await executeQuery(query, [name, id]);
    return this.getById(id);
  }

  static async delete(id) {
    // Verificar si la disciplina está en uso
    const checkQuery = 'SELECT COUNT(*) as count FROM professionals WHERE discipline_id = ?';
    const [result] = await executeQuery(checkQuery, [id]);
    
    if (result.count > 0) {
      throw new Error('No se puede eliminar la disciplina porque está asignada a uno o más profesionales.');
    }

    const query = 'DELETE FROM disciplines WHERE id = ?';
    await executeQuery(query, [id]);
    return true;
  }
}