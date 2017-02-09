var d3 = require('d3');
var geo = require('d3-geo-projection');

var base = require('./base.js');

function configure(width) {
    var output = $.extend(true, {}, base());

    return $.extend(true, output, {
        'aspect_ratio': 1 / 1,
        'projection': d3.geo.orthographic().rotate([73.994, -40.742]),
        'scale_factor': 2500,
        'dot_radius': 0.000002,
        'graticules': false,
        'scale_bar_distance': 0.5,
        'paths': [
            'roads',
            'areas',
            'points'
        ],
        'labels': [
            'points'
        ],
        'label_nudges': {
            'points': {
                'default': [0.0003, -0.00002]
            }
        }
    });
}

module.exports = configure
