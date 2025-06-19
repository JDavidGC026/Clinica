import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const distPath = join(__dirname, '../dist');
const port = 3000;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = createServer((req, res) => {
  let filePath = join(distPath, req.url === '/' ? 'index.html' : req.url);
  
  // Manejar rutas SPA - redirigir a index.html
  if (!existsSync(filePath) && !req.url.startsWith('/api/')) {
    filePath = join(distPath, 'index.html');
  }

  if (existsSync(filePath)) {
    const ext = extname(filePath);
    const contentType = mimeTypes[ext] || 'text/plain';
    
    res.writeHead(200, { 
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    
    const content = readFileSync(filePath);
    res.end(content);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 - Archivo no encontrado');
  }
});

server.listen(port, () => {
  console.log(`🚀 Servidor de prueba ejecutándose en http://localhost:${port}`);
  console.log(`📁 Sirviendo archivos desde: ${distPath}`);
  console.log(`🔗 Abre tu navegador en: http://localhost:${port}`);
  console.log(`⏹️  Para detener: Ctrl+C`);
});