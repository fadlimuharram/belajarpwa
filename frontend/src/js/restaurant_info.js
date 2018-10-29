'use strict';

let restaurant;

document.addEventListener('DOMContentLoaded', (e) => {
  initMap();

  // if localstorage not empty add eventlistner to send data when online
  if (localStorage.length !== 0) DBHelper.sendDataWhenOnline();
});

/**
 * Initialize Leaflet map
 */
var initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.myMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16
      });

      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={accessToken}', {
        attribution: '',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoibWF1bGlkYW4iLCJhIjoiY2puZmpwNWp1MDFqazN3bG1qeThxZzYyOCJ9.BrIt05DvcEYSSirmLlsynQ'
      }).addTo(myMap);

      myMap.scrollWheelZoom.disable();
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant);
    }
  });
};

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  if (restaurant.photograph === undefined) {
    image.src = '/img/nophoto.jpg';
  } else {
    image.src = '/img/' + restaurant.photograph + '-400.jpg';
  }
  image.alt = 'Image of the ' + restaurant.name + ' Restaurant';

  const picture = document.getElementById('restaurant-img-media');
  picture.media = '(min-width: 450px)';
  if (restaurant.photograph === undefined) {
    picture.srcset = '/img/nophoto.jpg';
  } else {
    picture.srcset = '/img/' + restaurant.photograph + '.jpg';
  }

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

  // fetch and fill reviews
  fetchReviews();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');
    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);
    hours.appendChild(row);
  }
};

/**
 * Get reviews
 */
const fetchReviews = (callback) => {
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchReviewsById(restaurant.id, (error, reviews) => {
      self.reviews = reviews;
      if (!reviews) {
        console.error(error);
        return;
      }
      fillReviewsHTML();
    });
  }
};

/**
 * Add Review form submission
 */
const addReview = () => {
  event.preventDefault();

  const id = getParameterByName('id');
  const name = document.getElementById('review-name');
  const rating = document.querySelector('#rating option:checked');
  const comments = document.getElementById('review-comments');
  let reviewData = {};

  // reset errors
  name.style.borderColor = '';
  comments.style.borderColor = '';

  // restaurant id
  reviewData.restaurant_id = parseInt(id);

  //  name
  const namePattern = /^[A-Za-z0-9'`-\s]+$/i;
  if (!namePattern.test(name.value)) {
    name.style.borderColor = 'red';
  } else {
    reviewData.name = name.value;
  }

  // date
  //reviewData.createdAt = new Date().toLocaleString();
  reviewData.createdAt = new Date().valueOf();
  // rating
  reviewData.rating = parseInt(rating.value);

  // comments
  const commentsPattern = /^[^>]+$/i;
  if (!commentsPattern.test(comments.value)) {
    comments.style.borderColor = 'red';
  } else {
    reviewData.comments = comments.value;
  }

  // check if all inputs added
  if (Object.keys(reviewData).length === 5) {
    document.getElementById('review-form').reset();
    DBHelper.sendReview(reviewData);

    const container = document.getElementById('reviews-container');
    const ul = document.getElementById('reviews-list');
    ul.appendChild(createReviewHTML(reviewData, true));
    container.appendChild(ul);
  }
  console.log(reviewData);
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  title.tabIndex = '0';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }

  if (Object.keys(reviews).length === 0) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'Offline mode! No cached reviews for this restaurant.';
    container.appendChild(noReviews);
  }

  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });

  // if offline check reviews in localstore
  if (!navigator.onLine && localStorage.length !== 0) {
    const id = getParameterByName('id');

    for (var key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        if (localStorage[key] !== null && key.startsWith('reviewOffline')) {
          let reviewLocal = JSON.parse(localStorage.getItem(key));

          // check if restaurant id same as review in localstorage
          if (id === reviewLocal.restaurant_id) {
            ul.appendChild(createReviewHTML(reviewLocal, true));
          }
        }
      }
    }
  }
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review, offline) => {
  const li = document.createElement('li');

  if (!navigator.onLine && offline) {
    const offline = document.createElement('div');
    offline.className = 'reviews-offline';
    offline.innerHTML = 'OFFLINE';
    li.appendChild(offline);
  }

  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  //date.innerHTML = new Date(review.createdAt).toLocaleString();
  date.innerHTML = new Date(review.createdAt);
  li.appendChild(date);

  const rating = document.createElement('p');
  let stars = '★'.repeat(review.rating);
  rating.className = 'reviews-list__stars';
  rating.innerHTML = stars;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  li.tabIndex = '0';
  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');

  const ul = document.createElement('ul');

  const home = document.createElement('li');
  const link = document.createElement('a');
  link.innerHTML = 'Home';
  link.href = '/';
  home.appendChild(link);
  ul.appendChild(home);

  const name = document.createElement('li');
  name.innerHTML = restaurant.name;
  ul.appendChild(name);
  breadcrumb.appendChild(ul);
};

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
