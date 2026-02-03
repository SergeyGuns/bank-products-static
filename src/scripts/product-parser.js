/**
 * Модуль для парсинга HTML-страниц банков и извлечения информации о продуктах
 */

const cheerio = require('cheerio');

/**
 * Извлечение информации о продуктах с веб-страницы
 */
function extractProductInfo(htmlContent, bankName, url) {
  const $ = cheerio.load(htmlContent);
  
  // Определяем тип продукта на основе URL
  let productType = 'unknown';
  if (url.includes('/mortgage') || url.includes('/ipoteka')) {
    productType = 'mortgage';
  } else if (url.includes('/credits') || url.includes('/loans') || url.includes('/kredity')) {
    productType = 'credits';
  } else if (url.includes('/deposits') || url.includes('/vklady')) {
    productType = 'deposits';
  } else if (url.includes('/cards') || url.includes('/cart')) {
    productType = 'cards';
  }

  // Извлекаем информацию в зависимости от типа продукта
  const products = [];
  
  switch (productType) {
    case 'mortgage':
      products.push(...parseMortgageProducts($, bankName));
      break;
    case 'credits':
      products.push(...parseCreditProducts($, bankName));
      break;
    case 'deposits':
      products.push(...parseDepositProducts($, bankName));
      break;
    case 'cards':
      products.push(...parseCardProducts($, bankName));
      break;
    default:
      // Пытаемся определить тип продукта по элементам на странице
      products.push(...parseGenericProducts($, bankName));
  }

  return {
    bankName,
    productType,
    url,
    products,
    lastScraped: new Date().toISOString()
  };
}

/**
 * Парсинг ипотечных продуктов
 */
function parseMortgageProducts($, bankName) {
  const products = [];
  
  // Поиск элементов, содержащих информацию об ипотечных продуктах
  $('.mortgage-product, .ipoteka-product, .product-mortgage, .product-item, .card, .offer').each((index, element) => {
    const title = $(element).find('h1, h2, h3, .title, .name, .product-title').first().text().trim();
    
    if (!title) return; // Пропускаем элементы без названия
    
    const product = {
      id: `${bankName}-mortgage-${Date.now()}-${index}`,
      type: 'mortgage',
      bankName,
      title: title,
      shortDescription: $(element).find('.description, .desc, .summary, .brief').first().text().trim(),
      features: extractFeatures($(element)),
      conditions: extractConditions($(element)),
      parameters: extractParameters($(element), 'mortgage'),
      imageUrl: extractImageUrl($(element)),
      referralLink: extractReferralLink($(element))
    };
    
    products.push(product);
  });
  
  return products;
}

/**
 * Парсинг кредитных продуктов
 */
function parseCreditProducts($, bankName) {
  const products = [];
  
  // Поиск элементов, содержащих информацию о кредитных продуктах
  $('.credit-product, .kredit-product, .product-credit, .product-item, .card, .offer').each((index, element) => {
    const title = $(element).find('h1, h2, h3, .title, .name, .product-title').first().text().trim();
    
    if (!title) return; // Пропускаем элементы без названия
    
    const product = {
      id: `${bankName}-credit-${Date.now()}-${index}`,
      type: 'credits',
      bankName,
      title: title,
      shortDescription: $(element).find('.description, .desc, .summary, .brief').first().text().trim(),
      features: extractFeatures($(element)),
      conditions: extractConditions($(element)),
      parameters: extractParameters($(element), 'credits'),
      imageUrl: extractImageUrl($(element)),
      referralLink: extractReferralLink($(element))
    };
    
    products.push(product);
  });
  
  return products;
}

/**
 * Парсинг депозитных продуктов
 */
