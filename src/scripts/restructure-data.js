const fs = require('fs').promises;
const path = require('path');

// Функция для нормализации названия банка для использования в именах файлов и директорий
function normalizeBankName(bankName) {
  // Преобразуем название банка в формат, подходящий для имен файлов
  return bankName
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]/gi, '-') // заменяем все символы кроме букв и цифр на дефис
    .replace(/-+/g, '-') // заменяем множественные дефисы на один
    .replace(/^-|-$/g, ''); // удаляем дефисы в начале и конце
}

// Функция для нормализации названия продукта
function normalizeProductName(title) {
  return title
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]/gi, '-') // заменяем все символы кроме букв и цифр на дефис
    .replace(/-+/g, '-') // заменяем множественные дефисы на один
    .replace(/^-|-$/g, ''); // удаляем дефисы в начале и конце
}

// Функция для получения типа продукта в формате директории
function getProductTypeDir(type) {
  const typeMap = {
    'credit-cards': 'credit-cards',
    'debit-cards': 'debit-cards',
    'credits': 'credits',
    'deposits': 'deposits'
  };
  
  return typeMap[type] || type;
}

// Функция для обновления имени файла в соответствии с концепцией
function getNewFileName(originalPath, productData) {
  const dir = path.dirname(originalPath);
  const ext = path.extname(originalPath);
  const bankNameNormalized = normalizeBankName(productData.bankName);
  const productNameNormalized = normalizeProductName(productData.title);
  const date = productData.version?.date || new Date().toISOString().split('T')[0];
  
  // Формируем новое имя файла в формате [bank-name]-[product-name]-[YYYY-MM-DD].json
  const newFileName = `${bankNameNormalized}-${productNameNormalized}-${date}${ext}`;
  
  return path.join(dir, newFileName);
}

// Функция для получения новой директории для файла
function getNewDirectory(baseDir, productData) {
  const productTypeDir = getProductTypeDir(productData.type);
  const bankNameNormalized = normalizeBankName(productData.bankName);
  
  // Путь будет: baseDir/[product-type]/[bank-name]/
  return path.join(baseDir, productTypeDir, bankNameNormalized);
}

// Функция для обновления структуры файлов
async function updateFileStructure(filePath) {
  try {
    // Загружаем данные продукта
    const fileContent = await fs.readFile(filePath, 'utf8');
    const productData = JSON.parse(fileContent);
    
    // Получаем новую директорию
    const baseDir = path.join(path.dirname(require.main.filename), '../data/pdfs');
    const newDir = getNewDirectory(baseDir, productData);
    
    // Создаем новую директорию, если она не существует
    await fs.mkdir(newDir, { recursive: true });
    
    // Получаем новое имя файла
    const newFilePath = getNewFileName(filePath, productData);
    
    // Если файл уже находится в правильной директории и имеет правильное имя, пропускаем
    const expectedFilePath = path.join(newDir, path.basename(newFilePath));
    if (filePath === expectedFilePath) {
      console.log(`Файл уже в правильном месте: ${filePath}`);
      return { success: true, filePath, unchanged: true };
    }
    
    // Перемещаем файл в новую директорию с новым именем
    await fs.rename(filePath, expectedFilePath);
    
    console.log(`Файл перемещен: ${filePath} -> ${expectedFilePath}`);
    
    return {
      success: true,
      oldPath: filePath,
      newPath: expectedFilePath,
      unchanged: false
    };
  } catch (error) {
    console.error(`Ошибка при обновлении структуры файла ${filePath}:`, error.message);
    return {
      success: false,
      filePath,
      error: error.message
    };
  }
}

// Рекурсивное сканирование директории и обновление структуры всех JSON файлов
async function updateAllFileStructures(directoryPath) {
  const results = [];
  
  try {
    const items = await fs.readdir(directoryPath);
    
    for (const item of items) {
      const fullPath = path.join(directoryPath, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        // Рекурсивный вызов для поддиректории
        const subDirResults = await updateAllFileStructures(fullPath);
        results.push(...subDirResults);
      } else if (item.endsWith('.json') && !item.includes('banks.json') && !item.includes('categories.json')) {
        // Обновление структуры JSON файла продукта
        const result = await updateFileStructure(fullPath);
        results.push(result);
      }
    }
  } catch (error) {
    console.error(`Ошибка при сканировании директории ${directoryPath}:`, error.message);
  }
  
  return results;
}

// Основная функция
async function runRestructure(dataPath = '../data/pdfs') {
  const scriptDir = path.dirname(require.main.filename);
  const fullPath = path.join(scriptDir, dataPath);
  console.log(`Запуск переименования и перемещения всех JSON файлов в ${fullPath}...`);
  
  const results = await updateAllFileStructures(fullPath);
  
  // Подсчет результатов
  const totalFiles = results.length;
  const successfulUpdates = results.filter(r => r.success).length;
  const failedUpdates = totalFiles - successfulUpdates;
  const unchangedFiles = results.filter(r => r.unchanged).length;
  
  console.log(`\nРезультаты переименования и перемещения:`);
  console.log(`Всего файлов обработано: ${totalFiles}`);
  console.log(`Успешно перемещено: ${successfulUpdates - unchangedFiles}`);
  console.log(`Уже находилось в правильном месте: ${unchangedFiles}`);
  console.log(`Не удалось обработать: ${failedUpdates}`);
  
  return {
    total: totalFiles,
    successful: successfulUpdates,
    failed: failedUpdates,
    unchanged: unchangedFiles,
    results: results
  };
}

// Если файл запускается напрямую
if (require.main === module) {
  const dataPath = process.argv[2] || '../data/pdfs';
  runRestructure(dataPath).catch(console.error);
}

module.exports = {
  normalizeBankName,
  normalizeProductName,
  getProductTypeDir,
  getNewFileName,
  getNewDirectory,
  updateFileStructure,
  updateAllFileStructures,
  runRestructure
};