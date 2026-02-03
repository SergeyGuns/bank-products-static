# Настройка локальных LLM для задач проекта bank-products-static

## Общая архитектура

Для обеспечения безопасности и контроля над процессами валидации и генерации, проект использует локальные Large Language Models (LLM) для выполнения следующих задач:

1. Проверка актуальности информации
2. Проверка достоверности данных
3. Форматирование и валидация JSON
4. Генерация описаний и метаданных
5. Проверка соответствия типу продукта
6. Обнаружение дубликатов

## Требования к локальным LLM

### Общие требования
- Поддержка запуска в локальном окружении
- Совместимость с JSON API
- Возможность тонкой настройки под конкретные задачи
- Поддержка инструкций и контекста
- Разумные требования к ресурсам

### Рекомендуемые модели
- **LLaMA 2/3** (7B или 13B параметров) - для универсальных задач
- **Mistral 7B** - для задач форматирования и валидации
- **Zephyr 7B** - для задач проверки достоверности
- **Phi-2** - для легковесных задач

## Настройка LLM для конкретных задач

### 1. LLM для проверки актуальности информации

#### Модель
- Рекомендуемая: LLaMA 2 13B или Mistral 7B
- Требуется хорошее понимание банковских терминов
- Необходима способность к анализу и сравнению

#### Специфическая настройка
- Обучение на банковских документах и условиях
- Настройка на понимание финансовой терминологии
- Оптимизация для задач сравнения параметров

#### Пример вызова API
```javascript
const checkCurrent = async (productData, officialInfo) => {
  const prompt = `
    Ты эксперт в банковских продуктах России. Сравни следующие параметры:
    
    Предоставленные параметры: ${JSON.stringify(productData)}
    Официальная информация: ${JSON.stringify(officialInfo)}
    
    Определи, какие параметры устарели или отличаются от официальной информации.
    Ответь в формате JSON: {
      "isCurrent": boolean,
      "outdatedParameters": ["список устаревших параметров"],
      "suggestedUpdates": {"параметр": "новое значение"},
      "urgency": "low|medium|high",
      "confidence": 0-100,
      "notes": "комментарии"
    }
  `;
  
  return await callLocalLLM(prompt);
};
```

### 2. LLM для проверки достоверности данных

#### Модель
- Рекомендуемая: Zephyr 7B или Phi-2
- Должна хорошо справляться с логическими задачами
- Требуется способность к выявлению противоречий

#### Специфическая настройка
- Обучение на примерах достоверных и недостоверных данных
- Настройка на выявление логических несостыковок
- Оптимизация для задач проверки согласованности

#### Пример вызова API
```javascript
const checkCredible = async (productData) => {
  const prompt = `
    Ты эксперт в банковских продуктах России. Проверь достоверность следующих данных:
    
    ${JSON.stringify(productData)}
    
    Проверь логическую согласованность параметров, соответствие типичным для этого типа продукта,
    и укажи возможные ошибки или противоречия.
    Ответь в формате JSON: {
      "isCredible": boolean,
      "issues": ["список проблем"],
      "suggestedCorrections": {"параметр": "исправленное значение"},
      "credibilityScore": 0-100,
      "notes": "комментарии"
    }
  `;
  
  return await callLocalLLM(prompt);
};
```

### 3. LLM для форматирования и валидации JSON

#### Модель
- Рекомендуемая: Mistral 7B или Phi-2
- Должна хорошо понимать структуру JSON и схемы
- Требуется точность в форматировании

#### Специфическая настройка
- Обучение на примерах правильно и неправильно форматированных JSON
- Настройка на понимание схемы данных проекта
- Оптимизация для задач форматирования

#### Пример вызова API
```javascript
const validateAndFormat = async (rawData) => {
  const prompt = `
    Ты помощник по форматированию JSON данных банковских продуктов.
    Проверь структуру и формат следующих данных:
    
    ${JSON.stringify(rawData)}
    
    Проверь, соответствует ли структура схеме проекта, убедись, что все обязательные поля присутствуют,
    и проверь формат значений полей.
    Ответь в формате JSON: {
      "isValid": boolean,
      "errors": ["список ошибок"],
      "warnings": ["список предупреждений"],
      "suggestedFixes": {"поле": "корректное значение"},
      "complianceScore": 0-100
    }
  `;
  
  return await callLocalLLM(prompt);
};
```

### 4. LLM для генерации описаний и метаданных

#### Модель
- Рекомендуемая: LLaMA 2 13B или Mistral 7B
- Должна хорошо генерировать текст на русском языке
- Требуется понимание SEO и маркетинговых принципов

