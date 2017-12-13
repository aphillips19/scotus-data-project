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

function countSwingVotes(v) {
  var n = v.length;
  var sum = 0;

  for(var i = 0; i < n; i++) {
    if( v[i].median == 1
        && v[i].majVotes == 5
        && v[i].majority == 1      )
      sum++;
  }
  return sum;
}

function aggregateData() {
  console.log("Performing data aggregation...")
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
        swing: v[0].median,

        // number of cases in that year that were 5-4 where he/she was in
        // the majority - in other words, when the swing vote mattered.
        swingImportance: countSwingVotes(v)
      };
    })
    .entries(NS.dataset);

  // Make the list of which justices will be shown; by default, show none.
  NS.justiceList = {};
  NS.dataNested.forEach(function(justice) {
    NS.justiceList[justice.key] = false;

  // remove the "loading data" SVG text
  NS.svg.select("text").remove();
  })

/*
  // add groupings of justices that can all be selected at once
  NS.justiceGroups = {
    1: {
      label: "Group One",
      description: "All justices who have ever been the swing vote",
      justices: NS.dataNested.forEach(function(justice) {
        justice.forEach(function(year)) function
      })

      }  
  }
  */
/*
  NS.justiceList = NS.dataNested.map(function(d) {
    console.log(1);
    return {key: d.key, value: false};
  });
  */
}


// Get the swing vote data
// function getSwingVote() {}

function initialize() {
  // change SVG to reflect loading data
  NS.svg = d3.select("svg"); // select the SVG (will be often used later on)
  NS.svg.append("text").text("Loading data...")
    .attr("x", 400)
    .attr("y", 200);

  console.log("Loading data...")
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
             .tickFormat(d3.format(".0f"));

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
             .tickFormat(d3.format(".0f"));

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
  console.log("Creating the graph...")


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
      return fade(d.key);
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
        return fade(d.justice);
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

  // add the brush to the SVG
  NS.context.append("g")
    .attr("class", "brush")
    .call(NS.brush)
    .call(NS.brush.move, NS.x.range())
  // round the edges of the brush
  NS.context.select(".selection")
    .attr("rx", 7)
    .attr("ry", 7)

  // Create a box to clip paths so that lines don't go out of bounds
  NS.svg.append("defs").append("clipPath")
      .attr("id", "clip")
    .append("rect")
      .attr("width", NS.width)
      .attr("height", NS.height);

}


function fade (j) {
    if(NS.justiceList[j]) {
      // return color
      return NS.z(j)
    } else {
      // return faded grey
      return "rgba(0, 0, 0, .025)";
    }
}

function setupSwingVotes() {
  // scale for the radius
  NS.r=d3.scaleLinear().domain([0, 10]).range([2, 6])
  
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
    .attr("clip-path", "url(#clip)")
    .attr("visibility", "visible")
    .attr("r", function(d) {return NS.r(d.value.swingImportance); })
    .attr("fill", "white")
    .attr("stroke-width", "2")
    .attr("stroke", function(d) {
      var id = this.parentNode.parentNode.id;
      return fade(id);
    })
    .attr("cx", function(d, i) {
      return NS.x(d.key)
    })
    .attr("cy", function(d) {
      return NS.y(d.value.mean)
    })
    // Hide by default
    .attr("visibility", "hidden")

    // add data so it can be retrieved by other functions
    .datum(function(d) {return d; });

    NS.showSwingVotes = false;
}

// toggle all swing votes
function toggleSwingVotes() {
  updateSwingVoteColor();
  if(NS.showSwingVotes) { 
    NS.showSwingVotes = false;
    var circles = NS.justice.selectAll(".justice--swing-circle")
      .attr("visibility", "hidden")
  } else {
    NS.showSwingVotes = true;
    for(justice in NS.justiceList) {
      if(NS.justiceList[justice]) {
        setJusticeSwingVotes(justice, "visible");
      }
    }
  }
}

// toggle one justice's swing vote
function setJusticeSwingVotes(name, value) {
  var circles = NS.focus.select("#" + name)
    .selectAll(".justice--swing-circle").attr("visibility", value);
}


