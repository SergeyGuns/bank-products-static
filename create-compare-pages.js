/**
 * Скрипт для создания дополнительных страниц сравнения
 */

const fs = require('fs').promises;
const path = require('path');

async function createAdditionalComparisonPages() {
  console.log('🔄 Создание дополнительных страниц сравнения...\\n');
  
  // 1. Считываем все JSON файлы с продуктами
  const products = await readAllProductFiles();
  
  // 2. Группируем продукты по типам
  const groupedProducts = groupProductsByType(products);
  
  // 3. Определяем типы продуктов, для которых нужно создать страницы сравнения
  const typesForComparison = Object.entries(groupedProducts)
    .filter(([type, typeProducts]) => typeProducts.length > 1)
    .map(([type, typeProducts]) => ({ type, count: typeProducts.length }));
  
  console.log(`Найдено ${typesForComparison.length} типов продуктов для сравнения:`);
  typesForComparison.forEach(t => console.log(`  - ${t.type} (${t.count} продуктов)`));
  
  // 4. Создаем страницы сравнения для типов, у которых еще нет страниц
  const existingComparePages = await findExistingComparePages();
  const existingTypes = existingComparePages.map(page => page.replace('.html', ''));
  
  console.log(`\\nСуществующие страницы сравнения: ${existingTypes.join(', ')}`);
  
  const newComparisonPages = [];
  
  for (const { type, count } of typesForComparison) {
    if (!existingTypes.includes(type)) {
      console.log(`\\nСоздание страницы сравнения для: ${type} (${count} продуктов)`);
      
      const productsOfType = groupedProducts[type];
      const comparisonPage = generateComparisonPage(type, productsOfType);
      
      const filePath = path.join('./src/templates', `compare-${type}.html`);
      await fs.writeFile(filePath, comparisonPage, 'utf8');
      console.log(`  ✅ Создана страница: ${filePath}`);
      
      newComparisonPages.push({ type, filePath });
    }
  }
  
  // 5. Обновляем основной шаблон сравнения, чтобы включить новые типы
  await updateMainComparePage(existingTypes, newComparisonPages.map(p => p.type));
  
  console.log(`\\n🎉 Создано ${newComparisonPages.length} новых страниц сравнения`);
  
  return newComparisonPages;
}

async function readAllProductFiles() {
  const products = [];
  
  async function walkDir(dir) {
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        await walkDir(fullPath);
      } else if (item.endsWith('.json') && !['categories.json', 'banks.json', 'products.json'].includes(item)) {
        try {
          const content = await fs.readFile(fullPath, 'utf8');
          const data = JSON.parse(content);
          
          if (Array.isArray(data)) {
            products.push(...data);
          } else if (typeof data === 'object' && data !== null) {
            products.push(data);
          }
        } catch (error) {
          console.warn(`⚠️ Ошибка при чтении файла ${fullPath}: ${error.message}`);
        }
      }
    }
  }
  
  await walkDir('./src/data/pdfs');
  return products;
}

function groupProductsByType(products) {
  const grouped = {};
  
  for (const product of products) {
    const type = product.type || 'unknown';
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(product);
  }
  
  return grouped;
}

async function findExistingComparePages() {
  try {
    const compareDir = './src/templates';
    const items = await fs.readdir(compareDir);
    return items
      .filter(item => item.startsWith('compare-') && item.endsWith('.html'))
      .map(item => item.replace('compare-', '').replace('.html', ''));
  } catch (error) {
    console.warn('Директория templates не найдена или пуста');
    return [];
  }
}

