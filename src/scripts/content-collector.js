#!/usr/bin/env node

/**
 * Content Collector — сбор данных о продуктах с веб-страниц
 *
 * Использует DuckDuckGo для поиска и curl для извлечения данных.
 * Извлекает структурированную информацию из текста страниц.
 *
 * Использование: node src/scripts/content-collector.js
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');
const OUTPUT_FILE = path.join(__dirname, '../data/collected-products.json');

// Задачи для сбора данных
const TASKS = [
  // СберБанк
  { bank: 'СберБанк', type: 'credit-cards', url: 'https://bankiclub.ru/creditcards/sber-karta/', title: 'СберКарта' },
  { bank: 'СберБанк', type: 'debit-cards', url: 'https://bankiclub.ru/debitcards/sber-karta/', title: 'СберКарта дебетовая' },
  { bank: 'СберБанк', type: 'consumer-loans', url: 'https://bankiclub.ru/credits/sberbank-potrebitelskiy-kredit/', title: 'Потребительский кредит' },
  { bank: 'СберБанк', type: 'mortgage', url: 'https://bankiclub.ru/ipoteka/sberbank-ipoteka/', title: 'Ипотека' },
  { bank: 'СберБанк', type: 'deposits', url: 'https://bankiclub.ru/vklady/sberbank-vklady/', title: 'Вклады' },
  // Т-Банк
  { bank: 'Т-Банк', type: 'credit-cards', url: 'https://bankiclub.ru/creditcards/t-bank-kreditnaya-karta/', title: 'Кредитная карта Т-Банк' },
  { bank: 'Т-Банк', type: 'debit-cards', url: 'https://bankiclub.ru/debitcards/t-bank-debetovaya-karta/', title: 'Дебетовая карта Т-Банк' },
  { bank: 'Т-Банк', type: 'consumer-loans', url: 'https://bankiclub.ru/credits/t-bank-potrebitelskiy-kredit/', title: 'Потребительский кредит' },
  // ВТБ
  { bank: 'ВТБ', type: 'credit-cards', url: 'https://bankiclub.ru/creditcards/vtb-kreditnaya-karta/', title: 'Кредитная карта ВТБ' },
  { bank: 'ВТБ', type: 'debit-cards', url: 'https://bankiclub.ru/debitcards/vtb-debetovaya-karta/', title: 'Дебетовая карта ВТБ' },
  { bank: 'ВТБ', type: 'consumer-loans', url: 'https://bankiclub.ru/credits/vtb-potrebitelskiy-kredit/', title: 'Потребительский кредит' },
  { bank: 'ВТБ', type: 'mortgage', url: 'https://bankiclub.ru/ipoteka/vtb-ipoteka/', title: 'Ипотека' },
  // Газпромбанк
  { bank: 'Газпромбанк', type: 'credit-cards', url: 'https://bankiclub.ru/creditcards/gazprombank-kreditnaya-karta/', title: 'Кредитная карта' },
  { bank: 'Газпромбанк', type: 'consumer-loans', url: 'https://bankiclub.ru/credits/gazprombank-potrebitelskiy-kredit/', title: 'Потребительский кредит' },
  { bank: 'Газпромбанк', type: 'mortgage', url: 'https://bankiclub.ru/ipoteka/gazprombank-ipoteka/', title: 'Ипотека' },
  { bank: 'Газпромбанк', type: 'deposits', url: 'https://bankiclub.ru/vklady/gazprombank-vklady/', title: 'Вклады' },
  // Альфа-Банк
  { bank: 'Альфа-Банк', type: 'credit-cards', url: 'https://bankiclub.ru/creditcards/alfa-bank-kreditnaya-karta/', title: 'Кредитная карта' },
  { bank: 'Альфа-Банк', type: 'debit-cards', url: 'https://bankiclub.ru/debitcards/alfa-bank-debetovaya-karta/', title: 'Дебетовая карта' },
  { bank: 'Альфа-Банк', type: 'consumer-loans', url: 'https://bankiclub.ru/credits/alfa-bank-potrebitelskiy-kredit/', title: 'Потребительский кредит' },
  // ПСБ
  { bank: 'ПСБ', type: 'credit-cards', url: 'https://bankiclub.ru/creditcards/psb-kreditnaya-karta/', title: 'Кредитная карта' },
  { bank: 'ПСБ', type: 'mortgage', url: 'https://bankiclub.ru/ipoteka/psb-ipoteka/', title: 'Ипотека' },
  // Райффайзенбанк
  { bank: 'Райффайзенбанк', type: 'credit-cards', url: 'https://bankiclub.ru/creditcards/raiffeisenbank-kreditnaya-karta/', title: 'Кредитная карта' },
  { bank: 'Райффайзенбанк', type: 'consumer-loans', url: 'https://bankiclub.ru/credits/raiffeisenbank-potrebitelskiy-kredit/', title: 'Потребительский кредит' },
  // МТС Банк
  { bank: 'МТС Банк', type: 'credit-cards', url: 'https://bankiclub.ru/creditcards/mts-bank-kreditnaya-karta/', title: 'Кредитная карта' },
  { bank: 'МТС Банк', type: 'debit-cards', url: 'https://bankiclub.ru/debitcards/mts-bank-debetovaya-karta/', title: 'Дебетовая карта' },
];

function extractPageText(url) {
  try {
    const html = execSync(`curl -s "${url}" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" --max-time 10`, {
      encoding: 'utf-8',
      timeout: 15000,
    });
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  } catch (err) {
    return null;
  }
}

function parseProductData(text, bank, type, title, url) {
  if (!text) return null;

  const params = { main: {}, fees: {}, requirements: {} };

  // Ищем ставку
  const ratePatterns = [
    /(?:ставка|процент)[:\s]*(\d+[.,]?\d*)\s*%/i,
    /(\d+[.,]?\d*)\s*%\s*(?:годовых|ставка)/i,
    /от\s*(\d+[.,]?\d*)\s*%/i,
  ];
  for (const p of ratePatterns) {
    const m = text.match(p);
    if (m) { params.main['Процентная ставка'] = m[1] + '%'; break; }
  }

  // Ищем лимит/сумму
  const limitPatterns = [
    /(?:лимит|сумма)[:\s]*до\s*(\d[\d\s]*)\s*[₽руб]/i,
    /до\s*(\d[\d\s]*)\s*[₽руб]/i,
    /(\d[\d\s]*)\s*[₽руб]\s*(?:лимит|максимум)/i,
  ];
  for (const p of limitPatterns) {
    const m = text.match(p);
    if (m) {
      const label = type.includes('card') ? 'Кредитный лимит' : 'Сумма';
      params.main[label] = 'до ' + m[1].trim() + ' ₽';
      break;
    }
  }

  // Ищем срок
  const termPatterns = [
    /(?:срок|период)[:\s]*(\d+)\s*(?:лет|мес|дн)/i,
    /(\d+)\s*лет\s*(?:срок|кредит)/i,
    /срок\s*до\s*(\d+)\s*лет/i,
  ];
  for (const p of termPatterns) {
    const m = text.match(p);
    if (m) { params.main['Срок'] = m[0].trim(); break; }
  }

  // Ищем льготный период
  const graceMatch = text.match(/(?:льготный|без процентов|грейс)[:\s]*(\d+)\s*дн/i);
  if (graceMatch) params.main['Льготный период'] = graceMatch[1] + ' дней';

  // Ищем кэшбэк
  const cashbackMatch = text.match(/(?:кешбэк|кэшбэк|возврат)[:\s]*(\d+[.,]?\d*)\s*%/i);
  if (cashbackMatch) params.main['Кешбэк'] = 'до ' + cashbackMatch[1] + '%';

  // Ищем обслуживание
  if (text.includes('бесплатн') || text.includes('0 ₽')) {
    params.fees['Обслуживание'] = 'бесплатно';
  } else {
    const feeMatch = text.match(/(?:обслуживание|плата)[:\s]*(\d[\d\s]*)\s*[₽руб]/i);
    if (feeMatch) params.fees['Обслуживание'] = feeMatch[1].trim() + ' ₽/мес';
  }

  // Ищем требования по возрасту
  const ageMatch = text.match(/(?:возраст|от)[:\s]*(\d+)\s*лет/i);
  if (ageMatch) params.requirements['Возраст'] = 'от ' + ageMatch[1] + ' лет';

  // Проверяем что есть хотя бы один параметр
  if (Object.keys(params.main).length === 0) return null;

  const id = bank.toLowerCase().replace(/\s+/g, '-') + '-' + type + '-' + Date.now();

  return {
    id,
    title: title || `${type} от ${bank}`,
    bankName: bank,
    type,
    featured: false,
    shortDescription: `${title || type} от ${bank}`,
    fullDescription: Object.entries(params.main).map(([k, v]) => `${k}: ${v}`).join('. '),
    parameters: params,
    features: Object.values(params.main).filter(Boolean).slice(0, 3),
    conditions: Object.values(params.requirements).filter(Boolean).slice(0, 3),
    referralLink: url,
    meta: { title: `${title || type} от ${bank}`, description: `${title || type} от ${bank}` },
    version: { date: new Date().toISOString().split('T')[0], source: 'content-collector', updatedBy: 'web-scrape' },
    validFrom: new Date().toISOString().split('T')[0],
    status: 'active',
  };
}

async function main() {
  console.log('Content Collector: запуск...\n');

  const existingData = JSON.parse(await fs.readFile(PRODUCTS_FILE, 'utf-8'));
  const existingKeys = new Set(existingData.products.map(p => p.bankName + '::' + p.type));

  const results = { collected: 0, added: 0, errors: [], products: [] };

  for (const task of TASKS) {
    results.collected++;
    console.log(`${task.bank} / ${task.type}: ${task.url}`);

    const text = extractPageText(task.url);
    if (!text) {
      results.errors.push({ bank: task.bank, type: task.type, error: 'не удалось загрузить' });
      continue;
    }

    const product = parseProductData(text, task.bank, task.type, task.title, task.url);
    if (!product) {
      results.errors.push({ bank: task.bank, type: task.type, error: 'не удалось извлечь данные' });
      continue;
    }

    const key = task.bank + '::' + task.type;
    if (existingKeys.has(key)) {
      console.log(`  Пропущено (уже есть): ${key}`);
      continue;
    }

    results.products.push(product);
    existingKeys.add(key);
    results.added++;
    console.log(`  + ${product.parameters.main['Процентная ставка'] || '?'} ${product.parameters.main['Кредитный лимит'] || product.parameters.main['Сумма'] || ''}`);

    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\nРезультат:`);
  console.log(`  Просканировано: ${results.collected}`);
  console.log(`  Добавлено: ${results.added}`);
  console.log(`  Ошибок: ${results.errors.length}`);

  if (results.added > 0) {
    console.log(`\nНовые продукты:`);
    results.products.forEach((p, i) => {
      console.log(`  ${i + 1}. [${p.bankName}] ${p.title}`);
      Object.entries(p.parameters.main).forEach(([k, v]) => console.log(`     ${k}: ${v}`));
    });

    existingData.products = existingData.products.concat(results.products);
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(existingData, null, 2));
    console.log(`\nproducts.json обновлён: ${existingData.products.length} продуктов`);
  }

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(results, null, 2));
}

main().catch(err => {
  console.error('Фатальная ошибка:', err);
  process.exit(1);
});