function eventListeners() {
  NS.hoveringOver = {};
  console.log("Listening...");

  d3.selectAll(".justice--swing-circle")
    .on("mouseover", function () {
      pointMouseOver(this);
    })
    .on("mouseout", function() {
      pointMouseOut(this);
    })
    .on("mousemove", mousemove)
}

function hideTooltip() {
  d3.select(".tooltip")
    .style("display", "none")
}

function showTooltip() {
  d3.select(".tooltip")
    .style("display", "block")
}

function pointMouseOut(point) {
  hideTooltip();
}

function pointMouseOver(point) {
  showTooltip();
  updateTooltips(point)
}

function updateTooltips(point) {
  var pointSel = d3.select(point);
  // change the position of the tooltip to be just above the point; the
  // "magic numbers" ensure it is centered and above the point
  var x = +pointSel.attr("cx") + 55;
  var y = +pointSel.attr("cy") + NS.height/2 - pointSel.attr("r") - 20;
  d3.select(".tooltip")
    .style("display", "block")
    .style("left", x + "px")   
    .style("top", y + "px")


  // grab information about the point (which justice it corresponds to)
  // change information inside the tooltip
  var d = pointSel.datum()
  d.percent = d3.format(".1f")(d.value.swingImportance / d.value.n)
  var content = ("In " + d.key + ", " + d.value.swingImportance + " out of "
                + d.value.n + " (" + d.percent + "%) votes were in 5-4 decisions");
  document.getElementById("tooltip-text")
    .innerHTML = content;



}


/* // FOR LINES:
function updateTooltip(pos, justice) {
  var data = d3.select(justice).data()[0].values,
      bisectDate = d3.bisector(function(d) { return +d.key }).left;
  var x0 = NS.x.invert(pos[0]),  // get the year of the mouse pointer's location
      i = bisectDate(data, x0)    // get the index of this year, rounded down
      d0 = data[i - 1],
      d1 = data[i],
      d = 0;
    if(typeof d1 == "undefined") d = d0; else if(typeof(d0) == "undefined") d = d1;
    else
      d = x0 - (+d0.year) > (+d1.year) - x0 ? d1 : d0;  // determine which year it is closest to

  d3.select(".tooltip")
    .style("display", "block")
    .style("left", (NS.x(d.key)) + 10 + "px")   
    .style("top", (d3.event.pageY - 28 - 50) + "px")
    .html(function() {
      var number = "n: " + d.value.n;
      var mean = "value: " + d.value.mean;
      var swing = "5-4 decisions: " + d.value.swingImportance;
      var res = number + "<br>" + mean;
      if(NS.showSwingVotes && d.value.swing == 1 )
        res += "<br>" + d.value.swingImportance;
      return res;
    });

}
*/

function mousemove() {
  NS.mousePosition = d3.mouse(this);
}



function updateJusticePosition() {
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

  updateSwingVotePosition();
}

function updateSwingVotePosition() {
  NS.justice.selectAll("circle")
    .attr("cx", function(d, i) {
      return NS.x(d.key)
    })
    .attr("cy", function(d) {
      return NS.y(d.value.mean)
    });
}

