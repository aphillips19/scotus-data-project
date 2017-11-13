/* Scatterplot prototype
 * Andrew Phillips & Jake Rourke
 * Nov 13, 2017 */

// Code adapted from my Lab 4 scatterplot


var NS = {}; // create namespace

NS.datapath = "../../Data/SCDB_2017_01_justiceCentered_LegalProvision.csv"
//NS.datapath = "../../Data/SCDB_small.csv"

NS.width = 800;      // of SVG
NS.height = 400;     // of SVG
NS.padding = 30;


//////////////////////////////////////////////////////////////////////
// functions


function aggregateData() {
  NS.dataPCBY = d3.nest() /

    .key(function(d) {return d.justiceName})

    .rollup(function(d) {return {
        direction: d[0].direction,
        dateDecision: d[0].issueArea
      }
    })
    .entries(NS.dataset);


function main () {
  console.log("main function");

  // aggregate data
  aggregateData();

function initialize() {

  // add HTML elements
  //addHTML();

  // Load census data and call main
  d3.csv(NS.datapath, function(d) {
    NS.dataset = d;
    main();
  });
}


//////////////////////////////////////////////////////////////////////

initialize()
