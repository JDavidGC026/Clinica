<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];
$pathParts = explode('/', trim(parse_url($path, PHP_URL_PATH), '/'));
$userId = $pathParts[2] ?? null;

try {
    $pdo = getDatabase();
    
    switch ($method) {
        case 'GET':
            if ($userId) {
                $stmt = $pdo->prepare("SELECT id, username, name, email, role, active, created_at FROM users WHERE id = ?");
                $stmt->execute([$userId]);
                $user = $stmt->fetch();
                
                if (!$user) {
                    sendError('User not found', 404);
                }
                
                sendResponse($user);
            } else {
                $stmt = $pdo->query("SELECT id, username, name, email, role, active, created_at FROM users ORDER BY name");
                $users = $stmt->fetchAll();
                sendResponse($users);
            }
            break;
            
        case 'POST':
            $data = getRequestData();
            
            $requiredFields = ['username', 'password', 'name', 'email', 'role'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field])) {
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
            
            sendResponse($user, 201);
            break;
            
        case 'PUT':
            if (!$userId) {
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
                sendError('No fields to update', 400);
            }
            
            $updateValues[] = $userId;
            
            $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($updateValues);
            
            $stmt = $pdo->prepare("SELECT id, username, name, email, role, active, created_at FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();
            
            sendResponse($user);
            break;
            
        case 'DELETE':
            if (!$userId) {
                sendError('User ID required', 400);
            }
            
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            
            sendResponse(['success' => true]);
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    sendError($e->getMessage());
}
?>