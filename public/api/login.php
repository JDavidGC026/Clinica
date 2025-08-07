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
        // Obtener información del rol
        $roleName = $user['role'];
        $roleInfo = null;
        
        if ($user['role_id']) {
            $stmt = $pdo->prepare("SELECT name, description FROM roles WHERE id = ? AND active = 1");
            $stmt->execute([$user['role_id']]);
            $roleInfo = $stmt->fetch();
            if ($roleInfo) {
                $roleName = $roleInfo['name'];
            }
        }
        
        // Obtener permisos efectivos (rol + individuales)
        $userPermissions = getUserEffectivePermissions($pdo, $user['id']);
        
        logApiActivity('login', 'POST', 200, "Successful user login: " . $data['username'] . " (Role: $roleName)");
        sendResponse([
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $roleName,
                'role_id' => $user['role_id'],
                'role_description' => $roleInfo ? $roleInfo['description'] : null,
                'type' => 'user',
                'permissions' => $userPermissions
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
            // Los profesionales tienen permisos limitados por defecto
            $professionalPermissions = [
                'patients' => 'read',
                'appointments' => 'write',
                'professionals' => 'read',
                'disciplines' => 'read'
            ];
            
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
                    'disciplineId' => $professional['discipline_id'],
                    'permissions' => $professionalPermissions
                ],
                'message' => 'Login exitoso como profesional'
            ]);
            return;
        }
    }
    
    // Si llegamos aquí, las credenciales no son válidas
    // Agregar un pequeño retraso para prevenir ataques de fuerza bruta
    usleep(500000); // 0.5 segundos
    
    logApiActivity('login', 'POST', 401, "Invalid credentials for: " . $data['username']);
    sendError('Usuario o contraseña incorrectos', 401);
    
} catch (Exception $e) {
    logApiActivity('login', 'POST', 500, "Error: " . $e->getMessage());
    sendError('Error en el servidor: ' . $e->getMessage(), 500);
}

// Función para obtener permisos efectivos de un usuario (rol + individuales)
function getUserEffectivePermissions($pdo, $userId) {
    $permissions = [];
    
    // Obtener permisos del rol
    $stmt = $pdo->prepare("
        SELECT rp.module, rp.permission
        FROM users u
        INNER JOIN roles r ON u.role_id = r.id
        INNER JOIN role_permissions rp ON r.id = rp.role_id
        WHERE u.id = ? AND r.active = 1
    ");
    $stmt->execute([$userId]);
    $rolePermissions = $stmt->fetchAll();
    
    foreach ($rolePermissions as $perm) {
        $permissions[$perm['module']] = $perm['permission'];
    }
    
    // Sobrescribir con permisos individuales (si existen)
    $stmt = $pdo->prepare("SELECT module, permission FROM user_permissions WHERE user_id = ?");
    $stmt->execute([$userId]);
    $individualPermissions = $stmt->fetchAll();
    
    foreach ($individualPermissions as $perm) {
        $permissions[$perm['module']] = $perm['permission'];
    }
    
    return $permissions;
}
?>