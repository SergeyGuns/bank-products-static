/**
 * Скрипт для очистки JSON-файлов от комментариев и других невалидных элементов
 */

const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const glob = promisify(require('glob'));

/**
 * Функция для очистки содержимого JSON-файла от комментариев
 */
function cleanJsonContent(content) {
  // Удаляем строки, содержащие комментарии JavaScript
  let cleaned = content.replace(/\/\/[^\n\r]*/g, '');
  
  // Удаляем многострочные комментарии
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Удаляем строки, содержащие только комментарии или ненужные элементы
  const lines = cleaned.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmedLine = line.trim();
    // Исключаем строки, которые являются комментариями или содержат ненужные элементы
    return !trimmedLine.startsWith('//') && 
           !trimmedLine.includes('// Вклады') && 
           !trimmedLine.includes('// Кредиты') && 
           !trimmedLine.includes('// Ипотека') &&
           !trimmedLine.includes('// Карты') &&
           trimmedLine !== '' && 
           trimmedLine !== ',' && 
           trimmedLine !== '{' && 
           trimmedLine !== '}';
  });
  
  return filteredLines.join('\n');
}

/**
 * Функция для проверки валидности JSON
 */
function isValidJson(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
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
 * Очистка всех JSON-файлов в директории
 */
async function cleanJsonFiles(directory) {
  // Находим все JSON-файлы в директории рекурсивно
  const jsonFiles = await findAllJsonFiles(directory);

  console.log(`Найдено ${jsonFiles.length} JSON-файлов для очистки`);

  let cleanedCount = 0;
  let invalidCount = 0;

  for (const file of jsonFiles) {
    try {
      const content = await fs.readFile(file, 'utf8');

      // Проверяем, является ли файл валидным JSON
      if (isValidJson(content)) {
        continue; // Файл уже валиден, пропускаем
      }

      // Пробуем очистить содержимое
      const cleanedContent = cleanJsonContent(content);

      // Проверяем, стал ли файл валидным после очистки
      if (isValidJson(cleanedContent)) {
        await fs.writeFile(file, cleanedContent, 'utf8');
        console.log(`Очищен файл: ${file}`);
        cleanedCount++;
      } else {
        console.log(`Не удалось очистить файл (остался невалидным): ${file}`);
        invalidCount++;
      }
    } catch (error) {
      console.error(`Ошибка при обработке файла ${file}:`, error.message);
    }
  }

  console.log(`\nОчистка завершена:`);
  console.log(`- Очищено файлов: ${cleanedCount}`);
  console.log(`- Осталось невалидных: ${invalidCount}`);
}

// Запуск очистки
async function runCleanup() {
  const dataDir = path.join(__dirname, '../data/pdfs');
  console.log(`Запуск очистки JSON-файлов в директории: ${dataDir}\n`);
  
  await cleanJsonFiles(dataDir);
}

// Если файл запускается напрямую
if (require.main === module) {
  runCleanup().catch(console.error);
}

module.exports = {
  cleanJsonContent,
  isValidJson,
  cleanJsonFiles
};