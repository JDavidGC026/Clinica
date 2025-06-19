<?php
// Script para configurar la base de datos en producción
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Solo permitir ejecución si se proporciona una clave de seguridad
$securityKey = $_GET['key'] ?? '';
$expectedKey = 'setup_db_2024'; // Cambia esta clave por una más segura

if ($securityKey !== $expectedKey) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

$host = 'localhost';
$username = $_ENV['DB_USER'] ?? 'tu_usuario_mysql';
$password = $_ENV['DB_PASSWORD'] ?? 'tu_password_mysql';
$database = $_ENV['DB_NAME'] ?? 'tu_base_datos';

try {
    // Conectar sin especificar la base de datos
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    
    // Crear la base de datos si no existe
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$database` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$database`");
    
    // Crear tablas
    $tables = [
        // Tabla de disciplinas
        "CREATE TABLE IF NOT EXISTS disciplines (
            id VARCHAR(100) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )",
        
        // Tabla de profesionales
        "CREATE TABLE IF NOT EXISTS professionals (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            phone VARCHAR(50),
            discipline_id VARCHAR(100),
            license VARCHAR(100),
            experience VARCHAR(100),
            schedule JSON,
            status ENUM('activo', 'inactivo') DEFAULT 'activo',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE SET NULL
        )",
        
        // Tabla de pacientes
        "CREATE TABLE IF NOT EXISTS patients (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            phone VARCHAR(50),
            age INT,
            gender ENUM('masculino', 'femenino', 'otro', 'prefiero-no-decir'),
            address TEXT,
            emergency_contact VARCHAR(255),
            emergency_phone VARCHAR(50),
            medical_history TEXT,
            allergies TEXT,
            medications TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )",
        
        // Tabla de citas
        "CREATE TABLE IF NOT EXISTS appointments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            patient_id INT,
            patient_name VARCHAR(255) NOT NULL,
            patient_email VARCHAR(255) NOT NULL,
            patient_phone VARCHAR(50),
            professional_id INT,
            professional_name VARCHAR(255),
            date DATE NOT NULL,
            time TIME NOT NULL,
            type VARCHAR(100) NOT NULL,
            notes TEXT,
            status ENUM('programada', 'en-progreso', 'completada', 'cancelada') DEFAULT 'programada',
            payment_status ENUM('pendiente', 'pagado', 'cancelado_sin_costo') DEFAULT 'pendiente',
            cost DECIMAL(10,2),
            folio VARCHAR(50) UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
            FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE SET NULL,
            INDEX idx_date_time (date, time),
            INDEX idx_professional_date (professional_id, date),
            INDEX idx_patient_date (patient_id, date)
        )",
        
        // Tabla de gastos/egresos
        "CREATE TABLE IF NOT EXISTS expenses (
            id VARCHAR(50) PRIMARY KEY,
            description TEXT NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            date DATE NOT NULL,
            category VARCHAR(100),
            type ENUM('egreso') DEFAULT 'egreso',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_date (date),
            INDEX idx_category (category)
        )",
        
        // Tabla de historial de emails
        "CREATE TABLE IF NOT EXISTS email_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            type VARCHAR(100) NOT NULL,
            recipient VARCHAR(255) NOT NULL,
            subject VARCHAR(500),
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status ENUM('enviado', 'pendiente', 'error') DEFAULT 'enviado',
            INDEX idx_sent_at (sent_at),
            INDEX idx_recipient (recipient)
        )",
        
        // Tabla de notas clínicas
        "CREATE TABLE IF NOT EXISTS clinical_notes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            professional_id INT NOT NULL,
            patient_id INT NOT NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
            UNIQUE KEY unique_professional_patient (professional_id, patient_id)
        )",
        
        // Tabla de configuración
        "CREATE TABLE IF NOT EXISTS settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            setting_key VARCHAR(100) UNIQUE NOT NULL,
            setting_value TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )"
    ];
    
    foreach ($tables as $table) {
        $pdo->exec($table);
    }
    
    // Insertar datos iniciales
    $disciplines = [
        ['medicina-general', 'Medicina General'],
        ['pediatria', 'Pediatría'],
        ['ginecologia', 'Ginecología'],
        ['traumatologia-ortopedia', 'Traumatología y Ortopedia'],
        ['urologia', 'Urología'],
        ['medicina-interna', 'Medicina Interna'],
        ['gastroenterologia', 'Gastroenterología'],
        ['nutricion', 'Nutrición'],
        ['dermatologia', 'Dermatología'],
        ['psicologia-clinica', 'Psicología Clínica']
    ];
    
    $stmt = $pdo->prepare("INSERT IGNORE INTO disciplines (id, name) VALUES (?, ?)");
    foreach ($disciplines as $discipline) {
        $stmt->execute($discipline);
    }
    
    // Insertar configuración inicial
    $settings = [
        ['clinic_name', 'Grupo Médico Delux'],
        ['clinic_address', 'Dirección de la clínica'],
        ['clinic_phone', 'Teléfono de la clínica']
    ];
    
    $stmt = $pdo->prepare("INSERT IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)");
    foreach ($settings as $setting) {
        $stmt->execute($setting);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Database setup completed successfully',
        'database' => $database
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database setup failed: ' . $e->getMessage()
    ]);
}
?>