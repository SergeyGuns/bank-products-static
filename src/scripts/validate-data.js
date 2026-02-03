const Ajv = require('ajv');
const fs = require('fs').promises;
const path = require('path');

// Инициализация AJV (валидатор JSON схем)
const ajv = new Ajv();
// Добавляем поддержку формата uri
ajv.addFormat('uri', {
  type: 'string',
  validate: (data) => {
    try {
      new URL(data);
      return true;
    } catch {
      return false;
    }
  }
});
// Добавляем поддержку формата date
ajv.addFormat('date', {
  type: 'string',
  validate: (data) => {
    // Проверяем формат YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data)) {
      return false;
    }
    // Проверяем, является ли это действительной датой
    const date = new Date(data);
    return date instanceof Date && !isNaN(date) && date.toISOString().slice(0, 10) === data;
  }
});

// Загрузка схемы
async function loadSchema() {
  const schemaPath = path.join(__dirname, '../schemas/product-schema.json');
  const schemaContent = await fs.readFile(schemaPath, 'utf8');
  return JSON.parse(schemaContent);
}

// Валидация одного JSON файла
async function validateProductFile(filePath) {
  try {
    // Загрузка схемы
    const schema = await loadSchema();
    
    // Компиляция схемы
    const validate = ajv.compile(schema);
    
    // Загрузка файла для проверки
    const fileContent = await fs.readFile(filePath, 'utf8');
    const productData = JSON.parse(fileContent);
    
    // Валидация
    const valid = validate(productData);
    
    return {
      isValid: valid,
      errors: valid ? [] : validate.errors,
      data: productData
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [{ message: `Ошибка при чтении или парсинге файла: ${error.message}` }],
      data: null
    };
  }
}

// Проверка всех файлов в директории
async function validateAllProductFiles(directoryPath) {
  const results = [];
  
  try {
    const files = await fs.readdir(directoryPath);
    
    for (const file of files) {
      const fullPath = path.join(directoryPath, file);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        // Рекурсивная проверка поддиректорий
        const subDirResults = await validateAllProductFiles(fullPath);
        results.push(...subDirResults);
      } else if (file.endsWith('.json')) {
        // Проверка JSON файла
        const validationResult = await validateProductFile(fullPath);
        results.push({
          filePath: fullPath,
          ...validationResult
        });
      }
    }
  } catch (error) {
    console.error(`Ошибка при сканировании директории ${directoryPath}:`, error.message);
  }
  
  return results;
}

// Основная функция для запуска валидации
async function runValidation(dataPath = '../data/pdfs') {
  const fullPath = path.join(__dirname, dataPath);
  console.log(`Запуск валидации всех JSON файлов в ${fullPath}...`);
  
  const results = await validateAllProductFiles(fullPath);
  
  // Подсчет результатов
  const totalFiles = results.length;
  const validFiles = results.filter(r => r.isValid).length;
  const invalidFiles = totalFiles - validFiles;
  
  console.log(`\nРезультаты валидации:`);
  console.log(`Всего файлов: ${totalFiles}`);
  console.log(`Валидных: ${validFiles}`);
  console.log(`С ошибками: ${invalidFiles}`);
  
  // Вывод ошибок для невалидных файлов
  if (invalidFiles > 0) {
    console.log('\nФайлы с ошибками:');
    results
      .filter(r => !r.isValid)
      .forEach(r => {
        console.log(`\nФайл: ${r.filePath}`);
        r.errors.forEach(error => {
          console.log(`  - ${error.message}`);
        });
      });
  }
  
  return {
    total: totalFiles,
    valid: validFiles,
    invalid: invalidFiles,
    results: results
  };
}

// Если файл запускается напрямую
if (require.main === module) {
  const dataPath = process.argv[2] || '../data/pdfs';
  runValidation(dataPath).catch(console.error);
}

module.exports = {
  validateProductFile,
  validateAllProductFiles,
  runValidation
};