var d3 = require('d3');
var geo = require('d3-geo-projection');

var base = require('./base.js');

function configure(width) {
    var output = $.extend(true, {}, base());

    return $.extend(true, output, {
        'projection': d3.geo.albersUsa(),
        'scale_factor': 1.2,
        'graticules': false,
        'scale_bar_distance': null,
        'paths': [
            'counties',
            'states',
        ],
        'labels': []
    });
}

module.exports = configure
