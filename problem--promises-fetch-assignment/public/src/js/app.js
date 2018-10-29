
var button = document.querySelector('#start-button');
var output = document.querySelector('#output');

button.addEventListener('click', function() {
  // Create a new Promise here and use setTimeout inside the function you pass to the constructor
  var mypromise = new Promise(function(resolve, reject){

    setTimeout(function() { // <- Store this INSIDE the Promise you created!
      // Resolve the following URL: https://swapi.co/api/people/1
      resolve('https://swapi.co/api/people/1');
    }, 3000);  

  });

  mypromise.then(function(text){
    return fetch(text);
  }).then(function(data){
    return data.json();
  }).then(function(dt){
    console.log(dt.name);
  }).catch(function(err){
    console.log(err);
  });
  
  // Handle the Promise "response" (=> the value you resolved) and return a fetch()
  // call to the value (= URL) you resolved (use a GET request)

  // Handle the response of the fetch() call and extract the JSON data, return that
  // and handle it in yet another then() block

  // Finally, output the "name" property of the data you got back (e.g. data.name) inside
  // the "output" element (see variables at top of the file)


  var mypromise2 = new Promise(function(resolve, reject){

    setTimeout(function() { 
      resolve('https://httpbin.org/put');
    }, 3000);  

  });

  mypromise2.then(function(text){
    return fetch(text, {
      method: "PUT",
      headers: {
        "Content-Type" : "application/json; charset=utf-8",
        "Accept": "application/json"
      },
      body: JSON.stringify({person: {name: 'Max', age: 28}})
    });
  }).then(function(response){
    return response.json()
  }).then(function(data){
    console.log('aa',data.json.person.name);
  });


  var mypromise3 = new Promise(function(resolve, reject){

    setTimeout(function() { 
      resolve('https://httpbin.org/putwawadasdasda');
    }, 3000);  

  });

  mypromise3.then(function(text){
    return fetch(text, {
      method: "PUT",
      headers: {
        "Content-Type" : "application/json; charset=utf-8"
      },
      body: JSON.stringify({person: {name: 'Max', age: 28}})
    });
  }).then(function(response){
    console.log(response.status);
  }).catch(function(err){
    console.log(err);
  });

  // Repeat the exercise with a PUT request you send to https://httpbin.org/put
  // Make sure to set the appropriate headers (as shown in the lecture)
  // Send any data of your choice, make sure to access it correctly when outputting it
  // Example: If you send {person: {name: 'Max', age: 28}}, you access data.json.person.name
  // to output the name (assuming your parsed JSON is stored in "data")

  // To finish the assignment, add an error to URL and add handle the error both as
  // a second argument to then() as well as via the alternative taught in the module
});