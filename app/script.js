(function () {
  'use strict';

  let catalog = document.querySelector('.catalog');

  function createAlbumEle() {
    let album = document.createElement('div');
    let albumImg = document.createElement('div');
    let albumContent = document.createElement('div');
    let albumTitle = '<h3 class="album__title"></h3>';
    let artist = '<p class="album__artist"><i class="material-icons">account_circle</i><a target="_blank"></a></p>';
    let albumIntro = '<div class="album__intro"></div>';
    let albumFooter = document.createElement('div');

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
    const ALBUMS_URL = 'https://freemusicarchive.org/api/get/albums.json?api_key=TBHJ7JH66M2F468E';
    let xhr = new XMLHttpRequest();
    xhr.onload = function () {
      if (xhr.status === 200) {
        // Create local database
        createLocalDB(JSON.parse(xhr.response).dataset);
      }
    };

    xhr.open('GET', ALBUMS_URL, false);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.send();
  }

  function createLocalDB(albumsArray) {
    if ('indexedDB' in window) {
      let openRequest = window.indexedDB.open('albumsDB', 1);
      openRequest.onupgradeneeded = function (e) {
        let db = e.target.result;
        let objectStore = db.createObjectStore('albums', {keyPath: 'album_id'});
        objectStore.transaction.oncomplete = () => {
          let objectStore = db.transaction('albums', 'readwrite')
            .objectStore('albums');

          albumsArray.forEach((album) => objectStore.add(album));
        };
      };

      openRequest.onsuccess = listAlbums();
    }
  }

  // function getDB() {
  //   if ('indexedDB' in window) {
  //     let openRequest = window.indexedDB.open('albumsDB');
  //     openRequest.onsuccess = (e) => {
  //       let db = e.target.result;
  //       let transaction = db.transaction('albums', 'readonly');
  //       let objectStore = transaction.objectStore('albums');
  //       let getRequest = objectStore.getAll();
  //
  //       // Get data from local DB and populate data
  //       getRequest.onsuccess = () => {
  //         console.log('get request', getRequest.result);
  //       };
  //     };
  //   }
  // }

  function listAlbums() {
    if ('indexedDB' in window) {
      let openRequest = window.indexedDB.open('albumsDB');

      openRequest.onsuccess = function (e) {
        let db = e.target.result;
        let transaction = db.transaction('albums', 'readonly');
        let objectStore = transaction.objectStore('albums');
        let getRequest = objectStore.getAll();

        // Get data from local DB and populate data
        getRequest.onsuccess = () => {
          let results = getRequest.result;
          let fragment = document.createDocumentFragment();

          // UI
          for (let i = 0; i < results.length; i++) {
            let albumEle = createAlbumEle();
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
    let openRequest = window.indexedDB.deleteDatabase('albumsDB');
    openRequest.onsuccess = function () {
      console.log('Deleted DB');
    }
  }
  // deleteDB();

  // Check if albumsDB exists
  function checkDBExistence() {
    if ('indexedDB' in window) {
      let openRequest = window.indexedDB.open('albumsDB');
      let dbExists = true;
      openRequest.onupgradeneeded = function (e) {
        if (e.target.result.version === 1) {
          // abort this complete transaction and return without creating a new DB;
          e.target.transaction.abort();
          dbExists = false;
          // fetchDataFromServer();
        } else {
          dbExists = true;
        }

        if (!dbExists) {
          fetchDataFromServer();
        }
      };

      openRequest.onsuccess = (e) => {
        if (dbExists) {
          listAlbums();
        }
      };
    }
  }

  checkDBExistence();
})();