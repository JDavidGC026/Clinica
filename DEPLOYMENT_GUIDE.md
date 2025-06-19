# Guía de Despliegue en Hostinger

## Pasos para Configurar en Producción

### 1. Preparar el Build
```bash
npm run build
```

### 2. Subir Archivos
1. Sube todo el contenido de la carpeta `dist/` a tu `public_html`
2. Sube la carpeta `public/api/` a `public_html/api/`

### 3. Configurar Base de Datos MySQL

#### Opción A: Usando el Panel de Hostinger
1. Ve al panel de control de Hostinger
2. Crea una nueva base de datos MySQL
3. Anota el usuario, contraseña y nombre de la base de datos

#### Opción B: Usando el script automático
1. Accede a: `https://tu-subdominio.hostinger.com/api/setup-database.php?key=setup_db_2024`
2. Esto creará automáticamente todas las tablas necesarias

### 4. Configurar Variables de Entorno

Edita los archivos PHP en `public_html/api/` y reemplaza:
- `tu_usuario_mysql` con tu usuario de MySQL
- `tu_password_mysql` con tu contraseña de MySQL  
- `tu_base_datos` con el nombre de tu base de datos

### 5. Configurar .htaccess

Asegúrate de que existe el archivo `.htaccess` en `public_html`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [L]
</IfModule>

<IfModule mod_headers.c>
  Header set X-Powered-By "Hostinger Horizons"
</IfModule>
```

### 6. Verificar Funcionamiento

1. Accede a tu sitio: `https://tu-subdominio.hostinger.com`
2. Verifica que la aplicación carga correctamente
3. Prueba crear algunos datos para verificar que MySQL funciona
4. Si MySQL no está disponible, la aplicación usará localStorage automáticamente

### 7. Configuración de Seguridad

1. Cambia la clave de seguridad en `setup-database.php` línea 8
2. Considera eliminar el archivo `setup-database.php` después del setup inicial
3. Configura permisos apropiados para los archivos PHP

## Estructura de Archivos en Hostinger

```
public_html/
├── index.html (desde dist/)
├── assets/ (desde dist/assets/)
├── api/
│   ├── config.php
│   ├── health-check.php
│   ├── disciplines.php
│   ├── professionals.php
│   ├── patients.php
│   ├── appointments.php
│   └── setup-database.php
└── .htaccess
```

## Solución de Problemas

### Si MySQL no funciona:
- La aplicación funcionará con localStorage automáticamente
- Verifica las credenciales de base de datos
- Revisa los logs de error de PHP en el panel de Hostinger

### Si hay errores de CORS:
- Los headers CORS ya están configurados en los archivos PHP
- Verifica que los archivos PHP se ejecuten correctamente

### Si las rutas no funcionan:
- Asegúrate de que el archivo `.htaccess` esté presente
- Verifica que mod_rewrite esté habilitado (generalmente lo está en Hostinger)

## Mantenimiento

1. **Backups**: Haz backup regular de la base de datos desde el panel de Hostinger
2. **Actualizaciones**: Para actualizar, simplemente reemplaza los archivos en `public_html`
3. **Monitoreo**: Revisa los logs de error regularmente desde el panel de control

## Características del Sistema Híbrido

- **Automático**: Detecta si MySQL está disponible
- **Fallback**: Usa localStorage si MySQL falla
- **Sin interrupciones**: Los usuarios pueden seguir trabajando
- **Sincronización**: Los datos se pueden migrar entre sistemas