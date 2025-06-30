#!/bin/bash

# =====================================================
# SCRIPT DE DEPLOY INTERACTIVO PARA LINUX
# Clínica Delux - Sistema de Gestión Médica
# =====================================================

set -e

echo "🚀 Iniciando deploy para Linux Server..."
echo "📅 $(date)"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Variables de configuración
DEPLOY_PATH="/var/www/html/Clinica-delux"
DB_HOST="localhost"
DB_NAME="clinica_delux"
DB_USER=""
DB_PASSWORD=""
SKIP_DB_SETUP=false

# Función para solicitar credenciales de MySQL
ask_mysql_credentials() {
    echo ""
    log_step "Configuración de Base de Datos MySQL"
    echo "=================================================="
    
    read -p "🔧 Ingresa el usuario de MySQL (default: root): " input_user
    DB_USER=${input_user:-root}
    
    echo -n "🔐 Ingresa la contraseña de MySQL para '$DB_USER': "
    read -s DB_PASSWORD
    echo ""
    
    read -p "🗄️  Ingresa el nombre de la base de datos (default: clinica_delux): " input_db
    DB_NAME=${input_db:-clinica_delux}
    
    read -p "🌐 Ingresa el host de MySQL (default: localhost): " input_host
    DB_HOST=${input_host:-localhost}
    
    echo ""
    log_info "Configuración de BD: $DB_USER@$DB_HOST/$DB_NAME"
}

# Función para probar conexión MySQL
test_mysql_connection() {
    log_info "🔍 Probando conexión a MySQL..."
    
    if mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" >/dev/null 2>&1; then
        log_success "✅ Conexión a MySQL exitosa"
        return 0
    else
        log_error "❌ Error conectando a MySQL"
        return 1
    fi
}

