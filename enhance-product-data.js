/**
 * Скрипт для улучшения данных о продуктах - заполнение недостающей информации
 */

const fs = require('fs').promises;
const path = require('path');

async function enhanceProductData() {
  console.log('🔍 Анализ и улучшение данных о продуктах...\\n');
  
  // 1. Считываем все JSON файлы с продуктами
  const products = await readAllProductFiles();
  
  console.log(`Найдено ${products.length} продуктов для анализа\\n`);
  
  // 2. Определяем продукты с недостающей информацией
  const productsWithIssues = findProductsWithMissingInfo(products);
  
  console.log(`Найдено ${productsWithIssues.length} продуктов с недостающей информацией:\\n`);
  
  productsWithIssues.forEach((product, index) => {
    console.log(`${index + 1}. ${product.title || product.id || 'Без названия'} (${product.bankName || 'Без банка'})`);
    console.log(`   Отсутствующие поля: ${product.missingFields.join(', ')}\\n`);
  });
  
  // 3. Заполняем недостающую информацию на основе типа продукта и банка
  const enhancedProducts = await fillMissingInformation(products);
  
  // 4. Сохраняем обновленные данные
  await saveEnhancedProducts(enhancedProducts);
  
  console.log(`\\n✅ Улучшены данные для ${enhancedProducts.length} продуктов`);
  console.log(`  Из них обновлено параметров: ${calculateParameterImprovements(products, enhancedProducts)}`);
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
      } else if (item.endsWith('.json')) {
        try {
          const content = await fs.readFile(fullPath, 'utf8');
          const data = JSON.parse(content);
          
          if (Array.isArray(data)) {
            products.push(...data);
          } else if (typeof data === 'object' && data !== null) {
            // Добавляем информацию о пути к файлу для отслеживания
            data.__sourceFile = fullPath;
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

function findProductsWithMissingInfo(products) {
  const productsWithIssues = [];
  
  for (const product of products) {
    const missingFields = [];
    
    // Проверяем основные обязательные поля
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
        missingFields,
        __sourceFile: product.__sourceFile
      });
    }
  }
  
  return productsWithIssues;
}

async function fillMissingInformation(products) {
  console.log('🔄 Заполнение недостающей информации...');
  
  const enhancedProducts = [];
  
  for (const product of products) {
    let enhancedProduct = { ...product };
    
    // Заполняем недостающие поля на основе типа продукта и банка
    enhancedProduct = fillMissingFieldsByType(enhancedProduct);
    enhancedProduct = fillMissingFieldsByBank(enhancedProduct);
    
    // Если все еще есть недостающая информация, используем общие значения по умолчанию
    enhancedProduct = fillRemainingDefaults(enhancedProduct);
    
    enhancedProducts.push(enhancedProduct);
  }
  
  return enhancedProducts;
}

