
// sw.js - Linknet Fiber Service Worker v2
// Handles caching, offline support, and PWA install

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `linknet-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `linknet-dynamic-${CACHE_VERSION}`;

// Core files that MUST be cached for offline use
// Only list files that definitely exist and are served from our own origin
const CORE_ASSETS = [
  './index.html',
  './packages.html',
  './about.html',
  './contact.html',
  './request.html',
  './manifest.json',
  './css/style.css',
  './css/admin.css',
  './js/main.js',
  './js/darkmode.js',
  './js/packages.js',
  './js/coverage-search.js',
  './js/about-coverage.js',
  './js/contact.js',
  './js/request.js',
  './js/pwa-install.js',
  './js/admin-login.js',
  './js/admin-dashboard.js',
  './admin/login.html',
  './admin/dashboard.html',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './images/cb5e0bad-d1af-441b-b7d3-1a62c423fc2f.jpg'
];

// ── Install: cache all core assets ───────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching core assets');
      // Use individual adds so one failure doesn't break the whole install
      return Promise.allSettled(
        CORE_ASSETS.map(url =>
          cache.add(url).catch(err => console.warn(`[SW] Failed to cache ${url}:`, err.message))
        )
      );
    }).then(() => {
      console.log('[SW] Install complete — activating immediately');
      return self.skipWaiting();
    })
  );
});

// ── Activate: clean old caches ────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => {
      console.log('[SW] Activated — claiming clients');
      return self.clients.claim();
    })
  );
});

// ── Fetch: smart caching strategy ────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin API calls (backend on Render) — let them go to network
  if (url.hostname.includes('onrender.com') || url.hostname.includes('mongodb')) return;

  // Skip chrome-extension and non-http(s) schemes
  if (!url.protocol.startsWith('http')) return;

  // External fonts/CDN: cache-first (they rarely change)
  if (url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com') ||
      url.hostname.includes('cdnjs.cloudflare.com')) {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Our own HTML pages: network-first so fresh content loads, fallback to cache
  if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Our own CSS/JS/images/icons: cache-first (fast loads)
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Everything else: network with cache fallback
  event.respondWith(networkFirst(request));
});

// ── Cache strategies ──────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Return a simple offline response for non-navigation requests
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200 && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Try cache
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fallback to index.html for navigation
    if (request.mode === 'navigate') {
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
    }

    return new Response(
      `<!DOCTYPE html>
      <html><head><meta charset="UTF-8"><title>Offline - Linknet Fiber</title>
      <style>
        body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;
             min-height:100vh;margin:0;background:#f7fafc;color:#2d3748;text-align:center;padding:20px}
        .card{background:#fff;border-radius:16px;padding:40px;max-width:400px;box-shadow:0 4px 24px rgba(0,0,0,.1)}
        h1{color:#1E4D8C;margin-bottom:8px}
        p{color:#718096;margin-bottom:24px}
        button{background:#1E4D8C;color:#fff;border:none;border-radius:8px;
               padding:12px 28px;font-size:1rem;font-weight:600;cursor:pointer}
      </style></head>
      <body>
        <div class="card">
          <div style="font-size:3rem;margin-bottom:16px">📡</div>
          <h1>You're Offline</h1>
          <p>Please check your internet connection and try again.</p>
          <button onclick="location.reload()">Try Again</button>
        </div>
      </body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// ── Push Notifications ────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'Linknet Fiber', {
        body: data.body || 'You have a new notification',
        icon: './icons/icon-192.png',
        badge: './icons/icon-96.png',
        vibrate: [100, 50, 100],
        data: { url: data.url || './' },
        actions: [
          { action: 'open', title: 'Open App' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      })
    );
  } catch (e) {
    console.warn('[SW] Push notification error:', e);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data?.url || './';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

console.log('[SW] Service worker script loaded');

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

