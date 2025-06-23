#!/bin/bash

# =====================================================
# SCRIPT DE DEPLOY PARA HOSTING COMPARTIDO
# Clínica Delux - Sistema de Gestión Médica
# =====================================================

set -e

echo "🚀 Iniciando deploy para hosting compartido..."
echo "📅 $(date)"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar dependencias
log_info "🔍 Verificando dependencias..."

if ! command -v node &> /dev/null; then
    log_error "Node.js no está instalado. Por favor instala Node.js 18+ primero."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    log_error "npm no está instalado. Por favor instala npm primero."
    exit 1
fi

log_success "✅ Dependencias verificadas"

# Limpiar build anterior
log_info "🧹 Limpiando build anterior..."
rm -rf dist deploy-output clinica-delux-deploy.zip

# Instalar dependencias
log_info "📦 Instalando dependencias..."
npm install

# Construir aplicación
log_info "🔨 Construyendo aplicación para producción..."
npm run build

if [ ! -d "dist" ]; then
    log_error "❌ Error: No se pudo construir la aplicación"
    exit 1
fi

log_success "✅ Aplicación construida exitosamente"

# Crear directorio de deploy
log_info "📁 Preparando archivos para deploy..."
mkdir -p deploy-output

# Copiar archivos construidos
cp -r dist/* deploy-output/

# Copiar archivos de API
cp -r public/api deploy-output/

# Copiar archivos de configuración
cp public/.htaccess deploy-output/
cp public/manifest.json deploy-output/ 2>/dev/null || log_warning "manifest.json no encontrado"

# Copiar Service Worker
cp public/sw.js deploy-output/ 2>/dev/null || log_warning "sw.js no encontrado"

# Copiar iconos si existen
if [ -d "public/icons" ]; then
    cp -r public/icons deploy-output/
else
    log_warning "Directorio de iconos no encontrado"
fi

# Crear configurador de base de datos
log_info "🗃️ Creando configurador de base de datos..."

cat > deploy-output/setup-database.php << 'EOF'
<?php
/**
 * =====================================================
 * CONFIGURADOR DE BASE DE DATOS - CLÍNICA DELUX
 * =====================================================
 * 
 * Este archivo configura automáticamente la base de datos
 * para el sistema de gestión de Clínica Delux.
 * 
 * IMPORTANTE: Elimina este archivo después de la configuración
 */

// Configuración de zona horaria
date_default_timezone_set('America/Mexico_City');

// Configuración de errores
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Headers
header('Content-Type: text/html; charset=utf-8');

// Variables de configuración
$host = '';
$username = '';
$password = '';
$database = '';
$setupComplete = false;
$errors = [];
$success = [];

