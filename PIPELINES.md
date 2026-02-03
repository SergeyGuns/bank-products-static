# Pipeline для обработки данных с использованием LLM

## 1. Pipeline проверки актуальности данных

### Описание
Этот pipeline проверяет, соответствуют ли данные в JSON файлах актуальной информации на официальных сайтах банков.

### Этапы
1. **Сканирование файлов** - поиск измененных или новых JSON файлов
2. **Извлечение параметров** - извлечение ключевых параметров продукта
3. **Поиск актуальной информации** - получение актуальных данных с сайта банка
4. **Сравнение** - сравнение параметров с помощью LLM
5. **Формирование отчета** - создание отчета об устаревших данных
6. **Уведомление** - отправка уведомления о необходимости обновления

### Скрипт: `scripts/llm-verify-current.js`
```javascript
// 1. Сканирование файлов
const changedFiles = getChangedJsonFiles();

// 2. Для каждого файла
for (const file of changedFiles) {
  const productData = loadJsonFile(file);
  
  // 3. Извлечение параметров
  const keyParams = extractKeyParameters(productData);
  
  // 4. Получение актуальной информации
  const bankInfo = fetchBankInfo(productData.bankName);
  
  // 5. Сравнение с помощью LLM
  const verificationResult = await llmVerifyCurrent(keyParams, bankInfo);
  
  // 6. Формирование отчета
  if (!verificationResult.isCurrent) {
    generateReport(file, verificationResult);
    notifyToUpdate(file);
  }
}
```

## 2. Pipeline проверки достоверности данных

### Описание
Этот pipeline проверяет логическую согласованность и достоверность информации в JSON файлах.

### Этапы
1. **Загрузка данных** - чтение JSON файла с информацией о продукте
2. **Анализ структуры** - проверка логической согласованности параметров
3. **Проверка с помощью LLM** - анализ достоверности данных
4. **Формирование отчета** - создание отчета о проблемах
5. **Корректировка** - автоматическое исправление очевидных ошибок

### Скрипт: `scripts/llm-verify-credible.js`
```javascript
// 1. Загрузка данных
const productData = loadJsonFile(filePath);

// 2. Анализ структуры
const structuralIssues = checkStructuralConsistency(productData);

// 3. Проверка с помощью LLM
const credibilityResult = await llmVerifyCredible(productData);

// 4. Формирование отчета
const report = {
  issues: [...structuralIssues, ...credibilityResult.issues],
  credibilityScore: credibilityResult.credibilityScore,
  suggestedCorrections: credibilityResult.suggestedCorrections
};

// 5. Корректировка
if (report.suggestedCorrections) {
  applyCorrections(productData, report.suggestedCorrections);
}
```

## 3. Pipeline форматирования и валидации

### Описание
Этот pipeline проверяет формат и структуру JSON файлов и при необходимости форматирует их.

### Этапы
1. **Загрузка файла** - чтение JSON файла
2. **Проверка структуры** - проверка соответствия схеме
3. **Анализ формата** - проверка формата значений
4. **Проверка с помощью LLM** - дополнительная проверка формата
5. **Форматирование** - корректировка формата при необходимости
6. **Сохранение** - сохранение отформатированного файла

### Скрипт: `scripts/llm-format-validate.js`
```javascript
// 1. Загрузка файла
const rawData = readFile(filePath);
let jsonData = parseJson(rawData);

// 2. Проверка структуры
const schemaValidation = validateSchema(jsonData);

// 3. Анализ формата
const formatIssues = analyzeFormat(jsonData);

// 4. Проверка с помощью LLM
const llmValidation = await llmValidateFormat(jsonData);

// 5. Форматирование
const validationReport = {
  isValid: schemaValidation.isValid && llmValidation.isValid,
  errors: [...schemaValidation.errors, ...llmValidation.errors],
  warnings: [...formatIssues.warnings, ...llmValidation.warnings],
  suggestedFixes: llmValidation.suggestedFixes
};

if (!validationReport.isValid) {
  jsonData = applySuggestedFixes(jsonData, validationReport.suggestedFixes);
  saveJsonFile(filePath, jsonData);
}
```

## 4. Pipeline генерации описаний и метаданных

### Описание
Этот pipeline генерирует качественные описания и метаданные для продуктов, у которых они отсутствуют или неполные.

### Этапы
1. **Сканирование файлов** - поиск файлов с неполными описаниями
2. **Извлечение параметров** - извлечение информации для генерации
3. **Генерация с помощью LLM** - создание описаний и метаданных
4. **Валидация генерации** - проверка качества сгенерированного контента
5. **Обновление файла** - добавление сгенерированных данных в JSON
6. **Сохранение** - сохранение обновленного файла

### Скрипт: `scripts/llm-generate-descriptions.js`
```javascript
// 1. Сканирование файлов
const incompleteFiles = findFilesWithIncompleteDescriptions();

// 2. Для каждого файла
for (const file of incompleteFiles) {
  const productData = loadJsonFile(file);
  
  // 3. Извлечение параметров
  const paramsForGeneration = extractParamsForGeneration(productData);
  
  // 4. Генерация с помощью LLM
  const generatedContent = await llmGenerateDescriptions(paramsForGeneration);
  
  // 5. Валидация генерации
  const qualityScore = validateGeneratedContent(generatedContent);
  
  // 6. Обновление файла
  if (qualityScore > MIN_QUALITY_THRESHOLD) {
    updateProductData(productData, generatedContent);
    saveJsonFile(file, productData);
  }
}
```

