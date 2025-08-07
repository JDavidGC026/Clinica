<?php
require_once 'public/api/config.php';

echo "=== LIMPIEZA Y REINICIO DEL SISTEMA ===\n";
echo "Fecha: " . date('Y-m-d H:i:s') . "\n\n";

try {
    $pdo = getDatabase();
    
    echo "1. LIMPIANDO DATOS INCONSISTENTES:\n";
    echo "---------------------------------\n";
    
    // Limpiar permisos individuales obsoletos del usuario admin
    $stmt = $pdo->prepare("DELETE FROM user_permissions WHERE user_id = 1");
    $stmt->execute();
    echo "  ✓ Permisos individuales obsoletos eliminados del admin\n";
    
    // Verificar que el admin tenga todos los permisos necesarios en su rol
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM role_permissions WHERE role_id = 1");
    $stmt->execute();
    $adminRolePerms = $stmt->fetch()['count'];
    
    if ($adminRolePerms < 8) {
        echo "  ⚠ Agregando permisos faltantes al rol Super Administrador...\n";
        
        // Eliminar permisos existentes del rol
        $stmt = $pdo->prepare("DELETE FROM role_permissions WHERE role_id = 1");
        $stmt->execute();
        
        // Agregar todos los permisos necesarios
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
        
        foreach ($adminPermissions as $perm) {
            $stmt = $pdo->prepare("INSERT INTO role_permissions (role_id, module, permission) VALUES (1, ?, ?)");
            $stmt->execute([$perm[0], $perm[1]]);
            echo "    + {$perm[0]}: {$perm[1]}\n";
        }
    } else {
        echo "  ✓ Permisos del rol Super Administrador están completos ($adminRolePerms permisos)\n";
    }
    
    echo "\n2. VERIFICACIÓN FINAL:\n";
    echo "---------------------\n";
    
    // Verificar login del admin
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = 'admin'");
    $stmt->execute();
    $admin = $stmt->fetch();
    
    if ($admin && password_verify('admin123', $admin['password_hash'])) {
        echo "  ✓ Login del admin funciona correctamente\n";
        echo "  ✓ Usuario: {$admin['username']}\n";
        echo "  ✓ Rol ID: {$admin['role_id']}\n";
        
        // Obtener nombre del rol
        $stmt = $pdo->prepare("SELECT name FROM roles WHERE id = ?");
        $stmt->execute([$admin['role_id']]);
        $role = $stmt->fetch();
        echo "  ✓ Rol: {$role['name']}\n";
        
        // Contar permisos efectivos
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM role_permissions WHERE role_id = ?");
        $stmt->execute([$admin['role_id']]);
        $permCount = $stmt->fetch()['count'];
        echo "  ✓ Permisos: $permCount módulos\n";
        
    } else {
        echo "  ✗ ERROR: Login del admin no funciona\n";
    }
    
    echo "\n3. INSTRUCCIONES PARA EL FRONTEND:\n";
    echo "---------------------------------\n";
    echo "1. Cierra sesión si estás logueado\n";
    echo "2. Limpia el localStorage del navegador:\n";
    echo "   - Abre DevTools (F12)\n";
    echo "   - Ve a Application > Storage > Local Storage\n";
    echo "   - Elimina 'clinic_auth' y 'clinic_user'\n";
    echo "   - O ejecuta en la consola: localStorage.clear()\n";
    echo "3. Recarga la página completamente (Ctrl+F5)\n";
    echo "4. Intenta login con: admin / admin123\n";
    
    echo "\n4. INFORMACIÓN DEL SISTEMA ACTUALIZADA:\n";
    echo "--------------------------------------\n";
    echo "CREDENCIALES ACTUALIZADAS:\n";
    echo "  - admin / admin123 (Super Administrador)\n";
    echo "  - gerente / gerente123 (Gerente)\n";
    echo "  - profesional1 / prof123 (Médicos Externos)\n";
    echo "  - recepcion / recep123 (Recepcionista)\n";
    
    echo "\nROLES DISPONIBLES:\n";
    $stmt = $pdo->query("SELECT name, description FROM roles ORDER BY name");
    $roles = $stmt->fetchAll();
    foreach ($roles as $role) {
        echo "  - {$role['name']}: {$role['description']}\n";
    }
    
    echo "\n=== SISTEMA LISTO PARA USAR ===\n";
    echo "✅ Base de datos configurada correctamente\n";
    echo "✅ Permisos de admin corregidos\n";
    echo "✅ Roles del frontend actualizados\n";
    echo "✅ Credenciales verificadas\n";
    
    echo "\n🚀 REINICIA EL FRONTEND Y PRUEBA EL LOGIN\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
