// === service-worker.js ===

// bump cache name whenever structure changes
const CACHE_NAME = "kseb-cache-v6";  

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
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
      Promise.all(keys.map(key => (key !== CACHE_NAME ? caches.delete(key) : null)))
    )
  );
  self.clients.claim();
  self.clients.matchAll().then(clients => {
    clients.forEach(client => client.postMessage({ type: "NEW_VERSION" }));
  });
});

// Fetch strategy: 
// - JS & HTML → network first, fallback to cache
// - Others → cache first, fallback to network
self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.destination === "document" || req.destination === "script") {
    // network first
    event.respondWith(
      fetch(req).then(res => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(req, res.clone());
          return res;
        });
      }).catch(() => caches.match(req))
    );
  } else {
    // cache first
    event.respondWith(
      caches.match(req).then(cached =>
        cached ||
        fetch(req).then(res => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(req, res.clone());
            return res;
          });
        })
      )
    );
  }
});

