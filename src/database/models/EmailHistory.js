import { executeQuery } from '../config.js';

export class EmailHistoryModel {
  static async getAll() {
    const query = 'SELECT * FROM email_history ORDER BY sent_at DESC';
    return await executeQuery(query);
  }

  static async create(emailData) {
    const { type, recipient, subject, status = 'enviado' } = emailData;
    
    const query = `
      INSERT INTO email_history (type, recipient, subject, status) 
      VALUES (?, ?, ?, ?)
    `;
    
    const result = await executeQuery(query, [type, recipient, subject, status]);
    return this.getById(result.insertId);
  }

  static async getById(id) {
    const query = 'SELECT * FROM email_history WHERE id = ?';
    const results = await executeQuery(query, [id]);
    return results[0] || null;
  }

  static async getStats() {
    const queries = [
      'SELECT COUNT(*) as total FROM email_history',
      'SELECT COUNT(*) as confirmations FROM email_history WHERE type = "appointment-confirmation"',
      'SELECT COUNT(*) as reminders FROM email_history WHERE type = "appointment-reminder"',
      'SELECT COUNT(*) as today FROM email_history WHERE DATE(sent_at) = CURDATE()'
    ];

    const results = await Promise.all(
      queries.map(query => executeQuery(query))
    );

    return {
      total: results[0][0].total,
      confirmations: results[1][0].confirmations,
      reminders: results[2][0].reminders,
      today: results[3][0].today
    };
  }
}