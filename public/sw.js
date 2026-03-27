const CACHE_NAME = 'truerisk-v4';
const API_CACHE_MAX_AGE = 30 * 60 * 1000; // 30 minutes
const OFFLINE_ASSETS = [
  '/map',
  '/emergency',
  '/dashboard',
  '/safety',
  '/alerts',
  '/icons/icon-192.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'TrueRisk Alert';
  const options = {
    body: data.body || 'Emergency alert detected',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || 'truerisk-alert',
    data: { url: data.url || '/alerts', provinceCode: data.provinceCode },
    actions: [
      { action: 'view', title: 'View details' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/alerts';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const client = clients.find((c) => c.visibilityState === 'visible');
      if (client) return client.navigate(url).then((c) => c?.focus());
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Network-first for specific API calls — only cache paths useful for offline
  const CACHEABLE_API = ['/api/risk/', '/api/alerts', '/api/weather/'];

  if (url.pathname.startsWith('/api/')) {
    const shouldCache = CACHEABLE_API.some((p) => url.pathname.startsWith(p));
    // Use origin + pathname as cache key (strip tokens/query params for scoping)
    const cacheKey = new Request(url.origin + url.pathname);
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok && shouldCache) {
            const cloned = response.clone();
            cloned.blob().then((body) => {
              const headers = new Headers(cloned.headers);
              headers.set('sw-cached-at', Date.now().toString());
              const cachedResponse = new Response(body, {
                status: cloned.status,
                statusText: cloned.statusText,
                headers,
              });
              caches.open(CACHE_NAME).then((cache) => cache.put(cacheKey, cachedResponse));
            });
          }
          return response;
        })
        .catch(() =>
          caches.match(cacheKey).then((cached) => {
            if (!cached) return cached;
            const cachedAt = parseInt(cached.headers.get('sw-cached-at') || '0');
            if (Date.now() - cachedAt > API_CACHE_MAX_AGE) {
              // Cache expired — remove and return undefined so browser handles the error
              caches.open(CACHE_NAME).then((cache) => cache.delete(cacheKey));
              return undefined;
            }
            return cached;
          })
        )
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
