// === service-worker.js ===

const CACHE_NAME = "kseb-cache-v3";  
const FILES_TO_CACHE = [
  "/calculator-under-dev/",
  "/calculator-under-dev/index.html",
  "/calculator-under-dev/style.css",
  "/calculator-under-dev/script.js",
  "/calculator-under-dev/manifest.json",
  "/calculator-under-dev/icons/icon-192.png",
  "/calculator-under-dev/icons/icon-512.png"
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
  // Notify clients about update
  self.clients.matchAll().then(clients => {
    clients.forEach(client =>
      client.postMessage({ type: "NEW_VERSION" })
    );
  });
});

// Fetch
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response =>
      response ||
      fetch(event.request).then(networkResponse => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
    )
  );
});
