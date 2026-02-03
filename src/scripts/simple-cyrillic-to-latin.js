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

// Функция для обработки директории
async function processDirectory(dirPath) {
  const items = await fs.readdir(dirPath, { withFileTypes: true });
  
  for (const item of items) {
    if (item.isDirectory()) {
      const oldPath = path.join(dirPath, item.name);
      
      // Проверяем, содержит ли имя кириллические символы
      const hasCyrillic = /[а-яё]/i.test(item.name);
      
      if (hasCyrillic) {
        // Транслитерируем имя директории
        const latinName = transliterate(item.name);
        const newPath = path.join(dirPath, latinName);
        
        console.log(`Renaming directory: ${oldPath} -> ${newPath}`);
        
        // Создаем новую директорию с латинским именем
        await fs.mkdir(newPath, { recursive: true });
        
        // Перемещаем все файлы из старой директории в новую
        const oldDirContents = await fs.readdir(oldPath);
        for (const file of oldDirContents) {
          const oldFilePath = path.join(oldPath, file);
          const newFilePath = path.join(newPath, file);
          
          console.log(`Moving file: ${oldFilePath} -> ${newFilePath}`);
          await fs.rename(oldFilePath, newFilePath);
        }
        
        // После перемещения файлов удаляем пустую старую директорию
        await fs.rmdir(oldPath);
        console.log(`Removed old directory: ${oldPath}`);
      }
    }
  }
}

// Основная функция
async function runConversion(dataPath = '../data/pdfs') {
  const scriptDir = path.dirname(require.main.filename);
  const fullPath = path.join(scriptDir, dataPath);
  console.log(`Starting conversion of cyrillic directories to latin in ${fullPath}...`);
  
  // Обрабатываем каждую директорию продукта
  const productTypes = ['credit-cards', 'debit-cards', 'credits', 'deposits'];
  
  for (const productType of productTypes) {
    const productDir = path.join(fullPath, productType);
    if (await fs.access(productDir).then(() => true).catch(() => false)) {
      console.log(`Processing ${productType} directory...`);
      await processDirectory(productDir);
    }
  }
  
  console.log('Conversion completed.');
}

// Если файл запускается напрямую
if (require.main === module) {
  const dataPath = process.argv[2] || '../data/pdfs';
  runConversion(dataPath).catch(console.error);
}

module.exports = {
  transliterate,
  processDirectory,
  runConversion
};