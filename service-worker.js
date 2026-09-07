const CACHE="babigames-v1";
const ASSETS=["./","./index.html","./css/style.css","./js/app.js","./js/games.js","./manifest.json"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(x=>{
  const copy=x.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return x;
}).catch(()=>caches.match("./index.html")))));
