<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    logApiActivity('login', $_SERVER['REQUEST_METHOD'], 405, "Method not allowed");
    sendError('Método no permitido', 405);
}

$data = getRequestData();

if (!isset($data['username']) || !isset($data['password'])) {
    logApiActivity('login', 'POST', 400, "Username and password required");
    sendError('Usuario y contraseña requeridos', 400);
}

try {
    $pdo = getDatabase();
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? AND active = 1");
    $stmt->execute([$data['username']]);
    $user = $stmt->fetch();
    
    if (!$user) {
        logApiActivity('login', 'POST', 401, "User not found: " . $data['username']);
        sendError('Usuario no encontrado', 401);
    }
    
    // Verificar contraseña
    if (!password_verify($data['password'], $user['password_hash'])) {
        logApiActivity('login', 'POST', 401, "Incorrect password for user: " . $data['username']);
        sendError('Contraseña incorrecta', 401);
    }
    
    // Login exitoso
    logApiActivity('login', 'POST', 200, "Successful login: " . $data['username']);
    sendResponse([
        'success' => true,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role']
        ],
        'message' => 'Login exitoso'
    ]);
    
} catch (Exception $e) {
    logApiActivity('login', 'POST', 500, "Error: " . $e->getMessage());
    sendError('Error en el servidor: ' . $e->getMessage(), 500);
}
?>