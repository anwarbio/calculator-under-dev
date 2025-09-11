// === service-worker.js ===

// bump this when you want to reset cache
const CACHE_NAME = "kseb-cache-v9";  

const BASE_PATH = "/calculator-under-dev";

const FILES_TO_CACHE = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/icons/icon-192.png`,
  `${BASE_PATH}/icons/icon-512.png`
];

// Install
self.addEventListener("install", event => {
  console.log("[SW] Install new version");
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate
self.addEventListener("activate", event => {
  console.log("[SW] Activate and cleanup old caches");
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => (key !== CACHE_NAME ? caches.delete(key) : null))
      )
    )
  );
  self.clients.claim();
  self.clients.matchAll().then(clients => {
    clients.forEach(client => client.postMessage({ type: "NEW_VERSION" }));
  });
});

// Fetch strategy with cache-busting for index.html
self.addEventListener("fetch", event => {
  const req = event.request;

  // Force network-first for navigations (index.html)
  if (req.mode === "navigate" || req.destination === "document") {
    event.respondWith(
      fetch(req.url + "?v=" + Date.now(), { cache: "no-store" })
        .then(res => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(`${BASE_PATH}/index.html`, res.clone()); // always update cache
            return res;
          });
        })
        .catch(() => caches.match(`${BASE_PATH}/index.html`)) // fallback to cached
    );
    return;
  }

  // For other files (icons, manifest) → cache first
  event.respondWith(
    caches.match(req).then(cached =>
      cached ||
      fetch(req).then(res =>
        caches.open(CACHE_NAME).then(cache => {
          cache.put(req, res.clone());
          return res;
        })
      )
    )
  );
});
