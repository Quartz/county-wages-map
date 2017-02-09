var d3 = require('d3');
var geo = require('d3-geo-projection');

var base = require('./base.js');

function configure(width) {
    var output = $.extend(true, {}, base());

    return $.extend(true, output, {
        'projection': geo.kavrayskiy7().center([10, 2.5]),
        'scale_factor': 0.18,
        'scale_bar_distance': null,
        'paths': [
            'countries'
        ]
    });
}

module.exports = configure
