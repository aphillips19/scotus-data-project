

// Namespace
var NS = {}; // create namespace

	NS.datapath = "../../Data/SCDB_2017_01_justiceCentered_LegalProvision.csv"
//NS.datapath = "../../Data/SCDB_small.csv"


function aggregateData() {

  // Goal: data that looks like
  // YEAR JUSTICE1 JUSTICE2 JUSTICE3 JUSTICE4 ...
  // 1990    1.2      1.4      1.1      1.8   ...
  // if no value, maybe 0?

  NS.dataNested = d3.nest()

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

function initialize() {

  // Load census data and call main
  d3.csv(NS.datapath, function(d) {
    NS.dataset = d;
    main();
  });
}

initialize();