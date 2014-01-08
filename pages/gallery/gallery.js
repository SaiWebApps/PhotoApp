// For an introduction to the Page Control template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232511
(function () {
    "use strict";

    //Call allPhotos() in home.js to fetch all photos from database.
    var photoList;
   
    WinJS.UI.Pages.define("/pages/gallery/gallery.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            Home.IDB.all().done(function (args) {
                var object = new WinJS.UI.ListView(document.getElementById("listView"));
                object.itemDataSource = new WinJS.Binding.List(args).dataSource;
                object.itemTemplate = document.getElementById("listTemplate");
            });
        },

        unload: function () {
            // TODO: Respond to navigations away from this page.
        },

        updateLayout: function (element) {
            // <param name="element" domElement="true" />
            // TODO: Respond to changes in layout.
        }
    });
})();