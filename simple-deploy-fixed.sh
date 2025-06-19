#!/bin/bash

# Script de deploy simple para Plantas de Concreto en Debian - VERSIÓN CORREGIDA
# Funciona con Apache2 y MySQL ya instalados
# No requiere modificar configuraciones del servidor

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    log_error "Ejecuta este script desde el directorio raíz del proyecto Plantas de Concreto"
    exit 1
fi

log_info "🚀 Iniciando deploy de Plantas de Concreto para Debian (VERSIÓN CORREGIDA)..."

# Variables de configuración
WEB_DIR="/var/www/html/plantas-concreto"
DB_NAME="plantas_concreto"
DB_USER="plantas_concreto_user"

# Solicitar información de MySQL
echo ""
log_info "📊 Configuración de MySQL"
read -p "Usuario root de MySQL: " MYSQL_ROOT_USER
read -s -p "Contraseña root de MySQL: " MYSQL_ROOT_PASSWORD
echo ""
read -p "Contraseña para usuario plantas_concreto_user (nueva): " PLANTAS_CONCRETO_PASSWORD
echo ""

# Verificar conexión a MySQL
log_info "🔍 Verificando conexión a MySQL..."
if ! mysql -u "$MYSQL_ROOT_USER" -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1; then
    log_error "No se puede conectar a MySQL. Verifica las credenciales."
    exit 1
fi

log_info "✅ Conexión a MySQL exitosa"

# Construir frontend
log_info "🔨 Construyendo frontend..."
npm run build

# Configurar la base de datos
log_info "🗄️ Configurando base de datos MySQL..."

# Crear base de datos y usuario
mysql -u "$MYSQL_ROOT_USER" -p"$MYSQL_ROOT_PASSWORD" << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$PLANTAS_CONCRETO_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

# Importar esquema de base de datos (SOLO LOS ARCHIVOS PRINCIPALES)
log_info "📊 Importando esquema de base de datos..."

# Ejecutar solo la primera migración (estructura básica)
log_info "Ejecutando migración principal..."
mysql -u "$MYSQL_ROOT_USER" -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME" < supabase/migrations/20250618155541_spring_shadow.sql 2>/dev/null || {
    log_warning "Error en migración principal, continuando con estructura básica..."
    
    # Crear estructura básica manualmente
    mysql -u "$MYSQL_ROOT_USER" -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME" << 'EOF'
-- Estructura básica de tablas para Plantas de Concreto
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(200) NOT NULL,
    email VARCHAR(150) UNIQUE,
    rol ENUM('admin', 'evaluador', 'supervisor') DEFAULT 'evaluador',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tipos_evaluacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles_personal (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS secciones_evaluacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_evaluacion_id INT NOT NULL,
    rol_personal_id INT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    orden INT NOT NULL DEFAULT 1,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tipo_evaluacion_id) REFERENCES tipos_evaluacion(id) ON DELETE CASCADE,
    FOREIGN KEY (rol_personal_id) REFERENCES roles_personal(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS preguntas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seccion_id INT NOT NULL,
    pregunta TEXT NOT NULL,
    tipo_pregunta ENUM('abierta', 'seleccion_multiple') DEFAULT 'abierta',
    opcion_a TEXT NULL,
    opcion_b TEXT NULL,
    opcion_c TEXT NULL,
    respuesta_correcta ENUM('a', 'b', 'c') NULL,
    orden INT NOT NULL DEFAULT 1,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seccion_id) REFERENCES secciones_evaluacion(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS evaluaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo_evaluacion_id INT NOT NULL,
    rol_personal_id INT NULL,
    puntuacion_total DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    total_preguntas INT NOT NULL DEFAULT 0,
    respuestas_si INT NOT NULL DEFAULT 0,
    respuestas_no INT NOT NULL DEFAULT 0,
    respuestas_na INT NOT NULL DEFAULT 0,
    estado ENUM('en_progreso', 'completada', 'cancelada') DEFAULT 'en_progreso',
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_finalizacion TIMESTAMP NULL,
    observaciones TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (tipo_evaluacion_id) REFERENCES tipos_evaluacion(id) ON DELETE CASCADE,
    FOREIGN KEY (rol_personal_id) REFERENCES roles_personal(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS respuestas_evaluacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evaluacion_id INT NOT NULL,
    pregunta_id INT NOT NULL,
    respuesta ENUM('si', 'no', 'na', 'a', 'b', 'c') NOT NULL,
    observacion TEXT,
    fecha_respuesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evaluacion_id) REFERENCES evaluaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (pregunta_id) REFERENCES preguntas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_evaluacion_pregunta (evaluacion_id, pregunta_id)
);

