-- =====================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- Sistema: Grupo Médico Delux - Hostinger
-- =====================================================

-- =====================================================
-- ÍNDICES COMPUESTOS PARA CONSULTAS FRECUENTES
-- =====================================================

-- Índices para búsquedas de citas por fecha y profesional
CREATE INDEX IF NOT EXISTS idx_appointments_prof_date_status 
ON appointments (professional_id, date, status);

-- Índices para búsquedas de citas por paciente y fecha
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date_status 
ON appointments (patient_id, date, status);

-- Índices para reportes financieros
CREATE INDEX IF NOT EXISTS idx_appointments_payment_date 
ON appointments (payment_status, date, cost);

-- Índices para búsquedas de pacientes
CREATE INDEX IF NOT EXISTS idx_patients_name_email 
ON patients (name, email);

-- Índices para profesionales activos
CREATE INDEX IF NOT EXISTS idx_professionals_status_discipline 
ON professionals (status, discipline_id);

-- Índices para gastos por fecha y categoría
CREATE INDEX IF NOT EXISTS idx_expenses_date_category 
ON expenses (date, category, amount);

-- Índices para historial de emails
CREATE INDEX IF NOT EXISTS idx_email_history_date_type 
ON email_history (sent_at, type, status);

-- =====================================================
-- ÍNDICES PARA BÚSQUEDAS DE TEXTO
-- =====================================================

-- Índice para búsqueda de pacientes por nombre
CREATE INDEX IF NOT EXISTS idx_patients_name_search 
ON patients (name(50));

-- Índice para búsqueda de profesionales por nombre
CREATE INDEX IF NOT EXISTS idx_professionals_name_search 
ON professionals (name(50));

-- =====================================================
-- VERIFICACIÓN DE ÍNDICES CREADOS
-- =====================================================

-- Para verificar que los índices se crearon correctamente, ejecuta:
-- SHOW INDEX FROM appointments;
-- SHOW INDEX FROM patients;
-- SHOW INDEX FROM professionals;
-- SHOW INDEX FROM expenses;
-- SHOW INDEX FROM email_history;