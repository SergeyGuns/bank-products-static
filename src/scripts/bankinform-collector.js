#!/usr/bin/env node

/**
 * BankInform Collector — сбор данных с bankinform.ru
 *
 * Использует поиск через DuckDuckGo для нахождения страниц на bankinform.ru,
 * затем парсит данные о продуктах.
 *
 * Использование: node src/scripts/bankinform-collector.js
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');

// Банки и продукты для сбора
const BANKS = [
  { name: 'Альфа-Банк', types: ['credit-cards', 'debit-cards', 'consumer-loans', 'mortgage', 'deposits'] },
  { name: 'ВТБ', types: ['credit-cards', 'debit-cards', 'consumer-loans', 'mortgage', 'deposits'] },
  { name: 'Газпромбанк', types: ['credit-cards', 'debit-cards', 'consumer-loans', 'mortgage', 'deposits'] },
  { name: 'МТС Банк', types: ['credit-cards', 'debit-cards', 'consumer-loans', 'mortgage', 'deposits'] },
  { name: 'ПСБ', types: ['credit-cards', 'debit-cards', 'consumer-loans', 'mortgage', 'deposits'] },
  { name: 'Райффайзенбанк', types: ['credit-cards', 'debit-cards', 'consumer-loans', 'mortgage', 'deposits'] },
  { name: 'СберБанк', types: ['credit-cards', 'debit-cards', 'consumer-loans', 'mortgage', 'deposits'] },
  { name: 'Т-Банк', types: ['credit-cards', 'debit-cards', 'consumer-loans', 'mortgage', 'deposits'] },
];

const TYPE_LABELS = {
  'credit-cards': 'кредитная карта',
  'debit-cards': 'дебетовая карта',
  'consumer-loans': 'потребительский кредит',
  'mortgage': 'ипотека',
  'deposits': 'вклады',
};

function searchDuckDuckGo(query) {
  try {
    const html = execSync(`curl -s "https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&hl=ru" -H "User-Agent: Mozilla/5.0" --max-time 10`, {
      encoding: 'utf-8', timeout: 15000,
    });
    const results = [];
    const regex = /class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      let u = match[1];
      if (u.includes('duckduckgo.com/l/')) {
        const uddg = u.match(/uddg=([^&]+)/);
        if (uddg) u = decodeURIComponent(uddg[1]);
      }
      results.push({ url: u, title: match[2].trim() });
    }
    return results;
  } catch (err) { return []; }
}

function extractPageText(url) {
  try {
    const html = execSync(`curl -s "${url}" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" --max-time 10`, {
      encoding: 'utf-8', timeout: 15000,
    });
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  } catch (err) { return null; }
}

function parseBankInform(text, bank, type) {
  if (!text) return null;

  const params = { main: {}, fees: {}, requirements: {} };

  // Ставка
  const ratePatterns = [
    /(\d+[.,]?\d*)\s*%\s*(?:годовых|ставка)/i,
    /ставка[:\s]*(\d+[.,]?\d*)\s*%/i,
    /от\s*(\d+[.,]?\d*)\s*%/i,
    /(\d+[.,]?\d*)\s*%\s*(?:по кредиту|по вкладу)/i,
  ];
  for (const p of ratePatterns) {
    const m = text.match(p);
    if (m) { params.main['Процентная ставка'] = m[0].trim(); break; }
  }

  // Лимит/сумма
  const limitPatterns = [
    /до\s*(\d[\d\s]*)\s*[₽руб]/i,
    /сумма[:\s]*до\s*(\d[\d\s]*)/i,
    /лимит[:\s]*до\s*(\d[\d\s]*)/i,
  ];
  for (const p of limitPatterns) {
    const m = text.match(p);
    if (m) {
      const label = type.includes('card') ? 'Кредитный лимит' : 'Сумма';
      params.main[label] = 'до ' + m[1].trim() + ' ₽';
      break;
    }
  }

  // Срок
  const termPatterns = [
    /(\d+)\s*лет/i,
    /срок[:\s]*(\d+)\s*(?:лет|мес)/i,
    /до\s*(\d+)\s*лет/i,
  ];
  for (const p of termPatterns) {
    const m = text.match(p);
    if (m) { params.main['Срок'] = m[0].trim(); break; }
  }

  // Льготный период
  const graceMatch = text.match(/(?:льготный период|без процентов)[:\s]*до\s*(\d+)\s*дн/i);
  if (graceMatch) params.main['Льготный период'] = 'до ' + graceMatch[1] + ' дней';

  // Кэшбэк
  const cashbackPatterns = [
    /кэшбэк[:\s]*(\d+)\s*%/i,
    /кешбэк[:\s]*(\d+)\s*%/i,
    /(\d+)\s*%\s*кэшбэк/i,
  ];
  for (const p of cashbackPatterns) {
    const m = text.match(p);
    if (m) { params.main['Кэшбэк'] = m[1] + '%'; break; }
  }

  // Обслуживание
  if (text.includes('0 руб') || text.includes('бесплатн') || text.includes('0&nbsp;руб')) {
    params.fees['Обслуживание'] = 'бесплатно';
  } else {
    const feeMatch = text.match(/(\d[\d\s]*)\s*руб\s*в месяц/i);
    if (feeMatch) params.fees['Обслуживание'] = feeMatch[1] + ' ₽/мес';
  }

  // Возраст
  const ageMatch = text.match(/от\s*(\d+)\s*лет/i);
  if (ageMatch) params.requirements['Возраст'] = 'от ' + ageMatch[1] + ' лет';

  return Object.keys(params.main).length > 0 ? params : null;
}

function createProduct(params, bank, type, url) {
  const id = bank.toLowerCase().replace(/\s+/g, '-') + '-' + type + '-' + Date.now();
  return {
    id,
    title: `${TYPE_LABELS[type] || type} от ${bank}`,
    bankName: bank,
    type,
    featured: false,
    shortDescription: `${TYPE_LABELS[type] || type} от ${bank}`,
    fullDescription: Object.entries(params.main).map(([k, v]) => `${k}: ${v}`).join('. '),
    parameters: params,
    features: Object.values(params.main).filter(Boolean).slice(0, 3),
    conditions: Object.values(params.requirements).filter(Boolean).slice(0, 3),
    referralLink: url,
    meta: { title: `${TYPE_LABELS[type]} от ${bank}`, description: `${TYPE_LABELS[type]} от ${bank}` },
    version: { date: new Date().toISOString().split('T')[0], source: 'bankinform', updatedBy: 'collector' },
    validFrom: new Date().toISOString().split('T')[0],
    status: 'active',
  };
}

async function main() {
  console.log('BankInform Collector: запуск...\n');

  const data = JSON.parse(await fs.readFile(PRODUCTS_FILE, 'utf-8'));
  const existingKeys = new Set(data.products.map(p => p.bankName + '::' + p.type));

  const results = { searched: 0, found: 0, added: 0, skipped: 0, errors: [], products: [] };

  for (const bank of BANKS) {
    console.log(`\n${bank.name}:`);

    for (const type of bank.types) {
      const key = bank.name + '::' + type;

      // Ищем страницу на bankinform.ru
      const query = `${bank.name} ${TYPE_LABELS[type]} bankinform.ru`;
      const searchResults = searchDuckDuckGo(query);

      const bankinformResult = searchResults.find(r => r.url.includes('bankinform.ru'));
      if (!bankinformResult) {
        console.log(`  ${type}: не найден на bankinform.ru`);
        results.errors.push({ bank: bank.name, type, error: 'не найден' });
        continue;
      }

      results.searched++;
      console.log(`  ${type}: ${bankinformResult.url}`);

      const text = extractPageText(bankinformResult.url);
      if (!text) {
        results.errors.push({ bank: bank.name, type, error: 'не удалось загрузить' });
        continue;
      }

      const params = parseBankInform(text, bank.name, type);
      if (!params) {
        results.errors.push({ bank: bank.name, type, error: 'не удалось извлечь' });
        continue;
      }

      results.found++;

      if (existingKeys.has(key)) {
        // Обновляем существующий продукт
        const existing = data.products.find(p => p.bankName + '::' + p.type === key);
        if (existing) {
          existing.parameters = params;
          existing.features = Object.values(params.main).filter(Boolean).slice(0, 3);
          existing.referralLink = bankinformResult.url;
          existing.version = { date: new Date().toISOString().split('T')[0], source: 'bankinform', updatedBy: 'collector' };
          results.skipped++;
          console.log(`    Обновлён: ${Object.keys(params.main).join(', ')}`);
        }
      } else {
        const product = createProduct(params, bank.name, type, bankinformResult.url);
        results.products.push(product);
        existingKeys.add(key);
        results.added++;
        console.log(`    + ${Object.keys(params.main).join(', ')}`);
      }

      await new Promise(r => setTimeout(r, 1500));
    }
  }

  console.log(`\nРезультат:`);
  console.log(`  Просканировано: ${results.searched}`);
  console.log(`  Найдено: ${results.found}`);
  console.log(`  Добавлено: ${results.added}`);
  console.log(`  Обновлено: ${results.skipped}`);
  console.log(`  Ошибок: ${results.errors.length}`);

  if (results.added > 0 || results.skipped > 0) {
    data.products = data.products.concat(results.products);
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(data, null, 2));
    console.log(`\nproducts.json обновлён: ${data.products.length} продуктов`);
  }
}

main().catch(err => {
  console.error('Ошибка:', err);
  process.exit(1);
});
