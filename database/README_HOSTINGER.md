# 📋 Guía de Instalación de Base de Datos en Hostinger

## 🎯 Información Importante

En Hostinger, las bases de datos se nombran automáticamente como `user_nombre` donde:
- `user` = tu nombre de usuario de Hostinger
- `nombre` = el nombre que elijas para la BD

**Ejemplo:** Si tu usuario es `u123456789` y nombras tu BD `clinica`, se creará como `u123456789_clinica`

## 📁 Archivos SQL Incluidos

### 1. `setup_hostinger.sql` ⭐ (RECOMENDADO)
- **Archivo completo** con todo lo necesario
- Crea todas las tablas, datos iniciales e índices
- **Usar este archivo para instalación rápida**

### 2. Archivos separados (para instalación manual):
- `01_create_tables.sql` - Creación de tablas
- `02_insert_initial_data.sql` - Datos iniciales
- `03_create_indexes.sql` - Índices de optimización

## 🚀 Instalación Rápida (Recomendada)

### Opción A: Usando phpMyAdmin en Hostinger

1. **Accede a tu panel de Hostinger**
2. **Ve a "Bases de datos MySQL"**
3. **Crea una nueva base de datos:**
   - Nombre: `clinica` (se creará como `user_clinica`)
   - Usuario: crear uno nuevo o usar existente
   - Contraseña: generar una segura

4. **Accede a phpMyAdmin**
5. **Selecciona tu base de datos**
6. **Ve a la pestaña "SQL"**
7. **Copia y pega el contenido de `setup_hostinger.sql`**
8. **Ejecuta el script**

### Opción B: Usando el script automático PHP

1. **Sube los archivos de la aplicación a `public_html`**
2. **Edita `api/config.php` con tus credenciales:**
   ```php
   $username = 'tu_usuario_mysql';  // Ej: u123456789_clinica
   $password = 'tu_password_mysql';
   $database = 'tu_base_datos';     // Ej: u123456789_clinica
   ```
3. **Visita:** `https://tu-dominio.com/api/setup-database.php?key=setup_db_2024`

## 🔧 Configuración Manual Paso a Paso

Si prefieres instalar manualmente:

### Paso 1: Crear Base de Datos
```sql
-- En phpMyAdmin, selecciona tu base de datos y ejecuta:
```

### Paso 2: Ejecutar Scripts
1. Ejecuta `01_create_tables.sql`
2. Ejecuta `02_insert_initial_data.sql`
3. Ejecuta `03_create_indexes.sql`

## 📊 Verificación de Instalación

Ejecuta esta consulta para verificar que todo se instaló correctamente:

```sql
-- Verificar tablas creadas
SHOW TABLES;

-- Verificar datos iniciales
SELECT COUNT(*) as 'Disciplinas' FROM disciplines;
SELECT COUNT(*) as 'Configuraciones' FROM settings;

-- Verificar estructura
DESCRIBE appointments;
```

## 🔑 Credenciales de Ejemplo

Después de la instalación, tendrás estos usuarios de prueba:

### Usuarios del Sistema:
- **Admin:** `admin` / `admin123`
- **Gerente:** `gerente` / `gerente123`
- **Profesional:** `profesional1` / `prof123`
- **Recepción:** `recepcion` / `rec123`

### Profesionales de Ejemplo:
- Dr. Ana García Martínez (Psicología Clínica)
- Dr. Carlos Ruiz López (Medicina General)
- Dra. María Elena Fernández (Pediatría)

## 🛠️ Configuración Post-Instalación

### 1. Actualizar Configuración de la Clínica
```sql
UPDATE settings SET setting_value = 'Tu Clínica Real' WHERE setting_key = 'clinic_name';
UPDATE settings SET setting_value = 'Tu dirección real' WHERE setting_key = 'clinic_address';
UPDATE settings SET setting_value = 'Tu teléfono real' WHERE setting_key = 'clinic_phone';
```

### 2. Configurar API
Edita `api/config.php`:
```php
$host = 'localhost';
$username = 'tu_usuario_real';     // Ej: u123456789_user
$password = 'tu_password_real';
$database = 'tu_base_datos_real';  // Ej: u123456789_clinica
```

## 🔍 Solución de Problemas

### Error: "Table doesn't exist"
- Verifica que ejecutaste `01_create_tables.sql` primero
- Asegúrate de estar en la base de datos correcta

### Error: "Access denied"
- Verifica las credenciales en `api/config.php`
- Asegúrate de que el usuario tenga permisos en la BD

### Error: "Foreign key constraint"
- Ejecuta los scripts en orden: tablas → datos → índices
- Verifica que las tablas padre existan antes de las hijas

### La aplicación no conecta a MySQL
- Verifica que `api/health-check.php` funcione
- La aplicación funcionará con localStorage si MySQL falla

## 📞 Soporte

Si tienes problemas:
1. Verifica los logs de error de PHP en Hostinger
2. Usa `api/health-check.php` para probar la conexión
3. La aplicación tiene fallback a localStorage automático

## ✅ Lista de Verificación

- [ ] Base de datos creada en Hostinger
- [ ] Script `setup_hostinger.sql` ejecutado
- [ ] Credenciales configuradas en `api/config.php`
- [ ] `api/health-check.php` responde OK
- [ ] Aplicación carga correctamente
- [ ] Login funciona con usuarios de prueba
- [ ] Se pueden crear citas, pacientes, etc.

¡Tu sistema está listo para usar! 🎉