/**
 * Phonics Fun service worker.
 *
 * Cache policy:
 *  - Content-hashed build assets (/assets/...) are immutable → cache first.
 *  - Everything else (sounds, images, index.html) is addressable by a stable
 *    URL and can be replaced by a new build → network first, cache fallback.
 *
 * The previous policy was cache-first for everything with a static cache
 * name, so a redeploy that replaced, say, the British-female voice pack kept
 * serving the previous recording forever on any device that had visited the
 * site once. The cache name is now stamped with a per-build identifier and
 * every old cache is removed on activation.
 */

// Replaced at build time with a per-build identifier.
const BUILD_ID = '__BUILD_ID__';

const CACHE_NAME = `phonics-fun-${BUILD_ID}`;

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
      // Clean up stale caches from previous builds, preserving current cache
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

// Is this a content-hashed, immutable build asset?
function isImmutableAsset(url) {
  return url.pathname.includes('/assets/');
}

// Fetch Event
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

  const requestUrl = new URL(event.request.url);

  // Immutable, content-hashed assets: serve from cache, refresh in the
  // background. Their URL changes whenever the content changes.
  if (isImmutableAsset(requestUrl)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const networkPromise = fetch(event.request)
          .then((networkResponse) => {
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === 'basic'
            ) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || networkPromise;
      })
    );
    return;
  }

  // Stable URLs (sounds, images): network first so a redeploy is picked up
  // immediately, with the cache as the offline fallback.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic'
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() =>
        caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // Safe offline fallback: return 503 so respondWith does not reject
          // with a TypeError.
          return new Response('', {
            status: 503,
            statusText: 'Service Unavailable (Offline)',
          });
        })
      )
  );
});
