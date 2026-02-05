/**
 * Скрипт для восстановления правильной структуры JSON-файлов, созданных скрапером
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Функция для извлечения только валидной части из содержимого файла
 */
function extractValidJsonStructure(content) {
  try {
    // Пробуем просто распарсить весь контент
    const parsed = JSON.parse(content);
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    // Если не удалось распарсить весь контент, пробуем найти и извлечь валидный JSON
    // внутри содержимого
    
    // Ищем начало JSON-объекта
    const startIndex = content.indexOf('{');
    if (startIndex === -1) {
      return null;
    }
    
    // Ищем конец JSON-объекта
    let braceCount = 0;
    let endIndex = -1;
    
    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === '{') {
        braceCount++;
      } else if (content[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i + 1;
          break;
        }
      }
    }
    
    if (endIndex === -1) {
      return null;
    }
    
    const jsonString = content.substring(startIndex, endIndex);
    
    try {
      // Проверяем, является ли извлеченная строка валидным JSON
      JSON.parse(jsonString);
      return jsonString;
    } catch (e) {
      // Если нет, пробуем извлечь только основные поля
      return extractBasicStructure(jsonString);
    }
  }
}

/**
 * Функция для извлечения базовой структуры из частично валидного JSON
 */
function extractBasicStructure(content) {
  // Ищем основные поля JSON-объекта
  const idMatch = content.match(/"id"\s*:\s*"([^"]+)"/);
  const typeMatch = content.match(/"type"\s*:\s*"([^"]+)"/);
  const bankNameMatch = content.match(/"bankName"\s*:\s*"([^"]+)"/);
  const titleMatch = content.match(/"title"\s*:\s*"([^"]+)"/);
  
  if (idMatch && typeMatch && bankNameMatch && titleMatch) {
    // Создаем базовый объект с найденными полями
    const obj = {
      id: idMatch[1],
      type: typeMatch[1],
      bankName: bankNameMatch[1],
      title: titleMatch[1],
      version: {
        date: new Date().toISOString().split('T')[0],
        source: 'scraping-recovery',
        updatedBy: 'system'
      },
      validFrom: new Date().toISOString().split('T')[0],
      status: 'active'
    };
    
    return JSON.stringify(obj, null, 2);
  }
  
  return null;
}

/**
 * Рекурсивный поиск всех JSON-файлов в директории
 */
async function findAllJsonFiles(dir) {
  const results = [];
  const items = await fs.readdir(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      // Рекурсивно обрабатываем поддиректории
      const subDirResults = await findAllJsonFiles(fullPath);
      results.push(...subDirResults);
    } else if (item.isFile() && path.extname(item.name) === '.json') {
      results.push(fullPath);
    }
  }
  
  return results;
}

/**
 * Восстановление структуры всех JSON-файлов в директории
 */
async function restoreJsonStructure(directory) {
  // Находим все JSON-файлы в директории рекурсивно
  const jsonFiles = await findAllJsonFiles(directory);
  
  console.log(`Найдено ${jsonFiles.length} JSON-файлов для восстановления`);
  
  let restoredCount = 0;
  let failedCount = 0;
  
  for (const file of jsonFiles) {
    try {
      const content = await fs.readFile(file, 'utf8');
      
      // Пробуем восстановить валидную структуру
      const restoredContent = extractValidJsonStructure(content);
      
      if (restoredContent) {
        await fs.writeFile(file, restoredContent, 'utf8');
        console.log(`Восстановлен файл: ${file}`);
        restoredCount++;
      } else {
        console.log(`Не удалось восстановить файл: ${file}`);
        failedCount++;
      }
    } catch (error) {
      console.error(`Ошибка при обработке файла ${file}:`, error.message);
      failedCount++;
    }
  }
  
  console.log(`\nВосстановление завершено:`);
  console.log(`- Восстановлено файлов: ${restoredCount}`);
  console.log(`- Не удалось восстановить: ${failedCount}`);
}

// Запуск восстановления
async function runRecovery() {
  const dataDir = path.join(__dirname, '../data/pdfs');
  console.log(`Запуск восстановления JSON-файлов в директории: ${dataDir}\n`);
  
  await restoreJsonStructure(dataDir);
}

// Если файл запускается напрямую
if (require.main === module) {
  runRecovery().catch(console.error);
}

module.exports = {
  extractValidJsonStructure,
  extractBasicStructure,
  restoreJsonStructure
};