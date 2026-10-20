/*
 * School Dashboard service worker
 * Offline support for the local Assignment Tracker only.
 *
 * Intentionally does not cache API responses, Google data, authentication
 * tokens, or other private/user-specific network responses.
 */
const STATIC_CACHE = "school-dashboard-static-v1";
const TRACKER_CACHE = "school-dashboard-tracker-v1";
const APP_ASSETS = [
  "/manifest.webmanifest",
  "/logo.png",
  "/style.css",
  "/theme-loader.js",
  "/sidebar.js",
  "/assignment-notifications.js"
];
const TRACKER_URLS = ["/assignment-tracker", "/assignment-tracker.html"];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const staticCache = await caches.open(STATIC_CACHE);
    await Promise.all(APP_ASSETS.map(async url => {
      try {
        const response = await fetch(url, { cache: "reload" });
        if (response.ok) await staticCache.put(url, response);
      } catch (error) {
        // A single optional asset failing should not prevent worker installation.
        console.warn("[PWA] Could not pre-cache asset:", url, error);
      }
    }));

    const trackerCache = await caches.open(TRACKER_CACHE);
    for (const url of TRACKER_URLS) {
      try {
        const response = await fetch(url, { cache: "reload" });
        if (response.ok) await trackerCache.put(url, response);
      } catch (error) {
        console.warn("[PWA] Could not pre-cache Assignment Tracker:", url, error);
      }
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keep = new Set([STATIC_CACHE, TRACKER_CACHE]);
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith("school-dashboard-") && !keep.has(key)).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API calls or responses that could contain private data.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  if (request.mode === "navigate" && TRACKER_URLS.includes(url.pathname)) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(TRACKER_CACHE);
          await cache.put(url.pathname, response.clone());
        }
        return response;
      } catch (error) {
        const cache = await caches.open(TRACKER_CACHE);
        const cached = await cache.match(url.pathname) || await cache.match("/assignment-tracker");
        if (cached) return cached;
        return new Response("The Assignment Tracker has not been saved for offline use yet. Connect to the internet once, then try again.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      }
    })());
    return;
  }

  // Cache static same-origin files, but never API/auth responses.
  if (APP_ASSETS.includes(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(url.pathname);
      if (cached) {
        fetch(request).then(response => {
          if (response.ok) cache.put(url.pathname, response.clone());
        }).catch(() => {});
        return cached;
      }
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(url.pathname, response.clone());
        return response;
      } catch (error) {
        return new Response("This resource is unavailable offline.", { status: 503 });
      }
    })());
  }
});
