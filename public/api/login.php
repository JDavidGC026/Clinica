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
    
    // Primero intentar login como usuario normal
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? AND active = 1");
    $stmt->execute([$data['username']]);
    $user = $stmt->fetch();
    
    if ($user && password_verify($data['password'], $user['password_hash'])) {
        logApiActivity('login', 'POST', 200, "Successful user login: " . $data['username']);
        sendResponse([
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
                'type' => 'user'
            ],
            'message' => 'Login exitoso'
        ]);
        return;
    }
    
    // Si no es usuario, intentar login como profesional
    $stmt = $pdo->prepare("
        SELECT p.*, d.name as discipline_name 
        FROM professionals p 
        LEFT JOIN disciplines d ON p.discipline_id = d.id 
        WHERE p.email = ? AND p.status = 'activo'
    ");
    $stmt->execute([$data['username']]);
    $professional = $stmt->fetch();
    
    if ($professional) {
        // Verificar contraseña del profesional
        $passwordValid = false;
        
        if (isset($professional['password_hash']) && !empty($professional['password_hash'])) {
            // Si tiene contraseña hash, verificarla
            $passwordValid = password_verify($data['password'], $professional['password_hash']);
        } else {
            // Si no tiene contraseña hash, usar contraseña por defecto
            $passwordValid = ($data['password'] === 'password123');
        }
        
        if ($passwordValid) {
            logApiActivity('login', 'POST', 200, "Successful professional login: " . $data['username']);
            sendResponse([
                'success' => true,
                'user' => [
                    'id' => $professional['id'],
                    'username' => $professional['email'],
                    'name' => $professional['name'],
                    'email' => $professional['email'],
                    'role' => 'Profesional',
                    'type' => 'professional',
                    'discipline' => $professional['discipline_name'],
                    'disciplineId' => $professional['discipline_id']
                ],
                'message' => 'Login exitoso como profesional'
            ]);
            return;
        }
    }
    
    // Si llegamos aquí, las credenciales no son válidas
    logApiActivity('login', 'POST', 401, "Invalid credentials for: " . $data['username']);
    sendError('Usuario o contraseña incorrectos', 401);
    
} catch (Exception $e) {
    logApiActivity('login', 'POST', 500, "Error: " . $e->getMessage());
    sendError('Error en el servidor: ' . $e->getMessage(), 500);
}
?>