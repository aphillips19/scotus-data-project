// Namespace
//
//
// tooltip/tutorial: https://introjs.com/
//
//
//
var NS = {}; // create namespace

  //NS.datapath = "../../Data/SCDB_2017_01_justiceCentered_Legagraphion.csv"
  //NS.datapath = "../../Data/SCDB_small.csv"
  NS.datapath = "../../Data/SCDB_M_justiceCentered.csv"
  //NS.datapath = "../../Data/SCDB_M_justiceCentered_small.csv"

  NS.datapathCJ = "../../Data/chiefjustices.csv"


// Get the mean voting data
function aggregateData() {
  NS.dataNested = d3.nest()
    // nest by justice
    .key(function(d) {return d.justiceName})
    // nest by term
    .key(function(d) {return d.term; } )

    // roll up mean votes, n, and swing vote status
    .rollup(function(v) {
      return {
        mean: d3.mean(v, function(d) {
                      // ignore cases with no direction
                      if(d.direction >= 1) {
                        return d.direction - 1; // change range from 1-2 to 0-1
                      }
              }),
        n: v.length,
        swing: v[0].median
      };
    })
    .entries(NS.dataset);
}


// Get the swing vote data
// function getSwingVote() {}

function initialize() {

  // Load SCDB data, store in NS.dataset
  d3.csv(NS.datapath, function(data) {
    NS.dataset = data;
    
    // Load chief justice timeline data, store in NS.chiefJustices
    d3.csv(NS.datapathCJ, function(data2) {
      NS.chiefJustices = data2;

      // Call main
      main();
    });
  });
}

/* Define the following global variables (NS. ...)
    width, height, x, y, z, xAxis, line, focus */
function setupFocus() {
  // Set the width and height of the focus view
  NS.width = +NS.svg.attr("width") - NS.margin.left - NS.margin.right;
  NS.height = +NS.svg.attr("height") - NS.margin.top - NS.margin.bottom;

  // define scales for the focus view
  NS.x = d3.scaleLinear().range([0, NS.width])
  NS.y = d3.scaleLinear().range([NS.height, 0])
  NS.z = d3.scaleOrdinal(d3.schemeCategory20)

  // create x axis
  NS.xAxis = d3.axisBottom(NS.x)
             .tickFormat(function(d) {
               return d;
             });

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

}

/* Define the following global variables (NS. ...)
    height2, x2, y2, xAxis2, brush, context */
function setupContext() {
  // Set the height of the context view
  NS.height2 = +NS.svg.attr("height") - NS.margin2.top - NS.margin2.bottom;

  // define scales for the context view
  NS.x2 = d3.scaleLinear().range([0, NS.width])
  NS.y2 = d3.scaleLinear().range([NS.height2, 0])

  // create x axis
  NS.xAxis2 = d3.axisBottom(NS.x2)
             .tickFormat(function(d) {
               return d;
             });

  // NOTE: I can make it snap! https://github.com/d3/d3-brush
  // Add the brush
  NS.brush = d3.brushX()
    .extent([[0,0], [NS.width, NS.height2]])
    .on("brush end", brushed)

  // Store the context - the timeline
  NS.context = NS.svg.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + NS.margin2.left + "," + NS.margin2.top + ")");
}

function createGraph() {

  // Select the SVG
  NS.svg = d3.select("svg");

  // Set the margins for the focus and context views
  NS.margin = {top: 20,   right: 80, bottom: 110, left: 40},
  NS.margin2 = {top: 430, right: 80, bottom: 30,  left: 40};

  setupFocus();

  setupContext();

  // Set domains
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
      .attr("class", "justice")
      .attr("id", function(d) { return d.key; });

  // Add lines for each justice
  NS.justice.append("path")
    .attr("class", "justice--line")
    .attr("d", function(d) { return NS.line(d.values); })
    .style("stroke", function(d) {
      return fade(NS.z(d.key), d.key);
    })
    .style("stroke-width", 2)
    .attr("clip-path", "url(#clip)");

  // Add labels for each justice
  NS.justice.append("text")
      // get the last piece of data in the timeline
      .datum(function(d) { return {justice: d.key, value: d.values[d.values.length - 1]}; })
      .attr("transform", function(d) { 
        return "translate(" + NS.x(d.value.key) + "," + NS.y(d.value.value.mean) + ")";
      })
      .attr("class", "justice--label-text")
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

  NS.timeline = NS.context.selectAll(".timeline-entry")
    .data(NS.chiefJustices)
    .enter().append("g")
    .attr("class", "timeline-entry")

  NS.timeline.append("rect")
    .attr("class", "timeline-entry-rect")
    //set x to the start of their tenure
    .attr("x", function(d) {
      return NS.x2(+d.start);
    })
    // set the width to the length of their tenure
    .attr("width", function(d) {
      return NS.x2(+d.end) - NS.x2(+d.start);
    })
    // set the color consistant with the line graph
    .attr("fill", function(d) {
      return NS.z(d.alt);
    })
    .attr("y", 0)
    .attr("height", NS.height2);

  NS.timeline.append("text")
    .attr("class", "timeline-entry-label")
    .style("fill", "#FFF")
    .style("font", "10px sans-serif")
    .attr("text-anchor", "middle")
    .attr("x", function(d) {
      // center text in the timeline
      return NS.x2(+d.start) + (NS.x2(+d.end) - NS.x2(+d.start)) / 2;
    })
    .attr("y", NS.height2/2 + 5)
    .text(function(d) {return d.chief; })

  NS.context.append("g")
    .attr("class", "brush")
    .call(NS.brush)
    .call(NS.brush.move, NS.x.range())


  // Create a box to clip paths so that lines don't go out of bounds
  NS.svg.append("defs").append("clipPath")
      .attr("id", "clip")
    .append("rect")
      .attr("width", NS.width)
      .attr("height", NS.height);

}

