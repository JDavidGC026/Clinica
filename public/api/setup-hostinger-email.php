<?php
require_once 'config.php';

try {
    $pdo = getDatabase();
    
    // Primero, asegurar que las tablas existen
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
    
    // Configuración de Hostinger para soporte@grupodelux.dvguzman.com
    $hostingerSettings = [
        'smtp_host' => 'smtp.hostinger.com',
        'smtp_port' => '465',
        'smtp_secure' => 'ssl',
        'smtp_auth' => '1',
        'smtp_user' => 'soporte@grupodelux.dvguzman.com',
        'smtp_password' => '', // Esta debe ser configurada manualmente por seguridad
        'from_email' => 'soporte@grupodelux.dvguzman.com',
        'from_name' => 'Grupo Médico Delux - Soporte',
        'imap_host' => 'imap.hostinger.com',
        'imap_port' => '993',
        'imap_secure' => 'ssl',
        'pop_host' => 'pop.hostinger.com',
        'pop_port' => '995',
        'pop_secure' => 'ssl'
    ];
    
    // Función de encriptación
    function encryptPassword($password) {
        if (empty($password)) return '';
        
        $key = getEncryptionKey();
        $iv = openssl_random_pseudo_bytes(16);
        $encrypted = openssl_encrypt($password, 'AES-256-CBC', $key, 0, $iv);
        
        return base64_encode($iv . $encrypted);
    }
    
    function getEncryptionKey() {
        $serverKey = $_SERVER['SERVER_NAME'] ?? 'localhost';
        $dbName = $_ENV['DB_NAME'] ?? 'clinica_delux';
        
        return hash('sha256', $serverKey . $dbName . 'clinic_email_key_2024');
    }
    
    // Guardar cada configuración
    foreach ($hostingerSettings as $key => $value) {
        // Encriptar contraseña si existe
        if ($key === 'smtp_password' && !empty($value)) {
            $value = encryptPassword($value);
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO settings_correo (setting_key, setting_value, updated_at) 
            VALUES (?, ?, NOW())
            ON DUPLICATE KEY UPDATE 
            setting_value = VALUES(setting_value), 
            updated_at = NOW()
        ");
        
        $stmt->execute([$key, $value]);
    }
    
    logApiActivity('setup-hostinger-email', 'POST', 200, "Hostinger email configuration setup completed");
    sendResponse([
        'success' => true, 
        'message' => 'Configuración de correo Hostinger configurada exitosamente',
        'settings' => array_keys($hostingerSettings),
        'note' => 'IMPORTANTE: Debe configurar la contraseña SMTP manualmente por razones de seguridad'
    ]);
    
} catch (Exception $e) {
    logApiActivity('setup-hostinger-email', 'POST', 500, "Error: " . $e->getMessage());
    sendError('Error configurando correo Hostinger: ' . $e->getMessage());
}
?>
