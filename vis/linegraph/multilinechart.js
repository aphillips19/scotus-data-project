1
// Namespace
var NS = {}; // create namespace

  //NS.datapath = "../../Data/SCDB_2017_01_justiceCentered_Legagraphion.csv"
  //NS.datapath = "../../Data/SCDB_small.csv"
  NS.datapath = "../../Data/SCDB_M_justiceCentered.csv"
  //NS.datapath = "../../Data/SCDB_M_justiceCentered_small.csv"


// Get the mean voting data
function aggregateData() {
  NS.dataNested = d3.nest()
    // nest by justice
    .key(function(d) {return d.justiceName})
    // nest by term
    .key(function(d) {return d.term; } )

    // roll up mean votes
    .rollup(function(v) {
      return {
        mean: d3.mean(v, function(d) {
                      // ignore cases with no direction
                      if(d.direction >= 1) {
                        return d.direction - 1; // change range from 1-2 to 0-1
                      }
              }),
        n: v.length
      };
    })
    .entries(NS.dataset);
}


// Get the swing vote data
// function getSwingVote() {}

function initialize() {

  // Load census data and call main
  d3.csv(NS.datapath, function(d) {
    NS.dataset = d;

    main();
  });
}

function createGraph() {

/* Graph-related global variables */

  // Create the SVG
  NS.svg = d3.select("svg");

  // Set the margins for the graph and the timeline
  NS.margin = {top: 20,   right: 80, bottom: 110, left: 40},
  NS.margin2 = {top: 430, right: 80, bottom: 30,  left: 40};
 

  // Set the width and height of the graph
  NS.width = +NS.svg.attr("width") - NS.margin.left - NS.margin.right;
  NS.height = +NS.svg.attr("height") - NS.margin.top - NS.margin.bottom;

  // Set the height of the timeline
  NS.height2 = +NS.svg.attr("height") - NS.margin2.top - NS.margin2.bottom;
  
  // Add all this graph stuff to "g"
  //NS.g = NS.svg.append("g").attr("transform", "translate(" + NS.margin.left + "," + NS.margin.top + ")");

  // define scales for the graph
  NS.x = d3.scaleLinear().range([0, NS.width])
  NS.y = d3.scaleLinear().range([NS.height, 0])
  NS.z = d3.scaleOrdinal(d3.schemeCategory20)

  // define scales for the timeline
  NS.x2 = d3.scaleLinear().range([0, NS.width])
  NS.y2 = d3.scaleLinear().range([NS.height2, 0])

  // Add x axes
  // for the graph
  NS.xAxis = d3.axisBottom(NS.x)
             .tickFormat(function(d) {
               return d;
             });
  // for the timeline
  NS.xAxis2 = d3.axisBottom(NS.x2)
             .tickFormat(function(d) {
               return d;
             });

  // NOTE: I can make it snap! https://github.com/d3/d3-brush
  // Add the brush
  NS.brush = d3.brushX()
    .extent([[0,0], [NS.width, NS.height2]])
    .on("brush end", brushed)

  // Add the zoom
  NS.zoom = d3.zoom()
    .scaleExtent([1, Infinity])
    .translateExtent([0, 0], [NS.width, NS.height])
    .extent([[0, 0], [NS.width, NS.height]])
    .on("zoom", zoomed);

  // mbostock would have added area and area2
  // I believe line is area... and area 2 will be the timeline, so it's just
  // blank for now.
  NS.line = d3.line()
    //.curve(d3.curveBasis)
    .x(function(d) {
      return NS.x(d.key);
    })
    .y(function(d) {
      return NS.y(d.value.mean)
    });

  // Store the focused area - the line graph
  NS.focus = NS.svg.append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + NS.margin.left + "," + NS.margin.top + ")");

  // Store the context - the timeline
  NS.context = NS.svg.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + NS.margin2.left + "," + NS.margin2.top + ")");

