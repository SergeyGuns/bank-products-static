/**
 * Скрипт для автоматического сканирования официальных сайтов банков
 * с целью проверки актуальности информации о банковских продуктах
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { extractProductInfo } = require('./product-parser');

// Конфигурация для скрапинга
const scrapingConfig = {
  // Таймаут для запросов
  timeout: 15000,

  // Заголовки для имитации реального браузера
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },

  // Задержка между запросами (в миллисекундах)
  delayBetweenRequests: 2000,
  
  // Список банков и их веб-сайтов
  banks: [
    {
      name: 'sberbank',
      url: 'https://www.sberbank.ru',
      productEndpoints: [
        // Конечные точки для получения информации о продуктах
        '/ru/person/common/creditCards',
        '/ru/person/common/debitCards',
        '/ru/person/common/loans',
        '/ru/person/common/mortgage',
        '/ru/person/common/deposits'
      ]
    },
    {
      name: 'vtb',
      url: 'https://www.vtb.ru',
      productEndpoints: [
        'https://www.vtb.ru/personal/cards/',
        'https://www.vtb.ru/personal/credits/',
        'https://www.vtb.ru/personal/deposits/',
        'https://www.vtb.ru/personal/ipoteka/'
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
        'https://psb.ru/personal/cards/',
        'https://psb.ru/personal/loans/',
        'https://psb.ru/personal/deposits/',
        'https://psb.ru/personal/ipoteka/'
      ]
    },
    {
      name: 'roselhozbank',
      url: 'https://rshb.ru',
      productEndpoints: [
        'https://rshb.ru/personal/cards/',
        'https://rshb.ru/personal/loans/',
        'https://rshb.ru/personal/deposits/',
        'https://rshb.ru/personal/ipoteka/'
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
        'https://sovcombank.ru/personal/cards/',
        'https://sovcombank.ru/personal/loans/',
        'https://sovcombank.ru/personal/deposits/',
        'https://sovcombank.ru/personal/ipoteka/'
      ]
    },
    {
      name: 'tbank',
      url: 'https://www.tbank.ru',
      productEndpoints: [
        'https://www.tbank.ru/personal/cards/',
        'https://www.tbank.ru/personal/loans/',
        'https://www.tbank.ru/personal/deposits/',
        'https://www.tbank.ru/personal/ipoteka/'
      ]
    },
    {
      name: 'domrf',
      url: 'https://dom.rf',
      productEndpoints: [
        'https://dom.rf/personal/ipoteka/',
        'https://dom.rf/personal/credits/',
        'https://dom.rf/personal/vklady/'
      ]
    }
  ]
};

/**
 * Функция для получения содержимого веб-страницы
 */
async function fetchWebPage(url) {
  try {
    const response = await axios.get(url, {
      headers: scrapingConfig.headers,
      timeout: scrapingConfig.timeout
    });
    
    return response.data;
  } catch (error) {
    console.error(`Ошибка при получении страницы ${url}:`, error.message);
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
    console.error(`Ошибка при загрузке существующих данных:`, error.message);
  }
  
  return results;
}

/**
 * Основная функция сканирования банковских сайтов
 */
async function scanBankWebsites() {
  console.log('Начало сканирования банковских сайтов...');

  const results = [];

  for (const bank of scrapingConfig.banks) {
    console.log(`Сканирование банка: ${bank.name}`);

    const bankResults = {
      bank: bank.name,
      scrapedData: [],
      comparison: [],
      timestamp: new Date().toISOString()
    };

    // Обработка всех конечных точек для банка
    for (const endpoint of bank.productEndpoints) {
      // Задержка между запросами для снижения нагрузки
      await new Promise(resolve => setTimeout(resolve, scrapingConfig.delayBetweenRequests));

      // Формирование полного URL
      let fullUrl;
      if (endpoint.startsWith('http')) {
        fullUrl = endpoint; // Если URL уже полный
      } else {
        fullUrl = bank.url + endpoint; // Иначе добавляем к базовому URL
      }

      // Получение страницы продукта
      console.log(`  Обработка: ${fullUrl}`);
      const pageContent = await fetchWebPage(fullUrl);

      if (pageContent) {
        // Извлечение информации о продуктах
        const productInfo = extractProductInfo(pageContent, bank.name, fullUrl);

        // Сравнение с существующими данными
        const comparisonResult = await compareWithExistingData(productInfo);

        bankResults.scrapedData.push(productInfo);
        bankResults.comparison.push(comparisonResult);
      } else {
        console.log(`  Не удалось получить данные с: ${fullUrl}`);
      }
    }

    results.push(bankResults);
  }

  console.log('Завершено сканирование банковских сайтов');
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
    console.log(`Результаты сканирования сохранены в ${outputPath}`);
  } catch (error) {
    console.error('Ошибка при сохранении результатов:', error.message);
  }
}

/**
 * Запуск сканирования
 */
async function runScraping() {
  try {
    const results = await scanBankWebsites();
    await saveScanResults(results);
    
    // Вывод статистики
    console.log('\nСтатистика сканирования:');
    results.forEach(result => {
      console.log(`${result.bank}:`);
      console.log(`  - Обработано страниц: ${result.scrapedData.length}`);

      // Подсчет продуктов по типам
      const stats = {};
      result.scrapedData.forEach(data => {
        if (!stats[data.productType]) {
          stats[data.productType] = 0;
        }
        stats[data.productType]++;
      });

      Object.entries(stats).forEach(([type, count]) => {
        console.log(`    - ${type}: ${count} страниц`);
      });
    });
    
    return results;
  } catch (error) {
    console.error('Ошибка при выполнении сканирования:', error.message);
    throw error;
  }
}

// Если файл запускается напрямую
if (require.main === module) {
  runScraping().catch(console.error);
}

module.exports = {
  scanBankWebsites,
  runScraping,
  fetchWebPage
};