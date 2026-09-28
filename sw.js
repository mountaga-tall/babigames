const CACHE_NAME='babigames-v4';
const ASSETS=['./','./index.html','./css/style.css','./js/main.js','./js/snake.js','./js/minesweeper.js','./js/board-games.js','./js/arcade-games.js','./manifest.json','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(caches.match(event.request).then(cached=>{
    if(cached)return cached;
    return fetch(event.request).then(response=>{
      if(response&&(response.ok||response.type==='opaque'))caches.open(CACHE_NAME).then(cache=>cache.put(event.request,response.clone())).catch(()=>{});
      return response;
    }).catch(()=>event.request.mode==='navigate'?caches.match('./index.html'):Response.error());
  }));
});
