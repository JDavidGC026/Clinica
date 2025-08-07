-- Base de datos para Clínica Delux
-- Creación de todas las tablas necesarias

USE clinica_delux;

-- Tabla de disciplinas
CREATE TABLE IF NOT EXISTS disciplines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de profesionales
CREATE TABLE IF NOT EXISTS professionals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    discipline_id INT,
    active TINYINT(1) DEFAULT 1,
    schedule JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE SET NULL,
    INDEX idx_name (name),
    INDEX idx_specialization (specialization),
    INDEX idx_discipline (discipline_id),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de pacientes
CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    birth_date DATE,
    gender ENUM('masculino', 'femenino', 'otro'),
    address TEXT,
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    medical_history TEXT,
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de citas
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    professional_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration INT DEFAULT 60,
    status ENUM('programada', 'confirmada', 'en_progreso', 'completada', 'cancelada', 'no_asistio') DEFAULT 'programada',
    notes TEXT,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE,
    INDEX idx_patient (patient_id),
    INDEX idx_professional (professional_id),
    INDEX idx_date (appointment_date),
    INDEX idx_datetime (appointment_date, appointment_time),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de usuarios del sistema
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'receptionist', 'professional') DEFAULT 'receptionist',
    professional_id INT NULL,
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE SET NULL,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Agregar columna description si no existe
ALTER TABLE disciplines ADD COLUMN IF NOT EXISTS description TEXT AFTER name;

-- Insertar datos de ejemplo
-- Disciplinas
INSERT IGNORE INTO disciplines (name, description) VALUES
('Fisioterapia', 'Tratamiento de lesiones y rehabilitación física'),
('Psicología', 'Atención en salud mental y bienestar emocional'),
('Nutrición', 'Consultas nutricionales y planes alimentarios'),
('Medicina General', 'Consultas médicas generales');

-- Profesionales de ejemplo
INSERT IGNORE INTO professionals (name, specialization, email, phone, discipline_id) VALUES
('Dr. Juan Pérez', 'Fisioterapeuta', 'juan.perez@clinicadelux.com', '555-0101', 1),
('Dra. María González', 'Psicóloga Clínica', 'maria.gonzalez@clinicadelux.com', '555-0102', 2),
('Lic. Ana Rodríguez', 'Nutrióloga', 'ana.rodriguez@clinicadelux.com', '555-0103', 3);

-- Usuario administrador por defecto
INSERT IGNORE INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@clinicadelux.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Pacientes de ejemplo
INSERT IGNORE INTO patients (name, email, phone, birth_date, gender) VALUES
('Carlos Martínez', 'carlos.martinez@email.com', '555-1001', '1985-03-15', 'masculino'),
('Laura Sánchez', 'laura.sanchez@email.com', '555-1002', '1990-07-22', 'femenino'),
('Roberto López', 'roberto.lopez@email.com', '555-1003', '1978-11-08', 'masculino');
