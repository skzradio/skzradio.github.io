// SKZ Radio - Service Worker con actualización automática en segundo plano (Network-First)
const CACHE_NAME = 'skz-radio-cache-v1.0.5';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  // Audios, peticiones externas y el catálogo dinámico van siempre directo por red
  if (
    url.includes('/audio/') ||
    url.includes('itunes.apple.com') ||
    url.includes('canciones.json')
  ) {
    return;
  }

  // Estrategia Network-First con fallback a caché: busca siempre la versión más reciente en la red
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});