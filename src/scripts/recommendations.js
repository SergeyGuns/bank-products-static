/**
 * Скрипт для генерации персонализированных рекомендаций
 * 
 * Этот скрипт анализирует банковские продукты и создает персонализированные
 * рекомендации на основе различных факторов
 */

const fs = require('fs').promises;
const path = require('path');

// Типы рекомендаций
const recommendationTypes = {
  POPULAR: 'popular',
  BEST_RATED: 'best_rated',
  NEWEST: 'newest',
  HIGHEST_CASHBACK: 'highest_cashback',
  LOWEST_RATE: 'lowest_rate',
  PERSONALIZED: 'personalized'
};

// Факторы для персонализации
const personalizationFactors = {
  // Рейтинг достоверности
  credibility: {
    weight: 0.25,
    getValue: (product) => product.meta?.credibility?.rating || 50
  },
  
  // Процентная ставка (чем ниже, тем лучше)
  interestRate: {
    weight: 0.2,
    getValue: (product) => {
      const rate = parseFloat(product.parameters?.main?.rate || 
                            product.parameters?.main?.interestRate || 0);
      // Инвертируем, чтобы более низкие ставки имели более высокий балл
      return Math.max(0, 100 - rate);
    }
  },
  
  // Кэшбэк (чем выше, тем лучше)
  cashback: {
    weight: 0.15,
    getValue: (product) => {
      const cashback = parseFloat(product.parameters?.main?.cashback || 0);
      return Math.min(100, cashback);
    }
  },
  
  // Условия (количество положительных условий)
  terms: {
    weight: 0.15,
    getValue: (product) => {
      const conditions = product.conditions || [];
      // Подсчитываем количество положительных условий
      const positiveConditions = conditions.filter(condition => 
        condition.includes('бесплатно') || 
        condition.includes('неограниченно') || 
        condition.includes('до ') ||
        condition.toLowerCase().includes('льгот')
      ).length;
      
      return (positiveConditions / Math.max(1, conditions.length)) * 100;
    }
  },
  
  // Популярность (на основе просмотров/рейтинга, если доступно)
  popularity: {
    weight: 0.15,
    getValue: (product) => {
      // Временно используем фиктивные данные
      // В реальной системе это будет основано на данных аналитики
      return 50 + Math.random() * 30; // Случайное значение от 50 до 80
    }
  },
  
  // Актуальность (на основе даты обновления)
  recency: {
    weight: 0.1,
    getValue: (product) => {
      if (!product.version || !product.version.date) {
        return 0;
      }
      
      const updateDate = new Date(product.version.date);
      const currentDate = new Date();
      const daysSinceUpdate = Math.floor((currentDate - updateDate) / (1000 * 60 * 60 * 24));
      
      // Чем меньше дней прошло, тем выше балл
      return Math.max(0, 100 - (daysSinceUpdate / 3)); // Уменьшаем на 1 балл за каждые 3 дня
    }
  }
};

/**
 * Функция для вычисления персонализированного рейтинга продукта
 */
function calculatePersonalizedScore(product, factors = personalizationFactors) {
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const [factorName, factor] of Object.entries(factors)) {
    const value = factor.getValue(product);
    totalScore += value * factor.weight;
    totalWeight += factor.weight;
  }
  
  // Нормализуем к 100-балльной системе
  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

/**
 * Функция для генерации рекомендаций на основе популярности
 */
function getPopularRecommendations(products, limit = 5) {
  // Сортируем по фиктивной популярности (в реальной системе - по данным аналитики)
  return [...products]
    .sort((a, b) => (b.meta?.popularity || 0) - (a.meta?.popularity || 0))
    .slice(0, limit);
}

/**
 * Функция для генерации рекомендаций на основе рейтинга
 */
function getBestRatedRecommendations(products, limit = 5) {
  return [...products]
    .sort((a, b) => (b.meta?.credibility?.rating || 0) - (a.meta?.credibility?.rating || 0))
    .slice(0, limit);
}

/**
 * Функция для генерации рекомендаций новых продуктов
 */
