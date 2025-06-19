<?php
// Configuración común para todas las APIs
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuración de base de datos
$host = 'localhost';
$username = $_ENV['DB_USER'] ?? 'tu_usuario_mysql';
$password = $_ENV['DB_PASSWORD'] ?? 'tu_password_mysql';
$database = $_ENV['DB_NAME'] ?? 'tu_base_datos';

function getDatabase() {
    global $host, $username, $password, $database;
    
    try {
        $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        return $pdo;
    } catch (PDOException $e) {
        throw new Exception('Database connection failed: ' . $e->getMessage());
    }
}

function sendResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit();
}

function sendError($message, $status = 500) {
    http_response_code($status);
    echo json_encode(['error' => $message]);
    exit();
}

function getRequestData() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?? [];
}
?>