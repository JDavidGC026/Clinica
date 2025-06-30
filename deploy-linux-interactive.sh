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
    
    # Actualizar configuración PHP
    update_php_config
    
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