/**
 * Скрипт для автоматического сканирования официальных сайтов банков
 * с целью проверки актуальности информации о банковских продуктах
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');
const { ErrorHandler } = require('./error-handler');
const BackupMethods = require('./backup-methods');
const notificationSystem = require('./notification-system');
const urlManager = require('./url-manager');
const { extractProductInfo } = require('./product-parser');

// Условная загрузка puppeteer (только при необходимости)
let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (err) {
  logger.warn('Puppeteer не установлен. Установите его с помощью: npm install puppeteer');
}

// Список User-Agent строк для ротации
const USER_AGENTS = [
  // Chrome на Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',

  // Chrome на macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',

  // Chrome на Linux
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',

  // Firefox на Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',

  // Firefox на macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0',

  // Safari на macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',

  // Мобильные User-Agent
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 13; SM-A546V) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36'
];

// Список прокси-серверов (можно обновлять по мере необходимости)
const PROXY_LIST = [
  // Пример формата: 'http://username:password@proxy-server:port'
  // 'http://proxy1.example.com:8080',
  // 'http://proxy2.example.com:8080',
];

// Индекс текущего прокси для ротации
let currentProxyIndex = 0;

// Функция для получения следующего прокси из списка
function getNextProxy() {
  if (PROXY_LIST.length === 0) {
    return null;
  }

  const proxy = PROXY_LIST[currentProxyIndex];
  currentProxyIndex = (currentProxyIndex + 1) % PROXY_LIST.length;
  return proxy;
}

// Конфигурация для скрапинга
const scrapingConfig = {
  // Таймаут для запросов
  timeout: 45000, // Увеличено с 15000

  // Заголовки для имитации реального браузера
  headers: {
    'User-Agent': USER_AGENTS[0],
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0'
  },

  // Задержка между запросами (в миллисекундах)
  delayBetweenRequests: 7000, // Увеличено с 2000

  // Максимальное количество попыток для запроса
  maxRetries: 7, // Увеличено с 5

  // Базовая задержка для повторных попыток (в миллисекундах)
  retryDelay: 3000, // Увеличено с 1000

  // Максимальная задержка для повторных попыток (в миллисекундах)
  maxRetryDelay: 25000, // Увеличено с 10000

  // Список банков и их веб-сайтов
  banks: [
    {
      name: 'sberbank',
      url: 'https://www.sberbank.ru',
      productEndpoints: [
        // Обновленные URL для Сбербанка на основе поиска
        'https://www.sberbank.ru/ru/person/cards/',
        'https://www.sberbank.ru/ru/person/deposits/',
        'https://www.sberbank.ru/ru/person/credits/',
        'https://www.sberbank.ru/ru/person/ipoteka/'
      ]
    },
    {
      name: 'vtb',
      url: 'https://www.vtb.ru',
      productEndpoints: [
        // Обновленные URL для ВТБ на основе проверки
        'https://online.vtb.ru/',
        'https://www.vtb.ru/personal/',
        'https://www.vtb.ru/personal/bank-products/',
        'https://www.vtb.ru/personal/credit-cards/',
        'https://www.vtb.ru/personal/debit-cards/',
        'https://www.vtb.ru/personal/deposits/',
        'https://www.vtb.ru/personal/loans/',
        'https://www.vtb.ru/personal/mortgage/'
      ]
    },
    {
      name: 'gazprombank',
      url: 'https://www.gazprombank.ru',
      productEndpoints: [
        'https://www.gazprombank.ru/personal/cards/',
        'https://www.gazprombank.ru/personal/loans/',
        'https://www.gazprombank.ru/personal/deposits/',
        'https://www.gazprombank.ru/personal/mortgage/'
      ]
    },
    {
      name: 'alfabank',
      url: 'https://alfabank.ru',
      productEndpoints: [
        'https://alfabank.ru/retail/cards/',
        'https://alfabank.ru/retail/loans/',
        'https://alfabank.ru/retail/deposits/',
        'https://alfabank.ru/retail/ipoteka/'
      ]
    },
    {
      name: 'psb',
      url: 'https://psb.ru',
      productEndpoints: [
        // Для Промсвязьбанка используем агрегаторы, т.к. прямые ссылки недоступны
        'https://www.banki.ru/banks/bank/psb/',
        'https://rbc.ru/quote/psb.MCX/',
        'https://smart-lab.ru/q/psb/',
        'https://vbr.ru/banki/psb/'
      ]
    },
    {
      name: 'roselhozbank',
      url: 'https://rshb.ru',
      productEndpoints: [
        // Обновленные URL для Россельхозбанка на основе проверки
        'https://rshb.ru/',
        'https://rshb.ru/natural/#/cards/credit',
        'https://rshb.ru/natural/#/cards/debit',
        'https://rshb.ru/natural/#/deposits',
        'https://rshb.ru/natural/#/credits/personal',
        'https://rshb.ru/natural/#/mortgage',
        'https://rshb.ru/natural/#/products',
        'https://rshb.ru/natural/#/banking'
      ]
    },
    {
      name: 'mkb',
      url: 'https://www.mkb.ru',
      productEndpoints: [
        'https://www.mkb.ru/personal/cards/',
        'https://www.mkb.ru/personal/loans/',
        'https://www.mkb.ru/personal/deposits/',
        'https://www.mkb.ru/personal/ipoteka/'
      ]
    },
    {
      name: 'sovcombank',
      url: 'https://sovcombank.ru',
      productEndpoints: [
        // Обновленные URL для Совкомбанка на основе проверки
        'https://sovcombank.ru/',
        'https://sovcombank.ru/cards/',
        'https://sovcombank.ru/deposits/',
        'https://www.banki.ru/banks/bank/sovcombank/',
        'https://sravni.ru/bank/sovcombank/',
        'https://vbr.ru/banki/sovcombank/'
      ]
    },
    {
      name: 'tbank',
      url: 'https://www.tbank.ru',
      productEndpoints: [
        'https://www.tbank.ru/personal/cards/',
        'https://www.tbank.ru/personal/loans/',
        'https://www.tbank.ru/personal/deposits/',
        'https://www.tbank.ru/personal/ipoteka/',
        // Добавим дополнительный URL для T-Bank из поиска
        'https://www.tbank.ru/finance/'
      ]
    },
    {
      name: 'domrf',
      url: 'https://domrfbank.ru',
      productEndpoints: [
        // Обновленные URL для Дом.рф банка на основе проверки
        'https://domrfbank.ru/',
        'https://www.banki.ru/banks/bank/domrfbank/',
        'https://rbc.ru/quote/domrf.MCX/',
        'https://smart-lab.ru/q/domrf/'
      ]
    }
  ]
};

/**
 * Функция для проверки доступности URL
 */
