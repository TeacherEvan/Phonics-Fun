const CACHE_NAME = 'phonics-fun-v2';

// Precache the static shell. Build output uses hashed filenames under
// assets/, so we do NOT hardcode per-file paths here — they change every
// build and a stale list breaks the install event (cache.addAll throws on
// any missing file, wedging the SW). Instead we precache only the
// entry points and let the fetch handler cache everything else at runtime.
const PRECACHE_ENTRIES = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache what we can; a missing entry is not fatal — the fetch
      // handler will populate the cache on first request.
      return Promise.all(
        PRECACHE_ENTRIES.map((url) =>
          cache.add(url).catch((err) =>
            console.warn('[Service Worker] Failed to precache', url, err)
          )
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Cache First with network fallback)
self.addEventListener('fetch', (event) => {
  // Only handle HTTP/HTTPS (ignore chrome-extension, etc.)
  if (!event.request.url.startsWith('http')) return;

  // Navigation requests: try network first, fall back to cached index.html
  // so the app is usable offline after first load.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      }).catch(() =>
        caches.match('/index.html')
      )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Cache dynamically fetched files
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Offline fallback can be added here if needed
      });
    })
  );
});
