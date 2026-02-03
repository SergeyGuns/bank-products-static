/**
 * Скрипт для системы уведомлений об устаревших данных
 * 
 * Этот скрипт анализирует результаты сканирования и отправляет уведомления
 * о продуктах, которые требуют обновления
 */

const fs = require('fs').promises;
const path = require('path');

// Конфигурация уведомлений
const notificationConfig = {
  // Порог устаревания (в днях)
  expirationThreshold: 90, // 3 месяца
  
  // Типы уведомлений
  notificationTypes: {
    LOW: { level: 'low', priority: 1, description: 'Информация устаревает' },
    MEDIUM: { level: 'medium', priority: 2, description: 'Требуется обновление' },
    HIGH: { level: 'high', priority: 3, description: 'Срочно требуется обновление' }
  },
  
  // Методы уведомлений
  notificationMethods: {
    EMAIL: 'email',
    CONSOLE: 'console',
    GITHUB_ISSUE: 'github_issue',
    FILE_LOG: 'file_log'
  }
};

/**
 * Функция для определения статуса устаревания продукта
 */
function determineExpirationStatus(productData) {
  if (!productData.version || !productData.version.date) {
    return {
      status: 'MISSING_DATE',
      level: notificationConfig.notificationTypes.HIGH.level,
      daysSinceUpdate: null,
      message: 'Отсутствует дата обновления'
    };
  }
  
  const updateDate = new Date(productData.version.date);
  const currentDate = new Date();
  const daysSinceUpdate = Math.floor((currentDate - updateDate) / (1000 * 60 * 60 * 24));
  
  let status, level, message;
  
  if (daysSinceUpdate > 365) { // больше года
    status = 'EXPIRED_CRITICAL';
    level = notificationConfig.notificationTypes.HIGH.level;
    message = `Информация устарела более чем на год (${daysSinceUpdate} дней назад)`;
  } else if (daysSinceUpdate > 180) { // больше полугода
    status = 'EXPIRED';
    level = notificationConfig.notificationTypes.MEDIUM.level;
    message = `Информация устарела более чем на полгода (${daysSinceUpdate} дней назад)`;
  } else if (daysSinceUpdate > 90) { // больше 3 месяцев
    status = 'EXPIRING_SOON';
    level = notificationConfig.notificationTypes.LOW.level;
    message = `Информация устаревает (${daysSinceUpdate} дней назад)`;
  } else {
    status = 'UP_TO_DATE';
    level = null;
    message = 'Информация актуальна';
  }
  
  return {
    status,
    level,
    daysSinceUpdate,
    message
  };
}

/**
 * Функция для создания уведомления
 */
