# Configuración de Base de Datos MySQL

Este proyecto ahora incluye soporte completo para MySQL como base de datos principal, manteniendo compatibilidad con localStorage como respaldo.

## Requisitos Previos

1. **MySQL Server** instalado y ejecutándose
2. **Node.js** versión 18 o superior
3. Acceso a MySQL con permisos para crear bases de datos

## Configuración Inicial

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar MySQL

Edita el archivo `src/database/config.js` con tus credenciales de MySQL:

```javascript
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'tu_password_aqui', // Cambia por tu contraseña
  database: 'grupo_medico_delux',
  port: 3306
};
```

### 3. Crear Base de Datos y Tablas

Ejecuta el script de setup para crear la base de datos y las tablas:

```bash
npm run db:setup
```

Este comando:
- Crea la base de datos `grupo_medico_delux`
- Crea todas las tablas necesarias
- Inserta datos iniciales (disciplinas, profesionales de ejemplo)

### 4. Ejecutar Migraciones (Opcional)

Para futuras actualizaciones de esquema:

```bash
npm run db:migrate
```

## Estructura de la Base de Datos

### Tablas Principales

1. **disciplines** - Especialidades médicas
2. **professionals** - Profesionales de la salud
3. **patients** - Pacientes
4. **appointments** - Citas médicas
5. **expenses** - Gastos/Egresos
6. **email_history** - Historial de notificaciones
7. **clinical_notes** - Notas clínicas por profesional/paciente
8. **settings** - Configuración del sistema

### Relaciones

- `professionals.discipline_id` → `disciplines.id`
- `appointments.patient_id` → `patients.id`
- `appointments.professional_id` → `professionals.id`
- `clinical_notes.professional_id` → `professionals.id`
- `clinical_notes.patient_id` → `patients.id`

## Funcionalidades

### Sistema Híbrido

El sistema funciona de manera híbrida:

1. **Prioridad MySQL**: Si la base de datos está disponible, se usa MySQL
2. **Respaldo localStorage**: Si MySQL no está disponible, usa localStorage automáticamente
3. **Detección automática**: El sistema detecta la disponibilidad de la base de datos en tiempo real

### Servicios Disponibles

El `DatabaseService` proporciona métodos unificados para:

- Gestión de disciplinas
- Gestión de profesionales
- Gestión de pacientes
- Gestión de citas
- Gestión de gastos
- Historial de emails
- Notas clínicas
- Configuración del sistema

### Ejemplo de Uso

```javascript
import DatabaseService from '@/services/DatabaseService';

// Obtener todas las disciplinas
const disciplines = await DatabaseService.getDisciplines();

// Crear un nuevo paciente
const newPatient = await DatabaseService.createPatient({
  name: 'Juan Pérez',
  email: 'juan@example.com',
  phone: '123456789'
});

// Guardar nota clínica
await DatabaseService.saveClinicalNote(professionalId, patientId, 'Nota médica...');
```

## Migración de Datos Existentes

Si ya tienes datos en localStorage, el sistema los mantendrá como respaldo. Para migrar datos existentes a MySQL:

1. Ejecuta la aplicación con MySQL configurado
2. Los datos se irán sincronizando automáticamente conforme uses la aplicación
3. O puedes crear un script personalizado de migración

## Troubleshooting

### Error de Conexión

Si ves errores de conexión:

1. Verifica que MySQL esté ejecutándose
2. Confirma las credenciales en `src/database/config.js`
3. Asegúrate de que el usuario tenga permisos para crear bases de datos

### Datos No Aparecen

1. Ejecuta `npm run db:setup` nuevamente
2. Verifica que las tablas se crearon correctamente
3. Revisa los logs de la consola para errores

### Rendimiento

Para mejor rendimiento:

1. Ajusta el `connectionLimit` en `src/database/config.js`
2. Considera agregar índices adicionales según tus consultas
3. Monitorea las consultas lentas en MySQL

## Comandos Útiles

```bash
# Setup inicial de base de datos
npm run db:setup

# Ejecutar migraciones
npm run db:migrate

# Iniciar aplicación en desarrollo
npm run dev

# Construir para producción
npm run build
```

## Seguridad

- Las contraseñas se almacenan en configuración local
- Usa variables de entorno para producción
- Considera usar SSL para conexiones de base de datos
- Implementa validación de entrada en todos los endpoints

## Backup y Restauración

Para hacer backup de la base de datos:

```bash
mysqldump -u root -p grupo_medico_delux > backup.sql
```

Para restaurar:

```bash
mysql -u root -p grupo_medico_delux < backup.sql
```