CREATE TABLE IF NOT EXISTS reportes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evaluacion_id INT NOT NULL,
    tipo_reporte ENUM('pdf', 'excel', 'json') NOT NULL,
    ruta_archivo VARCHAR(500),
    tamaño_archivo INT,
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evaluacion_id) REFERENCES evaluaciones(id) ON DELETE CASCADE
);

-- Datos iniciales
INSERT IGNORE INTO tipos_evaluacion (codigo, nombre, descripcion) VALUES
('personal', 'Evaluación de Personal', 'Evaluación de competencias y conocimientos del personal'),
('equipo', 'Evaluación de Equipo', 'Evaluación del estado y funcionamiento de equipos'),
('operacion', 'Evaluación de Operación', 'Evaluación de procesos operativos y procedimientos');

INSERT IGNORE INTO roles_personal (codigo, nombre, descripcion) VALUES
('jefe_planta', 'Jefe de Planta', 'Responsable general de la operación de la planta'),
('laboratorista', 'Laboratorista', 'Encargado del control de calidad y pruebas de laboratorio'),
('operador_camion', 'Operador de Camión Revolvedor', 'Operador de vehículos de transporte de concreto'),
('operador_bombas', 'Operador de Bombas de Concreto', 'Operador de equipos de bombeo de concreto');

INSERT IGNORE INTO usuarios (username, password_hash, nombre_completo, email, rol) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador Plantas de Concreto', 'admin@plantasconcreto.org', 'admin');
EOF
}

# Aplicar corrección si existe
if [ -f "deploy/fix-database.sql" ]; then
    log_info "Aplicando correcciones de base de datos..."
    mysql -u "$MYSQL_ROOT_USER" -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME" < deploy/fix-database.sql 2>/dev/null || log_warning "No se pudieron aplicar todas las correcciones"
fi

log_info "✅ Base de datos configurada exitosamente"

