/*
 * L.Control.GoogleAutocomplete - search for an address and zoom to it's location
 * https://github.com/rmunglez/leaflet-google-autocomplete
 */

(function($, undefined) {
L.GoogleAutocomplete = {};

// MSIE needs cors support
jQuery.support.cors = true;

L.GoogleAutocomplete.Result = function (x, y, label) {
    this.X = x;
    this.Y = y;
    this.Label = label;
};

L.Control.GoogleAutocomplete = L.Control.extend({
    options: {
        position: 'topcenter'
    },

    initialize: function (options) {
        this._config = {};
        if (!options) {
            options = {};
        }
        var optionsTmp = {
            'searchLabel': options.searchLabel || 'search for address...',
            'notFoundMessage' : options.notFoundMessage || 'Sorry, that address could not be found.',
            'zoomLevel': options.zoomLevel || 13
        };

        L.Util.extend(this.options, optionsTmp);

        /*$.ajax({
            url: "https://maps.googleapis.com/maps/api/js?v=3&callback=onLoadGoogleApiCallback&sensor=false&libraries=places",
            dataType: "script"
        });*/        
    },

    onAdd: function (map) {
        var $controlContainer = $(map._controlContainer);

        if ($controlContainer.children('.leaflet-top.leaflet-center').length == 0) {
            $controlContainer.append('<div class="leaflet-top leaflet-center"></div>');
            map._controlCorners.topcenter = $controlContainer.children('.leaflet-top.leaflet-center').first()[0];
        }

        this._map = map;
        this._container = L.DomUtil.create('div', 'leaflet-control-googleautocomplete');

        var searchwrapper = document.createElement('div');
        searchwrapper.className = 'leaflet-control-googleautocomplete-wrapper';
        
        var searchbox = document.createElement('input');
        searchbox.id = 'leaflet-control-googleautocomplete-qry';
        searchbox.type = 'text';
        searchbox.placeholder = this.options.searchLabel;
        this._searchbox = searchbox;

        $(searchwrapper).append(this._searchbox);
        $(this._container).append(searchwrapper, this._closetomebox);
        
        L.DomEvent.addListener(this._container, 'click', L.DomEvent.stop);
        L.DomEvent.disableClickPropagation(this._container);
        
        // init google autocomplete
        var autocomplete = new google.maps.places.Autocomplete(this._searchbox);
        //autocomplete.setTypes(['geocode']);

        $(this._searchbox).keypress(function(event){
            if(event.keyCode == 13 || event.keyCode == 9) {

                $(event.target).blur();

                if($(".pac-container .pac-item:first span:eq(3)").text() == "") {
                    firstValue = $(".pac-container .pac-item:first .pac-item-query").text();
                }
                else {
                    firstValue = $(".pac-container .pac-item:first .pac-item-query").text() + ", " + $(".pac-container .pac-item:first span:eq(3)").text();
                }
                event.target.value = firstValue;

                selectFirstResult();

                return false;
            } else {
                return true;
            }
        });

        var Me = this;
        google.maps.event.addListener(autocomplete, 'place_changed', function() {
            var place = autocomplete.getPlace();
            if (!place.geometry) {
                // Inform the user that the place was not found and return.
                $('leaflet-control-googleautocomplete-qry').addClass('notfound');
                return;
            }

            // If the place has a geometry, then update the map
            if (place.geometry.location) {
                moveMarker("", place.geometry.location.lat(), place.geometry.location.lng());
            }
        });

        function moveMarker(placeName, lat, lng){
            $('leaflet-control-googleautocomplete-qry').removeClass('notfound');
            map.setView([lat, lng], Me.options.zoomLevel);
        }

        function selectFirstResult() {
            var firstResult = $(".pac-container .pac-item:first").text();

            var geocoder = new google.maps.Geocoder();
            geocoder.geocode({"address":firstResult }, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    var lat = results[0].geometry.location.lat(),
                        lng = results[0].geometry.location.lng(),
                        placeName = results[0].address_components[0].long_name;

                    moveMarker(placeName, lat, lng);
                }
            });
        }

        return this._container;
    }
});
})(jQuery);
