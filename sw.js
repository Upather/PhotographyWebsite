/* Service Worker for PWA - Caching and Offline Support */

const CACHE_NAME = 'photography-portfolio-v1';
const RUNTIME_CACHE = 'photography-runtime-v1';
const IMAGE_CACHE = 'photography-images-v1';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/assets/css/styles.css',
  '/assets/js/script.js',
  '/assets/js/gallery.js',
  '/assets/js/seo.js',
  '/assets/js/performance.js',
  '/assets/js/pwa.js',
  '/assets/js/config.js',
  '/manifest.json',
  '/assets/images/favicon.png'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS.map(url => new Request(url, { cache: 'reload' })))
          .catch((err) => {
            console.warn('Service Worker: Pre-cache failed for some assets:', err);
            // Continue even if some assets fail to cache
            return Promise.resolve();
          });
      })
      .then(() => {
        return self.skipWaiting(); // Activate immediately
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME &&
                   cacheName !== RUNTIME_CACHE &&
                   cacheName !== IMAGE_CACHE;
          })
          .map((cacheName) => {
            return caches.delete(cacheName);
          })
      );
    })
    .then(() => {
      return self.clients.claim(); // Take control of all pages immediately
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (except images)
  if (url.origin !== location.origin && !request.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request)
            .then((response) => {
              // Cache successful responses
              if (response && response.status === 200) {
                const responseToCache = response.clone();
                caches.open(RUNTIME_CACHE).then((cache) => {
                  cache.put(request, responseToCache);
                });
              }
              return response;
            })
            .catch(() => {
              // Offline fallback - return cached index.html if available
              return caches.match('/index.html');
            });
        })
    );
    return;
  }

  // Handle image requests with cache-first strategy
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request)
            .then((response) => {
              // Cache images that load successfully
              if (response && response.status === 200) {
                const responseToCache = response.clone();
                caches.open(IMAGE_CACHE).then((cache) => {
                  // Limit image cache size - remove oldest if cache is too large
                  cache.put(request, responseToCache).then(() => {
                    cache.keys().then((keys) => {
                      // Keep only last 100 images
                      if (keys.length > 100) {
                        cache.delete(keys[0]);
                      }
                    });
                  });
                });
              }
              return response;
            })
            .catch(() => {
              // Return placeholder image if offline and not cached
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="#f5f5f7" width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" fill="#86868b" font-family="sans-serif" font-size="16">Image unavailable offline</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            });
        })
    );
    return;
  }

  // Handle CSS, JS, and other assets with network-first strategy
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'font') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Default: network-first for other requests
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
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

// Background sync for offline form submissions (if needed)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks here
      Promise.resolve()
    );
  }
});

// Push notification support (optional)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/assets/images/icon-192x192.png',
    badge: '/assets/images/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'photography-update',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('Photography Portfolio', options)
  );
});
