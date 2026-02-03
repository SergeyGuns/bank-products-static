/**
 * Скрипт для реализации сравнения до 5 продуктов одновременно
 * 
 * Этот скрипт обрабатывает функционал сравнения банковских продуктов
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Функция для загрузки продукта по ID
 */
async function loadProductById(productId, bankName, productType) {
  const filePath = path.join(__dirname, `../data/pdfs/${bankName}/${productType}/${productId}.json`);
  
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Ошибка при загрузке продукта ${productId}:`, error.message);
    return null;
  }
}

/**
 * Функция для загрузки нескольких продуктов по ID
 */
async function loadProductsByIds(productIds) {
  const products = [];
  
  for (const productId of productIds) {
    // Извлекаем bankName и productType из ID продукта
    // Предполагаем формат ID: bankName-productType-uniqueId
    const parts = productId.split('-');
    if (parts.length < 3) {
      console.error(`Неверный формат ID продукта: ${productId}`);
      continue;
    }
    
    const bankName = parts[0];
    const productType = parts.slice(1, -1).join('-'); // Объединяем части между bankName и уникальным ID
    const actualProductId = parts[parts.length - 1];
    
    const product = await loadProductById(actualProductId, bankName, productType);
    if (product) {
      products.push(product);
    }
  }
  
  return products;
}

/**
 * Функция для извлечения всех уникальных параметров из набора продуктов
 */
function extractAllParameters(products) {
  const allParameters = new Set();
  
  for (const product of products) {
    if (product.parameters) {
      // Обходим все группы параметров
      for (const [group, groupParams] of Object.entries(product.parameters)) {
        if (typeof groupParams === 'object' && groupParams !== null) {
          for (const param of Object.keys(groupParams)) {
            allParameters.add(`${group}.${param}`);
          }
        }
      }
    }
  }
  
  return Array.from(allParameters).sort();
}

/**
 * Функция для получения значения параметра из продукта
 */
function getParameter(product, parameterPath) {
  const pathParts = parameterPath.split('.');
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
}

/**
 * Функция для создания объекта сравнения
 */
function createComparisonObject(products) {
  if (products.length === 0) {
    return null;
  }
  
  const allParameters = extractAllParameters(products);
  
  const comparison = {
    products: products,
    parameterGroups: {},
    allParameters: allParameters
  };
  
  // Группируем параметры по категориям
  const groups = {};
  for (const param of allParameters) {
    const [group, paramName] = param.split('.');
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(param);
  }
  
  comparison.parameterGroups = groups;
  
  // Добавляем значения параметров для каждого продукта
  for (const product of products) {
    product.values = {};
    for (const param of allParameters) {
      product.values[param] = getParameter(product, param);
    }
  }
  
  return comparison;
}

/**
 * Функция для сохранения сравнения
 */
async function saveComparison(comparison, comparisonId = null) {
  if (!comparisonId) {
    comparisonId = `comparison-${Date.now()}`;
  }
  
  const outputPath = path.join(__dirname, `../data/comparisons/${comparisonId}.json`);
  
  // Создаем директорию, если она не существует
  const dirPath = path.dirname(outputPath);
  await fs.mkdir(dirPath, { recursive: true });
  
  try {
    await fs.writeFile(outputPath, JSON.stringify(comparison, null, 2), 'utf8');
    console.log(`Сравнение сохранено в ${outputPath}`);
    return comparisonId;
  } catch (error) {
    console.error('Ошибка при сохранении сравнения:', error.message);
    throw error;
  }
}

/**
 * Функция для загрузки сохраненного сравнения
 */
async function loadComparison(comparisonId) {
  const filePath = path.join(__dirname, `../data/comparisons/${comparisonId}.json`);
  
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Ошибка при загрузке сравнения ${comparisonId}:`, error.message);
    return null;
  }
}

/**
 * Функция для генерации HTML-представления сравнения
 */
function generateComparisonHTML(comparison) {
  let html = '<div class="comparison-container">\n';
  
  // Заголовок сравнения
  html += '  <h2>Сравнение банковских продуктов</h2>\n';
  
  // Таблица сравнения
  html += '  <table class="comparison-table">\n';
  
  // Заголовки столбцов (продукты)
  html += '    <thead>\n      <tr>\n        <th>Параметр</th>\n';
  for (const product of comparison.products) {
    html += `        <th>${product.title}<br><small>${product.bankName}</small></th>\n`;
  }
  html += '      </tr>\n    </thead>\n';
  
  // Тело таблицы
  html += '    <tbody>\n';
  
  // Группы параметров
  for (const [groupName, params] of Object.entries(comparison.parameterGroups)) {
    html += `      <tr class="group-header"><td colspan="${comparison.products.length + 1}">${groupName.toUpperCase()}</td></tr>\n`;
    
    for (const param of params) {
      const paramName = param.split('.')[1]; // Берем имя параметра после группы
      html += `      <tr>\n        <td>${paramName}</td>\n`;
      
      for (const product of comparison.products) {
        const value = product.values[param] || '-';
        html += `        <td>${value}</td>\n`;
      }
      
      html += '      </tr>\n';
    }
  }
  
  html += '    </tbody>\n  </table>\n</div>\n';
  
  return html;
}

/**
 * Основная функция для создания сравнения
 */
async function createProductComparison(productIds) {
  console.log(`Создание сравнения для ${productIds.length} продуктов...`);
  
  if (productIds.length < 2) {
    throw new Error('Для сравнения необходимо выбрать как минимум 2 продукта');
  }
  
  if (productIds.length > 5) {
    throw new Error('Максимальное количество продуктов для сравнения - 5');
  }
  
  // Проверяем уникальность ID
  const uniqueIds = [...new Set(productIds)];
  if (uniqueIds.length !== productIds.length) {
    throw new Error('Все выбранные продукты должны быть уникальными');
  }
  
  // Загружаем продукты
  const products = await loadProductsByIds(productIds);
  
  if (products.length !== productIds.length) {
    console.warn(`Предупреждение: Загружено только ${products.length} из ${productIds.length} запрошенных продуктов`);
  }
  
  if (products.length < 2) {
    throw new Error('Не удалось загрузить достаточное количество продуктов для сравнения');
  }
  
  // Создаем объект сравнения
  const comparison = createComparisonObject(products);
  
  // Сохраняем сравнение
  const comparisonId = await saveComparison(comparison);
  
  console.log(`Сравнение создано успешно: ${comparisonId}`);
  
  return {
    id: comparisonId,
    comparison: comparison,
    productCount: products.length
  };
}

/**
 * Функция для получения доступных сравнений
 */
async function getAvailableComparisons() {
  const comparisonsDir = path.join(__dirname, '../data/comparisons');
  
  try {
    const files = await fs.readdir(comparisonsDir);
    const comparisonIds = files
      .filter(file => file.endsWith('.json'))
      .map(file => path.basename(file, '.json'));
    
    return comparisonIds;
  } catch (error) {
    // Если директория не существует, возвращаем пустой массив
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

// Если файл запускается напрямую
if (require.main === module) {
  // Пример использования
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Использование: node product-comparison.js <product_id_1> <product_id_2> ...');
    console.log('Пример: node product-comparison.js sberbank-credit-cards-platinum vtb-credit-cards-classic');
  } else {
    createProductComparison(args)
      .then(result => {
        console.log('Сравнение создано:', result.id);
      })
      .catch(error => {
        console.error('Ошибка при создании сравнения:', error.message);
      });
  }
}

module.exports = {
  createProductComparison,
  loadComparison,
  saveComparison,
  generateComparisonHTML,
  getAvailableComparisons,
  loadProductsByIds
};