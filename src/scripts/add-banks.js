/**
 * Скрипт для добавления банков и их продуктов
 * 
 * Этот скрипт автоматизирует процесс добавления банков и их продуктов
 * на основе списка топ-50 банков России
 */

const fs = require('fs').promises;
const path = require('path');

// Список топ-50 банков России (упрощенная версия)
const top50Banks = [
  { id: 'sberbank', name: 'Сбербанк', fullName: 'Публичное акционерное общество "Сбербанк России"', website: 'https://www.sberbank.ru' },
  { id: 'vtb', name: 'ВТБ', fullName: 'Банк ВТБ (ПАО)', website: 'https://www.vtb.ru' },
  { id: 'gazprombank', name: 'Газпромбанк', fullName: 'Публичное акционерное общество "Газпромбанк"', website: 'https://www.gazprombank.ru' },
  { id: 'sberbank-insurance', name: 'Сбербанк-страхование', fullName: 'Публичное акционерное общество "Сбербанк-страхование"', website: 'https://sberins.ru' },
  { id: 'alfa-bank', name: 'Альфа-Банк', fullName: 'Акционерное общество "АЛЬФА-БАНК"', website: 'https://alfabank.ru' },
  { id: 'raiffeisenbank', name: 'Райффайзенбанк', fullName: 'Публичное акционерное общество Кредитное учреждение "Райффайзенбанк"', website: 'https://www.raiffeisen.ru' },
  { id: 'rosbank', name: 'Росбанк', fullName: 'Публичное акционерное общество "Росбанк"', website: 'https://www.rosbank.ru' },
  { id: 'promsvyazbank', name: 'Промсвязьбанк', fullName: 'Публичное акционерное общество "Промсвязьбанк"', website: 'https://www.psbank.ru' },
  { id: 'tinkoff', name: 'Тинькофф', fullName: 'Акционерное общество "Тинькофф Банк"', website: 'https://www.tinkoff.ru' },
  { id: 'homecredit', name: 'Хоум Кредит', fullName: 'Публичное акционерное общество "Хоум Кредит энд Финанс Банк"', website: 'https://www.homecredit.ru' },
  { id: 'sovcombank', name: 'Совкомбанк', fullName: 'Публичное акционерное общество "Совкомбанк"', website: 'https://sovcombank.ru' },
  { id: 'ak-bars', name: 'АК БАРС', fullName: 'Публичное акционерное общество "АК БАРС БАНК"', website: 'https://www.akbars.ru' },
  { id: 'mtsbank', name: 'МТС Банк', fullName: 'Публичное акционерное общество "МТС Банк"', website: 'https://www.mtsbank.ru' },
  { id: 'gosstrakh', name: 'Госстрах', fullName: 'Публичное акционерное общество "Страховая компания "Госстрах"', website: 'https://www.gosuslugi.ru' }, // условный пример
  { id: 'qiwi', name: 'Киви', fullName: 'Публичное акционерное общество "Киви Банк"', website: 'https://qiwi.com' },
  { id: 'vozrozhdenie', name: 'Возрождение', fullName: 'Публичное акционерное общество "Банк ВОЗРОЖДЕНИЕ"', website: 'https://www.bvrz.ru' },
  { id: 'rencredit', name: 'Ренессанс Кредит', fullName: 'Публичное акционерное общество "Кредит Европа Банк"', website: 'https://rencredit.ru' },
  { id: 'unicredit', name: 'Юникредит', fullName: 'Публичное акционерное общество "Юникредит Банк"', website: 'https://www.unicredit.ru' },
  { id: 'raiffeisen', name: 'Райффайзен', fullName: 'Публичное акционерное общество Кредитное учреждение "Райффайзенбанк"', website: 'https://www.raiffeisen.ru' },
  { id: 'absolut', name: 'Абсолют', fullName: 'Публичное акционерное общество "Абсолют Банк"', website: 'https://www.absolutbank.ru' },
  { id: 'avangard', name: 'Авангард', fullName: 'Публичное акционерное общество "Авангард"', website: 'https://www.avangard.ru' },
  { id: 'avtograd', name: 'АВТОГРАД', fullName: 'Публичное акционерное общество "АВТОГРАДБАНК"', website: 'https://www.avtogradbank.ru' },
  { id: 'bank-uralsib', name: 'Уралсиб', fullName: 'Публичное акционерное общество "Банк Уралсиб"', website: 'https://www.uralsib.ru' },
  { id: 'binbank', name: 'Бинбанк', fullName: 'Публичное акционерное общество "БИНБАНК"', website: 'https://www.binbank.ru' },
  { id: 'bm-bank', name: 'БМ Банк', fullName: 'Общество с ограниченной ответственностью "БМ БАНК"', website: 'https://www.bmbank.ru' },
  { id: 'bnk-renaissance', name: 'БНК', fullName: 'Публичное акционерное общество "БНК"', website: 'https://www.bnk.ru' },
  { id: 'centr-invest', name: 'Центр-инвест', fullName: 'Публичное акционерное общество "Банк "Центр-инвест"', website: 'https://www.centrinvest.ru' },
  { id: 'citibank', name: 'Ситибанк', fullName: 'Публичное акционерное общество "Ситибанк"', website: 'https://www.citibank.ru' },
  { id: 'credit-europe', name: 'Кредит Европа', fullName: 'Публичное акционерное общество "Кредит Европа Банк"', website: 'https://www.credit-europe.ru' },
  { id: 'deltacredit', name: 'ДельтаКредит', fullName: 'Публичное акционерное общество "ДельтаКредит"', website: 'https://www.deltacredit.ru' },
  { id: 'expobank', name: 'Экспобанк', fullName: 'Публичное акционерное общество "Экспобанк"', website: 'https://www.expobank.ru' },
  { id: 'finservice', name: 'Финсервис', fullName: 'Публичное акционерное общество "Банк Финсервис"', website: 'https://www.finservice.ru' },
  { id: 'globexbank', name: 'Глобэкс', fullName: 'Публичное акционерное общество "Коммерческий банк "Глобэкс"', website: 'https://www.globexbank.ru' },
  { id: 'grazhdan', name: 'Гражданский', fullName: 'Публичное акционерное общество "Гражданский банк"', website: 'https://www.grazhdan.ru' },
  { id: 'intesa', name: 'Интеком', fullName: 'Публичное акционерное общество "Интекомбанк"', website: 'https://www.intesabank.ru' },
  { id: 'jetcoin', name: 'Джеткоин', fullName: 'Публичное акционерное общество "Джеткоин"', website: 'https://jetcoinbank.ru' },
  { id: 'jpmorgan', name: 'Джей Пи Морган', fullName: 'Публичное акционерное общество "Джей Пи Морган Чейз Банк"', website: 'https://www.jpmorgan.ru' },
  { id: 'kuznetsky', name: 'Кузнецкий', fullName: 'Публичное акционерное общество "Кузнецкий мост"', website: 'https://www.kuzbank.ru' },
  { id: 'mkb', name: 'МКБ', fullName: 'Публичное акционерное общество "Московский кредитный банк"', website: 'https://www.mkb.ru' },
  { id: 'mib', name: 'Металлинвестбанк', fullName: 'Публичное акционерное общество "Металлинвестбанк"', website: 'https://www.mib.ru' },
  { id: 'modulbank', name: 'Модульбанк', fullName: 'Акционерное общество "Модульбанк"', website: 'https://modulbank.ru' },
  { id: 'mosprombank', name: 'Моспромбанк', fullName: 'Публичное акционерное общество "Моспромбанк"', website: 'https://www.mosprombank.ru' },
  { id: 'moscow', name: 'Москва', fullName: 'Публичное акционерное общество "Банк Москвы"', website: 'https://www.bm.ru' },
  { id: 'nbd-bank', name: 'НБД-Банк', fullName: 'Публичное акционерное общество "НБД-Банк"', website: 'https://www.nbd.ru' },
  { id: 'novikom', name: 'Новиком', fullName: 'Публичное акционерное общество "Новикомбанк"', website: 'https://www.novikom.ru' },
  { id: 'novofond', name: 'Новофонд', fullName: 'Публичное акционерное общество "Новофондбанк"', website: 'https://www.novofond.ru' },
  { id: 'ocity', name: 'О-Сити', fullName: 'Публичное акционерное общество "О-Сити Банк"', website: 'https://o-city.ru' },
  { id: 'open', name: 'Открытие', fullName: 'Публичное акционерное общество "Банк "Открытие"', website: 'https://www.open.ru' },
  { id: 'otp', name: 'ОТП', fullName: 'Публичное акционерное общество "ОТП Банк"', website: 'https://www.otpbank.ru' },
  { id: 'psb', name: 'Промсвязьбанк', fullName: 'Публичное акционерное общество "Промсвязьбанк"', website: 'https://psbank.ru' }
];

