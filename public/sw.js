// Service Worker para Clínica Delux
const CACHE_NAME = 'clinica-delux-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  // Nota: Los assets se generan dinámicamente por Vite, no los incluimos aquí
];

self.addEventListener('install', (event) => {
  // Saltarse la fase de espera
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        // Solo cachear archivos que sabemos que existen
        return cache.addAll(['./', './index.html', './manifest.json']);
      })
      .catch((error) => {
        console.log('Error al cachear archivos:', error);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // No usar cache para las peticiones API
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  // Para otros recursos, intentar red primero, luego cache
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  // Reclamar clientes para que el nuevo service worker tome efecto inmediatamente
  event.waitUntil(clients.claim());
  
  // Limpiar caches antiguas
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});