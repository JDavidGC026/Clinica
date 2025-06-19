-- =====================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN (VERSIÓN CORREGIDA)
-- Sistema: Grupo Médico Delux - Hostinger
-- =====================================================

-- =====================================================
-- ÍNDICES COMPUESTOS PARA CONSULTAS FRECUENTES
-- =====================================================

-- Verificar y crear índices solo si no existen
-- Método compatible con todas las versiones de MySQL

-- Índices para búsquedas de citas por fecha y profesional
DROP INDEX IF EXISTS idx_appointments_prof_date_status ON appointments;
CREATE INDEX idx_appointments_prof_date_status ON appointments (professional_id, date, status);

-- Índices para búsquedas de citas por paciente y fecha
DROP INDEX IF EXISTS idx_appointments_patient_date_status ON appointments;
CREATE INDEX idx_appointments_patient_date_status ON appointments (patient_id, date, status);

-- Índices para reportes financieros
DROP INDEX IF EXISTS idx_appointments_payment_date ON appointments;
CREATE INDEX idx_appointments_payment_date ON appointments (payment_status, date, cost);

-- Índices para búsquedas de pacientes
DROP INDEX IF EXISTS idx_patients_name_email ON patients;
CREATE INDEX idx_patients_name_email ON patients (name, email);

-- Índices para profesionales activos
DROP INDEX IF EXISTS idx_professionals_status_discipline ON professionals;
CREATE INDEX idx_professionals_status_discipline ON professionals (status, discipline_id);

-- Índices para gastos por fecha y categoría
DROP INDEX IF EXISTS idx_expenses_date_category ON expenses;
CREATE INDEX idx_expenses_date_category ON expenses (date, category, amount);

-- Índices para historial de emails
DROP INDEX IF EXISTS idx_email_history_date_type ON email_history;
CREATE INDEX idx_email_history_date_type ON email_history (sent_at, type, status);

-- =====================================================
-- ÍNDICES PARA BÚSQUEDAS DE TEXTO
-- =====================================================

-- Índice para búsqueda de pacientes por nombre
DROP INDEX IF EXISTS idx_patients_name_search ON patients;
CREATE INDEX idx_patients_name_search ON patients (name(50));

-- Índice para búsqueda de profesionales por nombre
DROP INDEX IF EXISTS idx_professionals_name_search ON professionals;
CREATE INDEX idx_professionals_name_search ON professionals (name(50));

-- =====================================================
-- VERIFICACIÓN DE ÍNDICES CREADOS
-- =====================================================

-- Mostrar mensaje de confirmación
SELECT 'Índices adicionales creados exitosamente' as 'Estado';

-- Para verificar que los índices se crearon correctamente, ejecuta:
-- SHOW INDEX FROM appointments;
-- SHOW INDEX FROM patients;
-- SHOW INDEX FROM professionals;
-- SHOW INDEX FROM expenses;
-- SHOW INDEX FROM email_history;