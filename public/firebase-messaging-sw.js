// Firebase Messaging Service Worker placeholder
// Yaha FCM init hoga jab push notifications enable karne honge
// Abhi sirf 404 silence karne ke liye empty hai

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
