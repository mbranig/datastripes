// v000: display numeric columns and sort
// v001: add transition
// v002: add null support
// v003: use d3js scales
// v004: stable sort
// v005: column headings
// v006: brushing
// v007: summary charts
// v008: summary chart brushing
// v009: open file

// example upload script: http://syntagmatic.github.io/parallel-coordinates/examples/upload.html

(function (datastripes) {

  var generator     = new datastripes.DataGenerator({
							rows    : datastripes.ROWS,
							columns : datastripes.COLUMNS + 1
						  })
  ,   dataset       = generator.makeRandomCorrelatedDatasetWithNulls()
  ,   columnNames   = generator.makeColumnNames();

  var geometry      = new datastripes.Geometry()
  ,   util          = new datastripes.Util()
  ,   classifier    = new datastripes.ColumnClassifier();
  
  var panes         = new datastripes.Panes(),
      root          = panes.root(),
      highlightPane = panes.highlightPane(root),
      columns       = panes.columns(root),
      overviews     = panes.overviews(root);

  dataset = util.instrumentDataset(dataset)

  var columnValues  = new datastripes.ColumnValues(dataset)
  ,   draw          = new datastripes.Draw(dataset, highlightPane, columns)
  ,   charts        = makeCharts(dataset, columns, overviews)
  ,   brushes       = new datastripes.Brushes(dataset, draw);

  drawColumnHeaders();
  drawOverviews();
  makeOverviewBrushes();
  draw.drawSelection();
  drawLines();
  makeRootGraphic();

  function makeRootGraphic() {
    var y    = d3.scale.linear()
                 .range([datastripes.HEIGHT + datastripes.Y_MIN, datastripes.Y_MIN])
                 .domain([datastripes.HEIGHT, 0])
    ,  brush = brushes.makeDatasetBrush(y, drawOverviews);
    
    root.append("g")
        .attr("opacity", 0)
        .call(brush)
        .selectAll("rect")
        .attr("x", 0)
        .attr("y", datastripes.Y_MIN)
        .attr("width", columns.length * datastripes.COLUMN_WIDTH);
  }

  function makeCharts(dataset, columns, overviews) {
    return _.map(_.range(columns.length), function(i) {
      var values = _.map(dataset, function(item) {return item.data[i];});

      switch (classifier.classify(values)) {
        case "numeric" : return new datastripes.NumericCharts(dataset, columns, overviews, i);
        case "ordinal" : return new datastripes.OrdinalCharts(dataset, columns, overviews, i);
      }
    });
  }

  function drawColumnHeaders() {
    var headers = root.selectAll("text")
                      .data(columnNames, function(d) { return d; });
    headers.enter()
           .append("text")
           .attr("x", function(a, i) { return geometry.columnStart(i); })
           .attr("y", datastripes.Y_HEADER)
           .text( function(d) { return d; })
           .style("cursor", "pointer")
           .on("click", function(d, i) {
              util.sortByColumn(dataset, i);
              drawLines();
              draw.drawSelection();
           });
  };

  function drawLines() {
    _.each(_.range(columns.length), drawColumn);
  };

  function drawColumn(index) {
    charts[index].drawColumn();
  };

  function drawOverviews() {
    _.each(_.range(columns.length), function(i) {drawOverviewBrushes(i);});
  };

  function drawOverviewBrushes(index) {
    var all      = columnValues.all(index)
    ,   selected = columnValues.selected(index);

    drawOverview(index, 0, all,      datastripes.Y_SUMMARY);
    drawOverview(index, 1, selected, datastripes.Y_SELECTION_SUMMARY);
  };

  function drawOverview(index, overviewIndex, histogramValues, y1) {
  	charts[index].drawOverview(overviewIndex, histogramValues, y1);
  };

  function makeOverviewBrushes() {
    _.each(_.range(columns.length), function(i) {makeBothOverviewBrushes(i);});
  };

  function makeBothOverviewBrushes(index) {
    var all      = columnValues.all(index)
    ,   selected = columnValues.selected(index);

    switch (classifier.classify(all)) {
      case "numeric" : 
        brushes.makeTotalOverviewNumericBrush    (columnValues, overviews, index, datastripes.Y_SUMMARY, drawOverviews);
        brushes.makeSelectionOverviewNumericBrush(columnValues, overviews, index, datastripes.Y_SELECTION_SUMMARY, drawOverviews);
        break;
      case "ordinal" : 
        brushes.makeTotalOverviewOrdinalBrush    (columnValues, overviews, index, datastripes.Y_SUMMARY, drawOverviews);
        brushes.makeSelectionOverviewOrdinalBrush(columnValues, overviews, index, datastripes.Y_SELECTION_SUMMARY, drawOverviews);
        break;
    }
  }

}(window.datastripes));