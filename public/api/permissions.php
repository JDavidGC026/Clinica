<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = getDatabase();
    
    switch ($method) {
        case 'GET':
            $userId = $_GET['user_id'] ?? null;
            
            if ($userId) {
                // Obtener permisos de un usuario específico
                $stmt = $pdo->prepare("
                    SELECT up.*, u.username, u.name 
                    FROM user_permissions up
                    INNER JOIN users u ON up.user_id = u.id
                    WHERE up.user_id = ?
                    ORDER BY up.module
                ");
                $stmt->execute([$userId]);
                $permissions = $stmt->fetchAll();
                
                logApiActivity('permissions', 'GET', 200, "Retrieved permissions for user ID: $userId");
                sendResponse($permissions);
            } else {
                // Obtener todos los permisos con información de usuario
                $stmt = $pdo->query("
                    SELECT up.*, u.username, u.name as user_name
                    FROM user_permissions up
                    INNER JOIN users u ON up.user_id = u.id
                    ORDER BY u.username, up.module
                ");
                $permissions = $stmt->fetchAll();
                
                logApiActivity('permissions', 'GET', 200, "Retrieved all permissions: " . count($permissions) . " records");
                sendResponse($permissions);
            }
            break;
            
        case 'POST':
            $data = getRequestData();
            
            if (!isset($data['user_id']) || !isset($data['module']) || !isset($data['permission'])) {
                logApiActivity('permissions', 'POST', 400, "Missing required fields");
                sendError('Missing required fields: user_id, module, permission', 400);
            }
            
            // Verificar que el usuario existe
            $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ? AND active = 1");
            $stmt->execute([$data['user_id']]);
            if (!$stmt->fetch()) {
                logApiActivity('permissions', 'POST', 404, "User not found: ID " . $data['user_id']);
                sendError('User not found or inactive', 404);
            }
            
            // Insertar o actualizar permiso
            $stmt = $pdo->prepare("
                INSERT INTO user_permissions (user_id, module, permission) 
                VALUES (?, ?, ?) 
                ON DUPLICATE KEY UPDATE permission = VALUES(permission)
            ");
            $stmt->execute([$data['user_id'], $data['module'], $data['permission']]);
            
            // Obtener el permiso creado/actualizado
            $stmt = $pdo->prepare("
                SELECT up.*, u.username, u.name as user_name
                FROM user_permissions up
                INNER JOIN users u ON up.user_id = u.id
                WHERE up.user_id = ? AND up.module = ?
            ");
            $stmt->execute([$data['user_id'], $data['module']]);
            $permission = $stmt->fetch();
            
            logApiActivity('permissions', 'POST', 201, "Created/updated permission for user: " . $data['user_id'] . ", module: " . $data['module']);
            sendResponse($permission, 201);
            break;
            
        case 'DELETE':
            $userId = $_GET['user_id'] ?? null;
            $module = $_GET['module'] ?? null;
            
            if (!$userId || !$module) {
                logApiActivity('permissions', 'DELETE', 400, "Missing user_id and module parameters");
                sendError('Missing required parameters: user_id and module', 400);
            }
            
            $stmt = $pdo->prepare("DELETE FROM user_permissions WHERE user_id = ? AND module = ?");
            $result = $stmt->execute([$userId, $module]);
            
            if ($stmt->rowCount() > 0) {
                logApiActivity('permissions', 'DELETE', 200, "Deleted permission for user: $userId, module: $module");
                sendResponse(['success' => true, 'message' => 'Permission deleted']);
            } else {
                logApiActivity('permissions', 'DELETE', 404, "Permission not found for user: $userId, module: $module");
                sendError('Permission not found', 404);
            }
            break;
            
        default:
            logApiActivity('permissions', $method, 405, "Method not allowed");
            sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    logApiActivity('permissions', $method, 500, "Error: " . $e->getMessage());
    sendError($e->getMessage());
}

// Función auxiliar para verificar permisos (puede ser usada por otras APIs)
function checkUserPermission($pdo, $userId, $module, $requiredPermission = 'read') {
    $stmt = $pdo->prepare("SELECT permission FROM user_permissions WHERE user_id = ? AND module = ?");
    $stmt->execute([$userId, $module]);
    $permission = $stmt->fetch();
    
    if (!$permission) {
        return false;
    }
    
    $permissionLevels = ['read' => 1, 'write' => 2, 'admin' => 3];
    $userLevel = $permissionLevels[$permission['permission']] ?? 0;
    $requiredLevel = $permissionLevels[$requiredPermission] ?? 0;
    
    return $userLevel >= $requiredLevel;
}
?>
