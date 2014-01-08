(function () {
    "use strict";

    //Reference to IndexedDB database
    var db;
   
    //Initialize database connection if indexedDB is supported.
    function initDatabase() {
        if (!window.indexedDB) {
            console.log("IndexedDB is not supported");
            return;
        }

        deleteDatabase(); //Start off with a fresh database every time.
        //return;

        //If IndexedDB is supported, then we will open up a new database
        //and create an ObjectStore called photos.
        var dbName = "photoApp"; //name of database
        var version = 1; //version of database
        var openRequest = indexedDB.open(dbName, version);

        //Called when using a new version of db for first time; creates an
        //ObjectStore called photos. Note that this is the only place where 
        //the ObjectStore can be modified.
        openRequest.onupgradeneeded = function (event) {
            var thisDB = event.target.result;
            if (!thisDB.objectStoreNames.contains("photos")) {
                console.log("Creating new ObjectStore called photos");
                var objStore = thisDB.createObjectStore("photos", {
                    autoIncrement: true,
                });
            }
        };

        //If database connection was successfully opened, then we save 
        //a reference to var db, so that we can access the database later.
        openRequest.onsuccess = function (event) {
            //Open new connection and save reference to db.
            db = event.target.result;
            console.log("Database connection opened successfully");
        };

        openRequest.onblocked = function (event) {
            console.log(event);
        }

        //If there are any errors, print them out to the console.
        openRequest.onerror = function (event) {
            console.log(event);
        };
    }

    //Delete the photoApp database - for debugging purposes.
    function deleteDatabase() {
        indexedDB.deleteDatabase("photoApp").onsuccess = function (event) {
            console.log("Deleted database successfully");
        }
    }

    //Add photo to database.
    function addPhoto(photo) {
        if (!window.indexedDB) {
            console.log("IndexedDB is not supported");
        }
   
        var transaction = db.transaction("photos", "readwrite");
        transaction.oncomplete = function (event) {
            console.log("Transaction successfully completed");
        }
        transaction.onerror = function (event) {
            console.log(event.value);
        }

        var photoStore = transaction.objectStore("photos");
        var request = photoStore.put(photo);

        request.onsuccess = function (event) {
            console.log("Added pic to database");
            console.log(request.result);
        }
        request.onerror = function (event) {
            console.log("Unable to add pic to database");
        }
    }

    //Fetches all photos in database.
    function allPhotos() {
        var photos = [];
        var complete;

        var transaction = db.transaction("photos", "readonly");
        transaction.oncomplete = function (event) {
            console.log("Transaction successfully completed");
        }
        transaction.onerror = function (event) {
            console.log(event.value);
        }

        var promise = new WinJS.Promise(function (c, e, p) {
            complete = c;
        });

        var photoStore = transaction.objectStore("photos");
        photoStore.openCursor().onsuccess = function (event) {
            var cursor = event.target.result;
            //If we've gotten all photos in db, call complete callback w/ data.
            if (!cursor) {
                complete(photos);
                return;
            }
            //Otherwise, continue reading photos from database into array.
            photos.push(cursor.value);
            cursor.continue();
        };

        //Return promise because openCursor().onsuccess is async, which means
        //that we don't know when it will complete and return the data. So,
        //the promise allows us to schedule some set of actions to perform whenever
        //the data is ready.
        return promise;
    }

    //Namespace makes data publically accessible.
    WinJS.Namespace.define("Home.IDB", {
        all: function () { return allPhotos(); },
    });

    var homePage = WinJS.UI.Pages.define("/pages/home/home.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            initDatabase();
            document.getElementById("photoButton").addEventListener("click",
                this.getPhotoHandler, false);
        },

        getPhotoHandler: function (eventInfo) {
            var pickers = Windows.Storage.Pickers;
            var openPicker = pickers.FileOpenPicker();
            openPicker.suggestedStartLocation = pickers.PickerLocationId.picturesLibrary;
            openPicker.viewMode = pickers.PickerViewMode.thumbnail;

            openPicker.fileTypeFilter.clear();
            openPicker.fileTypeFilter.append(".bmp");
            openPicker.fileTypeFilter.append(".jpg");
            openPicker.fileTypeFilter.append(".jpeg");
            openPicker.fileTypeFilter.append(".png");
       
            openPicker.pickSingleFileAsync().done(homePage.prototype.loadImage,
                homePage.prototype.displayError);
        },

        displayError: function (error) {
            document.getElementById("name").innerText = "Unable to load image.";
        },

        loadImage: function (file) {
            if (file) {
                //Store image info in Photo Object.
                var photo = {
                    path: file.path,
                    name: file.name,
                    displayName: file.displayName,
                    src: URL.createObjectURL(file, { oneTimeUseOnly: false }),
                };

                //Add photo to IndexedDB's photo store.
                addPhoto(photo);

                //Set dateCreated.
                photo.dateCreated = file.dateCreated;

                //Bind photoObj to HTML div, to display photo info to user.
                WinJS.Binding.optimizeBindingReferences = true;
                WinJS.Binding.processAll(document.getElementById("contentGrid"), photo);
            }
        }
    });
})();