function getNewestRecommendations(products, limit = 5) {
  return [...products]
    .sort((a, b) => {
      const dateA = new Date(a.validFrom || a.version?.date || '1970-01-01');
      const dateB = new Date(b.validFrom || b.version?.date || '1970-01-01');
      return dateB - dateA; // Новые первыми
    })
    .slice(0, limit);
}

/**
 * Функция для генерации рекомендаций с наибольшим кэшбэком
 */
function getHighestCashbackRecommendations(products, limit = 5) {
  return [...products]
    .sort((a, b) => {
      const cashbackB = parseFloat(b.parameters?.main?.cashback || 0);
      const cashbackA = parseFloat(a.parameters?.main?.cashback || 0);
      return cashbackB - cashbackA;
    })
    .slice(0, limit);
}

/**
 * Функция для генерации рекомендаций с наименьшей ставкой
 */
function getLowestRateRecommendations(products, limit = 5) {
  return [...products]
    .filter(p => p.parameters?.main?.rate || p.parameters?.main?.interestRate) // Только с указанной ставкой
    .sort((a, b) => {
      const rateA = parseFloat(a.parameters?.main?.rate || a.parameters?.main?.interestRate || Infinity);
      const rateB = parseFloat(b.parameters?.main?.rate || b.parameters?.main?.interestRate || Infinity);
      return rateA - rateB;
    })
    .slice(0, limit);
}

/**
 * Функция для генерации персонализированных рекомендаций
 */
function getPersonalizedRecommendations(products, userProfile = {}, limit = 5) {
  // Добавляем персонализированные баллы к каждому продукту
  const productsWithScores = products.map(product => {
    const score = calculatePersonalizedScore(product);
    return { ...product, personalizedScore: score };
  });
  
  // Сортируем по персонализированному баллу
  return productsWithScores
    .sort((a, b) => b.personalizedScore - a.personalizedScore)
    .slice(0, limit);
}

/**
 * Функция для генерации всех типов рекомендаций для категории
 */
function generateCategoryRecommendations(products, category, userId = null) {
  const recommendations = {
    category: category,
    userId: userId,
    generatedAt: new Date().toISOString(),
    types: {}
  };
  
  // Популярные продукты
  recommendations.types[recommendationTypes.POPULAR] = {
    type: recommendationTypes.POPULAR,
    products: getPopularRecommendations(products, 5),
    title: 'Популярные предложения'
  };
  
  // Лучшие по рейтингу
  recommendations.types[recommendationTypes.BEST_RATED] = {
    type: recommendationTypes.BEST_RATED,
    products: getBestRatedRecommendations(products, 5),
    title: 'Лучшие по рейтингу'
  };
  
  // Новинки
  recommendations.types[recommendationTypes.NEWEST] = {
    type: recommendationTypes.NEWEST,
    products: getNewestRecommendations(products, 5),
    title: 'Новые поступления'
  };
  
  // Наибольший кэшбэк
  recommendations.types[recommendationTypes.HIGHEST_CASHBACK] = {
    type: recommendationTypes.HIGHEST_CASHBACK,
    products: getHighestCashbackRecommendations(products, 5),
    title: 'С наибольшим кэшбэком'
  };
  
  // Наименьшая ставка
  recommendations.types[recommendationTypes.LOWEST_RATE] = {
    type: recommendationTypes.LOWEST_RATE,
    products: getLowestRateRecommendations(products, 5),
    title: 'С наименьшей ставкой'
  };
  
  // Персонализированные (временно без профиля пользователя)
  recommendations.types[recommendationTypes.PERSONALIZED] = {
    type: recommendationTypes.PERSONALIZED,
    products: getPersonalizedRecommendations(products, {}, 5),
    title: 'Персонализированные рекомендации'
  };
  
  return recommendations;
}

/**
 * Функция для загрузки всех продуктов в категории
 */
async function loadCategoryProducts(categoryPath) {
  const products = [];
  
  try {
    const items = await fs.readdir(categoryPath);
    
    for (const item of items) {
      if (item.endsWith('.json')) {
        const itemPath = path.join(categoryPath, item);
        const fileContent = await fs.readFile(itemPath, 'utf8');
        const product = JSON.parse(fileContent);
        products.push(product);
      }
    }
  } catch (error) {
    console.error(`Ошибка при загрузке продуктов из ${categoryPath}:`, error.message);
  }
  
  return products;
}

