const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

class UrlManager {
  constructor() {
    this.urlsConfigPath = path.join(__dirname, '../config/bank-urls-config.json');
    this.defaultUrlsConfig = {
      "lastUpdated": new Date().toISOString(),
      "banks": []
    };
  }

  /**
   * Загружает конфигурацию URL из файла
   * @returns {Promise<Object>} Конфигурация URL
   */
  async loadUrlsConfig() {
    try {
      const data = await fs.readFile(this.urlsConfigPath, 'utf8');
      const config = JSON.parse(data);
      await logger.info('Конфигурация URL успешно загружена', { path: this.urlsConfigPath });
      return config;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Файл не существует, создаем с конфигурацией по умолчанию
        await this.saveUrlsConfig(this.defaultUrlsConfig);
        await logger.info('Создана новая конфигурация URL по умолчанию', { path: this.urlsConfigPath });
        return this.defaultUrlsConfig;
      } else {
        await logger.error(`Ошибка при загрузке конфигурации URL: ${error.message}`, { path: this.urlsConfigPath });
        throw error;
      }
    }
  }

  /**
   * Сохраняет конфигурацию URL в файл
   * @param {Object} config - Конфигурация URL для сохранения
   */
  async saveUrlsConfig(config) {
    try {
      // Обновляем дату последнего обновления
      config.lastUpdated = new Date().toISOString();
      
      await fs.writeFile(this.urlsConfigPath, JSON.stringify(config, null, 2), 'utf8');
      await logger.info('Конфигурация URL успешно сохранена', { path: this.urlsConfigPath });
    } catch (error) {
      await logger.error(`Ошибка при сохранении конфигурации URL: ${error.message}`, { path: this.urlsConfigPath });
      throw error;
    }
  }

  /**
   * Обновляет URL для конкретного банка
   * @param {string} bankName - Название банка
   * @param {Array<string>} newUrls - Новые URL для банка
   * @returns {Promise<boolean>} Успешность обновления
   */
  async updateBankUrls(bankName, newUrls) {
    try {
      const config = await this.loadUrlsConfig();
      
      // Находим банк в конфигурации
      const bankIndex = config.banks.findIndex(bank => bank.name === bankName);
      
      if (bankIndex !== -1) {
        // Обновляем URL для существующего банка
        config.banks[bankIndex].urls = newUrls;
        config.banks[bankIndex].lastUpdated = new Date().toISOString();
      } else {
        // Добавляем новый банк
        config.banks.push({
          name: bankName,
          urls: newUrls,
          lastUpdated: new Date().toISOString()
        });
      }
      
      await this.saveUrlsConfig(config);
      await logger.info(`URL для банка ${bankName} успешно обновлены`, { bankName, newUrls });
      
      return true;
    } catch (error) {
      await logger.error(`Ошибка при обновлении URL для банка ${bankName}: ${error.message}`, { bankName });
      return false;
    }
  }

  /**
   * Добавляет новый URL к существующему списку URL для банка
   * @param {string} bankName - Название банка
   * @param {string} newUrl - Новый URL для добавления
   * @returns {Promise<boolean>} Успешность добавления
   */
  async addUrlToBank(bankName, newUrl) {
    try {
      const config = await this.loadUrlsConfig();
      
      // Находим банк в конфигурации
      const bankIndex = config.banks.findIndex(bank => bank.name === bankName);
      
      if (bankIndex !== -1) {
        // Проверяем, что URL не дублируется
        if (!config.banks[bankIndex].urls.includes(newUrl)) {
          config.banks[bankIndex].urls.push(newUrl);
          config.banks[bankIndex].lastUpdated = new Date().toISOString();
        }
      } else {
        // Создаем новый банк с одним URL
        config.banks.push({
          name: bankName,
          urls: [newUrl],
          lastUpdated: new Date().toISOString()
        });
      }
      
      await this.saveUrlsConfig(config);
      await logger.info(`Новый URL добавлен для банка ${bankName}`, { bankName, newUrl });
      
      return true;
    } catch (error) {
      await logger.error(`Ошибка при добавлении URL для банка ${bankName}: ${error.message}`, { bankName, newUrl });
      return false;
    }
  }

  /**
   * Удаляет URL для банка
   * @param {string} bankName - Название банка
   * @param {string} urlToRemove - URL для удаления
   * @returns {Promise<boolean>} Успешность удаления
   */
  async removeUrlFromBank(bankName, urlToRemove) {
    try {
      const config = await this.loadUrlsConfig();
      
      // Находим банк в конфигурации
      const bankIndex = config.banks.findIndex(bank => bank.name === bankName);
      
      if (bankIndex !== -1) {
        // Удаляем URL из списка
        config.banks[bankIndex].urls = config.banks[bankIndex].urls.filter(url => url !== urlToRemove);
        config.banks[bankIndex].lastUpdated = new Date().toISOString();
        
        await this.saveUrlsConfig(config);
        await logger.info(`URL удален для банка ${bankName}`, { bankName, urlToRemove });
        
        return true;
      } else {
        await logger.warn(`Банк ${bankName} не найден при попытке удалить URL`, { bankName, urlToRemove });
        return false;
      }
    } catch (error) {
      await logger.error(`Ошибка при удалении URL для банка ${bankName}: ${error.message}`, { bankName, urlToRemove });
      return false;
    }
  }

  /**
   * Получает все URL для банка
   * @param {string} bankName - Название банка
   * @returns {Promise<Array<string>>} Список URL для банка
   */
  async getBankUrls(bankName) {
    try {
      const config = await this.loadUrlsConfig();
      
      const bank = config.banks.find(bank => bank.name === bankName);
      if (bank) {
        return bank.urls;
      } else {
        await logger.warn(`Банк ${bankName} не найден в конфигурации URL`, { bankName });
        return [];
      }
    } catch (error) {
      await logger.error(`Ошибка при получении URL для банка ${bankName}: ${error.message}`, { bankName });
      return [];
    }
  }

  /**
   * Получает все банки и их URL из конфигурации
   * @returns {Promise<Array>} Список банков с их URL
   */
  async getAllBanksWithUrls() {
    try {
      const config = await this.loadUrlsConfig();
      return config.banks;
    } catch (error) {
      await logger.error(`Ошибка при получении всех банков с URL: ${error.message}`);
      return [];
    }
  }

  /**
   * Обновляет основную конфигурацию банка в основном файле конфигурации
   * @param {Array} updatedBanks - Обновленный список банков
   */
  async updateMainConfig(updatedBanks) {
    // Эта функция будет использоваться для обновления основной конфигурации в bank-scraper.js
    // В реальном приложении она может обновлять основной файл конфигурации
    await logger.info('Обновление основной конфигурации банков', { bankCount: updatedBanks.length });
  }
}

module.exports = new UrlManager();