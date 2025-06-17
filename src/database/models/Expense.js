import { executeQuery } from '../config.js';

export class ExpenseModel {
  static async getAll() {
    const query = 'SELECT * FROM expenses ORDER BY date DESC';
    return await executeQuery(query);
  }

  static async getById(id) {
    const query = 'SELECT * FROM expenses WHERE id = ?';
    const results = await executeQuery(query, [id]);
    return results[0] || null;
  }

  static async create(expenseData) {
    const { id, description, amount, date, category } = expenseData;
    
    const query = `
      INSERT INTO expenses (id, description, amount, date, category) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    await executeQuery(query, [id, description, amount, date, category]);
    return this.getById(id);
  }

  static async update(id, expenseData) {
    const { description, amount, date, category } = expenseData;
    
    const query = `
      UPDATE expenses 
      SET description = ?, amount = ?, date = ?, category = ?
      WHERE id = ?
    `;
    
    await executeQuery(query, [description, amount, date, category, id]);
    return this.getById(id);
  }

  static async delete(id) {
    const query = 'DELETE FROM expenses WHERE id = ?';
    await executeQuery(query, [id]);
    return true;
  }

  static async getByDateRange(startDate, endDate) {
    const query = `
      SELECT * FROM expenses 
      WHERE date BETWEEN ? AND ?
      ORDER BY date DESC
    `;
    return await executeQuery(query, [startDate, endDate]);
  }
}