async function checkUrlAvailability(url) {
  try {
    // Обновляем User-Agent для проверки
    const headers = {
      ...scrapingConfig.headers,
      'User-Agent': getRandomUserAgent()
    };

    // Получаем прокси для этой проверки
    const proxy = getNextProxy();
    const axiosOptions = {
      timeout: scrapingConfig.timeout,
      headers: headers
    };

    // Добавляем прокси, если он доступен
    if (proxy) {
      try {
        const HttpsProxyAgent = require('https-proxy-agent');
        axiosOptions.httpsAgent = new HttpsProxyAgent(proxy);
        axiosOptions.httpAgent = new HttpsProxyAgent(proxy);
      } catch (e) {
        await logger.warn('Модуль https-proxy-agent не установлен для проверки доступности');
      }
    }

    const response = await axios.head(url, axiosOptions);

    // Проверяем, что статус 2xx
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    // Обрабатываем ошибку с помощью нового обработчика
    await ErrorHandler.handleNetworkError(error, url);

    // Возвращаем false, если произошла ошибка
    await logger.warn(`URL недоступен: ${url}`, { url, errorMessage: error.message });
    return false;
  }
}

/**
 * Функция для получения случайного User-Agent
 */
function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Функция для генерации случайных заголовков, имитирующих реальное поведение человека
 */
function generateHumanLikeHeaders() {
  const userAgent = getRandomUserAgent();
  const isMobile = userAgent.includes('Mobile') || userAgent.includes('Android');
  const isFirefox = userAgent.includes('Firefox');
  const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');

  const headers = {
    'User-Agent': userAgent,
    'Accept': isSafari ? 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0'
  };

  // Добавляем специфичные заголовки для разных браузеров
  if (isFirefox) {
    headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8';
  } else if (isSafari) {
    headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';
  }

  // Добавляем Sec-Fetch заголовки для Chrome
  if (!isFirefox && !isSafari) {
    headers['Sec-Ch-Ua'] = '"Not_A Brand";v="8", "Chromium";v="120"';
    headers['Sec-Ch-Ua-Mobile'] = isMobile ? '?1' : '?0';
    headers['Sec-Ch-Ua-Platform'] = '"Windows"'; // Можно сделать рандомным
  }

  return headers;
}

/**
 * Функция для получения содержимого веб-страницы с повторными попытками
 */
