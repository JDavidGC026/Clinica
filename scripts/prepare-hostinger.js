import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const distPath = join(__dirname, '../dist');
const hostingerPath = join(__dirname, '../hostinger-deploy');

// Crear directorio de despliegue
if (!existsSync(hostingerPath)) {
  mkdirSync(hostingerPath, { recursive: true });
}

// Función para copiar directorio recursivamente
function copyDir(src, dest) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  
  const files = readdirSync(src);
  
  for (const file of files) {
    const srcPath = join(src, file);
    const destPath = join(dest, file);
    
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

console.log('📦 Preparando archivos para Hostinger...');

// Copiar archivos del build
copyDir(distPath, hostingerPath);

// Copiar archivos PHP de la API
const apiSrc = join(__dirname, '../public/api');
const apiDest = join(hostingerPath, 'api');

if (existsSync(apiSrc)) {
  copyDir(apiSrc, apiDest);
  console.log('✅ Archivos PHP de API copiados');
}

// Copiar .htaccess
const htaccessSrc = join(__dirname, '../public/.htaccess');
const htaccessDest = join(hostingerPath, '.htaccess');

if (existsSync(htaccessSrc)) {
  copyFileSync(htaccessSrc, htaccessDest);
  console.log('✅ Archivo .htaccess copiado');
}

console.log(`✅ Archivos preparados en: ${hostingerPath}`);
console.log('📋 Instrucciones:');
console.log('1. Sube todo el contenido de hostinger-deploy/ a tu public_html en Hostinger');
console.log('2. Configura las credenciales de MySQL en api/config.php');
console.log('3. Ejecuta api/setup-database.php?key=setup_db_2024 para crear las tablas');