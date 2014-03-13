var bbVis, createVis, dataSet, height, margin, svg, width, allValues, allPercents;

margin = {
  top: 50,
  right: 50,
  bottom: 50,
  left: 50
};

width = 960 - margin.left - margin.right;

height = 800 - margin.bottom - margin.top;

bbPercent = {
  x: 100,
  y: 0,
  w: width - 100,
  h: 150
};

bbVis = {
  x: 100,
  y: 200,
  w: width - 100,
  h: height - 250
};

dataSet = {};
concensus = {years:[],values:[]};
allValues = [];
allPercents = [];

svg = d3.select("#vis").append("svg").attr({
  width: width + margin.left + margin.right,
  height: height + margin.top + margin.bottom
}).append("g").attr({
  transform: "translate(" + margin.left + "," + margin.top + ")"
});

var percentSvg = svg.append("g")
  .attr({
    class: "percent",
    transform: "translate(" + bbPercent.x + ',' + bbPercent.y + ")"
  });

var visSvg = svg.append("g")
  .attr({
    class: "vis",
    transform: "translate(" + bbVis.x + ',' + bbVis.y + ")"
  });

visSvg.append("defs").append("clipPath")
  .attr("id", "clip")
  .append("rect")
    .attr("width", bbVis.w)
    .attr("height", bbVis.h);

// interpolate missing values helpers
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
        dataSet.values[i-1].push({value:0, type:"none"});
      } else {
        dataSet.values[i-1].push({value:parseInt(eval("d.est"+i)), type:"real"});
      }
    }
  });

  // actually do the interpolation
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

  // generate consensus line
  dataSet.years.forEach(function(year, i) {
    var points = dataSet.values.reduce(function(prev, curr) {
      if (curr[i].type == "none") return prev;
      return prev.concat([curr[i]]);
    },[]);
    var sum = points.reduce(function(prev, curr) {
      return prev + curr.value;
    },0);
    var average = sum / points.length;
    concensus.years.push(year);
    concensus.values.push(average);
  });

  // calculate percent delta from concensus
  concensus.values.forEach(function(item, i) {
    dataSet.values.forEach(function(series, j) {
      if (series[i].type == "none") {
        series[i].percent = NaN;
      } else {
        series[i].percent = (series[i].value - item)/item;
      }
    });
  });

  allValues = dataSet.values.map(function(d) {
    return d.map(function(e) {
      return e.value;
    });
  }).reduce(function(prev, curr) {
    return prev.concat(curr);
  }).reduce(function(prev, curr) {
    if (curr == 0) return prev;
    return prev.concat([curr]);
  },[]);

  allPercents = dataSet.values.map(function(d) {
    return d.map(function(e) {
      return e.percent;
    });
  }).reduce(function(prev, curr) {
    return prev.concat(curr);
  });

  return createVis();
});

