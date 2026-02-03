/**
 * Скрипт для генерации данных фильтров на страницы категорий
 * 
 * Этот скрипт анализирует все продукты и создает данные для
 * продвинутой фильтрации на страницах категорий
 */

const fs = require('fs').promises;
const path = require('path');

// Определение типов фильтров
const filterTypes = {
  RANGE: 'range',
  SELECT: 'select',
  MULTI_SELECT: 'multi-select',
  BOOLEAN: 'boolean'
};

// Определение доступных фильтров для разных типов продуктов
const productFilters = {
  'credit-cards': [
    {
      id: 'interest_rate',
      name: 'Процентная ставка',
      type: filterTypes.RANGE,
      field: 'parameters.main.rate',
      min: 0,
      max: 100,
      step: 0.1,
      unit: '%'
    },
    {
      id: 'credit_limit',
      name: 'Кредитный лимит',
      type: filterTypes.RANGE,
      field: 'parameters.main.limit',
      min: 0,
      max: 5000000,
      step: 1000,
      unit: 'руб.'
    },
    {
      id: 'cashback',
      name: 'Кэшбэк',
      type: filterTypes.RANGE,
      field: 'parameters.main.cashback',
      min: 0,
      max: 100,
      step: 0.1,
      unit: '%'
    },
    {
      id: 'annual_fee',
      name: 'Годовое обслуживание',
      type: filterTypes.RANGE,
      field: 'parameters.fees.annual',
      min: 0,
      max: 10000,
      step: 100,
      unit: 'руб.'
    },
    {
      id: 'issuer',
      name: 'Банк-эмитент',
      type: filterTypes.SELECT,
      field: 'bankName'
    },
    {
      id: 'benefits',
      name: 'Преимущества',
      type: filterTypes.MULTI_SELECT,
      field: 'features'
    }
  ],
  'debit-cards': [
    {
      id: 'interest_rate',
      name: 'Процент на остаток',
      type: filterTypes.RANGE,
      field: 'parameters.main.rate',
      min: 0,
      max: 20,
      step: 0.1,
      unit: '%'
    },
    {
      id: 'monthly_fee',
      name: 'Ежемесячное обслуживание',
      type: filterTypes.RANGE,
      field: 'parameters.fees.monthly',
      min: 0,
      max: 1000,
      step: 50,
      unit: 'руб.'
    },
    {
      id: 'atm_fee',
      name: 'Комиссия за снятие в других банкоматах',
      type: filterTypes.RANGE,
      field: 'parameters.fees.atm_other_banks',
      min: 0,
      max: 1000,
      step: 50,
      unit: 'руб.'
    },
    {
      id: 'cashback',
      name: 'Кэшбэк',
      type: filterTypes.RANGE,
      field: 'parameters.main.cashback',
      min: 0,
      max: 100,
      step: 0.1,
      unit: '%'
    },
    {
      id: 'issuer',
      name: 'Банк-эмитент',
      type: filterTypes.SELECT,
      field: 'bankName'
    },
    {
      id: 'benefits',
      name: 'Преимущества',
      type: filterTypes.MULTI_SELECT,
      field: 'features'
    }
  ],
  'credits': [
    {
      id: 'interest_rate',
      name: 'Процентная ставка',
      type: filterTypes.RANGE,
      field: 'parameters.main.rate',
      min: 0,
      max: 50,
      step: 0.1,
      unit: '%'
    },
    {
      id: 'loan_amount',
      name: 'Сумма кредита',
      type: filterTypes.RANGE,
      field: 'parameters.main.amount',
      min: 10000,
      max: 10000000,
      step: 10000,
      unit: 'руб.'
    },
    {
      id: 'term',
      name: 'Срок кредита',
      type: filterTypes.RANGE,
      field: 'parameters.main.term',
      min: 1,
      max: 60,
      step: 1,
      unit: 'мес.'
    },
    {
      id: 'initial_payment',
      name: 'Первоначальный взнос',
      type: filterTypes.RANGE,
      field: 'parameters.main.initial_payment',
      min: 0,
      max: 100,
      step: 1,
      unit: '%'
    },
    {
      id: 'issuer',
      name: 'Банк',
      type: filterTypes.SELECT,
      field: 'bankName'
    },
    {
      id: 'purpose',
      name: 'Цель кредита',
      type: filterTypes.SELECT,
      field: 'parameters.main.purpose'
    }
  ],
  'deposits': [
    {
      id: 'interest_rate',
      name: 'Процентная ставка',
      type: filterTypes.RANGE,
      field: 'parameters.main.interest_rate',
      min: 0,
      max: 20,
      step: 0.1,
      unit: '%'
    },
    {
      id: 'min_deposit',
      name: 'Минимальная сумма вклада',
      type: filterTypes.RANGE,
      field: 'parameters.deposit_terms.min_deposit_amount',
      min: 1000,
      max: 1000000,
      step: 1000,
      unit: 'руб.'
    },
    {
      id: 'term',
      name: 'Срок вклада',
      type: filterTypes.RANGE,
      field: 'parameters.deposit_terms.term_months',
      min: 1,
      max: 60,
      step: 1,
      unit: 'мес.'
    },
    {
      id: 'capitalization',
      name: 'Капитализация процентов',
      type: filterTypes.SELECT,
      field: 'parameters.deposit_terms.capitalization'
    },
    {
      id: 'replenishment',
      name: 'Возможность пополнения',
      type: filterTypes.SELECT,
      field: 'parameters.deposit_terms.replenishment_options'
    },
    {
      id: 'issuer',
      name: 'Банк',
      type: filterTypes.SELECT,
      field: 'bankName'
    }
  ],
  'mortgage': [
    {
      id: 'interest_rate',
      name: 'Процентная ставка',
      type: filterTypes.RANGE,
      field: 'parameters.main.interest_rate',
      min: 6,
      max: 15,
      step: 0.1,
      unit: '%'
    },
    {
      id: 'down_payment',
      name: 'Первоначальный взнос',
      type: filterTypes.RANGE,
      field: 'parameters.main.min_down_payment',
      min: 10,
      max: 50,
      step: 1,
      unit: '%'
    },
    {
      id: 'loan_term',
      name: 'Срок кредита',
      type: filterTypes.RANGE,
      field: 'parameters.main.loan_term',
      min: 1,
      max: 30,
      step: 1,
      unit: 'лет'
    },
    {
      id: 'loan_amount',
      name: 'Сумма кредита',
      type: filterTypes.RANGE,
      field: 'parameters.main.min_loan_amount',
      min: 300000,
      max: 60000000,
      step: 100000,
      unit: 'руб.'
    },
    {
      id: 'issuer',
      name: 'Банк',
      type: filterTypes.SELECT,
      field: 'bankName'
    },
    {
      id: 'property_type',
      name: 'Тип недвижимости',
      type: filterTypes.SELECT,
      field: 'parameters.main.property_type'
    }
  ],
  'auto-loans': [
    {
      id: 'interest_rate',
      name: 'Процентная ставка',
      type: filterTypes.RANGE,
      field: 'parameters.main.interest_rate',
      min: 7,
      max: 15,
      step: 0.1,
      unit: '%'
    },
    {
      id: 'down_payment',
      name: 'Первоначальный взнос',
      type: filterTypes.RANGE,
      field: 'parameters.main.min_down_payment',
      min: 10,
      max: 50,
      step: 1,
      unit: '%'
    },
    {
      id: 'loan_term',
      name: 'Срок кредита',
      type: filterTypes.RANGE,
      field: 'parameters.main.loan_term',
      min: 1,
      max: 7,
      step: 1,
      unit: 'лет'
    },
    {
      id: 'loan_amount',
      name: 'Сумма кредита',
      type: filterTypes.RANGE,
      field: 'parameters.main.min_loan_amount',
      min: 200000,
      max: 5000000,
      step: 100000,
      unit: 'руб.'
    },
    {
      id: 'issuer',
      name: 'Банк',
      type: filterTypes.SELECT,
      field: 'bankName'
    },
    {
      id: 'car_type',
      name: 'Тип автомобиля',
      type: filterTypes.SELECT,
      field: 'parameters.main.car_type'
    }
  ],
  'investment-products': [
    {
      id: 'min_investment',
      name: 'Минимальная сумма инвестиций',
      type: filterTypes.RANGE,
      field: 'parameters.main.min_investment',
      min: 1000,
      max: 1000000,
      step: 1000,
      unit: 'руб.'
    },
    {
      id: 'commission_rate',
      name: 'Комиссия на операции',
      type: filterTypes.RANGE,
      field: 'parameters.main.commission_rate',
      min: 0,
      max: 2,
      step: 0.01,
      unit: '%'
    },
    {
      id: 'issuer',
      name: 'Банк',
      type: filterTypes.SELECT,
      field: 'bankName'
    },
    {
      id: 'investment_type',
      name: 'Тип инвестиций',
      type: filterTypes.SELECT,
      field: 'parameters.main.investment_options'
    }
  ],
  'insurance-products': [
    {
      id: 'coverage_amount',
      name: 'Страховая сумма',
      type: filterTypes.RANGE,
      field: 'parameters.main.coverage_amount',
      min: 100000,
      max: 10000000,
      step: 100000,
      unit: 'руб.'
    },
    {
      id: 'premium_rate',
      name: 'Размер премии',
      type: filterTypes.RANGE,
      field: 'parameters.main.premium_rate',
      min: 0.1,
      max: 5,
      step: 0.1,
      unit: '%'
    },
    {
      id: 'policy_term',
      name: 'Срок действия полиса',
      type: filterTypes.SELECT,
      field: 'parameters.main.policy_term'
    },
    {
      id: 'issuer',
      name: 'Банк/Страховая компания',
      type: filterTypes.SELECT,
      field: 'bankName'
    },
    {
      id: 'insurance_type',
      name: 'Тип страхования',
      type: filterTypes.SELECT,
      field: 'parameters.main.insurance_type'
    }
  ]
};