async function fetchWebPage(url) {
  let lastError;

  // Проверяем, является ли URL проблемным (возвращает 401, 503, 404) и нуждается в Puppeteer
  // Совкомбанк теперь использует агрегатор, поэтому исключаем его из списка проблемных
  const problematicDomains = ['vtb.ru', 'psb.ru', 'rshb.ru', 'domrfbank.ru'];
  const isProblematicDomain = problematicDomains.some(domain => url.includes(domain));

  if (isProblematicDomain && puppeteer) {
    await logger.info(`Используем Puppeteer для скрапинга: ${url}`, { url, method: 'puppeteer' });
    return await fetchWithPuppeteer(url);
  }

  for (let attempt = 1; attempt <= scrapingConfig.maxRetries; attempt++) {
    try {
      // Обновляем заголовки для каждой попытки, имитируя реальное поведение человека
      const headers = generateHumanLikeHeaders();

      // Получаем прокси для этой попытки
      const proxy = getNextProxy();
      const axiosOptions = {
        headers,
        timeout: scrapingConfig.timeout
      };

      // Добавляем прокси, если он доступен
      if (proxy) {
        try {
          const HttpsProxyAgent = require('https-proxy-agent');
          axiosOptions.httpsAgent = new HttpsProxyAgent(proxy);
          axiosOptions.httpAgent = new HttpsProxyAgent(proxy);
          await logger.info(`Используем прокси: ${proxy} для запроса к ${url}`, { url, proxy });
        } catch (e) {
          await logger.warn('Модуль https-proxy-agent не установлен. Установите его с помощью: npm install https-proxy-agent');
          // Продользуем без прокси
        }
      }

      const response = await axios.get(url, axiosOptions);

      return response.data;
    } catch (error) {
      lastError = error;

      // Обрабатываем ошибку с помощью нового обработчика
      const errorInfo = await ErrorHandler.handleScrapingError(error, url, 'fetchWebPage');

      // Если ошибка фатальная, прекращаем попытки
      if (ErrorHandler.isFatalError(errorInfo)) {
        await logger.warn(`Фатальная ошибка при обработке ${url}, прекращаем попытки`, {
          url,
          errorCategory: errorInfo.category
        });
        break;
      }

      // Если ошибка 401, 503, 404 или Parse Error, возможно, стоит попробовать Puppeteer
      if ((error.response &&
           (error.response.status === 401 ||
            error.response.status === 503 ||
            error.response.status === 404) &&
           puppeteer) ||
          (error.message && error.message.includes('Parse Error'))) {

        await logger.info(`Получена ошибка ${error.response ? error.response.status : 'Parse Error'} для ${url}, пробуем использовать Puppeteer`, {
          url,
          errorStatus: error.response ? error.response.status : 'Parse Error',
          method: 'puppeteer'
        });
        return await fetchWithPuppeteer(url);
      }

      await logger.warn(`Ошибка при получении страницы ${url} (попытка ${attempt}/${scrapingConfig.maxRetries}):`, {
        url,
        attempt,
        maxRetries: scrapingConfig.maxRetries,
        errorMessage: error.message,
        errorResponseCode: error.response ? error.response.status : 'no-response',
        errorResponseData: error.response ? error.response.statusText : 'no-response',
        errorConfig: error.config ? {
          method: error.config.method,
          url: error.config.url,
          headers: Object.keys(error.config.headers || {})
        } : 'no-config'
      });

      // Если это не последняя попытка, ждем перед повтором
      if (attempt < scrapingConfig.maxRetries) {
        // Используем экспоненциальную задержку с ограничением
        const delay = Math.min(
          scrapingConfig.retryDelay * Math.pow(2, attempt - 1),
          scrapingConfig.maxRetryDelay
        );

        // Добавляем случайную составляющую к задержке для имитации реального поведения
        const jitter = Math.random() * 1000; // до 1 секунды случайной задержки
        const totalDelay = delay + jitter;

        await logger.info(`Задержка перед повторной попыткой: ${Math.round(totalDelay)}ms`, {
          url,
          attempt,
          baseDelay: delay,
          jitter: jitter,
          totalDelay: totalDelay
        });

        await new Promise(resolve => setTimeout(resolve, totalDelay));
      }
    }
  }

  // Все попытки не удались
  await logger.error(`Не удалось получить страницу ${url} после ${scrapingConfig.maxRetries} попыток. Последняя ошибка:`, {
    url,
    maxRetries: scrapingConfig.maxRetries,
    lastError: lastError.message
  });

  // Извлекаем имя банка из URL для уведомления
  const bankName = extractBankNameFromUrl(url);

  // Определяем более точную причину недоступности
  let errorCategory = 'max_retries_exceeded';
  let errorMessage = `Не удалось получить страницу после ${scrapingConfig.maxRetries} попыток`;

  if (lastError.response) {
    if (lastError.response.status === 404) {
      errorCategory = 'page_not_found';
      errorMessage = `Страница не найдена (ошибка 404) после ${scrapingConfig.maxRetries} попыток`;
    } else if (lastError.response.status === 503) {
      errorCategory = 'service_unavailable';
      errorMessage = `Сервис недоступен (ошибка 503) после ${scrapingConfig.maxRetries} попыток`;
    } else if (lastError.response.status === 401) {
      errorCategory = 'access_denied';
      errorMessage = `Доступ запрещен (ошибка 401) после ${scrapingConfig.maxRetries} попыток`;
    } else {
      errorCategory = `http_error_${lastError.response.status}`;
      errorMessage = `HTTP ошибка ${lastError.response.status} после ${scrapingConfig.maxRetries} попыток`;
    }
  } else if (lastError.code) {
    if (lastError.code === 'ECONNREFUSED') {
      errorCategory = 'connection_refused';
      errorMessage = `Соединение отклонено (ошибка ECONNREFUSED) после ${scrapingConfig.maxRetries} попыток`;
    } else if (lastError.code === 'ENOTFOUND') {
      errorCategory = 'dns_not_found';
      errorMessage = `DNS не найден (ошибка ENOTFOUND) после ${scrapingConfig.maxRetries} попыток`;
    } else if (lastError.code === 'ETIMEDOUT') {
      errorCategory = 'timeout';
      errorMessage = `Таймаут соединения (ошибка ETIMEDOUT) после ${scrapingConfig.maxRetries} попыток`;
    } else {
      errorCategory = `network_error_${lastError.code}`;
      errorMessage = `Сетевая ошибка ${lastError.code} после ${scrapingConfig.maxRetries} попыток`;
    }
  }

  // Отправляем уведомление о недоступности ресурса
  await notificationSystem.notifyResourceUnavailable(
    url,
    bankName,
    errorMessage,
    errorCategory
  );

  // Если обычные попытки не удались, пробуем использовать Puppeteer в качестве резервного варианта
  if (puppeteer) {
    await logger.info(`Все попытки не удались, пробуем использовать Puppeteer как резервный способ для: ${url}`, {
      url,
      method: 'puppeteer-fallback'
    });
    return await fetchWithPuppeteer(url);
  }

  // Если и Puppeteer не помог, пробуем использовать альтернативные источники
  await logger.info(`Все попытки не удались, пробуем использовать альтернативные источники для: ${url}`, { url, fallback: 'alternative-sources' });
  let result = await fetchFromAlternativeSources(url);

  // Если альтернативные источники не помогли, пробуем резервные методы
  if (!result) {
    await logger.info(`Альтернативные источники не помогли, пробуем резервные методы для: ${url}`, { url, fallback: 'backup-methods' });
    result = await BackupMethods.applyBackupMethods(url);
  }

  return result;
}

