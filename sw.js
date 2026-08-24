// Service Worker for LASUASA Election Portal
// Provides offline support, caching, and performance optimization

const CACHE_NAME = 'lasuasa-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  'https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js',
  'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js'
];

// Install: Cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('✓ Service Worker: Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.log('SW: Some assets could not be cached (this is normal)', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            console.log('✓ Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-first with cache fallback
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip admin/private requests
  if (event.request.url.includes('/admin') || event.request.url.includes('/private')) {
    return;
  }

  // Network-first strategy for API calls
  if (event.request.url.includes('supabase')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful responses
          if (response.ok) {
            const cache_copy = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, cache_copy);
            });
          }
          return response;
        })
        .catch(() => {
          // Fall back to cache if network fails
          return caches.match(event.request)
            .then(cached => cached || new Response(
              JSON.stringify({ error: 'Offline - using cached data' }), 
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            ));
        })
    );
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200) {
            return response;
          }
          const response_copy = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response_copy);
          });
          return response;
        })
      )
      .catch(() => new Response('Offline', { status: 503 }))
  );
});

// Handle push notifications for vote confirmation
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    self.registration.showNotification('LASUASA Elections', {
      body: data.message || 'Vote submitted successfully',
      icon: '/icon.png',
      tag: 'vote-notification'
    });
  }
});
