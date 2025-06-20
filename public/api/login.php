<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Método no permitido', 405);
}

$data = getRequestData();

if (!isset($data['username']) || !isset($data['password'])) {
    sendError('Usuario y contraseña requeridos', 400);
}

try {
    $pdo = getDatabase();
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? AND active = 1");
    $stmt->execute([$data['username']]);
    $user = $stmt->fetch();
    
    if (!$user) {
        sendError('Usuario no encontrado', 401);
    }
    
    // Verificar contraseña
    if (!password_verify($data['password'], $user['password_hash'])) {
        sendError('Contraseña incorrecta', 401);
    }
    
    // Login exitoso
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
    sendError('Error en el servidor: ' . $e->getMessage(), 500);
}
?>