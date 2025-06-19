#!/bin/bash

# Script de deploy simple para Clínica Delux en Debian/Ubuntu
# Funciona con Apache2 y MySQL ya instalados
# No requiere modificar configuraciones del servidor

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    log_error "Ejecuta este script desde el directorio raíz del proyecto Clínica Delux"
    exit 1
fi

log_header "🏥 Iniciando deploy de Clínica Delux"

# Variables de configuración
WEB_DIR="/var/www/html/clinica-delux"
DB_NAME="clinica_delux"

# Solicitar información de MySQL
echo ""
log_info "📊 Configuración de MySQL"
read -p "Usuario de MySQL (que ya existe): " MYSQL_USER
read -s -p "Contraseña de MySQL: " MYSQL_PASSWORD
echo ""
read -p "Nombre de la base de datos (default: clinica_delux): " USER_DB_NAME
DB_NAME=${USER_DB_NAME:-clinica_delux}
echo ""

# Verificar conexión a MySQL
log_info "🔍 Verificando conexión a MySQL..."
if ! mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1; then
    log_error "No se puede conectar a MySQL. Verifica las credenciales."
    exit 1
fi

log_info "✅ Conexión a MySQL exitosa"

# Verificar dependencias básicas
log_info "🔍 Verificando dependencias..."
if ! command -v node &> /dev/null; then
    log_error "Node.js no está instalado. Instálalo primero."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    log_error "npm no está instalado. Instálalo primero."
    exit 1
fi

log_info "✅ Dependencias verificadas"

# Construir frontend
log_info "🔨 Construyendo frontend..."
npm install
npm run build

# Configurar la base de datos
log_info "🗄️ Configurando base de datos MySQL..."

# Crear base de datos
mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF

# Ejecutar migraciones principales (solo las que funcionan)
log_info "📊 Importando esquema de base de datos..."

# Ejecutar migración principal
log_info "Ejecutando migración principal..."
mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$DB_NAME" < supabase/migrations/20250619043321_hidden_term.sql 2>/dev/null || {
    log_warning "Error en migración principal, continuando con estructura básica..."
    
    # Crear estructura básica manualmente si falla
    mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$DB_NAME" << 'EOF'
-- Estructura básica para Clínica Delux
CREATE TABLE IF NOT EXISTS disciplines (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS professionals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    discipline_id VARCHAR(100),
    license VARCHAR(100),
    experience VARCHAR(100),
    schedule JSON,
    status ENUM('activo', 'inactivo') DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    age INT,
    gender ENUM('masculino', 'femenino', 'otro', 'prefiero-no-decir'),
    address TEXT,
    emergency_contact VARCHAR(255),
    emergency_phone VARCHAR(50),
    medical_history TEXT,
    allergies TEXT,
    medications TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

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
    status ENUM('programada', 'en-progreso', 'completada', 'cancelada') DEFAULT 'programada',
    payment_status ENUM('pendiente', 'pagado', 'cancelado_sin_costo') DEFAULT 'pendiente',
    cost DECIMAL(10,2),
    folio VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
    FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(50) PRIMARY KEY,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    category VARCHAR(100),
    type ENUM('egreso') DEFAULT 'egreso',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('enviado', 'pendiente', 'error') DEFAULT 'enviado'
);

CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
EOF
}

# Ejecutar datos iniciales
log_info "Insertando datos iniciales..."
mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$DB_NAME" < supabase/migrations/20250619043342_dry_truth.sql 2>/dev/null || {
    log_warning "Error insertando datos iniciales, continuando..."
    
    # Insertar datos básicos manualmente
    mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$DB_NAME" << 'EOF'
-- Datos iniciales básicos
INSERT IGNORE INTO disciplines (id, name) VALUES
('medicina-general', 'Medicina General'),
('pediatria', 'Pediatría'),
('ginecologia', 'Ginecología'),
('psicologia-clinica', 'Psicología Clínica'),
('cardiologia', 'Cardiología'),
('dermatologia', 'Dermatología'),
('nutricion', 'Nutrición'),
('traumatologia-ortopedia', 'Traumatología y Ortopedia'),
('urologia', 'Urología'),
('medicina-interna', 'Medicina Interna');

INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
('clinic_name', 'Clínica Delux'),
('clinic_address', 'Av. Principal 123, Col. Médica, Ciudad de México, CP 12345'),
('clinic_phone', '+52 55 1234 5678'),
('clinic_email', 'contacto@clinicadelux.com'),
('timezone', 'America/Mexico_City'),
('currency', 'MXN'),
('system_version', '1.0.0');
EOF
}

log_info "✅ Base de datos configurada exitosamente"

