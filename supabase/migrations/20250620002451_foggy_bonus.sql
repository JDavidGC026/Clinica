-- =====================================================
-- CREAR TABLA DE USUARIOS PARA EL SISTEMA DE LOGIN
-- Clínica Delux - Sistema de Gestión Médica
-- =====================================================

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role ENUM('Administrador', 'Gerente', 'Profesional', 'Recepcionista') NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar usuarios de prueba con contraseñas hasheadas
-- Contraseña para todos: "password"
INSERT IGNORE INTO users (username, password_hash, name, email, role) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador General', 'admin@clinicadelux.com', 'Administrador'),
('gerente', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Gerente Principal', 'gerente@clinicadelux.com', 'Gerente'),
('profesional1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dr. Carlos Ruiz', 'carlos.ruiz@clinicadelux.com', 'Profesional'),
('recepcion', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'María López', 'maria.lopez@clinicadelux.com', 'Recepcionista');

-- Verificar que los usuarios se crearon correctamente
SELECT 'Usuarios creados exitosamente' as 'Estado';
SELECT username, name, email, role, active FROM users;