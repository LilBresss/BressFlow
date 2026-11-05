// BressFlow Service Worker for Background Web Push Notifications

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {
    title: 'BressFlow Scadenza',
    body: 'Hai una scadenza imminente!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    url: '/',
    data: {},
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (err) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || 'https://api.iconify.design/lucide:clock.svg?color=%236366f1',
    badge: data.badge || 'https://api.iconify.design/lucide:bell.svg?color=%236366f1',
    vibrate: [100, 50, 100],
    data: data.data || { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Apri BressFlow' },
      { action: 'dismiss', title: 'Ignora' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
