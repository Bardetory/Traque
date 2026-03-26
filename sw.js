// Service Worker TRAQUE — cache minimal pour installation PWA
const CACHE = 'traque-v1';
const OFFLINE_URL = '/';

// Installation : mettre en cache la page principale
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

// Activation : supprimer les anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch : réseau d'abord, cache en fallback si hors ligne
self.addEventListener('fetch', e => {
  // Ne pas intercepter les requêtes Supabase (toujours réseau)
  if(e.request.url.includes('supabase.co')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Mettre en cache les réponses réussies pour la page principale
        if(e.request.mode === 'navigate'){
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(cached => cached || caches.match(OFFLINE_URL)))
  );
});
