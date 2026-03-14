// SmartClock Service Worker
const CACHE_NAME = "smartclock-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
  // ネットワークファーストの戦略（勤怠データは常に最新が必要）
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