/**
 * Функция для получения данных из альтернативных источников
 */
async function fetchFromAlternativeSources(url) {
  await logger.info(`Поиск данных в альтернативных источниках для: ${url}`, { url, source: 'alternative-sources' });

  // Извлекаем информацию из URL
  const urlParts = new URL(url);
  const hostname = urlParts.hostname;
  const pathname = urlParts.pathname;

  // Определяем тип продукта из URL
  let productType = 'unknown';
  if (pathname.includes('card') || pathname.includes('karty')) {
    productType = 'cards';
  } else if (pathname.includes('deposit') || pathname.includes('vklad') || pathname.includes('savings')) {
    productType = 'deposits';
  } else if (pathname.includes('credit') || pathname.includes('kredit') || pathname.includes('loan')) {
    productType = 'loans';
  } else if (pathname.includes('ipoteka') || pathname.includes('mortgage')) {
    productType = 'mortgage';
  }

  // Попробуем получить данные из агрегаторов
  try {
    // Пробуем получить данные из кэшированной версии Google
    const googleCachedContent = await fetchFromGoogleCache(url);
    if (googleCachedContent) {
      await logger.info(`Данные получены из кэша Google для: ${url}`, { url, source: 'google-cache' });
      return googleCachedContent;
    }

    // Пробуем получить данные из Wayback Machine (архив интернета)
    const waybackContent = await fetchFromWaybackMachine(url);
    if (waybackContent) {
      await logger.info(`Данные получены из Wayback Machine для: ${url}`, { url, source: 'wayback-machine' });
      return waybackContent;
    }

    // Пробуем получить данные из банковских агрегаторов
    const aggregatorContent = await fetchFromBankAggregators(hostname, productType);
    if (aggregatorContent) {
      await logger.info(`Данные получены из агрегатора для: ${url}`, { url, source: 'bank-aggregator' });
      return aggregatorContent;
    }

    // Если ничего не помогло, пробуем использовать резервные методы
    await logger.info(`Пробуем использовать резервные методы для: ${url}`, { url, fallback: 'backup-methods' });
    const backupResult = await BackupMethods.applyBackupMethods(url);

    if (backupResult) {
      await logger.info(`Данные успешно получены с использованием резервных методов для: ${url}`, { url, method: 'backup-methods' });
      return backupResult;
    }

    await logger.warn(`Не удалось получить данные ни из альтернативных источников, ни с помощью резервных методов для: ${url}`, { url });

    // Извлекаем имя банка из URL для уведомления
    const bankName = extractBankNameFromUrl(url);

    // Отправляем уведомление о недоступности ресурса
    await notificationSystem.notifyResourceUnavailable(
      url,
      bankName,
      'Не удалось получить данные ни из альтернативных источников, ни с помощью резервных методов',
      'all_methods_failed'
    );

    return null;
  } catch (error) {
    await logger.error(`Ошибка при получении данных из альтернативных источников для ${url}:`, {
      url,
      errorMessage: error.message
    });
    return null;
  }
}

/**
 * Функция для получения данных из кэша Google
 */
async function fetchFromGoogleCache(url) {
  try {
    // Формируем URL для запроса кэша Google
    const googleCacheUrl = `http://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}`;

    const headers = {
      ...scrapingConfig.headers,
      'User-Agent': getRandomUserAgent()
    };

    const response = await axios.get(googleCacheUrl, {
      headers,
      timeout: scrapingConfig.timeout
    });

    // Убираем префиксы кэша Google из содержимого
    let content = response.data;

    // Убираем строки навигации Google кэша
    content = content.replace(/<div id="cttl">.*?<\/div>/gs, '');
    content = content.replace(/<div id="content">.*?<\/div>/gs, (match) => {
      return match.replace(/<b>.*?cached<\/b>/gi, '');
    });

    return content;
  } catch (error) {
    await logger.warn(`Не удалось получить данные из кэша Google для ${url}:`, {
      url,
      source: 'google-cache',
      errorMessage: error.message
    });
    return null;
  }
}

