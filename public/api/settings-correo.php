<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = getDatabase();
    
    switch ($method) {
        case 'GET':
            // Obtener todas las configuraciones de correo
            $stmt = $pdo->query("SELECT * FROM settings_correo ORDER BY id");
            $settings = $stmt->fetchAll();
            
            // Convertir a formato clave-valor y desencriptar contraseñas
            $config = [];
            foreach ($settings as $setting) {
                $value = $setting['setting_value'];
                
                // Desencriptar contraseñas
                if ($setting['setting_key'] === 'smtp_password' && !empty($value)) {
                    $value = decryptPassword($value);
                }
                
                $config[$setting['setting_key']] = $value;
            }
            
            logApiActivity('settings-correo', 'GET', 200, "Retrieved email settings");
            sendResponse($config);
            break;
            
        case 'POST':
            $data = getRequestData();
            
            // Validar datos requeridos
            $requiredFields = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'from_name'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field])) {
                    logApiActivity('settings-correo', 'POST', 400, "Missing required field: $field");
                    sendError("Missing required field: $field", 400);
                }
            }
            
            // Configuraciones por defecto
            $defaultSettings = [
                'smtp_host' => $data['smtp_host'],
                'smtp_port' => $data['smtp_port'],
                'smtp_user' => $data['smtp_user'],
                'smtp_password' => $data['smtp_password'],
                'from_email' => $data['from_email'] ?? $data['smtp_user'],
                'from_name' => $data['from_name'],
                'smtp_secure' => $data['smtp_secure'] ?? 'tls',
                'smtp_auth' => $data['smtp_auth'] ?? '1'
            ];
            
            // Guardar cada configuración
            foreach ($defaultSettings as $key => $value) {
                // Encriptar contraseña
                if ($key === 'smtp_password') {
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
            
            logApiActivity('settings-correo', 'POST', 200, "Updated email settings");
            sendResponse(['success' => true, 'message' => 'Configuración de correo guardada exitosamente']);
            break;
            
        case 'PUT':
            // Actualizar configuración específica
            $data = getRequestData();
            
            if (!isset($data['setting_key']) || !isset($data['setting_value'])) {
                logApiActivity('settings-correo', 'PUT', 400, "Missing required fields");
                sendError('Missing required fields: setting_key, setting_value', 400);
            }
            
            $value = $data['setting_value'];
            
            // Encriptar si es contraseña
            if ($data['setting_key'] === 'smtp_password') {
                $value = encryptPassword($value);
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO settings_correo (setting_key, setting_value, updated_at) 
                VALUES (?, ?, NOW())
                ON DUPLICATE KEY UPDATE 
                setting_value = VALUES(setting_value), 
                updated_at = NOW()
            ");
            
            $stmt->execute([$data['setting_key'], $value]);
            
            logApiActivity('settings-correo', 'PUT', 200, "Updated setting: " . $data['setting_key']);
            sendResponse(['success' => true, 'message' => 'Configuración actualizada']);
            break;
            
        case 'DELETE':
            // Eliminar todas las configuraciones de correo
            $stmt = $pdo->prepare("DELETE FROM settings_correo");
            $stmt->execute();
            
            logApiActivity('settings-correo', 'DELETE', 200, "Deleted all email settings");
            sendResponse(['success' => true, 'message' => 'Configuraciones eliminadas']);
            break;
            
        default:
            logApiActivity('settings-correo', $method, 405, "Method not allowed");
            sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    logApiActivity('settings-correo', $method, 500, "Error: " . $e->getMessage());
    sendError($e->getMessage());
}

// Función para encriptar contraseñas
function encryptPassword($password) {
    if (empty($password)) return '';
    
    $key = getEncryptionKey();
    $iv = openssl_random_pseudo_bytes(16);
    $encrypted = openssl_encrypt($password, 'AES-256-CBC', $key, 0, $iv);
    
    return base64_encode($iv . $encrypted);
}

// Función para desencriptar contraseñas
function decryptPassword($encryptedPassword) {
    if (empty($encryptedPassword)) return '';
    
    try {
        $key = getEncryptionKey();
        $data = base64_decode($encryptedPassword);
        $iv = substr($data, 0, 16);
        $encrypted = substr($data, 16);
        
        return openssl_decrypt($encrypted, 'AES-256-CBC', $key, 0, $iv);
    } catch (Exception $e) {
        error_log('Error decrypting password: ' . $e->getMessage());
        return '';
    }
}

// Función para obtener clave de encriptación
function getEncryptionKey() {
    // Usar una clave basada en configuración del servidor
    $serverKey = $_SERVER['SERVER_NAME'] ?? 'localhost';
    $dbName = $_ENV['DB_NAME'] ?? 'clinica_delux';
    
    return hash('sha256', $serverKey . $dbName . 'clinic_email_key_2024');
}
?>