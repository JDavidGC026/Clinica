-- =====================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN (COMPATIBLE CON MYSQL 5.7+)
-- Sistema: Grupo Médico Delux - Hostinger
-- =====================================================

-- =====================================================
-- VERIFICAR Y CREAR ÍNDICES DE FORMA SEGURA
-- =====================================================

-- Procedimiento para crear índices solo si no existen
DELIMITER $$

CREATE PROCEDURE CreateIndexIfNotExists(
    IN table_name VARCHAR(128),
    IN index_name VARCHAR(128),
    IN index_definition TEXT
)
BEGIN
    DECLARE index_exists INT DEFAULT 0;
    
    -- Verificar si el índice ya existe
    SELECT COUNT(*)
    INTO index_exists
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
    AND table_name = table_name
    AND index_name = index_name;
    
    -- Si no existe, crearlo
    IF index_exists = 0 THEN
        SET @sql = CONCAT('CREATE INDEX ', index_name, ' ON ', table_name, ' ', index_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        SELECT CONCAT('✓ Índice ', index_name, ' creado en tabla ', table_name) as 'Resultado';
    ELSE
        SELECT CONCAT('⚠ Índice ', index_name, ' ya existe en tabla ', table_name) as 'Resultado';
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- CREAR ÍNDICES USANDO EL PROCEDIMIENTO
-- =====================================================

-- Índices para tabla appointments
CALL CreateIndexIfNotExists('appointments', 'idx_appointments_prof_date_status', '(professional_id, date, status)');
CALL CreateIndexIfNotExists('appointments', 'idx_appointments_patient_date_status', '(patient_id, date, status)');
CALL CreateIndexIfNotExists('appointments', 'idx_appointments_payment_date', '(payment_status, date, cost)');

-- Índices para tabla patients
CALL CreateIndexIfNotExists('patients', 'idx_patients_name_email', '(name, email)');
CALL CreateIndexIfNotExists('patients', 'idx_patients_name_search', '(name(50))');

-- Índices para tabla professionals
CALL CreateIndexIfNotExists('professionals', 'idx_professionals_status_discipline', '(status, discipline_id)');
CALL CreateIndexIfNotExists('professionals', 'idx_professionals_name_search', '(name(50))');

-- Índices para tabla expenses
CALL CreateIndexIfNotExists('expenses', 'idx_expenses_date_category', '(date, category, amount)');

-- Índices para tabla email_history
CALL CreateIndexIfNotExists('email_history', 'idx_email_history_date_type', '(sent_at, type, status)');

-- =====================================================
-- LIMPIAR PROCEDIMIENTO TEMPORAL
-- =====================================================

DROP PROCEDURE IF EXISTS CreateIndexIfNotExists;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

SELECT 'Migración de índices completada exitosamente' as 'Estado';

-- Mostrar índices creados por tabla
SELECT 
    TABLE_NAME as 'Tabla',
    INDEX_NAME as 'Índice',
    COLUMN_NAME as 'Columna',
    SEQ_IN_INDEX as 'Posición'
FROM information_schema.statistics 
WHERE table_schema = DATABASE()
AND INDEX_NAME LIKE 'idx_%'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;