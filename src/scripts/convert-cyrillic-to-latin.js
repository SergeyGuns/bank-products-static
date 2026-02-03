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

// Функция для рекурсивного сканирования и перемещения файлов из кириллических директорий в новые с латинскими именами
async function moveFilesFromCyrillicDirs(rootPath) {
  const items = await fs.readdir(rootPath, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(rootPath, item.name);
    
    if (item.isDirectory()) {
      // Проверяем, содержит ли имя кириллические символы
      const hasCyrillic = /[а-яё]/i.test(item.name);
      
      if (hasCyrillic) {
        // Транслитерируем имя директории
        const latinName = transliterate(item.name);
        const latinPath = path.join(path.dirname(fullPath), latinName);
        
        console.log(`Found cyrillic directory: ${fullPath}, will process contents and move files to: ${latinPath}`);
        
        // Создаем новую директорию с латинским именем
        await fs.mkdir(latinPath, { recursive: true });
        
        // Перемещаем все файлы из кириллической директории в новую
        const dirContents = await fs.readdir(fullPath);
        for (const file of dirContents) {
          const oldFilePath = path.join(fullPath, file);
          const newFilePath = path.join(latinPath, file);
          
          console.log(`Moving file: ${oldFilePath} -> ${newFilePath}`);
          await fs.rename(oldFilePath, newFilePath);
        }
        
        // После перемещения файлов удаляем пустую кириллическую директорию
        await fs.rmdir(fullPath);
        console.log(`Removed empty cyrillic directory: ${fullPath}`);
      }
      
      // Рекурсивно обрабатываем поддиректории
      await moveFilesFromCyrillicDirs(fullPath);
    }
  }
}

// Основная функция
async function runConversion(dataPath = '../data/pdfs') {
  const scriptDir = path.dirname(require.main.filename);
  const fullPath = path.join(scriptDir, dataPath);
  console.log(`Starting conversion of cyrillic directories to latin in ${fullPath}...`);
  
  await moveFilesFromCyrillicDirs(fullPath);
  
  console.log('Conversion completed.');
}

// Если файл запускается напрямую
if (require.main === module) {
  const dataPath = process.argv[2] || '../data/pdfs';
  runConversion(dataPath).catch(console.error);
}

module.exports = {
  transliterate,
  moveFilesFromCyrillicDirs,
  runConversion
};