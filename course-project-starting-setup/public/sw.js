var CACHE_STATIC_NAME = 'staticaja-v7';
var CACHE_DYNAMIC_NAME = 'dynamicaja-v5';
var STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/promise.js',
  '/src/js/fetch.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];

// function trimCache(cacheName, maxItems){
  
//   caches.open(cacheName)
//     .then(function(cache){
//       return cache.keys()
//         .then(function(keys){
//           if(keys.length > maxItems){
//             caches.delete(keys[0])
//               .then(trimCache(cacheName, maxItems));
//           }
//         })
//     });
// }

self.addEventListener('install', function(event){
  console.log('[service worker] installing service worker ... ', event);
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
      .then(function(cache){
        console.log('[]service worker] precaching app shell');
        cache.addAll(STATIC_FILES);
      })
  );
});



self.addEventListener('activate', function(event){
  console.log('[service worker] Activating service worker ... ', event);
  event.waitUntil(
    caches.keys().then(function(keylist){
      return Promise.all(keylist.map(function(key){
        if(key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME){
          console.log('[service worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});




// self.addEventListener('fetch', function(event) {
//   //console.log('[Service Worker] Fetching something ....', event);
//   event.respondWith(
//     caches.match(event.request)
//       .then(function(response){
//         if(response){
//           return response;
//         } else {
//           return fetch(event.request).then(function(res){
//                     return caches.open(CACHE_DYNAMIC_NAME).then(function(cache){
//                             cache.put(event.request.url, res.clone())
//                             return res;
//                           })
//                   }).catch(function(err){
//                     return caches.open(CACHE_STATIC_NAME)
//                       .then(function(cache){
//                         return cache.match('/offline.html');
//                       })
//                   });
//         }
//       })
//   );
// });


// cache only strategy
// self.addEventListener('fetch', function(event) {
//   //console.log('[Service Worker] Fetching something ....', event);
//   event.respondWith(
//     caches.match(event.request)
//       .then(function(response){
//         return response;
//       })
//   );
 
// });

// network only strategy
// self.addEventListener('fetch', function(event) {
//   //console.log('[Service Worker] Fetching something ....', event);
//   event.respondWith(
//     fetch(event.request)
//   )
// });

// network first than strategy
// with dynamic cache
// self.addEventListener('fetch', function(event) {
//   //console.log('[Service Worker] Fetching something ....', event);
//   event.respondWith(
//     fetch(event.request).then(function(){
//       return caches.open(CACHE_DYNAMIC_NAME).then(function(cache){
//                                     cache.put(event.request.url, res.clone())
//                                     return res;
//                                   })
//     }).catch(function(err){
//       return caches.match(event.request)
//     })
//   );
// });

/*
function isInArray(string, array){
  for(var i = 0; i < array.length; i++){
    if(array[i] == string){
      return true;
    }
  }
  return false;
}
*/

function isInArray(string, array) {
  var cachePath;
  if (string.indexOf(self.origin) === 0) { // request targets domain where we serve the page from (i.e. NOT a CDN)
    console.log('matched ', string);
    cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
  } else {
    cachePath = string; // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) > -1;
}

// cache then network 
self.addEventListener('fetch', function(event) {
  //console.log('[Service Worker] Fetching something ....', event);
  var url = 'https://httpbin.org/get';

  if(event.request.url.indexOf(url) > -1){
    event.respondWith(
      caches.open(CACHE_DYNAMIC_NAME)
        .then(function(cache){
          return fetch(event.request)
            .then(function(res){
              // trimCache(CACHE_DYNAMIC_NAME, 3);
              cache.put(event.request, res.clone());
              return res;
            });
        })
    );  
  }else {
    event.respondWith(
      caches.match(event.request)
        .then(function(response){
          if(response){
            return response;


                    //  regex ini untuk mengcheck apakah request url masuk de dalam bagian arrat static filter
          }else if(isInArray(event.request.url, STATIC_FILES)){
            // ini untuk implementasi cache only
            event.respondWith(
              caches.match(event.request)
            )
          } else {
            return fetch(event.request).then(function(res){
                      return caches.open(CACHE_DYNAMIC_NAME).then(function(cache){
                              // trimCache(CACHE_DYNAMIC_NAME, 3);
                              cache.put(event.request.url, res.clone())
                              return res;
                            })
                    }).catch(function(err){
                      return caches.open(CACHE_STATIC_NAME)
                        .then(function(cache){
                          if(event.request.headers.get('accept').includes('text/html')){
                            return cache.match('/offline.html');
                          }
                        })
                    });
          }
        })
    );
  }
  
});