/**
 * Функция для получения данных из Wayback Machine
 */
async function fetchFromWaybackMachine(url) {
  try {
    // Получаем дату 30 дней назад для запроса архива
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const archiveDate = thirtyDaysAgo.toISOString().split('T')[0].replace(/-/g, '');

    const waybackUrl = `https://web.archive.org/web/${archiveDate}/${url}`;

    const headers = {
      ...scrapingConfig.headers,
      'User-Agent': getRandomUserAgent()
    };

    const response = await axios.get(waybackUrl, {
      headers,
      timeout: scrapingConfig.timeout
    });

    // Убираем элементы интерфейса Wayback Machine
    let content = response.data;
    content = content.replace(/<script[^>]*>.*?<\/script>/gs, ''); // Удаляем скрипты Wayback
    content = content.replace(/<nav.*?>.*?<\/nav>/gs, ''); // Удаляем навигацию Wayback
    content = content.replace(/<header.*?>.*?<\/header>/gs, ''); // Удаляем заголовок Wayback

    return content;
  } catch (error) {
    await logger.warn(`Не удалось получить данные из Wayback Machine для ${url}:`, {
      url,
      source: 'wayback-machine',
      errorMessage: error.message
    });
    return null;
  }
}

/**
 * Функция для получения данных из агрегаторов банковских продуктов
 */
async function fetchFromBankAggregators(bankHostname, productType) {
  try {
    // Определяем имя банка по домену
    let bankName = '';
    if (bankHostname.includes('vtb')) {
      bankName = 'vtb';
    } else if (bankHostname.includes('psb')) {
      bankName = 'psb';
    } else if (bankHostname.includes('rshb')) {
      bankName = 'rshb';
    } else if (bankHostname.includes('sovcombank')) {
      bankName = 'sovcombank';
    } else if (bankHostname.includes('domrf')) {
      bankName = 'domrf';
    } else if (bankHostname.includes('sberbank')) {
      bankName = 'sberbank';
    } else if (bankHostname.includes('gazprombank')) {
      bankName = 'gazprombank';
    } else if (bankHostname.includes('alfabank')) {
      bankName = 'alfabank';
    } else if (bankHostname.includes('mkb')) {
      bankName = 'mkb';
    } else if (bankHostname.includes('tbank')) {
      bankName = 'tbank';
    }

    if (!bankName) {
      await logger.warn(`Не удалось определить имя банка для домена: ${bankHostname}`, {
        hostname: bankHostname
      });
      return null;
    }

    // Формируем URL для запроса к агрегатору (например, banki.ru)
    let aggregatorUrl = '';
    switch (productType) {
      case 'cards':
        aggregatorUrl = `https://www.banki.ru/products/creditcards/catalogue/bank/${bankName}/`;
        break;
      case 'deposits':
        aggregatorUrl = `https://www.banki.ru/products/deposits/catalogue/bank/${bankName}/`;
        break;
      case 'loans':
        aggregatorUrl = `https://www.banki.ru/products/credits/bank/${bankName}/`;
        break;
      case 'mortgage':
        aggregatorUrl = `https://www.banki.ru/products/hypothec/bank/${bankName}/`;
        break;
      default:
        // Пробуем разные категории
        const urlsToTry = [
          `https://www.banki.ru/products/creditcards/catalogue/bank/${bankName}/`,
          `https://www.banki.ru/products/deposits/catalogue/bank/${bankName}/`,
          `https://www.banki.ru/products/credits/bank/${bankName}/`,
          `https://www.banki.ru/products/hypothec/bank/${bankName}/`
        ];

        for (const url of urlsToTry) {
          try {
            const headers = {
              ...scrapingConfig.headers,
              'User-Agent': getRandomUserAgent()
            };

            const response = await axios.get(url, {
              headers,
              timeout: scrapingConfig.timeout
            });

            if (response.status >= 200 && response.status < 300) {
              await logger.info(`Данные получены из агрегатора для банка ${bankName}`, {
                bankName,
                source: 'bank-aggregator'
              });
              return response.data;
            }
          } catch (error) {
            await logger.warn(`Не удалось получить данные из агрегатора: ${url}`, {
              url,
              errorMessage: error.message
            });
            continue;
          }
        }
        return null;
    }

    const headers = {
      ...scrapingConfig.headers,
      'User-Agent': getRandomUserAgent()
    };

    const response = await axios.get(aggregatorUrl, {
      headers,
      timeout: scrapingConfig.timeout
    });

    if (response.status >= 200 && response.status < 300) {
      await logger.info(`Данные получены из агрегатора для банка ${bankName}, тип продукта: ${productType}`, {
        bankName,
        productType,
        source: 'bank-aggregator'
      });
      return response.data;
    }

    return null;
  } catch (error) {
    await logger.warn(`Не удалось получить данные из агрегаторов для ${bankHostname}:`, {
      hostname: bankHostname,
      errorMessage: error.message
    });
    return null;
  }
}

/**
 * Функция для получения содержимого веб-страницы с использованием Puppeteer
 */
