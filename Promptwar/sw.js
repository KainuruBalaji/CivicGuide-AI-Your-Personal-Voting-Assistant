/**
 * CivicGuide AI — Service Worker
 * Provides offline caching via Cache API for performance and reliability.
 * Uses a cache-first strategy for static assets and network-first for HTML.
 * @version 1.0.0
 */

const CACHE_NAME = 'civicguide-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/data.js',
  '/js/security.js',
  '/js/utils.js',
  '/js/analytics.js',
  '/js/chatbot.js',
  '/js/app.js',
  '/assets/favicon.svg',
  '/manifest.json'
];

/**
 * Install event — pre-cache all static assets.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/**
 * Activate event — clean up old caches.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/**
 * Fetch event — cache-first for static assets, network-first for navigation.
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests and external requests
  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.location.origin)) return;

  // Network-first for HTML (always get latest)
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request) || caches.match('/index.html'))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      });
    })
  );
});
