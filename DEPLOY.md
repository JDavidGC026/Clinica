# 🚀 Sistema de Deploy Automatizado - Clínica Delux

## 📋 Descripción

Sistema completo de deploy automatizado para el proyecto Clínica Delux, que incluye build, deploy, verificación y gestión de backups.

## 🎯 Características

- ✅ **Deploy automatizado** con verificaciones completas
- ✅ **Backup automático** antes de cada deploy  
- ✅ **Rollback automático** en caso de fallos
- ✅ **Verificación de APIs** y funcionalidades críticas
- ✅ **Gestión de permisos** automática
- ✅ **Logs detallados** de cada operación
- ✅ **Múltiples entornos** (producción, staging, desarrollo)
- ✅ **Utilidades de gestión** para mantenimiento

## 🚀 Comandos de Deploy

### Deploy Principal

```bash
# Deploy interactivo (con confirmación)
npm run deploy

# Deploy sin confirmación
npm run deploy:force

# Deploy a staging
npm run deploy:staging

# Deploy en modo prueba (sin cambios reales)
npm run deploy:dry-run
```

### Comandos Adicionales

```bash
# Solo build para producción
npm run build:prod

# Verificar deploy actual
npm run test:deploy

# Información sobre rollback manual
npm run rollback
```

## 🛠️ Scripts Disponibles

### 1. Script Principal de Deploy
`scripts/deploy.sh` - Script principal que ejecuta todo el proceso

**Características:**
- Build automático del proyecto
- Backup del deploy anterior
- Verificación de dependencias
- Deploy con rsync optimizado
- Configuración automática de permisos
- Verificación post-deploy
- Rollback automático en caso de error

**Opciones:**
```bash
./scripts/deploy.sh              # Deploy interactivo
./scripts/deploy.sh --force      # Sin confirmación
./scripts/deploy.sh --dry-run    # Simulación sin cambios
./scripts/deploy.sh --help       # Ayuda
```

### 2. Utilidades de Gestión
`scripts/deploy-utils.sh` - Herramientas de gestión y mantenimiento

**Funciones disponibles:**
- Estado del deploy actual
- Gestión de backups
- Restauración desde backup
- Limpieza de backups antiguos
- Verificación completa del sistema
- Visualización de logs

**Uso:**
```bash
# Menú interactivo
./scripts/deploy-utils.sh

# Comandos específicos
./scripts/deploy-utils.sh status
./scripts/deploy-utils.sh list-backups
./scripts/deploy-utils.sh restore /tmp/clinica_backup_20250807_120000
./scripts/deploy-utils.sh cleanup 5
./scripts/deploy-utils.sh verify
./scripts/deploy-utils.sh logs
```

## 📂 Estructura de Archivos

```
Clinica/
├── scripts/
│   ├── deploy.sh           # Script principal de deploy
│   └── deploy-utils.sh     # Utilidades de gestión
├── deploy.config.js        # Configuración de deploy
├── DEPLOY.md              # Esta documentación
└── package.json           # Scripts npm actualizados
```

## ⚙️ Configuración

### Variables de Entorno

```bash
# Directorio de destino (opcional)
export DEPLOY_TARGET="/var/www/html/grupodelux"

# Modo de operación (opcional)
export NODE_ENV="production"
```

### Configuración en deploy.config.js

El archivo `deploy.config.js` contiene toda la configuración personalizable:

- **Directorios** de origen y destino
- **URLs** de cada entorno
- **Permisos** del sistema
- **APIs** a verificar
- **Archivos críticos** requeridos
- **Configuración de tests**
- **Opciones de backup**

## 🔄 Proceso de Deploy

### 1. Pre-Deploy
- ✅ Verificación de dependencias
- ✅ Backup del deploy anterior
- ✅ Limpieza de archivos temporales

### 2. Build
- ✅ Instalación/verificación de dependencias npm
- ✅ Build optimizado para producción
- ✅ Validación de archivos esenciales

### 3. Deploy
- ✅ Preparación del directorio destino
- ✅ Copia optimizada con rsync
- ✅ Preservación de APIs existentes
- ✅ Configuración automática de permisos

