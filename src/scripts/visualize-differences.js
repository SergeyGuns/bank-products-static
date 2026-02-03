/**
 * Скрипт для визуализации различий между банковскими продуктами
 * 
 * Этот скрипт анализирует и визуализирует различия между продуктами
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Функция для вычисления различий между двумя значениями
 */
function calculateDifference(value1, value2) {
  // Проверяем, являются ли значения числами
  const num1 = parseFloat(value1);
  const num2 = parseFloat(value2);
  
  if (!isNaN(num1) && !isNaN(num2)) {
    // Если оба значения числовые, вычисляем разницу
    const difference = num2 - num1;
    const percentageDiff = num1 !== 0 ? ((num2 - num1) / Math.abs(num1)) * 100 : 0;
    
    return {
      type: 'numeric',
      absolute: difference,
      percentage: percentageDiff,
      isBetter: num2 < num1 // Для ставок, комиссий и т.д. меньшее значение лучше
    };
  } else if (value1 === value2) {
    return {
      type: 'equal',
      description: 'Значения совпадают'
    };
  } else {
    return {
      type: 'different',
      description: `Отличается: "${value1}" vs "${value2}"`
    };
  }
}

/**
 * Функция для анализа различий между несколькими продуктами
 */
function analyzeDifferences(products) {
  if (products.length < 2) {
    throw new Error('Для анализа различий необходимо минимум 2 продукта');
  }
  
  const differences = {};
  const allParameters = new Set();
  
  // Собираем все параметры из всех продуктов
  for (const product of products) {
    if (product.parameters) {
      for (const [group, groupParams] of Object.entries(product.parameters)) {
        if (typeof groupParams === 'object' && groupParams !== null) {
          for (const param of Object.keys(groupParams)) {
            allParameters.add(`${group}.${param}`);
          }
        }
      }
    }
  }
  
  // Для каждого параметра вычисляем различия между продуктами
  for (const param of allParameters) {
    const values = products.map(product => {
      const pathParts = param.split('.');
      let value = product;
      
      for (const part of pathParts) {
        if (value && typeof value === 'object') {
          value = value[part];
        } else {
          value = undefined;
          break;
        }
      }
      
      return value !== undefined ? String(value) : '-';
    });
    
    // Вычисляем различия между всеми парами значений
    const paramDifferences = [];
    for (let i = 0; i < products.length; i++) {
      for (let j = i + 1; j < products.length; j++) {
        const diff = calculateDifference(values[i], values[j]);
        paramDifferences.push({
          product1: products[i].title,
          product2: products[j].title,
          value1: values[i],
          value2: values[j],
          difference: diff
        });
      }
    }
    
    differences[param] = {
      parameter: param,
      values: values,
      differences: paramDifferences,
      isSignificant: paramDifferences.some(d => d.difference.type !== 'equal')
    };
  }
  
  return differences;
}

/**
 * Функция для генерации отчета о различиях
 */
function generateDifferencesReport(products, differences) {
  const report = {
    summary: {
      productCount: products.length,
      totalParameters: Object.keys(differences).length,
      significantDifferences: Object.values(differences).filter(d => d.isSignificant).length
    },
    products: products.map(p => ({ id: p.id, title: p.title, bankName: p.bankName })),
    differences: differences
  };
  
  return report;
}

/**
 * Функция для генерации HTML-визуализации различий
 */
