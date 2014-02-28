/*
 * For Leaflet, an implementation of single-tile WMS
 * This is great for layers that don't do well with being sliced into tiles,
 * e.g. computationally expensive layers, layers with labels or icons that get cut off, etc.
 * This was originally authored by fnicollet      https://gist.github.com/fnicollet/5764080
 * 
 * My own contributions:
 * - setParams() method added
 * - setOpacity() method overridden, so it does the image swap, updating the opacity immediately
 *
 * Greg Allensworth   <greg.allensworth@gmail.com>
 * No license, use as you will, kudos welcome but not required, etc.
 */


L.SingleTileWMSLayer = L.ImageOverlay.extend({
    defaultWmsParams: {
        service: 'WMS',
        request: 'GetMap',
        version: '1.1.1',
        layers: '',
        styles: '',
        format: 'image/jpeg',
        transparent: false
    },
    initialize: function (url, options) {
        this._url = url;
        if (url.indexOf("{s}") != -1) this.options.subdomains = options.subdomains = '1234';

        var wmsParams = L.extend({}, this.defaultWmsParams);
        this.wmsParams = wmsParams;

        for (var i in options) {
            if (!this.options.hasOwnProperty(i)) wmsParams[i] = options[i];
        }
        L.setOptions(this, options);

        this._isSwap = false;
        this._imageSwap = null;
    },
    onAdd: function (map) {
        this._map = map;
        this._bounds = map.getBounds();

        var projectionKey = parseFloat(this.wmsParams.version) >= 1.3 ? 'crs' : 'srs';
        this.wmsParams[projectionKey] = map.options.crs.code;

        // on movement, swap out the image via _onViewReset()
        map.on('moveend', this._onViewReset, this);

        // zoom animation, is simply to hide both versions of the image, and let moveend take its course
        if (map.options.zoomAnimation && L.Browser.any3d) {
            map.on('zoomanim', this._onZoomAnim, this);
        }

        // having loaded, start by loading an event, same as if we'd gotten a 'moveend' event
        this._onViewReset();
    },
    onRemove: function (map) {
        // call the superclass's removal method to clean us up
        L.ImageOverlay.prototype.onRemove.call(this, map);

        // clean up the swap image too
        if (this._imageSwap) map.getPanes().overlayPane.removeChild(this._imageSwap);

        // clean up event handlers
        map.off('moveend', this._onViewReset, this);
        map.off('zoomanim', this._onZoomAnim, this);
    },
    _onViewReset: function () {
        // this method loads a new image at the new bounds, then swaps it out for the image currently showing
        this._futureBounds = this._map.getBounds();
        var map = this._map;
        var crs = map.options.crs;
        var nwLatLng = this._futureBounds.getNorthWest();
        var seLatLng = this._futureBounds.getSouthEast();
        var topLeft = this._map.latLngToLayerPoint(nwLatLng);
        var bottomRight = this._map.latLngToLayerPoint(seLatLng);
        var size = bottomRight.subtract(topLeft);
        var nw = crs.project(nwLatLng), se = crs.project(seLatLng);
        var bbox = [nw.x, se.y, se.x, nw.y].join(',');
        var url = this._url;
        this.wmsParams.width = size.x;
        this.wmsParams.height = size.y;
        var imageSrc = url + L.Util.getParamString(this.wmsParams, url) + "&bbox=" + bbox;
        this.swapImage(imageSrc, this._futureBounds);
    },
    _reset: function () {
        var el = this._isSwap ? this._imageSwap : this._image;
        if (!el) return;

        var nwLatLng = this._bounds.getNorthWest();
        var seLatLng = this._bounds.getSouthEast();
        var topLeft = this._map.latLngToLayerPoint(nwLatLng);
        var bottomRight = this._map.latLngToLayerPoint(seLatLng);
        var size = bottomRight.subtract(topLeft);
        L.DomUtil.setPosition(el, topLeft);
        el.width = size.x;
        el.height = size.y;
    },
    _onZoomAnim: function() {
        if (this._imageSwap) this._imageSwap.style.visibility = 'hidden';
        if (this._image) this._image.style.visibility = 'hidden';
    },
    _onSwapImageLoad:function () {
        if (this._isSwap){
            this._imageSwap.style.visibility = 'hidden';
            this._image.style.visibility = '';
        } else {
            this._imageSwap.style.visibility = '';
            this._image.style.visibility = 'hidden';
        }
        this._isSwap = !this._isSwap;
        this._bounds = this._futureBounds;
        this._reset();
    },
    setOpacity: function(opacity) {
        this.options.opacity = opacity;
        this._updateOpacity();
        return this;
    },
    _updateOpacity: function () {
        L.DomUtil.setOpacity(this._image, this.options.opacity);
        L.DomUtil.setOpacity(this._imageSwap, this.options.opacity);
    },
    swapImage:function (src, bounds) {
        if (!this._imagesCreated){
            this._image = this._createImageSwap();
            this._imageSwap = this._createImageSwap();
            this._imagesCreated = true;
        }
        if (this._isSwap){
            this._image.src = src;
        } else {
            this._imageSwap.src = src;
        }
        // do not assign the bound here, this will be done after the next image
        this._futureBounds = bounds;
        // allows to re-position the image while waiting for the swap.
        // attention : the does not work while resizing, because of the wrong bound (size in pixel)
        this._reset();
    },
    _createImageSwap:function () {
        var el = L.DomUtil.create('img', 'leaflet-image-layer');
        L.Util.extend(el, {
            galleryimg: 'no',
            onselectstart: L.Util.falseFn,
            onmousemove: L.Util.falseFn,
            onload: L.Util.bind(this._onSwapImageLoad, this)
        });
        this._map._panes.overlayPane.appendChild(el);
        el.style.visibility = '';
        return el;
    },
    setParams: function (params, noRedraw) {
        this.wmsParams = L.extend(this.wmsParams, params);
        if (!noRedraw) this._onViewReset();
        return this;
    }
});
