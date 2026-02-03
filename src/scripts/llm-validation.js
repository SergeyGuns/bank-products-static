/**
 * Скрипт для регулярных проверок через LLM
 * 
 * Этот скрипт использует локальные LLM для проверки:
 * - Актуальности данных
 * - Достоверности информации
 * - Соответствия типу продукта
 * - Наличия дубликатов
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios'); // Для взаимодействия с LLM API

// Путь к инструкциям для LLM
const LLM_INSTRUCTIONS_PATH = path.join(__dirname, '../llm-instructions');

// Конфигурация LLM
const llmConfig = {
  // Настройки для локального LLM (например, Ollama, LocalAI и т.д.)
  baseUrl: process.env.LLM_BASE_URL || 'http://localhost:11434/api/generate', // Пример для Ollama
  model: process.env.LLM_MODEL || 'llama3.2',
  timeout: 30000, // 30 секунд
  maxRetries: 3
};

/**
 * Функция для загрузки инструкции для LLM
 */
async function loadLLMInstruction(instructionName) {
  const instructionPath = path.join(LLM_INSTRUCTIONS_PATH, `${instructionName}.txt`);
  
  try {
    const instructionContent = await fs.readFile(instructionPath, 'utf8');
    return instructionContent;
  } catch (error) {
    console.error(`Ошибка при загрузке инструкции ${instructionName}:`, error.message);
    throw error;
  }
}

/**
 * Функция для вызова LLM с заданным запросом
 */