/**
 * Функция для создания структуры директории для банка
 */
async function createBankStructure(bankId) {
  const bankDirPath = path.join(__dirname, `../data/pdfs/${bankId}`);
  
  try {
    // Создание директории для банка
    await fs.mkdir(bankDirPath, { recursive: true });
    
    // Создание поддиректорий для различных типов продуктов
    const productTypes = ['credit-cards', 'debit-cards', 'credits', 'deposits', 'mortgage', 'auto-loans'];
    for (const type of productTypes) {
      const typeDirPath = path.join(bankDirPath, type);
      await fs.mkdir(typeDirPath, { recursive: true });
    }
    
    console.log(`Структура для банка ${bankId} создана`);
    return bankDirPath;
  } catch (error) {
    console.error(`Ошибка при создании структуры для банка ${bankId}:`, error.message);
    throw error;
  }
}

/**
 * Функция для создания шаблона банка
 */
function createBankTemplate(bankInfo) {
  return {
    id: bankInfo.id,
    name: bankInfo.name,
    fullName: bankInfo.fullName,
    website: bankInfo.website,
    logoUrl: `/img/bank-logos/${bankInfo.id}.png`, // предполагаем, что логотипы будут добавлены отдельно
    rating: null, // будет заполнен позже
    updatedAt: new Date().toISOString(),
    addedAt: new Date().toISOString(),
    isActive: true
  };
}

