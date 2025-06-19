# Clínica Delux - Sistema de Gestión Médica

Sistema integral de gestión para clínicas médicas desarrollado específicamente para **Clínica Delux** en Ciudad de México, México.

## 🏥 Características Principales

- **Gestión de Citas**: Programación, seguimiento y administración completa de citas médicas
- **Gestión de Pacientes**: Registro completo con historial médico, alergias y medicamentos
- **Gestión de Profesionales**: Administración de médicos y especialistas con horarios personalizados
- **Portal del Profesional**: Interfaz dedicada para médicos con notas clínicas y generación de recetas
- **Sistema Financiero**: Control de ingresos, egresos y reportes financieros
- **Notificaciones por Email**: Templates profesionales para confirmaciones y recordatorios
- **Reportes en PDF**: Generación de reportes médicos y administrativos
- **PWA**: Aplicación web progresiva que funciona offline

## 🇲🇽 Configuración Regional

- **Zona Horaria**: América/Ciudad_de_México (GMT-6)
- **Idioma**: Español (México)
- **Moneda**: Peso Mexicano (MXN)
- **Formato de Fecha**: DD/MM/AAAA
- **Localización**: Ciudad de México, México

## 🚀 Tecnologías

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion
- **Backend**: PHP 8+ con MySQL
- **Base de Datos**: MySQL 8.0+ (con fallback a localStorage)
- **Servidor Web**: Apache 2.4+
- **PWA**: Service Worker, Web App Manifest

## 📋 Requisitos del Sistema

### Servidor
- **SO**: Linux (Ubuntu 20.04+, CentOS 8+, Debian 11+)
- **Servidor Web**: Apache 2.4+ con mod_rewrite habilitado
- **PHP**: 8.0 o superior con extensiones: mysqli, pdo_mysql, json
- **MySQL**: 8.0 o superior
- **Node.js**: 18.0 o superior (solo para build)
- **npm**: 9.0 o superior (solo para build)

### Cliente
- **Navegadores**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Resolución**: Mínima 1024x768 (responsive hasta 320px)
- **JavaScript**: Habilitado

## 🛠️ Instalación Automática

### Usando el Script de Despliegue (Recomendado)

```bash
# 1. Clonar o descargar el proyecto
git clone [URL_DEL_REPOSITORIO] clinica-delux
cd clinica-delux

# 2. Dar permisos de ejecución al script
chmod +x deploy-linux.sh

# 3. Ejecutar el script de despliegue
./deploy-linux.sh
```

El script automáticamente:
- ✅ Verifica dependencias del sistema
- ✅ Solicita credenciales de MySQL
- ✅ Crea la base de datos y ejecuta migraciones
- ✅ Instala dependencias de Node.js
- ✅ Construye la aplicación para producción
- ✅ Configura archivos PHP con las credenciales
- ✅ Despliega en `/var/www/clinica-delux`
- ✅ Configura permisos de Apache

## 🔧 Instalación Manual

### 1. Preparar el Entorno

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install nodejs npm mysql-server apache2 php libapache2-mod-php php-mysql

# CentOS/RHEL
sudo yum install nodejs npm mysql-server httpd php php-mysql

# Habilitar módulos de Apache
sudo a2enmod rewrite headers expires
sudo systemctl restart apache2
```

### 2. Configurar MySQL

```bash
# Conectar a MySQL
mysql -u root -p

# Crear base de datos
CREATE DATABASE clinica_delux CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Crear usuario (opcional)
CREATE USER 'clinica_user'@'localhost' IDENTIFIED BY 'password_seguro';
GRANT ALL PRIVILEGES ON clinica_delux.* TO 'clinica_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Ejecutar Migraciones

```bash
# Ejecutar archivos SQL en orden
mysql -u root -p clinica_delux < supabase/migrations/20250619043321_hidden_term.sql
mysql -u root -p clinica_delux < supabase/migrations/20250619043342_dry_truth.sql
mysql -u root -p clinica_delux < supabase/migrations/20250619043412_rough_butterfly.sql
mysql -u root -p clinica_delux < supabase/migrations/20250619043420_divine_wind.sql
```

### 4. Construir la Aplicación

```bash
# Instalar dependencias
npm install

# Construir para producción
npm run build
```

