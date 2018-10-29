self.addEventListener('install', function(event){
  console.log('[service worker] installing service worker ... ', event);
});

self.addEventListener('activate', function(event){
  console.log('[service worker] Activating service worker ... ', event);
  return self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  console.log('[Service Worker] Fetching something ....', event);
  event.respondWith(fetch(event.request));
});