function fade (c, j) {
    var shownJustices = ["JPStevens", "DHSouter", "SDOConnor", "WHRehnquist", "HHBurton"];
    if(shownJustices.includes(j)) {
      return c;
    } else {
      // fade it
      var color = d3.color(c)
      color.opacity = 0.1;
      return color.toString();
    }
}

// Code adapted from d3.extent in order to return multiple consecutive ranges
function multipleConsecutiveRanges(values, valueof) {

  var ranges = []

  var n = values.length,
  i = -1,
  value,
  min,
  max;

  while(++i < n) { // find the first comparable value
    if((value = valueof(values[i], i, values)) != null && value >= value) {
      min = max = value;
    }
    while ( (++i < n) ) {
    // compare the remaining values till the end is reached or a number is not consecutive
      if((value = valueof(values[i], i, values)) != null) {
        if(min < value) min = value;
        if(max < value) max = value;
      }
    }

    if(min != null) {
      console.log(ranges);
      ranges.push([min, max]);
    }
  }
}

function setupSwingVotes() {

  // Mark years where a justice was the swing vote with dots on graph
  NS.justice.append("g")
    .attr("class", "justice--swing")
    .attr("id", function(d) {
      return this.parentNode.key;
    })

  NS.justice.select(".justice--swing")
    .selectAll(".justice--swing-circle")
    .data(function(d, i) {
      return NS.dataNested[i].values;
    })
    .enter()
    // filter only swing vote years, only for shown justices
    .filter(function(d) { return d.value.swing == 1; })
    .append("circle")
    .attr("class", "justice--swing-circle")
    .attr("visibility", "visible")
    .attr("r", "4")

    .attr("fill", function(d) {
      var id = this.parentNode.parentNode.id;
      return fade("black", id);
    })
    .attr("stroke-width", "2")
    .attr("stroke", function(d) {
      var id = this.parentNode.parentNode.id;
      return fade(NS.z(id), id);
    })
    .attr("cx", function(d, i) {
      return NS.x(d.key)
    })
    .attr("cy", function(d) {
      return NS.y(d.value.mean)
    })
    // Hide by default
    .attr("visibility", "hidden");
}

function toggleSwingVotes() {
  var circles = NS.justice.select(".justice--swing")
    .selectAll(".justice--swing-circle");
  
  if(circles.attr("visibility") == "visible")
    circles.attr("visibility", "hidden");
  else
    circles.attr("visibility", "visible");
}

function eventListeners() {
  console.log("listening...");
  NS.focus.selectAll(".justice")
    .on("mouseover", function () {
      //if(d3.select(this).attr("class") == "justice--swing-circle")
        lineMouseOver(this);
    })
}

function lineMouseOver(justice) {
  //console.log(justice);
}


function updateJustices() {
  // update axis
  NS.focus.select(".axis--x").call(NS.xAxis);

  var justice = NS.focus.selectAll(".justice");
  
  // update paths
  justice.select(".justice--line").attr("d", function(d) {
    return NS.line(d.values);
  })

  // update labels
  justice.select(".justice--label-text")
    .datum(function(d) {
      // grab the maximum and minimum year currently on the domain
      var end = Math.floor(NS.x.domain()[1])
      var start = Math.ceil(NS.x.domain()[0])
      return {
        // name of the justice
        justice: d.key,
        // the end values for the justice
        value: d.values[d.values.length - 1],
        // true if the line is visible on the graph
        ongraph: d.values.some(function(v) {
          return (v.key <= end && v.key >= start);
        })
      };
    })
    .attr("transform", function(d) { 
      var x = NS.x(d.value.key);
      if(d.ongraph) {
        if(x > NS.width) {
          x = NS.width;
        }
      } else {
        x = -200;
      }
      return "translate(" + x + "," + NS.y(d.value.value.mean) + ")";
    });

  // update swing votes, if necessary
  // if...
  updateSwingVotes(justice);
}

function updateSwingVotes(justice) {
  justice.selectAll("circle")
    .attr("cx", function(d, i) {
      return NS.x(d.key)
    })
    .attr("cy", function(d) {
      return NS.y(d.value.mean)
    });
}
function justiceMenu() {
  var div = d3.select("#justice-menu");
  var justiceMenu = div.append("svg")
    .attr("height", "500")
    .attr("width", function() {
      var w = div.style("width");// get the width of the div from the CSS styling
      return +w.substring(0, w.length - 2) // remove the "px"
    });


  var menuSettings = {
    margin: {top: 2, bottom: 2, left: 5},
    fontSize: 10,
    lineSpacing: 18,
    squareSize: 10,
    xSpacing: 4,
  };


  var jmo = justiceMenu.selectAll(".justice-menu-option") // Justice Menu Option
    .data(NS.dataNested)
    .enter().append("g")
    .attr("class", "justice-menu-option")

  jmo.append("rect")
    .attr("width", menuSettings.squareSize)
    .attr("height", menuSettings.squareSize)
    .attr("fill", function(d) {
      return NS.z(d.key)
    })
    .attr("stroke", "black")
    .attr("stroke-width", "1px")
    .attr("y", function(d, i) { return i * menuSettings.lineSpacing; });


  jmo.append("text")
    .text(function(d) { return d.key; })
    .attr("x", 20)
    .style("font", "10px sans-serif")
    .attr("y", function(d, i) { return i * menuSettings.lineSpacing })

}

function brushed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
  var s = d3.event.selection || NS.x2.range();
  NS.x.domain(s.map(NS.x2.invert, NS.x2));
  updateJustices();
}

function main() {
  aggregateData();
  createGraph();
  eventListeners();
  setupSwingVotes();
  justiceMenu();
}


initialize();

