#!/bin/bash

# ========================================
# SCRIPT DE DEPLOY AUTOMATIZADO
# Clínica Delux - Sistema de Gestión Médica
# ========================================

set -e  # Exit on any error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuración
PROJECT_NAME="Clínica Delux"
BUILD_DIR="dist"
DEPLOY_TARGET="/var/www/html/grupodelux"
BACKUP_DIR="/tmp/clinica_backup_$(date +%Y%m%d_%H%M%S)"
LOG_FILE="/tmp/deploy_$(date +%Y%m%d_%H%M%S).log"

# Funciones de utilidad
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ️  $1${NC}" | tee -a "$LOG_FILE"
}

header() {
    echo -e "${PURPLE}========================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}========================================${NC}"
}

# Verificar dependencias
check_dependencies() {
    log "Verificando dependencias..."
    
    # Verificar Node.js y npm
    if ! command -v npm &> /dev/null; then
        error "npm no está instalado"
    fi
    
    # Verificar que estamos en el directorio correcto
    if [[ ! -f "package.json" ]]; then
        error "No se encuentra package.json. Ejecuta el script desde el directorio raíz del proyecto."
    fi
    
    # Verificar permisos sudo
    if ! sudo -n true 2>/dev/null; then
        warn "Se requieren permisos sudo para el deploy. Puede que se solicite contraseña."
    fi
    
    success "Dependencias verificadas"
}

