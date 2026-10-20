/*
 * School Dashboard service worker
 * Stage 1: establish the app's service-worker foundation.
 * Offline caching is intentionally not enabled yet, to avoid caching
 * private school data or authentication-related responses.
 */
self.addEventListener("install", function (event) {
  self.skipWaiting();
});
self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});
