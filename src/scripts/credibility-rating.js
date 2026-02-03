/**
 * Скрипт для системы рейтинга и проверки достоверности информации
 * 
 * Этот скрипт оценивает достоверность информации о банковских продуктах
 * по различным критериям и присваивает рейтинг
 */

const fs = require('fs').promises;
const path = require('path');

// Критерии оценки достоверности
const credibilityCriteria = {
  // Полнота информации (0-30 баллов)
  completeness: {
    weight: 0.3,
    maxPoints: 30,
    check: (productData) => {
      let points = 0;
      
      // Проверка наличия обязательных полей
      if (productData.title && productData.title.trim() !== '') points += 5;
      if (productData.shortDescription && productData.shortDescription.trim() !== '') points += 5;
      if (productData.fullDescription && productData.fullDescription.trim() !== '') points += 5;
      if (productData.parameters && Object.keys(productData.parameters).length > 0) points += 10;
      if (productData.version && productData.version.date) points += 5;
      
      return points;
    }
  },
  
  // Актуальность (0-25 баллов)
  recency: {
    weight: 0.25,
    maxPoints: 25,
    check: (productData) => {
      if (!productData.version || !productData.version.date) {
        return 0; // Минимальный балл за отсутствие даты
      }
      
      const updateDate = new Date(productData.version.date);
      const currentDate = new Date();
      const daysSinceUpdate = Math.floor((currentDate - updateDate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceUpdate <= 30) return 25; // Менее месяца - максимальный балл
      if (daysSinceUpdate <= 90) return 20; // Менее 3 месяцев
      if (daysSinceUpdate <= 180) return 15; // Менее полугода
      if (daysSinceUpdate <= 365) return 10; // Менее года
      if (daysSinceUpdate <= 730) return 5;  // Менее 2 лет
      return 0; // Более 2 лет
    }
  },
  
  // Логическая согласованность (0-20 баллов)
  consistency: {
    weight: 0.2,
    maxPoints: 20,
    check: (productData) => {
      let points = 20; // Начинаем с максимального балла
      
      // Проверка логических противоречий
      const mainParams = productData.parameters?.main || {};
      
      // Проверка процентных ставок
      const rate = parseFloat(mainParams.rate || mainParams.interestRate || 0);
      if (rate < 0 || rate > 100) points -= 10; // Подозрительно высокая или отрицательная ставка
      
      // Проверка сумм
      const minAmount = parseInt(mainParams.minAmount || mainParams.minimumAmount || 0);
      const maxAmount = parseInt(mainParams.maxAmount || mainParams.maximumAmount || Number.MAX_SAFE_INTEGER);
      if (minAmount > maxAmount) points -= 10; // Противоречие в минимальной/максимальной сумме
      
      // Проверка сроков
      const minTerm = parseInt(mainParams.minTerm || mainParams.minimumTerm || 0);
      const maxTerm = parseInt(mainParams.maxTerm || mainParams.maximumTerm || Number.MAX_SAFE_INTEGER);
      if (minTerm > maxTerm) points -= 10; // Противоречие в минимальном/максимальном сроке
      
      return Math.max(0, points); // Не ниже 0
    }
  },
  
  // Проверка через внешние источники (0-15 баллов)
  externalVerification: {
    weight: 0.15,
    maxPoints: 15,
    check: async (productData) => {
      // В реальной реализации здесь будет проверка через внешние API
      // или базы данных, такие как ЦБ РФ
      
      // Пока возвращаем средний балл
      return 10;
    }
  },
  
  // Проверка через LLM (0-10 баллов)
  llmVerification: {
    weight: 0.1,
    maxPoints: 10,
    check: async (productData) => {
      // В реальной реализации здесь будет вызов LLM для проверки достоверности
      // используя инструкции из ../llm-instructions/verify-credible.txt
      
      // Пока возвращаем средний балл
      return 7;
    }
  }
};

/**
 * Функция для вычисления общего рейтинга достоверности
 */
async function calculateCredibilityRating(productData) {
  let totalRating = 0;
  const details = {};
  
  for (const [criteriaName, criteria] of Object.entries(credibilityCriteria)) {
    let points;
    
    if (criteriaName === 'externalVerification' || criteriaName === 'llmVerification') {
      // Асинхронные проверки
      points = await criteria.check(productData);
    } else {
      // Синхронные проверки
      points = criteria.check(productData);
    }
    
    // Нормализация баллов к максимальному значению критерия
    const normalizedPoints = Math.min(points, criteria.maxPoints);
    details[criteriaName] = {
      points: normalizedPoints,
      maxPoints: criteria.maxPoints,
      weight: criteria.weight
    };
    
    totalRating += normalizedPoints * criteria.weight;
  }
  
  // Преобразование в 100-балльную систему
  const finalRating = Math.round(totalRating);
  
  return {
    rating: finalRating,
    maxRating: 100,
    details: details,
    level: getRatingLevel(finalRating)
  };
}

/**
 * Функция для определения уровня достоверности по рейтингу
 */
function getRatingLevel(rating) {
  if (rating >= 90) return 'very_high';
  if (rating >= 75) return 'high';
  if (rating >= 50) return 'medium';
  if (rating >= 25) return 'low';
  return 'very_low';
}

/**
 * Функция для обновления рейтинга в данных продукта
 */
function updateProductRating(productData, ratingInfo) {
  if (!productData.meta) {
    productData.meta = {};
  }
  
  productData.meta.credibility = {
    rating: ratingInfo.rating,
    level: ratingInfo.level,
    calculatedAt: new Date().toISOString(),
    details: ratingInfo.details
  };
  
  return productData;
}

/**
 * Функция для проверки всех продуктов в указанной директории
 */
async function rateAllProducts(productsPath = '../data/pdfs') {
  console.log('Запуск проверки достоверности информации для всех продуктов...');
  
  const fullPath = path.join(__dirname, productsPath);
  const allProducts = await loadAllProducts(fullPath);
  
  const ratingResults = [];
  
  for (const product of allProducts) {
    try {
      const rating = await calculateCredibilityRating(product);
      const updatedProduct = updateProductRating(product, rating);
      
      // Сохранение обновленного продукта
      await saveProduct(updatedProduct);
      
      ratingResults.push({
        productId: product.id,
        productName: product.title,
        bankName: product.bankName,
        rating: rating.rating,
        level: rating.level,
        updatedAt: new Date().toISOString()
      });
      
      console.log(`Рейтинг для "${product.title}" (${product.bankName}): ${rating.rating}/100 (${rating.level})`);
    } catch (error) {
      console.error(`Ошибка при оценке продукта ${product.id}:`, error.message);
      
      ratingResults.push({
        productId: product.id,
        productName: product.title,
        bankName: product.bankName,
        rating: 0,
        level: 'error',
        error: error.message,
        updatedAt: new Date().toISOString()
      });
    }
    
    // Небольшая задержка, чтобы не перегружать систему
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  return ratingResults;
}

/**
 * Загрузка всех продуктов из указанной директории
 */
async function loadAllProducts(productsPath) {
  const fullPath = path.join(__dirname, productsPath);
  const results = [];
  
  try {
    const items = await fs.readdir(fullPath);
    
    for (const item of items) {
      const itemPath = path.join(fullPath, item);
      const stat = await fs.stat(itemPath);
      
      if (stat.isDirectory()) {
        // Рекурсивная загрузка из поддиректорий
        const subDirResults = await loadAllProducts(path.relative(__dirname, itemPath));
        results.push(...subDirResults);
      } else if (item.endsWith('.json')) {
        // Загрузка JSON файла
        const fileContent = await fs.readFile(itemPath, 'utf8');
        const productData = JSON.parse(fileContent);
        results.push(productData);
      }
    }
  } catch (error) {
    console.error(`Ошибка при загрузке продуктов из ${fullPath}:`, error.message);
  }
  
  return results;
}

/**
 * Сохранение обновленного продукта
 */
async function saveProduct(productData) {
  // Определение пути к файлу на основе типа продукта и банка
  const productDir = path.join(__dirname, `../data/pdfs/${productData.bankName.toLowerCase().replace(/\s+/g, '-')}`);
  
  // Определение подкаталога на основе типа продукта
  let subDir;
  switch (productData.type) {
    case 'credit-cards':
      subDir = 'credit-cards';
      break;
    case 'debit-cards':
      subDir = 'debit-cards';
      break;
    case 'credits':
      subDir = 'credits';
      break;
    case 'deposits':
      subDir = 'deposits';
      break;
    default:
      subDir = productData.type.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  }
  
  const filePath = path.join(productDir, subDir, `${productData.id}.json`);
  
  try {
    await fs.writeFile(filePath, JSON.stringify(productData, null, 2), 'utf8');
  } catch (error) {
    console.error(`Ошибка при сохранении продукта ${productData.id}:`, error.message);
    throw error;
  }
}

/**
 * Сохранение результатов оценки
 */
async function saveRatingResults(results) {
  const outputPath = path.join(__dirname, '../data/credibility-ratings.json');
  const outputData = {
    ratingDate: new Date().toISOString(),
    totalProducts: results.length,
    summary: {
      very_high: results.filter(r => r.level === 'very_high').length,
      high: results.filter(r => r.level === 'high').length,
      medium: results.filter(r => r.level === 'medium').length,
      low: results.filter(r => r.level === 'low').length,
      very_low: results.filter(r => r.level === 'very_low').length,
      error: results.filter(r => r.level === 'error').length
    },
    results: results
  };
  
  try {
    await fs.writeFile(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
    console.log(`Результаты оценки достоверности сохранены в ${outputPath}`);
  } catch (error) {
    console.error('Ошибка при сохранении результатов оценки:', error.message);
  }
}

/**
 * Функция для получения статистики по рейтингам
 */
function getRatingStats(results) {
  const stats = {
    averageRating: 0,
    highestRating: 0,
    lowestRating: 100,
    ratingDistribution: {
      very_high: 0,
      high: 0,
      medium: 0,
      low: 0,
      very_low: 0,
      error: 0
    }
  };
  
  if (results.length === 0) return stats;
  
  let totalRating = 0;
  
  for (const result of results) {
    if (result.rating > 0) {
      totalRating += result.rating;
      stats.highestRating = Math.max(stats.highestRating, result.rating);
      stats.lowestRating = Math.min(stats.lowestRating, result.rating);
      stats.ratingDistribution[result.level]++;
    }
  }
  
  stats.averageRating = results.length > 0 ? Math.round(totalRating / results.length) : 0;
  
  return stats;
}

/**
 * Запуск системы оценки достоверности
 */
async function runCredibilityRating() {
  try {
    console.log('Начало оценки достоверности информации...');
    
    const results = await rateAllProducts();
    await saveRatingResults(results);
    
    // Вывод статистики
    const stats = getRatingStats(results);
    
    console.log('\nСтатистика оценки достоверности:');
    console.log(`- Всего оценено продуктов: ${results.length}`);
    console.log(`- Средний рейтинг: ${stats.averageRating}/100`);
    console.log(`- Наивысший рейтинг: ${stats.highestRating}/100`);
    console.log(`- Наименьший рейтинг: ${stats.lowestRating}/100`);
    console.log(`- Распределение рейтингов:`);
    console.log(`  * Очень высокий: ${stats.ratingDistribution.very_high}`);
    console.log(`  * Высокий: ${stats.ratingDistribution.high}`);
    console.log(`  * Средний: ${stats.ratingDistribution.medium}`);
    console.log(`  * Низкий: ${stats.ratingDistribution.low}`);
    console.log(`  * Очень низкий: ${stats.ratingDistribution.very_low}`);
    console.log(`  * Ошибки: ${stats.ratingDistribution.error}`);
    
    return results;
  } catch (error) {
    console.error('Ошибка при выполнении оценки достоверности:', error.message);
    throw error;
  }
}

// Если файл запускается напрямую
if (require.main === module) {
  runCredibilityRating().catch(console.error);
}

module.exports = {
  runCredibilityRating,
  rateAllProducts,
  calculateCredibilityRating,
  getRatingLevel,
  updateProductRating,
  credibilityCriteria
};