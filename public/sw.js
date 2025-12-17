// public/sw.js - SERVICE WORKER FOR CACHING
const CACHE_VERSION = 'v3';
const CACHE_NAME = `beseekr-cache-${CACHE_VERSION}`;
const API_CACHE_NAME = `beseekr-api-cache-${CACHE_VERSION}`;

// Resources to cache on install
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// API endpoints to cache
const CACHEABLE_API_PATTERNS = [
  /\/api\/agents/,
  /\/api\/conversations/,
  /\/api\/usage/,
];

// API endpoints to never cache
const UNCACHEABLE_API_PATTERNS = [
  /\/api\/auth\/login/,
  /\/api\/auth\/signup/,
  /\/api\/auth\/logout/,
  /\/api\/orchestration\/execute/,
];

// Cache duration in milliseconds
const API_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

/**
 * Install event - cache static resources
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('beseekr-') &&
                name !== CACHE_NAME &&
                name !== API_CACHE_NAME;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

/**
 * Check if URL should be cached
 */
function shouldCacheRequest(url) {
  // Don't cache non-GET requests
  if (url.method !== 'GET') return false;

  const urlString = url.url;

  // Check if explicitly uncacheable
  if (UNCACHEABLE_API_PATTERNS.some(pattern => pattern.test(urlString))) {
    return false;
  }

  // Check if cacheable API endpoint
  if (CACHEABLE_API_PATTERNS.some(pattern => pattern.test(urlString))) {
    return true;
  }

  return false;
}

/**
 * Check if cached response is still fresh
 */
function isCacheFresh(response) {
  if (!response) return false;

  const cachedTime = response.headers.get('sw-cached-time');
  if (!cachedTime) return false;

  const age = Date.now() - parseInt(cachedTime, 10);
  return age < API_CACHE_DURATION;
}

/**
 * Add timestamp header to response
 */
function addCacheTimestamp(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-cached-time', Date.now().toString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

/**
 * Network-first with cache fallback strategy for API calls
 */
async function networkFirstStrategy(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Only cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE_NAME);
      const responseToCache = addCacheTimestamp(networkResponse.clone());
      cache.put(request, responseToCache);
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network request failed, trying cache:', error);

    // If network fails, try cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log('[SW] Serving from cache');
      return cachedResponse;
    }

    // If no cache, return error response
    return new Response(
      JSON.stringify({
        error: 'Network unavailable and no cached data',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Cache-first with network fallback for static resources
 */
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    console.log('[SW] Serving static resource from cache');
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch resource:', error);
    throw error;
  }
}

/**
 * Stale-while-revalidate for API with fresh cache
 */
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);

  // Return cached response if fresh
  if (cachedResponse && isCacheFresh(cachedResponse)) {
    console.log('[SW] Serving fresh cache');
    return cachedResponse;
  }

  // Fetch from network
  const networkPromise = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(API_CACHE_NAME);
        const responseToCache = addCacheTimestamp(response.clone());
        cache.put(request, responseToCache);
      }
      return response;
    })
    .catch((error) => {
      console.error('[SW] Network error:', error);
      return null;
    });

  // Return stale cache immediately if available
  if (cachedResponse) {
    console.log('[SW] Serving stale cache, revalidating in background');
    return cachedResponse;
  }

  // Otherwise wait for network
  return networkPromise || new Response(
    JSON.stringify({ error: 'Request failed' }),
    { status: 503, headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * Fetch event - handle all requests
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip WebSocket connections
  if (url.pathname.includes('socket.io')) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    if (shouldCacheRequest(request)) {
      // Use stale-while-revalidate for cacheable API calls
      event.respondWith(staleWhileRevalidate(request));
    } else {
      // Use network-first for other API calls
      event.respondWith(networkFirstStrategy(request));
    }
    return;
  }

  // Handle static resources
  event.respondWith(cacheFirstStrategy(request));
});

/**
 * Message event - handle commands from main thread
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }

  if (event.data && event.data.type === 'CLEAR_API_CACHE') {
    event.waitUntil(
      caches.delete(API_CACHE_NAME)
    );
  }
});

console.log('[SW] Service worker loaded');