function parseDepositProducts($, bankName) {
  const products = [];
  
  // Поиск элементов, содержащих информацию о депозитных продуктах
  $('.deposit-product, .vklad-product, .product-deposit, .product-item, .card, .offer').each((index, element) => {
    const title = $(element).find('h1, h2, h3, .title, .name, .product-title').first().text().trim();
    
    if (!title) return; // Пропускаем элементы без названия
    
    const product = {
      id: `${bankName}-deposit-${Date.now()}-${index}`,
      type: 'deposits',
      bankName,
      title: title,
      shortDescription: $(element).find('.description, .desc, .summary, .brief').first().text().trim(),
      features: extractFeatures($(element)),
      conditions: extractConditions($(element)),
      parameters: extractParameters($(element), 'deposits'),
      imageUrl: extractImageUrl($(element)),
      referralLink: extractReferralLink($(element))
    };
    
    products.push(product);
  });
  
  return products;
}

/**
 * Парсинг карточных продуктов
 */
function parseCardProducts($, bankName) {
  const products = [];
  
  // Поиск элементов, содержащих информацию о карточных продуктах
  $('.card-product, .product-card, .product-item, .card, .offer').each((index, element) => {
    const title = $(element).find('h1, h2, h3, .title, .name, .product-title').first().text().trim();
    
    if (!title) return; // Пропускаем элементы без названия
    
    const product = {
      id: `${bankName}-card-${Date.now()}-${index}`,
      type: 'credit-cards', // или 'debit-cards' в зависимости от типа карты
      bankName,
      title: title,
      shortDescription: $(element).find('.description, .desc, .summary, .brief').first().text().trim(),
      features: extractFeatures($(element)),
      conditions: extractConditions($(element)),
      parameters: extractParameters($(element), 'cards'),
      imageUrl: extractImageUrl($(element)),
      referralLink: extractReferralLink($(element))
    };
    
    products.push(product);
  });
  
  return products;
}

/**
 * Общий парсер для неопределенного типа продукта
 */
function parseGenericProducts($, bankName) {
  const products = [];
  
  // Поиск универсальных элементов продукта
  $('.product, .product-item, .card, .offer, .item').each((index, element) => {
    const title = $(element).find('h1, h2, h3, .title, .name, .product-title').first().text().trim();
    
    if (!title) return; // Пропускаем элементы без названия
    
    const product = {
      id: `${bankName}-generic-${Date.now()}-${index}`,
      type: 'unknown',
      bankName,
      title: title,
      shortDescription: $(element).find('.description, .desc, .summary, .brief').first().text().trim(),
      features: extractFeatures($(element)),
      conditions: extractConditions($(element)),
      parameters: extractParameters($(element), 'generic'),
      imageUrl: extractImageUrl($(element)),
      referralLink: extractReferralLink($(element))
    };
    
    products.push(product);
  });
  
  return products;
}

/**
 * Извлечение характеристик продукта
 */
function extractFeatures(element) {
  const features = [];
  
  // Поиск списков характеристик
  element.find('li, .feature, .benefit, .advantage').each((index, el) => {
    const text = $(el).text().trim();
    if (text && !features.includes(text)) {
      features.push(text);
    }
  });
  
  return features.slice(0, 20); // Ограничиваем количество характеристик
}

/**
 * Извлечение условий продукта
 */
function extractConditions(element) {
  const conditions = [];
  
  // Поиск элементов с условиями
  element.find('.condition, .requirement, .term, .info').each((index, el) => {
    const text = $(el).text().trim();
    if (text && !conditions.includes(text)) {
      conditions.push(text);
    }
  });
  
  return conditions.slice(0, 20); // Ограничиваем количество условий
}

/**
 * Извлечение параметров продукта
 */
