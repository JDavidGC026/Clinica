-- =====================================================
-- SCRIPT COMPLETO DE INSTALACIÓN PARA HOSTINGER
-- Base de datos: user_nombre (reemplazar por tu BD real)
-- Sistema: Grupo Médico Delux
-- =====================================================

-- IMPORTANTE: Reemplaza 'user_nombre' por el nombre real de tu base de datos en Hostinger
-- Ejemplo: user_grupomedico, user_clinica, etc.

-- USE user_nombre;

-- =====================================================
-- PASO 1: CREAR TODAS LAS TABLAS
-- =====================================================

-- Tabla de disciplinas médicas
CREATE TABLE IF NOT EXISTS disciplines (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de profesionales
CREATE TABLE IF NOT EXISTS professionals (
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
    FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_discipline (discipline_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de pacientes
CREATE TABLE IF NOT EXISTS patients (
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_name (name),
    INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de citas médicas
CREATE TABLE IF NOT EXISTS appointments (
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
    INDEX idx_patient_date (patient_id, date),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_folio (folio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de gastos/egresos
CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(50) PRIMARY KEY,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    category VARCHAR(100),
    type ENUM('egreso') DEFAULT 'egreso',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (date),
    INDEX idx_category (category),
    INDEX idx_amount (amount)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de historial de emails
CREATE TABLE IF NOT EXISTS email_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('enviado', 'pendiente', 'error') DEFAULT 'enviado',
    INDEX idx_sent_at (sent_at),
    INDEX idx_recipient (recipient),
    INDEX idx_type (type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de notas clínicas
CREATE TABLE IF NOT EXISTS clinical_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    professional_id INT NOT NULL,
    patient_id INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    UNIQUE KEY unique_professional_patient (professional_id, patient_id),
    INDEX idx_professional (professional_id),
    INDEX idx_patient (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PASO 2: INSERTAR DATOS INICIALES
-- =====================================================

-- Disciplinas médicas
INSERT IGNORE INTO disciplines (id, name) VALUES
('medicina-general', 'Medicina General'),
('pediatria', 'Pediatría'),
('ginecologia', 'Ginecología'),
('traumatologia-ortopedia', 'Traumatología y Ortopedia'),
('urologia', 'Urología'),
('medicina-interna', 'Medicina Interna'),
('gastroenterologia', 'Gastroenterología'),
('nutricion', 'Nutrición'),
('dermatologia', 'Dermatología'),
('psicologia-clinica', 'Psicología Clínica'),
('cardiologia', 'Cardiología'),
('neurologia', 'Neurología'),
('oftalmologia', 'Oftalmología'),
('otorrinolaringologia', 'Otorrinolaringología'),
('psiquiatria', 'Psiquiatría');

-- Configuración inicial
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
('clinic_name', 'Grupo Médico Delux'),
('clinic_address', 'Av. Principal 123, Col. Médica, Ciudad de México, CP 12345'),
('clinic_phone', '+52 55 1234 5678'),
('clinic_email', 'contacto@grupomedico.com'),
('clinic_website', 'https://www.grupomedico.com'),
('appointment_duration', '60'),
('currency', 'MXN'),
('timezone', 'America/Mexico_City'),
('business_hours_start', '08:00'),
('business_hours_end', '20:00'),
('appointment_reminder_hours', '24'),
('max_appointments_per_day', '20'),
('system_version', '1.0.0'),
('last_backup', ''),
('maintenance_mode', 'false');

-- =====================================================
-- PASO 3: CREAR ÍNDICES ADICIONALES
-- =====================================================

-- Índices compuestos para optimización
CREATE INDEX IF NOT EXISTS idx_appointments_prof_date_status ON appointments (professional_id, date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date_status ON appointments (patient_id, date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_date ON appointments (payment_status, date, cost);
CREATE INDEX IF NOT EXISTS idx_patients_name_email ON patients (name, email);
CREATE INDEX IF NOT EXISTS idx_professionals_status_discipline ON professionals (status, discipline_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date_category ON expenses (date, category, amount);
CREATE INDEX IF NOT EXISTS idx_email_history_date_type ON email_history (sent_at, type, status);

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que todas las tablas se crearon correctamente
SELECT 
    TABLE_NAME as 'Tabla Creada',
    TABLE_ROWS as 'Filas',
    CREATE_TIME as 'Fecha Creación'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME;

-- Mostrar mensaje de éxito
SELECT 'Base de datos configurada exitosamente para Grupo Médico Delux' as 'Estado';