createVis = function() {
  var xDomainPercent = d3.extent(dataSet.years);
  var yDomainPercent = d3.extent(allPercents);

  var xDomain = d3.extent(dataSet.years);
  var yDomain = d3.extent(allValues);

  var xPercent = d3.scale.pow().exponent(5).domain(xDomainPercent).range([0, bbPercent.w]);
  var yPercent = d3.scale.linear().domain(yDomainPercent).range([bbPercent.h, 0]);

  var xVis = d3.scale.pow().exponent(5).domain(xDomain).range([0, bbVis.w]);
  var yVis = d3.scale.linear().domain(yDomain).range([bbVis.h, 0]);

  // Configure the axes
  var formatPercent = d3.format(".0%");

  var xAxisPercent = d3.svg.axis()
    .scale(xPercent)
    .ticks(5)
    .orient('bottom');

  var yAxisPercent = d3.svg.axis()
    .scale(yPercent)
    .ticks(6)
    .orient('left')
    .tickFormat(formatPercent);

  var brush = d3.svg.brush()
    .x(xPercent)
    .on("brush", brushed);

  var xAxis = d3.svg.axis()
    .scale(xVis)
    .ticks(5)
    .orient('bottom');

  var yAxis = d3.svg.axis()
    .scale(yVis)
    .orient('left');

  // Add axes to the visualization
  percentSvg.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + yPercent(0) + ')')
    .call(xAxisPercent)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.7em")
    .attr("dy", "0.1em")
    .attr("transform", function(d) {
      return "rotate(-90)"
    });

  percentSvg.append('g')
    .attr('class', 'y axis')
    .call(yAxisPercent);

  percentSvg.append("g")
    .attr('class', 'x brush')
    .call(brush)
    .selectAll("rect")
      .attr("y", -6)
      .attr("height", bbPercent.h + 7);

  visSvg.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + bbVis.h + ')')
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.7em")
    .attr("dy", "0.1em")
    .attr("transform", function(d) {
      return "rotate(-90)"
    });

  visSvg.append('g')
    .attr('class', 'y axis')
    .call(yAxis);

  // Add data to the visualization
  var labels = ['est1', 'est2', 'est3', 'est4', 'est5'];
  var color = d3.scale.category10();
  color.domain(labels);

  var linePercent = d3.svg.line()
    .interpolate("linear")
    .x(function(d) { return xPercent(d.year); })
    .y(function(d) { return yPercent(d.percent); });

  var line = d3.svg.line()
    .interpolate("linear")
    .x(function(d) { return xVis(d.year); })
    .y(function(d) { return yVis(d.population); });

  var populations = color.domain().map(function(name, index) {
    // create x/y pairs for this series
    var values = dataSet.years.map(function(d, i) {
      if (dataSet.values[index][i].type == "none" ) return null;
      return {
        year: d,
        population: dataSet.values[index][i].value,
        type: dataSet.values[index][i].type,
        percent: dataSet.values[index][i].percent
      };
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

  var concensusValues = function() {
    var values = concensus.years.map(function(d, i) {
      return {
        year: d,
        population: concensus.values[i]
      };
    });

    return [{name:"concensus", values:values}];
  }

  var percentGroup = percentSvg.selectAll(".percentArea")
    .data(populations)
    .enter().append("g")
    .style("stroke", function(d) { return color(d.name); })
    .style("fill", function(d) { return color(d.name); })
    .attr("class", "percentArea");

  percentGroup.append("path")
    .attr("class", "percentLine")
    .attr("d", function(d) { return linePercent(d.values); })
    .style("fill", "none");

  var population = visSvg.selectAll(".dataArea")
    .data(populations)
    .enter().append("g")
    .style("stroke", function(d) { return color(d.name); })
    .style("fill", function(d) { return color(d.name); })
    .attr("class", "dataArea");

  population.append("path")
    .attr("class", "line")
    .attr("d", function(d) { return line(d.values); });

  population.selectAll("circle")
    .data(function(d) { return d.values; })
    .enter().append("circle")
    .attr("class", function(d) { return d.type; })
    .attr("cx", function(d) { return xVis(d.year); })
    .attr("cy", function(d) { return yVis(d.population); })
    .attr("r", 3);

  var concensusLine = visSvg.selectAll(".concensus")
    .data(concensusValues)
    .enter().append("g")
    .style("stroke", "black")
    .attr("class", "concensus");

  concensusLine.append("path")
    .attr("class", "line")
    .attr("d", function(d) { return line(d.values); });

  concensusLine.selectAll("circle")
    .data(function(d) { return d.values; })
    .enter().append("circle")
    .attr("class", "fake")
    .attr("cx", function(d) { return xVis(d.year); })
    .attr("cy", function(d) { return yVis(d.population); })
    .attr("r", 3);

  function brushed() {
    if (brush.empty()) {
      xVis.domain(xPercent.domain());
      yVis.domain(d3.extent(allValues));
    } else {
      var yMin = d3.min(dataSet.values.map(function(d,i) {
        return interpolatedPoint(brush.extent()[0], i);
      }));
      if (yMin === undefined) yMin = [d3.min(allValues)];

      var yMax = d3.max(dataSet.values.map(function(d,i) {
        return interpolatedPoint(brush.extent()[1], i);
      }));
      if (yMax === undefined) yMax = [d3.max(allValues)];

      xVis.domain(brush.extent());
      yVis.domain([yMin, yMax]);
    }
    visSvg.select(".x.axis").call(xAxis);
    visSvg.select(".y.axis").call(yAxis);
    visSvg.selectAll(".real").attr("cx", function(d) { return xVis(d.year); });
    visSvg.selectAll(".real").attr("cy", function(d) { return yVis(d.population); });
    visSvg.selectAll(".fake").attr("cx", function(d) { return xVis(d.year); });
    visSvg.selectAll(".fake").attr("cy", function(d) { return yVis(d.population); });
    visSvg.selectAll(".consensus").attr("d", function(d) { return line(d.values); })
    visSvg.selectAll(".line").attr("d", function(d) { return line(d.values); });
  }
};