# Función para crear base de datos y tablas
setup_database() {
    log_step "Configurando base de datos..."
    
    # Crear base de datos
    log_info "📊 Creando base de datos '$DB_NAME'..."
    mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || {
        log_error "Error creando base de datos"
        return 1
    }
    
    log_success "✅ Base de datos '$DB_NAME' creada/verificada"
    
    # Ejecutar migraciones SQL
    log_info "📋 Ejecutando migraciones SQL..."
    
    # Crear tablas principales
    mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" << 'EOF'
-- Configurar zona horaria
SET time_zone = '-06:00';

-- Tabla de disciplinas
CREATE TABLE IF NOT EXISTS disciplines (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de profesionales
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de pacientes
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de citas
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de historial de emails
CREATE TABLE IF NOT EXISTS email_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    status VARCHAR(50) NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
EOF

    if [ $? -eq 0 ]; then
        log_success "✅ Tablas creadas exitosamente"
    else
        log_error "❌ Error creando tablas"
        return 1
    fi
    
    # Insertar datos de ejemplo
    log_info "📝 Insertando datos de ejemplo..."
    
    mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" << 'EOF'
-- Insertar disciplinas
INSERT IGNORE INTO disciplines (id, name) VALUES
('medicina-general', 'Medicina General'),
('pediatria', 'Pediatría'),
('ginecologia', 'Ginecología'),
('traumatologia-ortopedia', 'Traumatología y Ortopedia'),
('urologia', 'Urología'),
('medicina-interna', 'Medicina Interna'),
('gastroenterologia', 'Gastroenterología'),
('nutricion', 'Nutrición'),
('dermatologia', 'Dermatología'),
('psicologia-clinica', 'Psicología Clínica');

-- Insertar usuarios de prueba
INSERT IGNORE INTO users (username, password_hash, name, email, role) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador General', 'admin@clinicadelux.com', 'Administrador'),
('gerente', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Gerente Principal', 'gerente@clinicadelux.com', 'Gerente'),
('profesional1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dr. Carlos Ruiz', 'carlos.ruiz@clinicadelux.com', 'Profesional'),
('recepcion', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'María López', 'maria.lopez@clinicadelux.com', 'Recepcionista');

-- Insertar profesionales de ejemplo
INSERT IGNORE INTO professionals (name, email, phone, discipline_id, license, experience, schedule) VALUES
('Dr. Ana García', 'ana.garcia@clinicadelux.com', '+52 55 1234 5678', 'medicina-general', 'COL-12345', '8 años', '{"monday":{"start":"09:00","end":"17:00","available":true},"tuesday":{"start":"09:00","end":"17:00","available":true},"wednesday":{"start":"09:00","end":"17:00","available":true},"thursday":{"start":"09:00","end":"17:00","available":true},"friday":{"start":"09:00","end":"15:00","available":true},"saturday":{"start":"","end":"","available":false},"sunday":{"start":"","end":"","available":false}}'),
('Dr. Carlos Ruiz', 'carlos.ruiz@clinicadelux.com', '+52 55 2345 6789', 'pediatria', 'PED-67890', '12 años', '{"monday":{"start":"10:00","end":"18:00","available":true},"tuesday":{"start":"10:00","end":"18:00","available":true},"wednesday":{"start":"10:00","end":"18:00","available":true},"thursday":{"start":"10:00","end":"18:00","available":true},"friday":{"start":"10:00","end":"16:00","available":true},"saturday":{"start":"09:00","end":"13:00","available":true},"sunday":{"start":"","end":"","available":false}}'),
('Dra. María Fernández', 'maria.fernandez@clinicadelux.com', '+52 55 3456 7890', 'ginecologia', 'GIN-11111', '15 años', '{"monday":{"start":"08:00","end":"16:00","available":true},"tuesday":{"start":"08:00","end":"16:00","available":true},"wednesday":{"start":"08:00","end":"16:00","available":true},"thursday":{"start":"08:00","end":"16:00","available":true},"friday":{"start":"08:00","end":"14:00","available":true},"saturday":{"start":"","end":"","available":false},"sunday":{"start":"","end":"","available":false}}'),
('Dr. Luis Martínez', 'luis.martinez@clinicadelux.com', '+52 55 4567 8901', 'traumatologia-ortopedia', 'TRA-22222', '10 años', '{"monday":{"start":"07:00","end":"15:00","available":true},"tuesday":{"start":"07:00","end":"15:00","available":true},"wednesday":{"start":"07:00","end":"15:00","available":true},"thursday":{"start":"07:00","end":"15:00","available":true},"friday":{"start":"07:00","end":"13:00","available":true},"saturday":{"start":"","end":"","available":false},"sunday":{"start":"","end":"","available":false}}');

-- Insertar pacientes de ejemplo
INSERT IGNORE INTO patients (name, email, phone, age, gender, address, emergency_contact, emergency_phone, medical_history, allergies, medications, notes) VALUES
('Juan Pérez García', 'juan.perez@email.com', '+52 55 1111 2222', 35, 'masculino', 'Av. Insurgentes 123, Col. Roma, CDMX', 'María Pérez', '+52 55 3333 4444', 'Hipertensión controlada', 'Ninguna conocida', 'Losartán 50mg', 'Paciente regular'),
('Ana Martínez López', 'ana.martinez@email.com', '+52 55 5555 6666', 28, 'femenino', 'Calle Reforma 456, Col. Juárez, CDMX', 'Carlos Martínez', '+52 55 7777 8888', 'Ninguna', 'Polen', 'Ninguna', 'Primera consulta'),
('Carlos Rodríguez Sánchez', 'carlos.rodriguez@email.com', '+52 55 9999 0000', 42, 'masculino', 'Av. Universidad 789, Col. Del Valle, CDMX', 'Laura Rodríguez', '+52 55 1234 5678', 'Diabetes tipo 2', 'Penicilina', 'Metformina 850mg', 'Control mensual'),
('María González Hernández', 'maria.gonzalez@email.com', '+52 55 2468 1357', 31, 'femenino', 'Calle Madero 321, Col. Centro, CDMX', 'José González', '+52 55 9876 5432', 'Ninguna', 'Mariscos', 'Vitaminas prenatales', 'Embarazo de 20 semanas'),
('Pedro Jiménez Morales', 'pedro.jimenez@email.com', '+52 55 1357 2468', 55, 'masculino', 'Av. Patriotismo 654, Col. San Pedro, CDMX', 'Carmen Jiménez', '+52 55 5432 1098', 'Artritis reumatoide', 'Aspirina', 'Metotrexato', 'Seguimiento reumatológico');
EOF

    if [ $? -eq 0 ]; then
        log_success "✅ Datos de ejemplo insertados"
    else
        log_warning "⚠️  Algunos datos de ejemplo no se pudieron insertar (puede ser normal si ya existen)"
    fi
    
    return 0
}

# Función para actualizar configuración PHP
update_php_config() {
    log_info "🔧 Actualizando configuración de PHP..."
    
    cat > "$DEPLOY_PATH/api/config.php" << EOF
<?php
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
\$host = '$DB_HOST';
\$username = '$DB_USER';
\$password = '$DB_PASSWORD';
\$database = '$DB_NAME';

function getDatabase() {
    global \$host, \$username, \$password, \$database;
    
    try {
        \$pdo = new PDO("mysql:host=\$host;dbname=\$database;charset=utf8mb4", \$username, \$password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        
        // Configurar zona horaria en MySQL
        \$pdo->exec("SET time_zone = '-06:00'");
        
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
    
    \$logEntry = "[\$timestamp] \$ip | \$method \$endpoint | Status: \$status | \$message | \$userAgent\\n";
    
    // Limitar el tamaño del archivo de log
    if (file_exists(\$logFile) && filesize(\$logFile) > 5 * 1024 * 1024) { // 5MB
        // Crear archivo de respaldo
        rename(\$logFile, \$logFile . '.' . date('Ymd-His') . '.bak');
    }
    
    file_put_contents(\$logFile, \$logEntry, FILE_APPEND);
}
?>
EOF

    log_success "✅ Configuración PHP actualizada"
}

# Verificar dependencias del sistema
check_dependencies() {
    log_step "Verificando dependencias del sistema..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js no está instalado. Por favor instala Node.js 18+ primero."
        echo "Puedes instalarlo con:"
        echo "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
        echo "sudo apt-get install -y nodejs"
        exit 1
    fi
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        log_error "npm no está instalado. Por favor instala npm primero."
        exit 1
    fi
    
    # Verificar MySQL
    if ! command -v mysql &> /dev/null; then
        log_error "MySQL client no está instalado. Por favor instala mysql-client primero."
        echo "Puedes instalarlo con: sudo apt-get install mysql-client"
        exit 1
    fi
    
    # Verificar Apache
    if ! systemctl is-active --quiet apache2; then
        log_warning "Apache2 no está ejecutándose. Intentando iniciarlo..."
        sudo systemctl start apache2 || {
            log_error "No se pudo iniciar Apache2. Por favor instala y configura Apache2."
            exit 1
        }
    fi
    
    log_success "✅ Todas las dependencias están disponibles"
}

# Función principal
main() {
    echo "🏥 =============================================="
    echo "🏥    CLÍNICA DELUX - DEPLOY INTERACTIVO"
    echo "🏥 =============================================="
    echo ""
    
    # Verificar dependencias
    check_dependencies
    
    # Solicitar credenciales de MySQL
    ask_mysql_credentials
    
    # Probar conexión MySQL
    if ! test_mysql_connection; then
        echo ""
        log_warning "No se pudo conectar a MySQL con las credenciales proporcionadas."
        read -p "¿Deseas continuar sin configurar la base de datos? (y/N): " skip_db
        if [[ $skip_db =~ ^[Yy]$ ]]; then
            SKIP_DB_SETUP=true
            log_warning "⚠️  Saltando configuración de base de datos. Deberás configurarla manualmente."
        else
            log_error "Deploy cancelado. Verifica las credenciales de MySQL."
            exit 1
        fi
    fi
    
    # Limpiar directorio anterior
    log_step "Preparando directorio de deploy..."
    if [ -d "$DEPLOY_PATH" ]; then
        log_info "🧹 Limpiando directorio anterior..."
        sudo rm -rf "$DEPLOY_PATH"
    fi
    
    # Crear directorio
    sudo mkdir -p "$DEPLOY_PATH"
    sudo chown $USER:$USER "$DEPLOY_PATH"
    
    # Limpiar build anterior
    log_info "🧹 Limpiando build anterior..."
    rm -rf dist
    
    # Instalar dependencias
    log_step "Instalando dependencias de Node.js..."
    npm install
    
    # Construir aplicación
    log_step "Construyendo aplicación para producción..."
    npm run build
    
    if [ ! -d "dist" ]; then
        log_error "❌ Error: No se pudo construir la aplicación"
        exit 1
    fi
    
    log_success "✅ Aplicación construida exitosamente"
    
    # Copiar archivos
    log_step "Copiando archivos al servidor..."
    cp -r dist/* "$DEPLOY_PATH/"
    cp -r public/api "$DEPLOY_PATH/"
    cp public/.htaccess "$DEPLOY_PATH/"
    cp public/manifest.json "$DEPLOY_PATH/" 2>/dev/null || log_warning "manifest.json no encontrado"
    cp public/sw.js "$DEPLOY_PATH/" 2>/dev/null || log_warning "sw.js no encontrado"
    
    # Copiar iconos si existen
    if [ -d "public/icons" ]; then
        cp -r public/icons "$DEPLOY_PATH/"
    else
        log_warning "Directorio de iconos no encontrado"
    fi
    
    # Configurar base de datos si no se saltó
    if [ "$SKIP_DB_SETUP" = false ]; then
        setup_database
        update_php_config
    else
        log_warning "⚠️  Configuración de base de datos saltada"
        log_info "📝 Para configurar manualmente:"
        echo "   1. Crea la base de datos: $DB_NAME"
        echo "   2. Ejecuta las migraciones SQL del directorio supabase/migrations/"
        echo "   3. Actualiza $DEPLOY_PATH/api/config.php con las credenciales correctas"
    fi
    
    # Configurar permisos
    log_step "Configurando permisos..."
    sudo chown -R www-data:www-data "$DEPLOY_PATH"
    sudo chmod -R 755 "$DEPLOY_PATH"
    sudo chmod -R 777 "$DEPLOY_PATH/api" # Permisos de escritura para logs
    
    # Habilitar módulos de Apache necesarios
    log_step "Configurando Apache..."
    sudo a2enmod rewrite headers expires 2>/dev/null || log_warning "Algunos módulos de Apache ya estaban habilitados"
    sudo systemctl reload apache2
    
    # Mostrar resumen final
    echo ""
    echo "🎉 =============================================="
    echo "🎉    ¡DEPLOY COMPLETADO EXITOSAMENTE!"
    echo "🎉 =============================================="
    echo ""
    log_success "📁 Archivos desplegados en: $DEPLOY_PATH"
    log_success "🌐 URL del sistema: http://$(hostname -I | awk '{print $1}')/Clinica-delux/"
    echo ""
    
    if [ "$SKIP_DB_SETUP" = false ]; then
        echo "🔑 CREDENCIALES DE ACCESO:"
        echo "   👤 Usuario: admin"
        echo "   🔐 Contraseña: password"
        echo ""
        echo "   👤 Usuario: gerente"
        echo "   🔐 Contraseña: password"
        echo ""
        echo "   👤 Usuario: profesional1"
        echo "   🔐 Contraseña: password"
        echo ""
        echo "   👤 Usuario: recepcion"
        echo "   🔐 Contraseña: password"
        echo ""
        log_warning "⚠️  IMPORTANTE: Cambia las contraseñas después del primer login"
    else
        echo "⚠️  CONFIGURACIÓN PENDIENTE:"
        echo "   1. Configura la base de datos manualmente"
        echo "   2. Actualiza las credenciales en $DEPLOY_PATH/api/config.php"
        echo "   3. Ejecuta las migraciones SQL"
    fi
    
    echo ""
    echo "📋 PRÓXIMOS PASOS:"
    echo "   1. Configura un Virtual Host en Apache (opcional)"
    echo "   2. Configura SSL/HTTPS para producción"
    echo "   3. Configura el envío de emails en Configuración"
    echo "   4. Realiza un backup de la base de datos"
    echo ""
    log_success "🚀 ¡Tu sistema de gestión médica está listo para usar!"
}

# Ejecutar función principal
main "$@"