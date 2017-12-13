/* Scatterplot prototype
 * Andrew Phillips & Jake Rourke
 * Nov 13, 2017 */

// Code adapted from my Lab 4 scatterplot


var NS = {}; // create namespace

//NS.datapath = "../../Data/SCDB_2017_01_justiceCentered_LegalProvision.csv"
//NS.datapath = "../../Data/SCDB_small.csv"
  NS.datapath = "../../Data/SCDB_M_caseCentered.csv"

NS.width = 800;      // of SVG
NS.height = 400;     // of SVG
NS.padding = 80;


//////////////////////////////////////////////////////////////////////
// functions

// get the year from a mm/dd/yyyy date

function aggregateData() {

  NS.dataByYear = d3.nest()
    .key(function(d) return +d.term)
    .rollup(function(d) {
      return {
        d3.sum
      };
    }
/*

  NS.dataPCBY = d3.nest() // PCBY = Per Case By Year

    // multi-level nest, by year then by case
    .key(function(d) {return (d.dateDecision.split("/")[2]); } )
    .key(function(d) {return d.caseId})
    
    // all of the individual entries for each year will have the same decision
    // direction, but rollup seems like the easiest way to move that data
    // to the case- rather than justice- level, even though it is a more
    // powerful tool than necessary.
    .rollup(function(d) {return {
        decisionDirection: d[0].decisionDirection,
        dateDecision: d[0].dateDecision
      }
    })
    .entries(NS.dataset);

    NS.dataPCBY.forEach(function(year) {
      year.c = 0; // conservative
      year.l = 0; // liberal
      year.u = 0; // unspecifiable
      year.totalCases = 0;

      year.values.forEach(function(c) {
        
        year.totalCases++;

        if(c.value.decisionDirection == 1)
          year.c++;
        if(c.value.decisionDirection == 2)
          year.l++;
        else
          year.u++;
        });
     });
*/
  NS.seriesNames = ["c", "l", "u"]

  NS.series = NS.seriesNames.map(function(series) {
    return NS.dataPCBY.map(function(d) {
      return {
        year: +d.key,
        val: d[series]
      };
    });
  });

}


function main () {
  console.log("main function");

  // aggregate data
  aggregateData();

  // make the SVG
  var svg = makeSVG();

  // Define scales
  NS.xScale = d3.scaleLinear()
              .domain([1946, d3.max(NS.dataPCBY, function (d) {
                return +d.key;
              }) ])
              .range([NS.padding, NS.width - NS.padding * 2]);

  NS.yScale = d3.scaleLinear()
              // max is the maximum decisions in either lib/cons/unsp in all
              // the years
              .domain([0, d3.max(NS.dataPCBY, function(d) {
                var options = [d.c, d.l, d.u];
                return d3.max(options, function (d) {return d;});
              }) ])
             .range([NS.height - NS.padding, NS.padding]);

  NS.zScale = d3.scaleOrdinal(["red", "blue", "grey"]);

 
  //Define axes
  NS.xAxis = d3.axisBottom()
            .scale(NS.xScale)

  NS.yAxis = d3.axisLeft()
            .scale(NS.yScale)
            .ticks(5);

  // add HTML elements
  addHTML();

  // make scatterplot
  makeScatterplot(svg);
}


function initialize() {

  // add HTML elements
  //addHTML();

  // Load census data and call main
  d3.csv(NS.datapath, function(d) {
    NS.dataset = d;
    main();
  });
}

function makeTitle(svg) {
    svg.append("text")
    .attr("x", NS.width / 2)
    .attr("y", NS.padding / 2)
    .attr("text-anchor", "middle")
    .attr("class", "title")
    .text("Court Decisions vs. Time");
}


function addHTML() {
  //document.write("<p>redraw data!</p>");
}

function makeScatterplot (svg) {

  console.log("make scatterplot");

  // title
  makeTitle(svg);

  // Add circles
  svg.selectAll(".series")
      .data(NS.series)
    .enter().append("g")
      .attr("class", "series")
      .style("fill", function(d, i) { return NS.zScale(i); })
    .selectAll(".point")
      .data(function(d) { return d; })
    .enter().append("circle")
      .attr("class", "point")
      .attr("r", 4.5)
      .attr("cx", function(d) {
        return NS.xScale(+d.year);
      })
      .attr("cy", function(d) { return NS.yScale(+d.val); });

  
  //Create X axis
  svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + (NS.height - NS.padding) + ")")
    .call(NS.xAxis);
  
  //Create Y axis
  svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + NS.padding + ",0)")
    .call(NS.yAxis);
}

// create the SVG context and return it
function makeSVG () {

  //Create SVG element
  var svg = d3.select("body")
        .append("svg")
        .attr("width", NS.width)
        .attr("height", NS.height);

  return svg
}


//////////////////////////////////////////////////////////////////////

initialize()
