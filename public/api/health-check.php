<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configurar zona horaria
date_default_timezone_set('America/Mexico_City');

// Configuración de base de datos
$host = $_ENV['DB_HOST'] ?? 'localhost';
$username = $_ENV['DB_USER'] ?? 'u437141408_clinica';
$password = $_ENV['DB_PASSWORD'] ?? '@Aguila01126';
$database = $_ENV['DB_NAME'] ?? 'u437141408_clinica';

// Función para registrar actividad
function logActivity($message, $status = 'info') {
    $logFile = __DIR__ . '/api_log.txt';
    $timestamp = date('Y-m-d H:i:s');
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
    
    $logEntry = "[$timestamp] [$status] $ip | Health Check: $message\n";
    file_put_contents($logFile, $logEntry, FILE_APPEND);
}

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    
    // Configurar zona horaria en MySQL
    $pdo->exec("SET time_zone = '-06:00'");
    
    // Verificar que las tablas principales existan
    $tables = ['disciplines', 'professionals', 'patients', 'appointments', 'users'];
    $existingTables = [];
    
    foreach ($tables as $table) {
        $stmt = $pdo->prepare("SHOW TABLES LIKE ?");
        $stmt->execute([$table]);
        if ($stmt->fetch()) {
            $existingTables[] = $table;
        }
    }
    
    $mexicoTime = new DateTime();
    $mexicoTime->setTimezone(new DateTimeZone('America/Mexico_City'));
    
    $response = [
        'status' => 'ok',
        'database' => 'connected',
        'clinic' => 'Clínica Delux',
        'location' => 'Ciudad de México, México',
        'timezone' => 'America/Mexico_City',
        'server_time' => $mexicoTime->format('Y-m-d H:i:s T'),
        'tables' => $existingTables,
        'mysql_timezone' => $pdo->query("SELECT @@session.time_zone as tz")->fetch()['tz'],
        'api_version' => '1.0.0'
    ];
    
    logActivity("Health check successful - DB Connected - " . count($existingTables) . " tables found", "success");
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    logActivity("Database connection failed: " . $e->getMessage(), "error");
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed',
        'error' => $e->getMessage(),
        'clinic' => 'Clínica Delux',
        'location' => 'Ciudad de México, México',
        'timezone' => 'America/Mexico_City',
        'fallback' => 'localStorage available'
    ], JSON_UNESCAPED_UNICODE);
}
?>
