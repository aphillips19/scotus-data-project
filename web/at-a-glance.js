var NS = {}; // create namespace

NS.datapath = "../Data/SCDB_M_caseCentered.csv"

NS.width = 400;      // of SVG
NS.height = 300;     // of SVG
NS.radius = 125;

NS.startYear = 1946;
NS.endYear = 2015;

NS.directions = ["Conservative", "Liberal", "Other"];

///////////////////////////////////////////////////////////////////////////////

function nestData() {

  // Nest the data by year, counting the number of cases in every issue area
  // in each year
  
  NS.dataByYear = d3.nest()
    .key(function(d) { return +d.term; })
    .rollup(function(v) {
      var temp = {
        Conservative: 0,
        Liberal: 0,
        Other: 0
      };
      // iterate through every case, incrementing the proper decision direction
      for(var i = 0; i < v.length; i++) {
        d = v[i];
        direction = "";
        if(+d.decisionDirection == 1)       direction = "Conservative";
        else if(+d.decisionDirection == 2)  direction = "Liberal";
        else                                direction = "Other";
        
        temp[direction]++;
      }
      return temp;
    })
    .object(NS.dataset);
}

// return an array of objects with the aggregate conservative, liberal, and
// unspecifiable decisions in the given range of years (a to b).
// {direction: c, n: 26}
function aggregateByYear(range) {
  var temp = [];
  NS.directions.forEach(function(dir) {
    count = 0;
    range.forEach(function(year) {
      count += NS.dataByYear[year][dir];
    });
    temp.push( {direction: dir, n: count } );
  });
  return temp;
}


// create the SVG context and return it
function makeSVG () {
  
  //Create SVG element
  NS.svg = d3.select("#piechart-container")
        .append("svg")
        .attr("width", NS.width)
        .attr("height", NS.height);
}

function makeLegend() {
  NS.svg.append("g")
    .attr("class", "legendOrdinal")
    .attr("transform", "translate(20,20)");

  NS.legendOrdinal = d3.legendColor()
    .scale(NS.color);

  NS.svg.select(".legendOrdinal")
    .call(NS.legendOrdinal);

}

// create a drop down to select the start and end years
function makeMenu() {
  console.log("making menu");
  startMenu = d3.select("#startDate");
  endMenu = d3.select("#endDate");
  for(var i = NS.startYear; i <= NS.endYear; i++) {
    startMenu.append("option").attr("value", i).text(i);
    endMenu.append("option").attr("value", i).text(i);
  }
  // set the initial menu value
  document.getElementById('startDate').value = NS.startYear
  document.getElementById('endDate').value = NS.endYear

  // update graph when something is chosen
  startMenu.on("change", function() {
    NS.startDate = this.value; // set the global value to the selected option
    updateChart(); // update the chart
  });
  endMenu.on("change", function() {
    NS.endDate = this.value; // set the global value to the selected option
    updateChart(); // update the chart
  });



}

function updateChart() {
  console.log("will update");
}
function makePieChart () {

  // get the data for the pie chart by passing this function an array of all
  // the years in the specified range (inclusive)
  NS.piedata = aggregateByYear(d3.range(NS.startYear,NS.endYear + 1));

  NS.piechart = NS.svg.append("g")
    .attr("transform", "translate(" + (NS.width - NS.radius) + "," + NS.height / 2 + ")")
    .attr("class", "piechart");

  NS.color = d3.scaleOrdinal()
    .domain(NS.directions)
    .range(["#fa8072", "#d3d3d3", "#6495ed"])
  
  NS.pie = d3.pie()
    .sort(null)
    .value(function(d) { return d.n })

  NS.path = d3.arc()
      .outerRadius(NS.radius - 10)
      .innerRadius(0);

  NS.label = d3.arc()
      .outerRadius(NS.radius - 40)
      .innerRadius(NS.radius - 40);

  NS.arc = NS.piechart.selectAll(".arc")
    .data(NS.pie(NS.piedata))
    .enter().append("g")
      .attr("class", "arc");

  NS.arc.append("path")
      .attr("d", NS.path)
      .attr("fill", function(d) { return NS.color(d.data.direction); });

  NS.arc.append("text")
      .attr("transform", function(d) { return "translate(" + NS.label.centroid(d) + ")"; })
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .text(function(d) { return d.data.n; });
}

function main () {
  console.log("main function");

  // aggregate data
  nestData();

  // make the SVG
  makeSVG(); // stores in NS.svg

  // draw pie chart
  makePieChart();

  // make the legend
  makeLegend();

  // make the menu
  makeMenu();
}

function initialize() {

  // Load census data and call main
  d3.csv(NS.datapath, function(d) {
    NS.dataset = d;
    main();
  });
}

//////////////////////////////////////////////////////////////////////

initialize()
