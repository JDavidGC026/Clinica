-- Migración para la nueva sección de Finanzas

USE clinica_delux;

-- 1. Actualizar la tabla de citas para incluir finanzas
ALTER TABLE appointments
ADD COLUMN cost DECIMAL(10, 2) DEFAULT 0.00 AFTER duration,
ADD COLUMN payment_status ENUM('pendiente', 'pagado', 'parcial') DEFAULT 'pendiente' AFTER cost;

-- Actualizar el estado de citas para ser más completo
ALTER TABLE appointments
MODIFY COLUMN status ENUM('programada', 'confirmada', 'en_progreso', 'completada', 'cancelada', 'no_asistio', 'reprogramada') DEFAULT 'programada';

-- 2. Crear tabla de gastos (egresos)
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    expense_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_expense_date (expense_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Insertar algunos gastos de ejemplo
INSERT IGNORE INTO expenses (description, amount, category, expense_date) VALUES
('Compra de guantes de latex', 500.00, 'Insumos Médicos', NOW()),
('Pago de servicio de internet', 600.00, 'Servicios', NOW()),
('Material de oficina', 250.50, 'Oficina', NOW());

-- Mensaje de éxito
SELECT 'Migración de base de datos para finanzas completada con éxito.' AS status;
