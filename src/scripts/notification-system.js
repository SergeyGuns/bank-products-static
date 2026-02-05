/**
 * Система уведомлений о недоступности ресурсов
 * Создано в рамках улучшения процесса сбора данных
 */

const fs = require('fs').promises;
const path = require('path');

// Система уведомлений
const notificationSystem = {
  /**
   * Уведомление о недоступности ресурса
   */
  async notifyResourceUnavailable(url, bankName, errorMessage, errorCategory) {
    console.log(`Уведомление: Ресурс недоступен - ${url}`);
    console.log(`Банк: ${bankName}, Ошибка: ${errorMessage}, Категория: ${errorCategory}`);
    
    // Логируем ошибку в файл
    const logEntry = {
      timestamp: new Date().toISOString(),
      url,
      bankName,
      errorMessage,
      errorCategory
    };
    
    try {
      const logPath = path.join(__dirname, '..', 'logs', 'availability-issues.json');
      await fs.appendFile(logPath, JSON.stringify(logEntry) + '\\n', 'utf8');
    } catch (error) {
      console.error('Ошибка при записи лога недоступности:', error.message);
    }
    
    // Здесь можно добавить отправку уведомлений по email, Slack и т.д.
    // Пока просто логируем
  },
  
  /**
   * Уведомление об успешном восстановлении ресурса
   */
  async notifyResourceRestored(url, bankName) {
    console.log(`Уведомление: Ресурс восстановлен - ${url}`);
    console.log(`Банк: ${bankName}`);
    
    // Здесь можно добавить логику уведомления о восстановлении
  }
};

module.exports = notificationSystem;