const CACHE_NAME='babigames-v6';
const ASSETS=['./','./index.html','./css/style.css?v=6','./js/main.js?v=6','./js/config.js?v=6','./js/auth.js?v=6','./js/snake.js?v=6','./js/minesweeper.js?v=6','./js/board-games.js?v=6','./js/arcade-games.js?v=6','./manifest.json','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const request=event.request;
  const url=new URL(request.url);
  const isAppAsset=url.pathname.endsWith('/index.html')||/\.(css|js)$/.test(url.pathname);
  event.respondWith((isAppAsset?fetch(request):caches.match(request)).then(response=>{
    if(response){
      if(isAppAsset)caches.open(CACHE_NAME).then(cache=>cache.put(request,response.clone())).catch(()=>{});
      return response;
    }
    return fetch(request).then(networkResponse=>{
      if(networkResponse&&(networkResponse.ok||networkResponse.type==='opaque'))caches.open(CACHE_NAME).then(cache=>cache.put(request,networkResponse.clone())).catch(()=>{});
      return networkResponse;
    });
  }).catch(()=>caches.match(request).then(cached=>cached||(request.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});