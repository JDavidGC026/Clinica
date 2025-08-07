#!/bin/bash

# ==========================================
# SCRIPT DE DEPLOY AUTOMATIZADO - CLÍNICA DELUX
# ==========================================

set -e # Exit on any error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
DEPLOY_DIR="/var/www/clinica-delux"
BACKUP_DIR="/home/david/backups"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}  🚀 DEPLOY CLÍNICA DELUX v2.0${NC}"
echo -e "${BLUE}===========================================${NC}"
echo -e "${YELLOW}📅 Timestamp: $TIMESTAMP${NC}"
echo -e "${YELLOW}📁 Proyecto: $PROJECT_DIR${NC}"
echo -e "${YELLOW}🎯 Destino: $DEPLOY_DIR${NC}"
echo ""

# Funciones
show_progress() {
    echo -e "${GREEN}✅ $1${NC}"
}

show_error() {
    echo -e "${RED}❌ $1${NC}"
}

show_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 1. Verificar proyecto
if [ ! -f "package.json" ]; then
    show_error "No estamos en el directorio del proyecto"
    exit 1
fi

show_info "Directorio del proyecto verificado"

# 2. Crear build
show_info "Creando build de producción..."
npm run build
show_progress "Build creado"

# 3. Crear directorio de deploy
sudo mkdir -p "$DEPLOY_DIR"
sudo mkdir -p "$BACKUP_DIR"

# 4. Backup si existe
if [ -d "$DEPLOY_DIR" ] && [ "$(ls -A $DEPLOY_DIR)" ]; then
    show_info "Creando backup..."
    sudo tar -czf "$BACKUP_DIR/backup-$TIMESTAMP.tar.gz" -C "$DEPLOY_DIR" . 2>/dev/null || true
    show_progress "Backup creado"
fi

# 5. Limpiar y copiar
show_info "Deployando archivos..."
sudo rm -rf "$DEPLOY_DIR"/*
sudo cp -r dist/* "$DEPLOY_DIR/"
sudo cp -r public/api "$DEPLOY_DIR/"

# Copiar archivos adicionales
[ -f ".env" ] && sudo cp .env "$DEPLOY_DIR/"
[ -f "composer.json" ] && sudo cp composer.json "$DEPLOY_DIR/"

show_progress "Archivos copiados"

# 6. Permisos
show_info "Configurando permisos..."
sudo chown -R www-data:www-data "$DEPLOY_DIR" 2>/dev/null || sudo chown -R $(whoami):$(whoami) "$DEPLOY_DIR"
sudo chmod -R 755 "$DEPLOY_DIR"
show_progress "Permisos configurados"

# 7. Info de deploy
sudo tee "$DEPLOY_DIR/deploy-info.txt" > /dev/null << INFO
=== DEPLOY INFO ===
Fecha: $(date)
Versión: v2.0 - Mobile Responsive
Usuario: $(whoami)
Backup: $BACKUP_DIR/backup-$TIMESTAMP.tar.gz

=== ACCESO ===
Frontend: http://localhost/
API: http://localhost/api/
Credenciales: admin/admin123
INFO

# 8. Resumen
echo ""
echo -e "${GREEN}✅ DEPLOY COMPLETADO${NC}"
echo -e "${BLUE}📁 Deploy en: $DEPLOY_DIR${NC}"
echo -e "${BLUE}🌐 URL: http://localhost/${NC}"
echo -e "${BLUE}👤 Login: admin / admin123${NC}"
echo ""

show_progress "Deploy exitoso! 🎉"