/**
 * Основная функция для генерации всех рекомендаций
 */
async function generateAllRecommendations(dataPath = '../data/pdfs') {
  console.log('Генерация персонализированных рекомендаций...');
  
  const fullPath = path.join(__dirname, dataPath);
  const categories = await fs.readdir(fullPath);
  
  const allRecommendations = {};
  
  for (const category of categories) {
    const categoryPath = path.join(fullPath, category);
    const stat = await fs.stat(categoryPath);
    
    if (stat.isDirectory()) {
      // Проверяем подкатегории
      const subcategories = await fs.readdir(categoryPath);
      
      for (const subcategory of subcategories) {
        const subcategoryPath = path.join(categoryPath, subcategory);
        const subStat = await fs.stat(subcategoryPath);
        
        if (subStat.isDirectory()) {
          console.log(`Генерация рекомендаций для категории: ${category}/${subcategory}`);
          
          const products = await loadCategoryProducts(subcategoryPath);
          if (products.length > 0) {
            const recommendations = generateCategoryRecommendations(products, `${category}/${subcategory}`);
            allRecommendations[`${category}/${subcategory}`] = recommendations;
          }
        }
      }
    } else {
      // Прямая категория
      console.log(`Генерация рекомендаций для категории: ${category}`);
      
      const products = await loadCategoryProducts(categoryPath);
      if (products.length > 0) {
        const recommendations = generateCategoryRecommendations(products, category);
        allRecommendations[category] = recommendations;
      }
    }
  }
  
  return allRecommendations;
}

/**
 * Сохранение сгенерированных рекомендаций
 */
async function saveRecommendations(recommendations) {
  const outputPath = path.join(__dirname, '../data/recommendations.json');
  const outputData = {
    generatedAt: new Date().toISOString(),
    categories: recommendations
  };
  
  try {
    await fs.writeFile(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
    console.log(`Рекомендации сохранены в ${outputPath}`);
  } catch (error) {
    console.error('Ошибка при сохранении рекомендаций:', error.message);
  }
}

/**
 * Функция для получения персонализированных рекомендаций для конкретного пользователя
 * (в реальной системе принимала бы профиль пользователя)
 */
function getUserRecommendations(recommendations, userId, category = null, type = recommendationTypes.PERSONALIZED) {
  if (category) {
    const categoryRecs = recommendations[category];
    if (categoryRecs && categoryRecs.types[type]) {
      return categoryRecs.types[type];
    }
  } else {
    // Если категория не указана, возвращаем рекомендации для всех категорий
    const result = {};
    for (const [cat, recs] of Object.entries(recommendations)) {
      if (recs.types[type]) {
        result[cat] = recs.types[type];
      }
    }
    return result;
  }
  
  return null;
}

/**
 * Запуск генерации рекомендаций
 */
async function runRecommendationGeneration() {
  try {
    console.log('Начало генерации персонализированных рекомендаций...');
    
    const recommendations = await generateAllRecommendations();
    await saveRecommendations(recommendations);
    
    console.log(`Сгенерированы рекомендации для ${Object.keys(recommendations).length} категорий`);
    
    // Вывод статистики
    for (const [category, recs] of Object.entries(recommendations)) {
      console.log(`${category}: ${Object.keys(recs.types).length} типов рекомендаций`);
    }
    
    return recommendations;
  } catch (error) {
    console.error('Ошибка при генерации рекомендаций:', error.message);
    throw error;
  }
}

// Если файл запускается напрямую
if (require.main === module) {
  runRecommendationGeneration().catch(console.error);
}

module.exports = {
  runRecommendationGeneration,
  generateAllRecommendations,
  generateCategoryRecommendations,
  calculatePersonalizedScore,
  getPersonalizedRecommendations,
  getUserRecommendations,
  recommendationTypes,
  personalizationFactors
};