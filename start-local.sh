#!/bin/bash

echo "🚀 Iniciando Clínica Delux - Servidor Local"
echo "==========================================="

# Verificar si los puertos están ocupados
if lsof -i:8000 > /dev/null 2>&1; then
    echo "⚠️  Puerto 8000 ocupado, matando proceso..."
    pkill -f "php -S localhost:8000" 2>/dev/null || true
    sleep 2
fi

if lsof -i:3000 > /dev/null 2>&1; then
    echo "⚠️  Puerto 3000 ocupado, matando proceso..."
    pkill -f "vite" 2>/dev/null || true
    sleep 2
fi

echo "📡 Iniciando Backend PHP (puerto 8000)..."
cd public && php -S localhost:8000 > /dev/null 2>&1 &
BACKEND_PID=$!

echo "⚛️  Iniciando Frontend React (puerto 3000)..."
cd ..
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!

echo ""
echo "✅ Servidores iniciados:"
echo "   🖥️  Frontend: http://localhost:3000/"
echo "   🔧 Backend:  http://localhost:8000/"
echo "   👤 Login:    admin / admin123"
echo ""
echo "📋 PIDs: Backend=$BACKEND_PID, Frontend=$FRONTEND_PID"
echo "🛑 Presiona Ctrl+C para detener ambos servidores"

# Función para limpiar al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servidores..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    pkill -f "php -S localhost:8000" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    echo "✅ Servidores detenidos"
    exit 0
}

# Capturar Ctrl+C
trap cleanup INT

# Esperar indefinidamente
wait