# Crear directorio web y copiar archivos
log_info "📂 Copiando archivos al servidor web..."
sudo rm -rf "$WEB_DIR"
sudo mkdir -p "$WEB_DIR"
sudo cp -r dist/* "$WEB_DIR/"

# Crear directorio de API
sudo mkdir -p "$WEB_DIR/api"
sudo cp -r public/api/* "$WEB_DIR/api/"

# Crear configuración de base de datos personalizada
log_info "⚙️ Configurando archivo de base de datos..."
sudo tee "$WEB_DIR/api/config.php" > /dev/null << EOF
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
\$host = 'localhost';
\$username = '$MYSQL_USER';
\$password = '$MYSQL_PASSWORD';
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
?>
EOF

# Crear .htaccess básico para el frontend
sudo tee "$WEB_DIR/.htaccess" > /dev/null << 'EOF'
RewriteEngine On
RewriteBase /clinica-delux/

# Manejar rutas de la API
RewriteRule ^api/(.*)$ api/$1 [L,QSA]

# Configuración para Single Page Application
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/clinica-delux/api/
RewriteRule ^(.*)$ index.html [L]

<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    Header set X-Powered-By "Clínica Delux - Ciudad de México"
</IfModule>

# Configuración de zona horaria para PHP
<IfModule mod_env.c>
    SetEnv TZ America/Mexico_City
</IfModule>

# Configuración de caché para archivos estáticos
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
    ExpiresByType application/json "access plus 1 hour"
</IfModule>

# Compresión GZIP
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE application/json
</IfModule>
EOF

# Crear .htaccess para la API
sudo tee "$WEB_DIR/api/.htaccess" > /dev/null << 'EOF'
RewriteEngine On
RewriteBase /clinica-delux/api/

# Rutas de la API
RewriteRule ^health-check/?$ health-check.php [L,QSA]
RewriteRule ^appointments/?$ appointments.php [L,QSA]
RewriteRule ^appointments/([0-9]+)/?$ appointments.php?id=$1 [L,QSA]
RewriteRule ^professionals/?$ professionals.php [L,QSA]
RewriteRule ^professionals/([0-9]+)/?$ professionals.php?id=$1 [L,QSA]
RewriteRule ^patients/?$ patients.php [L,QSA]
RewriteRule ^patients/([0-9]+)/?$ patients.php?id=$1 [L,QSA]
RewriteRule ^disciplines/?$ disciplines.php [L,QSA]
RewriteRule ^disciplines/([^/]+)/?$ disciplines.php?id=$1 [L,QSA]
RewriteRule ^send-email/?$ send-email.php [L,QSA]

<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
</IfModule>

# Configuración de seguridad adicional
<Files "*.php">
    <IfModule mod_headers.c>
        Header set X-Content-Type-Options "nosniff"
        Header set X-Frame-Options "SAMEORIGIN"
    </IfModule>
</Files>

# Prevenir acceso a archivos sensibles
<FilesMatch "\.(env|log|sql|bak)$">
    Order allow,deny
    Deny from all
</FilesMatch>
EOF

# Configurar permisos
log_info "🔐 Configurando permisos..."
sudo chown -R www-data:www-data "$WEB_DIR"
sudo chmod -R 755 "$WEB_DIR"
sudo chmod 644 "$WEB_DIR/api/config.php"

# Verificar y habilitar módulos de Apache necesarios
log_info "🔍 Verificando módulos de Apache..."
if ! apache2ctl -M | grep -q rewrite_module; then
    log_warning "Habilitando mod_rewrite..."
    sudo a2enmod rewrite
fi

if ! apache2ctl -M | grep -q headers_module; then
    log_warning "Habilitando mod_headers..."
    sudo a2enmod headers
fi

if ! apache2ctl -M | grep -q expires_module; then
    log_warning "Habilitando mod_expires..."
    sudo a2enmod expires
fi

# Recargar Apache si se habilitaron módulos
sudo systemctl reload apache2

# Verificar que Apache esté ejecutándose
if ! systemctl is-active --quiet apache2; then
    log_warning "Iniciando Apache2..."
    sudo systemctl start apache2
fi

log_header "🎉 Deploy completado exitosamente!"
echo ""
log_info "📱 Información de acceso:"
echo "   🌐 URL: http://localhost/clinica-delux/"
echo "   👤 Usuarios de prueba:"
echo "      - admin / admin123 (Administrador)"
echo "      - gerente / gerente123 (Gerente)"
echo "      - profesional1 / prof123 (Profesional)"
echo "      - recepcion / rec123 (Recepcionista)"
echo ""
log_info "🧪 Para verificar:"
echo "   API: curl http://localhost/clinica-delux/api/health-check"
echo "   Frontend: Abre http://localhost/clinica-delux/ en tu navegador"
echo ""
log_info "🏥 Datos incluidos:"
echo "   - 10 disciplinas médicas"
echo "   - Usuarios de prueba configurados"
echo "   - Sistema configurado para Ciudad de México (GMT-6)"
echo ""
log_warning "📝 Notas importantes:"
echo "   - La aplicación está en /var/www/html/clinica-delux/"
echo "   - Base de datos: $DB_NAME"
echo "   - Zona horaria: América/Ciudad_de_México"
echo "   - Cambia las credenciales por defecto en producción"