/**
 * Улучшенный обработчик ошибок для процесса сбора данных
 * Создано в рамках улучшения процесса сбора данных
 */

// Обработчик ошибок
class ErrorHandler {
  /**
   * Обработка сетевых ошибок
   */
  static async handleNetworkError(error, url) {
    const errorInfo = {
      url,
      type: 'network',
      subtype: error.code || 'unknown',
      message: error.message,
      timestamp: new Date().toISOString()
    };
    
    console.error(`Сетевая ошибка при доступе к ${url}: ${error.message}`);
    return errorInfo;
  }
  
  /**
   * Обработка ошибок скрапинга
   */
  static async handleScrapingError(error, url, method) {
    const errorInfo = {
      url,
      method,
      type: 'scraping',
      subtype: error.response ? error.response.status : error.code || 'unknown',
      message: error.message,
      timestamp: new Date().toISOString()
    };
    
    console.error(`Ошибка скрапинга ${method} для ${url}: ${error.message}`);
    return errorInfo;
  }
  
  /**
   * Обработка ошибок Puppeteer
   */
  static async handlePuppeteerError(error, url) {
    const errorInfo = {
      url,
      type: 'puppeteer',
      subtype: error.constructor.name,
      message: error.message,
      timestamp: new Date().toISOString()
    };
    
    console.error(`Ошибка Puppeteer для ${url}: ${error.message}`);
    return errorInfo;
  }
  
  /**
   * Проверка, является ли ошибка фатальной
   */
  static isFatalError(errorInfo) {
    const fatalErrors = ['ENOTFOUND', 'ECONNREFUSED', 'CERT_HAS_EXPIRED', 'SELF_SIGNED_CERT_IN_CHAIN'];
    return fatalErrors.includes(errorInfo.subtype) || 
           (typeof errorInfo.subtype === 'number' && errorInfo.subtype >= 500);
  }
}

module.exports = { ErrorHandler };