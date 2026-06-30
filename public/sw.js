const CACHE_NAME = 'phonics-fun-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/js/main.js',
  '/js/event-bus.js',
  '/js/audio-manager.js',
  '/js/event-manager.js',
  '/js/collision-manager.js',
  '/js/particles.js',
  '/js/performance-utils.js',
  '/js/ui-utils.js',
  '/js/display-manager.js',
  '/js/android-benq-init.js',
  '/js/utils.js',
  '/css/styles.css',
  '/manifest.json',
  '/sounds/background-music.wav',
  '/sounds/explosion.wav',
  '/sounds/celebration.wav',
  '/sounds/phoneme-g.wav',
  '/images/G-g/Images/girl-clipart-lg.png',
  '/images/G-g/Images/goat-clipart-md(1).png',
  '/images/G-g/Images/pot-with-gold-clipart-md.png',
  '/images/G-g/Images/yoga-girl-clipart-md.png'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static shell');
      return cache.addAll(ASSETS_TO_CACHE);
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
