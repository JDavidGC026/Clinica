<?php
// Configuración común para todas las APIs - Clínica Delux
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuración de zona horaria para Ciudad de México
date_default_timezone_set('America/Mexico_City');

// Configuración de base de datos
$host = $_ENV['DB_HOST'] ?? 'localhost';
$username = $_ENV['DB_USER'] ?? 'root';
$password = $_ENV['DB_PASSWORD'] ?? '';
$database = $_ENV['DB_NAME'] ?? 'clinica_delux';

function getDatabase() {
    global $host, $username, $password, $database;
    
    try {
        $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        
        // Configurar zona horaria en MySQL
        $pdo->exec("SET time_zone = '-06:00'");
        
        return $pdo;
    } catch (PDOException $e) {
        // Registrar el error en un archivo de log
        error_log('Error de conexión a la base de datos: ' . $e->getMessage(), 0);
        
        throw new Exception('Database connection failed: ' . $e->getMessage());
    }
}

function sendResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

function sendError($message, $status = 500) {
    // Registrar el error en un archivo de log
    error_log('API Error: ' . $message . ' (Status: ' . $status . ')', 0);
    
    http_response_code($status);
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
    exit();
}

function getRequestData() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?? [];
}

// Función para formatear fechas en zona horaria de México
function formatMexicoDate($date, $format = 'Y-m-d H:i:s') {
    $dateTime = new DateTime($date);
    $dateTime->setTimezone(new DateTimeZone('America/Mexico_City'));
    return $dateTime->format($format);
}

// Función para obtener la fecha actual en México
function getMexicoNow() {
    $now = new DateTime();
    $now->setTimezone(new DateTimeZone('America/Mexico_City'));
    return $now;
}

// Función para registrar actividad de la API
function logApiActivity($endpoint, $method, $status, $message = '') {
    $logFile = __DIR__ . '/api_log.txt';
    $timestamp = date('Y-m-d H:i:s');
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
    
    $logEntry = "[$timestamp] $ip | $method $endpoint | Status: $status | $message | $userAgent\n";
    
    // Limitar el tamaño del archivo de log
    if (file_exists($logFile) && filesize($logFile) > 5 * 1024 * 1024) { // 5MB
        // Crear archivo de respaldo
        rename($logFile, $logFile . '.' . date('Ymd-His') . '.bak');
    }
    
    file_put_contents($logFile, $logEntry, FILE_APPEND);
}

// Registrar la actividad actual
$endpoint = $_SERVER['REQUEST_URI'] ?? 'Unknown';
$method = $_SERVER['REQUEST_METHOD'] ?? 'Unknown';
logApiActivity($endpoint, $method, 200, 'API request started');
?>