// Namespace
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
      .attr("class", "justice");

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
    var shownJustices = ["JPStevens", "DHSouter", "SDOConnor", "WHRehnquist", "BRWhite"];
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

function toggleSwingVotes() {

  /* create a new map containing median justice information with the structure:
    // a justice who was a median justice at some point
    0: {
        key: justiceName
        value: [start, end]
      }
    // a justice who was never a median justice
    1: {
        key: justiceName
        value: [0, 0]
    }
  */


  NS.dataSwingVotes = NS.dataNested.map(function(d) {
    
    var values =
    multipleConsecutiveRanges(d.values, function(v) {
      if(v.value.swing == 1) {
        return +v.key;
      }
    });
    /*
    if((typeof daterange[0]) == "undefined") // if never a swing justice,
                                         // replace undefined with 0
      daterange = [0, 0];
*/
    return {
      key: d.key,
      values: values
    };

  });

  /*

  // https://bl.ocks.org/mbostock/4062844

  // For every justice, make a rectangle that is the height of the graph and 
  // the width of their (where applicable) tenure as the median justice. Use
  // the class "clip" and the id "clip-[d.key]", i.e. clip-HLBlack
  // If they never were a medianJJ, just make the rectangle have a width of 0

  NS.svg.select("defs").selectAll("clipPath")
    .data(NS.dataSwingVotes)
    .enter().append("clipPath")
    .attr("id", function(d) {
        return "clip-" + d.key;
    })
    .append("rect")
      //set x to the start of their tenure
      .attr("x", function(d) {
        console.log(d.key + ": " + "[" + d.value[0] + "," + d.value[1] + "]");
        return NS.x(d.value[0]);
      })
      // set the width to the length of their tenure
      .attr("width", function(d) {
        return NS.x(d.value[1]) - NS.x(d.value[0]);
      })
      //.attr("width", NS.width)
      .attr("height", NS.height);

  // Add a second set of lines for each justice
  NS.justice.append("path")
    .attr("class", "justice--line-swing")
    .attr("d", function(d) { return NS.line(d.values); })
    .style("stroke", function(d) {
      return fade(NS.z(d.key), d.key);
    })
    .style("stroke-width", 5)
    .attr("clip-path", function(d) { return "url(#clip-" + d.key + ")"; })

  // Clip each justice's line-swing
  // with their rectangle of the corresponding name.
  
*/

}

function eventListeners() {
  console.log("listening...");
  NS.focus.selectAll("path")
    .on("mouseover", function () {
      if(d3.select(this).attr("class") == "justice--line")
        lineMouseOver(this.parentNode);
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
  toggleSwingVotes();
}


initialize();