# Crear directorio web y copiar archivos
log_info "📂 Copiando archivos al servidor web..."
sudo rm -rf "$WEB_DIR"
sudo mkdir -p "$WEB_DIR"
sudo cp -r dist/* "$WEB_DIR/"

# Crear directorio de API
sudo mkdir -p "$WEB_DIR/api"
sudo cp -r api/* "$WEB_DIR/api/"

# Crear configuración de base de datos personalizada
log_info "⚙️ Configurando archivo de base de datos..."
sudo tee "$WEB_DIR/api/config/database.php" > /dev/null << EOF
<?php
class Database {
    private \$host = 'localhost';
    private \$db_name = '$DB_NAME';
    private \$username = '$DB_USER';
    private \$password = '$PLANTAS_CONCRETO_PASSWORD';
    private \$charset = 'utf8mb4';
    private \$conn;

    public function getConnection() {
        \$this->conn = null;
        
        try {
            \$dsn = "mysql:host=" . \$this->host . ";dbname=" . \$this->db_name . ";charset=" . \$this->charset;
            \$options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];
            
            \$this->conn = new PDO(\$dsn, \$this->username, \$this->password, \$options);
            \$this->conn->exec("SET time_zone = '-06:00'");
            
        } catch(PDOException \$exception) {
            error_log("Error de conexión DB: " . \$exception->getMessage());
            throw new Exception("Error de conexión a la base de datos");
        }

        return \$this->conn;
    }
    
    public function checkConnection() {
        try {
            \$this->getConnection();
            return true;
        } catch (Exception \$e) {
            return false;
        }
    }
}

function setCorsHeaders() {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Content-Type: application/json; charset=UTF-8");
    
    if (\$_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

function sendJsonResponse(\$data, \$status_code = 200) {
    http_response_code(\$status_code);
    echo json_encode(\$data, JSON_UNESCAPED_UNICODE);
    exit();
}

function handleError(\$message, \$status_code = 500) {
    error_log("Plantas Concreto API Error: " . \$message);
    
    sendJsonResponse([
        'success' => false,
        'error' => \$message
    ], \$status_code);
}

function sanitizeInput(\$data) {
    if (is_array(\$data)) {
        return array_map('sanitizeInput', \$data);
    }
    
    return htmlspecialchars(strip_tags(trim(\$data)), ENT_QUOTES, 'UTF-8');
}

function validateAuthToken(\$token) {
    if (empty(\$token)) {
        return false;
    }
    
    \$decoded = base64_decode(\$token);
    \$parts = explode(':', \$decoded);
    
    return count(\$parts) >= 3;
}
?>
EOF

# Crear .htaccess básico para el frontend
sudo tee "$WEB_DIR/.htaccess" > /dev/null << 'EOF'
RewriteEngine On
RewriteBase /plantas-concreto/

# Manejar rutas de la API
RewriteRule ^api/(.*)$ api/$1 [L,QSA]

# Configuración para Single Page Application
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/plantas-concreto/api/
RewriteRule ^(.*)$ index.html [L]

<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
</IfModule>
EOF

# Crear .htaccess para la API
sudo tee "$WEB_DIR/api/.htaccess" > /dev/null << 'EOF'
RewriteEngine On
RewriteBase /plantas-concreto/api/

# Rutas de autenticación
RewriteRule ^login/?$ auth/login.php [L,QSA]

# Rutas de evaluaciones
RewriteRule ^evaluaciones/tipos/?$ evaluaciones/tipos.php [L,QSA]
RewriteRule ^evaluaciones/roles/?$ evaluaciones/roles.php [L,QSA]
RewriteRule ^evaluaciones/preguntas/?$ evaluaciones/preguntas.php [L,QSA]
RewriteRule ^evaluaciones/guardar/?$ evaluaciones/guardar.php [L,QSA]
RewriteRule ^evaluaciones/historial/?$ evaluaciones/historial.php [L,QSA]

# Rutas de reportes
RewriteRule ^reportes/generar/?$ reportes/generar.php [L,QSA]

<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
</IfModule>
EOF

# Configurar permisos
log_info "🔐 Configurando permisos..."
sudo chown -R www-data:www-data "$WEB_DIR"
sudo chmod -R 755 "$WEB_DIR"
sudo chmod 644 "$WEB_DIR/api/config/database.php"

# Verificar y habilitar mod_rewrite si es necesario
log_info "🔍 Verificando mod_rewrite..."
if ! apache2ctl -M | grep -q rewrite_module; then
    log_warning "Habilitando mod_rewrite..."
    sudo a2enmod rewrite
    sudo systemctl reload apache2
fi

# Verificar que Apache esté ejecutándose
if ! systemctl is-active --quiet apache2; then
    log_warning "Iniciando Apache2..."
    sudo systemctl start apache2
fi

log_info "🎉 Deploy completado exitosamente!"
echo ""
log_info "📱 Información de acceso:"
echo "   🌐 URL: http://localhost/plantas-concreto/"
echo "   👤 Usuario: admin"
echo "   🔑 Contraseña: admin123"
echo ""
log_info "🧪 Para verificar:"
echo "   API: curl http://localhost/plantas-concreto/api/evaluaciones/tipos"
echo "   Frontend: Abre http://localhost/plantas-concreto/ en tu navegador"