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
        throw new Exception('Database connection failed: ' . $e->getMessage());
    }
}

function sendResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

function sendError($message, $status = 500) {
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
?>