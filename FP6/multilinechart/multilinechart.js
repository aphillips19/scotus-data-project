

// Namespace
var NS = {}; // create namespace

  NS.datapath = "../../Data/SCDB_2017_01_justiceCentered_LegalProvision.csv"
  //NS.datapath = "../../Data/SCDB_small.csv"


function aggregateData() {
  // Transforms data, in NS.newData, so that it is an array of
  // objects that contain the year, and every justice's mean decision, i.e.
  // {year: 1946, Justice1: 1.3, Justice2: 2.1, etc.}

  NS.dataNested = d3.nest()
    // nest by justice
    .key(function(d) {return d.justiceName})
    // nest by year
    .key(function(d) {return (d.dateDecision.split("/")[2]); } )

    // roll up mean votes
    .rollup(function(v) {
      return d3.mean(v, function(d) {
                      return d.direction;
                    })
    })
    .entries(NS.dataset);


}

function initialize() {

  // Load census data and call main
  d3.csv(NS.datapath, function(d) {
    NS.dataset = d;
    main();
  });
}

function main() {
  aggregateData();
}

initialize();