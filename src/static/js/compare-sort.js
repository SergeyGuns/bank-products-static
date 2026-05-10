document.addEventListener('DOMContentLoaded', () => {
  const tables = document.querySelectorAll('.comparison-table, .compare-table');
  tables.forEach(table => {
    const headers = table.querySelectorAll('thead th');
    const tbody = table.querySelector('tbody');
    if (!tbody || headers.length === 0) return;

    // Skip first column (parameter name column)
    for (let i = 1; i < headers.length; i++) {
      headers[i].style.cursor = 'pointer';
      headers[i].title = 'Нажмите для сортировки';
      headers[i].addEventListener('click', () => {
        const colIndex = i;
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const isAsc = headers[i].dataset.order !== 'asc';

        headers.forEach(h => delete h.dataset.order);
        headers[i].dataset.order = isAsc ? 'asc' : 'desc';

        rows.sort((a, b) => {
          const aCell = a.cells[colIndex]?.textContent.trim() || '';
          const bCell = b.cells[colIndex]?.textContent.trim() || '';
          const numA = parseFloat(aCell.replace(/[^\d.,]/g, '').replace(',', '.'));
          const numB = parseFloat(bCell.replace(/[^\d.,]/g, '').replace(',', '.'));
          if (!isNaN(numA) && !isNaN(numB) && numA !== 0 && numB !== 0) {
            return isAsc ? numA - numB : numB - numA;
          }
          return isAsc ? aCell.localeCompare(bCell, 'ru') : bCell.localeCompare(aCell, 'ru');
        });

        rows.forEach(row => tbody.appendChild(row));
      });
    }
  });
});
