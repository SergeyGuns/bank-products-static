const fs = require('fs').promises;
const path = require('path');
const Ajv = require('ajv');

// Инициализация AJV
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

// Функция для обновления структуры продукта
function updateProductStructure(productData) {
  const updatedData = { ...productData };
  
  // Добавляем обязательные поля, если они отсутствуют
  if (!updatedData.version) {
    updatedData.version = {
      date: new Date().toISOString().split('T')[0], // текущая дата в формате YYYY-MM-DD
      source: "https://bank-select.ru", // временный источник
      updatedBy: "migration-script"
    };
  }
  
  if (!updatedData.validFrom) {
    updatedData.validFrom = new Date().toISOString().split('T')[0]; // текущая дата
  }
  
  if (!updatedData.status) {
    updatedData.status = "active";
  }
  
  // Обновляем imageUrl до полного URI, если это внутренний путь
  if (updatedData.imageUrl && updatedData.imageUrl.startsWith('/')) {
    updatedData.imageUrl = `https://bank-select.ru${updatedData.imageUrl}`;
  } else if (updatedData.imageUrl && !updatedData.imageUrl.startsWith('http')) {
    updatedData.imageUrl = `https://bank-select.ru/images/products/${updatedData.imageUrl}`;
  }
  
  // Убедимся, что featured имеет правильное значение по умолчанию
  if (updatedData.featured === undefined) {
    updatedData.featured = false;
  }
  
  return updatedData;
}

// Обновление одного JSON файла
async function updateProductFile(filePath) {
  try {
    // Загрузка файла
    const fileContent = await fs.readFile(filePath, 'utf8');
    let productData = JSON.parse(fileContent);
    
    // Обновление структуры
    const updatedData = updateProductStructure(productData);
    
    // Проверка обновленных данных схемой
    const schema = await loadSchema();
    const validate = ajv.compile(schema);
    const valid = validate(updatedData);
    
    if (!valid) {
      console.log(`Предупреждение: Файл ${filePath} все еще не соответствует схеме после обновления:`);
      console.log(validate.errors);
    }
    
    // Сохранение обновленного файла
    await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2) + '\n', 'utf8');
    
    console.log(`Обновлен файл: ${filePath}`);
    
    return {
      success: true,
      filePath: filePath,
      valid: valid
    };
  } catch (error) {
    console.error(`Ошибка при обновлении файла ${filePath}:`, error.message);
    return {
      success: false,
      filePath: filePath,
      error: error.message
    };
  }
}

// Рекурсивное сканирование директории и обновление всех JSON файлов
async function updateAllProductFiles(directoryPath) {
  const results = [];
  
  try {
    const items = await fs.readdir(directoryPath);
    
    for (const item of items) {
      const fullPath = path.join(directoryPath, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        // Рекурсивный вызов для поддиректории
        const subDirResults = await updateAllProductFiles(fullPath);
        results.push(...subDirResults);
      } else if (item.endsWith('.json') && !item.includes('banks.json') && !item.includes('categories.json')) {
        // Обновление JSON файла продукта
        const result = await updateProductFile(fullPath);
        results.push(result);
      }
    }
  } catch (error) {
    console.error(`Ошибка при сканировании директории ${directoryPath}:`, error.message);
  }
  
  return results;
}

// Основная функция
async function runMigration(dataPath = '../data/pdfs') {
  const fullPath = path.join(__dirname, dataPath);
  console.log(`Запуск миграции всех JSON файлов в ${fullPath}...`);
  
  const results = await updateAllProductFiles(fullPath);
  
  // Подсчет результатов
  const totalFiles = results.length;
  const successfulUpdates = results.filter(r => r.success).length;
  const failedUpdates = totalFiles - successfulUpdates;
  const validAfterUpdate = results.filter(r => r.success && r.valid).length;
  
  console.log(`\nРезультаты миграции:`);
  console.log(`Всего файлов обработано: ${totalFiles}`);
  console.log(`Успешно обновлено: ${successfulUpdates}`);
  console.log(`Не удалось обновить: ${failedUpdates}`);
  console.log(`Соответствуют схеме после обновления: ${validAfterUpdate}`);
  
  return {
    total: totalFiles,
    successful: successfulUpdates,
    failed: failedUpdates,
    valid: validAfterUpdate,
    results: results
  };
}

// Если файл запускается напрямую
if (require.main === module) {
  const dataPath = process.argv[2] || '../data/pdfs';
  runMigration(dataPath).catch(console.error);
}

module.exports = {
  updateProductStructure,
  updateProductFile,
  updateAllProductFiles,
  runMigration
};