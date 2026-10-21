const CACHE_NAME = 'tonmenu-static-v7';
const SHELL = [
  '/accueil/',
  '/accueil/mobile.css?v=6',
  '/accueil/mobile.js?v=9',
  '/shared/finance-core.js?v=1',
  '/shared/finance-store.js?v=1',
  '/pro/courier.html',
  '/pro/courier.css?v=1',
  '/pro/courier.js?v=1',
  '/api-config.js?v=1',
  '/site.webmanifest',
  '/images/logo-header.png',
  '/images/tonmenu-favicon.png',
  '/images/tonmenu-icon-192.png',
  '/images/tonmenu-icon-512.png',
  '/images/plats-sauce.webp',
  '/images/grillades.webp',
  '/images/attieke-poisson.webp',
  '/images/cuisine-africaine.webp',
  '/images/cuisine-libanaise.webp',
  '/images/burger-card.webp',
  '/images/pizza.webp',
  '/images/poisson.webp',
  '/images/croque.webp',
  '/images/patisserie.webp',
  '/images/poulet-sans-marque.webp'
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  const fallback = caches.match(event.request).then((cached) => cached || (event.request.mode === 'navigate' ? caches.match('/accueil/') : Response.error()));
  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => fallback));
});
