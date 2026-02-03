const fs = require('fs').promises;
const path = require('path');

// Карта транслитерации кириллицы в латиницу
const translitMap = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
  'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
  'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
  'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch',
  'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya', ' ': '-'
};

// Функция для транслитерации строки
function transliterate(str) {
  return str.split('').map(char => translitMap[char] || char).join('');
}

// Функция для нормализации названия банка для использования в именах файлов и директорий
function normalizeBankName(bankName) {
  // Сначала транслитерируем, затем нормализуем
  const transliterated = transliterate(bankName);
  return transliterated
    .toLowerCase()
    .replace(/[^a-zа-яё0-9-]/gi, '-') // заменяем все символы кроме букв, цифр и дефиса на дефис
    .replace(/-+/g, '-') // заменяем множественные дефисы на один
    .replace(/^-|-$/g, ''); // удаляем дефисы в начале и конце
}

// Функция для нормализации названия продукта
function normalizeProductName(title) {
  const transliterated = transliterate(title);
  return transliterated
    .toLowerCase()
    .replace(/[^a-zа-яё0-9-]/gi, '-') // заменяем все символы кроме букв, цифр и дефиса на дефис
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

// Функция для обновления имени файла в соответствии с концепцией (с латинскими символами)
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

// Функция для получения новой директории для файла (с латинскими символами)
function getNewDirectory(baseDir, productData) {
  const productTypeDir = getProductTypeDir(productData.type);
  const bankNameNormalized = normalizeBankName(productData.bankName);
  
  // Путь будет: baseDir/[product-type]/[bank-name]/
  return path.join(baseDir, productTypeDir, bankNameNormalized);
}

// Функция для рекурсивного переименования директорий
async function renameDirectoriesRecursively(currentPath) {
  const items = await fs.readdir(currentPath, { withFileTypes: true });
  
  // Сначала переименовываем поддиректории
  for (const item of items) {
    if (item.isDirectory()) {
      // Рекурсивно обрабатываем поддиректории
      await renameDirectoriesRecursively(path.join(currentPath, item.name));
      
      // Переименовываем текущую директорию, если в ней есть кириллические символы
      const newName = transliterate(item.name);
      if (newName !== item.name) {
        const oldPath = path.join(currentPath, item.name);
        const newPath = path.join(currentPath, newName);
        console.log(`Переименовываем директорию: ${oldPath} -> ${newPath}`);
        await fs.rename(oldPath, newPath);
      }
    }
  }
}

// Функция для обновления структуры файлов (с латинскими символами)
async function updateFileStructureLatin(filePath) {
  try {
    // Загружаем данные продукта
    const fileContent = await fs.readFile(filePath, 'utf8');
    const productData = JSON.parse(fileContent);
    
    // Получаем новую директорию
    const baseDir = path.join(path.dirname(require.main.filename), '../data/pdfs');
    const newDir = getNewDirectory(baseDir, productData);
    
    // Транслитерируем новую директорию
    const transliteratedNewDir = newDir.split(path.sep).map(part => transliterate(part)).join(path.sep);
    
    // Создаем новую директорию, если она не существует
    await fs.mkdir(transliteratedNewDir, { recursive: true });
    
    // Получаем новое имя файла
    const newFilePath = getNewFileName(filePath, productData);
    
    // Транслитерируем имя файла
    const fileName = path.basename(newFilePath);
    const dirName = path.dirname(newFilePath);
    const transliteratedFileName = transliterate(fileName);
    const transliteratedFilePath = path.join(dirName, transliteratedFileName);
    
    // Если файл уже находится в правильной директории и имеет правильное имя, пропускаем
    const expectedFilePath = path.join(transliteratedNewDir, transliteratedFileName);
    if (filePath === expectedFilePath) {
      console.log(`File already in correct location: ${filePath}`);
      return { success: true, filePath, unchanged: true };
    }
    
    // Перемещаем файл в новую директорию с новым именем
    await fs.rename(filePath, expectedFilePath);
    
    console.log(`File moved: ${filePath} -> ${expectedFilePath}`);
    
    return {
      success: true,
      oldPath: filePath,
      newPath: expectedFilePath,
      unchanged: false
    };
  } catch (error) {
    console.error(`Error updating file structure for ${filePath}:`, error.message);
    return {
      success: false,
      filePath,
      error: error.message
    };
  }
}

// Рекурсивное сканирование директории и обновление структуры всех JSON файлов
async function updateAllFileStructuresLatin(directoryPath) {
  const results = [];
  
  try {
    const items = await fs.readdir(directoryPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(directoryPath, item.name);
      
      if (item.isDirectory()) {
        // Рекурсивный вызов для поддиректории
        const subDirResults = await updateAllFileStructuresLatin(fullPath);
        results.push(...subDirResults);
      } else if (item.name.endsWith('.json') && !item.name.includes('banks.json') && !item.name.includes('categories.json')) {
        // Обновление структуры JSON файла продукта
        const result = await updateFileStructureLatin(fullPath);
        results.push(result);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${directoryPath}:`, error.message);
  }
  
  return results;
}

// Основная функция для переименования директорий
async function renameDirectories(dataPath = '../data/pdfs') {
  const scriptDir = path.dirname(require.main.filename);
  const fullPath = path.join(scriptDir, dataPath);
  console.log(`Starting directory renaming in ${fullPath}...`);
  
  await renameDirectoriesRecursively(fullPath);
  
  console.log('Directory renaming completed.');
}

// Основная функция для обновления структуры файлов
async function runRestructureLatin(dataPath = '../data/pdfs') {
  const scriptDir = path.dirname(require.main.filename);
  const fullPath = path.join(scriptDir, dataPath);
  console.log(`Starting file restructuring with Latin names in ${fullPath}...`);
  
  const results = await updateAllFileStructuresLatin(fullPath);
  
  // Подсчет результатов
  const totalFiles = results.length;
  const successfulUpdates = results.filter(r => r.success).length;
  const failedUpdates = totalFiles - successfulUpdates;
  const unchangedFiles = results.filter(r => r.unchanged).length;
  
  console.log(`\nRestructuring results:`);
  console.log(`Total files processed: ${totalFiles}`);
  console.log(`Successfully moved: ${successfulUpdates - unchangedFiles}`);
  console.log(`Already in correct location: ${unchangedFiles}`);
  console.log(`Failed to process: ${failedUpdates}`);
  
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
  const action = process.argv[2] || 'both'; // 'rename', 'restructure', or 'both'
  const dataPath = process.argv[3] || '../data/pdfs';
  
  if (action === 'rename' || action === 'both') {
    renameDirectories(dataPath).then(() => {
      if (action === 'both') {
        return runRestructureLatin(dataPath);
      }
    }).catch(console.error);
  } else if (action === 'restructure') {
    runRestructureLatin(dataPath).catch(console.error);
  }
}

module.exports = {
  transliterate,
  normalizeBankName,
  normalizeProductName,
  getProductTypeDir,
  getNewFileName,
  getNewDirectory,
  renameDirectoriesRecursively,
  updateFileStructureLatin,
  updateAllFileStructuresLatin,
  renameDirectories,
  runRestructureLatin
};