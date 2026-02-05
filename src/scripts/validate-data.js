#!/usr/bin/env node

/**
 * Скрипт для проверки корректности извлеченной информации о банковских продуктах
 */

const fs = require('fs').promises;
const path = require('path');

// Ожидаемые поля для различных типов продуктов
const expectedFields = {
  'credits': ['id', 'type', 'bankName', 'title', 'shortDescription', 'features', 'conditions', 'parameters'],
  'deposits': ['id', 'type', 'bankName', 'title', 'shortDescription', 'features', 'conditions', 'parameters'],
  'cards': ['id', 'type', 'bankName', 'title', 'shortDescription', 'features', 'conditions', 'parameters'],
  'mortgage': ['id', 'type', 'bankName', 'title', 'shortDescription', 'features', 'conditions', 'parameters'],
  'unknown': ['id', 'type', 'bankName', 'title', 'shortDescription', 'features', 'conditions', 'parameters']
};

// Ожидаемые подполя в параметрах
const expectedParameterFields = ['main', 'fees', 'requirements'];

async function validateProductData(product) {
  const errors = [];
  
  // Проверяем наличие обязательных полей
  const expected = expectedFields[product.type] || expectedFields.unknown;
  for (const field of expected) {
    if (!(field in product)) {
      errors.push(`Отсутствует обязательное поле: ${field}`);
    }
  }
  
  // Проверяем типы данных
  if (typeof product.id !== 'string') {
    errors.push('Поле id должно быть строкой');
  }
  
  if (typeof product.type !== 'string') {
    errors.push('Поле type должно быть строкой');
  }
  
  if (typeof product.bankName !== 'string') {
    errors.push('Поле bankName должно быть строкой');
  }
  
  if (typeof product.title !== 'string') {
    errors.push('Поле title должно быть строкой');
  }
  
  if (typeof product.shortDescription !== 'string') {
    errors.push('Поле shortDescription должно быть строкой');
  }
  
  if (!Array.isArray(product.features)) {
    errors.push('Поле features должно быть массивом');
  }
  
  if (!Array.isArray(product.conditions)) {
    errors.push('Поле conditions должно быть массивом');
  }
  
  if (typeof product.parameters !== 'object') {
    errors.push('Поле parameters должно быть объектом');
  } else {
    // Проверяем подполя в parameters
    for (const paramField of expectedParameterFields) {
      if (!(paramField in product.parameters)) {
        errors.push(`Отсутствует подполе в parameters: ${paramField}`);
      }
    }
  }
  
  // Проверяем, что ID уникален
  if (!product.id || product.id.length < 10) {
    errors.push('Поле id слишком короткое или отсутствует');
  }
  
  // Проверяем, что название банка не пустое
  if (!product.bankName || product.bankName.trim() === '') {
    errors.push('Поле bankName пустое');
  }
  
  // Проверяем, что заголовок не пустой
  if (!product.title || product.title.trim() === '') {
    errors.push('Поле title пустое');
  }
  
  // Проверяем, что тип продукта допустим
  const validTypes = ['credits', 'deposits', 'cards', 'mortgage', 'credit-cards', 'debit-cards', 'unknown'];
  if (!validTypes.includes(product.type)) {
    errors.push(`Недопустимый тип продукта: ${product.type}`);
  }
  
  return errors;
}

async function validateScrapingResults(resultsPath) {
  try {
    const data = await fs.readFile(resultsPath, 'utf8');
    const results = JSON.parse(data);
    
    console.log('🔍 Проверка корректности извлеченной информации...');
    
    let totalProducts = 0;
    let validProducts = 0;
    let invalidProducts = 0;
    const allErrors = [];
    
    for (const bankResult of results.results) {
      console.log(`\n🏦 Проверка банка: ${bankResult.bank}`);
      
      for (const scrapedData of bankResult.scrapedData) {
        totalProducts++;
        
        if (!scrapedData.products || !Array.isArray(scrapedData.products)) {
          console.log(`  ❌ Продукты отсутствуют или имеют неверный формат для ${scrapedData.url}`);
          invalidProducts++;
          continue;
        }

        if (scrapedData.products.length === 0) {
          console.log(`  ⚠️  На странице ${scrapedData.url} не найдено продуктов для типа ${scrapedData.productType}`);
          // Не считаем как ошибку, так как может не быть продуктов на этой конкретной странице
          continue;
        }

        for (const product of scrapedData.products) {
          const errors = await validateProductData(product);

          if (errors.length > 0) {
            console.log(`  ❌ Продукт "${product.title || 'Без названия'}" (${product.id}) имеет ошибки:`);
            for (const error of errors) {
              console.log(`    - ${error}`);
            }
            allErrors.push(...errors);
            invalidProducts++;
          } else {
            validProducts++;
          }
        }
      }
    }
    
    console.log('\n📊 Результаты проверки:');
    console.log(`  - Всего продуктов: ${totalProducts}`);
    console.log(`  - Корректных продуктов: ${validProducts}`);
    console.log(`  - Проблемных продуктов: ${invalidProducts}`);
    
    if (allErrors.length > 0) {
      const uniqueErrors = [...new Set(allErrors)];
      console.log(`\n⚠️  Обнаружено ${uniqueErrors.length} уникальных типов ошибок:`);
      uniqueErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    if (invalidProducts === 0) {
      console.log('\n✅ Все извлеченные данные корректны!');
      return true;
    } else {
      console.log(`\n❌ Обнаружены ошибки в ${invalidProducts} продуктах из ${totalProducts}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Ошибка при проверке данных: ${error.message}`);
    return false;
  }
}

async function main() {
  const resultsPath = path.join(__dirname, '../data/scraping-results.json');
  
  try {
    const isValid = await validateScrapingResults(resultsPath);
    
    if (!isValid) {
      console.log('\n💡 Рекомендации:');
      console.log('  - Проверьте парсер в product-parser.js на предмет корректного извлечения данных');
      console.log('  - Убедитесь, что все обязательные поля заполняются');
      console.log('  - Проверьте обработку различных форматов страниц банков');
    }
    
    process.exit(isValid ? 0 : 1);
  } catch (error) {
    console.error(`Необработанная ошибка: ${error.message}`);
    process.exit(1);
  }
}

// Запускаем основную функцию
main();