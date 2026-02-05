const fs = require('fs').promises;
const path = require('path');

// Конфигурация логирования
const logConfig = {
  logLevel: 'info', // debug, info, warn, error
  logToFile: true,
  logToConsole: true,
  maxLogSize: 10 * 1024 * 1024, // 10MB
  logDirectory: path.join(__dirname, '../logs'),
  logFileName: 'scraper.log'
};

// Уровни логирования
const logLevels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Создаем директорию для логов, если она не существует
async function ensureLogDirectory() {
  try {
    await fs.mkdir(logConfig.logDirectory, { recursive: true });
  } catch (error) {
    console.error('Ошибка при создании директории для логов:', error.message);
  }
}

// Проверяем уровень логирования
function shouldLog(level) {
  return logLevels[level] >= logLevels[logConfig.logLevel];
}

// Форматируем сообщение лога
function formatLogMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta
  };
  
  return JSON.stringify(logEntry, null, 2);
}

// Проверяем размер файла лога
async function checkLogFileSize() {
  try {
    const logFilePath = path.join(logConfig.logDirectory, logConfig.logFileName);
    const stats = await fs.stat(logFilePath);
    
    if (stats.size > logConfig.maxLogSize) {
      // Архивируем текущий файл лога
      const archiveName = `${logConfig.logFileName}.${Date.now()}.bak`;
      const archivePath = path.join(logConfig.logDirectory, archiveName);
      
      await fs.rename(logFilePath, archivePath);
      console.log(`Лог-файл архивирован как ${archiveName} из-за превышения размера`);
    }
  } catch (error) {
    // Файл может не существовать, это нормально
    if (error.code !== 'ENOENT') {
      console.error('Ошибка при проверке размера лог-файла:', error.message);
    }
  }
}

// Записываем сообщение в лог
async function writeLog(level, message, meta = {}) {
  if (!shouldLog(level)) {
    return;
  }
  
  const logMessage = formatLogMessage(level, message, meta);
  
  // Выводим в консоль
  if (logConfig.logToConsole) {
    const consoleMessage = `[${level.toUpperCase()}] ${new Date().toLocaleString()} - ${message}`;
    if (Object.keys(meta).length > 0) {
      console.log(consoleMessage, meta);
    } else {
      console.log(consoleMessage);
    }
  }
  
  // Записываем в файл
  if (logConfig.logToFile) {
    try {
      await ensureLogDirectory();
      await checkLogFileSize();
      
      const logFilePath = path.join(logConfig.logDirectory, logConfig.logFileName);
      await fs.appendFile(logFilePath, logMessage + '\n');
    } catch (error) {
      console.error('Ошибка при записи в лог-файл:', error.message);
    }
  }
}

// Создаем функции для разных уровней логирования
const logger = {
  debug: async (message, meta = {}) => {
    await writeLog('debug', message, meta);
  },
  
  info: async (message, meta = {}) => {
    await writeLog('info', message, meta);
  },
  
  warn: async (message, meta = {}) => {
    await writeLog('warn', message, meta);
  },
  
  error: async (message, meta = {}) => {
    await writeLog('error', message, meta);
  },
  
  // Метод для установки уровня логирования
  setLogLevel: (level) => {
    if (logLevels.hasOwnProperty(level)) {
      logConfig.logLevel = level;
    } else {
      console.error(`Неверный уровень логирования: ${level}`);
    }
  },
  
  // Метод для получения статистики по логам
  getStats: async () => {
    try {
      const logFilePath = path.join(logConfig.logDirectory, logConfig.logFileName);
      const stats = await fs.stat(logFilePath);
      
      return {
        size: stats.size,
        lastModified: stats.mtime,
        path: logFilePath
      };
    } catch (error) {
      return null;
    }
  }
};

module.exports = logger;