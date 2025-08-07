<?php
require_once 'config.php';

try {
    $pdo = getDatabase();
    
    // Crear tabla role_categories
    $createRoleCategoriesTable = "
    CREATE TABLE IF NOT EXISTS role_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        color VARCHAR(7) DEFAULT '#3b82f6',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    
    $pdo->exec($createRoleCategoriesTable);
    
    // Verificar si la tabla roles existe, si no crearla
    $createRolesTable = "
    CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        category_id INT NULL,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_active (active),
        FOREIGN KEY (category_id) REFERENCES role_categories(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    
    $pdo->exec($createRolesTable);
    
    // Agregar columna category_id a roles si no existe
    try {
        $pdo->exec("ALTER TABLE roles ADD COLUMN category_id INT NULL AFTER description");
        $pdo->exec("ALTER TABLE roles ADD FOREIGN KEY (category_id) REFERENCES role_categories(id) ON DELETE SET NULL");
    } catch (Exception $e) {
        // La columna ya existe o hay otro error, continuamos
    }
    
    // Crear tabla role_permissions
    $createRolePermissionsTable = "
    CREATE TABLE IF NOT EXISTS role_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_id INT NOT NULL,
        module VARCHAR(50) NOT NULL,
        permission ENUM('read', 'write', 'admin') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_role_module (role_id, module),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        INDEX idx_role_id (role_id),
        INDEX idx_module (module)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    
    $pdo->exec($createRolePermissionsTable);
    
    // Verificar si la tabla users existe y agregar columnas si es necesario
    $checkUsersTable = "
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(100) DEFAULT 'Recepcionista',
        role_id INT NULL,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_active (active),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    
    $pdo->exec($checkUsersTable);
    
    // Agregar columna role_id a users si no existe
    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN role_id INT NULL AFTER role");
        $pdo->exec("ALTER TABLE users ADD FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL");
    } catch (Exception $e) {
        // La columna ya existe o hay otro error, continuamos
    }
    
    // Crear tabla user_permissions para permisos individuales
    $createUserPermissionsTable = "
    CREATE TABLE IF NOT EXISTS user_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        module VARCHAR(50) NOT NULL,
        permission ENUM('read', 'write', 'admin') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_module (user_id, module),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_module (module)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    
    $pdo->exec($createUserPermissionsTable);
    
    // Insertar categorías de roles por defecto
    $defaultCategories = [
        ['Administración', 'Roles administrativos y de gestión', '#ef4444'],
        ['Médicos', 'Roles para profesionales de la salud', '#10b981'],
        ['Soporte', 'Roles de apoyo y recepción', '#3b82f6'],
        ['Especialistas', 'Roles especializados', '#8b5cf6']
    ];
    
    foreach ($defaultCategories as $category) {
        $stmt = $pdo->prepare("
            INSERT IGNORE INTO role_categories (name, description, color) 
            VALUES (?, ?, ?)
        ");
        $stmt->execute($category);
    }
    
    // Insertar roles por defecto si no existen
    $defaultRoles = [
        ['Super Administrador', 'Control total del sistema', 1],
        ['Supervisor', 'Supervisión general y reportes', 1],
        ['Administrador', 'Gestión administrativa', 1],
        ['Gerente', 'Gestión operativa', 1],
        ['Médicos Externos', 'Profesionales médicos externos', 2],
        ['Profesional', 'Profesionales de la salud', 2],
        ['Recepcionista', 'Atención al cliente y citas', 3],
        ['Asistente Médico', 'Apoyo a profesionales médicos', 4]
    ];
    
    foreach ($defaultRoles as $role) {
        $stmt = $pdo->prepare("
            INSERT IGNORE INTO roles (name, description, category_id) 
            VALUES (?, ?, ?)
        ");
        $stmt->execute($role);
    }
    
    // Configurar permisos por defecto para cada rol
    $rolePermissions = [
        'Super Administrador' => [
            'dashboard' => 'admin',
            'appointments' => 'admin',
            'patients' => 'admin',
            'professionals' => 'admin',
            'disciplines' => 'admin',
            'users' => 'admin',
            'roles' => 'admin',
            'finances' => 'admin',
            'reports' => 'admin',
            'settings' => 'admin',
            'emails' => 'admin',
            'calendar' => 'admin',
            'professional-portal' => 'admin',
            'api-logs' => 'admin'
        ],
        'Supervisor' => [
            'dashboard' => 'admin',
            'appointments' => 'admin',
            'patients' => 'admin',
            'professionals' => 'admin',
            'disciplines' => 'admin',
            'users' => 'write',
            'roles' => 'write',
            'finances' => 'admin',
            'reports' => 'admin',
            'settings' => 'write',
            'emails' => 'admin',
            'calendar' => 'admin',
            'professional-portal' => 'admin',
            'api-logs' => 'read'
        ],
        'Administrador' => [
            'dashboard' => 'write',
            'appointments' => 'write',
            'patients' => 'write',
            'professionals' => 'write',
            'disciplines' => 'write',
            'users' => 'write',
            'roles' => 'read',
            'finances' => 'write',
            'reports' => 'write',
            'settings' => 'write',
            'emails' => 'write',
            'calendar' => 'write',
            'professional-portal' => 'write'
        ],
        'Gerente' => [
            'dashboard' => 'write',
            'appointments' => 'write',
            'patients' => 'write',
            'professionals' => 'read',
            'disciplines' => 'read',
            'finances' => 'read',
            'reports' => 'read',
            'emails' => 'read',
            'calendar' => 'write',
            'professional-portal' => 'read'
        ],
        'Profesional' => [
            'dashboard' => 'read',
            'appointments' => 'write',
            'patients' => 'write',
            'professional-portal' => 'write',
            'calendar' => 'read',
            'emails' => 'read',
            'reports' => 'read'
        ],
        'Recepcionista' => [
            'dashboard' => 'read',
            'appointments' => 'write',
            'patients' => 'write',
            'calendar' => 'read',
            'emails' => 'read',
            'reports' => 'read'
        ]
    ];
    
    foreach ($rolePermissions as $roleName => $permissions) {
        // Obtener el ID del rol
        $stmt = $pdo->prepare("SELECT id FROM roles WHERE name = ?");
        $stmt->execute([$roleName]);
        $roleId = $stmt->fetchColumn();
        
        if ($roleId) {
            foreach ($permissions as $module => $permission) {
                $stmt = $pdo->prepare("
                    INSERT IGNORE INTO role_permissions (role_id, module, permission) 
                    VALUES (?, ?, ?)
                ");
                $stmt->execute([$roleId, $module, $permission]);
            }
        }
    }
    
    logApiActivity('setup-roles', 'POST', 200, "Roles system initialized successfully");
    sendResponse([
        'success' => true,
        'message' => 'Sistema de roles inicializado correctamente',
        'tables_created' => [
            'role_categories',
            'roles', 
            'role_permissions',
            'user_permissions'
        ],
        'categories_created' => count($defaultCategories),
        'roles_created' => count($defaultRoles)
    ]);
    
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollback();
    }
    logApiActivity('setup-roles', 'POST', 500, "Error: " . $e->getMessage());
    sendError('Error inicializando sistema de roles: ' . $e->getMessage());
}
?>
