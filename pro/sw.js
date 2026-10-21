const CACHE = 'tonmenu-pro-shell-v4';
const ROOT = new URL('./', self.location.href);
const rootPath = ROOT.pathname;
const atRoot = path => new URL(path, ROOT).href;
const SHELL = [
  ROOT.href,
  atRoot('index.html'),
  atRoot('app.css?v=4'),
  atRoot('app.js?v=4'),
  atRoot('site.webmanifest'),
  atRoot('api-config.js?v=1')
];
const MEDIA = [
  'logo-header.png', 'tonmenu-favicon.png', 'tonmenu-icon-192.png', 'tonmenu-icon-512.png',
  'story-meal.webp', 'plats-sauce.webp', 'grillades.webp', 'attieke-poisson.webp',
  'cuisine-africaine.webp', 'cuisine-libanaise.webp', 'burger-card.webp', 'pizza.webp',
  'poisson.webp', 'croque.webp', 'patisserie.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE)
    .then(async cache => {
      await cache.addAll(SHELL);
      await Promise.all(MEDIA.map(async name => {
        try {
          const url = atRoot(`media/${name}`);
          const response = await fetch(url);
          if (response.ok) await cache.put(url, response);
        } catch (_) { /* An optional image must not block installation. */ }
      }));
    })
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith('tonmenu-pro-shell-') && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response.ok && url.pathname === rootPath) caches.open(CACHE).then(cache => cache.put(ROOT.href, response.clone()));
      return response;
    }).catch(() => caches.match(request).then(cached => cached || caches.match(ROOT.href))));
    return;
  }

  if (url.pathname.startsWith(rootPath)) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone()));
      return response;
    })));
  }
});
