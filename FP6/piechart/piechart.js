var NS = {}; // create namespace

NS.datapath = "../../Data/SCDB_2017_01_justiceCentered_LegalProvision.csv"
//NS.datapath = "../../Data/SCDB_small.csv"

NS.width = 960;
NS.height = 500;
NS.radius = Math.min(NS.width, NS.height) / 2;

NS.color = d3.scaleOrdinal(d3.schemeCategory20);
NS.issueTracker = [];
NS.issueAreas = [
  "Criminal Procedure",    // 1
  "Civil Rights",          // 2
  "First Amendment",       // 3
  "Due Process",           // 4
  "Privacy",               // 5
  "Attorneys",             // 6
  "Unions",                // 7
  "Economic Activity",     // 8
  "Judicial power",        // 9
  "Federalism",            // 10
  "Interstate Relations",  // 11
  "Federal Taxation",      // 12
  "Miscellaneous",         // 13
  "Private Action",        // 14
  "Blank"
  ]

function initialize() {

  d3.csv(NS.datapath, function(d) {
    NS.dataset = d;
    main();
  });
}


function aggregateData() {

  NS.dataByCase = d3.nest() // Nest by case

    .key(function(d) {return d.caseId})
    
    .rollup(function(d) {return {
        issueArea: d[0].issueArea
      }
    })
    .map(NS.dataset);

  // initialize array of issues
  NS.issueAreas.forEach(function(d, i) {
    // object with label and count
    NS.issueTracker[i] = {label: d, count: 0}
  });

  // aggregate data
  NS.dataByCase.each(function(d, i) {
    // increment count for each issue area
    if(d.issueArea == 0) {
      // deal with the occasional blank
      NS.issueTracker[14].count++;
    } else {
      NS.issueTracker[d.issueArea - 1].count++;
    }
  });
}

function main() {
  aggregateData();
  // make  svg
  var svg = d3.select('body')
  .append('svg')
  .attr('width', NS.width)
  .attr('height', NS.height)
  var g = svg.append("g").attr("transform",
      "translate(" + NS.width / 2 + "," + NS.height / 2 + ")");

var pie = d3.pie()
    .sort(null)
    .value(function(d) { return d.count; });

var path = d3.arc()
    .outerRadius(NS.radius - 10)
    .innerRadius(0);

var label = d3.arc()
    .outerRadius(NS.radius - 40)
    .innerRadius(NS.radius - 40);

var arc = g.selectAll(".arc")
  .data(pie(NS.issueTracker))
  .enter().append("g")
    .attr("class", "arc");

arc.append("path")
    .attr("d", path)
    .attr("fill", function(d) { return NS.color(d.data.label); });

arc.append("text")
    .attr("transform", function(d) { return "translate(" + label.centroid(d) + ")"; })
    .attr("dy", "0.5em")
    .text(function(d) { return (d.data.label + ": " + d.data.count); });

}

initialize();