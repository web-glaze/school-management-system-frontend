// Placeholder service worker.
//
// Firebase Cloud Messaging is intentionally disabled (FIREBASE_ENABLED=false
// in the backend .env). The browser still requests this file at
// /firebase-messaging-sw.js when a previous build registered a SW or when
// FCM scripts probe for it. We ship this empty SW so the request 200s and
// no console errors appear.
//
// When FCM is eventually turned on, replace this file with the real
// firebase-messaging-sw.js that imports firebase/messaging and calls
// `messaging.onBackgroundMessage(...)`.

self.addEventListener("install", () => {
  // Activate immediately so a stale older SW (if any) is replaced.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Take control of any open pages right away.
  event.waitUntil(self.clients.claim());
});

// No fetch / push / notificationclick handlers — this is intentionally a
// no-op SW.
