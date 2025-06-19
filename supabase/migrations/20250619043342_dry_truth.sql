-- =====================================================
-- DATOS INICIALES PARA EL SISTEMA
-- Grupo Médico Delux - Hostinger
-- =====================================================

-- =====================================================
-- DISCIPLINAS MÉDICAS INICIALES
-- =====================================================
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

-- =====================================================
-- PROFESIONALES DE EJEMPLO
-- =====================================================
INSERT IGNORE INTO professionals (name, email, phone, discipline_id, license, experience, schedule, status) VALUES
(
    'Dr. Ana García Martínez',
    'ana.garcia@grupomedico.com',
    '+52 55 1234 5678',
    'psicologia-clinica',
    'PSI-12345',
    '8 años',
    JSON_OBJECT(
        'monday', JSON_OBJECT('start', '09:00', 'end', '17:00', 'available', true),
        'tuesday', JSON_OBJECT('start', '09:00', 'end', '17:00', 'available', true),
        'wednesday', JSON_OBJECT('start', '09:00', 'end', '17:00', 'available', true),
        'thursday', JSON_OBJECT('start', '09:00', 'end', '17:00', 'available', true),
        'friday', JSON_OBJECT('start', '09:00', 'end', '15:00', 'available', true),
        'saturday', JSON_OBJECT('start', '', 'end', '', 'available', false),
        'sunday', JSON_OBJECT('start', '', 'end', '', 'available', false)
    ),
    'activo'
),
(
    'Dr. Carlos Ruiz López',
    'carlos.ruiz@grupomedico.com',
    '+52 55 2345 6789',
    'medicina-general',
    'MED-67890',
    '12 años',
    JSON_OBJECT(
        'monday', JSON_OBJECT('start', '10:00', 'end', '18:00', 'available', true),
        'tuesday', JSON_OBJECT('start', '10:00', 'end', '18:00', 'available', true),
        'wednesday', JSON_OBJECT('start', '10:00', 'end', '18:00', 'available', true),
        'thursday', JSON_OBJECT('start', '10:00', 'end', '18:00', 'available', true),
        'friday', JSON_OBJECT('start', '10:00', 'end', '16:00', 'available', true),
        'saturday', JSON_OBJECT('start', '09:00', 'end', '13:00', 'available', true),
        'sunday', JSON_OBJECT('start', '', 'end', '', 'available', false)
    ),
    'activo'
),
(
    'Dra. María Elena Fernández',
    'maria.fernandez@grupomedico.com',
    '+52 55 3456 7890',
    'pediatria',
    'PED-11111',
    '15 años',
    JSON_OBJECT(
        'monday', JSON_OBJECT('start', '08:00', 'end', '16:00', 'available', true),
        'tuesday', JSON_OBJECT('start', '08:00', 'end', '16:00', 'available', true),
        'wednesday', JSON_OBJECT('start', '08:00', 'end', '16:00', 'available', true),
        'thursday', JSON_OBJECT('start', '08:00', 'end', '16:00', 'available', true),
        'friday', JSON_OBJECT('start', '08:00', 'end', '14:00', 'available', true),
        'saturday', JSON_OBJECT('start', '', 'end', '', 'available', false),
        'sunday', JSON_OBJECT('start', '', 'end', '', 'available', false)
    ),
    'activo'
);

-- =====================================================
-- PACIENTES DE EJEMPLO
-- =====================================================
INSERT IGNORE INTO patients (name, email, phone, age, gender, address, emergency_contact, emergency_phone, medical_history, allergies, medications, notes) VALUES
(
    'Juan Pérez González',
    'juan.perez@email.com',
    '+52 55 1111 2222',
    35,
    'masculino',
    'Av. Reforma 123, Col. Centro, CDMX',
    'María Pérez (Esposa)',
    '+52 55 3333 4444',
    'Hipertensión controlada',
    'Penicilina',
    'Losartán 50mg',
    'Paciente colaborativo, puntual en citas'
),
(
    'Ana Martínez Silva',
    'ana.martinez@email.com',
    '+52 55 5555 6666',
    28,
    'femenino',
    'Calle Insurgentes 456, Col. Roma Norte, CDMX',
    'Carlos Martínez (Hermano)',
    '+52 55 7777 8888',
    'Sin antecedentes relevantes',
    'Ninguna conocida',
    'Ninguna',
    'Primera consulta, derivada por medicina general'
),
(
    'Roberto García Mendoza',
    'roberto.garcia@email.com',
    '+52 55 9999 0000',
    42,
    'masculino',
    'Av. Universidad 789, Col. Del Valle, CDMX',
    'Laura García (Esposa)',
    '+52 55 1234 9876',
    'Diabetes tipo 2, diagnosticada hace 3 años',
    'Sulfonamidas',
    'Metformina 850mg, Glibenclamida 5mg',
    'Requiere seguimiento nutricional'
);

-- =====================================================
-- CONFIGURACIÓN INICIAL DEL SISTEMA
-- =====================================================
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
-- CITAS DE EJEMPLO (OPCIONAL)
-- =====================================================
INSERT IGNORE INTO appointments (
    patient_id, patient_name, patient_email, patient_phone,
    professional_id, professional_name,
    date, time, type, notes, status, payment_status, cost, folio
) VALUES
(
    1, 'Juan Pérez González', 'juan.perez@email.com', '+52 55 1111 2222',
    1, 'Dr. Ana García Martínez',
    CURDATE() + INTERVAL 1 DAY, '10:00:00', 'consulta-inicial',
    'Primera consulta psicológica', 'programada', 'pendiente', 800.00,
    CONCAT('GMD-', DATE_FORMAT(NOW(), '%y%m%d'), '-', UPPER(SUBSTRING(MD5(RAND()), 1, 4)))
),
(
    2, 'Ana Martínez Silva', 'ana.martinez@email.com', '+52 55 5555 6666',
    2, 'Dr. Carlos Ruiz López',
    CURDATE() + INTERVAL 2 DAY, '14:30:00', 'consulta-inicial',
    'Consulta general de rutina', 'programada', 'pendiente', 600.00,
    CONCAT('GMD-', DATE_FORMAT(NOW(), '%y%m%d'), '-', UPPER(SUBSTRING(MD5(RAND()), 1, 4)))
),
(
    3, 'Roberto García Mendoza', 'roberto.garcia@email.com', '+52 55 9999 0000',
    3, 'Dra. María Elena Fernández',
    CURDATE() + INTERVAL 3 DAY, '09:00:00', 'seguimiento',
    'Control de diabetes', 'programada', 'pendiente', 700.00,
    CONCAT('GMD-', DATE_FORMAT(NOW(), '%y%m%d'), '-', UPPER(SUBSTRING(MD5(RAND()), 1, 4)))
);