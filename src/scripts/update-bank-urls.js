#!/usr/bin/env node

/**
 * Скрипт для ручного обновления URL банков
 * Использование: node update-bank-urls.js <bank-name> <url1> [url2] [url3] ...
 */

const urlManager = require('./url-manager');
const logger = require('./logger');

async function updateBankUrls() {
  try {
    // Получаем аргументы командной строки
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.log('Использование: node update-bank-urls.js <bank-name> <url1> [url2] [url3] ...');
      console.log('Пример: node update-bank-urls.js vtb https://vtb.ru/cards https://vtb.ru/loans');
      process.exit(1);
    }
    
    const bankName = args[0];
    const urls = args.slice(1);
    
    console.log(`Обновление URL для банка: ${bankName}`);
    console.log(`Новые URL: ${urls.join(', ')}`);
    
    // Обновляем URL для банка
    const success = await urlManager.updateBankUrls(bankName, urls);
    
    if (success) {
      console.log(`✅ URL для банка ${bankName} успешно обновлены!`);
      
      // Выводим обновленные URL
      const updatedUrls = await urlManager.getBankUrls(bankName);
      console.log(`📋 Обновленные URL для ${bankName}:`);
      updatedUrls.forEach((url, index) => {
        console.log(`   ${index + 1}. ${url}`);
      });
    } else {
      console.log(`❌ Ошибка при обновлении URL для банка ${bankName}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Ошибка при обновлении URL: ${error.message}`);
    await logger.error(`Ошибка при обновлении URL: ${error.message}`, { errorMessage: error.message });
    process.exit(1);
  }
}

async function addUrlToBank() {
  try {
    // Получаем аргументы командной строки
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.log('Использование: node update-bank-urls.js --add <bank-name> <url>');
      console.log('Пример: node update-bank-urls.js --add vtb https://vtb.ru/new-url');
      process.exit(1);
    }
    
    const bankName = args[1];
    const newUrl = args[2];
    
    console.log(`Добавление URL для банка: ${bankName}`);
    console.log(`Новый URL: ${newUrl}`);
    
    // Добавляем URL для банка
    const success = await urlManager.addUrlToBank(bankName, newUrl);
    
    if (success) {
      console.log(`✅ URL ${newUrl} успешно добавлен для банка ${bankName}!`);
      
      // Выводим обновленные URL
      const updatedUrls = await urlManager.getBankUrls(bankName);
      console.log(`📋 Обновленные URL для ${bankName}:`);
      updatedUrls.forEach((url, index) => {
        console.log(`   ${index + 1}. ${url}`);
      });
    } else {
      console.log(`❌ Ошибка при добавлении URL для банка ${bankName}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Ошибка при добавлении URL: ${error.message}`);
    await logger.error(`Ошибка при добавлении URL: ${error.message}`, { errorMessage: error.message });
    process.exit(1);
  }
}

async function removeUrlFromBank() {
  try {
    // Получаем аргументы командной строки
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.log('Использование: node update-bank-urls.js --remove <bank-name> <url>');
      console.log('Пример: node update-bank-urls.js --remove vtb https://vtb.ru/old-url');
      process.exit(1);
    }
    
    const bankName = args[1];
    const urlToRemove = args[2];
    
    console.log(`Удаление URL для банка: ${bankName}`);
    console.log(`URL для удаления: ${urlToRemove}`);
    
    // Удаляем URL для банка
    const success = await urlManager.removeUrlFromBank(bankName, urlToRemove);
    
    if (success) {
      console.log(`✅ URL ${urlToRemove} успешно удален для банка ${bankName}!`);
      
      // Выводим обновленные URL
      const updatedUrls = await urlManager.getBankUrls(bankName);
      console.log(`📋 Обновленные URL для ${bankName}:`);
      updatedUrls.forEach((url, index) => {
        console.log(`   ${index + 1}. ${url}`);
      });
    } else {
      console.log(`❌ Ошибка при удалении URL для банка ${bankName}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Ошибка при удалении URL: ${error.message}`);
    await logger.error(`Ошибка при удалении URL: ${error.message}`, { errorMessage: error.message });
    process.exit(1);
  }
}

async function listBankUrls() {
  try {
    // Получаем аргументы командной строки
    const args = process.argv.slice(2);
    
    if (args.length < 1 || args[0] !== '--list') {
      console.log('Использование: node update-bank-urls.js --list [bank-name]');
      console.log('Пример 1 (все банки): node update-bank-urls.js --list');
      console.log('Пример 2 (конкретный банк): node update-bank-urls.js --list vtb');
      process.exit(1);
    }
    
    const bankName = args[1]; // Может быть undefined
    
    if (bankName) {
      // Выводим URL для конкретного банка
      const urls = await urlManager.getBankUrls(bankName);
      
      if (urls.length > 0) {
        console.log(`📋 URL для банка ${bankName}:`);
        urls.forEach((url, index) => {
          console.log(`   ${index + 1}. ${url}`);
        });
      } else {
        console.log(`ℹ️  У банка ${bankName} нет зарегистрированных URL`);
      }
    } else {
      // Выводим все банки с их URL
      const allBanks = await urlManager.getAllBanksWithUrls();
      
      if (allBanks.length > 0) {
        console.log('📋 Все банки с их URL:');
        allBanks.forEach((bank, index) => {
          console.log(`\n${index + 1}. ${bank.name}:`);
          bank.urls.forEach((url, urlIndex) => {
            console.log(`   ${urlIndex + 1}. ${url}`);
          });
        });
      } else {
        console.log('ℹ️  Нет зарегистрированных банков с URL');
      }
    }
  } catch (error) {
    console.error(`❌ Ошибка при выводе URL: ${error.message}`);
    await logger.error(`Ошибка при выводе URL: ${error.message}`, { errorMessage: error.message });
    process.exit(1);
  }
}

// Определяем действие на основе аргументов
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Использование:');
    console.log('  Обновить URL: node update-bank-urls.js <bank-name> <url1> [url2] ...');
    console.log('  Добавить URL: node update-bank-urls.js --add <bank-name> <url>');
    console.log('  Удалить URL: node update-bank-urls.js --remove <bank-name> <url>');
    console.log('  Показать URL: node update-bank-urls.js --list [bank-name]');
    process.exit(0);
  }
  
  if (args[0] === '--add') {
    await addUrlToBank();
  } else if (args[0] === '--remove') {
    await removeUrlFromBank();
  } else if (args[0] === '--list') {
    await listBankUrls();
  } else {
    await updateBankUrls();
  }
}

// Запускаем основную функцию
main().catch(async (error) => {
  console.error(`❌ Необработанная ошибка: ${error.message}`);
  await logger.error(`Необработанная ошибка в скрипте обновления URL: ${error.message}`, { errorMessage: error.message });
  process.exit(1);
});