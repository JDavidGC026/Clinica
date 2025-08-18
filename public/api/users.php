<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$userId = $_GET['id'] ?? null;

try {
    $pdo = getDatabase();
    
    switch ($method) {
        case 'GET':
            if ($userId) {
                $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
                $stmt->execute([$userId]);
                $user = $stmt->fetch();
                
                if (!$user) {
                    logApiActivity('users', 'GET', 404, "User not found: ID $userId");
                    sendError('User not found', 404);
                }
                
                // No retornar password_hash por seguridad
                unset($user['password_hash']);
                
                logApiActivity('users', 'GET', 200, "Retrieved user: ID $userId");
                sendResponse($user);
            } else {
                $stmt = $pdo->query("SELECT id, username, name, email, role, role_id, active, created_at FROM users ORDER BY name");
                $users = $stmt->fetchAll();
                
                logApiActivity('users', 'GET', 200, "Retrieved all users: " . count($users) . " records");
                sendResponse($users);
            }
            break;
            
        case 'POST':
            $data = getRequestData();
            
            // Requeridos base
            $baseRequired = ['username', 'password', 'name', 'email'];
            foreach ($baseRequired as $field) {
                if (!isset($data[$field])) {
                    logApiActivity('users', 'POST', 400, "Missing required field: $field");
                    sendError("Missing required field: $field", 400);
                }
            }
            
            // Debe venir 'role' (nombre) o 'role_id' (id). Al menos uno.
            if (!isset($data['role']) && !isset($data['role_id'])) {
                logApiActivity('users', 'POST', 400, "Missing required field: role or role_id");
                sendError("Missing required field: role or role_id", 400);
            }
            
            // Hash password
            $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
            
            // Resolver rol: aceptar role_id directo o buscar por nombre
            $roleId = null;
            $roleName = null;
            
            if (isset($data['role_id'])) {
                // Validar y obtener nombre del rol por id
                $stmt = $pdo->prepare("SELECT id, name FROM roles WHERE id = ? AND active = 1");
                $stmt->execute([$data['role_id']]);
                $roleResult = $stmt->fetch();
                if ($roleResult) {
                    $roleId = (int)$roleResult['id'];
                    $roleName = $roleResult['name'];
                } else {
                    logApiActivity('users', 'POST', 400, "Invalid role_id provided");
                    sendError("Invalid role_id: role not found or inactive", 400);
                }
            } elseif (isset($data['role'])) {
                // Buscar id por nombre
                $stmt = $pdo->prepare("SELECT id, name FROM roles WHERE name = ? AND active = 1");
                $stmt->execute([$data['role']]);
                $roleResult = $stmt->fetch();
                if ($roleResult) {
                    $roleId = (int)$roleResult['id'];
                    $roleName = $roleResult['name'];
                } else {
                    // Permitir crear usuario sin role_id si el nombre no existe? Mejor rechazar para consistencia.
                    logApiActivity('users', 'POST', 400, "Invalid role name provided: {$data['role']}");
                    sendError("Invalid role name: role not found or inactive", 400);
                }
            }
            
            // INSERT con role y role_id coherentes
            $stmt = $pdo->prepare("
                INSERT INTO users (username, password_hash, name, email, role, role_id, active) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['username'],
                $passwordHash,
                $data['name'],
                $data['email'],
                $roleName,
                $roleId,
                $data['active'] ?? true
            ]);
            
            $userId = $pdo->lastInsertId();
            
            $stmt = $pdo->prepare("SELECT id, username, name, email, role, role_id, active, created_at FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();
            
            logApiActivity('users', 'POST', 201, "Created user: ID $userId (Role: {$data['role']}, Role ID: $roleId)");
            sendResponse($user, 201);
            break;
            
        case 'PUT':
            if (!$userId) {
                logApiActivity('users', 'PUT', 400, "User ID required");
                sendError('User ID required', 400);
            }
            
            $data = getRequestData();
            
            // Obtener usuario actual
            $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $existingUser = $stmt->fetch();
            
            if (!$existingUser) {
                logApiActivity('users', 'PUT', 404, "User not found: ID $userId");
                sendError('User not found', 404);
            }
            
            $updateFields = [];
            $updateValues = [];
            
            if (isset($data['username'])) {
                $updateFields[] = 'username = ?';
                $updateValues[] = $data['username'];
            }
            
            if (isset($data['name'])) {
                $updateFields[] = 'name = ?';
                $updateValues[] = $data['name'];
            }
            
            if (isset($data['email'])) {
                $updateFields[] = 'email = ?';
                $updateValues[] = $data['email'];
            }
            
            if (isset($data['role'])) {
                $updateFields[] = 'role = ?';
                $updateValues[] = $data['role'];
                
                // NUEVO: También actualizar role_id cuando se cambia el rol
                $stmt = $pdo->prepare("SELECT id FROM roles WHERE name = ? AND active = 1");
                $stmt->execute([$data['role']]);
                $roleResult = $stmt->fetch();
                $roleId = $roleResult ? $roleResult['id'] : null;
                
                $updateFields[] = 'role_id = ?';
                $updateValues[] = $roleId;
            }
            
            // NUEVO: Manejar role_id directamente si se proporciona
            if (isset($data['role_id'])) {
                $updateFields[] = 'role_id = ?';
                $updateValues[] = $data['role_id'];
                
                // También actualizar el campo role con el nombre correspondiente
                $stmt = $pdo->prepare("SELECT name FROM roles WHERE id = ? AND active = 1");
                $stmt->execute([$data['role_id']]);
                $roleResult = $stmt->fetch();
                if ($roleResult) {
                    $updateFields[] = 'role = ?';
                    $updateValues[] = $roleResult['name'];
                }
            }
            
            if (isset($data['password'])) {
                $updateFields[] = 'password_hash = ?';
                $updateValues[] = password_hash($data['password'], PASSWORD_DEFAULT);
            }
            
            if (isset($data['active'])) {
                $updateFields[] = 'active = ?';
                $updateValues[] = $data['active'];
            }
            
            if (!empty($updateFields)) {
                $updateValues[] = $userId;
                $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($updateValues);
            }
            
            $stmt = $pdo->prepare("SELECT id, username, name, email, role, role_id, active, created_at FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();
            
            logApiActivity('users', 'PUT', 200, "Updated user: ID $userId");
            sendResponse($user);
            break;
            
        case 'DELETE':
            if (!$userId) {
                logApiActivity('users', 'DELETE', 400, "User ID required");
                sendError('User ID required', 400);
            }
            
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $result = $stmt->execute([$userId]);
            
            if ($stmt->rowCount() > 0) {
                logApiActivity('users', 'DELETE', 200, "Deleted user: ID $userId");
                sendResponse(['success' => true, 'message' => 'User deleted successfully']);
            } else {
                logApiActivity('users', 'DELETE', 404, "User not found: ID $userId");
                sendError('User not found', 404);
            }
            break;
            
        default:
            logApiActivity('users', $method, 405, "Method not allowed");
            sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    logApiActivity('users', $method, 500, "Error: " . $e->getMessage());
    sendError($e->getMessage());
}
?>