function fillMissingFieldsByType(product) {
  const typeDefaults = {
    'credit-cards': {
      shortDescription: 'Кредитная карта с возможностью беспроцентного периода',
      fullDescription: 'Кредитная карта, позволяющая совершать покупки в кредит с возможностью беспроцентного периода при соблюдении условий.',
      parameters: {
        main: {
          'Процентная ставка': product.parameters?.main?.['Процентная ставка'] || 'от 29.9%',
          'Кредитный лимит': product.parameters?.main?.['Кредитный лимит'] || 'до 1 000 000 ₽',
          'Льготный период': product.parameters?.main?.['Льготный период'] || 'до 55 дней'
        },
        fees: {
          'Выпуск карты': product.parameters?.fees?.['Выпуск карты'] || 'бесплатно',
          'Обслуживание': product.parameters?.fees?.['Обслуживание'] || 'бесплатно при определенных условиях',
          'Снятие наличных': product.parameters?.fees?.['Снятие наличных'] || '5.9% + 900 ₽'
        },
        requirements: {
          'Возраст': product.parameters?.requirements?.['Возраст'] || 'от 21 года',
          'Доход': product.parameters?.requirements?.['Доход'] || 'подтверждённый',
          'Стаж': product.parameters?.requirements?.['Стаж'] || 'от 6 месяцев'
        }
      }
    },
    'debit-cards': {
      shortDescription: 'Дебетовая карта для повседневных расходов',
      fullDescription: 'Дебетовая карта для повседневных расходов с возможностью получения кэшбэка и процентов на остаток.',
      parameters: {
        main: {
          'Процент на остаток': product.parameters?.main?.['Процент на остаток'] || 'до 7% годовых',
          'Кэшбэк': product.parameters?.main?.['Кэшбэк'] || 'до 10%',
          'Снятие наличных': product.parameters?.main?.['Снятие наличных'] || 'бесплатно в банкоматах банка'
        },
        fees: {
          'Выпуск карты': product.parameters?.fees?.['Выпуск карты'] || 'бесплатно',
          'Обслуживание': product.parameters?.fees?.['Обслуживание'] || 'бесплатно при определенных условиях',
          'Переводы': product.parameters?.fees?.['Переводы'] || 'бесплатно внутри банка'
        },
        requirements: {
          'Возраст': product.parameters?.requirements?.['Возраст'] || 'от 18 лет',
          'Документы': product.parameters?.requirements?.['Документы'] || ['Паспорт РФ']
        }
      }
    },
    'consumer-loans': {
      shortDescription: 'Потребительский кредит на любые цели',
      fullDescription: 'Кредит наличными или на счёт для совершения любых покупок и оплаты услуг.',
      parameters: {
        main: {
          'Процентная ставка': product.parameters?.main?.['Процентная ставка'] || 'от 19.9%',
          'Сумма кредита': product.parameters?.main?.['Сумма кредита'] || 'до 5 000 000 ₽',
          'Срок кредита': product.parameters?.main?.['Срок кредита'] || 'до 7 лет'
        },
        fees: {
          'Выдача кредита': product.parameters?.fees?.['Выдача кредита'] || 'бесплатно',
          'Досрочное погашение': product.parameters?.fees?.['Досрочное погашение'] || 'бесплатно',
          'Обслуживание счёта': product.parameters?.fees?.['Обслуживание счёта'] || 'бесплатно'
        },
        requirements: {
          'Возраст': product.parameters?.requirements?.['Возраст'] || 'от 21 года',
          'Стаж': product.parameters?.requirements?.['Стаж'] || 'от 6 месяцев на последнем месте',
          'Документы': product.parameters?.requirements?.['Документы'] || ['Паспорт РФ', 'Второй документ']
        }
      }
    },
    'mortgage': {
      shortDescription: 'Ипотечный кредит на покупку недвижимости',
      fullDescription: 'Кредит на покупку жилой недвижимости с недвижимостью в залог.',
      parameters: {
        main: {
          'Процентная ставка': product.parameters?.main?.['Процентная ставка'] || 'от 10.5%',
          'Первоначальный взнос': product.parameters?.main?.['Первоначальный взнос'] || 'от 15%',
          'Срок кредита': product.parameters?.main?.['Срок кредита'] || 'до 30 лет'
        },
        fees: {
          'Оформление': product.parameters?.fees?.['Оформление'] || 'от 0 ₽',
          'Страхование': product.parameters?.fees?.['Страхование'] || 'обязательно',
          'Оценка недвижимости': product.parameters?.fees?.['Оценка недвижимости'] || 'от 0 ₽'
        },
        requirements: {
          'Возраст': product.parameters?.requirements?.['Возраст'] || 'от 21 года',
          'Стаж': product.parameters?.requirements?.['Стаж'] || 'от 12 месяцев',
          'Документы': product.parameters?.requirements?.['Документы'] || ['Паспорт РФ', 'Справка 2-НДФЛ или по форме банка']
        }
      }
    },
    'deposits': {
      shortDescription: 'Вклад с возможностью пополнения и частичного снятия',
      fullDescription: 'Вклад с возможностью получения дохода в виде процентов на вложенную сумму.',
      parameters: {
        main: {
          'Процентная ставка': product.parameters?.main?.['Процентная ставка'] || 'до 15%',
          'Минимальная сумма': product.parameters?.main?.['Минимальная сумма'] || 'от 1 000 ₽',
          'Срок вклада': product.parameters?.main?.['Срок вклада'] || 'от 3 месяцев до 3 лет'
        },
        fees: {
          'Открытие вклада': product.parameters?.fees?.['Открытие вклада'] || 'бесплатно',
          'Обслуживание': product.parameters?.fees?.['Обслуживание'] || 'бесплатно',
          'Закрытие вклада': product.parameters?.fees?.['Закрытие вклада'] || 'бесплатно'
        },
        requirements: {
          'Возраст': product.parameters?.requirements?.['Возраст'] || 'от 18 лет',
          'Документы': product.parameters?.requirements?.['Документы'] || ['Паспорт РФ']
        }
      }
    }
  };
  
  const defaults = typeDefaults[product.type] || {};
  
  // Заполняем недостающую информацию
  if (!product.shortDescription && defaults.shortDescription) {
    product.shortDescription = defaults.shortDescription;
  }
  
  if (!product.fullDescription && defaults.fullDescription) {
    product.fullDescription = defaults.fullDescription;
  }
  
  if (!product.parameters && defaults.parameters) {
    product.parameters = defaults.parameters;
  } else if (defaults.parameters) {
    // Объединяем существующие параметры с умолчаниями
    product.parameters = product.parameters || {};
    
    for (const [section, params] of Object.entries(defaults.parameters)) {
      if (!product.parameters[section]) {
        product.parameters[section] = params;
      } else {
        // Добавляем только недостающие параметры
        for (const [param, value] of Object.entries(params)) {
          if (!product.parameters[section][param]) {
            product.parameters[section][param] = value;
          }
        }
      }
    }
  }
  
  return product;
}

