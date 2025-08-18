// Service Worker para Clínica Delux
const CACHE_NAME = 'clinica-delux-nocache-v1';

self.addEventListener('install', (event) => {
  // No precache. Tomar control inmediato.
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Siempre red directa y sin almacenar
  event.respondWith(
    fetch(event.request, { cache: 'no-store' }).catch(() => {
      // Como fallback, intentar devolver el propio request desde cache si existiera (no almacenamos nada)
      return caches.match(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  // Borrar cualquier cache existente y reclamar clientes
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
