#!/bin/bash

# Deploy rápido para desarrollo
echo "🚀 Quick Deploy - Clínica Delux"
echo "================================"

# Build
echo "📦 Creando build..."
npm run build

# Deploy simple
echo "🚀 Deployando..."
sudo rm -rf /var/www/html/clinica-delux 2>/dev/null || true
sudo mkdir -p /var/www/html/clinica-delux
sudo cp -r dist/* /var/www/html/clinica-delux/
sudo cp -r public/api /var/www/html/clinica-delux/

# Permisos
sudo chown -R www-data:www-data /var/www/html/clinica-delux 2>/dev/null || sudo chown -R $(whoami):$(whoami) /var/www/html/clinica-delux

echo "✅ Deploy completado!"
echo "🌐 URL: http://localhost/clinica-delux/"
echo "👤 Login: admin / admin123"
