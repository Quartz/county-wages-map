// NPM modules
var d3 = require('d3');
var geo = require('d3-geo-projection');
var topojson = require('topojson');
var _ = require('lodash');

// Local modules
var features = require('./detectFeatures')();
var fm = require('./fm');
var utils = require('./utils');
var geomath = require('./geomath');

// Globals
var MOBILE_BREAKPOINT = 600;
var SIMPLE_LABELS = [{
    'lat': 37,
    'lng': -95,
    'label': 'My label',
    'class': ''
}];

// var HIGHLIGHT = 'texas';
var HIGHLIGHT = null;

// var configure = require('./maps/usa-counties.js');
// var configure = require('./maps/new-york.js');
var configure = require('./maps/usa-counties.js');

// Global vars
var isMobile = false;
var topoData = {};
var countyData = {};
var identityProjection = null;

var tooltipTemplate = _.template('\
<span class="county"><%= area_title %></span><br />\
<strong>Income growth:</strong> <%= change > 0 ? "+" : "" %><%= annual_change %> dollars per year (<%= change > 0 ? "+" : "" %><%= (pct_change * 100).toFixed(1) %>%)\
')

/**
 * Initialize the graphic.
 *
 * Fetch data, format data, cache HTML references, etc.
 */
function init() {
    // Used for computing centroids in coordinate space
    identityProjection = d3.geo.path()
        .projection({stream: function(d) { return d; }});

    d3.json('data/geodata.json', function(error, data) {
        // Extract topojson features
        for (var key in data['objects']) {
            topoData[key] = topojson.feature(data, data['objects'][key]);
        }

        d3.csv('data/wages_by_area_adjusted.csv', function(error, data) {
            _.each(data, function(d) {
                bits = d['area_title'].split(', ');
                d['county'] = bits[0];
                d['state'] = bits[1];

                if (d['county'] == 'District of Columbia') {
                    d['state'] = 'DC';
                }

                d['change'] = +d['change'];
                d['pct_change'] = +d['pct_change'];

                countyData[d['area_fips']] = d;
            });

            // render();
            $(window).resize(utils.throttle(onResize, 250));
            $(window).resize();
        });
    });
}

/**
 * Invoke on resize. By default simply rerenders the graphic.
 */
function onResize() {
    // console.log($('#interactive-content').width());
    if ($('#interactive-content').width() > MOBILE_BREAKPOINT) {
       render();
   } else {
       $('#graphic').html('<img src="assets/16_9.jpg">');

    //    $('.footer').
    //    d3.selectAll('.footer')
    //        .style('top', '')
   }
}

/**
 * Figure out the current frame size and render the graphic.
 */
function render() {
    var containerWidth = $('#interactive-content').width();

    if (!containerWidth) {
        containerWidth = DEFAULT_WIDTH;
    }

    if (containerWidth <= MOBILE_BREAKPOINT) {
        isMobile = true;
    } else {
        isMobile = false;
    }

    // What kind of map are we making?
    var configuration = configure(containerWidth);

    // Render the map!
    renderMap(configuration, {
        container: '#graphic',
        width: containerWidth,
        data: topoData
    });

    // Resize
    fm.resize();
}

