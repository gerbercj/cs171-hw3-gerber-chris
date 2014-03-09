var bbVis, createVis, dataSet, height, margin, svg, width;

margin = {
  top: 50,
  right: 50,
  bottom: 50,
  left: 50
};

width = 960 - margin.left - margin.right;

height = 300 - margin.bottom - margin.top;

bbVis = {
  x: 0 + 100,
  y: 10,
  w: width - 100,
  h: height - 10
};

dataSet = {};

svg = d3.select("#vis").append("svg").attr({
  width: width + margin.left + margin.right,
  height: height + margin.top + margin.bottom
}).append("g").attr({
  transform: "translate(" + margin.left + "," + margin.top + ")"
});


d3.csv("timeline.csv", function(data) {
  // initialize dataSet
  dataSet = {years:[], values:[]};
  for (var i=1; i<6; i++) {
    dataSet.values.push([]);
  }

  // convert your csv data and add it to dataSet
  data.forEach(function(d) {
    dataSet.years.push(parseInt(d.year));
    for (var i=1; i<6; i++) {
      var value = parseInt(eval("d.est"+i))
      if (isNaN(value)) {
        dataSet.values[i-1].push({value:0, real:false});
      } else {
        dataSet.values[i-1].push({value:parseInt(eval("d.est"+i)), real:true});
      }
    }
  });

  return createVis();
});

createVis = function() {
  var allValues = dataSet.values.map(function(d) {
    return d.map(function(e) {
      return e.value;
    });
  }).reduce(function(prev,next) {
    return prev.concat(next);
  });

  var xDomain = d3.extent(dataSet.years);
  var yDomain = d3.extent(allValues);

  var x = d3.scale.linear().domain(xDomain).range([bbVis.x, bbVis.x + bbVis.w]);
  var y = d3.scale.linear().domain(yDomain).range([bbVis.y + bbVis.h, bbVis.y]);

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
      if (dataSet.values[index][i].real) return {year: d, population: dataSet.values[index][i].value};
      return null;
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

  var population = svg.selectAll(".dataArea")
    .data(populations)
    .enter().append("g")
    .style("stroke", function(d) { return color(d.name); })
    .attr("class", "dataArea");

  population.append("path")
    .attr("class", "line")
    .attr("d", function(d) { return line(d.values); })
    .style("fill", "none");

  population.selectAll("circle")
    .data(function(d) { return d.values; })
    .enter().append("circle")
    .attr("cx", function(d) { return x(d.year); })
    .attr("cy", function(d) { return y(d.population); })
    .attr("r", function(d) { return 2; });
};
