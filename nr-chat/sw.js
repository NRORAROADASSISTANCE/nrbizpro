const CACHE="nr-chat-v1";
const ASSETS=["/nr-chat/","/nr-chat/index.html","/nr-chat/styles.css","/nr-chat/app.js","/nr-chat/icon.svg","/nr-chat/manifest.webmanifest"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