function extractParameters(element, productType) {
  const parameters = {
    main: {},
    fees: {},
    requirements: {}
  };
  
  // Извлечение основных параметров в зависимости от типа продукта
  switch (productType) {
    case 'mortgage':
      // Ищем информацию об ипотеке
      const interestRate = extractParameter(element, ['ставка', 'процент', '%', 'rate']);
      if (interestRate) parameters.main.interest_rate = interestRate;
      
      const downPayment = extractParameter(element, ['взнос', 'initial', 'down payment']);
      if (downPayment) parameters.main.min_down_payment = downPayment;
      
      const loanTerm = extractParameter(element, ['срок', 'term', 'лет', 'год']);
      if (loanTerm) parameters.main.loan_term = loanTerm;
      
      break;
      
    case 'credits':
      // Ищем информацию о кредитах
      const creditRate = extractParameter(element, ['ставка', 'процент', '%', 'rate']);
      if (creditRate) parameters.main.interest_rate = creditRate;
      
      const loanAmount = extractParameter(element, ['сумма', 'amount', 'лимит']);
      if (loanAmount) parameters.main.max_loan_amount = loanAmount;
      
      const creditTerm = extractParameter(element, ['срок', 'term', 'лет', 'год']);
      if (creditTerm) parameters.main.loan_term = creditTerm;
      
      break;
      
    case 'deposits':
      // Ищем информацию о депозитах
      const depositRate = extractParameter(element, ['ставка', 'процент', '%', 'rate']);
      if (depositRate) parameters.main.interest_rate = depositRate;
      
      const minAmount = extractParameter(element, ['минимальная сумма', 'min amount']);
      if (minAmount) parameters.main.min_amount = minAmount;
      
      const term = extractParameter(element, ['срок', 'term', 'месяц', 'месяцев']);
      if (term) parameters.main.term = term;
      
      break;
      
    default:
      // Общие параметры
      const rate = extractParameter(element, ['ставка', 'процент', '%', 'rate']);
      if (rate) parameters.main.rate = rate;
  }
  
  return parameters;
}

/**
 * Извлечение конкретного параметра по ключевым словам
 */
function extractParameter(element, keywords) {
  // Ищем элементы, содержащие ключевые слова
  for (const keyword of keywords) {
    // Используем более широкий поиск - ищем по всему документу
    const elements = element.parent().find('*').filter(function() {
      return $(this).text().toLowerCase().includes(keyword.toLowerCase());
    });

    if (elements.length > 0) {
      // Извлекаем текст из найденного элемента и соседних
      for (let i = 0; i < elements.length; i++) {
        const el = elements.eq(i);
        const text = el.text().trim();

        // Ищем числовые значения или проценты в тексте
        const matches = text.match(/(\d+[.,]?\d*)\s*(%|руб|₽|год|лет|мес|\.)/gi);

        if (matches && matches.length > 0) {
          // Возвращаем наиболее подходящее значение
          return matches[0].trim().replace('.', '%'); // Заменяем точки на % если это процент
        }

        // Также проверяем атрибуты элемента
        const attrs = ['data-value', 'data-rate', 'data-percent', 'title', 'aria-label'];
        for (const attr of attrs) {
          const attrValue = el.attr(attr);
          if (attrValue) {
            const attrMatches = attrValue.match(/(\d+[.,]?\d*)\s*(%|руб|₽|год|лет|мес|\.)/gi);
            if (attrMatches && attrMatches.length > 0) {
              return attrMatches[0].trim().replace('.', '%');
            }
          }
        }
      }
    }
  }

  return null;
}

/**
 * Извлечение URL изображения
 */
function extractImageUrl(element) {
  // Ищем изображения внутри элемента
  const img = element.find('img').first();
  if (img.length > 0) {
    const src = img.attr('src');
    if (src) {
      // Если URL относительный, преобразуем в абсолютный
      if (src.startsWith('//')) {
        return 'https:' + src;
      } else if (src.startsWith('/')) {
        // Абсолютный путь на том же домене будет добавлен позже
        return src;
      } else {
        return src;
      }
    }
  }
  
  return null;
}

/**
 * Извлечение реферальной ссылки
 */
function extractReferralLink(element) {
  // Ищем кнопки или ссылки с текстом, указывающим на переход
  const link = element.find('a[href]:contains("Подробнее"), a[href]:contains("Оформить"), a[href]:contains("Перейти"), .btn, .link').first();
  if (link.length > 0) {
    const href = link.attr('href');
    if (href) {
      return href;
    }
  }
  
  return null;
}

module.exports = {
  extractProductInfo
};