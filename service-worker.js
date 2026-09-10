const CACHE='nr-bizpro-shell-v5';
const APP_SHELL=['/','/index.html','/styles.css','/manifest.webmanifest','/pwa-icon.svg','/smart-print.html','/smart-print.css','/smart-print.js','/smart-print-manual-crop.js','/smart-print-final-override.js'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP_SHELL)))});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('nr-bizpro-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;
 if(event.request.mode==='navigate' && url.pathname==='/smart-print.html'){
   event.respondWith(fetch(new Request('/smart-print.html'+(url.search||''),{cache:'no-store'})).catch(()=>caches.match('/smart-print.html')));return;
 }
 event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}return response}).catch(()=>{if(event.request.mode==='navigate')return caches.match('/index.html');return caches.match(event.request).then(cached=>cached||new Response('NR BizPro resource temporarily unavailable. Please retry.',{status:503,headers:{'Content-Type':'text/plain'}}))}));
});