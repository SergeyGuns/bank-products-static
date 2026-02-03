/**
 * Скрипт для сохранения и шаринга сравнений банковских продуктов
 * 
 * Этот скрипт позволяет сохранять сравнения продуктов и делиться ими через уникальные ссылки
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Генерация уникального ID для сравнения
 */
function generateComparisonId() {
  return `cmp_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Валидация данных сравнения
 */
function validateComparisonData(comparisonData) {
  if (!comparisonData || typeof comparisonData !== 'object') {
    throw new Error('Неверный формат данных сравнения');
  }
  
  if (!Array.isArray(comparisonData.products) || comparisonData.products.length < 2 || comparisonData.products.length > 5) {
    throw new Error('Сравнение должно содержать от 2 до 5 продуктов');
  }
  
  // Проверяем, что все продукты имеют необходимые поля
  for (const product of comparisonData.products) {
    if (!product.id || !product.type || !product.bankName || !product.title) {
      throw new Error('Каждый продукт должен иметь id, type, bankName и title');
    }
  }
  
  return true;
}

/**
 * Сохранение сравнения
 */
async function saveComparison(comparisonData) {
  validateComparisonData(comparisonData);
  
  const comparisonId = generateComparisonId();
  const outputPath = path.join(__dirname, `../data/shared-comparisons/${comparisonId}.json`);
  
  // Создаем директорию, если она не существует
  const dirPath = path.dirname(outputPath);
  await fs.mkdir(dirPath, { recursive: true });
  
  // Добавляем метаданные
  const comparisonWithMetadata = {
    id: comparisonId,
    createdAt: new Date().toISOString(),
    productCount: comparisonData.products.length,
    products: comparisonData.products,
    shared: true
  };
  
  try {
    await fs.writeFile(outputPath, JSON.stringify(comparisonWithMetadata, null, 2), 'utf8');
    console.log(`Сравнение сохранено с ID: ${comparisonId}`);
    
    return {
      id: comparisonId,
      url: `/compare/${comparisonId}`, // Предполагаемый URL для шаринга
      expiresAt: null // В будущем можно добавить срок истечения
    };
  } catch (error) {
    console.error('Ошибка при сохранении сравнения:', error.message);
    throw error;
  }
}

/**
 * Загрузка сохраненного сравнения по ID
 */
async function loadComparison(comparisonId) {
  if (!comparisonId) {
    throw new Error('ID сравнения обязателен для загрузки');
  }
  
  const filePath = path.join(__dirname, `../data/shared-comparisons/${comparisonId}.json`);
  
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const comparison = JSON.parse(fileContent);
    
    // Проверяем, не истек ли срок действия (если применимо)
    if (comparison.expiresAt && new Date() > new Date(comparison.expiresAt)) {
      // Удаляем истекшее сравнение
      await deleteComparison(comparisonId);
      throw new Error('Срок действия ссылки на сравнение истек');
    }
    
    return comparison;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Сравнение с ID ${comparisonId} не найдено`);
    }
    console.error(`Ошибка при загрузке сравнения ${comparisonId}:`, error.message);
    throw error;
  }
}

/**
 * Удаление сравнения
 */