/* End graph-related global variables */

  // Domains
  NS.x.domain(d3.extent(NS.dataset, function(d) {
    return +(d.term);
  }));
  NS.y.domain([0, 1])

  NS.x2.domain(NS.x.domain())
  NS.y2.domain(NS.y.domain())

  NS.z.domain(NS.dataNested.map(function(c) { return c.key; }));

/* Add stuff to focused graph */
  NS.focus.append("g")
    // make the x axis
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + NS.height + ")")
    .call(NS.xAxis);

  NS.focus.append("g")
    // make the y axis
      .attr("class", "axis axis--y")
      .call(d3.axisLeft(NS.y))
    // label the y axis
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .attr("fill", "#000")
      .text("Preference Value");

  
  // Create an object for each justice
  NS.justice = NS.focus.selectAll(".justice")
    .data(NS.dataNested)
    .enter().append("g")
      .attr("class", "justice");

  var shownJustices = ["JPStevens", "DHSouter", "SDOConnor", "WHRehnquist", "BRWhite"];

  function fade (c, j) {
      if(shownJustices.includes(j)) {
        return c;
      } else {
        // fade it
        var color = d3.color(c)
        color.opacity = 0.1;
        return color.toString();
      }
  }

  // Add lines for each justice
  NS.justice.append("path")
    .attr("class", "line")
    .attr("d", function(d) { return NS.line(d.values); })
    .style("stroke", function(d) {
      return fade(NS.z(d.key), d.key);
    })
    .style("stroke-width", 2);

  // Add labels for each justice
  NS.justice.append("text")
      // get the last piece of data in the timeline
      .datum(function(d) { return {justice: d.key, value: d.values[d.values.length - 1]}; })
      .attr("transform", function(d) { 
        return "translate(" + NS.x(d.value.key) + "," + NS.y(d.value.value.mean) + ")";
      })
      .attr("class", "justice-label-text")
      .attr("x", 3)
      .attr("dy", "0.35em")
      .style("font", "10px sans-serif")
      .style("fill", function(d) {
        return fade("black", d.justice);
      })
      .text(function(d) { return d.justice; });


  /* End add stuff to focused graph */
  /* Add stuff to context */
  NS.context.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + NS.height2 + ")")
    .call(NS.xAxis2);

  NS.context.append("g")
    .attr("class", "brush")
    .call(NS.brush)
    .call(NS.brush.move, NS.x.range())

/*
  // scroll to zoom rectangle
  NS.svg.append("rect")
    .attr("class", "zoom")
    .attr("width", NS.width)
    .attr("height", NS.height)
    .attr("transform", "translate(" + NS.margin.left + "," + NS.margin.top + ")")
    .call(NS.zoom);
*/
}

function updateJustices() {
  // update axis
  NS.focus.select(".axis--x").call(NS.xAxis);

  var justice = NS.focus.selectAll(".justice");
  
  //console.log(justice);
  
  // update paths
  justice.select(".line").attr("d", function(d) {
    return NS.line(d.values);
  })

  // update labels
  justice.select(".justice-label-text")
  .datum(function(d) {
    console.log(d);
    // grab the maximum and minimum year currently on the domain
    var maxYear = Math.floor(NS.x.domain()[1])
    var minYear = Math.ceil(NS.x.domain()[0])
    var extent = d3.extent(d.values);
    // note whether or not this justice should be present
    return {
      justice: d.key,
      value: d.values[d.values.length - 1]
      ongraph: 
    };
  })
  .attr("transform", function(d) { 
    var x = NS.x(d.value.key);
    if(x > NS.width) {
      x = NS.width;
    }
    return "translate(" + x + "," + NS.y(d.value.value.mean) + ")";
  });
}

function brushed() {
  console.log("brushed")
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
  var s = d3.event.selection || NS.x2.range();
  NS.x.domain(s.map(NS.x2.invert, NS.x2));
  updateJustices();
}

function zoomed() {
}

function main() {
  aggregateData();

 createGraph();


}

initialize();

