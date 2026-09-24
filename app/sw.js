// Plan My Bathroom — service worker
// Caches the app shell so it keeps working with no signal once it's been opened once.

var CACHE_NAME = "plan-my-bathroom-v1";
var APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL).catch(function () {
        // If one of the shell files 404s (e.g. different filename on this host),
        // don't let it block install — fetch handler below still caches on the fly.
      });
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) { return key !== CACHE_NAME; })
          .map(function (key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.open(CACHE_NAME).then(function (cache) {
      return fetch(event.request)
        .then(function (response) {
          if (response && response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(function () {
          return cache.match(event.request).then(function (cached) {
            return cached || cache.match("./index.html");
          });
        });
    })
  );
});
