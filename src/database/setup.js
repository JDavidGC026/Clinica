import mysql from 'mysql2/promise';
import dbConfig from './config.js';

const createDatabase = async () => {
  let connection;
  try {
    // Conectar sin especificar la base de datos
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });

    console.log('Conectado a MySQL');

    // Crear la base de datos si no existe
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`Base de datos '${dbConfig.database}' creada o ya existe`);

    // Usar la base de datos
    await connection.execute(`USE \`${dbConfig.database}\``);

    // Crear tablas
    await createTables(connection);
    
    // Insertar datos iniciales
    await insertInitialData(connection);

    console.log('Setup de base de datos completado exitosamente');
  } catch (error) {
    console.error('Error en setup de base de datos:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

const createTables = async (connection) => {
  const tables = [
    // Tabla de disciplinas
    `CREATE TABLE IF NOT EXISTS disciplines (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    // Tabla de profesionales
    `CREATE TABLE IF NOT EXISTS professionals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(50),
      discipline_id VARCHAR(100),
      license VARCHAR(100),
      experience VARCHAR(100),
      schedule JSON,
      status ENUM('activo', 'inactivo') DEFAULT 'activo',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE SET NULL
    )`,

    // Tabla de pacientes
    `CREATE TABLE IF NOT EXISTS patients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(50),
      age INT,
      gender ENUM('masculino', 'femenino', 'otro', 'prefiero-no-decir'),
      address TEXT,
      emergency_contact VARCHAR(255),
      emergency_phone VARCHAR(50),
      medical_history TEXT,
      allergies TEXT,
      medications TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    // Tabla de citas
    `CREATE TABLE IF NOT EXISTS appointments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      patient_id INT,
      patient_name VARCHAR(255) NOT NULL,
      patient_email VARCHAR(255) NOT NULL,
      patient_phone VARCHAR(50),
      professional_id INT,
      professional_name VARCHAR(255),
      date DATE NOT NULL,
      time TIME NOT NULL,
      type VARCHAR(100) NOT NULL,
      notes TEXT,
      status ENUM('programada', 'en-progreso', 'completada', 'cancelada') DEFAULT 'programada',
      payment_status ENUM('pendiente', 'pagado', 'cancelado_sin_costo') DEFAULT 'pendiente',
      cost DECIMAL(10,2),
      folio VARCHAR(50) UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
      FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE SET NULL,
      INDEX idx_date_time (date, time),
      INDEX idx_professional_date (professional_id, date),
      INDEX idx_patient_date (patient_id, date)
    )`,

    // Tabla de gastos/egresos
    `CREATE TABLE IF NOT EXISTS expenses (
      id VARCHAR(50) PRIMARY KEY,
      description TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      date DATE NOT NULL,
      category VARCHAR(100),
      type ENUM('egreso') DEFAULT 'egreso',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_date (date),
      INDEX idx_category (category)
    )`,

    // Tabla de historial de emails
    `CREATE TABLE IF NOT EXISTS email_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type VARCHAR(100) NOT NULL,
      recipient VARCHAR(255) NOT NULL,
      subject VARCHAR(500),
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status ENUM('enviado', 'pendiente', 'error') DEFAULT 'enviado',
      INDEX idx_sent_at (sent_at),
      INDEX idx_recipient (recipient)
    )`,

    // Tabla de notas clínicas
    `CREATE TABLE IF NOT EXISTS clinical_notes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      professional_id INT NOT NULL,
      patient_id INT NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      UNIQUE KEY unique_professional_patient (professional_id, patient_id)
    )`,

    // Tabla de configuración
    `CREATE TABLE IF NOT EXISTS settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      setting_key VARCHAR(100) UNIQUE NOT NULL,
      setting_value TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  ];

  for (const table of tables) {
    await connection.execute(table);
    console.log('Tabla creada exitosamente');
  }
};

const insertInitialData = async (connection) => {
  // Insertar disciplinas iniciales
  const disciplines = [
    { id: 'medicina-general', name: 'Medicina General' },
    { id: 'pediatria', name: 'Pediatría' },
    { id: 'ginecologia', name: 'Ginecología' },
    { id: 'traumatologia-ortopedia', name: 'Traumatología y Ortopedia' },
    { id: 'urologia', name: 'Urología' },
    { id: 'medicina-interna', name: 'Medicina Interna' },
    { id: 'gastroenterologia', name: 'Gastroenterología' },
    { id: 'nutricion', name: 'Nutrición' },
    { id: 'dermatologia', name: 'Dermatología' },
    { id: 'psicologia-clinica', name: 'Psicología Clínica' }
  ];

  for (const discipline of disciplines) {
    await connection.execute(
      'INSERT IGNORE INTO disciplines (id, name) VALUES (?, ?)',
      [discipline.id, discipline.name]
    );
  }

  // Insertar profesionales de ejemplo
  const professionals = [
    {
      name: 'Dr. Ana García',
      email: 'ana.garcia@multiclinic.com',
      phone: '+34 600 123 456',
      discipline_id: 'psicologia-clinica',
      license: 'COL-12345',
      experience: '8 años',
      schedule: JSON.stringify({
        monday: { start: '09:00', end: '17:00', available: true },
        tuesday: { start: '09:00', end: '17:00', available: true },
        wednesday: { start: '09:00', end: '17:00', available: true },
        thursday: { start: '09:00', end: '17:00', available: true },
        friday: { start: '09:00', end: '15:00', available: true },
        saturday: { start: '', end: '', available: false },
        sunday: { start: '', end: '', available: false }
      })
    },
    {
      name: 'Dr. Carlos Ruiz',
      email: 'carlos.ruiz@multiclinic.com',
      phone: '+34 600 789 012',
      discipline_id: 'medicina-general',
      license: 'MED-67890',
      experience: '12 años',
      schedule: JSON.stringify({
        monday: { start: '10:00', end: '18:00', available: true },
        tuesday: { start: '10:00', end: '18:00', available: true },
        wednesday: { start: '10:00', end: '18:00', available: true },
        thursday: { start: '10:00', end: '18:00', available: true },
        friday: { start: '10:00', end: '16:00', available: true },
        saturday: { start: '09:00', end: '13:00', available: true },
        sunday: { start: '', end: '', available: false }
      })
    }
  ];

  for (const professional of professionals) {
    await connection.execute(
      'INSERT IGNORE INTO professionals (name, email, phone, discipline_id, license, experience, schedule) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [professional.name, professional.email, professional.phone, professional.discipline_id, professional.license, professional.experience, professional.schedule]
    );
  }

  // Insertar configuración inicial
  const settings = [
    { key: 'clinic_name', value: 'Grupo Médico Delux' },
    { key: 'clinic_address', value: 'Dirección de la clínica' },
    { key: 'clinic_phone', value: 'Teléfono de la clínica' }
  ];

  for (const setting of settings) {
    await connection.execute(
      'INSERT IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)',
      [setting.key, setting.value]
    );
  }

  console.log('Datos iniciales insertados');
};

// Ejecutar setup si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createDatabase().catch(console.error);
}

export default createDatabase;