var renderMap = function(typeConfig, instanceConfig) {
    /*
     * Setup
     */
    var selectionElement = null;

    // Calculate actual map dimensions
    var mapWidth = instanceConfig['width'];
    var mapHeight = Math.ceil(instanceConfig['width'] / typeConfig['aspect_ratio']);

    // Clear existing graphic (for redraw)
    var containerElement = d3.select(instanceConfig['container']);
    containerElement.html('');

    var tooltip = containerElement.append('div')
        .attr('id', 'tooltip');

    /*
     * Create the map projection.
     */
    var centroid = typeConfig['centroid'];
    var mapScale = mapWidth * typeConfig['scale_factor'];

    var projection = typeConfig['projection']
        .scale(mapScale)
        .translate([mapWidth / 2, mapHeight / 2]);

    var path = d3.geo.path()
        .projection(projection)
        .pointRadius(typeConfig['dot_radius'] * mapScale);

    /*
     * Create the root SVG element.
     */
    var chartWrapper = containerElement.append('div')
        .attr('class', 'graphic-wrapper');

    var chartElement = chartWrapper.append('svg')
        .attr('width', mapWidth)
        .attr('height', mapHeight)

    /*
     * Render graticules.
     */
    if (typeConfig['graticules']) {
        var graticule = d3.geo.graticule();

        chartElement.append('g')
            .attr('class', 'graticules')
            .append('path')
                .datum(graticule)
                .attr('d', path);
    }

    /*
     * Render paths.
     */
    var pathsElement = chartElement.append('g')
        .attr('class', 'paths');

    function classifyFeature(d) {
        var c = [];

        if (d['id']) {
            var state_cls = utils.classify(d['id']);

            c.push(state_cls);

            if (HIGHLIGHT && state_cls != HIGHLIGHT) {
                c.push('fade');
            }
        }

        for (var property in d['properties']) {
            var value = d['properties'][property];

            c.push(utils.classify(property + '-' + value));
        }

        return c.join(' ');
    }

    function renderPaths(group) {
        pathsElement.append('g')
            .attr('class', group)
            .selectAll('path')
                .data(instanceConfig['data'][group]['features'])
            .enter().append('path')
                .attr('d', path)
                .attr('class', classifyFeature);
    }

    pathsElement.append('g')
        .attr('class', 'counties')
        .selectAll('path')
            .data(instanceConfig['data']['counties']['features'])
        .enter().append('path')
            .attr('d', path)
            .attr('class', function(d) {
                var cls = [];
                var fips = d['id'].replace(/^0+/, '');

                // Wade Hamptok, AK -> Kusilvak
                if (fips == '2158') {
                    fips = '2270';
                // Shannon County, SD -> Oglala Dakota
                } else if (fips == '46102') {
                    fips = '46113';
                }

                if (fips in countyData) {
                    var state_cls = utils.classify(countyData[fips]['state']);

                    cls.push(state_cls);

                    if (HIGHLIGHT && state_cls != HIGHLIGHT) {
                        cls.push('fade');
                    }

                    var change = countyData[fips]['change'];

                    if (change < 47.4) {
                        cls.push('lower');
                    } else if (change < 87.3) {
                        cls.push('lower-middle');
                    } else if (change < 125.3) {
                        cls.push('middle');
                    } else if (change < 183.5) {
                        cls.push('upper-middle');
                    } else {
                        cls.push('upper');
                    }
                } else {
                    cls.push('no-data')
                }

                return cls.join(' ');
            })
            .on("mouseover", function(d) {
                var fips = d['id'].replace(/^0+/, '');
                var data = countyData[fips];

                data['annual_change'] = commaFormat((data['change'] * 52.14).toFixed(0));

                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);

                tooltip.html(tooltipTemplate(data))
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY + 20) + "px");

                selectionElement.append('path')
                    .datum(d)
                    .attr('d', path)
            })
            .on("mouseout", function(d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);

                selectionElement.html('');
            });

    renderPaths('states');

    var selectionElement = pathsElement.append('g')
        .attr('class', 'selection');

    /*
     * Render a scale bar.
     */
    if (typeConfig['scale_bar_distance']) {
        var scaleBarDistance = typeConfig['scale_bar_distance'];
        var scaleBarStart = [10, mapHeight - 35];
        var scaleBarEnd = geomath.calculateScaleBarEndPoint(projection, scaleBarStart, scaleBarDistance);

        chartElement.append('g')
            .attr('class', 'scale-bar')
            .append('line')
            .attr('x1', scaleBarStart[0])
            .attr('y1', scaleBarStart[1])
            .attr('x2', scaleBarEnd[0])
            .attr('y2', scaleBarEnd[1]);

        var label = ' mile';

        if (scaleBarDistance != 1) {
            label += 's';
        }

        d3.select('.scale-bar')
            .append('text')
            .attr('x', scaleBarEnd[0] + 5)
            .attr('y', scaleBarEnd[1])
            .text(scaleBarDistance + label);
    }

    /*
     * Reposition footer.
     */
    // d3.selectAll('.footer')
    //     .style('top', (mapHeight + 50) + 'px')

    if (HIGHLIGHT) {
        d3.selectAll('h5,#legend,.footer')
            .style('display', 'none');
    }
}

function commaFormat(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Bind on-load handler
$(document).ready(function() {
    init();
});
