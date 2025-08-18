#!/bin/bash

set -e

# Deploy rápido para desarrollo
echo "🚀 Quick Deploy - Clínica Delux"
echo "================================"

# Solicitar confirmación para limpiar build anterior y corregir permisos
read -p "Este proceso limpiará la carpeta dist y /var/www/html/clinica-delux. ¿Deseas continuar? [y/N]: " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "❌ Cancelado por el usuario."
  exit 1
fi

# Corregir permisos locales que pueden romper el build (dist anterior)
echo "🧹 Limpiando build previo y corrigiendo permisos..."
sudo rm -rf dist || true
mkdir -p dist
sudo chown -R $(whoami):$(whoami) dist || true
find dist -type d -exec chmod 755 {} + 2>/dev/null || true
find dist -type f -exec chmod 644 {} + 2>/dev/null || true

# Build
echo "📦 Creando build..."
npm run build || { echo "❌ Error en build"; exit 1; }

# Deploy simple
echo "🚀 Deployando..."
# Borrar despliegue anterior (requiere sudo una sola vez)
sudo rm -rf /var/www/html/clinica-delux 2>/dev/null || true
sudo mkdir -p /var/www/html/clinica-delux

# Copiar artefactos
sudo cp -r dist/* /var/www/html/clinica-delux/
# Asegurar APIs PHP en destino
sudo rm -rf /var/www/html/clinica-delux/api 2>/dev/null || true
sudo mkdir -p /var/www/html/clinica-delux/api
sudo cp -r public/api/* /var/www/html/clinica-delux/api/

# Permisos destino
if id "www-data" >/dev/null 2>&1; then
  sudo chown -R www-data:www-data /var/www/html/clinica-delux
else
  sudo chown -R $(whoami):$(whoami) /var/www/html/clinica-delux
fi
sudo find /var/www/html/clinica-delux -type d -exec chmod 755 {} +
sudo find /var/www/html/clinica-delux -type f -exec chmod 644 {} +

# Archivos especiales
if [ -f public/.htaccess ]; then
  sudo cp public/.htaccess /var/www/html/clinica-delux/.htaccess
fi

echo "✅ Deploy completado!"
echo "🌐 URL: http://localhost/clinica-delux/"
echo "👤 Login: admin / admin123"