async function fetchWithPuppeteer(url) {
  if (!puppeteer) {
    await logger.error('Puppeteer не установлен, невозможно использовать headless-браузер для скрапинга');
    return null;
  }

  let browser;
  try {
    // Получаем прокси для использования в Puppeteer
    const proxy = getNextProxy();
    const puppeteerArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--lang=ru-RU',
      '--window-size=1920,1080'
    ];

    // Добавляем прокси к аргументам, если он доступен
    if (proxy) {
      // Извлекаем адрес и порт из строки прокси
      const proxyMatch = proxy.match(/^(https?:\/\/)?(.+)$/);
      if (proxyMatch) {
        puppeteerArgs.push(`--proxy-server=${proxyMatch[2]}`);
        await logger.info(`Используем прокси в Puppeteer: ${proxy}`, { proxy });
      }
    }

    // Запускаем браузер в headless режиме с дополнительными аргументами для обхода защиты
    browser = await puppeteer.launch({
      headless: true,
      args: puppeteerArgs
    });

    const page = await browser.newPage();

    // Устанавливаем случайный User-Agent
    await page.setUserAgent(getRandomUserAgent());

    // Устанавливаем дополнительные заголовки
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0'
    });

    // Установка вьюпорта для имитации реального браузера
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    // Переходим на страницу
    const response = await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: scrapingConfig.timeout
    });

    // Проверяем статус ответа
    const responseStatus = response.status();
    if (responseStatus >= 400) {
      await logger.error(`Puppeteer получил ошибку ${responseStatus} при доступе к ${url}`, {
        url,
        statusCode: responseStatus
      });

      // Проверяем, не является ли это CAPTCHA или другой защитой
      const pageContent = await page.content();
      if (pageContent.includes('captcha') ||
          pageContent.toLowerCase().includes('security check') ||
          pageContent.toLowerCase().includes('you are being rate limited') ||
          pageContent.includes('cloudflare') ||
          pageContent.includes('checking your browser')) {
        await logger.warn(`Обнаружена возможная защита (CAPTCHA, Cloudflare и т.д.) на ${url}`, {
          url,
          protectionType: 'captcha-or-firewall'
        });

        // Пробуем обработать CAPTCHA, если доступен соответствующий модуль
        return await handleCaptchaProtection(url, page, pageContent);
      }

      return null;
    }

    // Ждем некоторое время для полной загрузки страницы
    await page.waitForTimeout(2000);

    // Прокручиваем страницу, чтобы активировать динамическую загрузку контента
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // Ждем дополнительное время для загрузки динамического контента
    await page.waitForTimeout(2000);

    // Возвращаемся к верху страницы
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });

    // Получаем HTML содержимое страницы
    const html = await page.content();

    return html;
  } catch (error) {
    // Обрабатываем ошибку Puppeteer с помощью нового обработчика
    const errorInfo = await ErrorHandler.handlePuppeteerError(error, url);

    await logger.error(`Ошибка при скрапинге ${url} с использованием Puppeteer:`, {
      url,
      errorMessage: error.message,
      errorType: errorInfo.subtype
    });

    // Извлекаем имя банка из URL для уведомления
    const bankName = extractBankNameFromUrl(url);

    // Отправляем уведомление о недоступности ресурса
    await notificationSystem.notifyResourceUnavailable(
      url,
      bankName,
      `Ошибка при использовании Puppeteer: ${error.message}`,
      'puppeteer_error'
    );

    // В случае ошибки Puppeteer, пробуем использовать альтернативный подход
    if (error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.message.includes('ERR_NETWORK_CHANGED') ||
        error.message.includes('Target closed')) {
      await logger.warn(`Проблема с подключением при использовании Puppeteer для ${url}. Попробуем использовать обычный axios с другими заголовками.`, {
        url,
        errorType: 'connection-error'
      });

      // Попробуем снова с особыми заголовками
      try {
        const headers = {
          ...scrapingConfig.headers,
          'User-Agent': getRandomUserAgent(),
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': url
        };

        const response = await axios.get(url, {
          headers,
          timeout: scrapingConfig.timeout
        });

        return response.data;
      } catch (retryError) {
        await logger.error(`Повторная попытка с axios также не удалась для ${url}:`, {
          url,
          errorMessage: retryError.message
        });
        return null;
      }
    }

    return null;
  } finally {
    // Закрываем браузер
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Функция для обработки CAPTCHA и других защит
 */
async function handleCaptchaProtection(url, page, pageContent) {
  await logger.info(`Попытка обработать защиту на ${url}`, { url, protectionType: 'captcha' });

  // Проверяем, есть ли модуль для решения CAPTCHA
  try {
    // Пытаемся найти элементы CAPTCHA на странице
    const captchaSelectors = [
      '#captcha', '.captcha', '[src*="captcha"]',
      '.g-recaptcha', '#recaptcha', '.cf-browser-verification',
      '.challenge-form', '[action*="captcha"]'
    ];

    let captchaFound = false;
    for (const selector of captchaSelectors) {
      const element = await page.$(selector);
      if (element) {
        captchaFound = true;
        await logger.info(`Найден возможный элемент CAPTCHA: ${selector}`, {
          url,
          selector,
          protectionType: 'captcha-element-found'
        });

        // Пытаемся сделать скриншот CAPTCHA для дальнейшего анализа
        try {
          const captchaElement = await page.$(selector);
          if (captchaElement) {
            await captchaElement.screenshot({ path: `captcha_${Date.now()}.png` });
            await logger.info(`Сохранен скриншот CAPTCHA для анализа`, {
              url,
              screenshotPath: `captcha_${Date.now()}.png`
            });
          }
        } catch (e) {
          await logger.warn(`Не удалось сделать скриншот CAPTCHA: ${e.message}`, {
            url,
            errorMessage: e.message
          });
        }
      }
    }

    // Если найдена CAPTCHA, пробуем использовать сервис решения CAPTCHA
    if (captchaFound) {
      await logger.info(`Обнаружена CAPTCHA на ${url}, требуется ручное или автоматическое решение`, {
        url,
        protectionType: 'captcha-detected'
      });

      // В идеале, здесь должна быть интеграция с сервисом решения CAPTCHA
      // Пока что просто возвращаем null, но в будущем можно добавить интеграцию с сервисами
      // типа 2captcha, anti-captcha и т.д.

      // Проверяем, установлен ли модуль для решения CAPTCHA
      try {
        // Пример интеграции с сервисом решения CAPTCHA (нужно установить отдельно)
        // const captchaSolver = require('2captcha');
        // const solver = new captchaSolver(process.env.TWO_CAPTCHA_API_KEY);

        // Пока что просто возвращаем null, так как автоматическое решение CAPTCHA
        // требует дополнительных настроек и сервисов
        await logger.info('Для решения CAPTCHA требуется интеграция с сервисом решения CAPTCHA', {
          url,
          solutionRequired: 'captcha-service-integration'
        });
        return null;
      } catch (e) {
        await logger.warn('Модуль решения CAPTCHA не установлен или не настроен', {
          url,
          errorMessage: e.message
        });
        return null;
      }
    }

    // Если не найдена явная CAPTCHA, но есть признаки защиты,
    // пробуем подождать и повторить загрузку
    await logger.info('Обнаружены признаки защиты, но не найдена явная CAPTCHA. Пробуем подождать и повторить...', {
      url,
      action: 'wait-and-retry'
    });
    await page.waitForTimeout(5000); // Ждем 5 секунд

    // Повторяем загрузку страницы
    const response = await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: scrapingConfig.timeout
    });

    const responseStatus = response.status();
    if (responseStatus >= 200 && responseStatus < 300) {
      // Страница успешно загрузилась после ожидания
      const html = await page.content();
      await logger.info('Страница успешно загрузилась после ожидания', {
        url,
        statusCode: responseStatus
      });
      return html;
    } else {
      await logger.warn(`Повторная загрузка страницы не удалась. Статус: ${responseStatus}`, {
        url,
        statusCode: responseStatus
      });
      return null;
    }
  } catch (error) {
    await logger.error(`Ошибка при обработке защиты на ${url}:`, {
      url,
      errorMessage: error.message
    });
    return null;
  }
}