# Crear backup del deploy anterior
create_backup() {
    log "Creando backup del deploy anterior..."
    
    if [[ -d "$DEPLOY_TARGET" ]]; then
        mkdir -p "$BACKUP_DIR"
        sudo cp -r "$DEPLOY_TARGET"/* "$BACKUP_DIR/" 2>/dev/null || true
        sudo chown -R $USER:$USER "$BACKUP_DIR" 2>/dev/null || true
        success "Backup creado en: $BACKUP_DIR"
    else
        info "No hay deploy anterior para respaldar"
    fi
}

# Limpiar archivos temporales y builds anteriores
clean_project() {
    log "Limpiando proyecto..."
    
    if [[ -d "$BUILD_DIR" ]]; then
        rm -rf "$BUILD_DIR"
        success "Directorio $BUILD_DIR limpiado"
    fi
    
    if [[ -d "node_modules/.cache" ]]; then
        rm -rf "node_modules/.cache"
        success "Cache de node_modules limpiado"
    fi
}

# Instalar dependencias
install_dependencies() {
    log "Verificando e instalando dependencias..."
    
    if [[ ! -d "node_modules" ]] || [[ "package.json" -nt "node_modules" ]]; then
        log "Instalando dependencias npm..."
        npm ci
        success "Dependencias instaladas"
    else
        info "Dependencias ya actualizadas"
    fi
}

# Build del proyecto
build_project() {
    log "Construyendo proyecto para producción..."
    
    # Variables de entorno para build de producción
    export NODE_ENV=production
    
    npm run build
    
    if [[ ! -d "$BUILD_DIR" ]]; then
        error "El build falló - directorio $BUILD_DIR no existe"
    fi
    
    # Verificar archivos esenciales
    if [[ ! -f "$BUILD_DIR/index.html" ]]; then
        error "El build falló - index.html no encontrado"
    fi
    
    success "Build completado exitosamente"
}

# Preparar directorio de deploy
prepare_deploy_directory() {
    log "Preparando directorio de deploy..."
    
    # Crear directorio si no existe
    sudo mkdir -p "$DEPLOY_TARGET"
    
    success "Directorio de deploy preparado"
}

# Deploy de archivos
deploy_files() {
    log "Desplegando archivos..."
    
    # Copiar archivos del build (excluyendo APIs)
    sudo rsync -av --delete "$BUILD_DIR/" "$DEPLOY_TARGET/" --exclude="api/"
    
    # Preservar APIs existentes si existen
    if [[ -d "public/api" ]]; then
        log "Actualizando APIs..."
        sudo mkdir -p "$DEPLOY_TARGET/api"
        sudo cp -r public/api/* "$DEPLOY_TARGET/api/" 2>/dev/null || true
    fi
    
    success "Archivos desplegados"
}

# Configurar permisos
set_permissions() {
    log "Configurando permisos..."
    
    sudo chown -R www-data:www-data "$DEPLOY_TARGET"
    sudo chmod -R 755 "$DEPLOY_TARGET"
    
    # Permisos especiales para APIs
    if [[ -d "$DEPLOY_TARGET/api" ]]; then
        sudo chmod -R 755 "$DEPLOY_TARGET/api"
        sudo find "$DEPLOY_TARGET/api" -name "*.php" -exec chmod 644 {} \;
    fi
    
    success "Permisos configurados"
}

# Verificar deploy
verify_deployment() {
    log "Verificando deployment..."
    
    # Verificar que el frontend responde
    if curl -s -f "http://localhost/grupodelux/" > /dev/null; then
        success "Frontend accesible"
    else
        warn "Frontend puede no estar accesible"
    fi
    
    # Verificar APIs principales
    local api_tests=("health-check" "patients" "professionals" "login")
    local api_success=0
    
    for api in "${api_tests[@]}"; do
        if curl -s -f "http://localhost/grupodelux/api/${api}.php" > /dev/null; then
            info "API $api: ✅"
            ((api_success++))
        else
            warn "API $api: ⚠️"
        fi
    done
    
    if [[ $api_success -eq ${#api_tests[@]} ]]; then
        success "Todas las APIs verificadas exitosamente"
    else
        warn "Algunas APIs pueden tener problemas ($api_success/${#api_tests[@]} exitosas)"
    fi
}

# Test rápido de login
test_login() {
    log "Probando funcionalidad de login..."
    
    local login_response=$(curl -s -X POST -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"admin123"}' \
        "http://localhost/grupodelux/api/login.php" 2>/dev/null || echo "error")
    
    if [[ $login_response == *"success\":true"* ]]; then
        success "Test de login exitoso"
    else
        warn "Test de login falló - verifica manualmente"
    fi
}

# Generar reporte de deploy
generate_report() {
    local end_time=$(date)
    local deploy_size=$(du -sh "$DEPLOY_TARGET" 2>/dev/null | cut -f1 || echo "N/A")
    local file_count=$(find "$DEPLOY_TARGET" -type f 2>/dev/null | wc -l || echo "N/A")
    
    header "REPORTE DE DEPLOY"
    echo -e "${GREEN}Proyecto:${NC} $PROJECT_NAME"
    echo -e "${GREEN}Fecha:${NC} $end_time"
    echo -e "${GREEN}Deploy Target:${NC} $DEPLOY_TARGET"
    echo -e "${GREEN}Tamaño:${NC} $deploy_size"
    echo -e "${GREEN}Archivos:${NC} $file_count"
    echo -e "${GREEN}Backup:${NC} $BACKUP_DIR"
    echo -e "${GREEN}Log:${NC} $LOG_FILE"
    echo ""
    echo -e "${GREEN}URLs:${NC}"
    echo -e "  Frontend: ${BLUE}http://localhost/grupodelux/${NC}"
    echo -e "  APIs:     ${BLUE}http://localhost/grupodelux/api/${NC}"
    echo ""
    echo -e "${GREEN}Credenciales de prueba:${NC}"
    echo -e "  Admin:    admin / admin123"
    echo -e "  Gerente:  gerente / gerente123"
    echo ""
}

# Función de rollback
rollback() {
    error_msg="$1"
    warn "Deploy falló: $error_msg"
    
    if [[ -d "$BACKUP_DIR" ]] && [[ "$(ls -A $BACKUP_DIR)" ]]; then
        log "Realizando rollback..."
        sudo cp -r "$BACKUP_DIR"/* "$DEPLOY_TARGET/"
        sudo chown -R www-data:www-data "$DEPLOY_TARGET"
        sudo chmod -R 755 "$DEPLOY_TARGET"
        warn "Rollback completado - versión anterior restaurada"
    else
        warn "No hay backup disponible para rollback"
    fi
    
    error "Deploy abortado"
}

# Función principal
main() {
    local start_time=$(date)
    
    # Trap para manejar errores
    trap 'rollback "Error durante el proceso de deploy"' ERR
    
    header "INICIANDO DEPLOY - $PROJECT_NAME"
    log "Inicio: $start_time"
    
    # Pasos del deploy
    check_dependencies
    create_backup
    clean_project
    install_dependencies
    build_project
    prepare_deploy_directory
    deploy_files
    set_permissions
    verify_deployment
    test_login
    
    # Desactivar trap de error después del deploy exitoso
    trap - ERR
    
    success "Deploy completado exitosamente"
    generate_report
}

# Manejar argumentos de línea de comandos
case "${1:-}" in
    --help|-h)
        echo "Uso: $0 [opciones]"
        echo "Opciones:"
        echo "  --help, -h     Mostrar esta ayuda"
        echo "  --dry-run      Ejecutar sin hacer cambios reales"
        echo "  --force        Forzar deploy sin confirmación"
        echo ""
        echo "Ejemplo: $0"
        exit 0
        ;;
    --dry-run)
        warn "Modo DRY-RUN activado - no se realizarán cambios reales"
        DEPLOY_TARGET="/tmp/dry_run_deploy"
        ;;
    --force)
        info "Modo FORCE activado - sin confirmaciones"
        ;;
    *)
        # Confirmación interactiva (si no es --force)
        if [[ "${1:-}" != "--force" ]]; then
            echo -e "${YELLOW}¿Continuar con el deploy a $DEPLOY_TARGET? (y/N)${NC}"
            read -r response
            if [[ ! "$response" =~ ^[Yy]$ ]]; then
                echo "Deploy cancelado"
                exit 0
            fi
        fi
        ;;
esac

# Ejecutar deploy
main

exit 0
