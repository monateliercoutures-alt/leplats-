const CACHE = 'tonmenu-pro-shell-v2';
const SHELL = [
  '/pro/',
  '/pro/index.html',
  '/pro/app.css?v=2',
  '/pro/app.js?v=2',
  '/pro/site.webmanifest'
];
const MEDIA = [
  'logo-header.png',
  'tonmenu-favicon.png',
  'tonmenu-icon-192.png',
  'tonmenu-icon-512.png',
  'story-meal.webp',
  'plats-sauce.webp',
  'grillades.webp',
  'attieke-poisson.webp',
  'cuisine-africaine.webp',
  'cuisine-libanaise.webp',
  'burger-card.webp',
  'pizza.webp',
  'poisson.webp',
  'croque.webp',
  'patisserie.webp'
];

async function cacheMedia(cache) {
  await Promise.all(MEDIA.map(async name => {
    try {
      const response = await fetch(`/images/${name}`);
      if (response.ok) await cache.put(`/pro/media/${name}`, response);
    } catch (_) { /* Keep installing the app shell if an optional image is missing. */ }
  }));
}

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE)
    .then(async cache => { await cache.addAll(SHELL); await cacheMedia(cache); })
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith('tonmenu-pro-') && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  const url = new URL(request.url);

  if (request.mode === 'navigate' && url.pathname.startsWith('/pro')) {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) caches.open(CACHE).then(cache => cache.put('/pro/', response.clone()));
      return response;
    }).catch(() => caches.match('/pro/').then(cached => cached || caches.match('/pro/index.html'))));
    return;
  }

  if (url.pathname.startsWith('/pro/media/')) {
    const name = decodeURIComponent(url.pathname.slice('/pro/media/'.length));
    if (!/^[a-z0-9-]+\.(?:png|webp)$/i.test(name)) return;
    event.respondWith(caches.match(request).then(cached => cached || fetch(`/images/${name}`).then(response => {
      if (response.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone()));
      return response;
    })));
    return;
  }

  if (url.pathname.startsWith('/pro/')) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone()));
      return response;
    })));
  }
});