/**
 * Функция для создания шаблона продукта
 */
function createProductTemplate(productId, bankInfo, productType, productName) {
  return {
    id: productId,
    type: productType,
    bankName: bankInfo.name,
    title: productName,
    featured: false,
    shortDescription: `Краткое описание ${productName}`,
    fullDescription: `Полное описание ${productName} от ${bankInfo.name}`,
    imageUrl: `/img/products/${productId}.jpg`,
    features: [],
    conditions: [],
    referralLink: null,
    version: {
      date: new Date().toISOString().split('T')[0], // формат YYYY-MM-DD
      source: bankInfo.website,
      updatedBy: 'system'
    },
    parameters: {
      main: {},
      fees: {},
      requirements: {},
      cashback: {}
    },
    validFrom: new Date().toISOString().split('T')[0],
    status: 'active',
    meta: {
      title: `${productName} - ${bankInfo.name} | Bank Select`,
      description: `Информация о продукте ${productName} от ${bankInfo.name}. Условия, требования, преимущества.`
    }
  };
}

/**
 * Функция для добавления банка и его шаблонов продуктов
 */
async function addBank(bankInfo) {
  console.log(`Добавление банка: ${bankInfo.name}`);
  
  // Создание структуры директории для банка
  await createBankStructure(bankInfo.id);
  
  // Создание шаблона банка и сохранение в общем списке банков
  const bankTemplate = createBankTemplate(bankInfo);
  await saveBankInfo(bankTemplate);
  
  // Создание шаблонов для основных типов продуктов
  const productTypes = [
    { type: 'credit-cards', name: 'Кредитные карты' },
    { type: 'debit-cards', name: 'Дебетовые карты' },
    { type: 'credits', name: 'Кредиты наличными' },
    { type: 'deposits', name: 'Вклады и накопительные счета' },
    { type: 'mortgage', name: 'Ипотечные кредиты' },
    { type: 'auto-loans', name: 'Автокредиты' }
  ];
  
  for (const prod of productTypes) {
    const productId = `${bankInfo.id}-${prod.type}-${Date.now()}`;
    const productTemplate = createProductTemplate(productId, bankInfo, prod.type, `${prod.name} ${bankInfo.name}`);
    
    await saveProductTemplate(bankInfo.id, prod.type, productTemplate);
  }
  
  console.log(`Банк ${bankInfo.name} успешно добавлен`);
}

