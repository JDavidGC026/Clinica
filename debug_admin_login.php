<?php
require_once 'public/api/config.php';

echo "=== DIAGNÓSTICO DEL LOGIN DEL ADMIN ===\n";
echo "Fecha: " . date('Y-m-d H:i:s') . "\n\n";

try {
    $pdo = getDatabase();
    
    // 1. VERIFICAR DATOS DEL USUARIO ADMIN
    echo "1. DATOS DEL USUARIO ADMIN:\n";
    echo "---------------------------\n";
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = 'admin'");
    $stmt->execute();
    $admin = $stmt->fetch();
    
    if ($admin) {
        echo "  ✓ Usuario admin encontrado:\n";
        echo "    - ID: {$admin['id']}\n";
        echo "    - Username: {$admin['username']}\n";
        echo "    - Name: {$admin['name']}\n";
        echo "    - Email: {$admin['email']}\n";
        echo "    - Role (texto): {$admin['role']}\n";
        echo "    - Role ID: " . ($admin['role_id'] ?? 'NULL') . "\n";
        echo "    - Active: {$admin['active']}\n";
    } else {
        echo "  ✗ Usuario admin NO encontrado\n";
        exit(1);
    }
    
    // 2. VERIFICAR CONTRASEÑA
    echo "\n2. VERIFICACIÓN DE CONTRASEÑA:\n";
    echo "------------------------------\n";
    
    if (password_verify('admin123', $admin['password_hash'])) {
        echo "  ✓ Contraseña 'admin123' es correcta\n";
    } else {
        echo "  ✗ Contraseña 'admin123' es INCORRECTA\n";
        echo "  Intentando actualizar contraseña...\n";
        
        $newHash = password_hash('admin123', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE username = 'admin'");
        $stmt->execute([$newHash]);
        echo "  ✓ Contraseña actualizada\n";
    }
    
    // 3. VERIFICAR ROL ASIGNADO
    echo "\n3. VERIFICACIÓN DEL ROL:\n";
    echo "------------------------\n";
    
    if ($admin['role_id']) {
        $stmt = $pdo->prepare("SELECT * FROM roles WHERE id = ?");
        $stmt->execute([$admin['role_id']]);
        $role = $stmt->fetch();
        
        if ($role) {
            echo "  ✓ Rol asignado: {$role['name']}\n";
            echo "    - Descripción: {$role['description']}\n";
            echo "    - Activo: " . ($role['active'] ? 'Sí' : 'No') . "\n";
        } else {
            echo "  ✗ Rol ID {$admin['role_id']} NO existe\n";
        }
    } else {
        echo "  ⚠ Usuario admin NO tiene role_id asignado\n";
        echo "  Asignando rol de Super Administrador...\n";
        
        $stmt = $pdo->prepare("SELECT id FROM roles WHERE name = 'Super Administrador'");
        $stmt->execute();
        $superAdminRole = $stmt->fetch();
        
        if ($superAdminRole) {
            $stmt = $pdo->prepare("UPDATE users SET role_id = ? WHERE username = 'admin'");
            $stmt->execute([$superAdminRole['id']]);
            echo "  ✓ Rol Super Administrador asignado (ID: {$superAdminRole['id']})\n";
            $admin['role_id'] = $superAdminRole['id'];
        } else {
            echo "  ✗ Rol Super Administrador no existe\n";
        }
    }
    
    // 4. VERIFICAR PERMISOS DEL ROL
    echo "\n4. PERMISOS DEL ROL:\n";
    echo "-------------------\n";
    
    if ($admin['role_id']) {
        $stmt = $pdo->prepare("SELECT module, permission FROM role_permissions WHERE role_id = ? ORDER BY module");
        $stmt->execute([$admin['role_id']]);
        $rolePermissions = $stmt->fetchAll();
        
        echo "  Permisos encontrados: " . count($rolePermissions) . "\n";
        foreach ($rolePermissions as $perm) {
            echo "    - {$perm['module']}: {$perm['permission']}\n";
        }
        
        if (count($rolePermissions) < 6) {
            echo "  ⚠ El rol tiene muy pocos permisos. Agregando permisos completos...\n";
            
            $adminPermissions = [
                ['patients', 'admin'],
                ['professionals', 'admin'],
                ['appointments', 'admin'],
                ['disciplines', 'admin'],
                ['users', 'admin'],
                ['settings', 'admin'],
                ['reports', 'admin'],
                ['roles', 'admin']
            ];
            
            // Eliminar permisos existentes
            $stmt = $pdo->prepare("DELETE FROM role_permissions WHERE role_id = ?");
            $stmt->execute([$admin['role_id']]);
            
            // Agregar todos los permisos
            foreach ($adminPermissions as $perm) {
                $stmt = $pdo->prepare("INSERT INTO role_permissions (role_id, module, permission) VALUES (?, ?, ?)");
                $stmt->execute([$admin['role_id'], $perm[0], $perm[1]]);
                echo "      + {$perm[0]}: {$perm[1]}\n";
            }
        }
    }
    
    // 5. VERIFICAR PERMISOS INDIVIDUALES
    echo "\n5. PERMISOS INDIVIDUALES:\n";
    echo "-------------------------\n";
    
    $stmt = $pdo->prepare("SELECT module, permission FROM user_permissions WHERE user_id = ? ORDER BY module");
    $stmt->execute([$admin['id']]);
    $individualPermissions = $stmt->fetchAll();
    
    if (count($individualPermissions) > 0) {
        echo "  Permisos individuales encontrados: " . count($individualPermissions) . "\n";
        foreach ($individualPermissions as $perm) {
            echo "    - {$perm['module']}: {$perm['permission']}\n";
        }
    } else {
        echo "  No hay permisos individuales (esto es normal para roles)\n";
    }
    
    // 6. SIMULAR LOGIN COMPLETO
    echo "\n6. SIMULACIÓN DE LOGIN:\n";
    echo "----------------------\n";
    
    // Recargar datos del admin después de las correcciones
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = 'admin'");
    $stmt->execute();
    $admin = $stmt->fetch();
    
    if ($admin && password_verify('admin123', $admin['password_hash'])) {
        // Obtener información del rol
        $roleName = $admin['role'];
        $roleInfo = null;
        
        if ($admin['role_id']) {
            $stmt = $pdo->prepare("SELECT name, description FROM roles WHERE id = ? AND active = 1");
            $stmt->execute([$admin['role_id']]);
            $roleInfo = $stmt->fetch();
            if ($roleInfo) {
                $roleName = $roleInfo['name'];
            }
        }
        
        // Obtener permisos efectivos
        $permissions = [];
        
        // Permisos del rol
        if ($admin['role_id']) {
            $stmt = $pdo->prepare("
                SELECT rp.module, rp.permission
                FROM roles r
                INNER JOIN role_permissions rp ON r.id = rp.role_id
                WHERE r.id = ? AND r.active = 1
            ");
            $stmt->execute([$admin['role_id']]);
            $rolePermissions = $stmt->fetchAll();
            
            foreach ($rolePermissions as $perm) {
                $permissions[$perm['module']] = $perm['permission'];
            }
        }
        
        // Permisos individuales (override)
        $stmt = $pdo->prepare("SELECT module, permission FROM user_permissions WHERE user_id = ?");
        $stmt->execute([$admin['id']]);
        $individualPermissions = $stmt->fetchAll();
        
        foreach ($individualPermissions as $perm) {
            $permissions[$perm['module']] = $perm['permission'];
        }
        
        echo "  ✓ Login simulado exitoso\n";
        echo "  ✓ Rol: $roleName\n";
        echo "  ✓ Permisos efectivos: " . count($permissions) . " módulos\n";
        
        echo "\n  RESPUESTA DEL LOGIN (JSON):\n";
        $response = [
            'success' => true,
            'user' => [
                'id' => $admin['id'],
                'username' => $admin['username'],
                'name' => $admin['name'],
                'email' => $admin['email'],
                'role' => $roleName,
                'role_id' => $admin['role_id'],
                'role_description' => $roleInfo ? $roleInfo['description'] : null,
                'type' => 'user',
                'permissions' => $permissions
            ],
            'message' => 'Login exitoso'
        ];
        
        echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
        
        if (count($permissions) >= 7) {
            echo "\n  ✅ ADMIN CONFIGURADO CORRECTAMENTE - Tiene todos los permisos\n";
        } else {
            echo "\n  ⚠ PROBLEMA: Admin tiene pocos permisos (" . count($permissions) . ")\n";
        }
        
    } else {
        echo "  ✗ LOGIN SIMULADO FALLÓ\n";
    }
    
    echo "\n=== RESUMEN ===\n";
    echo "Credenciales: admin / admin123\n";
    echo "Estado: " . (count($permissions ?? []) >= 7 ? "✅ LISTO" : "⚠ NECESITA CORRECCIÓN") . "\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
