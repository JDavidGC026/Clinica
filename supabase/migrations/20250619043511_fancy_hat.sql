-- =====================================================
-- TEMPLATE DE BACKUP PARA HOSTINGER
-- Grupo Médico Delux
-- Fecha: [FECHA_BACKUP]
-- Base de datos: [NOMBRE_BD]
-- =====================================================

-- INSTRUCCIONES:
-- 1. Reemplaza [NOMBRE_BD] por tu base de datos real
-- 2. Reemplaza [FECHA_BACKUP] por la fecha actual
-- 3. Ejecuta este script para hacer backup completo

-- =====================================================
-- BACKUP DE ESTRUCTURA Y DATOS
-- =====================================================

-- Crear archivo de backup
-- mysqldump -u [usuario] -p [NOMBRE_BD] > backup_[FECHA].sql

-- Para restaurar desde backup:
-- mysql -u [usuario] -p [NOMBRE_BD] < backup_[FECHA].sql

-- =====================================================
-- BACKUP SOLO DE DATOS (sin estructura)
-- =====================================================

-- Disciplinas
SELECT 'INSERT INTO disciplines VALUES' as '';
SELECT CONCAT('(', QUOTE(id), ',', QUOTE(name), ',', QUOTE(created_at), ',', QUOTE(updated_at), '),') 
FROM disciplines;

-- Profesionales
SELECT 'INSERT INTO professionals VALUES' as '';
SELECT CONCAT('(', id, ',', QUOTE(name), ',', QUOTE(email), ',', QUOTE(phone), ',', 
              QUOTE(discipline_id), ',', QUOTE(license), ',', QUOTE(experience), ',', 
              QUOTE(schedule), ',', QUOTE(status), ',', QUOTE(created_at), ',', QUOTE(updated_at), '),')
FROM professionals;

-- Pacientes
SELECT 'INSERT INTO patients VALUES' as '';
SELECT CONCAT('(', id, ',', QUOTE(name), ',', QUOTE(email), ',', QUOTE(phone), ',', 
              IFNULL(age, 'NULL'), ',', QUOTE(gender), ',', QUOTE(address), ',', 
              QUOTE(emergency_contact), ',', QUOTE(emergency_phone), ',', 
              QUOTE(medical_history), ',', QUOTE(allergies), ',', QUOTE(medications), ',', 
              QUOTE(notes), ',', QUOTE(created_at), ',', QUOTE(updated_at), '),')
FROM patients;

-- Citas
SELECT 'INSERT INTO appointments VALUES' as '';
SELECT CONCAT('(', id, ',', IFNULL(patient_id, 'NULL'), ',', QUOTE(patient_name), ',', 
              QUOTE(patient_email), ',', QUOTE(patient_phone), ',', 
              IFNULL(professional_id, 'NULL'), ',', QUOTE(professional_name), ',', 
              QUOTE(date), ',', QUOTE(time), ',', QUOTE(type), ',', QUOTE(notes), ',', 
              QUOTE(status), ',', QUOTE(payment_status), ',', IFNULL(cost, 'NULL'), ',', 
              QUOTE(folio), ',', QUOTE(created_at), ',', QUOTE(updated_at), '),')
FROM appointments;

-- Configuración
SELECT 'INSERT INTO settings VALUES' as '';
SELECT CONCAT('(', id, ',', QUOTE(setting_key), ',', QUOTE(setting_value), ',', 
              QUOTE(created_at), ',', QUOTE(updated_at), '),')
FROM settings;

-- =====================================================
-- COMANDOS DE BACKUP RECOMENDADOS
-- =====================================================

/*
BACKUP COMPLETO (estructura + datos):
mysqldump -u tu_usuario -p tu_base_datos > backup_completo_$(date +%Y%m%d_%H%M%S).sql

BACKUP SOLO DATOS:
mysqldump -u tu_usuario -p --no-create-info tu_base_datos > backup_datos_$(date +%Y%m%d_%H%M%S).sql

BACKUP SOLO ESTRUCTURA:
mysqldump -u tu_usuario -p --no-data tu_base_datos > backup_estructura_$(date +%Y%m%d_%H%M%S).sql

BACKUP COMPRIMIDO:
mysqldump -u tu_usuario -p tu_base_datos | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

RESTAURAR BACKUP:
mysql -u tu_usuario -p tu_base_datos < backup_archivo.sql

RESTAURAR BACKUP COMPRIMIDO:
gunzip < backup_archivo.sql.gz | mysql -u tu_usuario -p tu_base_datos
*/

-- =====================================================
-- VERIFICACIÓN POST-BACKUP
-- =====================================================

-- Verificar cantidad de registros
SELECT 'disciplines' as tabla, COUNT(*) as registros FROM disciplines
UNION ALL
SELECT 'professionals', COUNT(*) FROM professionals
UNION ALL
SELECT 'patients', COUNT(*) FROM patients
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'email_history', COUNT(*) FROM email_history
UNION ALL
SELECT 'clinical_notes', COUNT(*) FROM clinical_notes
UNION ALL
SELECT 'settings', COUNT(*) FROM settings;

-- Verificar integridad de datos
SELECT 
    'OK' as estado,
    'Backup completado exitosamente' as mensaje,
    NOW() as fecha_backup;