/**
 * Функция для сохранения информации о банке
 */
async function saveBankInfo(bankTemplate) {
  const banksFilePath = path.join(__dirname, '../data/banks.json');
  
  let banks = [];
  
  // Загрузка существующего файла банков
  try {
    const banksFileContent = await fs.readFile(banksFilePath, 'utf8');
    banks = JSON.parse(banksFileContent);
  } catch (error) {
    // Если файл не существует, начинаем с пустого массива
    if (error.code !== 'ENOENT') {
      console.error('Ошибка при чтении файла банков:', error.message);
    }
  }
  
  // Проверка, существует ли уже банк
  const existingBankIndex = banks.findIndex(bank => bank.id === bankTemplate.id);
  
  if (existingBankIndex !== -1) {
    // Обновляем существующую запись
    banks[existingBankIndex] = { ...banks[existingBankIndex], ...bankTemplate };
  } else {
    // Добавляем новую запись
    banks.push(bankTemplate);
  }
  
  // Сохранение обновленного списка банков
  await fs.writeFile(banksFilePath, JSON.stringify(banks, null, 2), 'utf8');
}

/**
 * Функция для сохранения шаблона продукта
 */
async function saveProductTemplate(bankId, productType, productTemplate) {
  const productDirPath = path.join(__dirname, `../data/pdfs/${bankId}/${productType}`);
  const fileName = `${productTemplate.id}.json`;
  const filePath = path.join(productDirPath, fileName);
  
  await fs.writeFile(filePath, JSON.stringify(productTemplate, null, 2), 'utf8');
}

/**
 * Основная функция для добавления топ-50 банков
 */
async function addTop50Banks() {
  console.log('Начало добавления топ-50 банков России...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const bank of top50Banks) {
    try {
      await addBank(bank);
      successCount++;
      
      // Небольшая задержка, чтобы не перегружать систему
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Ошибка при добавлении банка ${bank.name}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\nПроцесс добавления банков завершен:`);
  console.log(`- Успешно добавлено: ${successCount}`);
  console.log(`- Ошибок: ${errorCount}`);
  
  return { successCount, errorCount };
}

/**
 * Функция для добавления конкретного банка по ID
 */
async function addSingleBank(bankId) {
  const bank = top50Banks.find(b => b.id === bankId);
  
  if (!bank) {
    throw new Error(`Банк с ID ${bankId} не найден в списке топ-50`);
  }
  
  await addBank(bank);
  console.log(`Банк ${bank.name} успешно добавлен`);
}

// Если файл запускается напрямую
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0 && args[0] === '--single') {
    // Добавление одного банка по ID
    const bankId = args[1];
    if (!bankId) {
      console.error('Укажите ID банка для добавления: node add-banks.js --single <bank-id>');
      process.exit(1);
    }
    
    addSingleBank(bankId).catch(console.error);
  } else {
    // Добавление всех топ-50 банков
    addTop50Banks().catch(console.error);
  }
}

module.exports = {
  addTop50Banks,
  addSingleBank,
  addBank,
  createBankTemplate,
  createProductTemplate,
  top50Banks
};