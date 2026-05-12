document.addEventListener('DOMContentLoaded', function() {
  var tables = document.querySelectorAll('.comparison-table, .compare-table');
  tables.forEach(function(table) {
    var rows = table.querySelectorAll('tbody tr');
    if (rows.length === 0) return;

    var bestRow = null;
    var bestRate = Infinity;

    rows.forEach(function(row) {
      var cells = row.querySelectorAll('td');
      for (var i = 0; i < cells.length; i++) {
        var text = cells[i].textContent.trim();
        var match = text.match(/(\d+[.,]?\d*)\s*%/);
        if (match) {
          var rate = parseFloat(match[1].replace(',', '.'));
          if (!isNaN(rate) && rate < bestRate) {
            bestRate = rate;
            bestRow = row;
          }
        }
      }
    });

    if (bestRow) {
      bestRow.classList.add('best-offer');
    }
  });
});
