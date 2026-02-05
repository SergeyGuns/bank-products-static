/**
 * Скрипт для обработки результатов скрапинга и сохранения в JSON-файлы
 */

const fs = require('fs').promises;
const path = require('path');
const { runScraping } = require('./bank-scraper');
const { fetchProductsViaApi, checkApiAvailability, fetchProductsViaAggregator, fetchSovcombankProductsViaDVIZH } = require('./api-fetcher');

/**
 * Сохранение продуктов в JSON-файлы в соответствии со структурой проекта
 */
async function saveScrapedProducts(results) {
  const baseDir = path.join(__dirname, '../data/pdfs');
  
  for (const bankResult of results) {
    const bankName = bankResult.bank;
    
    for (const scrapedData of bankResult.scrapedData) {
      const productType = scrapedData.productType;
      
      // Пропускаем неизвестные типы продуктов
      if (productType === 'unknown' || productType === 'cards') continue;
      
      // Определяем директорию для сохранения
      const dirPath = path.join(baseDir, productType, bankName);
      
      // Создаем директорию, если она не существует
      await fs.mkdir(dirPath, { recursive: true });
      
      // Сохраняем каждый продукт в отдельный файл
      for (const product of scrapedData.products) {
        // Генерируем имя файла в формате [bank-name]-[product-name]-[YYYY-MM-DD].json
        const today = new Date().toISOString().split('T')[0];
        const fileName = `${bankName}-${normalizeString(product.title)}-${today}.json`;
        const filePath = path.join(dirPath, fileName);
        
        // Добавляем обязательные поля, если они отсутствуют
        product.id = product.id || `${bankName}-${Date.now()}`;
        product.type = product.type || productType || 'unknown';
        product.bankName = product.bankName || bankName;
        product.version = product.version || {
          date: today,
          source: scrapedData.url,
          updatedBy: 'scraper'
        };
        product.validFrom = product.validFrom || today;
        product.status = product.status || 'active';
        product.meta = product.meta || {
          title: product.title || 'Unknown Product',
          description: product.shortDescription || product.description || product.title || 'No description available'
        };
        
        // Сохраняем продукт в JSON-файл
        try {
          await fs.writeFile(filePath, JSON.stringify(product, null, 2), 'utf8');
          console.log(`Сохранен продукт: ${filePath}`);
        } catch (error) {
          console.error(`Ошибка при сохранении продукта ${filePath}:`, error.message);
        }
      }
    }
  }
}

/**
 * Нормализация строки для использования в именах файлов
 */
function normalizeString(str) {
  if (!str) {
    return 'unknown'; // Возвращаем 'unknown' если строка отсутствует
  }

  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Удаляем специальные символы
    .replace(/\s+/g, '-') // Заменяем пробелы на дефисы
    .replace(/^-+|-+$/g, ''); // Удаляем дефисы в начале и конце
}

/**
 * Запуск получения данных (через API или скрапинг) и сохранение результатов
 */
async function runScrapingAndSave() {
  try {
    console.log('Запуск получения данных о банковских продуктах...');

    // Получаем данные через API, где это возможно
    const apiResults = await fetchViaApi();

    // Запускаем веб-скрапинг для оставшихся банков
    const scrapingResults = await runScraping();

    // Объединяем результаты
    const results = [...apiResults, ...scrapingResults];

    console.log('\nСохранение результатов в JSON-файлы...');
    await saveScrapedProducts(results);

    console.log('Получение данных и сохранение завершены.');
    return results;
  } catch (error) {
    console.error('Ошибка при выполнении получения данных:', error.message);
    throw error;
  }
}

/**
 * Получение данных через API и агрегаторы
 */
async function fetchViaApi() {
  const results = [];

  // Список банков, для которых будем пытаться получить данные через API
  const banks = ['vtb', 'mkb', 'tbank', 'domrf', 'sovcombank'];

  for (const bankName of banks) {
    console.log(`Проверка доступности API для банка: ${bankName}`);

    const isApiAvailable = await checkApiAvailability(bankName);

    if (isApiAvailable) {
      console.log(`Получение данных через API для банка: ${bankName}`);

      // Пробуем получить данные для разных типов продуктов
      const productTypes = ['cards', 'deposits', 'loans', 'mortgages'];

      for (const productType of productTypes) {
        const data = await fetchProductsViaApi(bankName, productType);

        if (data) {
          // Получаем URL для логирования (пока используем заглушку, так как apiConfig не доступен напрямую)
          const apiUrl = `API://${bankName}/${productType}`;

          // Преобразуем полученные данные в формат, совместимый с результатами скрапинга
          const apiResult = {
            bank: bankName,
            scrapedData: [{
              bankName,
              productType,
              url: apiUrl,
              products: Array.isArray(data) ? data : [data], // Если данные не массив, оборачиваем в массив
              lastScraped: new Date().toISOString()
            }],
            comparison: [],
            timestamp: new Date().toISOString()
          };

          results.push(apiResult);
        }
      }
    } else {
      console.log(`API для банка ${bankName} недоступно, пробуем использовать агрегаторы`);

      // Для Совкомбанка используем специфический источник (платформа ДВИЖ)
      if (bankName === 'sovcombank') {
        const dvizhData = await fetchSovcombankProductsViaDVIZH();
        if (dvizhData) {
          const dvizhResult = {
            bank: bankName,
            scrapedData: [{
              bankName,
              productType: 'mortgages', // ДВИЖ主要用于 ипотеке
              url: 'DVIZH://platform/mortgage',
              products: Array.isArray(dvizhData) ? dvizhData : [dvizhData],
              lastScraped: new Date().toISOString()
            }],
            comparison: [],
            timestamp: new Date().toISOString()
          };

          results.push(dvizhResult);
        }
      } else {
        // Для других банков пробуем использовать агрегаторы
        const productTypes = ['cards', 'deposits', 'loans', 'mortgages'];

        for (const productType of productTypes) {
          const aggregatorData = await fetchProductsViaAggregator(bankName, productType);

          if (aggregatorData) {
            const aggregatorResult = {
              bank: bankName,
              scrapedData: [{
                bankName,
                productType,
                url: `AGGREGATOR://${bankName}/${productType}`,
                products: Array.isArray(aggregatorData) ? aggregatorData : [aggregatorData],
                lastScraped: new Date().toISOString()
              }],
              comparison: [],
              timestamp: new Date().toISOString()
            };

            results.push(aggregatorResult);
          }
        }
      }
    }
  }

  return results;
}

// Если файл запускается напрямую
if (require.main === module) {
  runScrapingAndSave().catch(console.error);
}

module.exports = {
  runScrapingAndSave,
  saveScrapedProducts
};