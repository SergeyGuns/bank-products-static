#!/usr/bin/env node

/**
 * Cleanup + Enrich — очистка дубликатов и обогащение данных
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');

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

function parseProduct(text, bank, type) {
  if (!text) return null;
  const params = { main: {}, fees: {}, requirements: {} };

  const rateMatch = text.match(/(?:ставка|процент)[:\s]*(\d+[.,]?\d*)\s*%/i) || text.match(/от\s*(\d+[.,]?\d*)\s*%/i);
  if (rateMatch) params.main['Процентная ставка'] = (rateMatch[1].includes('от') ? '' : 'от ') + rateMatch[1] + '%';

  const limitMatch = text.match(/до\s*(\d[\d\s]*)\s*[₽руб]/i);
  if (limitMatch) params.main[type.includes('card') ? 'Кредитный лимит' : 'Сумма'] = 'до ' + limitMatch[1].trim() + ' ₽';

  const termMatch = text.match(/(\d+)\s*лет/i);
  if (termMatch) params.main['Срок'] = 'до ' + termMatch[1] + ' лет';

  const graceMatch = text.match(/(\d+)\s*дней\s*(?:льготный|без процентов|грейс)/i);
  if (graceMatch) params.main['Льготный период'] = graceMatch[1] + ' дней';

  const cashbackMatch = text.match(/кешбэк[:\s]*до\s*(\d+)\s*%/i) || text.match(/(\d+)\s*%\s*кешбэк/i);
  if (cashbackMatch) params.main['Кэшбэк'] = 'до ' + cashbackMatch[1] + '%';

  if (text.includes('бесплатн')) params.fees['Обслуживание'] = 'бесплатно';

  return Object.keys(params.main).length > 0 ? params : null;
}

async function main() {
  console.log('Cleanup + Enrich: запуск...\n');

  const data = JSON.parse(await fs.readFile(PRODUCTS_FILE, 'utf-8'));
  const products = data.products || [];

  console.log('До очистки:', products.length);

  // Удаляем дубликаты (оставляем первый с данными)
  const seen = new Map();
  const cleaned = [];
  let removed = 0;

  for (const p of products) {
    const key = p.bankName + '::' + p.type;
    const hasData = p.parameters?.main && Object.keys(p.parameters.main).length > 0;

    if (seen.has(key)) {
      const existing = seen.get(key);
      const existingHasData = existing.parameters?.main && Object.keys(existing.parameters.main).length > 0;

      if (!existingHasData && hasData) {
        // Заменяем пустой на полный
        const idx = cleaned.indexOf(existing);
        cleaned[idx] = p;
        seen.set(key, p);
        removed++;
        console.log(`  Заменён: ${key} (пустой -> полный)`);
      } else {
        removed++;
        console.log(`  Удалён дубликат: ${key} - ${p.title}`);
      }
    } else {
      cleaned.push(p);
      seen.set(key, p);
    }
  }

  console.log(`\nУдалено дубликатов: ${removed}`);
  console.log('После очистки:', cleaned.length);

  // Обогащаем продукты с пустыми параметрами
  const toEnrich = cleaned.filter(p => !p.parameters?.main || Object.keys(p.parameters.main).length === 0);
  console.log('\nПродуктов для обогащения:', toEnrich.length);

  const sources = {
    'СберБанк::credit-cards': 'https://bankiclub.ru/creditcards/sber-karta/',
    'СберБанк::consumer-loans': 'https://bankiclub.ru/credits/sberbank-potrebitelskiy-kredit/',
    'СберБанк::mortgage': 'https://bankiclub.ru/ipoteka/sberbank-ipoteka/',
    'СберБанк::deposits': 'https://bankiclub.ru/vklady/sberbank-vklady/',
    'Т-Банк::credit-cards': 'https://bankiclub.ru/creditcards/t-bank-kreditnaya-karta/',
    'Т-Банк::debit-cards': 'https://bankiclub.ru/debitcards/t-bank-debetovaya-karta/',
    'Т-Банк::consumer-loans': 'https://bankiclub.ru/credits/t-bank-potrebitelskiy-kredit/',
    'ВТБ::credit-cards': 'https://bankiclub.ru/creditcards/vtb-kreditnaya-karta/',
    'ВТБ::debit-cards': 'https://bankiclub.ru/debitcards/vtb-debetovaya-karta/',
    'ВТБ::consumer-loans': 'https://bankiclub.ru/credits/vtb-potrebitelskiy-kredit/',
    'ВТБ::mortgage': 'https://bankiclub.ru/ipoteka/vtb-ipoteka/',
    'Газпромбанк::credit-cards': 'https://bankiclub.ru/creditcards/gazprombank-kreditnaya-karta/',
    'Газпромбанк::consumer-loans': 'https://bankiclub.ru/credits/gazprombank-potrebitelskiy-kredit/',
    'Газпромбанк::mortgage': 'https://bankiclub.ru/ipoteka/gazprombank-ipoteka/',
    'Газпромбанк::deposits': 'https://bankiclub.ru/vklady/gazprombank-vklady/',
    'Альфа-Банк::credit-cards': 'https://bankiclub.ru/creditcards/alfa-bank-kreditnaya-karta/',
    'Альфа-Банк::debit-cards': 'https://bankiclub.ru/debitcards/alfa-bank-debetovaya-karta/',
    'Альфа-Банк::consumer-loans': 'https://bankiclub.ru/credits/alfa-bank-potrebitelskiy-kredit/',
    'ПСБ::credit-cards': 'https://bankiclub.ru/creditcards/psb-kreditnaya-karta/',
    'ПСБ::mortgage': 'https://bankiclub.ru/ipoteka/psb-ipoteka/',
    'Райффайзенбанк::credit-cards': 'https://bankiclub.ru/creditcards/raiffeisenbank-kreditnaya-karta/',
    'Райффайзенбанк::consumer-loans': 'https://bankiclub.ru/credits/raiffeisenbank-potrebitelskiy-kredit/',
    'МТС Банк::credit-cards': 'https://bankiclub.ru/creditcards/mts-bank-kreditnaya-karta/',
    'МТС Банк::debit-cards': 'https://bankiclub.ru/debitcards/mts-bank-debetovaya-karta/',
  };

  let enriched = 0;

  for (const product of toEnrich) {
    const key = product.bankName + '::' + product.type;
    const url = sources[key];
    if (!url) {
      console.log(`  Нет источника: ${key}`);
      continue;
    }

    console.log(`\n  Обогащение: ${key}`);
    const text = extractPageText(url);
    if (!text) {
      console.log(`    Не удалось загрузить`);
      continue;
    }

    const params = parseProduct(text, product.bankName, product.type);
    if (!params) {
      console.log(`    Не удалось извлечь данные`);
      continue;
    }

    product.parameters = params;
    product.features = Object.values(params.main).filter(Boolean).slice(0, 3);
    product.version = { date: new Date().toISOString().split('T')[0], source: 'cleanup-enrich', updatedBy: 'web-scrape' };
    enriched++;
    console.log(`    + ${Object.keys(params.main).join(', ')}`);

    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\nОбогащено: ${enriched}`);

  data.products = cleaned;
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(data, null, 2));
  console.log(`\nproducts.json обновлён: ${cleaned.length} продуктов`);
}

main().catch(err => {
  console.error('Ошибка:', err);
  process.exit(1);
});