function createNotification(productData, scanResult) {
  const expirationStatus = determineExpirationStatus(productData);
  
  if (!expirationStatus.level) {
    // Если информация актуальна, не создаем уведомление
    return null;
  }
  
  return {
    productId: productData.id,
    productName: productData.title,
    bankName: productData.bankName,
    productType: productData.type,
    expirationStatus: expirationStatus.status,
    urgencyLevel: expirationStatus.level,
    daysSinceUpdate: expirationStatus.daysSinceUpdate,
    message: expirationStatus.message,
    source: productData.version?.source || 'Неизвестен',
    lastUpdated: productData.version?.date || 'Неизвестна',
    scanDate: scanResult?.timestamp || new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
}

/**
 * Функция для отправки уведомления в консоль
 */
function sendConsoleNotification(notification) {
  const urgencyColors = {
    low: '\x1b[33m',    // желтый
    medium: '\x1b[31m',  // красный
    high: '\x1b[35m'    // фиолетовый
  };
  
  const resetColor = '\x1b[0m';
  
  console.log(
    `${urgencyColors[notification.urgencyLevel] || ''}` +
    `[${notification.urgencyLevel.toUpperCase()}] ` +
    `Продукт "${notification.productName}" (${notification.bankName}) ` +
    `${notification.message}${resetColor}`
  );
}

/**
 * Функция для отправки уведомления в файл
 */
async function sendFileNotification(notification) {
  const logPath = path.join(__dirname, '../data/expired-notifications.log');
  const logEntry = `${new Date().toISOString()} - [${notification.urgencyLevel.toUpperCase()}] ` +
    `Продукт "${notification.productName}" (${notification.bankName}) ${notification.message}\n`;
  
  try {
    await fs.appendFile(logPath, logEntry);
  } catch (error) {
    console.error('Ошибка при записи в лог-файл:', error.message);
  }
}

/**
 * Функция для отправки уведомления через email (заглушка)
 */
function sendEmailNotification(notification) {
  // В реальной реализации здесь будет отправка email
  console.log(`EMAIL NOTIFICATION: ${notification.message}`);
  console.log(`TO: admin@bank-select.ru`);
  console.log(`SUBJECT: Устаревшая информация о продукте ${notification.productName}`);
}

/**
 * Функция для создания GitHub issue (заглушка)
 */
async function sendGithubIssueNotification(notification) {
  // В реальной реализации здесь будет создание GitHub issue
  console.log(`GITHUB ISSUE: ${notification.message}`);
  console.log(`TITLE: Обновить информацию о продукте ${notification.productName}`);
}

/**
 * Функция для отправки уведомления
 */
async function sendNotification(notification, methods = ['CONSOLE']) {
  for (const method of methods) {
    switch (method) {
      case 'CONSOLE':
        sendConsoleNotification(notification);
        break;
      case 'FILE_LOG':
        await sendFileNotification(notification);
        break;
      case 'EMAIL':
        sendEmailNotification(notification);
        break;
      case 'GITHUB_ISSUE':
        await sendGithubIssueNotification(notification);
        break;
      default:
        console.warn(`Неизвестный метод уведомления: ${method}`);
    }
  }
}

/**
 * Основная функция для проверки устаревших данных
 */
async function checkExpiredData(productsPath = '../data/pdfs', scanResultsPath = '../data/scraping-results.json') {
  console.log('Проверка устаревших данных...');
  
  // Загрузка всех продуктов
  const allProducts = await loadAllProducts(productsPath);
  
  // Загрузка результатов сканирования (если есть)
  let scanResults = null;
  try {
    const scanResultsContent = await fs.readFile(path.join(__dirname, scanResultsPath), 'utf8');
    scanResults = JSON.parse(scanResultsContent);
  } catch (error) {
    console.log('Результаты сканирования не найдены, продолжаем без них');
  }
  
  const notifications = [];
  
  // Проверка каждого продукта
  for (const product of allProducts) {
    const notification = createNotification(product, scanResults?.results?.find(r => r.bank === product.bankName));
    
    if (notification) {
      notifications.push(notification);
    }
  }
  
  // Сортировка уведомлений по приоритетности
  notifications.sort((a, b) => {
    const priorityMap = { high: 3, medium: 2, low: 1 };
    return priorityMap[b.urgencyLevel] - priorityMap[a.urgencyLevel];
  });
  
  console.log(`Найдено ${notifications.length} устаревших продуктов`);
  
  // Отправка уведомлений
  for (const notification of notifications) {
    await sendNotification(notification, ['CONSOLE', 'FILE_LOG']);
  }
  
  // Сохранение уведомлений
  await saveNotifications(notifications);
  
  return notifications;
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
 * Сохранение уведомлений в файл
 */
async function saveNotifications(notifications) {
  if (notifications.length === 0) {
    return;
  }
  
  const outputPath = path.join(__dirname, '../data/expired-notifications.json');
  const outputData = {
    checkDate: new Date().toISOString(),
    count: notifications.length,
    notifications: notifications
  };
  
  try {
    await fs.writeFile(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
    console.log(`Уведомления об устаревших данных сохранены в ${outputPath}`);
  } catch (error) {
    console.error('Ошибка при сохранении уведомлений:', error.message);
  }
}

/**
 * Запуск проверки устаревших данных
 */
async function runExpirationCheck() {
  try {
    const notifications = await checkExpiredData();
    
    console.log('\nСтатистика проверки:');
    console.log(`- Всего уведомлений: ${notifications.length}`);
    
    const counts = { high: 0, medium: 0, low: 0 };
    notifications.forEach(n => counts[n.urgencyLevel]++);
    
    console.log(`- Высокий приоритет: ${counts.high}`);
    console.log(`- Средний приоритет: ${counts.medium}`);
    console.log(`- Низкий приоритет: ${counts.low}`);
    
    return notifications;
  } catch (error) {
    console.error('Ошибка при проверке устаревших данных:', error.message);
    throw error;
  }
}

// Если файл запускается напрямую
if (require.main === module) {
  runExpirationCheck().catch(console.error);
}

module.exports = {
  checkExpiredData,
  runExpirationCheck,
  determineExpirationStatus,
  createNotification
};