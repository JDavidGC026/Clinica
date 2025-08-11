<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$roleId = $_GET['id'] ?? null;

try {
    $pdo = getDatabase();
    
    switch ($method) {
        case 'GET':
            if ($roleId) {
                // Obtener un rol específico con sus permisos
                $stmt = $pdo->prepare("SELECT * FROM roles WHERE id = ?");
                $stmt->execute([$roleId]);
                $role = $stmt->fetch();
                
                if (!$role) {
                    logApiActivity('roles', 'GET', 404, "Role not found: ID $roleId");
                    sendError('Role not found', 404);
                }
                
                // Obtener permisos del rol
                $stmt = $pdo->prepare("SELECT module, permission FROM role_permissions WHERE role_id = ?");
                $stmt->execute([$roleId]);
                $permissions = $stmt->fetchAll();
                
                $rolePermissions = [];
                foreach ($permissions as $perm) {
                    $rolePermissions[$perm['module']] = $perm['permission'];
                }
                
                $role['permissions'] = $rolePermissions;
                
                logApiActivity('roles', 'GET', 200, "Retrieved role: ID $roleId");
                sendResponse($role);
            } else {
                // Obtener todos los roles
                $includePermissions = isset($_GET['include_permissions']) && $_GET['include_permissions'] === '1';
                $includeCategories = isset($_GET['include_categories']) && $_GET['include_categories'] === '1';
                
                if ($includeCategories) {
                    $stmt = $pdo->query("
                        SELECT r.*, 
                               rc.name as category_name, 
                               rc.color as category_color,
                               rc.description as category_description
                        FROM roles r 
                        LEFT JOIN role_categories rc ON r.category_id = rc.id 
                        ORDER BY rc.name, r.name
                    ");
                } else {
                    $stmt = $pdo->query("SELECT * FROM roles ORDER BY name");
                }
                
                $roles = $stmt->fetchAll();
                
                if ($includePermissions) {
                    foreach ($roles as &$role) {
                        $stmt = $pdo->prepare("SELECT module, permission FROM role_permissions WHERE role_id = ?");
                        $stmt->execute([$role['id']]);
                        $permissions = $stmt->fetchAll();
                        
                        $rolePermissions = [];
                        foreach ($permissions as $perm) {
                            $rolePermissions[$perm['module']] = $perm['permission'];
                        }
                        $role['permissions'] = $rolePermissions;
                    }
                }
                
                if ($includeCategories) {
                    foreach ($roles as &$role) {
                        if ($role['category_id']) {
                            $role['category'] = [
                                'id' => $role['category_id'],
                                'name' => $role['category_name'],
                                'color' => $role['category_color'],
                                'description' => $role['category_description']
                            ];
                        } else {
                            $role['category'] = null;
                        }
                        // Limpiar campos duplicados
                        unset($role['category_name'], $role['category_color'], $role['category_description']);
                    }
                }
                
                logApiActivity('roles', 'GET', 200, "Retrieved all roles: " . count($roles) . " records");
                sendResponse($roles);
            }
            break;
            
        case 'POST':
            $data = getRequestData();
            
            if (!isset($data['name'])) {
                logApiActivity('roles', 'POST', 400, "Missing required field: name");
                sendError('Missing required field: name', 400);
            }
            
            // Crear el rol
            $description = $data['description'] ?? null;
            $categoryId = $data['category_id'] ?? null;
            $active = isset($data['active']) ? (int)$data['active'] : 1;
            
            $stmt = $pdo->prepare("INSERT INTO roles (name, description, category_id, active) VALUES (?, ?, ?, ?)");
            $stmt->execute([$data['name'], $description, $categoryId, $active]);
            $newRoleId = $pdo->lastInsertId();
            
            // Agregar permisos si se especificaron - VERSIÓN CORREGIDA
            if (isset($data['permissions'])) {
                $permissions = $data['permissions'];
                
                // Si es un string JSON, decodificarlo
                if (is_string($permissions)) {
                    $permissions = json_decode($permissions, true);
                }
                
                if (is_array($permissions)) {
                    foreach ($permissions as $module => $permission) {
                        // Si es un array simple con nombres de permisos (índices numéricos)
                        if (is_numeric($module)) {
                            $module = $permission;
                            $permission = 'write'; // permiso por defecto
                        }
                        
                        if (in_array($permission, ['read', 'write', 'admin'])) {
                            $stmt = $pdo->prepare("INSERT INTO role_permissions (role_id, module, permission) VALUES (?, ?, ?)");
                            $stmt->execute([$newRoleId, $module, $permission]);
                        }
                    }
                }
            }
            
            // Obtener el rol creado con sus permisos
            $stmt = $pdo->prepare("SELECT * FROM roles WHERE id = ?");
            $stmt->execute([$newRoleId]);
            $role = $stmt->fetch();
            
            $stmt = $pdo->prepare("SELECT module, permission FROM role_permissions WHERE role_id = ?");
            $stmt->execute([$newRoleId]);
            $permissions = $stmt->fetchAll();
            
            $rolePermissions = [];
            foreach ($permissions as $perm) {
                $rolePermissions[$perm['module']] = $perm['permission'];
            }
            $role['permissions'] = $rolePermissions;
            
            logApiActivity('roles', 'POST', 201, "Created role: " . $data['name']);
            sendResponse($role, 201);
            break;
            
        case 'PUT':
            if (!$roleId) {
                logApiActivity('roles', 'PUT', 400, "Role ID required");
                sendError('Role ID required', 400);
            }
            
            $data = getRequestData();
            
            // Verificar que el rol existe
            $stmt = $pdo->prepare("SELECT * FROM roles WHERE id = ?");
            $stmt->execute([$roleId]);
            $existingRole = $stmt->fetch();
            
            if (!$existingRole) {
                logApiActivity('roles', 'PUT', 404, "Role not found: ID $roleId");
                sendError('Role not found', 404);
            }
            
            // Actualizar información básica del rol
            $updateFields = [];
            $updateValues = [];
            
            if (isset($data['name'])) {
                $updateFields[] = 'name = ?';
                $updateValues[] = $data['name'];
            }
            
            if (isset($data['description'])) {
                $updateFields[] = 'description = ?';
                $updateValues[] = $data['description'];
            }
            
            if (isset($data['active'])) {
                $updateFields[] = 'active = ?';
                $updateValues[] = (int)$data['active'];
            }
            
            if (isset($data['category_id'])) {
                $updateFields[] = 'category_id = ?';
                $updateValues[] = $data['category_id'];
            }
            
            if (!empty($updateFields)) {
                $updateValues[] = $roleId;
                $sql = "UPDATE roles SET " . implode(', ', $updateFields) . " WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($updateValues);
            }
            
            // Actualizar permisos si se especificaron - VERSIÓN CORREGIDA
            if (isset($data['permissions'])) {
                $permissions = $data['permissions'];
                
                // Si es un string JSON, decodificarlo
                if (is_string($permissions)) {
                    $permissions = json_decode($permissions, true);
                }
                
                if (is_array($permissions)) {
                    // Eliminar permisos existentes
                    $stmt = $pdo->prepare("DELETE FROM role_permissions WHERE role_id = ?");
                    $stmt->execute([$roleId]);
                    
                    // Agregar nuevos permisos
                    foreach ($permissions as $module => $permission) {
                        // Si es un array simple con nombres de permisos (índices numéricos)
                        if (is_numeric($module)) {
                            $module = $permission;
                            $permission = 'write'; // permiso por defecto
                        }
                        
                        if (in_array($permission, ['read', 'write', 'admin'])) {
                            $stmt = $pdo->prepare("INSERT INTO role_permissions (role_id, module, permission) VALUES (?, ?, ?)");
                            $stmt->execute([$roleId, $module, $permission]);
                        }
                    }
                }
            }
            
            // Obtener el rol actualizado
            $stmt = $pdo->prepare("SELECT * FROM roles WHERE id = ?");
            $stmt->execute([$roleId]);
            $role = $stmt->fetch();
            
            $stmt = $pdo->prepare("SELECT module, permission FROM role_permissions WHERE role_id = ?");
            $stmt->execute([$roleId]);
            $permissions = $stmt->fetchAll();
            
            $rolePermissions = [];
            foreach ($permissions as $perm) {
                $rolePermissions[$perm['module']] = $perm['permission'];
            }
            $role['permissions'] = $rolePermissions;
            
            logApiActivity('roles', 'PUT', 200, "Updated role: ID $roleId");
            sendResponse($role);
            break;
            
        case 'DELETE':
            if (!$roleId) {
                logApiActivity('roles', 'DELETE', 400, "Role ID required");
                sendError('Role ID required', 400);
            }
            
            // Verificar si el rol está en uso
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM users WHERE role_id = ?");
            $stmt->execute([$roleId]);
            $usersWithRole = $stmt->fetch()['count'];
            
            if ($usersWithRole > 0) {
                logApiActivity('roles', 'DELETE', 400, "Cannot delete role: in use by $usersWithRole users");
                sendError("Cannot delete role: it is assigned to $usersWithRole user(s)", 400);
            }
            
            // Eliminar el rol (los permisos se eliminan automáticamente por CASCADE)
            $stmt = $pdo->prepare("DELETE FROM roles WHERE id = ?");
            $result = $stmt->execute([$roleId]);
            
            if ($stmt->rowCount() > 0) {
                logApiActivity('roles', 'DELETE', 200, "Deleted role: ID $roleId");
                sendResponse(['success' => true, 'message' => 'Role deleted successfully']);
            } else {
                logApiActivity('roles', 'DELETE', 404, "Role not found: ID $roleId");
                sendError('Role not found', 404);
            }
            break;
            
        default:
            logApiActivity('roles', $method, 405, "Method not allowed");
            sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    logApiActivity('roles', $method, 500, "Error: " . $e->getMessage());
    sendError($e->getMessage());
}

// Función auxiliar para obtener permisos efectivos de un usuario (combinando rol y permisos individuales)
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
