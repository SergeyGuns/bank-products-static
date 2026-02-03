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

// Функция для рекурсивного переименования файлов
async function renameFilesRecursively(currentPath) {
  const items = await fs.readdir(currentPath, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(currentPath, item.name);
    
    if (item.isDirectory()) {
      // Рекурсивно обрабатываем поддиректории
      await renameFilesRecursively(fullPath);
    } else if (item.name.endsWith('.json')) {
      // Проверяем, содержит ли имя файла кириллические символы
      const hasCyrillic = /[а-яё]/i.test(item.name);
      
      if (hasCyrillic) {
        // Транслитерируем имя файла
        const newName = transliterate(item.name);
        const newPath = path.join(currentPath, newName);
        
        console.log(`Renaming file: ${fullPath} -> ${newPath}`);
        await fs.rename(fullPath, newPath);
      }
    }
  }
}

// Основная функция
async function runRename(dataPath = '../data/pdfs') {
  const scriptDir = path.dirname(require.main.filename);
  const fullPath = path.join(scriptDir, dataPath);
  console.log(`Starting file renaming with Latin names in ${fullPath}...`);
  
  await renameFilesRecursively(fullPath);
  
  console.log('File renaming completed.');
}

// Если файл запускается напрямую
if (require.main === module) {
  const dataPath = process.argv[2] || '../data/pdfs';
  runRename(dataPath).catch(console.error);
}

module.exports = {
  transliterate,
  renameFilesRecursively,
  runRename
};