#### Специфическая настройка
- Обучение на примерах качественных банковских описаний
- Настройка на понимание SEO требований
- Оптимизация для генерации кратких и информативных описаний

#### Пример вызова API
```javascript
const generateDescriptions = async (productParams) => {
  const prompt = `
    Ты эксперт в банковских продуктах России и SEO. Сгенерируй качественные описания и метаданные
    для следующего банковского продукта:
    
    ${JSON.stringify(productParams)}
    
    Создай краткое описание (до 200 символов), полное описание (до 1000 символов),
    SEO заголовок, SEO описание для мета-тегов, список ключевых особенностей и условия получения.
    Ответь в формате JSON: {
      "shortDescription": "краткое описание",
      "fullDescription": "полное описание",
      "meta": {
        "title": "SEO заголовок",
        "description": "SEO описание"
      },
      "features": ["список особенностей"],
      "conditions": ["список условий"]
    }
  `;
  
  return await callLocalLLM(prompt);
};
```

### 5. LLM для проверки соответствия типу продукта

#### Модель
- Рекомендуемая: Zephyr 7B или LLaMA 2 7B
- Должна хорошо понимать классификацию банковских продуктов
- Требуется способность к анализу соответствия параметров типу

#### Специфическая настройка
- Обучение на примерах правильной и неправильной классификации
- Настройка на понимание характеристик каждого типа продукта
- Оптимизация для задач классификации

#### Пример вызова API
```javascript
const checkProductType = async (productData) => {
  const prompt = `
    Ты классификатор банковских продуктов. Проверь, соответствует ли следующий продукт
    своему заявленному типу:
    
    ${JSON.stringify(productData)}
    
    Проверь, соответствуют ли параметры продукта заявленному типу, определи несоответствия
    и предложи корректировки.
    Ответь в формате JSON: {
      "isCorrectType": boolean,
      "mismatchedParameters": ["список несоответствий"],
      "missingExpectedParameters": ["список отсутствующих параметров"],
      "suggestedType": "предлагаемый тип",
      "confidence": 0-100,
      "notes": "комментарии"
    }
  `;
  
  return await callLocalLLM(prompt);
};
```

### 6. LLM для обнаружения дубликатов

#### Модель
- Рекомендуемая: Mistral 7B или Phi-2
- Должна хорошо сравнивать и анализировать схожесть
- Требуется способность к определению степени схожести

#### Специфическая настройка
- Обучение на примерах дубликатов и уникальных продуктов
- Настройка на понимание критериев схожести
- Оптимизация для задач сравнения

#### Пример вызова API
```javascript
const checkDuplicates = async (newProduct, existingProducts) => {
  const prompt = `
    Ты детектор дубликатов банковских продуктов. Определи, является ли новый продукт
    дубликатом уже существующих:
    
    Новый продукт: ${JSON.stringify(newProduct)}
    Существующие продукты: ${JSON.stringify(existingProducts)}
    
    Сравни ключевые параметры и определи степень схожести.
    Ответь в формате JSON: {
      "isDuplicate": boolean,
      "potentialDuplicates": [{"id": "идентификатор", "similarity": 0-100}],
      "isUpdate": boolean,
      "similarityNotes": "описание схожих черт",
      "uniqueFeatures": ["список отличающихся параметров"]
    }
  `;
  
  return await callLocalLLM(prompt);
};
```

## Установка и настройка локальных LLM

### Варианты развертывания

#### 1. Ollama (рекомендуемый)
```bash
# Установка Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Запуск конкретной модели
ollama pull llama2:13b
ollama run llama2:13b

# Использование через API
curl http://localhost:11434/api/generate -d '{
  "model": "llama2:13b",
  "prompt": "Текст запроса",
  "stream": false
}'
```

#### 2. Hugging Face Transformers
```bash
pip install transformers torch accelerate
```

```python
from transformers import AutoTokenizer, AutoModelForCausalLM

# Загрузка модели
tokenizer = AutoTokenizer.from_pretrained("TheBloke/Llama-2-13B-Chat-GGML")
model = AutoModelForCausalLM.from_pretrained("TheBloke/Llama-2-13B-Chat-GGML")

# Использование
def call_llm(prompt):
    inputs = tokenizer.encode(prompt, return_tensors="pt")
    outputs = model.generate(inputs, max_length=len(inputs[0]) + 100)
    return tokenizer.decode(outputs[0], skip_special_tokens=True)
```

#### 3. llama.cpp
```bash
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make
```

### Конфигурация для проекта

