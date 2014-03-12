// NOTE: Based upon ideas from http://bl.ocks.org/mbostock/1667367

var margin = {
  top: 50,
  right: 50,
  bottom: 50,
  left: 50
};

var width = 960 - margin.left - margin.right;

var height = 800 - margin.bottom - margin.top;

var bbOverview = {
  x: 50,
  y: 0,
  w: width-50,
  h: 50
};

var bbDetail = {
  x: 50,
  y: 100,
  w: width-50,
  h: 300
};

var parseDate = d3.time.format("%b %Y").parse;

var xOverview = d3.time.scale().range([0, bbOverview.w]),
    xDetail = d3.time.scale().range([0, bbDetail.w]),
    yOverview = d3.scale.linear().range([bbOverview.h, 0]),
    yDetail = d3.scale.linear().range([bbDetail.h, 0]);

var xAxisOverview = d3.svg.axis().scale(xOverview).orient("bottom"),
    xAxisDetail = d3.svg.axis().scale(xDetail).orient("bottom"),
    yAxisOverview = d3.svg.axis().scale(yOverview).ticks(4).orient("left"),
    yAxisDetail = d3.svg.axis().scale(yDetail).orient("left");

var brush = d3.svg.brush()
  .x(xOverview)
  .on("brush", brushed);

var lineOverview = d3.svg.line()
  .interpolate("linear")
  .x(function(d) { return xOverview(d.date); })
  .y(function(d) { return yOverview(d.value); });

var lineDetail = d3.svg.line()
  .interpolate("linear")
  .x(function(d) { return xDetail(d.date); })
  .y(function(d) { return yDetail(d.value); });

var areaDetail = d3.svg.area()
  .interpolate("linear")
  .x(function(d) { return xDetail(d.date); })
  .y0(bbDetail.h)
  .y1(function(d) { return yDetail(d.value); });

var svg = d3.select("#visUN").append("svg")
  .attr({
    width: width + margin.left + margin.right,
    height: height + margin.top + margin.bottom
  })

var overview = svg.append("g")
  .attr({
    class: "overview",
    transform: "translate(" + (margin.left + bbOverview.x) + "," + (margin.top + bbOverview.y) + ")"
  });

var detail = svg.append("g")
  .attr({
    class: "detail",
    transform: "translate(" + (margin.left + bbDetail.x) + "," + (margin.top + bbDetail.y) + ")"
  });

detail.append("defs").append("clipPath")
  .attr("id", "clip")
  .append("rect")
    .attr("width", bbDetail.w)
    .attr("height", bbDetail.h);

d3.csv("unHealth.csv", type, function(data) {
  xDetail.domain(d3.extent(data.map(function(d) { return d.date; })));
  yDetail.domain([0,d3.max(data.map(function(d) { return d.value; }))]);
  xOverview.domain(xDetail.domain());
  yOverview.domain(yDetail.domain());

  overview.append("path")
    .datum(data)
    .attr("class", "path overviewPath")
    .attr("d", lineOverview);

  overview.selectAll(".overviewCircle")
    .data(data)
    .enter().append("circle")
    .attr("class", "overviewCircle")
    .attr("cx", function(d) { return xOverview(d.date); })
    .attr("cy", function(d) { return yOverview(d.value); })
    .attr("r", 2);

  overview.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + bbOverview.h + ")")
    .call(xAxisOverview);

  overview.append("g")
    .attr("class", "y axis")
    .call(yAxisOverview);

  overview.append("g")
    .attr("class", "x brush")
    .call(brush)
    .selectAll("rect")
      .attr("y", -6)
      .attr("height", bbOverview.h + 7);

  events = [
    {x:280, y:5, start:'Nov 2011', end:'Jul 2012', text:'<tspan text-decoration="underline">Initial spike in activity</tspan> &#x2192;'},
    {x:645, y:45, start:'Nov 2012', end:'Jul 2013', text:'&#x2196; <tspan text-decoration="underline">New steady state</tspan>' }
  ]

  var eventClickCallback = function(start, end) {
    brush.extent([parseDate(start), parseDate(end)]);
    svg.select('.brush').call(brush);
    brushed();
  }

  overview.selectAll(".events")
    .data(events)
    .enter().append("g")
    .attr("class","events")
    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
    .append("text")
    .html(function(d) { return d.text; })
    .attr("class", "event")
    .on("click", function(d) { return eventClickCallback(d.start, d.end); });

  detail.append("path")
    .datum(data)
    .attr("class", "path detailPath")
    .attr("d", lineDetail);

  detail.selectAll(".detailCircle")
    .data(data)
    .enter().append("circle")
    .attr("class", "detailCircle")
    .attr("cx", function(d) { return xDetail(d.date); })
    .attr("cy", function(d) { return yDetail(d.value); })
    .attr("r", 3);

  detail.append("path")
    .datum(data)
    .attr("class", "detailArea")
    .attr("d", areaDetail);

  detail.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + bbDetail.h + ")")
    .call(xAxisDetail);

  detail.append("g")
    .attr("class", "y axis")
    .call(yAxisDetail);

});

function brushed() {
  xDetail.domain(brush.empty() ? xOverview.domain() : brush.extent());
  detail.select(".detailPath").attr("d", lineDetail);
  detail.selectAll(".detailCircle").attr("cx", function(d) { return xDetail(d.date); });
  detail.select(".detailArea").attr("d", areaDetail);
  detail.select(".x.axis").call(xAxisDetail);
}

function type(d) {
  d.date = parseDate(d.date);
  d.value = parseInt(d.women);
  return d;
}
