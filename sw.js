
const CACHE_NAME = 'babigames-v1';
const urlsToCache = [
    './',
    './index.html',
    './css/style.css',
    './js/main.js',
    './js/snake.js',
    './js/minesweeper.js',
    './js/board-games.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

// Install Event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});

// Fetch Event (Cache First for offline)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});

// Activate Event (Cleanup old caches)
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) return caches.delete(cache);
                })
            );
        })
    );
});