## 5. Pipeline проверки соответствия типу продукта

### Описание
Этот pipeline проверяет, соответствует ли структура и параметры продукта его заявленному типу.

### Этапы
1. **Загрузка данных** - чтение JSON файла
2. **Извлечение типа** - определение заявленного типа продукта
3. **Анализ параметров** - проверка соответствия параметров типу
4. **Проверка с помощью LLM** - анализ соответствия типу
5. **Формирование отчета** - создание отчета о несоответствиях
6. **Корректировка** - при необходимости корректировка типа или параметров

### Скрипт: `scripts/llm-verify-type.js`
```javascript
// 1. Загрузка данных
const productData = loadJsonFile(filePath);

// 2. Извлечение типа
const declaredType = productData.type;

// 3. Анализ параметров
const typeCompliance = checkTypeCompliance(productData, declaredType);

// 4. Проверка с помощью LLM
const llmVerification = await llmVerifyProductType(productData);

// 5. Формирование отчета
const report = {
  isCorrectType: llmVerification.isCorrectType,
  mismatchedParameters: [...typeCompliance.mismatches, ...llmVerification.mismatchedParameters],
  suggestedType: llmVerification.suggestedType,
  confidence: llmVerification.confidence
};

// 6. Корректировка
if (!report.isCorrectType && report.confidence > CONFIDENCE_THRESHOLD) {
  productData.type = report.suggestedType;
  saveJsonFile(filePath, productData);
}
```

## 6. Pipeline проверки на дубликаты

### Описание
Этот pipeline проверяет, является ли новый продукт дубликатом уже существующего.

### Этапы
1. **Загрузка нового продукта** - чтение JSON файла нового продукта
2. **Поиск похожих** - поиск существующих продуктов того же банка и типа
3. **Сравнение с помощью LLM** - анализ степени схожести
4. **Формирование отчета** - создание отчета о потенциальных дубликатах
5. **Принятие решения** - определение, является ли это дубликатом или обновлением
6. **Уведомление** - уведомление о необходимости проверки

### Скрипт: `scripts/llm-check-duplicates.js`
```javascript
// 1. Загрузка нового продукта
const newProduct = loadJsonFile(newProductPath);

// 2. Поиск похожих
const similarProducts = findSimilarProducts(newProduct);

// 3. Сравнение с помощью LLM
const duplicateCheck = await llmCheckDuplicates(newProduct, similarProducts);

// 4. Формирование отчета
const report = {
  isDuplicate: duplicateCheck.isDuplicate,
  potentialDuplicates: duplicateCheck.potentialDuplicates,
  isUpdate: duplicateCheck.isUpdate,
  similarityNotes: duplicateCheck.similarityNotes
};

// 5. Принятие решения
if (report.isDuplicate) {
  // Это дубликат, возможно, нужно объединить или отклонить
  handleDuplicate(newProduct, report);
} else if (report.isUpdate) {
  // Это обновление существующего продукта
  handleUpdate(newProduct, report);
} else {
  // Это новый продукт
  approveNewProduct(newProduct);
}

// 6. Уведомление
notifyAboutDuplicateCheck(report);
```

## 7. Общий pipeline валидации (orchestration)

### Описание
Этот pipeline объединяет все вышеописанные процессы в единую систему проверки.

### Этапы
1. **Инициализация** - подготовка окружения и конфигурации
2. **Сканирование изменений** - определение измененных файлов
3. **Классификация файлов** - определение типа проверки для каждого файла
4. **Параллельное выполнение** - запуск соответствующих pipeline
5. **Сбор результатов** - агрегация результатов всех проверок
6. **Формирование общего отчета** - создание сводного отчета
7. **Уведомления** - отправка уведомлений о результатах

### Скрипт: `scripts/llm-validation-pipeline.js`
```javascript
// 1. Инициализация
initializeValidationEnvironment();

// 2. Сканирование изменений
const changedFiles = detectChanges();

// 3. Классификация файлов
const fileCategories = categorizeFiles(changedFiles);

// 4. Параллельное выполнение
const validationPromises = [];

if (fileCategories.newProducts.length > 0) {
  validationPromises.push(runDuplicateCheckPipeline(fileCategories.newProducts));
}

if (fileCategories.updatedProducts.length > 0) {
  validationPromises.push(runCurrentVerificationPipeline(fileCategories.updatedProducts));
}

if (fileCategories.newOrIncomplete.length > 0) {
  validationPromises.push(runDescriptionGenerationPipeline(fileCategories.newOrIncomplete));
}

// Запуск всех проверок параллельно
const results = await Promise.all(validationPromises);

// 5. Сбор результатов
const aggregatedResults = aggregateValidationResults(results);

// 6. Формирование общего отчета
const report = generateAggregatedReport(aggregatedResults);

// 7. Уведомления
sendNotifications(report);
```

## Интеграция с Git workflow

### Pre-commit hook
- Запуск базовой валидации перед коммитом
- Проверка структуры JSON файлов
- Быстрая проверка формата

### Pull Request workflow
- Запуск полной валидации при создании PR
- Проверка через все pipeline
- Формирование отчета для ревьюверов
- Блокировка слияния при критических ошибках

### Scheduled workflow
- Периодическая проверка актуальности
- Запуск проверок раз в неделю/месяц
- Создание задач на обновление устаревших данных