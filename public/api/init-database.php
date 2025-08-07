<?php
require_once 'config.php';

try {
    $pdo = getDatabase();
    
    // Crear tabla settings_correo
    $createSettingsCorreoTable = "
    CREATE TABLE IF NOT EXISTS settings_correo (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value TEXT,
        description VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_setting_key (setting_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    
    $pdo->exec($createSettingsCorreoTable);
    
    // Crear tabla email_history si no existe
    $createEmailHistoryTable = "
    CREATE TABLE IF NOT EXISTS email_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(100) NOT NULL,
        recipient VARCHAR(255) NOT NULL,
        subject VARCHAR(500),
        status ENUM('enviado', 'error', 'pendiente', 'simulado') DEFAULT 'pendiente',
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        error_message TEXT,
        INDEX idx_type (type),
        INDEX idx_recipient (recipient),
        INDEX idx_sent_at (sent_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    
    $pdo->exec($createEmailHistoryTable);
    
    // Insertar configuraciones por defecto si no existen
    $defaultSettings = [
        ['smtp_host', 'smtp.gmail.com', 'Servidor SMTP de Gmail'],
        ['smtp_port', '587', 'Puerto SMTP (587 para TLS)'],
        ['smtp_secure', 'tls', 'Tipo de encriptación (tls/ssl)'],
        ['smtp_auth', '1', 'Usar autenticación SMTP'],
        ['from_name', 'Clínica Delux', 'Nombre del remitente por defecto']
    ];
    
    foreach ($defaultSettings as $setting) {
        $stmt = $pdo->prepare("
            INSERT IGNORE INTO settings_correo (setting_key, setting_value, description) 
            VALUES (?, ?, ?)
        ");
        $stmt->execute($setting);
    }
    
    logApiActivity('init-database', 'POST', 200, "Database initialized successfully");
    sendResponse([
        'success' => true,
        'message' => 'Base de datos inicializada correctamente',
        'tables_created' => ['settings_correo', 'email_history']
    ]);
    
} catch (Exception $e) {
    logApiActivity('init-database', 'POST', 500, "Error: " . $e->getMessage());
    sendError('Error inicializando base de datos: ' . $e->getMessage());
}
?>