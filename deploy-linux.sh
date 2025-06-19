#!/bin/bash

# =====================================================
# Script de Despliegue para Linux - Clínica Delux
# Versión: 1.0.0
# Descripción: Despliega la aplicación en cualquier entorno Linux con Apache
# =====================================================

set -e  # Salir si cualquier comando falla

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con colores
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Verificar si el script se ejecuta como root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_warning "Este script se está ejecutando como root. Se recomienda ejecutarlo como usuario normal."
        read -p "¿Desea continuar? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Verificar dependencias del sistema
check_dependencies() {
    print_header "Verificando Dependencias del Sistema"
    
    local missing_deps=()
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("nodejs")
    else
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -lt 18 ]; then
            print_error "Node.js versión 18 o superior requerida. Versión actual: $(node --version)"
            missing_deps+=("nodejs (versión 18+)")
        else
            print_message "Node.js $(node --version) ✓"
        fi
    fi
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    else
        print_message "npm $(npm --version) ✓"
    fi
    
    # Verificar MySQL
    if ! command -v mysql &> /dev/null; then
        missing_deps+=("mysql-client")
    else
        print_message "MySQL Client ✓"
    fi
    
    # Verificar Apache
    if ! command -v apache2 &> /dev/null && ! command -v httpd &> /dev/null; then
        missing_deps+=("apache2")
    else
        if command -v apache2 &> /dev/null; then
            print_message "Apache2 ✓"
        elif command -v httpd &> /dev/null; then
            print_message "Apache (httpd) ✓"
        fi
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Dependencias faltantes: ${missing_deps[*]}"
        print_message "Instale las dependencias faltantes y ejecute el script nuevamente."
        
        # Sugerir comandos de instalación según la distribución
        if command -v apt-get &> /dev/null; then
            print_message "Para Ubuntu/Debian, ejecute:"
            echo "sudo apt-get update"
            echo "sudo apt-get install nodejs npm mysql-client apache2 php libapache2-mod-php php-mysql"
        elif command -v yum &> /dev/null; then
            print_message "Para CentOS/RHEL, ejecute:"
            echo "sudo yum install nodejs npm mysql httpd php php-mysql"
        elif command -v dnf &> /dev/null; then
            print_message "Para Fedora, ejecute:"
            echo "sudo dnf install nodejs npm mysql httpd php php-mysql"
        fi
        
        exit 1
    fi
}

# Solicitar credenciales de MySQL
get_mysql_credentials() {
    print_header "Configuración de Base de Datos MySQL"
    
    echo "Ingrese las credenciales de MySQL existentes:"
    read -p "Host de MySQL (default: localhost): " MYSQL_HOST
    MYSQL_HOST=${MYSQL_HOST:-localhost}
    
    read -p "Puerto de MySQL (default: 3306): " MYSQL_PORT
    MYSQL_PORT=${MYSQL_PORT:-3306}
    
    read -p "Usuario de MySQL: " MYSQL_USER
    while [[ -z "$MYSQL_USER" ]]; do
        print_error "El usuario de MySQL es requerido"
        read -p "Usuario de MySQL: " MYSQL_USER
    done
    
    read -s -p "Contraseña de MySQL: " MYSQL_PASSWORD
    echo
    while [[ -z "$MYSQL_PASSWORD" ]]; do
        print_error "La contraseña de MySQL es requerida"
        read -s -p "Contraseña de MySQL: " MYSQL_PASSWORD
        echo
    done
    
    read -p "Nombre de la base de datos (default: clinica_delux): " MYSQL_DATABASE
    MYSQL_DATABASE=${MYSQL_DATABASE:-clinica_delux}
}

# Verificar conexión a MySQL
test_mysql_connection() {
    print_header "Verificando Conexión a MySQL"
    
    if mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT 1;" &> /dev/null; then
        print_message "Conexión a MySQL exitosa ✓"
    else
        print_error "No se pudo conectar a MySQL con las credenciales proporcionadas"
        exit 1
    fi
}

