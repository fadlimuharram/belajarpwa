'use strict';

/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/`;
  }

  static dbPromise() {
    return idb.open('db', 1, upgradeDB => {
      switch (upgradeDB.oldVersion) {
      case 0:
        upgradeDB.createObjectStore('restaurants', {keyPath: 'id'});
        break;
      case 1:
        const reviewsStore = upgradeDB.createObjectStore('reviews', {keyPath: 'id'});
        reviewsStore.createIndex('byRestaurantId', 'restaurant_id');
        break;
      }
    });
  }

  static fetchRestaurants(callback) {
    return this.dbPromise()
      .then(db => {
        let tx = db.transaction('restaurants');
        const store = tx.objectStore('restaurants');
        return store.getAll();
      })
      .then(restaurants => {
        if (restaurants.length !== 0) {
          return callback(null, restaurants);
        }
        fetch(`${DBHelper.DATABASE_URL}restaurants`)
          .then(response => response.json())
          .then(restaurants => {
            this.dbPromise()
              .then(db => {
                if (!db) return db;

                let tx = db.transaction('restaurants', 'readwrite');
                const restStore = tx.objectStore('restaurants');

                restaurants.forEach(restaurant => restStore.put(restaurant));

                return callback(null, restaurants);
              });
          })
          .catch(error => {
            console.log('Restaurants fetch error: ' + error);
          });
      });
  }

  /**
   * Fetch a Reviews by Restaurant ID.
   */
  static fetchReviewsById(id, callback) {
    fetch(`${DBHelper.DATABASE_URL}reviews/?restaurant_id=${id}`)
      .then(response => response.json())
      .then(reviews => {
        this.dbPromise()
          .then(db => {
            if (!db) return;

            let tx = db.transaction('reviews', 'readwrite');
            const revStore = tx.objectStore('reviews');

            if (Array.isArray(reviews)) {
              reviews.forEach(review => revStore.put(review));
            } else {
              revStore.put(reviews);
            }
          });
        return callback(null, reviews);
      })
      .catch(error => {
        console.log('Review fetch by ID error: ' + error);
        return DBHelper.getDbObjectByID('reviews', 'byRestaurantId', id)
          .then(reviews => {
            return callback(null, reviews);
          });
      });
  }

  /**
   * Send Review
   */
  static sendReview(review) {
    if (!navigator.onLine) {
      // count offline reviews in localstorage
      let reviewOfflineCounter = 1;
      for (var key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          if (localStorage[key] !== null && key.startsWith('reviewOffline')) {
            reviewOfflineCounter++;
          }
        }
      }

      // add review to localstorage and add eventlistner to send when online
      localStorage.setItem('reviewOffline' + reviewOfflineCounter, JSON.stringify(review));
      console.log('Offline, review saved local and will sync later');
      DBHelper.sendDataWhenOnline();
      return;
    }

    fetch(`${DBHelper.DATABASE_URL}reviews`, {
      method: 'POST',
      body: JSON.stringify(review),
      headers: new Headers({'Content-Type': 'application/json'})
    }).then((response) => {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.indexOf('application/json') !== -1) {
        return response.json();
      } else {
        return 'Success';
      }
    }).catch(error => console.log('Review fetch error: ' + error));
  }

  /**
   * Get object from IndexedDB by ID
   */
  static getDbObjectByID(table, index, id) {
    return this.dbPromise().then(db => {
      if (!db) return;

      const store = db.transaction(table).objectStore(table);
      const indexId = store.index(index);

      return indexId.getAll(id);
    });
  }

  /**
   * Update Favorite by ID
   */
  static updateFav(id, fav) {
    if (!navigator.onLine) {
      let favOffline = {
        restaurant_id: id,
        is_favorite: fav
      };

      localStorage.setItem('favoriteOffline' + id, JSON.stringify(favOffline));
      console.log('Offline, restaurant ' + id + ' favorite status updated and will sync later');
      DBHelper.sendDataWhenOnline();
      DBHelper.updateFavInDB(id, fav);
      return;
    }

    fetch(`${DBHelper.DATABASE_URL}restaurants/${id}/?is_favorite=${fav}`, {
      method: 'PUT'
    }).then(() => {
      DBHelper.updateFavInDB(id, fav);
    }).catch(error => console.log('Favorite fetch error: ' + error));
  }

  /**
   * Change favorite status in IndexedDB
   */
  static updateFavInDB(id, fav) {
    this.dbPromise().then(db => {
      if (!db) return;

      let tx = db.transaction('restaurants', 'readwrite');
      const restStore = tx.objectStore('restaurants');

      restStore.get(id)
        .then(restaurant => {
          restaurant.is_favorite = fav;
          restStore.put(restaurant);
        });
    });
  }

  /**
   * Eventlistner for Online status
   */
  static sendDataWhenOnline() {
    if (navigator.onLine) {
      DBHelper.pushDataFromLocalStorage();
    } else {
      window.addEventListener('online', () => {
        DBHelper.pushDataFromLocalStorage();
      });
    }
  }

  /**
   * Pushing favorite status and sending reviews
   */
  static pushDataFromLocalStorage() {
    // loop through localstorage items
    for (var key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        // update favorites
        if (localStorage[key] !== null && key.startsWith('favoriteOffline')) {
          // get favorite from localstorage
          let favOffline = JSON.parse(localStorage[key]);

          // send it to backend and remove
          DBHelper.updateFav(favOffline.restaurant_id, favOffline.is_favorite);
          localStorage.removeItem(key);
          console.log('Online, favorite for restaurant ' + favOffline.restaurant_id + ' updated');
        }

        // update reviews
        if (localStorage[key] !== null && key.startsWith('reviewOffline')) {
          // remove offline indicator
          [...document.querySelectorAll('.reviews-offline')].forEach(element => {
            element.remove();
          });

          // get review from localstorage
          let reviewOffline = JSON.parse(localStorage[key]);

          // send it to backend and remove
          DBHelper.sendReview(reviewOffline);
          localStorage.removeItem(key);
          console.log('Online, review sent');
        }
      }
    }
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) {
          // Got the restaurant
          callback(null, restaurant);
        } else {
          // Restaurant does not exist in the database
          callback(new Error('Restaurant does not exist'), null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type === cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood === neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine !== 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type === cuisine);
        }
        if (neighborhood !== 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood === neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) === i);
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) === i);
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant) {
    let icon = L.icon({
      iconUrl: 'img/icons/marker-icon.png',
      shadowUrl: 'img/icons/marker-shadow.png'
    });

    const marker = new L.Marker([restaurant.latlng.lat, restaurant.latlng.lng], {
      title: restaurant.name,
      alt: restaurant.name,
      icon: icon,
      url: DBHelper.urlForRestaurant(restaurant)
    });

    marker.addTo(myMap);
    return marker;
  }
}