function generateComparisonPage(type, products) {
  // Определяем название категории для заголовка
  const typeNames = {
    'credit-cards': 'Кредитные карты',
    'debit-cards': 'Дебетовые карты',
    'mortgage': 'Ипотека',
    'consumer-loans': 'Потребительские кредиты',
    'auto-loans': 'Автокредиты',
    'deposits': 'Вклады',
    'savings': 'Сберегательные счета',
    'investments': 'Инвестиционные продукты',
    'insurance': 'Страховые продукты',
    'business-loans': 'Бизнес-кредиты',
    'credits': 'Кредиты'
  };
  
  const typeName = typeNames[type] || type;
  
  // Определяем общие параметры для сравнения
  const allParams = new Set();
  products.forEach(product => {
    if (product.parameters) {
      if (product.parameters.main) {
        Object.keys(product.parameters.main).forEach(param => allParams.add(param));
      }
      if (product.parameters.fees) {
        Object.keys(product.parameters.fees).forEach(param => allParams.add(param));
      }
      if (product.parameters.requirements) {
        Object.keys(product.parameters.requirements).forEach(param => allParams.add(param));
      }
    }
  });
  
  // Генерируем HTML для сравнения
  let tableRows = '';
  
  // Заголовки столбцов
  let headerRow = '<tr><th>Параметр</th>';
  products.forEach(product => {
    headerRow += `<th>${product.title || 'Неизвестный продукт'}</th>`;
  });
  headerRow += '</tr>';
  
  // Строки параметров
  allParams.forEach(param => {
    tableRows += `<tr><td>${param}</td>`;
    
    products.forEach(product => {
      let value = '—'; // Показываем тире, если параметр отсутствует
      
      if (product.parameters) {
        if (product.parameters.main && product.parameters.main[param]) {
          value = product.parameters.main[param];
        } else if (product.parameters.fees && product.parameters.fees[param]) {
          value = product.parameters.fees[param];
        } else if (product.parameters.requirements && product.parameters.requirements[param]) {
          value = product.parameters.requirements[param];
        }
      }
      
      tableRows += `<td>${value}</td>`;
    });
    
    tableRows += '</tr>';
  });
  
  // Собираем полный шаблон
  return `{{!< layout}}
<h1>Сравнение ${typeName}</h1>

<p>На этой странице вы можете сравнить различные ${typeName.toLowerCase()} от разных банков.</p>

<div class="comparison-table-container">
  <table class="comparison-table">
    ${headerRow}
    ${tableRows}
  </table>
</div>

<style>
.comparison-table-container {
  overflow-x: auto;
  margin: 20px 0;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  font-size: 0.9em;
  font-family: sans-serif;
  min-width: 400px;
  border-radius: 5px 5px 0 0;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
}

.comparison-table thead tr {
  background-color: #1e40af;
  color: #ffffff;
  text-align: left;
}

.comparison-table th,
.comparison-table td {
  padding: 12px 15px;
  text-align: center;
  vertical-align: middle;
}

.comparison-table tbody tr {
  border-bottom: 1px solid #dddddd;
}

.comparison-table tbody tr:nth-of-type(even) {
  background-color: #f3f3f3;
}

.comparison-table tbody tr:last-of-type {
  border-bottom: 2px solid #1e40af;
}

.comparison-table tbody tr.active-row {
  font-weight: bold;
  color: #1e40af;
}
</style>

{{> footer}}
`;
}

async function updateMainComparePage(existingTypes, newTypes) {
  console.log('\\n🔄 Обновление основной страницы сравнения...');
  
  // Создаем список всех типов для главной страницы сравнения
  const allTypes = [...new Set([...existingTypes, ...newTypes])];
  
  // Определяем названия типов
  const typeNames = {
    'credit-cards': 'Кредитные карты',
    'debit-cards': 'Дебетовые карты',
    'mortgage': 'Ипотека',
    'consumer-loans': 'Потребительские кредиты',
    'auto-loans': 'Автокредиты',
    'deposits': 'Вклады',
    'savings': 'Сберегательные счета',
    'investments': 'Инвестиционные продукты',
    'insurance': 'Страховые продукты',
    'business-loans': 'Бизнес-кредиты',
    'credits': 'Кредиты'
  };
  
  let compareLinks = '';
  allTypes.forEach(type => {
    const typeName = typeNames[type] || type;
    compareLinks += `<li><a href="/compare/${type}.html">${typeName}</a></li>\\n`;
  });
  
  // Создаем шаблон главной страницы сравнения
  const mainComparePage = `{{!< layout}}
<h1>Сравнение банковских продуктов</h1>

<p>Выберите категорию продуктов для сравнения:</p>

<ul class="compare-list">
${compareLinks}
</ul>

<style>
.compare-list {
  list-style-type: none;
  padding: 0;
}

.compare-list li {
  margin: 10px 0;
  padding: 10px;
  background-color: #f8fafc;
  border-radius: 5px;
  border-left: 4px solid #1e40af;
}

.compare-list a {
  text-decoration: none;
  color: #1e40af;
  font-weight: 500;
  font-size: 1.1em;
}

.compare-list a:hover {
  text-decoration: underline;
}
</style>

{{> footer}}
`;
  
  const filePath = path.join('./src/templates', 'compare-page.html');
  await fs.writeFile(filePath, mainComparePage, 'utf8');
  console.log(`  ✅ Обновлена главная страница сравнения: ${filePath}`);
}

// Запуск создания дополнительных страниц сравнения
if (require.main === module) {
  createAdditionalComparisonPages().catch(console.error);
}

module.exports = { createAdditionalComparisonPages, readAllProductFiles, groupProductsByType };