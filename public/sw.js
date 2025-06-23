// Service Worker para Clínica Delux
const CACHE_NAME = 'clinica-delux-v1';
const urlsToCache = [
  './',
  './index.html',
  './assets/index.css',
  './assets/index.js',
  './manifest.json',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  // Saltarse la fase de espera
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
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