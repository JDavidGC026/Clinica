<?php
/**
 * =====================================================
 * SCRIPT PARA CORREGIR PROBLEMAS DE BASE DE DATOS
 * Clínica Delux - Sistema de Gestión Médica
 * =====================================================
 */

// Configuración de base de datos - EDITA ESTOS VALORES
$host = 'localhost';
$username = 'root';
$password = '';
$database = 'clinica_delux';

// Configurar zona horaria
date_default_timezone_set('America/Mexico_City');

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    
    echo "✅ Conectado a la base de datos\n\n";
    
    // 1. Insertar disciplinas faltantes
    echo "📋 Insertando disciplinas médicas...\n";
    
    $disciplines = [
        ['medicina-general', 'Medicina General'],
        ['pediatria', 'Pediatría'],
        ['ginecologia', 'Ginecología'],
        ['traumatologia-ortopedia', 'Traumatología y Ortopedia'],
        ['urologia', 'Urología'],
        ['medicina-interna', 'Medicina Interna'],
        ['gastroenterologia', 'Gastroenterología'],
        ['nutricion', 'Nutrición'],
        ['dermatologia', 'Dermatología'],
        ['psicologia-clinica', 'Psicología Clínica'],
        ['cardiologia', 'Cardiología'],
        ['neurologia', 'Neurología'],
        ['oftalmologia', 'Oftalmología'],
        ['otorrinolaringologia', 'Otorrinolaringología'],
        ['endocrinologia', 'Endocrinología']
    ];
    
    $stmt = $pdo->prepare("INSERT IGNORE INTO disciplines (id, name) VALUES (?, ?)");
    foreach ($disciplines as $discipline) {
        $stmt->execute($discipline);
    }
    echo "✅ Disciplinas insertadas\n";
    
    // 2. Insertar usuarios del sistema
    echo "👥 Insertando usuarios del sistema...\n";
    
    $users = [
        ['admin', password_hash('password', PASSWORD_DEFAULT), 'Administrador General', 'admin@clinicadelux.com', 'Administrador'],
        ['gerente', password_hash('password', PASSWORD_DEFAULT), 'Gerente Principal', 'gerente@clinicadelux.com', 'Gerente'],
        ['profesional1', password_hash('password', PASSWORD_DEFAULT), 'Dr. Carlos Ruiz', 'carlos.ruiz@clinicadelux.com', 'Profesional'],
        ['recepcion', password_hash('password', PASSWORD_DEFAULT), 'María López', 'maria.lopez@clinicadelux.com', 'Recepcionista']
    ];
    
    $stmt = $pdo->prepare("INSERT IGNORE INTO users (username, password_hash, name, email, role) VALUES (?, ?, ?, ?, ?)");
    foreach ($users as $user) {
        $stmt->execute($user);
    }
    echo "✅ Usuarios insertados\n";
    
    // 3. Corregir inconsistencias en appointments
    echo "🔧 Corrigiendo inconsistencias en citas...\n";
    
    // Mapeo de IDs de profesionales (de los datos existentes)
    $professionalMapping = [
        1 => 20, // Dr. Ana García Martínez -> Dr. Ana García
        2 => 21, // Dr. Carlos Ruiz López -> Dr. Carlos Ruiz  
        3 => 22, // Dra. María Elena Fernández -> Dra. María Fernández
    ];
    
    foreach ($professionalMapping as $oldId => $newId) {
        $stmt = $pdo->prepare("UPDATE appointments SET professional_id = ? WHERE professional_id = ?");
        $stmt->execute([$newId, $oldId]);
    }
    
    // Actualizar nombres de profesionales en appointments para que coincidan
    $professionalNames = [
        20 => 'Dr. Ana García',
        21 => 'Dr. Carlos Ruiz',
        22 => 'Dra. María Fernández',
        23 => 'Dr. Luis Martínez',
        27 => 'Dr. Alejandro Montesinos Garcia'
    ];
    
    foreach ($professionalNames as $profId => $profName) {
        $stmt = $pdo->prepare("UPDATE appointments SET professional_name = ? WHERE professional_id = ?");
        $stmt->execute([$profName, $profId]);
    }
    
    echo "✅ Citas corregidas\n";
    
    // 4. Verificar y mostrar estadísticas
    echo "\n📊 Estadísticas de la base de datos:\n";
    
    $tables = ['disciplines', 'professionals', 'patients', 'appointments', 'users'];
    foreach ($tables as $table) {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM $table");
        $count = $stmt->fetch()['count'];
        echo "  - $table: $count registros\n";
    }
    
    // 5. Verificar relaciones
    echo "\n🔗 Verificando relaciones:\n";
    
    // Verificar appointments con professional_id válido
    $stmt = $pdo->query("
        SELECT COUNT(*) as count 
        FROM appointments a 
        LEFT JOIN professionals p ON a.professional_id = p.id 
        WHERE a.professional_id IS NOT NULL AND p.id IS NULL
    ");
    $orphanAppointments = $stmt->fetch()['count'];
    echo "  - Citas con professional_id inválido: $orphanAppointments\n";
    
    // Verificar appointments con patient_id válido
    $stmt = $pdo->query("
        SELECT COUNT(*) as count 
        FROM appointments a 
        LEFT JOIN patients p ON a.patient_id = p.id 
        WHERE a.patient_id IS NOT NULL AND p.id IS NULL
    ");
    $orphanPatientAppointments = $stmt->fetch()['count'];
    echo "  - Citas con patient_id inválido: $orphanPatientAppointments\n";
    
    // 6. Crear archivo de configuración actualizado
    echo "\n⚙️ Creando archivo de configuración...\n";
    
    $configContent = "<?php
// Configuración común para todas las APIs - Clínica Delux
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (\$_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuración de zona horaria para Ciudad de México
date_default_timezone_set('America/Mexico_City');

// Configuración de base de datos
\$host = '$host';
\$username = '$username';
\$password = '$password';
\$database = '$database';

function getDatabase() {
    global \$host, \$username, \$password, \$database;
    
    try {
        \$pdo = new PDO(\"mysql:host=\$host;dbname=\$database;charset=utf8mb4\", \$username, \$password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        
        // Configurar zona horaria en MySQL
        \$pdo->exec(\"SET time_zone = '-06:00'\");
        
        return \$pdo;
    } catch (PDOException \$e) {
        throw new Exception('Database connection failed: ' . \$e->getMessage());
    }
}

function sendResponse(\$data, \$status = 200) {
    http_response_code(\$status);
    echo json_encode(\$data, JSON_UNESCAPED_UNICODE);
    exit();
}

function sendError(\$message, \$status = 500) {
    http_response_code(\$status);
    echo json_encode(['error' => \$message], JSON_UNESCAPED_UNICODE);
    exit();
}

function getRequestData() {
    \$input = file_get_contents('php://input');
    return json_decode(\$input, true) ?? [];
}

// Función para formatear fechas en zona horaria de México
function formatMexicoDate(\$date, \$format = 'Y-m-d H:i:s') {
    \$dateTime = new DateTime(\$date);
    \$dateTime->setTimezone(new DateTimeZone('America/Mexico_City'));
    return \$dateTime->format(\$format);
}

// Función para obtener la fecha actual en México
function getMexicoNow() {
    \$now = new DateTime();
    \$now->setTimezone(new DateTimeZone('America/Mexico_City'));
    return \$now;
}

// Función para registrar actividad de la API
function logApiActivity(\$endpoint, \$method, \$status, \$message = '') {
    \$logFile = __DIR__ . '/api_log.txt';
    \$timestamp = date('Y-m-d H:i:s');
    \$ip = \$_SERVER['REMOTE_ADDR'] ?? 'Unknown';
    \$userAgent = \$_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
    
    \$logEntry = \"[\$timestamp] \$ip | \$method \$endpoint | Status: \$status | \$message | \$userAgent\\n\";
    
    // Limitar el tamaño del archivo de log
    if (file_exists(\$logFile) && filesize(\$logFile) > 5 * 1024 * 1024) { // 5MB
        // Crear archivo de respaldo
        rename(\$logFile, \$logFile . '.' . date('Ymd-His') . '.bak');
    }
    
    file_put_contents(\$logFile, \$logEntry, FILE_APPEND);
}
?>";
    
    file_put_contents('public/api/config.php', $configContent);
    echo "✅ Archivo de configuración actualizado\n";
    
    echo "\n🎉 ¡Base de datos corregida exitosamente!\n\n";
    echo "📝 Credenciales de acceso:\n";
    echo "  - admin / password (Administrador)\n";
    echo "  - gerente / password (Gerente)\n";
    echo "  - profesional1 / password (Profesional)\n";
    echo "  - recepcion / password (Recepcionista)\n\n";
    echo "🔐 Login como profesional:\n";
    echo "  - ana.garcia@clinicadelux.com / password\n";
    echo "  - carlos.ruiz@clinicadelux.com / password\n";
    echo "  - maria.fernandez@clinicadelux.com / password\n\n";
    echo "⚠️ IMPORTANTE: Cambia las contraseñas después del primer login\n";
    
} catch (PDOException $e) {
    echo "❌ Error de base de datos: " . $e->getMessage() . "\n";
    echo "\n💡 Soluciones:\n";
    echo "1. Verifica las credenciales de conexión al inicio del archivo\n";
    echo "2. Asegúrate de que MySQL esté ejecutándose\n";
    echo "3. Confirma que la base de datos 'clinica_delux' existe\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>