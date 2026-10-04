/* ============================================================================
   VOTEZ BIEN ! — service-worker.js
   Différences volontaires avec la V5.1 auditée :
   1) Le numéro de version vit UNIQUEMENT dans CACHE_VERSION ci-dessous, plus
      dans les noms de fichiers (qui devaient être renommés à chaque mise à
      jour dans V5.1 — fragile, source d'oublis). Pour publier une mise à
      jour : changer CACHE_VERSION, rien d'autre.
   2) Un gestionnaire 'activate' supprime les anciens caches. La V5.1 n'en
      avait pas : chaque nouvelle version s'ajoutait au stockage du
      navigateur sans jamais nettoyer les précédentes.
   3) Stratégie "stale-while-revalidate" au lieu de cache-first pur : sert la
      version en cache immédiatement (rapide, fonctionne hors-ligne), tout
      en allant chercher une version à jour en arrière-plan pour la
      prochaine visite. Avec un cache-first pur, une personne qui garde
      l'app installée pouvait ne jamais voir les positions de partis mises
      à jour, même après republication.
   ========================================================================= */
const CACHE_VERSION = 'v6.3.0';
const CACHE_NAME = 'votez-bien-' + CACHE_VERSION;
const ASSETS = [
  './index.html',
  './styles.css',
  './data.js',
  './scoring.js',
  './app.js',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cached) => {
        const network = fetch(event.request)
          .then((response) => {
            if (response && response.ok) cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => cached); // hors-ligne : on retombe sur le cache s'il existe
        return cached || network;
      })
    )
  );
});