#### Файл: `config/llm-config.json`
```json
{
  "models": {
    "current_check": {
      "model_name": "llama2:13b",
      "endpoint": "http://localhost:11434",
      "temperature": 0.1,
      "max_tokens": 1000,
      "task": "verify_current"
    },
    "credible_check": {
      "model_name": "zephyr:7b",
      "endpoint": "http://localhost:11434",
      "temperature": 0.2,
      "max_tokens": 800,
      "task": "verify_credible"
    },
    "format_validation": {
      "model_name": "mistral:7b",
      "endpoint": "http://localhost:11434",
      "temperature": 0.0,
      "max_tokens": 500,
      "task": "validate_format"
    },
    "description_generation": {
      "model_name": "llama2:13b",
      "endpoint": "http://localhost:11434",
      "temperature": 0.7,
      "max_tokens": 1200,
      "task": "generate_descriptions"
    },
    "type_verification": {
      "model_name": "zephyr:7b",
      "endpoint": "http://localhost:11434",
      "temperature": 0.1,
      "max_tokens": 600,
      "task": "verify_type"
    },
    "duplicate_detection": {
      "model_name": "mistral:7b",
      "endpoint": "http://localhost:11434",
      "temperature": 0.3,
      "max_tokens": 700,
      "task": "check_duplicates"
    }
  },
  "api_settings": {
    "timeout": 60000,
    "retries": 3,
    "cache_enabled": true,
    "cache_ttl": 3600
  }
}
```

## Интеграция с существующими скриптами

### Утилита для вызова LLM: `utils/llm-caller.js`
```javascript
const axios = require('axios');
const config = require('../config/llm-config.json');

class LLMPool {
  constructor() {
    this.models = new Map();
    this.cache = new Map();
  }

  async getModel(task) {
    const modelConfig = config.models[task];
    if (!this.models.has(task)) {
      this.models.set(task, modelConfig);
    }
    return this.models.get(task);
  }

  async callLLM(task, prompt) {
    const cacheKey = `${task}:${prompt.substring(0, 100)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const modelConfig = await this.getModel(task);
    
    const payload = {
      model: modelConfig.model_name,
      prompt: prompt,
      stream: false,
      options: {
        temperature: modelConfig.temperature,
        num_predict: modelConfig.max_tokens
      }
    };

    try {
      const response = await axios.post(
        `${modelConfig.endpoint}/api/generate`,
        payload,
        { timeout: config.api_settings.timeout }
      );

      const result = response.data.response;
      
      if (config.api_settings.cache_enabled) {
        this.cache.set(cacheKey, result);
        // Удаление старых записей по TTL
        setTimeout(() => this.cache.delete(cacheKey), config.api_settings.cache_ttl * 1000);
      }

      return result;
    } catch (error) {
      console.error(`Ошибка вызова LLM для задачи ${task}:`, error.message);
      throw error;
    }
  }
}

module.exports = new LLMPool();
```

## Мониторинг и логирование

### Логирование вызовов LLM: `utils/llm-logger.js`
```javascript
const fs = require('fs');
const path = require('path');

class LLMLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  logCall(task, prompt, response, duration) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      task,
      prompt: prompt.substring(0, 200) + '...', // Обрезаем длинные промпты
      responseLength: response.length,
      duration,
      success: true
    };

    const logFile = path.join(this.logDir, `llm-${task}-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }

  logError(task, error) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      task,
      error: error.message,
      success: false
    };

    const logFile = path.join(this.logDir, `llm-errors-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }
}

module.exports = new LLMLogger();
```

## Тестирование LLM

### Тесты для проверки корректности работы LLM: `tests/llm-tests.js`
```javascript
const llmPool = require('../utils/llm-caller');
const logger = require('../utils/llm-logger');

describe('LLM Validation Tests', () => {
  test('Current verification LLM responds correctly', async () => {
    const prompt = 'Ты эксперт в банковских продуктах. Проверь актуальность: {"rate": "59.99%"}';
    const start = Date.now();
    const response = await llmPool.callLLM('current_check', prompt);
    const duration = Date.now() - start;
    
    logger.logCall('current_check', prompt, response, duration);
    
    expect(response).toContain('{'); // Проверяем, что ответ в JSON формате
  });

  test('Credible verification LLM responds correctly', async () => {
    const prompt = 'Ты эксперт в банковских продуктах. Проверь достоверность: {"rate": "59.99%"}';
    const start = Date.now();
    const response = await llmPool.callLLM('credible_check', prompt);
    const duration = Date.now() - start;
    
    logger.logCall('credible_check', prompt, response, duration);
    
    expect(response).toContain('{');
  });
});
```