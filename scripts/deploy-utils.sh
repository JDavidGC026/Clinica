#!/bin/bash

# ========================================
# UTILIDADES DE DEPLOY
# Clínica Delux - Sistema de Gestión Médica
# ========================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuración
DEPLOY_TARGET="/var/www/html/grupodelux"
BACKUP_BASE_DIR="/tmp"
LOG_DIR="/var/log/clinica-deploy"

# Funciones de utilidad
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ️  $1${NC}"
}

header() {
    echo -e "${PURPLE}========================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}========================================${NC}"
}

# Mostrar estado del deploy actual
show_deploy_status() {
    header "ESTADO DEL DEPLOY ACTUAL"
    
    echo -e "${GREEN}Directorio de deploy:${NC} $DEPLOY_TARGET"
    
    if [[ -d "$DEPLOY_TARGET" ]]; then
        echo -e "${GREEN}Estado:${NC} ✅ Desplegado"
        echo -e "${GREEN}Tamaño:${NC} $(du -sh "$DEPLOY_TARGET" 2>/dev/null | cut -f1 || echo "N/A")"
        echo -e "${GREEN}Archivos:${NC} $(find "$DEPLOY_TARGET" -type f 2>/dev/null | wc -l || echo "N/A")"
        echo -e "${GREEN}Última modificación:${NC} $(stat -c %y "$DEPLOY_TARGET" 2>/dev/null || echo "N/A")"
        
        # Verificar frontend
        echo -e "${GREEN}Frontend:${NC} $(curl -s -o /dev/null -w "%{http_code}" "http://localhost/grupodelux/" 2>/dev/null | \
            sed 's/200/✅ Accesible (200)/;s/[45][0-9][0-9]/❌ Error (&)/;s/000/❌ No disponible/')"
        
        # Verificar APIs
        echo -e "${GREEN}API Login:${NC} $(curl -s -f "http://localhost/grupodelux/api/login.php" >/dev/null 2>&1 && echo "✅ Disponible" || echo "❌ No disponible")"
        echo -e "${GREEN}API Health:${NC} $(curl -s -f "http://localhost/grupodelux/api/health-check.php" >/dev/null 2>&1 && echo "✅ Disponible" || echo "❌ No disponible")"
    else
        echo -e "${RED}Estado:${NC} ❌ No desplegado"
    fi
    
    echo ""
}