/**
 * Функция для сравнения полученной информации с существующими данными
 */
async function compareWithExistingData(scrapedData) {
  // Загрузка существующих данных из JSON файлов
  const dataPath = path.join(__dirname, '../data/pdfs');
  const existingData = await loadExistingProductData(dataPath);

  // Сравнение данных и выявление расхождений
  const comparisonResult = {
    outdatedProducts: [],
    newProducts: [],
    updatedProducts: [],
    productType: scrapedData.productType,
    url: scrapedData.url
  };

  // Логика сравнения будет реализована здесь
  // ...

  return comparisonResult;
}

/**
 * Загрузка существующих данных о продуктах
 */
async function loadExistingProductData(dataPath) {
  const results = [];

  try {
    const files = await fs.readdir(dataPath);

    for (const file of files) {
      const fullPath = path.join(dataPath, file);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        // Рекурсивная загрузка из поддиректорий
        const subDirResults = await loadExistingProductData(fullPath);
        results.push(...subDirResults);
      } else if (file.endsWith('.json')) {
        // Загрузка JSON файла
        const fileContent = await fs.readFile(fullPath, 'utf8');
        const productData = JSON.parse(fileContent);
        results.push(productData);
      }
    }
  } catch (error) {
    await logger.error(`Ошибка при загрузке существующих данных:`, { errorMessage: error.message });
  }

  return results;
}

/**
 * Основная функция сканирования банковских сайтов
 */