function fillMissingFieldsByBank(product) {
  // Здесь можно добавить специфичные для банка параметры
  const bankSpecificDefaults = {
    'Сбербанк': {
      parameters: {
        fees: {
          'Обслуживание': product.parameters?.fees?.['Обслуживание'] || 'бесплатно при определенных условиях',
          'Снятие в других банкоматах': product.parameters?.fees?.['Снятие в других банкоматах'] || '1% + 150 ₽'
        }
      }
    },
    'ВТБ': {
      parameters: {
        main: {
          'Кэшбэк': product.parameters?.main?.['Кэшбэк'] || 'до 10%'
        },
        fees: {
          'Обслуживание': product.parameters?.fees?.['Обслуживание'] || 'бесплатно при определенных условиях'
        }
      }
    },
    'Т-Банк': {
      parameters: {
        main: {
          'Кэшбэк': product.parameters?.main?.['Кэшбэк'] || 'до 10%',
          'Процент на остаток': product.parameters?.main?.['Процент на остаток'] || 'до 12% годовых'
        }
      }
    }
  };
  
  const bankDefaults = bankSpecificDefaults[product.bankName] || {};
  
  if (bankDefaults.parameters) {
    product.parameters = product.parameters || {};
    
    for (const [section, params] of Object.entries(bankDefaults.parameters)) {
      if (!product.parameters[section]) {
        product.parameters[section] = params;
      } else {
        for (const [param, value] of Object.entries(params)) {
          if (!product.parameters[section][param]) {
            product.parameters[section][param] = value;
          }
        }
      }
    }
  }
  
  return product;
}

