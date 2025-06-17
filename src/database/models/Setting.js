import { executeQuery } from '../config.js';

export class SettingModel {
  static async get(key) {
    const query = 'SELECT setting_value FROM settings WHERE setting_key = ?';
    const results = await executeQuery(query, [key]);
    return results[0]?.setting_value || null;
  }

  static async set(key, value) {
    const query = `
      INSERT INTO settings (setting_key, setting_value) 
      VALUES (?, ?) 
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    `;
    await executeQuery(query, [key, value]);
    return value;
  }

  static async getAll() {
    const query = 'SELECT * FROM settings';
    const results = await executeQuery(query);
    
    const settings = {};
    results.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    
    return settings;
  }

  static async delete(key) {
    const query = 'DELETE FROM settings WHERE setting_key = ?';
    await executeQuery(query, [key]);
    return true;
  }
}