# Crear base de datos
create_database() {
    print_header "Creando Base de Datos"
    
    print_message "Creando base de datos '$MYSQL_DATABASE'..."
    mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS \`$MYSQL_DATABASE\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        print_message "Base de datos '$MYSQL_DATABASE' creada exitosamente ✓"
    else
        print_error "Error al crear la base de datos"
        exit 1
    fi
}

# Ejecutar migraciones de base de datos
run_migrations() {
    print_header "Ejecutando Migraciones de Base de Datos"
    
    # Buscar archivos SQL en el directorio supabase/migrations
    if [ -d "supabase/migrations" ]; then
        print_message "Ejecutando migraciones SQL..."
        
        for sql_file in supabase/migrations/*.sql; do
            if [ -f "$sql_file" ]; then
                print_message "Ejecutando: $(basename "$sql_file")"
                mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < "$sql_file"
                
                if [ $? -eq 0 ]; then
                    print_message "✓ $(basename "$sql_file") ejecutado exitosamente"
                else
                    print_error "Error ejecutando $(basename "$sql_file")"
                    exit 1
                fi
            fi
        done
    else
        print_warning "No se encontró el directorio de migraciones."
    fi
}

# Instalar dependencias de Node.js
install_dependencies() {
    print_header "Instalando Dependencias de Node.js"
    
    if [ ! -f "package.json" ]; then
        print_error "No se encontró package.json en el directorio actual"
        exit 1
    fi
    
    print_message "Instalando dependencias..."
    npm install
    
    if [ $? -eq 0 ]; then
        print_message "Dependencias instaladas exitosamente ✓"
    else
        print_error "Error al instalar dependencias"
        exit 1
    fi
}

# Construir la aplicación
build_application() {
    print_header "Construyendo Aplicación"
    
    print_message "Ejecutando build de producción..."
    npm run build
    
    if [ $? -eq 0 ]; then
        print_message "Build completado exitosamente ✓"
    else
        print_error "Error en el build de la aplicación"
        exit 1
    fi
}

# Configurar archivos PHP
configure_php_files() {
    print_header "Configurando Archivos PHP"
    
    if [ -d "public/api" ]; then
        print_message "Configurando archivos PHP con credenciales de MySQL..."
        
        # Crear archivo de configuración PHP
        cat > public/api/config.php << EOF
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

// Configuración de base de datos
\$host = '$MYSQL_HOST';
\$username = '$MYSQL_USER';
\$password = '$MYSQL_PASSWORD';
\$database = '$MYSQL_DATABASE';

function getDatabase() {
    global \$host, \$username, \$password, \$database;
    
    try {
        \$pdo = new PDO("mysql:host=\$host;dbname=\$database;charset=utf8mb4", \$username, \$password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        return \$pdo;
    } catch (PDOException \$e) {
        throw new Exception('Database connection failed: ' . \$e->getMessage());
    }
}

function sendResponse(\$data, \$status = 200) {
    http_response_code(\$status);
    echo json_encode(\$data);
    exit();
}

function sendError(\$message, \$status = 500) {
    http_response_code(\$status);
    echo json_encode(['error' => \$message]);
    exit();
}

function getRequestData() {
    \$input = file_get_contents('php://input');
    return json_decode(\$input, true) ?? [];
}
?>
EOF
        
        print_message "Archivo config.php configurado ✓"
    else
        print_warning "No se encontró el directorio public/api"
    fi
}

# Configurar servidor web Apache
configure_apache() {
    print_header "Configuración del Servidor Apache"
    
    DEPLOY_DIR="/var/www/clinica-delux"
    
    print_message "Directorio de despliegue: $DEPLOY_DIR"
    
    # Crear directorio de despliegue
    sudo mkdir -p "$DEPLOY_DIR"
    
    # Copiar archivos del build
    print_message "Copiando archivos de la aplicación..."
    sudo cp -r dist/* "$DEPLOY_DIR/"
    
    # Copiar archivos PHP si existen
    if [ -d "public/api" ]; then
        sudo cp -r public/api "$DEPLOY_DIR/"
        print_message "Archivos PHP copiados ✓"
    fi
    
    # Copiar .htaccess si existe
    if [ -f "public/.htaccess" ]; then
        sudo cp public/.htaccess "$DEPLOY_DIR/"
        print_message "Archivo .htaccess copiado ✓"
    else
        # Crear .htaccess básico para SPA
        cat > /tmp/clinica-delux.htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [L]
</IfModule>

<IfModule mod_headers.c>
  Header set X-Powered-By "Clínica Delux"
</IfModule>

# Configuración de seguridad
<IfModule mod_headers.c>
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-XSS-Protection "1; mode=block"
  Header always set X-Content-Type-Options "nosniff"
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
</IfModule>
EOF
        sudo mv /tmp/clinica-delux.htaccess "$DEPLOY_DIR/.htaccess"
        print_message "Archivo .htaccess creado ✓"
    fi
    
    # Configurar permisos
    sudo chown -R www-data:www-data "$DEPLOY_DIR" 2>/dev/null || sudo chown -R apache:apache "$DEPLOY_DIR" 2>/dev/null
    sudo chmod -R 755 "$DEPLOY_DIR"
    
    print_message "Archivos copiados y permisos configurados ✓"
    
    # Habilitar módulos de Apache necesarios
    print_message "Habilitando módulos de Apache..."
    sudo a2enmod rewrite headers expires 2>/dev/null || print_warning "No se pudieron habilitar algunos módulos (puede que ya estén habilitados)"
    
    print_message "Configuración de Apache completada ✓"
    print_warning "NOTA: No se modificó la configuración de virtual hosts de Apache."
    print_warning "La aplicación está disponible en: $DEPLOY_DIR"
    print_warning "Configure su virtual host de Apache para apuntar a este directorio."
}

# Función principal
main() {
    print_header "Despliegue de Clínica Delux - Sistema de Gestión"
    
    # Verificar que estamos en el directorio correcto
    if [ ! -f "package.json" ]; then
        print_error "Este script debe ejecutarse desde el directorio raíz del proyecto"
        exit 1
    fi
    
    check_root
    check_dependencies
    get_mysql_credentials
    test_mysql_connection
    create_database
    run_migrations
    install_dependencies
    build_application
    configure_php_files
    configure_apache
    
    print_header "¡Despliegue Completado Exitosamente!"
    
    echo
    print_message "La aplicación ha sido desplegada en: $DEPLOY_DIR"
    print_message "Base de datos configurada: $MYSQL_DATABASE"
    print_message "Zona horaria configurada: Ciudad de México (GMT-6)"
    echo
    print_message "Credenciales de prueba:"
    echo "  - Admin: admin / admin123"
    echo "  - Gerente: gerente / gerente123"
    echo "  - Profesional: profesional1 / prof123"
    echo "  - Recepción: recepcion / rec123"
    echo
    print_message "Datos de prueba incluidos:"
    echo "  - 10 disciplinas médicas"
    echo "  - 4 profesionales de ejemplo"
    echo "  - 5 pacientes de prueba"
    echo "  - 5 citas programadas"
    echo
    print_warning "IMPORTANTE:"
    print_warning "1. Configure su virtual host de Apache para apuntar a $DEPLOY_DIR"
    print_warning "2. Cambie las credenciales por defecto en producción"
    print_warning "3. Configure HTTPS para un entorno de producción"
    print_warning "4. El sistema prioriza MySQL y usa localStorage solo como respaldo"
}

# Ejecutar función principal
main "$@"