async function deleteComparison(comparisonId) {
  const filePath = path.join(__dirname, `../data/shared-comparisons/${comparisonId}.json`);
  
  try {
    await fs.unlink(filePath);
    console.log(`Сравнение ${comparisonId} удалено`);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Ошибка при удалении сравнения ${comparisonId}:`, error.message);
      throw error;
    }
  }
}

/**
 * Получение списка всех сохраненных сравнений
 */
async function getAllComparisons() {
  const comparisonsDir = path.join(__dirname, '../data/shared-comparisons');
  
  try {
    const files = await fs.readdir(comparisonsDir);
    const comparisonIds = files
      .filter(file => file.endsWith('.json'))
      .map(file => path.basename(file, '.json'));
    
    const comparisons = [];
    for (const id of comparisonIds) {
      try {
        const comparison = await loadComparison(id);
        comparisons.push({
          id: comparison.id,
          url: `/compare/${comparison.id}`,
          createdAt: comparison.createdAt,
          productCount: comparison.productCount
        });
      } catch (error) {
        console.error(`Не удалось загрузить сравнение ${id}:`, error.message);
      }
    }
    
    return comparisons;
  } catch (error) {
    // Если директория не существует, возвращаем пустой массив
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Генерация краткой информации о сравнении
 */
function getComparisonSummary(comparison) {
  if (!comparison || !comparison.products) {
    return null;
  }
  
  const productTypes = [...new Set(comparison.products.map(p => p.type))];
  const banks = [...new Set(comparison.products.map(p => p.bankName))];
  
  return {
    id: comparison.id,
    productCount: comparison.products.length,
    productTypes: productTypes,
    banks: banks,
    createdAt: comparison.createdAt,
    title: `Сравнение ${comparison.products.length} продуктов`
  };
}

/**
 * Функция для экспорта сравнения в формате, удобном для шаринга
 */
function exportComparison(comparison) {
  const exportedData = {
    id: comparison.id,
    createdAt: comparison.createdAt,
    sharedAt: new Date().toISOString(),
    metadata: getComparisonSummary(comparison),
    products: comparison.products.map(product => ({
      id: product.id,
      title: product.title,
      bankName: product.bankName,
      type: product.type,
      featured: product.featured,
      shortDescription: product.shortDescription,
      parameters: product.parameters
    }))
  };
  
  return exportedData;
}

/**
 * Функция для импорта сравнения из внешнего источника
 */
function importComparison(exportedData) {
  if (!exportedData || !exportedData.products || !Array.isArray(exportedData.products)) {
    throw new Error('Неверный формат импортируемых данных');
  }
  
  // Проверяем, что все продукты имеют необходимые поля
  for (const product of exportedData.products) {
    if (!product.id || !product.type || !product.bankName || !product.title) {
      throw new Error('Импортируемые данные содержат продукты без необходимых полей');
    }
  }
  
  return {
    products: exportedData.products,
    importedFrom: exportedData.id,
    importDate: new Date().toISOString()
  };
}

/**
 * Основная функция для сохранения и получения ссылки на сравнение
 */
async function shareComparison(comparisonData) {
  console.log(`Сохранение сравнения для шаринга...`);
  
  try {
    const result = await saveComparison(comparisonData);
    
    console.log(`Сравнение успешно сохранено. Доступно по ссылке: ${result.url}`);
    
    return result;
  } catch (error) {
    console.error('Ошибка при сохранении сравнения для шаринга:', error.message);
    throw error;
  }
}

/**
 * Основная функция для получения сравнения по ссылке
 */
async function getSharedComparison(comparisonId) {
  console.log(`Загрузка сравнения по ID: ${comparisonId}`);
  
  try {
    const comparison = await loadComparison(comparisonId);
    
    // Увеличиваем счетчик просмотров (в будущем)
    // await incrementViewCount(comparisonId);
    
    return comparison;
  } catch (error) {
    console.error(`Ошибка при загрузке сравнения ${comparisonId}:`, error.message);
    throw error;
  }
}

// Если файл запускается напрямую
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Использование:');
    console.log('  node share-comparison.js save <json_data> - Сохранить сравнение');
    console.log('  node share-comparison.js load <comparison_id> - Загрузить сравнение');
    console.log('  node share-comparison.js list - Список всех сравнений');
  } else {
    const command = args[0];
    
    switch (command) {
      case 'save':
        // Пример: node share-comparison.js save '{"products": [{"id": "prod1", "type": "credit-cards", "bankName": "sberbank", "title": "Card 1"}]}'
        try {
          const comparisonData = JSON.parse(args.slice(1).join(' '));
          shareComparison(comparisonData)
            .then(result => {
              console.log('Сравнение сохранено:', result);
            })
            .catch(error => {
              console.error('Ошибка:', error.message);
            });
        } catch (error) {
          console.error('Ошибка парсинга JSON:', error.message);
        }
        break;
        
      case 'load':
        const comparisonId = args[1];
        getSharedComparison(comparisonId)
          .then(comparison => {
            console.log('Загруженное сравнение:', JSON.stringify(comparison, null, 2));
          })
          .catch(error => {
            console.error('Ошибка:', error.message);
          });
        break;
        
      case 'list':
        getAllComparisons()
          .then(comparisons => {
            console.log('Сохраненные сравнения:');
            comparisons.forEach(cmp => {
              console.log(`- ${cmp.id}: ${cmp.productCount} продуктов, создано ${cmp.createdAt}`);
            });
          })
          .catch(error => {
            console.error('Ошибка:', error.message);
          });
        break;
        
      default:
        console.log('Неизвестная команда. Используйте: save, load или list');
    }
  }
}

module.exports = {
  saveComparison,
  loadComparison,
  deleteComparison,
  getAllComparisons,
  shareComparison,
  getSharedComparison,
  getComparisonSummary,
  exportComparison,
  importComparison,
  generateComparisonId,
  validateComparisonData
};