// Procesar formulario
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $host = $_POST['host'] ?? 'localhost';
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    $database = $_POST['database'] ?? '';
    
    if (empty($username) || empty($database)) {
        $errors[] = 'Usuario y nombre de base de datos son requeridos';
    } else {
        try {
            // Conectar a MySQL
            $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
            
            $success[] = "✅ Conectado a MySQL exitosamente";
            
            // Crear base de datos si no existe
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `$database` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $success[] = "✅ Base de datos '$database' creada/verificada";
            
            // Usar la base de datos
            $pdo->exec("USE `$database`");
            
            // Configurar zona horaria
            $pdo->exec("SET time_zone = '-06:00'");
            
            // Crear tablas
            $tables = [
                'disciplines' => "
                    CREATE TABLE IF NOT EXISTS disciplines (
                        id VARCHAR(100) PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                ",
                'professionals' => "
                    CREATE TABLE IF NOT EXISTS professionals (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        phone VARCHAR(50),
                        discipline_id VARCHAR(100),
                        license VARCHAR(100),
                        experience VARCHAR(100),
                        schedule JSON,
                        status VARCHAR(50) DEFAULT 'activo',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE SET NULL
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                ",
                'patients' => "
                    CREATE TABLE IF NOT EXISTS patients (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        phone VARCHAR(50),
                        age INT,
                        gender VARCHAR(50),
                        address TEXT,
                        emergency_contact VARCHAR(255),
                        emergency_phone VARCHAR(50),
                        medical_history TEXT,
                        allergies TEXT,
                        medications TEXT,
                        notes TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                ",
                'appointments' => "
                    CREATE TABLE IF NOT EXISTS appointments (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        patient_id INT,
                        patient_name VARCHAR(255) NOT NULL,
                        patient_email VARCHAR(255) NOT NULL,
                        patient_phone VARCHAR(50),
                        professional_id INT,
                        professional_name VARCHAR(255),
                        date DATE NOT NULL,
                        time TIME NOT NULL,
                        type VARCHAR(100) NOT NULL,
                        notes TEXT,
                        status VARCHAR(50) DEFAULT 'programada',
                        payment_status VARCHAR(50) DEFAULT 'pendiente',
                        cost DECIMAL(10,2),
                        folio VARCHAR(100),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
                        FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE SET NULL
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                ",
                'users' => "
                    CREATE TABLE IF NOT EXISTS users (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        username VARCHAR(100) UNIQUE NOT NULL,
                        password_hash VARCHAR(255) NOT NULL,
                        name VARCHAR(255) NOT NULL,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        role VARCHAR(50) NOT NULL,
                        active BOOLEAN DEFAULT TRUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                ",
                'email_history' => "
                    CREATE TABLE IF NOT EXISTS email_history (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        type VARCHAR(100) NOT NULL,
                        recipient VARCHAR(255) NOT NULL,
                        subject VARCHAR(500) NOT NULL,
                        status VARCHAR(50) NOT NULL,
                        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        error_message TEXT
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                "
            ];
            
            foreach ($tables as $tableName => $sql) {
                try {
                    $pdo->exec($sql);
                    $success[] = "✅ Tabla '$tableName' creada/verificada";
                } catch (PDOException $e) {
                    // Si hay un error en la sintaxis SQL, registrarlo pero continuar
                    $errors[] = "Error creando tabla '$tableName': " . $e->getMessage();
                    continue;
                }
            }
            
            // Insertar datos de prueba
            
            // Disciplinas
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
                ['psicologia-clinica', 'Psicología Clínica']
            ];
            
            try {
                $stmt = $pdo->prepare("INSERT IGNORE INTO disciplines (id, name) VALUES (?, ?)");
                foreach ($disciplines as $discipline) {
                    $stmt->execute($discipline);
                }
                $success[] = "✅ Disciplinas médicas insertadas";
            } catch (PDOException $e) {
                $errors[] = "Error insertando disciplinas: " . $e->getMessage();
            }
            
            // Usuarios de prueba
            try {
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
                $success[] = "✅ Usuarios de prueba creados";
            } catch (PDOException $e) {
                $errors[] = "Error insertando usuarios: " . $e->getMessage();
            }
            
            // Profesionales de ejemplo
            try {
                $professionals = [
                    ['Dr. Ana García', 'ana.garcia@clinicadelux.com', '+52 55 1234 5678', 'medicina-general', 'COL-12345', '8 años', '{"monday":{"start":"09:00","end":"17:00","available":true},"tuesday":{"start":"09:00","end":"17:00","available":true},"wednesday":{"start":"09:00","end":"17:00","available":true},"thursday":{"start":"09:00","end":"17:00","available":true},"friday":{"start":"09:00","end":"15:00","available":true},"saturday":{"start":"","end":"","available":false},"sunday":{"start":"","end":"","available":false}}'],
                    ['Dr. Carlos Ruiz', 'carlos.ruiz@clinicadelux.com', '+52 55 2345 6789', 'pediatria', 'PED-67890', '12 años', '{"monday":{"start":"10:00","end":"18:00","available":true},"tuesday":{"start":"10:00","end":"18:00","available":true},"wednesday":{"start":"10:00","end":"18:00","available":true},"thursday":{"start":"10:00","end":"18:00","available":true},"friday":{"start":"10:00","end":"16:00","available":true},"saturday":{"start":"09:00","end":"13:00","available":true},"sunday":{"start":"","end":"","available":false}}'],
                    ['Dra. María Fernández', 'maria.fernandez@clinicadelux.com', '+52 55 3456 7890', 'ginecologia', 'GIN-11111', '15 años', '{"monday":{"start":"08:00","end":"16:00","available":true},"tuesday":{"start":"08:00","end":"16:00","available":true},"wednesday":{"start":"08:00","end":"16:00","available":true},"thursday":{"start":"08:00","end":"16:00","available":true},"friday":{"start":"08:00","end":"14:00","available":true},"saturday":{"start":"","end":"","available":false},"sunday":{"start":"","end":"","available":false}}'],
                    ['Dr. Luis Martínez', 'luis.martinez@clinicadelux.com', '+52 55 4567 8901', 'traumatologia-ortopedia', 'TRA-22222', '10 años', '{"monday":{"start":"07:00","end":"15:00","available":true},"tuesday":{"start":"07:00","end":"15:00","available":true},"wednesday":{"start":"07:00","end":"15:00","available":true},"thursday":{"start":"07:00","end":"15:00","available":true},"friday":{"start":"07:00","end":"13:00","available":true},"saturday":{"start":"","end":"","available":false},"sunday":{"start":"","end":"","available":false}"}']
                ];
                
                $stmt = $pdo->prepare("INSERT IGNORE INTO professionals (name, email, phone, discipline_id, license, experience, schedule) VALUES (?, ?, ?, ?, ?, ?, ?)");
                foreach ($professionals as $professional) {
                    $stmt->execute($professional);
                }
                $success[] = "✅ Profesionales de ejemplo creados";
            } catch (PDOException $e) {
                $errors[] = "Error insertando profesionales: " . $e->getMessage();
            }
            
            // Pacientes de ejemplo
            try {
                $patients = [
                    ['Juan Pérez García', 'juan.perez@email.com', '+52 55 1111 2222', 35, 'masculino', 'Av. Insurgentes 123, Col. Roma, CDMX', 'María Pérez', '+52 55 3333 4444', 'Hipertensión controlada', 'Ninguna conocida', 'Losartán 50mg', 'Paciente regular'],
                    ['Ana Martínez López', 'ana.martinez@email.com', '+52 55 5555 6666', 28, 'femenino', 'Calle Reforma 456, Col. Juárez, CDMX', 'Carlos Martínez', '+52 55 7777 8888', 'Ninguna', 'Polen', 'Ninguna', 'Primera consulta'],
                    ['Carlos Rodríguez Sánchez', 'carlos.rodriguez@email.com', '+52 55 9999 0000', 42, 'masculino', 'Av. Universidad 789, Col. Del Valle, CDMX', 'Laura Rodríguez', '+52 55 1234 5678', 'Diabetes tipo 2', 'Penicilina', 'Metformina 850mg', 'Control mensual'],
                    ['María González Hernández', 'maria.gonzalez@email.com', '+52 55 2468 1357', 31, 'femenino', 'Calle Madero 321, Col. Centro, CDMX', 'José González', '+52 55 9876 5432', 'Ninguna', 'Mariscos', 'Vitaminas prenatales', 'Embarazo de 20 semanas'],
                    ['Pedro Jiménez Morales', 'pedro.jimenez@email.com', '+52 55 1357 2468', 55, 'masculino', 'Av. Patriotismo 654, Col. San Pedro, CDMX', 'Carmen Jiménez', '+52 55 5432 1098', 'Artritis reumatoide', 'Aspirina', 'Metotrexato', 'Seguimiento reumatológico']
                ];
                
                $stmt = $pdo->prepare("INSERT IGNORE INTO patients (name, email, phone, age, gender, address, emergency_contact, emergency_phone, medical_history, allergies, medications, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                foreach ($patients as $patient) {
                    $stmt->execute($patient);
                }
                $success[] = "✅ Pacientes de ejemplo creados";
            } catch (PDOException $e) {
                $errors[] = "Error insertando pacientes: " . $e->getMessage();
            }
            
            // Actualizar archivo de configuración
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
            
            file_put_contents('api/config.php', $configContent);
            $success[] = "✅ Archivo de configuración actualizado";
            
            $setupComplete = true;
            
        } catch (PDOException $e) {
            $errors[] = "Error de base de datos: " . $e->getMessage();
        } catch (Exception $e) {
            $errors[] = "Error: " . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Configuración de Base de Datos - Clínica Delux</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #d946ef, #a855f7);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 600px;
            width: 100%;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #d946ef, #a855f7);
            border-radius: 20px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
        }
        h1 { color: #1f2937; margin-bottom: 10px; }
        .subtitle { color: #6b7280; margin-bottom: 20px; }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #374151;
        }
        input[type="text"], input[type="password"] {
            width: 100%;
            padding: 12px;
            border: 2px solid #e5e7eb;
            border-radius: 10px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        input[type="text"]:focus, input[type="password"]:focus {
            outline: none;
            border-color: #d946ef;
        }
        .btn {
            background: linear-gradient(135deg, #d946ef, #a855f7);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            transition: transform 0.2s;
        }
        .btn:hover { transform: translateY(-2px); }
        .alert {
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        .alert-success {
            background: #d1fae5;
            border: 1px solid #10b981;
            color: #065f46;
        }
        .alert-error {
            background: #fee2e2;
            border: 1px solid #ef4444;
            color: #991b1b;
        }
        .success-icon { color: #10b981; font-size: 48px; margin-bottom: 20px; }
        .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            color: #92400e;
            padding: 15px;
            border-radius: 10px;
            margin-top: 20px;
        }
        .credentials {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
        }
        .credentials h3 { margin-bottom: 15px; color: #1f2937; }
        .credential-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px;
            background: white;
            border-radius: 5px;
        }
        .credential-label { font-weight: 600; }
        .credential-value { font-family: monospace; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏥</div>
            <h1>Clínica Delux</h1>
            <p class="subtitle">Configuración de Base de Datos</p>
        </div>

        <?php if ($setupComplete): ?>
            <div style="text-align: center;">
                <div class="success-icon">✅</div>
                <h2 style="color: #10b981; margin-bottom: 20px;">¡Configuración Completada!</h2>
                
                <?php foreach ($success as $msg): ?>
                    <div class="alert alert-success"><?php echo htmlspecialchars($msg); ?></div>
                <?php endforeach; ?>
                
                <?php if (!empty($errors)): ?>
                    <h3 style="color: #f59e0b; margin: 20px 0 10px;">Advertencias:</h3>
                    <?php foreach ($errors as $error): ?>
                        <div class="alert alert-error"><?php echo htmlspecialchars($error); ?></div>
                    <?php endforeach; ?>
                    <p style="margin-top: 10px; color: #6b7280;">Algunas operaciones fallaron, pero el sistema debería funcionar correctamente.</p>
                <?php endif; ?>
                
                <div class="credentials">
                    <h3>🔑 Credenciales de Acceso</h3>
                    <div class="credential-item">
                        <span class="credential-label">Usuario Administrador:</span>
                        <span class="credential-value">admin</span>
                    </div>
                    <div class="credential-item">
                        <span class="credential-label">Contraseña:</span>
                        <span class="credential-value">password</span>
                    </div>
                    <div class="credential-item">
                        <span class="credential-label">Usuario Gerente:</span>
                        <span class="credential-value">gerente</span>
                    </div>
                    <div class="credential-item">
                        <span class="credential-label">Usuario Profesional:</span>
                        <span class="credential-value">profesional1</span>
                    </div>
                    <div class="credential-item">
                        <span class="credential-label">Usuario Recepción:</span>
                        <span class="credential-value">recepcion</span>
                    </div>
                </div>
                
                <div class="warning">
                    <strong>⚠️ IMPORTANTE:</strong> Por seguridad, elimina este archivo (setup-database.php) después de completar la configuración.
                </div>
                
                <div style="margin-top: 30px;">
                    <a href="index.html" class="btn" style="text-decoration: none; display: inline-block;">
                        🚀 Ir al Sistema
                    </a>
                </div>
            </div>
        <?php else: ?>
            <?php if (!empty($errors)): ?>
                <?php foreach ($errors as $error): ?>
                    <div class="alert alert-error"><?php echo htmlspecialchars($error); ?></div>
                <?php endforeach; ?>
            <?php endif; ?>

            <form method="POST">
                <div class="form-group">
                    <label for="host">Servidor de Base de Datos:</label>
                    <input type="text" id="host" name="host" value="<?php echo htmlspecialchars($host ?: 'localhost'); ?>" required>
                </div>

                <div class="form-group">
                    <label for="username">Usuario de MySQL:</label>
                    <input type="text" id="username" name="username" value="<?php echo htmlspecialchars($username); ?>" required>
                </div>

                <div class="form-group">
                    <label for="password">Contraseña de MySQL:</label>
                    <input type="password" id="password" name="password" value="<?php echo htmlspecialchars($password); ?>">
                </div>

                <div class="form-group">
                    <label for="database">Nombre de la Base de Datos:</label>
                    <input type="text" id="database" name="database" value="<?php echo htmlspecialchars($database ?: 'clinica_delux'); ?>" required>
                </div>

                <button type="submit" class="btn">🔧 Configurar Base de Datos</button>
            </form>

            <div class="warning">
                <strong>📋 Información:</strong> Este configurador creará automáticamente todas las tablas necesarias, insertará datos de prueba y configurará el sistema para funcionar correctamente.
            </div>
        <?php endif; ?>
    </div>
</body>
</html>
EOF

log_success "✅ Configurador de base de datos creado"

# Crear archivo de instrucciones
log_info "📝 Creando archivo de instrucciones..."

cat > deploy-output/INSTRUCCIONES_DEPLOY.txt << 'EOF'
=====================================================
INSTRUCCIONES DE DEPLOY - CLÍNICA DELUX
=====================================================

🎯 PASOS PARA SUBIR AL HOSTING COMPARTIDO:

1. SUBIR ARCHIVOS:
   - Sube TODO el contenido de esta carpeta a tu public_html (o html)
   - Asegúrate de que index.html esté en la raíz de tu dominio

2. CONFIGURAR BASE DE DATOS:
   - Ve a: http://tu-dominio.com/setup-database.php
   - Ingresa las credenciales de tu base de datos MySQL
   - El sistema se configurará automáticamente

3. ELIMINAR ARCHIVO DE CONFIGURACIÓN:
   - Después de la configuración, ELIMINA setup-database.php por seguridad

4. ACCEDER AL SISTEMA:
   - Ve a: http://tu-dominio.com
   - Usa las credenciales que aparecen en el configurador

🔑 CREDENCIALES DE PRUEBA:
   - admin / password (Administrador)
   - gerente / password (Gerente)  
   - profesional1 / password (Profesional)
   - recepcion / password (Recepcionista)

⚠️ IMPORTANTE:
   - Cambia las contraseñas después del primer login
   - Configura el envío de emails en Configuración
   - El sistema está optimizado para México (GMT-6)

📞 SOPORTE:
   - Todos los logs de API se guardan automáticamente
   - Revisa la sección "Logs de API" para diagnósticos
   - El sistema funciona offline con localStorage como respaldo

🎉 ¡LISTO! Tu sistema de gestión médica está configurado.
EOF

# Crear archivo ZIP para descarga fácil
log_info "📦 Creando archivo ZIP para descarga..."
cd deploy-output
zip -r ../clinica-delux-deploy.zip . > /dev/null 2>&1
cd ..

log_success "✅ Archivo ZIP creado: clinica-delux-deploy.zip"

# Mostrar resumen
echo ""
echo "🎉 ¡DEPLOY COMPLETADO EXITOSAMENTE!"
echo ""
echo "📁 Archivos preparados en: deploy-output/"
echo "📦 Archivo ZIP creado: clinica-delux-deploy.zip"
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo "1. Sube el contenido de 'deploy-output/' a tu public_html"
echo "2. Ve a http://tu-dominio.com/setup-database.php"
echo "3. Configura la base de datos"
echo "4. ¡Elimina setup-database.php por seguridad!"
echo "5. Accede a http://tu-dominio.com"
echo ""
echo "🔑 Credenciales de prueba:"
echo "   - admin / password (Administrador)"
echo "   - gerente / password (Gerente)"
echo "   - profesional1 / password (Profesional)"
echo "   - recepcion / password (Recepcionista)"
echo ""
echo "⚠️  IMPORTANTE: Cambia las contraseñas después del primer login"
echo ""
log_success "🚀 ¡Tu sistema de gestión médica está listo para usar!"