function justiceMenu() {
  NS.menuSettings = {
    height: 680,
    width: function() {
      var w = div.style("width");// get the width of the div from the CSS styling
      return +w.substring(0, w.length - 2) // remove the "px"
    },
    padding: {top: 4, bottom: 4, left: 5},
    fontSize: 10,
    squareSize: 10,
    xSpacing: 14,
  };


  NS.menuSettings.yOffset = NS.menuSettings.padding.top + NS.menuSettings.padding.bottom + NS.menuSettings.fontSize;

  var div = d3.select("#justice-menu");
  var justiceMenu = div.append("svg")
    .attr("height", NS.menuSettings.height)
    .attr("width", NS.menuSettings.width);

  var jmo = justiceMenu.selectAll(".justice-menu-option") // Justice Menu Option
    .data(NS.dataNested)
    .enter().append("g")
    .attr("class", "justice-menu-option")
    .attr("id", function(d) {return "jmo-" + d.key});

  // background for each entry
  jmo.append("rect")
    .attr("class", "jmo-background")
    .attr("width", NS.menuSettings.width)
    .attr("height", NS.menuSettings.yOffset)
    .attr("y", function(d, i) { return (i) * NS.menuSettings.yOffset})
    // white by default
    .attr("fill", "white");

  jmo.append("rect") // legend square
    .attr("class", "jmo-square")
    .attr("width", NS.menuSettings.squareSize)
    .attr("height", NS.menuSettings.squareSize)
    .attr("fill", "rgba(0, 0, 0, .025")
    .attr("stroke", "black")
    .attr("stroke-width", "1px")
    .attr("y", function(d, i) { return i * NS.menuSettings.yOffset + NS.menuSettings.padding.top})
    .attr("x", NS.menuSettings.padding.left);


  jmo.append("text") // label text
    .attr("class", "jmo-text")
    .text(function(d) {
      var start = d.values[0].key;
      var end = d.values[d.values.length - 1].key;
      return d.key + " [" + start + " - " + end + "]";
    })
    .attr("x", NS.menuSettings.padding.left + NS.menuSettings.xSpacing)
    .style("font", "10px sans-serif")
    .attr("y", function(d, i) { return i * NS.menuSettings.yOffset + NS.menuSettings.fontSize + NS.menuSettings.padding.top - 1})


  // update colors at default values
  updateJusticeColor();

  // listen for changes
  jmo.on("click", function(d) {
    var j = d3.select(this);
    updateMenu(j, d.key, "toggle");
  });

}


function updateMenu(j, name, type) {
  var unsel = {
    selected: false,
    bg: "white",
    color: function(d) {return "rgba(0, 0, 0, 0.025)"; }
  };
  var sel = {
    selected: true,
    bg: "lightgrey",
    color: function(d) {
      return NS.z(d.key);
    }
  };

  var x = {};

  if(type == "toggle") {
    if(NS.justiceList[name]) {
      x = unsel;
    } else {
      x = sel;
    }
  } else if(type == "select") {
    x = sel;
  } else {
    x = unsel;
  }

  NS.justiceList[name] = x.selected;
  j.select(".jmo-background").attr("fill", x.bg);
  j.select(".jmo-square").attr("fill", function(d) {return x.color(d)});


  // move the justice object to the front
  NS.focus.select("#" + name).moveToFront();

  // update colors of justices
  updateJusticeColor();

  // ensure swing votes are visible if necessary
  if(NS.showSwingVotes && x.selected) {
    updateSwingVoteColor()
    setJusticeSwingVotes(name, "visible");
  } else {  
    setJusticeSwingVotes(name, "hidden");
  }
}


function updateJusticeColor() {

  // change the color of the line and label
  NS.justice.select(".justice--line")
    .style("stroke", function(d) {
      return fade(d.key);
  });
  NS.justice.select(".justice--label-text")
    .style("fill", function(d) {
      return fade(d.key);
  });

  // remove and re-add the justice group, in order to bring it to the front
  // of the svg
  NS.justice.sort()
}

function updateSwingVoteColor() {
  var circles = NS.justice.selectAll("circle");
  circles.attr("fill", "white")
  .attr("stroke", function(d) {
      var id = this.parentNode.parentNode.id;
      return fade(id);
    })
}

function clearAllJustices() {
  for (name in NS.justiceList) {
    if(NS.justiceList[name]) {
      var j = d3.select("#jmo-" + name);
      updateMenu(j, name, "deselect");
    }
  }
}

function showAllJustices() {
  for (name in NS.justiceList) {
    var j = d3.select("#jmo-" + name);
    updateMenu(j, name, "select");
  }
}

function brushed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
  var s = d3.event.selection || NS.x2.range();
  NS.x.domain(s.map(NS.x2.invert, NS.x2));
  updateJusticePosition();
}

/* mouseover adapted from https://bl.ocks.org/alandunning/cfb7dcd7951826b9eacd54f0647f48d3 */



function main() {
  aggregateData();
  createGraph();
  setupSwingVotes();
  justiceMenu();
  eventListeners();
}

/* Run the code */

// https://github.com/wbkd/d3-extended
d3.selection.prototype.moveToFront = function() { 
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

initialize();