### 5. Configurar Apache

```bash
# Copiar archivos al directorio web
sudo cp -r dist/* /var/www/clinica-delux/
sudo cp -r public/api /var/www/clinica-delux/
sudo cp public/.htaccess /var/www/clinica-delux/

# Configurar permisos
sudo chown -R www-data:www-data /var/www/clinica-delux
sudo chmod -R 755 /var/www/clinica-delux
```

### 6. Configurar Credenciales

Editar `/var/www/clinica-delux/api/config.php`:

```php
$host = 'localhost';
$username = 'tu_usuario_mysql';
$password = 'tu_password_mysql';
$database = 'clinica_delux';
```

## 👥 Usuarios de Prueba

El sistema incluye usuarios predefinidos para pruebas:

| Usuario | Contraseña | Rol | Permisos |
|---------|------------|-----|----------|
| `admin` | `admin123` | Administrador | Acceso completo |
| `gerente` | `gerente123` | Gerente | Gestión operativa |
| `profesional1` | `prof123` | Profesional | Portal médico |
| `recepcion` | `rec123` | Recepcionista | Citas y pacientes |

## 📊 Datos de Prueba Incluidos

- **10 Disciplinas Médicas**: Medicina General, Pediatría, Cardiología, etc.
- **4 Profesionales**: Médicos con horarios y especialidades configuradas
- **5 Pacientes**: Perfiles completos con historial médico
- **5 Citas**: Programadas para los próximos días

## 🔒 Configuración de Seguridad

### Producción
1. **Cambiar contraseñas por defecto**
2. **Configurar HTTPS** con certificado SSL
3. **Configurar firewall** (puertos 80, 443, 22)
4. **Actualizar credenciales** de base de datos
5. **Configurar backups** automáticos

### Variables de Entorno
```bash
# Crear archivo .env (opcional)
DB_HOST=localhost
DB_USER=clinica_user
DB_PASSWORD=password_seguro
DB_NAME=clinica_delux
```

## 📱 Funcionalidades PWA

- **Instalación**: Se puede instalar como app nativa
- **Offline**: Funciona sin conexión usando localStorage
- **Notificaciones**: Push notifications (configurables)
- **Responsive**: Optimizada para móviles y tablets

## 🌐 Configuración de Virtual Host

Ejemplo para Apache:

```apache
<VirtualHost *:80>
    ServerName clinica-delux.local
    DocumentRoot /var/www/clinica-delux
    
    <Directory /var/www/clinica-delux>
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/clinica-delux_error.log
    CustomLog ${APACHE_LOG_DIR}/clinica-delux_access.log combined
</VirtualHost>
```

## 🔄 Sistema Híbrido MySQL + localStorage

El sistema está diseñado para:
1. **Priorizar MySQL** cuando esté disponible
2. **Usar localStorage** como respaldo automático
3. **Sincronización transparente** entre ambos sistemas
4. **Sin interrupciones** en el servicio

## 📞 Soporte y Mantenimiento

### Logs del Sistema
- **Apache**: `/var/log/apache2/clinica-delux_error.log`
- **PHP**: `/var/log/php_errors.log`
- **MySQL**: `/var/log/mysql/error.log`

### Comandos Útiles
```bash
# Verificar estado de servicios
sudo systemctl status apache2 mysql

# Reiniciar servicios
sudo systemctl restart apache2 mysql

# Ver logs en tiempo real
sudo tail -f /var/log/apache2/clinica-delux_error.log

# Backup de base de datos
mysqldump -u root -p clinica_delux > backup_$(date +%Y%m%d).sql
```

## 📈 Monitoreo y Rendimiento

- **Health Check**: `/api/health-check.php`
- **Métricas**: Tiempo de carga, conexiones DB
- **Alertas**: Configurables para fallos de sistema

## 🆕 Actualizaciones

Para actualizar el sistema:
1. Hacer backup de la base de datos
2. Ejecutar `npm run build`
3. Copiar nuevos archivos a `/var/www/clinica-delux`
4. Ejecutar nuevas migraciones si las hay

---

**Clínica Delux** - Sistema de Gestión Médica  
📍 Ciudad de México, México  
🕐 Zona Horaria: GMT-6  
🇲🇽 Localización: es-MX