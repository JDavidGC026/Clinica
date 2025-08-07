<?php
require_once 'config.php';

try {
    $pdo = getDatabase();

    $sql = "CREATE TABLE IF NOT EXISTS `clinical_notes` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `patient_id` INT NOT NULL,
        `professional_id` INT NOT NULL,
        `notes` TEXT,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
        FOREIGN KEY (`professional_id`) REFERENCES `professionals`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

    $pdo->exec($sql);

    sendResponse(['success' => true, 'message' => 'Tabla clinical_notes creada exitosamente.']);

} catch (Exception $e) {
    sendError('Error creando la tabla clinical_notes: ' . $e->getMessage());
}

