'use strict';

let restaurants,
  neighborhoods,
  cuisines;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (e) => {
  registerServiceWorker();
  fetchNeighborhoods();
  fetchCuisines();

  // init map
  initMap();

  // if localstorage not empty add eventlistner to send data when online
  if (localStorage.length !== 0) DBHelper.sendDataWhenOnline();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize Google map, called from HTML.
 */
const initMap = () => {
  self.myMap = L.map('map', {
    center: [40.704216, -73.975501],
    zoom: 12
  });

  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={accessToken}', {
    attribution: '',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1IjoibWF1bGlkYW4iLCJhIjoiY2puZmpwNWp1MDFqazN3bG1qeThxZzYyOCJ9.BrIt05DvcEYSSirmLlsynQ'
  }).addTo(myMap);

  myMap.scrollWheelZoom.disable();
  updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    console.log(restaurant);
    ul.append(createRestaurantHTML(restaurant));
  });

  if (restaurants.length === 0) {
    const empty = document.createElement('h1');
    empty.innerHTML = 'No results found';
    empty.tabIndex = '0';
    empty.className = 'restaurant-empty';
    ul.append(empty);
  }
  addMarkersToMap();

  // Lazyload IMG's
  let myLazyLoad = new LazyLoad();
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const picture = document.createElement('picture');
  li.append(picture);

  const source = document.createElement('source');
  source.media = '(min-width: 768px)';
  if (restaurant.photograph === undefined) {
    source.setAttribute('data-src', '/img/nophoto.jpg');
  } else {
    source.setAttribute('data-srcset', '/img/' + restaurant.photograph + '.jpg');
  }
  picture.append(source);

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  console.log('photo : ',restaurant.photograph);
  if (restaurant.photograph === undefined) {
    image.setAttribute('data-src', '/img/nophoto.jpg');
  } else {
    image.setAttribute('data-src', '/img/' + restaurant.photograph + '-400.jpg');
  }
  image.alt = restaurant.name + ' Restaurant';
  picture.append(image);

  const div = document.createElement('div');
  div.className = 'restaurant-list__separator';
  li.append(div);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  name.tabIndex = '0';
  div.append(name);



  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  neighborhood.tabIndex = '0';
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  address.tabIndex = '0';
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('aria-label', `Click for more information about ${restaurant.name} restaurant.`);
  li.append(more);

  return li;
};


/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant);

    marker.on('click', function() {
      window.location = (this.options.url);
    });
    self.markers.push(marker);
  });
};

/**
 * Register ServiceWorker.
 */
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .catch(err => {
        console.log('[SW] Registration Failed', err);
      });
  }
};
