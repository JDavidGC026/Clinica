<?php
require_once 'public/api/config.php';

echo "=== IMPLEMENTACIÓN DE SISTEMA DE ROLES AVANZADO ===\n";
echo "Fecha: " . date('Y-m-d H:i:s') . "\n\n";

try {
    $pdo = getDatabase();
    
    // 1. CREAR TABLA DE ROLES
    echo "1. CREANDO TABLAS DEL SISTEMA DE ROLES:\n";
    echo "---------------------------------------\n";
    
    // Tabla de roles
    $createRolesTable = "
        CREATE TABLE IF NOT EXISTS roles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            description TEXT,
            active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_name (name),
            INDEX idx_active (active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    $pdo->exec($createRolesTable);
    echo "  ✓ Tabla 'roles' creada\n";
    
    // Tabla de permisos por rol
    $createRolePermissionsTable = "
        CREATE TABLE IF NOT EXISTS role_permissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            role_id INT NOT NULL,
            module VARCHAR(50) NOT NULL,
            permission ENUM('read', 'write', 'admin') NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
            UNIQUE KEY unique_role_module (role_id, module),
            INDEX idx_role_id (role_id),
            INDEX idx_module (module)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    $pdo->exec($createRolePermissionsTable);
    echo "  ✓ Tabla 'role_permissions' creada\n";
    
    // Agregar columna role_id a usuarios si no existe
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'role_id'");
    $hasRoleId = $stmt->fetch() !== false;
    
    if (!$hasRoleId) {
        $pdo->exec("ALTER TABLE users ADD COLUMN role_id INT AFTER role");
        $pdo->exec("ALTER TABLE users ADD FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL");
        $pdo->exec("ALTER TABLE users ADD INDEX idx_role_id (role_id)");
        echo "  ✓ Campo 'role_id' agregado a tabla users\n";
    }
    
    // 2. CREAR ROLES PREDEFINIDOS
    echo "\n2. CREANDO ROLES PREDEFINIDOS:\n";
    echo "------------------------------\n";
    
    $defaultRoles = [
        [
            'name' => 'Super Administrador',
            'description' => 'Acceso completo a todo el sistema, incluyendo configuración y gestión de usuarios'
        ],
        [
            'name' => 'Supervisor',
            'description' => 'Acceso completo excepto configuración del sistema'
        ],
        [
            'name' => 'Gerente',
            'description' => 'Gestión operativa general, reportes y supervisión'
        ],
        [
            'name' => 'Médicos Externos',
            'description' => 'Acceso limitado para profesionales externos'
        ],
        [
            'name' => 'Recepcionista',
            'description' => 'Manejo de pacientes, citas y información básica'
        ],
        [
            'name' => 'Asistente Médico',
            'description' => 'Apoyo en consultas y manejo de historiales'
        ]
    ];
    
    foreach ($defaultRoles as $role) {
        $stmt = $pdo->prepare("INSERT IGNORE INTO roles (name, description) VALUES (?, ?)");
        $stmt->execute([$role['name'], $role['description']]);
        echo "  ✓ Rol creado: {$role['name']}\n";
    }
    
    // 3. DEFINIR PERMISOS POR ROL
    echo "\n3. CONFIGURANDO PERMISOS POR ROL:\n";
    echo "---------------------------------\n";
    
    // Obtener IDs de roles
    $roleIds = [];
    $stmt = $pdo->query("SELECT id, name FROM roles");
    while ($role = $stmt->fetch()) {
        $roleIds[$role['name']] = $role['id'];
    }
    
    $rolePermissions = [
        'Super Administrador' => [
            ['patients', 'admin'],
            ['professionals', 'admin'],
            ['appointments', 'admin'],
            ['disciplines', 'admin'],
            ['users', 'admin'],
            ['settings', 'admin'],
            ['reports', 'admin'],
            ['roles', 'admin']
        ],
        'Supervisor' => [
            ['patients', 'admin'],
            ['professionals', 'admin'],
            ['appointments', 'admin'],
            ['disciplines', 'admin'],
            ['users', 'write'],
            ['settings', 'read'],
            ['reports', 'admin'],
            ['roles', 'read']
        ],
        'Gerente' => [
            ['patients', 'write'],
            ['professionals', 'write'],
            ['appointments', 'write'],
            ['disciplines', 'write'],
            ['users', 'read'],
            ['settings', 'read'],
            ['reports', 'admin'],
            ['roles', 'read']
        ],
        'Médicos Externos' => [
            ['patients', 'read'],
            ['appointments', 'write'],
            ['professionals', 'read'],
            ['disciplines', 'read'],
            ['reports', 'read']
        ],
        'Recepcionista' => [
            ['patients', 'write'],
            ['appointments', 'write'],
            ['professionals', 'read'],
            ['disciplines', 'read']
        ],
        'Asistente Médico' => [
            ['patients', 'write'],
            ['appointments', 'read'],
            ['professionals', 'read'],
            ['disciplines', 'read'],
            ['reports', 'read']
        ]
    ];
    
    foreach ($rolePermissions as $roleName => $permissions) {
        if (!isset($roleIds[$roleName])) continue;
        
        $roleId = $roleIds[$roleName];
        echo "  Configurando permisos para: $roleName\n";
        
        foreach ($permissions as $perm) {
            $stmt = $pdo->prepare("
                INSERT INTO role_permissions (role_id, module, permission) 
                VALUES (?, ?, ?) 
                ON DUPLICATE KEY UPDATE permission = VALUES(permission)
            ");
            $stmt->execute([$roleId, $perm[0], $perm[1]]);
            echo "    - {$perm[0]}: {$perm[1]}\n";
        }
    }
    
    // 4. ACTUALIZAR USUARIOS EXISTENTES CON ROLES
    echo "\n4. ASIGNANDO ROLES A USUARIOS EXISTENTES:\n";
    echo "----------------------------------------\n";
    
    $userRoleAssignments = [
        'admin' => 'Super Administrador',
        'gerente' => 'Gerente',
        'profesional1' => 'Médicos Externos',
        'recepcion' => 'Recepcionista'
    ];
    
    foreach ($userRoleAssignments as $username => $roleName) {
        if (isset($roleIds[$roleName])) {
            $stmt = $pdo->prepare("UPDATE users SET role_id = ? WHERE username = ?");
            $stmt->execute([$roleIds[$roleName], $username]);
            echo "  ✓ Usuario '$username' asignado al rol '$roleName'\n";
        }
    }
    
    // 5. MIGRAR PERMISOS EXISTENTES (OPCIONAL)
    echo "\n5. LIMPIANDO PERMISOS INDIVIDUALES OBSOLETOS:\n";
    echo "--------------------------------------------\n";
    
    // Ahora que tenemos roles, podemos limpiar los permisos individuales
    // ya que se basarán en el rol asignado
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM user_permissions");
    $oldPermissions = $stmt->fetch()['count'];
    
    if ($oldPermissions > 0) {
        echo "  Se encontraron $oldPermissions permisos individuales antiguos\n";
        echo "  Estos permanecerán como override de roles si es necesario\n";
        echo "  Para limpiarlos completamente, elimina la tabla user_permissions\n";
    }
    
    echo "\n=== SISTEMA DE ROLES IMPLEMENTADO ===\n";
    echo "✅ Tablas creadas: roles, role_permissions\n";
    echo "✅ " . count($defaultRoles) . " roles predefinidos creados\n";
    echo "✅ Permisos configurados por rol\n";
    echo "✅ Usuarios existentes migrados\n";
    
    echo "\nRoles disponibles:\n";
    foreach ($defaultRoles as $role) {
        echo "  - {$role['name']}: {$role['description']}\n";
    }
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
?>