### 4. Post-Deploy
- ✅ Verificación de frontend accesible
- ✅ Test de APIs críticas
- ✅ Test funcional de login
- ✅ Generación de reporte completo

## 🛡️ Gestión de Errores y Rollback

### Rollback Automático
Si ocurre un error durante el deploy, el sistema:
1. Detecta el error automáticamente
2. Restaura la versión anterior desde el backup
3. Configura permisos correctos
4. Notifica el problema y la solución aplicada

### Rollback Manual
```bash
# Ver backups disponibles
./scripts/deploy-utils.sh list-backups

# Restaurar backup específico
./scripts/deploy-utils.sh restore /tmp/clinica_backup_20250807_120000
```

## 📊 Verificaciones Incluidas

### Frontend
- ✅ Accesibilidad HTTP (código 200)
- ✅ Archivos críticos presentes
- ✅ Estructura de directorios correcta

### Backend APIs
- ✅ health-check.php
- ✅ login.php
- ✅ patients.php
- ✅ professionals.php
- ✅ appointments.php
- ✅ disciplines.php
- ✅ users.php
- ✅ roles.php

### Funcionalidad
- ✅ Login funcional (admin/admin123)
- ✅ Respuestas JSON válidas
- ✅ Permisos correctos (www-data:www-data)

## 📝 Logs y Monitoreo

### Ubicación de Logs
- **Logs de deploy**: `/tmp/deploy_YYYYMMDD_HHMMSS.log`
- **Backups**: `/tmp/clinica_backup_YYYYMMDD_HHMMSS/`

### Información Registrada
- Timestamp de cada operación
- Comandos ejecutados
- Resultados de verificaciones
- Errores y warnings
- Estadísticas finales

## 🎯 Ejemplos de Uso

### Deploy Completo
```bash
# Desarrollo -> Producción
cd /path/to/Clinica
npm run deploy
```

### Deploy con Verificación Previa
```bash
# Verificar estado actual
npm run test:deploy

# Deploy si todo está bien
npm run deploy:force
```

### Mantenimiento
```bash
# Verificar sistema completo
./scripts/deploy-utils.sh verify

# Limpiar backups antiguos (mantener 3)
./scripts/deploy-utils.sh cleanup 3

# Ver logs recientes
./scripts/deploy-utils.sh logs
```

### Emergencia - Rollback
```bash
# Ver backups disponibles
./scripts/deploy-utils.sh list-backups

# Restaurar el más reciente
./scripts/deploy-utils.sh restore /tmp/clinica_backup_20250807_120000

# Verificar restauración
./scripts/deploy-utils.sh verify
```

## 🚨 Solución de Problemas

### Error: "Permission denied"
```bash
# Asegurarse de tener permisos sudo
sudo -v

# Re-ejecutar el deploy
npm run deploy:force
```

### Error: "Frontend not accessible"
```bash
# Verificar Apache/Nginx
sudo systemctl status apache2

# Verificar permisos
./scripts/deploy-utils.sh status
```

### Error: "APIs not responding"
```bash
# Verificar configuración PHP
php -v

# Ver logs de PHP
sudo tail -f /var/log/apache2/error.log

# Verificar base de datos
./scripts/deploy-utils.sh verify
```

### Limpieza después de problemas
```bash
# Limpiar todo y empezar de cero
rm -rf dist/
rm -rf node_modules/.cache/
npm ci
npm run deploy:dry-run  # Probar primero
npm run deploy:force    # Si el dry-run es exitoso
```

## 📈 Mejoras Futuras

- [ ] **CI/CD Integration**: GitHub Actions / GitLab CI
- [ ] **Notificaciones**: Slack, email, webhooks
- [ ] **Deploy multi-servidor**: Balanceadores de carga
- [ ] **Monitoreo avanzado**: Métricas y alertas
- [ ] **Deploy por ramas**: Feature branches automáticos
- [ ] **Tests automatizados**: E2E testing post-deploy

## 📞 Soporte

Para problemas o sugerencias:
1. Revisar los logs en `/tmp/deploy_*.log`
2. Usar `./scripts/deploy-utils.sh verify` para diagnóstico
3. Consultar esta documentación
4. Contactar al equipo de desarrollo

---

**¡Deploy automatizado y confiable para Clínica Delux! 🚀**
