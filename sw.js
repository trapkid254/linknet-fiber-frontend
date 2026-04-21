// sw.js - Service Worker for Linknet Fiber PWA
const CACHE_NAME = 'linknet-fiber-v1';
const STATIC_CACHE = 'linknet-static-v1';
const DYNAMIC_CACHE = 'linknet-dynamic-v1';

// Assets to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/packages.html',
  '/contact.html',
  '/request.html',
    '/css/style.css',
  '/js/main.js',
  '/js/packages.js',
  '/js/admin-login.js',
  '/js/admin-dashboard.js',
  '/js/coverage-search.js',
  '/js/darkmode.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and external API calls
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }
  
  // Strategy: Cache First for static assets, Network First for API calls
  if (STATIC_ASSETS.includes(url.pathname) || url.pathname.includes('/css/') || 
      url.pathname.includes('/js/') || url.pathname.includes('/images/')) {
    // Cache First for static assets
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // If not in cache, fetch from network and cache
          return fetch(request)
            .then((response) => {
              if (!response.ok) {
                throw new Error('Network response was not ok');
              }
              
              return caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, response.clone());
                  return response;
                });
            })
            .catch(() => {
              // Return offline page for navigation requests
              if (request.mode === 'navigate') {
                return caches.match('/index.html');
              }
              return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
            });
        })
    );
  } else {
    // Network First for HTML pages
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          
          // Cache successful responses
          if (request.mode === 'navigate') {
            return caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, response.clone());
                return response;
              });
          }
          
          return response;
        })
        .catch(() => {
          // Fallback to cache for navigation requests
          if (request.mode === 'navigate') {
            return caches.match(request) || caches.match('/index.html');
          }
          
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        })
    );
  }
});

// Background sync for form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync for offline form submissions
      console.log('Service Worker: Background sync triggered')
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'Explore',
          icon: 'https://picsum.photos/96/96?random=push'
        },
        {
          action: 'close',
          title: 'Close',
          icon: 'https://picsum.photos/96/96?random=close'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/packages.html')
    );
  }
});

// Periodic background sync for cache updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cache-update') {
    event.waitUntil(
      updateStaticCache()
    );
  }
});

// Update static cache
async function updateStaticCache() {
  try {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(STATIC_ASSETS);
    console.log('Service Worker: Static cache updated');
  } catch (error) {
    console.error('Service Worker: Failed to update static cache', error);
  }
}
