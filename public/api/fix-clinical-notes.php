<?php
require_once 'config.php';

try {
    $pdo = getDatabase();

    // Primero, eliminar la tabla existente si tiene problemas
    $pdo->exec("DROP TABLE IF EXISTS `clinical_notes`");

    // Crear la tabla sin foreign keys para evitar problemas
    $sql = "CREATE TABLE IF NOT EXISTS `clinical_notes` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `patient_id` VARCHAR(50) NOT NULL,
        `professional_id` INT NOT NULL,
        `notes` TEXT,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_patient_professional (`patient_id`, `professional_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

    $pdo->exec($sql);

    sendResponse(['success' => true, 'message' => 'Tabla clinical_notes creada/actualizada exitosamente sin foreign keys.']);

} catch (Exception $e) {
    sendError('Error creando/actualizando la tabla clinical_notes: ' . $e->getMessage());
}
?>