function fillRemainingDefaults(product) {
  // Заполняем оставшиеся поля общими значениями по умолчанию
  if (!product.id) {
    product.id = `${product.bankName || 'unknown'}-${product.type || 'product'}-${Date.now()}`;
  }
  
  if (!product.title) {
    product.title = `${product.type || 'Продукт'} ${product.bankName || 'Банка'}`;
  }
  
  if (!product.imageUrl) {
    product.imageUrl = `/img/products/${product.type || 'default'}.jpg`;
  }
  
  if (!product.features) {
    product.features = [];
  }
  
  if (!product.conditions) {
    product.conditions = ['Условия могут отличаться в зависимости от категории клиента'];
  }
  
  if (!product.referralLink) {
    product.referralLink = `https://${product.bankName ? product.bankName.toLowerCase().replace(/\s+/g, '') : 'bank'}.ru`;
  }
  
  // Создаем параметры, если они полностью отсутствуют
  if (!product.parameters) {
    product.parameters = {
      main: {},
      fees: {},
      requirements: {}
    };
  }
  
  if (!product.parameters.main) product.parameters.main = {};
  if (!product.parameters.fees) product.parameters.fees = {};
  if (!product.parameters.requirements) product.parameters.requirements = {};
  
  return product;
}

async function saveEnhancedProducts(products) {
  console.log('\\n💾 Сохранение улучшенных данных...');
  
  // Группируем продукты по типам для сохранения в соответствующие файлы
  const groupedByType = {};
  
  for (const product of products) {
    const type = product.type || 'other';
    if (!groupedByType[type]) {
      groupedByType[type] = [];
    }
    groupedByType[type].push(product);
  }
  
  // Сохраняем обновленные данные в соответствующие файлы
  for (const [type, typeProducts] of Object.entries(groupedBy)) {
    const filePath = path.join('./src/data/pdfs', `${type}.json`);
    
    try {
      await fs.writeFile(filePath, JSON.stringify(typeProducts, null, 2), 'utf8');
      console.log(`  ✅ Обновлен файл: ${filePath} (${typeProducts.length} продуктов)`);
    } catch (error) {
      console.error(`  ❌ Ошибка при сохранении ${filePath}: ${error.message}`);
    }
  }
  
  // Также обновляем общий файл продуктов
  const allProductsPath = path.join('./src/data', 'products.json');
  const allProductsData = { products: products };
  
  try {
    await fs.writeFile(allProductsPath, JSON.stringify(allProductsData, null, 2), 'utf8');
    console.log(`  ✅ Обновлен общий файл: ${allProductsPath} (${products.length} продуктов)`);
  } catch (error) {
    console.error(`  ❌ Ошибка при сохранении ${allProductsPath}: ${error.message}`);
  }
}

function calculateParameterImprovements(originalProducts, enhancedProducts) {
  let improvements = 0;
  
  for (let i = 0; i < originalProducts.length; i++) {
    const original = originalProducts[i];
    const enhanced = enhancedProducts[i];
    
    // Сравниваем количество параметров
    if (original.parameters && enhanced.parameters) {
      const origMainCount = original.parameters.main ? Object.keys(original.parameters.main).length : 0;
      const enhMainCount = enhanced.parameters.main ? Object.keys(enhanced.parameters.main).length : 0;
      
      const origFeesCount = original.parameters.fees ? Object.keys(original.parameters.fees).length : 0;
      const enhFeesCount = enhanced.parameters.fees ? Object.keys(enhanced.parameters.fees).length : 0;
      
      const origReqCount = original.parameters.requirements ? Object.keys(original.parameters.requirements).length : 0;
      const enhReqCount = enhanced.parameters.requirements ? Object.keys(enhanced.parameters.requirements).length : 0;
      
      improvements += (enhMainCount - origMainCount) + (enhFeesCount - origFeesCount) + (enhReqCount - origReqCount);
    } else if (!original.parameters && enhanced.parameters) {
      // Если параметров не было, а теперь есть
      improvements += Object.keys(enhanced.parameters.main || {}).length +
                      Object.keys(enhanced.parameters.fees || {}).length +
                      Object.keys(enhanced.parameters.requirements || {}).length;
    }
  }
  
  return improvements;
}

// Запуск улучшения данных
if (require.main === module) {
  enhanceProductData().catch(console.error);
}

module.exports = { enhanceProductData, readAllProductFiles, findProductsWithMissingInfo, fillMissingInformation };