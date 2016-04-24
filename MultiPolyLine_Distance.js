/*
 * Add some methods to Leaflet Polyline and MultiPolyline, for finding the minimum distance to a given LatLng.
 * Useful for a quick-and-dirty "Is this line within X miles?" search.
 * Not precise as it sticks to vertices rather than actual shortest distance,
 * see "Gregor the Map Guy" blog for discussion on the shortcomings.
 * 
 * Also provided is simpler/faster hasVertexWithinRadius() function.
 * 
 * Greg Allensworth   <greg.allensworth@gmail.com>
 * No license, use as you will, kudos welcome but not required, etc.
 */


// loop over vertices, find the closest vertex to the given LatLng
// return both the LatLng and the distance (meters)
L.MultiPolyline.prototype.calculateClosestVertexAndDistance = function (targetlatlng) {
    var closest_latlng = null;
    var closest_meters = 1000000000;

    var paths = this.getLatLngs();
    for (var pi=0, pl=paths.length; pi<pl; pi++) {
        var path = paths[pi];

        for (var vi=0, vl=path.length; vi<vl; vi++) {
            var d = path[vi].distanceTo(targetlatlng);
            if (d >= closest_meters) continue;
            closest_latlng = path[vi];
            closest_meters = d;
        }
    }

    return { latlng:closest_latlng, meters:closest_meters };
}
L.Polyline.prototype.calculateClosestVertexAndDistance = function (targetlatlng) {
    var closest_latlng = null;
    var closest_meters = 1000000000;

    var verts = this.getLatLngs();
    for (var vi=0, vl=verts.length; vi<vl; vi++) {
        var d = verts[vi].distanceTo(targetlatlng);
        if (d >= closest_meters) continue;
        closest_latlng = verts[vi];
        closest_meters = d;
    }

    return { latlng:closest_latlng, meters:closest_meters };
}


// wrappers for calculateClosestVertexAndDistance() to return only the distance or the LatLng instance
// if you're only interested in one of them
L.MultiPolyline.prototype.closestVertexTo = function (latlng) {
    var closest = this.calculateClosestVertexAndDistance(latlng);
    return closest.latlng;
}
L.MultiPolyline.prototype.shortestDistanceTo = function (latlng) {
    var closest = this.calculateClosestVertexAndDistance(latlng);
    return closest.meters;
}
L.Polyline.prototype.closestVertexTo = function (latlng) {
    var closest = this.calculateClosestVertexAndDistance(latlng);
    return closest.latlng;
}
L.Polyline.prototype.shortestDistanceTo = function (latlng) {
    var closest = this.calculateClosestVertexAndDistance(latlng);
    return closest.meters;
}


// simply return true/false indicating whether there exists a vertex within the stated radius from the given LatLng
// slightly faster than calculateClosestVertexAndDistance() as it can bail at the first vertex within range
L.MultiPolyline.prototype.hasVertexWithinRadius = function (targetlatlng,meters) {
    var paths = this.getLatLngs();
    for (var pi=0, pl=paths.length; pi<pl; pi++) {
        var path = paths[pi];

        for (var vi=0, vl=path.length; vi<vl; vi++) {
            var d = path[vi].distanceTo(targetlatlng);
            if (d <= meters) return true;
        }
    }

    return false;
}
L.Polyline.prototype.hasVertexWithinRadius = function (targetlatlng,meters) {
    var vertss = this.getLatLngs();
    for (var vi=0, vl=verts.length; vi<vl; vi++) {
        var d = verts[vi].distanceTo(targetlatlng);
        if (d <= meters) return true;
    }

    return false;
}
