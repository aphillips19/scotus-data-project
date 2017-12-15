var NS = {}; // create namespace

NS.datapath = "../Data/SCDB_M_caseCentered.csv"

NS.width = 1100;      // of SVG
NS.height = 400;     // of SVG
NS.padding = 81;

///////////////////////////////////////////////////////////////////////////////

function aggregateData() {

  // Nest the data by year, counting the number of cases in every issue area
  // in each year
  
  NS.dataByYear = d3.nest()
    .key(function(d) { return +d.term; })
    .rollup(function(v) {
      var temp = {
        c: 0,
        l: 0,
        u: 0
      };
      // iterate through every case, incrementing the proper decision direction
      for(var i = 0; i < v.length; i++) {
        d = v[i];
        direction = "";
        if(+d.decisionDirection == 1)       direction = "c";
        else if(+d.decisionDirection == 2)  direction = "l";
        else                                direction = "u";
        temp[direction]++;
      }
      return temp;
    })
    .entries(NS.dataset);
}

// create the SVG context and return it
function makeSVG () {
  
  //Create SVG element
  NS.svg = d3.select(".glance")
        .append("svg")
        .attr("width", NS.width)
        .attr("height", NS.height);
}

function main () {
  console.log("main function");

  // aggregate data
  aggregateData();

  // make the SVG
  makeSVG(); // stores in NS.svg
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
