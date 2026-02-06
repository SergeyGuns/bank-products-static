/**
 * Скрипт для анализа содержимого сайта и определения возможностей сравнения продуктов
 */

const fs = require('fs').promises;
const path = require('path');

async function analyzeSiteContent() {
  console.log('🔍 Анализ содержимого сайта для определения возможностей сравнения продуктов...\\n');
  
  // 1. Считываем все JSON файлы с продуктами
  const products = await readAllProductFiles();
  
  console.log(`Найдено ${products.length} продуктов для анализа\\n`);
  
  // 2. Группируем продукты по типам
  const groupedProducts = groupProductsByType(products);
  
  // 3. Анализируем каждую группу
  const comparisonAnalysis = {};
  
  for (const [type, typeProducts] of Object.entries(groupedProducts)) {
    console.log(`📊 Анализ типа продуктов: ${type} (${typeProducts.length} продуктов)`);
    
    // Проверяем, есть ли у продуктов необходимые параметры для сравнения
    const productsWithParams = typeProducts.filter(product => 
      product.parameters && 
      (product.parameters.main || product.parameters.fees || product.parameters.requirements)
    );
    
    console.log(`  - Продуктов с параметрами для сравнения: ${productsWithParams.length}`);
    console.log(`  - Продуктов без параметров для сравнения: ${typeProducts.length - productsWithParams.length}`);
    
    // Определяем, какие параметры доступны для сравнения
    const availableParams = analyzeParameters(productsWithParams);
    
    console.log(`  - Доступные параметры для сравнения: ${Object.keys(availableParams).join(', ')}`);
    
    // Определяем, какие параметры часто отсутствуют
    const missingParams = findCommonMissingParameters(typeProducts);
    console.log(`  - Часто отсутствующие параметры: ${Object.keys(missingParams).join(', ')}\\n`);
    
    comparisonAnalysis[type] = {
      totalProducts: typeProducts.length,
      productsWithParams: productsWithParams.length,
      productsWithoutParams: typeProducts.length - productsWithParams.length,
      availableParams: Object.keys(availableParams),
      missingParams: Object.keys(missingParams)
    };
  }
  
  // 4. Проверяем существующие страницы сравнения
  console.log('🔍 Проверка существующих страниц сравнения...');
  const existingComparePages = await findExistingComparePages();
  console.log(`  Найдено страниц сравнения: ${existingComparePages.length}`);
  existingComparePages.forEach(page => console.log(`    - ${page}`));
  
  // 5. Определяем, какие страницы сравнения можно создать
  const possibleComparePages = Object.keys(groupedProducts)
    .filter(type => groupedProducts[type].length > 1);
  
  console.log(`\\n📋 Возможные страницы сравнения: ${possibleComparePages.length}`);
  possibleComparePages.forEach(type => {
    console.log(`  - ${type} (${groupedProducts[type].length} продуктов)`);
  });
  
  // 6. Определяем продукты с недостающей информацией
  console.log('\\n⚠️  Продукты с недостающей информацией:');
  const productsWithMissingInfo = findProductsWithMissingInfo(products);
  productsWithMissingInfo.forEach(product => {
    console.log(`  - ${product.title} (${product.bankName}): ${product.missingFields.join(', ')}`);
  });
  
  // 7. Рекомендации
  console.log('\\n💡 Рекомендации:');
  console.log('  1. Создать страницы сравнения для типов продуктов с несколькими продуктами');
  console.log('  2. Добавить недостающие параметры для продуктов');
  console.log('  3. Улучшить структуру параметров для лучшего сравнения');
  console.log('  4. Добавить больше продуктов в категории с малым количеством');
  
  return {
    comparisonAnalysis,
    possibleComparePages,
    productsWithMissingInfo,
    groupedProducts
  };
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

function analyzeParameters(products) {
  const params = {};
  
  for (const product of products) {
    if (product.parameters) {
      // Анализируем основные параметры
      if (product.parameters.main) {
        for (const [key, value] of Object.entries(product.parameters.main)) {
          if (!params[key]) params[key] = 0;
          params[key]++;
        }
      }
      
      // Анализируем комиссии
      if (product.parameters.fees) {
        for (const [key, value] of Object.entries(product.parameters.fees)) {
          if (!params[key]) params[key] = 0;
          params[key]++;
        }
      }
      
      // Анализируем требования
      if (product.parameters.requirements) {
        for (const [key, value] of Object.entries(product.parameters.requirements)) {
          if (!params[key]) params[key] = 0;
          params[key]++;
        }
      }
    }
  }
  
  return params;
}

function findCommonMissingParameters(products) {
  // Определяем часто используемые параметры
  const commonParams = [
    'Процентная ставка',
    'Кредитный лимит',
    'Сумма кредита',
    'Срок кредита',
    'Первоначальный взнос',
    'Выдача карты',
    'Обслуживание',
    'Снятие наличных',
    'Возраст',
    'Стаж'
  ];
  
  const missingCounts = {};
  
  for (const product of products) {
    for (const param of commonParams) {
      let hasParam = false;
      
      if (product.parameters) {
        if (product.parameters.main && product.parameters.main[param]) hasParam = true;
        if (product.parameters.fees && product.parameters.fees[param]) hasParam = true;
        if (product.parameters.requirements && product.parameters.requirements[param]) hasParam = true;
      }
      
      if (!hasParam) {
        if (!missingCounts[param]) missingCounts[param] = 0;
        missingCounts[param]++;
      }
    }
  }
  
  // Возвращаем только те параметры, которые отсутствуют у большинства продуктов
  const significantMissing = {};
  for (const [param, count] of Object.entries(missingCounts)) {
    if (count > products.length * 0.5) { // Отсутствует у более чем 50% продуктов
      significantMissing[param] = count;
    }
  }
  
  return significantMissing;
}

async function findExistingComparePages() {
  try {
    const compareDir = './dist/compare';
    const items = await fs.readdir(compareDir);
    return items.filter(item => item.endsWith('.html'));
  } catch (error) {
    console.warn('Директория compare не найдена или пуста');
    return [];
  }
}

function findProductsWithMissingInfo(products) {
  const productsWithIssues = [];
  
  for (const product of products) {
    const missingFields = [];
    
    // Проверяем обязательные поля
    if (!product.title) missingFields.push('title');
    if (!product.bankName) missingFields.push('bankName');
    if (!product.type) missingFields.push('type');
    if (!product.shortDescription) missingFields.push('shortDescription');
    if (!product.fullDescription) missingFields.push('fullDescription');
    
    // Проверяем параметры
    if (!product.parameters) {
      missingFields.push('parameters');
    } else {
      if (!product.parameters.main) missingFields.push('parameters.main');
      if (!product.parameters.fees) missingFields.push('parameters.fees');
      if (!product.parameters.requirements) missingFields.push('parameters.requirements');
    }
    
    if (missingFields.length > 0) {
      productsWithIssues.push({
        id: product.id,
        title: product.title,
        bankName: product.bankName,
        type: product.type,
        missingFields
      });
    }
  }
  
  return productsWithIssues;
}

// Запуск анализа
if (require.main === module) {
  analyzeSiteContent().catch(console.error);
}

module.exports = { analyzeSiteContent, readAllProductFiles, groupProductsByType, analyzeParameters, findCommonMissingParameters, findProductsWithMissingInfo };