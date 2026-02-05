#!/usr/bin/env node

/**
 * Скрипт для тестирования изменений на каждом банке
 * Использование: node test-bank-changes.js [bank-name]
 * Примеры:
 *   node test-bank-changes.js vtb          # Тестировать только ВТБ
 *   node test-bank-changes.js              # Тестировать все банки
 */

const { scanBankWebsites } = require('./bank-scraper');
const logger = require('./logger');

async function runTests(targetBank = null) {
  try {
    console.log('🚀 Запуск тестирования изменений на банковских сайтах...');
    
    // Получаем результаты сканирования
    const results = await scanBankWebsites();
    
    console.log('\n📊 Результаты тестирования:');
    
    for (const result of results) {
      // Если указан конкретный банк для тестирования, пропускаем остальные
      if (targetBank && result.bank !== targetBank) {
        continue;
      }
      
      console.log(`\n🏦 Банк: ${result.bank}`);
      console.log(`   - Обработано страниц: ${result.scrapedData.length}`);
      
      // Подсчет продуктов по типам
      const stats = {};
      for (const data of result.scrapedData) {
        if (!stats[data.productType]) {
          stats[data.productType] = 0;
        }
        stats[data.productType]++;
      }
      
      if (Object.keys(stats).length > 0) {
        console.log('   - Типы продуктов:');
        for (const [type, count] of Object.entries(stats)) {
          console.log(`     * ${type}: ${count} страниц`);
        }
      } else {
        console.log('   - Продукты не найдены');
      }
      
      // Проверяем, были ли ошибки
      const hasErrors = result.scrapedData.some(data => data.error);
      if (hasErrors) {
        console.log('   - ❌ Обнаружены ошибки при обработке некоторых страниц');
        result.scrapedData
          .filter(data => data.error)
          .forEach(data => {
            console.log(`     * Ошибка при обработке ${data.url}: ${data.error}`);
          });
      } else {
        console.log('   - ✅ Ошибок не обнаружено');
      }
    }
    
    // Если был указан конкретный банк, но не найден
    if (targetBank && !results.some(r => r.bank === targetBank)) {
      console.log(`\n❌ Банк ${targetBank} не найден в конфигурации`);
    }
    
    console.log('\n✅ Тестирование завершено');
    
    // Возвращаем результаты для возможного дополнительного анализа
    return results;
  } catch (error) {
    console.error(`❌ Ошибка при тестировании: ${error.message}`);
    await logger.error(`Ошибка при тестировании изменений на банковских сайтах: ${error.message}`, { 
      errorMessage: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Основная функция
async function main() {
  try {
    const args = process.argv.slice(2);
    const targetBank = args[0]; // Необязательный аргумент - конкретный банк для тестирования
    
    if (targetBank) {
      console.log(`🔍 Тестирование изменений для банка: ${targetBank}`);
    } else {
      console.log('🔍 Тестирование изменений для всех банков');
    }
    
    await runTests(targetBank);
  } catch (error) {
    console.error(`\n❌ Тестирование завершилось с ошибкой: ${error.message}`);
    process.exit(1);
  }
}

// Запускаем основную функцию
main().catch(error => {
  console.error(`Необработанная ошибка: ${error.message}`);
  process.exit(1);
});