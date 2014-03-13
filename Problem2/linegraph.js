// Declare global variables
var bbVis, createVis, dataSet, height, margin, svg, width;

// Establish margins and bounding boxes
margin = {
  top: 50,
  right: 50,
  bottom: 50,
  left: 50
};

width = 960 - margin.left - margin.right;

height = 600 - margin.bottom - margin.top;

bbVis = {
  x: 0 + 100,
  y: 10,
  w: width - 100,
  h: height - 10
};

// Initialize global variable
dataSet = {};

// Create "box" for visualization
svg = d3.select("#vis").append("svg").attr({
  width: width + margin.left + margin.right,
  height: height + margin.top + margin.bottom
}).append("g").attr({
  transform: "translate(" + margin.left + "," + margin.top + ")"
});

// Load and transform the data
d3.csv("timeline.csv", function(data) {
  // Initialize dataSet
  dataSet = {years:[], values:[]};
  for (var i=1; i<6; i++) {
    dataSet.values.push([]);
  }

  // Convert your csv data and add it to dataSet
  data.forEach(function(d) {
    dataSet.years.push(parseInt(d.year));
    for (var i=1; i<6; i++) {
      var value = parseInt(eval("d.est"+i))
      if (isNaN(value)) {
        dataSet.values[i-1].push({value:0, type:"none"});
      } else {
        dataSet.values[i-1].push({value:parseInt(eval("d.est"+i)), type:"real"});
      }
    }
  });

  // Interpolate missing values helpers
  function lowerPoint(year, series) {
    var result = {year:NaN, value:NaN}
    for (var i = 0; i < dataSet.years.length; i++) {
      if (dataSet.years[i] >= year) break;
      if (dataSet.values[series][i].type == "real") {
        result.year = dataSet.years[i];
        result.value = dataSet.values[series][i].value;
      }
    }
    return result;
  }

  function higherPoint(year, series) {
    var result = {year:NaN, value:NaN}
    for (var i = dataSet.years.length - 1; i >= 0; i--) {
      if (dataSet.years[i] <= year) break;
      if (dataSet.values[series][i].type == "real") {
        result.year = dataSet.years[i];
        result.value = dataSet.values[series][i].value;
      }
    }
    return result;
  }

  function interpolatedPoint(year, series) {
    var low = lowerPoint(year, series);
    var high = higherPoint(year, series);
    if (isNaN(low.year) || isNaN(high.year)) return NaN;
    return low.value + (high.value-low.value) * (year - low.year) / (high.year-low.year);
  }

  // Actually do the interpolation
  dataSet.years.forEach(function(year, i) {
    dataSet.values.forEach(function(series, j) {
      if (series[i].type != "real") {
        var year = dataSet.years[i];
        var value = interpolatedPoint(year, j);
        if (!isNaN(value)) {
          series[i] = {
            type: "fake",
            value: value
          }
        }
      }
    });
  });

  return createVis();
});

// Create the visualization after transforming the data
createVis = function() {
  // Map/reduce all points to establish min/max values
  var allValues = dataSet.values.map(function(d) {
    return d.map(function(e) {
      return e.value;
    });
  }).reduce(function(prev,next) {
    return prev.concat(next);
  });

  // Configure the domains and ranges
  var xDomain = d3.extent(dataSet.years);
  var yDomain = d3.extent(allValues);

  var x = d3.scale.linear().domain(xDomain).range([0, bbVis.w]);
  var y = d3.scale.linear().domain(yDomain).range([bbVis.h, 0]);

  // Configure the axes
  var xAxis = d3.svg.axis()
    .scale(x)
    .orient('bottom');
  var yAxis = d3.svg.axis()
    .scale(y)
    .ticks(5)
    .orient('left');

  // Add axes to the visualization
  svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(' + bbVis.x + ',' + (bbVis.y + bbVis.h) + ')')
    .call(xAxis);
  svg.append('g')
    .attr('class', 'y axis')
    .attr('transform', 'translate(' + bbVis.x + ',' + bbVis.y + ')')
    .call(yAxis);

  // Add data to the visualization
  var labels = ['est1', 'est2', 'est3', 'est4', 'est5'];
  var color = d3.scale.category10();
  color.domain(labels);

  var line = d3.svg.line()
    .interpolate("linear")
    .x(function(d) { return x(d.year); })
    .y(function(d) { return y(d.population); });

  var populations = color.domain().map(function(name, index) {
    // create x/y pairs for this series
    var values = dataSet.years.map(function(d, i) {
      if (dataSet.values[index][i].type == "none" ) return null;
      return {year: d, population: dataSet.values[index][i].value, type: dataSet.values[index][i].type};
    });

    // remove missing data values from each series
    values = values.reduce(function(prev, curr) {
      if (!prev) {
        if (curr) return [curr];
        return null;
      }
      if (curr) return prev.concat([curr]);
      return prev;
    },[]);

    return {name: name, values: values};
  });

  // Add data to the canvas
  var population = svg.selectAll(".dataArea")
    .data(populations)
    .enter().append("g")
    .style("stroke", function(d) { return color(d.name); })
    .style("fill", function(d) { return color(d.name); })
    .attr("class", "dataArea")
    .attr('transform', 'translate(' + bbVis.x + ',' + bbVis.y + ')');

  population.append("path")
    .attr("class", "line")
    .attr("d", function(d) { return line(d.values); })
    .style("fill", "none");

  population.selectAll("circle")
    .data(function(d) { return d.values; })
    .enter().append("circle")
    .attr("class", function(d) { return d.type; })
    .attr("cx", function(d) { return x(d.year); })
    .attr("cy", function(d) { return y(d.population); })
    .attr("r", function(d) { return 2; });
};