/**
 * Функция для извлечения значений поля из всех продуктов
 */
function extractFieldValues(products, fieldPath) {
  const values = new Set();
  
  for (const product of products) {
    const value = getNestedProperty(product, fieldPath);
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        // Если значение - массив, добавляем каждый элемент
        value.forEach(item => values.add(item));
      } else {
        values.add(value);
      }
    }
  }
  
  return Array.from(values).sort();
}

/**
 * Вспомогательная функция для получения вложенного свойства по пути
 */
function getNestedProperty(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Функция для вычисления диапазона значений для числовых фильтров
 */
function calculateRangeValues(products, fieldPath) {
  const values = [];
  
  for (const product of products) {
    const value = getNestedProperty(product, fieldPath);
    if (typeof value === 'number' && !isNaN(value)) {
      values.push(value);
    }
  }
  
  if (values.length === 0) {
    return { min: 0, max: 0 };
  }
  
  return {
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

/**
 * Функция для генерации опций фильтра SELECT
 */
function generateSelectOptions(products, fieldPath) {
  const values = extractFieldValues(products, fieldPath);
  return values.map(value => ({
    value: value,
    label: value
  }));
}

/**
 * Функция для генерации конфигурации фильтров для конкретной категории
 */
async function generateCategoryFilters(category, products) {
  const categoryConfig = productFilters[category] || [];
  const filters = [];
  
  for (const filterConfig of categoryConfig) {
    const filter = {
      id: filterConfig.id,
      name: filterConfig.name,
      type: filterConfig.type,
      field: filterConfig.field,
      unit: filterConfig.unit
    };
    
    switch (filterConfig.type) {
      case filterTypes.RANGE:
        const range = calculateRangeValues(products, filterConfig.field);
        filter.min = filterConfig.min !== undefined ? filterConfig.min : range.min;
        filter.max = filterConfig.max !== undefined ? filterConfig.max : range.max;
        filter.step = filterConfig.step || 1;
        break;
        
      case filterTypes.SELECT:
        filter.options = generateSelectOptions(products, filterConfig.field);
        break;
        
      case filterTypes.MULTI_SELECT:
        filter.options = generateSelectOptions(products, filterConfig.field);
        break;
        
      case filterTypes.BOOLEAN:
        filter.options = [
          { value: 'true', label: 'Да' },
          { value: 'false', label: 'Нет' }
        ];
        break;
    }
    
    filters.push(filter);
  }
  
  return filters;
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
 * Основная функция для генерации всех фильтров
 */
async function generateAllFilters(dataPath = '../data/pdfs') {
  console.log('Генерация данных для фильтров...');
  
  const fullPath = path.join(__dirname, dataPath);
  const categories = await fs.readdir(fullPath);
  
  const allFilters = {};
  
  for (const category of categories) {
    const categoryPath = path.join(fullPath, category);
    const stat = await fs.stat(categoryPath);
    
    if (stat.isDirectory()) {
      // Проверяем, является ли это подкатегорией продукта
      const subcategories = await fs.readdir(categoryPath);
      
      for (const subcategory of subcategories) {
        const subcategoryPath = path.join(categoryPath, subcategory);
        const subStat = await fs.stat(subcategoryPath);
        
        if (subStat.isDirectory() && productFilters[subcategory]) {
          console.log(`Генерация фильтров для категории: ${category}/${subcategory}`);
          
          const products = await loadCategoryProducts(subcategoryPath);
          const filters = await generateCategoryFilters(subcategory, products);
          
          allFilters[`${category}/${subcategory}`] = {
            category: category,
            subcategory: subcategory,
            filters: filters,
            productCount: products.length,
            generatedAt: new Date().toISOString()
          };
        }
      }
    } else if (productFilters[category]) {
      // Если это прямая подкатегория продукта
      console.log(`Генерация фильтров для категории: ${category}`);
      
      const products = await loadCategoryProducts(categoryPath);
      const filters = await generateCategoryFilters(category, products);
      
      allFilters[category] = {
        category: category,
        subcategory: category,
        filters: filters,
        productCount: products.length,
        generatedAt: new Date().toISOString()
      };
    }
  }
  
  return allFilters;
}

/**
 * Сохранение сгенерированных фильтров в JSON файл
 */
async function saveFilters(filters) {
  const outputPath = path.join(__dirname, '../data/filters-config.json');
  const outputData = {
    generatedAt: new Date().toISOString(),
    categories: filters
  };
  
  try {
    await fs.writeFile(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
    console.log(`Конфигурация фильтров сохранена в ${outputPath}`);
  } catch (error) {
    console.error('Ошибка при сохранении конфигурации фильтров:', error.message);
  }
}

/**
 * Функция для генерации HTML-разметки для фильтров (для использования в шаблонах)
 */
function generateFilterHTML(filters) {
  let html = '<div class="advanced-filters">\n';
  
  for (const filter of filters) {
    html += `  <div class="filter-group" data-filter-id="${filter.id}">\n`;
    html += `    <label class="filter-label">${filter.name}</label>\n`;
    
    switch (filter.type) {
      case filterTypes.RANGE:
        html += `    <div class="range-filter">\n`;
        html += `      <input type="range" class="filter-slider" min="${filter.min}" max="${filter.max}" step="${filter.step}" data-field="${filter.field}">\n`;
        html += `      <div class="range-values">\n`;
        html += `        <span class="min-value">${filter.min} ${filter.unit || ''}</span>\n`;
        html += `        <span class="max-value">${filter.max} ${filter.unit || ''}</span>\n`;
        html += `      </div>\n`;
        html += `    </div>\n`;
        break;
        
      case filterTypes.SELECT:
        html += `    <select class="filter-select" data-field="${filter.field}">\n`;
        html += `      <option value="">Все</option>\n`;
        for (const option of filter.options) {
          html += `      <option value="${option.value}">${option.label}</option>\n`;
        }
        html += `    </select>\n`;
        break;
        
      case filterTypes.MULTI_SELECT:
        html += `    <div class="multi-select-filter">\n`;
        for (const option of filter.options) {
          html += `      <label class="checkbox-option">\n`;
          html += `        <input type="checkbox" value="${option.value}" data-field="${filter.field}"> ${option.label}\n`;
          html += `      </label>\n`;
        }
        html += `    </div>\n`;
        break;
        
      case filterTypes.BOOLEAN:
        html += `    <div class="boolean-filter">\n`;
        for (const option of filter.options) {
          html += `      <label class="radio-option">\n`;
          html += `        <input type="radio" name="${filter.id}" value="${option.value}" data-field="${filter.field}"> ${option.label}\n`;
          html += `      </label>\n`;
        }
        html += `    </div>\n`;
        break;
    }
    
    html += '  </div>\n';
  }
  
  html += '</div>\n';
  
  return html;
}

/**
 * Запуск генерации фильтров
 */
async function runFilterGeneration() {
  try {
    console.log('Начало генерации данных для фильтров...');
    
    const filters = await generateAllFilters();
    await saveFilters(filters);
    
    console.log(`Сгенерированы фильтры для ${Object.keys(filters).length} категорий`);
    
    // Вывод статистики
    for (const [category, config] of Object.entries(filters)) {
      console.log(`${category}: ${config.filters.length} фильтров для ${config.productCount} продуктов`);
    }
    
    return filters;
  } catch (error) {
    console.error('Ошибка при генерации фильтров:', error.message);
    throw error;
  }
}

// Если файл запускается напрямую
if (require.main === module) {
  runFilterGeneration().catch(console.error);
}

module.exports = {
  runFilterGeneration,
  generateAllFilters,
  generateCategoryFilters,
  generateFilterHTML,
  filterTypes,
  productFilters
};