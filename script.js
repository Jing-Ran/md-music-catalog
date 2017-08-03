(function () {
  'use strict';

  var catalog = document.querySelector('.catalog');

  function createAlbumEle() {
    console.log('enter createAlbumEle func');
    var album = document.createElement('div');
    var albumImg = document.createElement('div');
    var albumContent = document.createElement('div');
    var albumTitle = '<h3 class="album__title"></h3>';
    var artist = '<p class="album__artist"><i class="material-icons">account_circle</i><a target="_blank"></a></p>';
    var albumIntro = '<div class="album__intro"></div>';
    var albumFooter = document.createElement('div');

    albumImg.setAttribute('class', 'album__img');

    albumContent.innerHTML = albumTitle + artist + albumIntro;
    albumContent.setAttribute('class', 'album__content');

    albumFooter.innerHTML = '<i class="material-icons">play_circle_filled</i><a target="_blank" class="album__url">Play album on FMA</a>';
    albumFooter.setAttribute('class', 'album__footer');

    album.appendChild(albumImg);
    album.appendChild(albumContent);
    album.appendChild(albumFooter);
    album.setAttribute('class', 'album');

    return album;
  }
  
  function fetchDataFromServer() {
    var albumsUrl = 'https://freemusicarchive.org/api/get/albums.json?api_key=TBHJ7JH66M2F468E';
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
      if (xhr.status === 200) {
        console.log('fetch data');
        // Create local database
        // var albumsArray = JSON.parse(xhr.response).dataset;
        createLocalDB(JSON.parse(xhr.response).dataset);
      }
    };

    xhr.open('GET', albumsUrl, false);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.send();
  }

  function createLocalDB(albumsArray) {
    if ('indexedDB' in window) {
      console.log('create DB');
      var openRequest = window.indexedDB.open('albumsDB', 1);
      openRequest.onupgradeneeded = function (e) {
        console.log('DB onupgrade');
        var db = e.target.result;
        var objectStore = db.createObjectStore('albums', {keyPath: 'album_id'});
        objectStore.transaction.oncomplete = function () {
          var objectStore = db.transaction('albums', 'readwrite')
            .objectStore('albums');

          albumsArray.forEach(function (album) {
            objectStore.add(album);
          });
        };
      };

      openRequest.onsuccess = listAlbums();
    }
  }

  function getDB() {
    if ('indexedDB' in window) {
      console.log('get DB');
      var openRequest = window.indexedDB.open('albumsDB');
      openRequest.onsuccess = function (e) {
        var db = e.target.result;
        var transaction = db.transaction('albums', 'readonly');
        var objectStore = transaction.objectStore('albums');
        var getRequest = objectStore.getAll();

        // Get data from local DB and populate data
        getRequest.onsuccess = function () {
          console.log('get request', getRequest.result);
        };
      };
    }
  }

  function listAlbums() {
    if ('indexedDB' in window) {
      console.log('List albums');
      var openRequest = window.indexedDB.open('albumsDB');

      openRequest.onsuccess = function (e) {
        var db = e.target.result;
        var transaction = db.transaction('albums', 'readonly');
        var objectStore = transaction.objectStore('albums');
        var getRequest = objectStore.getAll();

        // Get data from local DB and populate data
        getRequest.onsuccess = function () {
          console.log('getreq success');
          var results = getRequest.result;
          var fragment = document.createDocumentFragment();
          var albumEle;

          // UI
          for (var i = 0; i < results.length; i++) {
            albumEle = createAlbumEle();
            console.log('create album ele');
            albumEle.querySelector('.album__img').style.backgroundImage =
              'url(' + results[i].album_images[0].image_file + ')';
            albumEle.querySelector('.album__title').innerHTML =
              results[i].album_title;
            albumEle.querySelector('.album__artist a').innerHTML =
              results[i].artist_name;
            albumEle.querySelector('.album__artist a').setAttribute('href', results[i].artist_url);
            albumEle.querySelector('.album__intro').innerHTML = results[i].album_information;
            albumEle.querySelector('.album__url').setAttribute('href', results[i].album_url);

            fragment.appendChild(albumEle);
          }
          catalog.appendChild(fragment);
        };
      };
    }
  }

  // Delete database - call this function to reset
  function deleteDB() {
    var openRequest = window.indexedDB.deleteDatabase('albumsDB');
    openRequest.onsuccess = function () {
      console.log('Deleted DB');
    }
  }
  // deleteDB();

  // Check if albumsDB exists
  function checkDBExistence() {
    if ('indexedDB' in window) {
      var openRequest = window.indexedDB.open('albumsDB');
      var dbExists = true;
      openRequest.onupgradeneeded = function (e) {
        if (e.target.result.version === 1) {
          console.log('aborting transaction, DB does not exist');

          // abort this complete transaction and return without creating a new DB;
          e.target.transaction.abort();
          dbExists = false;
          // fetchDataFromServer();
        } else {
          dbExists = true;
        }

        if (!dbExists) {
          console.log('init');
          fetchDataFromServer();
        }
      };

      openRequest.onsuccess = function (e) {
        console.log('DB exists');
        if (dbExists) {
          console.log('dbExists onsuccess');
          listAlbums();
        }
      };
    }
  }

  checkDBExistence();
})();