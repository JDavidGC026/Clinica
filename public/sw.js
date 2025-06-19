const CACHE_NAME = 'gmd-sistema-v1.0.0';
const STATIC_CACHE = 'gmd-static-v1.0.0';
const DYNAMIC_CACHE = 'gmd-dynamic-v1.0.0';

// Archivos que se cachearán inmediatamente
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Archivos que NO se deben cachear
const EXCLUDED_URLS = [
  '/api/',
  'chrome-extension://',
  'moz-extension://',
  'safari-extension://',
  'ms-browser-extension://'
];

// Instalar Service Worker
self.addEventListener('install', event => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Cacheando archivos estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Service Worker instalado correctamente');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Error durante la instalación:', error);
      })
  );
});

// Activar Service Worker
self.addEventListener('activate', event => {
  console.log('[SW] Activando Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Eliminando caché obsoleto:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activado');
        return self.clients.claim();
      })
  );
});

// Interceptar peticiones de red
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Excluir URLs que no deben ser cacheadas
  if (EXCLUDED_URLS.some(excluded => request.url.includes(excluded))) {
    return;
  }
  
  // Estrategia Cache First para archivos estáticos
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image' ||
      request.url.includes('/assets/')) {
    
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            return response;
          }
          
          return fetch(request)
            .then(fetchResponse => {
              if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                return fetchResponse;
              }
              
              const responseToCache = fetchResponse.clone();
              caches.open(STATIC_CACHE)
                .then(cache => {
                  cache.put(request, responseToCache);
                });
              
              return fetchResponse;
            });
        })
    );
    return;
  }
  
  // Estrategia Network First para el HTML principal y APIs
  if (request.mode === 'navigate' || request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Si es una navegación exitosa, cachear la respuesta
          if (request.mode === 'navigate' && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                cache.put(request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          // Si falla la red, intentar servir desde caché
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return caches.match(request);
        })
    );
    return;
  }
  
  // Para otras peticiones, intentar red primero, luego caché
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then(cache => {
              cache.put(request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Manejar mensajes del cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Sincronización en segundo plano (para futuras funcionalidades)
self.addEventListener('sync', event => {
  console.log('[SW] Evento de sincronización:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Aquí se pueden sincronizar datos cuando se recupere la conexión
      console.log('[SW] Ejecutando sincronización en segundo plano')
    );
  }
});

// Notificaciones push (para futuras funcionalidades)
self.addEventListener('push', event => {
  console.log('[SW] Notificación push recibida');
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación del sistema',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalles',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Grupo Médico Delux', options)
  );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', event => {
  console.log('[SW] Clic en notificación:', event.notification.tag);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});