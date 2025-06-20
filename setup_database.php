<?php
/**
 * =====================================================
 * SCRIPT DE CONFIGURACIÓN DE BASE DE DATOS
 * Clínica Delux - Sistema de Gestión Médica
 * =====================================================
 * 
 * Este script configura la base de datos completa
 * incluyendo la tabla de usuarios para el login
 */

// Configuración de base de datos
$host = 'localhost';
$username = 'root'; // Cambiar por tu usuario de MySQL
$password = '';     // Cambiar por tu contraseña de MySQL
$database = 'clinica_delux'; // Cambiar por tu base de datos

try {
    // Conectar a MySQL
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    
    echo "✅ Conectado a MySQL\n";
    
    // Crear base de datos si no existe
    $pdo->exec("CREATE DATABASE IF NOT EXISTS $database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "✅ Base de datos '$database' creada/verificada\n";
    
    // Usar la base de datos
    $pdo->exec("USE $database");
    
    // Configurar zona horaria
    $pdo->exec("SET time_zone = '-06:00'");
    
    // Leer y ejecutar el archivo SQL de usuarios
    $sqlFile = __DIR__ . '/create_users_table.sql';
    if (file_exists($sqlFile)) {
        $sql = file_get_contents($sqlFile);
        
        // Dividir en statements individuales
        $statements = array_filter(array_map('trim', explode(';', $sql)));
        
        foreach ($statements as $statement) {
            if (!empty($statement) && !preg_match('/^--/', $statement)) {
                try {
                    $pdo->exec($statement);
                } catch (PDOException $e) {
                    if (strpos($e->getMessage(), 'already exists') === false) {
                        echo "⚠️  Error ejecutando statement: " . $e->getMessage() . "\n";
                    }
                }
            }
        }
        
        echo "✅ Tabla de usuarios configurada\n";
    }
    
    // Verificar tablas creadas
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "\n📊 Tablas en la base de datos:\n";
    foreach ($tables as $table) {
        echo "  - $table\n";
    }
    
    // Verificar usuarios de prueba
    if (in_array('users', $tables)) {
        $stmt = $pdo->query("SELECT username, name, role FROM users");
        $users = $stmt->fetchAll();
        
        echo "\n👥 Usuarios de prueba configurados:\n";
        foreach ($users as $user) {
            echo "  - {$user['username']} ({$user['name']}) - {$user['role']}\n";
        }
        
        echo "\n🔑 Contraseña para todos los usuarios de prueba: 'password'\n";
    }
    
    echo "\n🎉 ¡Base de datos configurada exitosamente!\n";
    echo "\n📝 Próximos pasos:\n";
    echo "1. Actualiza las credenciales en public/api/config.php\n";
    echo "2. Prueba el login con: admin / password\n";
    echo "3. Verifica la API en: /api/health-check\n";
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "\n💡 Soluciones:\n";
    echo "1. Verifica que MySQL esté ejecutándose\n";
    echo "2. Confirma las credenciales de conexión\n";
    echo "3. Asegúrate de tener permisos para crear bases de datos\n";
}
?>