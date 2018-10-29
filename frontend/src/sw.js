'use strict';

let cacheAppName = 'rest-reviews-v11';
let cacheAppFiles = [
  './',
  './index.html',
  './restaurant.html',
  './manifest.json',
  './css/styles.min.css',
  './js/index.js',
  './js/rest.js',
  './img/1.jpg',
  './img/2.jpg',
  './img/3.jpg',
  './img/4.jpg',
  './img/5.jpg',
  './img/6.jpg',
  './img/7.jpg',
  './img/8.jpg',
  './img/9.jpg',
  './img/10.jpg',
  './img/1-400.jpg',
  './img/2-400.jpg',
  './img/3-400.jpg',
  './img/4-400.jpg',
  './img/5-400.jpg',
  './img/6-400.jpg',
  './img/7-400.jpg',
  './img/8-400.jpg',
  './img/9-400.jpg',
  './img/10-400.jpg',
  './img/nophoto.jpg',
  './icons/favicon.png',
  './icons/icon-128.png',
  './icons/icon-196.png',
  './icons/icon-512.png',
  './img/icons/favorite.svg',
  './img/icons/favorite_true.svg',
  './img/icons/marker-icon.png',
  './img/icons/marker-shadow.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(cacheAppName).then(cache => {
      return cache.addAll(cacheAppFiles);
    })
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(cachesNames => {
      return Promise.all(
        cachesNames.filter(cachesName => {
          return cachesName.startsWith('rest-reviews-') && cachesName !== cacheAppName;
        }).map(cachesName => {
          return caches.delete(cachesName);
        })
      );
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request, {ignoreSearch: true}).then(response => {
      if (response) return response;
      return fetch(e.request);
    })
      .catch(err => {
        console.log('[SW] Fetch Error', err);
      })
  );
});