async function callLLM(prompt, options = {}) {
  const retries = options.retries || llmConfig.maxRetries;
  const model = options.model || llmConfig.model;
  
  const requestBody = {
    model: model,
    prompt: prompt,
    stream: false,
    options: {
      temperature: options.temperature || 0.3,
      num_ctx: options.contextSize || 2048
    }
  };
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(llmConfig.baseUrl, requestBody, {
        timeout: llmConfig.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data.response || response.data;
    } catch (error) {
      console.warn(`Попытка ${attempt} вызова LLM не удалась:`, error.message);
      
      if (attempt === retries) {
        throw new Error(`Не удалось получить ответ от LLM после ${retries} попыток: ${error.message}`);
      }
      
      // Задержка перед повторной попыткой
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

/**
 * Функция для проверки актуальности продукта через LLM
 */
async function verifyProductCurrent(productData) {
  const instruction = await loadLLMInstruction('verify-current');
  
  const prompt = `${instruction}\n\nJSON объект с информацией о банковском продукте:\n${JSON.stringify(productData, null, 2)}\n\nВыход:`;
  
  try {
    const response = await callLLM(prompt);
    
    // Парсинг ответа LLM (ожидается JSON)
    const result = JSON.parse(response.trim());
    
    return {
      isValid: true,
      result: result
    };
  } catch (error) {
    console.error('Ошибка при проверке актуальности продукта:', error.message);
    
    return {
      isValid: false,
      error: error.message,
      result: {
        isCurrent: false,
        outdatedParameters: [],
        suggestedUpdates: {},
        urgency: "medium",
        confidence: 0,
        notes: `Ошибка при проверке актуальности: ${error.message}`
      }
    };
  }
}

/**
 * Функция для проверки достоверности продукта через LLM
 */
async function verifyProductCredible(productData) {
  const instruction = await loadLLMInstruction('verify-credible');
  
  const prompt = `${instruction}\n\nJSON объект с информацией о банковском продукте:\n${JSON.stringify(productData, null, 2)}\n\nВыход:`;
  
  try {
    const response = await callLLM(prompt);
    
    // Парсинг ответа LLM (ожидается JSON)
    const result = JSON.parse(response.trim());
    
    return {
      isValid: true,
      result: result
    };
  } catch (error) {
    console.error('Ошибка при проверке достоверности продукта:', error.message);
    
    return {
      isValid: false,
      error: error.message,
      result: {
        isCredible: false,
        issues: [`Ошибка при проверке достоверности: ${error.message}`],
        credibilityScore: 0,
        suggestedCorrections: {},
        confidence: 0,
        notes: `Ошибка при проверке достоверности: ${error.message}`
      }
    };
  }
}

/**
 * Функция для проверки соответствия типу продукта через LLM
 */
async function verifyProductType(productData) {
  const instruction = await loadLLMInstruction('verify-type');
  
  const prompt = `${instruction}\n\nJSON объект с информацией о банковском продукте:\n${JSON.stringify(productData, null, 2)}\n\nВыход:`;
  
  try {
    const response = await callLLM(prompt);
    
    // Парсинг ответа LLM (ожидается JSON)
    const result = JSON.parse(response.trim());
    
    return {
      isValid: true,
      result: result
    };
  } catch (error) {
    console.error('Ошибка при проверке типа продукта:', error.message);
    
    return {
      isValid: false,
      error: error.message,
      result: {
        isCorrectType: false,
        mismatchedParameters: [],
        suggestedType: productData.type,
        confidence: 0,
        notes: `Ошибка при проверке типа: ${error.message}`
      }
    };
  }
}

/**
 * Функция для проверки дубликатов через LLM
 */
async function checkProductDuplicates(productData, similarProducts) {
  const instruction = await loadLLMInstruction('check-duplicates');
  
  const prompt = `${instruction}\n\nНовый продукт:\n${JSON.stringify(productData, null, 2)}\n\nСуществующие похожие продукты:\n${JSON.stringify(similarProducts, null, 2)}\n\nВыход:`;
  
  try {
    const response = await callLLM(prompt);
    
    // Парсинг ответа LLM (ожидается JSON)
    const result = JSON.parse(response.trim());
    
    return {
      isValid: true,
      result: result
    };
  } catch (error) {
    console.error('Ошибка при проверке дубликатов:', error.message);
    
    return {
      isValid: false,
      error: error.message,
      result: {
        isDuplicate: false,
        potentialDuplicates: [],
        isUpdate: false,
        similarityNotes: `Ошибка при проверке дубликатов: ${error.message}`
      }
    };
  }
}

/**
 * Функция для полной проверки продукта через LLM
 */
async function fullLLMValidation(productData) {
  console.log(`Проверка продукта "${productData.title}" (${productData.bankName}) через LLM...`);
  
  const results = {};
  
  // Проверка актуальности
  results.current = await verifyProductCurrent(productData);
  
  // Проверка достоверности
  results.credible = await verifyProductCredible(productData);
  
  // Проверка типа
  results.type = await verifyProductType(productData);
  
  // Возврат всех результатов
  return results;
}

/**
 * Функция для проверки всех продуктов в указанной директории
 */
async function validateAllProducts(productsPath = '../data/pdfs') {
  console.log('Запуск регулярной проверки всех продуктов через LLM...');
  
  const fullPath = path.join(__dirname, productsPath);
  const allProducts = await loadAllProducts(fullPath);
  
  const validationResults = [];
  
  for (const product of allProducts) {
    const validationResult = await fullLLMValidation(product);
    
    validationResults.push({
      productId: product.id,
      productName: product.title,
      bankName: product.bankName,
      productType: product.type,
      validation: validationResult,
      checkedAt: new Date().toISOString()
    });
    
    // Небольшая задержка, чтобы не перегружать LLM
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return validationResults;
}

/**
 * Загрузка всех продуктов из указанной директории
 */
async function loadAllProducts(productsPath) {
  const fullPath = path.join(__dirname, productsPath);
  const results = [];
  
  try {
    const items = await fs.readdir(fullPath);
    
    for (const item of items) {
      const itemPath = path.join(fullPath, item);
      const stat = await fs.stat(itemPath);
      
      if (stat.isDirectory()) {
        // Рекурсивная загрузка из поддиректорий
        const subDirResults = await loadAllProducts(path.relative(__dirname, itemPath));
        results.push(...subDirResults);
      } else if (item.endsWith('.json')) {
        // Загрузка JSON файла
        const fileContent = await fs.readFile(itemPath, 'utf8');
        const productData = JSON.parse(fileContent);
        results.push(productData);
      }
    }
  } catch (error) {
    console.error(`Ошибка при загрузке продуктов из ${fullPath}:`, error.message);
  }
  
  return results;
}

/**
 * Сохранение результатов валидации
 */
async function saveValidationResults(results) {
  const outputPath = path.join(__dirname, '../data/llm-validation-results.json');
  const outputData = {
    validationDate: new Date().toISOString(),
    totalProducts: results.length,
    results: results
  };
  
  try {
    await fs.writeFile(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
    console.log(`Результаты валидации через LLM сохранены в ${outputPath}`);
  } catch (error) {
    console.error('Ошибка при сохранении результатов валидации:', error.message);
  }
}

/**
 * Запуск регулярной проверки через LLM
 */
async function runLLMValidation() {
  try {
    console.log('Начало регулярной проверки через LLM...');
    
    const results = await validateAllProducts();
    await saveValidationResults(results);
    
    // Вывод статистики
    console.log('\nСтатистика проверки через LLM:');
    console.log(`- Всего проверено продуктов: ${results.length}`);
    
    let currentIssues = 0;
    let credibleIssues = 0;
    let typeIssues = 0;
    
    results.forEach(result => {
      if (!result.validation.current.result.isCurrent) currentIssues++;
      if (!result.validation.credible.result.isCredible) credibleIssues++;
      if (!result.validation.type.result.isCorrectType) typeIssues++;
    });
    
    console.log(`- Продуктов с актуальностью: ${currentIssues}`);
    console.log(`- Продуктов с достоверностью: ${credibleIssues}`);
    console.log(`- Продуктов с типом: ${typeIssues}`);
    
    return results;
  } catch (error) {
    console.error('Ошибка при выполнении проверки через LLM:', error.message);
    throw error;
  }
}

// Если файл запускается напрямую
if (require.main === module) {
  runLLMValidation().catch(console.error);
}

module.exports = {
  runLLMValidation,
  validateAllProducts,
  fullLLMValidation,
  verifyProductCurrent,
  verifyProductCredible,
  verifyProductType,
  checkProductDuplicates
};