/* Scatterplot prototype
 * Andrew Phillips & Jake Rourke
 * Nov 13, 2017 */

// Code adapted from my Lab 4 scatterplot


var NS = {}; // create namespace

NS.datapath = "../../Data/SCDB_2017_01_justiceCentered_LegalProvision.csv"
//NS.datapath = "../../Data/SCDB_small.csv"

NS.margin = { top: 50, right: 0, bottom: 100, left: 100 },

NS.width = 960 - NS.margin.left - NS.margin.right,
NS.height = 2000 - NS.margin.top - NS.margin.bottom,

NS.gridSize = Math.floor(NS.width / 14),
NS.gridHeight = Math.floor(NS.width / 40),

NS.legendElementWidth = NS.gridSize*2,

NS.buckets = 9,

NS.colors = ['#dc143c','#c70a4e','#b2025f','#9b0070','#800080','#7a368d',
            '#70539a','#616ba7','#4682b4']
// https://gka.github.io/palettes/#colors=crimson,purple,steelblue|steps=9|bez=0|coL=0

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
  "Private Action"         // 14
]


//////////////////////////////////////////////////////////////////////
// functions


function aggregateData() {
  NS.dataByJustice = d3.nest()

    .key(function(d) {return d.justiceName})

    .rollup(function(v) {
        // direction for each issue area (14 total)
        directions = [];
        for(var i = 1; i <= 14; i++) {
          var dir = d3.mean(v, function(d) {
            if(i == d.issueArea) { return d.direction; }
          });
          directions[i - 1] = d3.format(".2f")(dir);
        }
        return directions;
      })
    .entries(NS.dataset);


  // make a list of the justices
  NS.justices = [];

  // make a new dataset in the form:
  //  justiceName, issueArea, direction
  NS.dataGood = [];
  NS.dataByJustice.forEach(function (d, i) {
    // add justice to the list of justices
    NS.justices[i] = d.key;
    // do stuff
    NS.issueAreas.forEach(function (v, j) {
      line = {
        justiceName: i,
        issueArea: j,
        direction: d.value[j]
      }
      NS.dataGood.push(line);
    })
  })

  splitData = []

  NS.dataGood.forEach(function (d) {
    console.log(d.justiceName)

  })


}


function main () {
  console.log("main function");

  // aggregate data
  aggregateData();

  // make SVG
  svg = d3.select("body").append("svg")
          .attr("width", NS.width + NS.margin.left + NS.margin.right)
          .attr("height", NS.height + NS.margin.top + NS.margin.bottom)
          .append("g")
          .attr("transform", "translate(" + NS.margin.left + "," + NS.margin.top + ")");

  heatmap(svg)
}

function heatmap(svg) {
  console.log("here");
  colorScale = d3.scaleQuantile()
    .domain([1, 2])
    .range(NS.colors);

  cards = svg.selectAll(".issueArea")
      .data(NS.dataGood)

  justiceLabels = svg.selectAll(".justiceLabel")
    .data(NS.justices)
    .enter().append("text")
      .text(function (d) { return d; })
      .attr("x", 0)
      .attr("y", (d, i) => i * NS.gridHeight)
      .style("text-anchor", "end")
      .attr("transform", "translate(-6," + NS.gridHeight / 1.5 + ")")
      .attr("class", (d, i) => ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"));

  issueLabels = svg.selectAll(".issueLabel")
    .data(d3.keys(NS.issueAreas))
    .enter().append("text")
      .text((d) => +d + 1)
      .attr("x", (d, i) => i * NS.gridSize)
      .attr("y", 0)
      .style("text-anchor", "middle")
      .attr("transform", "translate(" + NS.gridSize / 2 + ", -6)")
      .attr("class", (d, i) => ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"));


  cards.append("title");

  function filterColors(dir) {
    if(dir > 0)
      return colorScale(dir);
    else
      return "#FFFFFF";
  }

  cards.enter().append("rect")
      .attr("x", function(d) {
        return d.issueArea * NS.gridSize;
      })
      .attr("y", function(d) {
        return d.justiceName * NS.gridHeight;
      })
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("class", "issueArea bordered")
      .attr("width", NS.gridSize)
      .attr("height", NS.gridHeight)
      .style("fill", function(d) {
        return filterColors(d.direction);
      });

      legend = svg.selectAll(".legend")
          .data([0].concat(colorScale.quantiles()), (d) => d);

      legend_g = legend.enter().append("g")
          .attr("class", "legend");

      legend_g.append("rect")
        .attr("x", (d, i) => NS.legendElementWidth * i)
        .attr("y", NS.height)
        .attr("width", NS.legendElementWidth)
        .attr("height", NS.gridHeight / 2)
        .style("fill", (d, i) => NS.colors[i]);

      legend_g.append("text")
        .attr("class", "mono")
        .text((d) => "≥ " + Math.round(d))
        .attr("x", (d, i) => NS.legendElementWidth * i)
        .attr("y", NS.height + NS.gridHeight);

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
