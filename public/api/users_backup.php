<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];
$pathParts = explode('/', trim(parse_url($path, PHP_URL_PATH), '/'));
$userId = isset($_GET['id']) ? $_GET['id'] : null;

try {
    $pdo = getDatabase();
    
    switch ($method) {
        case 'GET':
            if ($userId) {
                $stmt = $pdo->prepare("SELECT id, username, name, email, role, active, created_at FROM users WHERE id = ?");
                $stmt->execute([$userId]);
                $user = $stmt->fetch();
                
                if (!$user) {
                    logApiActivity('users', 'GET', 404, "User not found: ID $userId");
                    sendError('User not found', 404);
                }
                
                logApiActivity('users', 'GET', 200, "Retrieved user: ID $userId");
                sendResponse($user);
            } else {
                $stmt = $pdo->query("SELECT id, username, name, email, role, active, created_at FROM users ORDER BY name");
                $users = $stmt->fetchAll();
                logApiActivity('users', 'GET', 200, "Retrieved all users: " . count($users) . " records");
                sendResponse($users);
            }
            break;
            
        case 'POST':
            $data = getRequestData();
            
            $requiredFields = ['username', 'password', 'name', 'email', 'role'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field])) {
                    logApiActivity('users', 'POST', 400, "Missing required field: $field");
                    sendError("Missing required field: $field", 400);
                }
            }
            
            // Hash password
            $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
            
            $stmt = $pdo->prepare("
                INSERT INTO users (username, password_hash, name, email, role, active) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['username'],
                $passwordHash,
                $data['name'],
                $data['email'],
                $data['role'],
                $data['active'] ?? true
            ]);
            
            $userId = $pdo->lastInsertId();
            
            $stmt = $pdo->prepare("SELECT id, username, name, email, role, active, created_at FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();
            
            logApiActivity('users', 'POST', 201, "Created user: ID $userId");
            sendResponse($user, 201);
            break;
            
        case 'PUT':
            if (!$userId) {
                logApiActivity('users', 'PUT', 400, "User ID required");
                sendError('User ID required', 400);
            }
            
            $data = getRequestData();
            
            $updateFields = [];
            $updateValues = [];
            
            if (isset($data['username'])) {
                $updateFields[] = 'username = ?';
                $updateValues[] = $data['username'];
            }
            if (isset($data['password'])) {
                $updateFields[] = 'password_hash = ?';
                $updateValues[] = password_hash($data['password'], PASSWORD_DEFAULT);
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
            }
            if (isset($data['active'])) {
                $updateFields[] = 'active = ?';
                $updateValues[] = $data['active'];
            }
            
            if (empty($updateFields)) {
                logApiActivity('users', 'PUT', 400, "No fields to update");
                sendError('No fields to update', 400);
            }
            
            $updateValues[] = $userId;
            
            $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($updateValues);
            
            $stmt = $pdo->prepare("SELECT id, username, name, email, role, active, created_at FROM users WHERE id = ?");
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
            $stmt->execute([$userId]);
            
            logApiActivity('users', 'DELETE', 200, "Deleted user: ID $userId");
            sendResponse(['success' => true]);
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