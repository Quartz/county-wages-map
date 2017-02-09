var d3 = require('d3');
var geo = require('d3-geo-projection');

var base = require('./base.js');

function configure(width) {
    var output = $.extend(true, {}, base());

    return $.extend(true, output, {
        'projection': d3.geo.conicConformal().center([12, 50]),
        'scale_factor': 1.2,
        'scale_bar_distance': 250,
        'paths': [
            'countries'
        ],
        'labels': [
            'countries',
        ],
        'label_nudges': {
            'countries': {
                'Austria': [0.5, 0],
                'Finland': [-1.5, -3],
                'Hungary': [-0.25, -0.25],
                'Norway': [-3, -3],
                'Ireland': [0.5, 0],
                'Italy': [0.25, 0],
                'Russia': [-15, -5],
                'Slovenia': [0, -0.2],
                'Sweden': [-1.5, -3],
                'United Kingdom': [1.25, -1.75]
            }
        },
        'label_subs': {
            'countries': {
                'United Kingdom': 'UK'
            }
        }
    });
}

module.exports = configure