function generateDifferencesHTML(report) {
  let html = '<div class="differences-visualization">\n';
  
  // Сводная информация
  html += `  <div class="summary">\n    <h3>Сводка различий</h3>\n`;
  html += `    <p>Сравниваемые продукты: ${report.summary.productCount}</p>\n`;
  html += `    <p>Всего параметров: ${report.summary.totalParameters}</p>\n`;
  html += `    <p>Параметров с различиями: ${report.summary.significantDifferences}</p>\n  </div>\n`;
  
  // Таблица различий
  html += '  <div class="differences-table-container">\n';
  html += '    <table class="differences-table">\n';
  html += '      <thead>\n        <tr>\n          <th>Параметр</th>\n';
  
  for (const product of report.products) {
    html += `          <th>${product.title}<br><small>${product.bankName}</small></th>\n`;
  }
  
  html += '        </tr>\n      </thead>\n';
  html += '      <tbody>\n';
  
  for (const [param, data] of Object.entries(report.differences)) {
    if (!data.isSignificant) continue; // Показываем только значимые различия
    
    html += `        <tr class="significant">\n          <td>${param}</td>\n`;
    
    for (const value of data.values) {
      html += `          <td class="param-value">${value}</td>\n`;
    }
    
    html += '        </tr>\n';
  }
  
  html += '      </tbody>\n    </table>\n  </div>\n';
  
  // Детализация различий
  html += '  <div class="detailed-differences">\n    <h3>Детализация различий</h3>\n';
  
  for (const [param, data] of Object.entries(report.differences)) {
    if (!data.isSignificant) continue;
    
    html += `    <div class="parameter-differences" data-parameter="${param}">\n`;
    html += `      <h4>${param}</h4>\n`;
    
    for (const diff of data.differences) {
      html += `      <div class="difference-item">\n`;
      html += `        <span class="product-names">${diff.product1} ↔ ${diff.product2}</span>: `;
      
      if (diff.difference.type === 'numeric') {
        const direction = diff.difference.isBetter ? 'выгоднее' : 'невыгоднее';
        html += `<span class="numeric-diff">${diff.difference.absolute.toFixed(2)} (${diff.difference.percentage.toFixed(2)}%, ${direction})</span>`;
      } else {
        html += `<span class="text-diff">${diff.difference.description}</span>`;
      }
      
      html += `\n      </div>\n`;
    }
    
    html += '    </div>\n';
  }
  
  html += '  </div>\n';
  
  html += '</div>\n';
  
  return html;
}

/**
 * Функция для генерации визуализации в формате JSON
 */
function generateDifferencesJSON(products) {
  const differences = analyzeDifferences(products);
  const report = generateDifferencesReport(products, differences);
  
  return report;
}

/**
 * Функция для сохранения отчета о различиях
 */
async function saveDifferencesReport(report, reportId = null) {
  if (!reportId) {
    reportId = `differences-report-${Date.now()}`;
  }
  
  const outputPath = path.join(__dirname, `../data/differences-reports/${reportId}.json`);
  
  // Создаем директорию, если она не существует
  const dirPath = path.dirname(outputPath);
  await fs.mkdir(dirPath, { recursive: true });
  
  try {
    await fs.writeFile(outputPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`Отчет о различиях сохранен в ${outputPath}`);
    return reportId;
  } catch (error) {
    console.error('Ошибка при сохранении отчета о различиях:', error.message);
    throw error;
  }
}

/**
 * Основная функция для анализа и визуализации различий
 */
async function analyzeAndVisualizeDifferences(productIds) {
  console.log(`Анализ различий для ${productIds.length} продуктов...`);
  
  if (productIds.length < 2) {
    throw new Error('Для анализа различий необходимо выбрать как минимум 2 продукта');
  }
  
  if (productIds.length > 5) {
    throw new Error('Максимальное количество продуктов для анализа различий - 5');
  }
  
  // Импортируем функции из скрипта сравнения
  const { loadProductsByIds } = require('./product-comparison');
  
  // Загружаем продукты
  const products = await loadProductsByIds(productIds);
  
  if (products.length !== productIds.length) {
    console.warn(`Предупреждение: Загружено только ${products.length} из ${productIds.length} запрошенных продуктов`);
  }
  
  if (products.length < 2) {
    throw new Error('Не удалось загрузить достаточное количество продуктов для анализа различий');
  }
  
  // Анализируем различия
  const differences = analyzeDifferences(products);
  const report = generateDifferencesReport(products, differences);
  
  // Сохраняем отчет
  const reportId = await saveDifferencesReport(report);
  
  console.log(`Отчет о различиях создан: ${reportId}`);
  
  return {
    id: reportId,
    report: report,
    productCount: products.length
  };
}

// Если файл запускается напрямую
if (require.main === module) {
  // Пример использования
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Использование: node visualize-differences.js <product_id_1> <product_id_2> ...');
    console.log('Пример: node visualize-differences.js sberbank-credit-cards-platinum vtb-credit-cards-classic');
  } else {
    analyzeAndVisualizeDifferences(args)
      .then(result => {
        console.log('Отчет о различиях создан:', result.id);
      })
      .catch(error => {
        console.error('Ошибка при создании отчета о различиях:', error.message);
      });
  }
}

module.exports = {
  analyzeDifferences,
  generateDifferencesReport,
  generateDifferencesHTML,
  generateDifferencesJSON,
  calculateDifference,
  analyzeAndVisualizeDifferences,
  saveDifferencesReport
};