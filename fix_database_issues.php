<?php
require_once 'public/api/config.php';

echo "=== DIAGNÓSTICO Y REPARACIÓN DE BASE DE DATOS ===\n";
echo "Fecha: " . date('Y-m-d H:i:s') . "\n\n";

try {
    $pdo = getDatabase();
    echo "✓ Conexión a la base de datos exitosa\n";
    
    // 1. PROBLEMA DE LOGIN - Verificar contraseñas
    echo "\n1. DIAGNÓSTICO DE LOGIN:\n";
    echo "------------------------\n";
    
    // Verificar usuarios actuales
    $stmt = $pdo->query("SELECT id, username, name, role, active FROM users ORDER BY id");
    $users = $stmt->fetchAll();
    
    echo "Usuarios encontrados:\n";
    foreach ($users as $user) {
        echo "  - ID: {$user['id']}, Usuario: {$user['username']}, Nombre: {$user['name']}, Rol: {$user['role']}, Activo: {$user['active']}\n";
    }
    
    // Actualizar contraseñas conocidas para testing
    echo "\nActualizando contraseñas para testing...\n";
    
    $passwords = [
        'admin' => 'admin123',
        'gerente' => 'gerente123', 
        'profesional1' => 'prof123',
        'recepcion' => 'recep123'
    ];
    
    foreach ($passwords as $username => $password) {
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE username = ?");
        $stmt->execute([$hashedPassword, $username]);
        echo "  ✓ Contraseña actualizada para usuario: $username (contraseña: $password)\n";
    }
    
    // 2. PROBLEMA DE DISCIPLINAS - Verificar estructura
    echo "\n2. DIAGNÓSTICO DE DISCIPLINAS:\n";
    echo "------------------------------\n";
    
    // Verificar estructura de la tabla
    $stmt = $pdo->query("DESCRIBE disciplines");
    $columns = $stmt->fetchAll();
    
    echo "Estructura actual de la tabla disciplines:\n";
    foreach ($columns as $column) {
        echo "  - {$column['Field']}: {$column['Type']}\n";
    }
    
    // Verificar datos actuales
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM disciplines");
    $count = $stmt->fetch();
    echo "Total de disciplinas: {$count['total']}\n";
    
    // Verificar si hay problemas de integridad referencial
    $stmt = $pdo->query("
        SELECT p.name, p.discipline_id, d.name as discipline_name 
        FROM professionals p 
        LEFT JOIN disciplines d ON p.discipline_id = d.id 
        WHERE p.discipline_id IS NOT NULL 
        LIMIT 10
    ");
    $professionals = $stmt->fetchAll();
    
    echo "\nProfesionales y sus disciplinas:\n";
    foreach ($professionals as $prof) {
        $status = $prof['discipline_name'] ? "✓" : "✗ (disciplina no encontrada)";
        echo "  $status {$prof['name']} -> {$prof['discipline_id']} ({$prof['discipline_name']})\n";
    }
    
    // 3. CREAR SISTEMA DE PERMISOS
    echo "\n3. CONFIGURACIÓN DE SISTEMA DE PERMISOS:\n";
    echo "---------------------------------------\n";
    
    // Verificar si existe la tabla de permisos
    $stmt = $pdo->query("SHOW TABLES LIKE 'user_permissions'");
    $permissionsTableExists = $stmt->fetch() !== false;
    
    if (!$permissionsTableExists) {
        echo "Creando tabla de permisos de usuario...\n";
        
        $createPermissionsTable = "
            CREATE TABLE user_permissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                module VARCHAR(50) NOT NULL,
                permission ENUM('read', 'write', 'admin') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_module (user_id, module),
                INDEX idx_user_id (user_id),
                INDEX idx_module (module)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ";
        
        $pdo->exec($createPermissionsTable);
        echo "  ✓ Tabla user_permissions creada\n";
        
        // Insertar permisos por defecto
        $defaultPermissions = [
            // Admin - acceso completo a todo
            [1, 'patients', 'admin'],
            [1, 'professionals', 'admin'],
            [1, 'appointments', 'admin'],
            [1, 'disciplines', 'admin'],
            [1, 'users', 'admin'],
            [1, 'settings', 'admin'],
            [1, 'reports', 'admin'],
            
            // Gerente - acceso de escritura a la mayoría, admin en reportes
            [2, 'patients', 'write'],
            [2, 'professionals', 'write'],
            [2, 'appointments', 'write'],
            [2, 'disciplines', 'write'],
            [2, 'users', 'read'],
            [2, 'settings', 'read'],
            [2, 'reports', 'admin'],
            
            // Profesional - lectura y escritura limitada
            [3, 'patients', 'read'],
            [3, 'professionals', 'read'],
            [3, 'appointments', 'write'],
            [3, 'disciplines', 'read'],
            
            // Recepción - manejo de citas y pacientes
            [4, 'patients', 'write'],
            [4, 'professionals', 'read'],
            [4, 'appointments', 'write'],
            [4, 'disciplines', 'read']
        ];
        
        foreach ($defaultPermissions as $perm) {
            $stmt = $pdo->prepare("INSERT INTO user_permissions (user_id, module, permission) VALUES (?, ?, ?)");
            $stmt->execute($perm);
        }
        
        echo "  ✓ Permisos por defecto insertados\n";
    } else {
        echo "  ✓ Tabla de permisos ya existe\n";
    }
    
    // 4. VERIFICAR DISCIPLINAS MEJORADA
    echo "\n4. MEJORANDO API DE DISCIPLINAS:\n";
    echo "--------------------------------\n";
    
    // Verificar si necesita agregar campo description
    $stmt = $pdo->query("SHOW COLUMNS FROM disciplines LIKE 'description'");
    $hasDescription = $stmt->fetch() !== false;
    
    if (!$hasDescription) {
        echo "Agregando campo description a disciplines...\n";
        $pdo->exec("ALTER TABLE disciplines ADD COLUMN description TEXT AFTER name");
        echo "  ✓ Campo description agregado\n";
    }
    
    // Verificar si necesita agregar campo active
    $stmt = $pdo->query("SHOW COLUMNS FROM disciplines LIKE 'active'");
    $hasActive = $stmt->fetch() !== false;
    
    if (!$hasActive) {
        echo "Agregando campo active a disciplines...\n";
        $pdo->exec("ALTER TABLE disciplines ADD COLUMN active TINYINT(1) DEFAULT 1 AFTER description");
        echo "  ✓ Campo active agregado\n";
    }
    
    echo "\n=== REPARACIÓN COMPLETADA ===\n";
    echo "Próximos pasos:\n";
    echo "1. Prueba el login con las credenciales actualizadas\n";
    echo "2. Verifica que se pueden guardar disciplinas\n";
    echo "3. Los permisos de usuario están configurados\n";
    echo "\nCredenciales de prueba:\n";
    foreach ($passwords as $user => $pass) {
        echo "  - Usuario: $user, Contraseña: $pass\n";
    }
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
?>
