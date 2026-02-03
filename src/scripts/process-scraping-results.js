/**
 * Скрипт для обработки результатов скрапинга и сохранения в JSON-файлы
 */

const fs = require('fs').promises;
const path = require('path');
const { runScraping } = require('./bank-scraper');

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
        product.version = product.version || {
          date: today,
          source: scrapedData.url,
          updatedBy: 'scraper'
        };
        product.validFrom = product.validFrom || today;
        product.status = product.status || 'active';
        product.meta = product.meta || {
          title: product.title,
          description: product.shortDescription || product.title
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
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Удаляем специальные символы
    .replace(/\s+/g, '-') // Заменяем пробелы на дефисы
    .replace(/^-+|-+$/g, ''); // Удаляем дефисы в начале и конце
}

/**
 * Запуск скрапинга и сохранение результатов
 */
async function runScrapingAndSave() {
  try {
    console.log('Запуск скрапинга банковских продуктов...');
    const results = await runScraping();
    
    console.log('\nСохранение результатов в JSON-файлы...');
    await saveScrapedProducts(results);
    
    console.log('Скрапинг и сохранение завершены.');
    return results;
  } catch (error) {
    console.error('Ошибка при выполнении скрапинга:', error.message);
    throw error;
  }
}

// Если файл запускается напрямую
if (require.main === module) {
  runScrapingAndSave().catch(console.error);
}

module.exports = {
  runScrapingAndSave,
  saveScrapedProducts
};