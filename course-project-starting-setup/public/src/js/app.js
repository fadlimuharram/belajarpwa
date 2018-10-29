var deferredPrompt;

if(!window.Promise){
  window.Promise = Promise;
}


if('serviceWorker' in navigator){
  navigator.serviceWorker
    //.register('/sw.js', { scope: '/help/' })
    .register('/sw.js')
    .then(function() {
      console.log('service worker registered');
    })
    .catch(function(err){
      console.log(err);
    });

}

window.addEventListener('beforeinstallprompt', function(event){
  console.log('before installprompt fired');
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

/*

fetch('https://httpbin.org/ip').then(function(response){
  console.log(response);
  return response.json();
}).then(function(data){
  console.log(data);
}).catch(function(err){
  console.log(err);
});

fetch('https://httpbin.org/post',{
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({
    message: 'does this work'
  })
}).then(function(response){
  console.log(response);
  return response.json();
}).then(function(data){
  console.log(data);
}).catch(function(err){
  console.log(err);
});*/