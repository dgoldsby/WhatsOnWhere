/* Basic PWA service worker: cache-first for static assets, network-first for pages */
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  '/',
  '/icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => ![STATIC_CACHE].includes(k)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Network-first for navigation requests (pages), fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const resClone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put('/', resClone));
          return response;
        })
        .catch(() => caches.match('/') || caches.match('/index.html'))
    );
    return;
  }

  // Cache-first for static files
  if (request.destination === 'image' || request.destination === 'style' || request.destination === 'script' || request.destination === 'font') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const resClone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, resClone));
          return response;
        });
      })
    );
  }
});
