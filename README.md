# Clínica Delux – Panel Administrativo

Aplicación web para la gestión integral de una clínica: agenda de citas, pacientes, profesionales, disciplinas, roles/usuarios y finanzas. Frontend en React + Vite y backend en PHP con endpoints REST ubicados en `public/api/*.php`.

Este repositorio está preparado para desplegarse en un entorno LAMP local (Apache + PHP + MySQL) y soporta build estático para servir desde `/var/www/html/clinica-delux/` mediante el script de despliegue incluido.

## Arquitectura

- Frontend: React (Vite), TailwindCSS y componentes UI con animaciones (framer-motion)
- Backend: PHP (estilo REST), endpoints en `public/api/*.php`
- Base de datos: MySQL (PDO)
- Capa de Acceso API: `src/services/ApiService.js`
- Gestión de caché: `src/services/CacheManager.js` y `HybridStorageService`
- Registro de actividades de API: `public/api/api_log.txt`

## Regla de integración API (crítica)

De acuerdo con las reglas del proyecto, TODAS las llamadas a la API deben usar endpoints terminados en `.php`.

Ejemplos correctos:
- `appointments.php`, `patients.php`, `professionals.php`, `users.php`
- Incluyendo queries: `roles.php?include_permissions=1&include_categories=1`

Se ha auditado y corregido el código para cumplir estrictamente esta regla, especialmente en operaciones de actualización y borrado.

## Módulos principales

- Dashboard (`src/components/Dashboard.jsx`)
  - Métricas generales (citas de hoy, profesionales, disciplinas, pacientes, pendientes)
  - Actividad Reciente: se deriva directamente de las citas más recientes (GET `appointments.php`).
  - Próximas Citas: siguientes 5 citas futuras ordenadas por fecha/hora.
  - Sin datos: muestra mensajes de estado si no hay actividad o próximas citas.

- Gestión de Citas (`src/components/AppointmentManager.jsx`)
  - CRUD completo contra `public/api/appointments.php`
  - Al eliminar, se llama a `DELETE appointments.php?id={id}` y se invalida el cache.

- Gestión de Pacientes / Profesionales
  - CRUD contra `patients.php` y `professionals.php` (GET/POST/PUT/DELETE)

- Usuarios y Roles
  - Usuarios: `users.php` (GET/POST/PUT/DELETE)
  - Roles: `roles.php` y categorías de roles `role-categories.php`

- Finanzas
  - Resumen: `finances.php?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`
  - Gastos: `expenses.php` (GET/POST/PUT/DELETE)

## Capa de servicios y caché

- `ApiService.js`
  - Detecta `baseURL` según entorno (dev via proxy de Vite, prod relativo)
  - Implementa métodos HTTP y helpers por entidad (appointments, patients, etc.)
  - Registra logs de cada petición (nivel, duración, datos)
  - Cumplimiento estricto de `.php` en todos los endpoints

- `CacheManager.js`
  - Limpieza de caché del navegador, localStorage y sessionStorage
  - Invalidación por entidad tras operaciones CRUD
  - `forceRefreshAll()`: fuerza actualización completa de entidades clave

- Comportamiento de fallback
  - Si una petición a la API falla, ciertos métodos pueden recurrir a datos en localStorage (p. ej., para listas) y registrar un warning. Si el servidor responde OK, se sobreescribe el localStorage con datos frescos.

## Flujo de “Actividad Reciente”

- Fuente de datos: `GET /api/appointments.php`
- Transformación en el Dashboard:
  - Combina `date` y `time` en un objeto Date para ordenar.
  - Ordena descendentemente y toma las 6 más recientes.
  - Muestra: "{paciente} con {profesional} — {tipo}" y "{Hoy|Ayer|dd/mm} · {HH:MM}".
- Sin citas en la DB: la actividad aparecerá vacía.

## Requisitos locales

- Node.js 18+
- PHP 8+
- MySQL/MariaDB (acceso vía `sudo mysql -u root` en desarrollo)
- Apache (sirviendo `dist/` en producción local)

## Desarrollo

1) Instalar dependencias

- npm install

2) Ejecutar en desarrollo

- npm run dev

Por defecto Vite servirá en http://localhost:3000 (la capa API se resuelve vía proxy/ruta relativa configurada en `ApiService`).

## Build y despliegue rápido

- ./quick-deploy.sh

El script:
- Construye con Vite
- Limpia `dist/` previo y `/var/www/html/clinica-delux/`
- Copia el build al docroot
- Ajusta permisos

Acceso post-deploy (local):
- URL: http://localhost/clinica-delux/
- Login de prueba: `admin / admin123`

## Configuración de base de datos

- PHP usa PDO. La conexión se obtiene en `public/api/config.php` (no mostrar credenciales aquí).
- Verificación de salud en logs: `public/api/api_log.txt` incluye checks de conexión a DB.

## Seguridad y buenas prácticas

- Nunca exponer secretos/credenciales en el repositorio.
- Evitar commitear dependencias de terceros bajo `vendor/` salvo que sean imprescindibles.
- Sanitizar entradas en endpoints PHP y usar sentencias preparadas (PDO::prepare).

## Cambios recientes (resumen)

- Dashboard ahora consume datos reales para "Actividad Reciente" y "Próximas Citas" desde `appointments.php`.
- Corrección global de endpoints para cumplir la regla `.php`:
  - update/delete en appointments, patients, professionals, users, roles, role-categories
  - clinical-notes ahora `clinical-notes.php`
- Refuerzo de invalidación de cache tras operaciones CRUD.

## Roadmap sugerido

- Endpoint `activity.php` que agregue eventos (citas, pacientes, emails, etc.) para una actividad más rica.
- Auto-refresco del Dashboard escuchando eventos `dataUpdated` y `dataForceRefreshed`.
- Tests de integración básicos (PHPUnit para endpoints y pruebas E2E ligeras en el frontend).

## Licencia

Este proyecto es para uso interno/cliente. Revisar términos contractuales antes de publicar o reutilizar.

