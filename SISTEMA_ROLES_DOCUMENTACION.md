# Sistema de Roles Avanzado - Clínica Delux

## 🎯 Descripción General

El sistema de roles avanzado permite crear roles personalizados y asignar permisos específicos a cada rol. Esto te da control total sobre qué puede hacer cada usuario en el sistema.

## 📋 Roles Predefinidos

### 1. **Super Administrador**
- **Descripción**: Acceso completo a todo el sistema
- **Permisos**: Admin en todos los módulos
- **Usuarios**: admin

### 2. **Supervisor**
- **Descripción**: Acceso completo excepto configuración del sistema
- **Permisos**: Admin en casi todo, solo lectura en settings
- **Ideal para**: Jefes de área, coordinadores

### 3. **Gerente**
- **Descripción**: Gestión operativa general, reportes y supervisión
- **Permisos**: Escritura en operaciones, admin en reportes
- **Usuarios**: gerente

### 4. **Médicos Externos**
- **Descripción**: Acceso limitado para profesionales externos
- **Permisos**: Lectura general, escritura en citas
- **Usuarios**: profesional1

### 5. **Recepcionista**
- **Descripción**: Manejo de pacientes, citas y información básica
- **Permisos**: Escritura en pacientes y citas
- **Usuarios**: recepcion

### 6. **Asistente Médico**
- **Descripción**: Apoyo en consultas y manejo de historiales
- **Permisos**: Escritura en pacientes, lectura en citas

## 🔧 Cómo Crear Roles Personalizados

### Ejemplo: Crear rol "Supervisor de Turno"

```http
POST /api/roles.php
Content-Type: application/json

{
    "name": "Supervisor de Turno",
    "description": "Supervisa operaciones durante turnos específicos",
    "permissions": {
        "patients": "write",
        "appointments": "admin", 
        "professionals": "read",
        "disciplines": "read",
        "reports": "write"
    }
}
```

### Ejemplo: Crear rol "Médicos Internos"

```http
POST /api/roles.php
Content-Type: application/json

{
    "name": "Médicos Internos",
    "description": "Personal médico interno con acceso ampliado",
    "permissions": {
        "patients": "admin",
        "appointments": "admin",
        "professionals": "read",
        "disciplines": "read", 
        "reports": "admin",
        "settings": "read"
    }
}
```

## 🎛️ APIs Disponibles

### 1. Obtener Todos los Roles
```http
GET /api/roles.php
```

### 2. Obtener Roles con Permisos
```http
GET /api/roles.php?include_permissions=1
```

### 3. Obtener un Rol Específico
```http
GET /api/roles.php?id=3
```

### 4. Crear Nuevo Rol
```http
POST /api/roles.php
Content-Type: application/json

{
    "name": "Nombre del Rol",
    "description": "Descripción del rol",
    "permissions": {
        "module1": "permission_level",
        "module2": "permission_level"
    }
}
```

### 5. Actualizar Rol Existente
```http
PUT /api/roles.php?id=5
Content-Type: application/json

{
    "name": "Nuevo Nombre",
    "description": "Nueva descripción",
    "permissions": {
        "patients": "admin",
        "appointments": "write"
    }
}
```

### 6. Eliminar Rol
```http
DELETE /api/roles.php?id=5
```

## 📊 Módulos y Niveles de Permisos

### Módulos Disponibles
- **patients** - Gestión de pacientes
- **professionals** - Gestión de profesionales
- **appointments** - Gestión de citas
- **disciplines** - Gestión de disciplinas
- **users** - Gestión de usuarios
- **settings** - Configuración del sistema
- **reports** - Reportes y estadísticas
- **roles** - Gestión de roles

### Niveles de Permisos
- **read** - Solo lectura (ver información)
- **write** - Lectura y escritura (crear, editar)
- **admin** - Control total (incluye eliminar)

## 👥 Asignar Roles a Usuarios

### Via Base de Datos
```sql
UPDATE users SET role_id = 3 WHERE username = 'nuevo_usuario';
```

### Via API de Usuarios (si existe)
```http
PUT /api/users.php?id=5
Content-Type: application/json

{
    "role_id": 3
}
```

## 🔄 Jerarquía de Permisos

El sistema usa la siguiente jerarquía:

1. **Permisos del Rol** (base)
2. **Permisos Individuales** (override)

Si un usuario tiene un permiso individual diferente al de su rol, el permiso individual toma precedencia.

## 💡 Casos de Uso Prácticos

### Caso 1: Crear rol para "Médicos de Urgencias"
```json
{
    "name": "Médicos de Urgencias",
    "description": "Personal médico de urgencias con acceso prioritario",
    "permissions": {
        "patients": "admin",
        "appointments": "admin",
        "professionals": "read",
        "reports": "write"
    }
}
```

### Caso 2: Crear rol para "Personal de Limpieza"
```json
{
    "name": "Personal de Limpieza", 
    "description": "Acceso mínimo solo para registro de actividades",
    "permissions": {
        "appointments": "read"
    }
}
```

### Caso 3: Crear rol para "Directores Médicos"
```json
{
    "name": "Directores Médicos",
    "description": "Dirección médica con acceso estratégico",
    "permissions": {
        "patients": "read",
        "professionals": "admin",
        "appointments": "read", 
        "disciplines": "admin",
        "reports": "admin",
        "settings": "write"
    }
}
```

## 🧪 Pruebas y Verificación

Para probar el sistema:

```bash
cd /home/david/Clinica
php test_roles_system.php
```

Este script verificará:
- ✅ Creación de roles
- ✅ Asignación de permisos
- ✅ Login con roles
- ✅ Permisos efectivos

## 🔍 Consultas Útiles

### Ver todos los roles y sus usuarios
```sql
SELECT 
    r.name as rol,
    r.description,
    COUNT(u.id) as usuarios_asignados,
    GROUP_CONCAT(u.username SEPARATOR ', ') as usuarios
FROM roles r
LEFT JOIN users u ON r.id = u.role_id
GROUP BY r.id
ORDER BY r.name;
```

### Ver permisos de un rol específico
```sql
SELECT 
    r.name as rol,
    rp.module,
    rp.permission
FROM roles r
INNER JOIN role_permissions rp ON r.id = rp.role_id
WHERE r.name = 'Supervisor'
ORDER BY rp.module;
```

### Ver permisos efectivos de un usuario
```sql
SELECT 
    u.username,
    u.name,
    r.name as rol,
    rp.module,
    rp.permission,
    'rol' as origen
FROM users u
INNER JOIN roles r ON u.role_id = r.id
INNER JOIN role_permissions rp ON r.id = rp.role_id
WHERE u.username = 'admin'

UNION

SELECT 
    u.username,
    u.name,
    'Individual' as rol,
    up.module,
    up.permission,
    'individual' as origen
FROM users u
INNER JOIN user_permissions up ON u.id = up.user_id
WHERE u.username = 'admin'
ORDER BY module;
```

## 🚀 Próximos Pasos Recomendados

1. **Crear roles específicos** para tu organización
2. **Asignar usuarios** a los roles apropiados
3. **Probar el sistema** con diferentes usuarios
4. **Ajustar permisos** según necesidades
5. **Documentar** los roles personalizados creados

## 🛡️ Consideraciones de Seguridad

- Los roles inactivos no otorgan permisos
- Los usuarios sin rol solo pueden hacer login básico
- Los permisos individuales pueden override roles
- Siempre mantén al menos un Super Administrador

---
**Fecha de implementación**: 2025-08-06  
**Estado**: ✅ Sistema completamente funcional  
**Autor**: Sistema automatizado de roles