# Listar backups disponibles
list_backups() {
    header "BACKUPS DISPONIBLES"
    
    local backups=($(find "$BACKUP_BASE_DIR" -maxdepth 1 -name "clinica_backup_*" -type d 2>/dev/null | sort -r))
    
    if [[ ${#backups[@]} -eq 0 ]]; then
        warn "No hay backups disponibles"
        return
    fi
    
    echo -e "${GREEN}Backups encontrados:${NC}"
    for i in "${!backups[@]}"; do
        local backup="${backups[$i]}"
        local backup_name=$(basename "$backup")
        local backup_date=$(echo "$backup_name" | sed 's/clinica_backup_//' | sed 's/_/ /')
        local backup_size=$(du -sh "$backup" 2>/dev/null | cut -f1 || echo "N/A")
        
        echo -e "  ${BLUE}[$((i+1))]${NC} $backup_date (${backup_size})"
        echo -e "      📁 $backup"
    done
    echo ""
}

# Restaurar desde backup
restore_from_backup() {
    local backup_path="$1"
    
    if [[ -z "$backup_path" ]]; then
        list_backups
        echo -e "${YELLOW}Uso: restore_from_backup <ruta_del_backup>${NC}"
        return 1
    fi
    
    if [[ ! -d "$backup_path" ]]; then
        error "Backup no encontrado: $backup_path"
        return 1
    fi
    
    header "RESTAURANDO DESDE BACKUP"
    log "Backup: $backup_path"
    log "Destino: $DEPLOY_TARGET"
    
    # Confirmación
    echo -e "${YELLOW}¿Estás seguro de que quieres restaurar desde este backup? (y/N)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Restauración cancelada"
        return 0
    fi
    
    # Crear backup del estado actual antes de restaurar
    if [[ -d "$DEPLOY_TARGET" ]]; then
        local current_backup="/tmp/pre_restore_backup_$(date +%Y%m%d_%H%M%S)"
        log "Creando backup del estado actual..."
        sudo mkdir -p "$current_backup"
        sudo cp -r "$DEPLOY_TARGET"/* "$current_backup/" 2>/dev/null || true
        sudo chown -R $USER:$USER "$current_backup" 2>/dev/null || true
        info "Backup del estado actual: $current_backup"
    fi
    
    # Restaurar
    log "Restaurando archivos..."
    sudo mkdir -p "$DEPLOY_TARGET"
    sudo rm -rf "$DEPLOY_TARGET"/*
    sudo cp -r "$backup_path"/* "$DEPLOY_TARGET/"
    
    # Configurar permisos
    log "Configurando permisos..."
    sudo chown -R www-data:www-data "$DEPLOY_TARGET"
    sudo chmod -R 755 "$DEPLOY_TARGET"
    
    success "Restauración completada"
    
    # Verificar resultado
    if curl -s -f "http://localhost/grupodelux/" > /dev/null; then
        success "Frontend verificado - accesible"
    else
        warn "Frontend puede no estar accesible"
    fi
}

# Limpiar backups antiguos
cleanup_backups() {
    local keep_count="${1:-5}"
    
    header "LIMPIEZA DE BACKUPS"
    log "Manteniendo los $keep_count backups más recientes"
    
    local backups=($(find "$BACKUP_BASE_DIR" -maxdepth 1 -name "clinica_backup_*" -type d 2>/dev/null | sort -r))
    
    if [[ ${#backups[@]} -le $keep_count ]]; then
        info "Solo hay ${#backups[@]} backups, no hay nada que limpiar"
        return
    fi
    
    local to_delete=("${backups[@]:$keep_count}")
    
    echo -e "${YELLOW}Backups a eliminar:${NC}"
    for backup in "${to_delete[@]}"; do
        local backup_name=$(basename "$backup")
        local backup_date=$(echo "$backup_name" | sed 's/clinica_backup_//' | sed 's/_/ /')
        echo -e "  📁 $backup_date"
    done
    
    echo -e "${YELLOW}¿Continuar con la eliminación? (y/N)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Limpieza cancelada"
        return 0
    fi
    
    for backup in "${to_delete[@]}"; do
        log "Eliminando: $(basename "$backup")"
        rm -rf "$backup"
    done
    
    success "Limpieza completada - ${#to_delete[@]} backups eliminados"
}

# Verificar sistema completo
verify_system() {
    header "VERIFICACIÓN COMPLETA DEL SISTEMA"
    
    local checks=0
    local passed=0
    
    # Verificar frontend
    echo -n "Verificando frontend... "
    if curl -s -f "http://localhost/grupodelux/" > /dev/null; then
        echo "✅"
        ((passed++))
    else
        echo "❌"
    fi
    ((checks++))
    
    # Verificar APIs críticas
    local apis=("health-check" "login" "patients" "professionals" "appointments")
    for api in "${apis[@]}"; do
        echo -n "Verificando API $api... "
        if curl -s -f "http://localhost/grupodelux/api/${api}.php" > /dev/null; then
            echo "✅"
            ((passed++))
        else
            echo "❌"
        fi
        ((checks++))
    done
    
    # Test de login funcional
    echo -n "Probando login funcional... "
    local login_response=$(curl -s -X POST -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"admin123"}' \
        "http://localhost/grupodelux/api/login.php" 2>/dev/null || echo "error")
    
    if [[ $login_response == *"success\":true"* ]]; then
        echo "✅"
        ((passed++))
    else
        echo "❌"
    fi
    ((checks++))
    
    # Verificar permisos
    echo -n "Verificando permisos... "
    if [[ -d "$DEPLOY_TARGET" ]] && [[ $(stat -c %U "$DEPLOY_TARGET") == "www-data" ]]; then
        echo "✅"
        ((passed++))
    else
        echo "❌"
    fi
    ((checks++))
    
    # Resumen
    echo ""
    echo -e "${GREEN}Resultado:${NC} $passed/$checks verificaciones pasadas"
    
    if [[ $passed -eq $checks ]]; then
        success "Sistema completamente funcional"
        return 0
    elif [[ $passed -gt $((checks * 2 / 3)) ]]; then
        warn "Sistema mayormente funcional con algunos problemas"
        return 1
    else
        error "Sistema con problemas críticos"
        return 2
    fi
}

# Mostrar logs recientes
show_logs() {
    header "LOGS RECIENTES DE DEPLOY"
    
    local log_files=($(ls -t /tmp/deploy_*.log 2>/dev/null | head -5))
    
    if [[ ${#log_files[@]} -eq 0 ]]; then
        warn "No hay logs de deploy disponibles"
        return
    fi
    
    echo -e "${GREEN}Logs encontrados:${NC}"
    for log_file in "${log_files[@]}"; do
        local log_date=$(basename "$log_file" .log | sed 's/deploy_//')
        echo -e "  📄 $log_date"
        echo -e "      $log_file"
    done
    
    echo ""
    echo -e "${BLUE}Mostrando últimas 20 líneas del log más reciente:${NC}"
    echo "----------------------------------------"
    tail -20 "${log_files[0]}" 2>/dev/null || echo "No se pudo leer el log"
    echo "----------------------------------------"
}

# Menú principal
show_menu() {
    header "UTILIDADES DE DEPLOY - CLÍNICA DELUX"
    echo ""
    echo -e "${GREEN}Opciones disponibles:${NC}"
    echo -e "  ${BLUE}1.${NC} Mostrar estado del deploy"
    echo -e "  ${BLUE}2.${NC} Listar backups disponibles"
    echo -e "  ${BLUE}3.${NC} Restaurar desde backup"
    echo -e "  ${BLUE}4.${NC} Limpiar backups antiguos"
    echo -e "  ${BLUE}5.${NC} Verificación completa del sistema"
    echo -e "  ${BLUE}6.${NC} Mostrar logs recientes"
    echo -e "  ${BLUE}0.${NC} Salir"
    echo ""
}

# Función principal
main() {
    case "${1:-menu}" in
        "status")
            show_deploy_status
            ;;
        "list-backups")
            list_backups
            ;;
        "restore")
            restore_from_backup "$2"
            ;;
        "cleanup")
            cleanup_backups "$2"
            ;;
        "verify")
            verify_system
            ;;
        "logs")
            show_logs
            ;;
        "menu"|"")
            while true; do
                show_menu
                echo -n "Selecciona una opción: "
                read -r choice
                case $choice in
                    1) show_deploy_status ;;
                    2) list_backups ;;
                    3) 
                        echo -n "Ruta del backup (o presiona Enter para ver lista): "
                        read -r backup_path
                        if [[ -z "$backup_path" ]]; then
                            list_backups
                            echo -n "Ruta del backup: "
                            read -r backup_path
                        fi
                        restore_from_backup "$backup_path"
                        ;;
                    4) 
                        echo -n "¿Cuántos backups mantener? (default: 5): "
                        read -r keep_count
                        cleanup_backups "${keep_count:-5}"
                        ;;
                    5) verify_system ;;
                    6) show_logs ;;
                    0) echo "¡Hasta luego!"; exit 0 ;;
                    *) warn "Opción inválida" ;;
                esac
                echo ""
                echo "Presiona Enter para continuar..."
                read -r
            done
            ;;
        *)
            echo "Uso: $0 [comando] [argumentos]"
            echo ""
            echo "Comandos disponibles:"
            echo "  status              - Mostrar estado del deploy"
            echo "  list-backups        - Listar backups disponibles"
            echo "  restore <ruta>      - Restaurar desde backup"
            echo "  cleanup [cantidad]  - Limpiar backups antiguos (mantener N)"
            echo "  verify              - Verificación completa del sistema"
            echo "  logs                - Mostrar logs recientes"
            echo "  menu                - Menú interactivo (default)"
            echo ""
            echo "Ejemplos:"
            echo "  $0 status"
            echo "  $0 restore /tmp/clinica_backup_20250807_120000"
            echo "  $0 cleanup 3"
            ;;
    esac
}

# Ejecutar función principal con argumentos
main "$@"
