const CACHE_NAME = 'truerisk-v1';
const OFFLINE_ASSETS = ['/map', '/emergency', '/icons/icon-192.png'];

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
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
