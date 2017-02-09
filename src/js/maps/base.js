var d3 = require('d3');
var geo = require('d3-geo-projection');

function configure(width) {
    return {
        'aspect_ratio': 16 / 9,             // Aspect ratio of map (width / height)
        'projection': d3.geo.mercator(),    // An instance of a D3 map projection to use
        'scale_factor': 0.5,                // "Zoom level" (in projection-dependent units)
        'dot_radius': 0.002,                // The radius of points on the map (in projection-dependent units)
        'graticules': true,                 // Draw graticules?
        'scale_bar_distance': 1000,         // Length of scale bar in miles (null to disable)
        'paths': [],                        // Names of layers to be rendered as paths (from topojson)
        'labels': [],                       // Names of layers to be rendered as labels (from topojson)
        'label_nudges': {},                 // Move labels off their base coords by some degress latitude and longitude
        'label_subs': {}                    // Substitue alternate label text for id in topojson
    }
}

module.exports = configure