async function scanBankWebsites() {
  await logger.info('Начало сканирования банковских сайтов...');

  const results = [];

  for (const bank of scrapingConfig.banks) {
    await logger.info(`Сканирование банка: ${bank.name}`, { bank: bank.name });

    // Получаем URL для банка из динамической конфигурации
    const dynamicUrls = await urlManager.getBankUrls(bank.name);
    const allUrls = [...bank.productEndpoints]; // Начинаем с базовых URL

    // Добавляем динамические URL, если они есть
    if (dynamicUrls && dynamicUrls.length > 0) {
      allUrls.push(...dynamicUrls);
      await logger.info(`Добавлены динамические URL для банка ${bank.name}`, {
        bank: bank.name,
        dynamicUrlCount: dynamicUrls.length
      });
    }

    const bankResults = {
      bank: bank.name,
      scrapedData: [],
      comparison: [],
      timestamp: new Date().toISOString()
    };

    // Обработка всех URL для банка (базовые и динамические)
    for (const endpoint of allUrls) {
      // Формирование полного URL
      let fullUrl;
      if (endpoint.startsWith('http')) {
        fullUrl = endpoint; // Если URL уже полный
      } else {
        fullUrl = bank.url + endpoint; // Иначе добавляем к базовому URL
      }

      // Проверяем доступность URL перед скрапингом
      const isAvailable = await checkUrlAvailability(fullUrl);
      if (!isAvailable) {
        await logger.info(`URL недоступен, пропускаем: ${fullUrl}`, { url: fullUrl, bank: bank.name });

        // Отправляем уведомление о недоступности ресурса
        await notificationSystem.notifyResourceUnavailable(
          fullUrl,
          bank.name,
          'URL недоступен при проверке доступности',
          'not_found'
        );

        continue;
      }

      // Задержка между запросами для снижения нагрузки
      await new Promise(resolve => setTimeout(resolve, scrapingConfig.delayBetweenRequests));

      // Получение страницы продукта
      await logger.info(`Обработка: ${fullUrl}`, { url: fullUrl, bank: bank.name });
      const pageContent = await fetchWebPage(fullUrl);

      if (pageContent) {
        // Извлечение информации о продуктах
        const productInfo = extractProductInfo(pageContent, bank.name, fullUrl);

        // Сравнение с существующими данными
        const comparisonResult = await compareWithExistingData(productInfo);

        bankResults.scrapedData.push(productInfo);
        bankResults.comparison.push(comparisonResult);

        await logger.info(`Данные успешно получены с: ${fullUrl}`, {
          url: fullUrl,
          bank: bank.name,
          productType: productInfo.productType
        });
      } else {
        await logger.warn(`Не удалось получить данные с: ${fullUrl}`, { url: fullUrl, bank: bank.name });
      }
    }

    results.push(bankResults);
  }

  await logger.info('Завершено сканирование банковских сайтов');
  return results;
}

/**
 * Функция для сохранения результатов сканирования
 */
async function saveScanResults(results) {
  const outputPath = path.join(__dirname, '../data/scraping-results.json');
  const outputData = {
    scanDate: new Date().toISOString(),
    results: results
  };

  try {
    await fs.writeFile(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
    await logger.info(`Результаты сканирования сохранены`, { outputPath, resultCount: results.length });
  } catch (error) {
    await logger.error('Ошибка при сохранении результатов:', { error: error.message, outputPath });
  }
}

/**
 * Запуск сканирования
 */
async function runScraping() {
  try {
    await logger.info('Запуск процесса сканирования банковских сайтов');
    const results = await scanBankWebsites();
    await saveScanResults(results);

    // Вывод статистики
    await logger.info('Статистика сканирования:');
    for (const result of results) {
      await logger.info(`${result.bank}:`, { bank: result.bank });
      await logger.info(`  - Обработано страниц: ${result.scrapedData.length}`, {
        bank: result.bank,
        processedPages: result.scrapedData.length
      });

      // Подсчет продуктов по типам
      const stats = {};
      for (const data of result.scrapedData) {
        if (!stats[data.productType]) {
          stats[data.productType] = 0;
        }
        stats[data.productType]++;
      }

      for (const [type, count] of Object.entries(stats)) {
        await logger.info(`    - ${type}: ${count} страниц`, {
          bank: result.bank,
          productType: type,
          count
        });
      }
    }

    await logger.info('Процесс сканирования завершен успешно');
    return results;
  } catch (error) {
    await logger.error('Ошибка при выполнении сканирования:', { error: error.message });
    throw error;
  }
}

// Если файл запускается напрямую
if (require.main === module) {
  runScraping().catch(async (error) => {
    await logger.error('Ошибка при выполнении скрипта скрапинга', { errorMessage: error.message });
    process.exit(1);
  });
}

/**
 * Извлекает имя банка из URL
 * @param {string} url - URL для извлечения имени банка
 * @returns {string} Имя банка
 */
function extractBankNameFromUrl(url) {
  const urlLower = url.toLowerCase();

  if (urlLower.includes('vtb')) return 'vtb';
  if (urlLower.includes('psb')) return 'psb';
  if (urlLower.includes('rshb')) return 'rshb';
  if (urlLower.includes('sovcombank') || urlLower.includes('banki.ru')) return 'sovcombank'; // Совкомбанк теперь использует агрегатор
  if (urlLower.includes('domrf')) return 'domrf';
  if (urlLower.includes('sberbank')) return 'sberbank';
  if (urlLower.includes('gazprombank')) return 'gazprombank';
  if (urlLower.includes('alfabank')) return 'alfabank';
  if (urlLower.includes('mkb')) return 'mkb';
  if (urlLower.includes('tbank')) return 'tbank';

  // Если не удалось определить, возвращаем hostname
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '').split('.')[0];
  } catch (e) {
    return 'unknown';
  }
}

module.exports = {
  scanBankWebsites,
  runScraping,
  fetchWebPage,
  extractBankNameFromUrl
};