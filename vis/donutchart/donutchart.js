/* At A Glance visualizations/information
 * Andrew Phillips & Jake Rourke
 * Dec 13, 2017 */

// Code adapted from the scatterplot visualization, as well as:
// http://bl.ocks.org/juan-cb/1984c7f2b446fffeedde


var NS = {}; // create namespace

NS.datapath = "../../Data/SCDB_M_caseCentered.csv"

NS.width = 800;      // of SVG
NS.height = 400;     // of SVG
NS.padding = 80;

NS.selectedIssue = {type: "combos", index: 0};
NS.scaleType = "absolute";

// this variable used to make setting up the menus, as well as iterating
// through issue areas, easier, by keeping all possibilities in one place.
NS.issueAreas = [
  "Criminal Procedure",  
  "Civil Rights",        
  "First Amendment",     
  "Due Process",         
  "Privacy",             
  "Attorneys",           
  "Unions",              
  "Economic Activity",   
  "Judicial power",      
  "Federalism",          
  "Interstate Relations",
  "Federal Taxation",    
  "Miscellaneous",       
  "Private Action",      
  "other",               
]

  
//////////////////////////////////////////////////////////////////////
// functions

// get the year from a mm/dd/yyyy date

function aggregateData() {

  // Nest the data by year, counting the number of cases in every issue area
  // in each year
  NS.dataByYear = d3.nest()
    .key(function(d) { return +d.term; })
    .rollup(function(v) {
      // v is an array of all cases in a given year
      
      // set up aggregate information storage for both "real" issue areas and
      // "aggregates"
      var aggregates = [];
      for(var issueArea = 0; issueArea < NS.issueAreas.length; issueArea++) {
        aggregates[issueArea] = 0;
      }
      for(var i = 0; i < v.length; i++) {
        d = v[i]; // shorthand for the current data in the style of d3 functions
        //set the issue area to the issue area in the dataset if the issue area is
        // valid; otherwise, set to the "other" category.
        var issueArea = (d.issueArea != "" && d.issueArea != "NA") ? +d.issueArea - 1 : 14;
        aggregates[issueArea]++;
      }

      return aggregates;
    })
    .entries(NS.dataset);
}

// create the SVG context and return it
function makeSVG () {
  
  //Create SVG element
  NS.svg = d3.select(".donut")
        .append("svg")
        .attr("width", NS.width)
        .attr("height", NS.height);
}

function change(data) {

  /* ------- PIE SLICES -------*/
  var slice = svg.select(".slices").selectAll("path.slice")
        .data(pie(data), function(d){ return d.data.label });

    slice.enter()
        .insert("path")
        .style("fill", function(d) { return color(d.data.label); })
        .attr("class", "slice");

    slice
        .transition().duration(1000)
        .attrTween("d", function(d) {
            this._current = this._current || d;
            var interpolate = d3.interpolate(this._current, d);
            this._current = interpolate(0);
            return function(t) {
                return arc(interpolate(t));
            };
        })
    slice
        .on("mousemove", function(d){
            div.style("left", d3.event.pageX+10+"px");
            div.style("top", d3.event.pageY-25+"px");
            div.style("display", "inline-block");
            div.html((d.data.label)+"<br>"+(d.data.value)+"%");
        });
    slice
        .on("mouseout", function(d){
            div.style("display", "none");
        });

    slice.exit()
        .remove();

    text
        .transition().duration(1000)
        .attrTween("transform", function(d) {
            this._current = this._current || d;
            var interpolate = d3.interpolate(this._current, d);
            this._current = interpolate(0);
            return function(t) {
                var d2 = interpolate(t);
                var pos = outerArc.centroid(d2);
                pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
                return "translate("+ pos +")";
            };
        })
        .styleTween("text-anchor", function(d){
            this._current = this._current || d;
            var interpolate = d3.interpolate(this._current, d);
            this._current = interpolate(0);
            return function(t) {
                var d2 = interpolate(t);
                return midAngle(d2) < Math.PI ? "start":"end";
            };
        })
        .text(function(d) {
            return (d.data.label+": "+d.value+"%");
        });


    text.exit()
        .remove();

    /* ------- SLICE TO TEXT POLYLINES -------*/

    var polyline = svg.select(".lines").selectAll("polyline")
        .data(pie(data), function(d){ return d.data.label });

    polyline.enter()
        .append("polyline");

    polyline.transition().duration(1000)
        .attrTween("points", function(d){
            this._current = this._current || d;
            var interpolate = d3.interpolate(this._current, d);
            this._current = interpolate(0);
            return function(t) {
                var d2 = interpolate(t);
                var pos = outerArc.centroid(d2);
                pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
                return [arc.centroid(d2), outerArc.centroid(d2), pos];
            };
        });

    polyline.exit()
        .remove();
};

function main () {
  console.log("main function");

  // aggregate data
  aggregateData();

  // make the SVG
  makeSVG(); // stores in NS.svg
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

//////////////////////////////////////////////////////////////////////

initialize()
