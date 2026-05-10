#!/usr/bin/env node

/**
 * Web Search Agent — поиск продуктов через DuckDuckGo + curl
 *
 * Использует DuckDuckGo HTML для поиска и curl для извлечения данных.
 * Не требует MCP сервера.
 *
 * Использование: node src/scripts/web-search-agent.js [--bank СберБанк] [--type credit-cards]
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');
const OUTPUT_FILE = path.join(__dirname, '../data/web-search-products.json');

const args = process.argv.slice(2);
const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const targetBank = get('--bank');
const targetType = get('--type');

const TYPE_LABELS = {
  'credit-cards': 'кредитные карты',
  'debit-cards': 'дебетовые карты',
  'consumer-loans': 'потребительский кредит',
  'mortgage': 'ипотека',
  'deposits': 'вклады',
  'auto-loans': 'автокредит',
  'business-loans': 'кредит для бизнеса',
};

async function searchDuckDuckGo(query) {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}&hl=ru`;

  try {
    const html = execSync(`curl -s "${url}" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"`, {
      encoding: 'utf-8',
      timeout: 15000,
    });

    // Извлекаем результаты
    const results = [];
    const regex = /class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      let url = match[1];
      // Декодируем DuckDuckGo redirect
      if (url.includes('duckduckgo.com/l/')) {
        const uddg = url.match(/uddg=([^&]+)/);
        if (uddg) {
          url = decodeURIComponent(uddg[1]);
        }
      }
      results.push({ url, title: match[2].trim() });
    }

    return results;
  } catch (err) {
    console.error('  Ошибка поиска:', err.message);
    return [];
  }
}

async function extractPageContent(url, maxChars = 8000) {
  try {
    const html = execSync(`curl -s "${url}" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" --max-time 10`, {
      encoding: 'utf-8',
      timeout: 15000,
    });

    // Убираем теги и получаем текст
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, maxChars);

    return text;
  } catch (err) {
    return null;
  }
}

function extractProductInfo(text, bank, productType) {
  if (!text) return null;

  const info = { bank, productType, title: '', rate: '', limit: '', term: '', fees: '', requirements: '' };

  // Ищем ставку
  const rateMatch = text.match(/(\d+[.,]?\d*)\s*%/);
  if (rateMatch) info.rate = rateMatch[1] + '%';

  // Ищем сумму/лимит
  const limitMatch = text.match(/(?:до|лимит|сумма)[:\s]*(\d[\d\s]*)\s*[₽руб]/i);
  if (limitMatch) info.limit = limitMatch[0].trim();

  // Ищем срок
  const termMatch = text.match(/(?:срок|период)[:\s]*(\d+)\s*(?:лет|мес|дн)/i);
  if (termMatch) info.term = termMatch[0].trim();

  // Ищем обслуживание
  const feeMatch = text.match(/(?:обслуживание|плата|комиссия)[:\s]*(\d[\d\s]*)\s*[₽руб]/i);
  if (feeMatch) info.fees = feeMatch[0].trim();

  return info;
}

function createProductObject(info, sourceUrl) {
  const params = { main: {}, fees: {}, requirements: {} };

  if (info.rate) params.main['Процентная ставка'] = info.rate;
  if (info.limit) params.main[info.productType.includes('card') ? 'Кредитный лимит' : 'Сумма'] = info.limit;
  if (info.term) params.main['Срок'] = info.term;
  if (info.fees) params.fees['Обслуживание'] = info.fees;

  const id = info.bank.toLowerCase().replace(/\s+/g, '-') + '-' + info.productType + '-' + Date.now();

  return {
    id,
    title: info.title || `${TYPE_LABELS[info.productType] || info.productType} от ${info.bank}`,
    bankName: info.bank,
    type: info.productType,
    featured: false,
    shortDescription: `${TYPE_LABELS[info.productType] || info.productType} от ${info.bank}`,
    fullDescription: `${TYPE_LABELS[info.productType] || info.productType} от ${info.bank}. ${info.rate || ''} ${info.limit || ''} ${info.term || ''}`.trim(),
    parameters: params,
    features: Object.values(params.main).filter(Boolean).slice(0, 3),
    conditions: [],
    referralLink: sourceUrl,
    meta: {
      title: `${TYPE_LABELS[info.productType] || info.productType} от ${info.bank}`,
      description: `${TYPE_LABELS[info.productType] || info.productType} от ${info.bank}`,
    },
    version: {
      date: new Date().toISOString().split('T')[0],
      source: 'web-search-agent',
      updatedBy: 'duckduckgo-search',
    },
    validFrom: new Date().toISOString().split('T')[0],
    status: 'active',
  };
}

async function main() {
  console.log('Web Search Agent: запуск...\n');

  const existingData = JSON.parse(await fs.readFile(PRODUCTS_FILE, 'utf-8'));
  const existingProducts = existingData.products || [];
  const existingKeys = new Set(existingProducts.map(p => p.bankName + '::' + p.type + '::' + p.title));

  const banks = [
    { name: 'СберБанк', types: ['credit-cards', 'debit-cards', 'consumer-loans', 'mortgage', 'deposits'] },
    { name: 'Т-Банк', types: ['credit-cards', 'debit-cards', 'consumer-loans', 'mortgage', 'deposits'] },
    { name: 'ВТБ', types: ['credit-cards', 'debit-cards', 'consumer-loans', 'mortgage', 'deposits'] },
    { name: 'Газпромбанк', types: ['credit-cards', 'debit-cards', 'consumer-loans', 'mortgage', 'deposits'] },
    { name: 'Альфа-Банк', types: ['credit-cards', 'debit-cards', 'consumer-loans', 'mortgage', 'deposits'] },
    { name: 'ПСБ', types: ['credit-cards', 'debit-cards', 'consumer-loans', 'mortgage', 'deposits'] },
    { name: 'Райффайзенбанк', types: ['credit-cards', 'debit-cards', 'consumer-loans', 'mortgage', 'deposits'] },
    { name: 'МТС Банк', types: ['credit-cards', 'debit-cards', 'consumer-loans', 'mortgage', 'deposits'] },
  ];

  const targetBanks = targetBank ? banks.filter(b => b.name === targetBank) : banks;
  const results = { searched: 0, found: 0, added: 0, errors: [], products: [] };

  for (const bank of targetBanks) {
    console.log(`\n${bank.name}:`);

    const types = targetType ? [targetType] : bank.types;

    for (const type of types) {
      results.searched++;
      const query = `${bank.name} ${TYPE_LABELS[type] || type} 2026 условия тарифы`;
      console.log(`  ${type}: ${query}`);

      const searchResults = await searchDuckDuckGo(query);
      if (searchResults.length === 0) {
        results.errors.push({ bank: bank.name, type, error: 'нет результатов' });
        continue;
      }

      // Берём первые 3 результата
      for (const result of searchResults.slice(0, 3)) {
        console.log(`    -> ${result.title.substring(0, 60)}...`);

        const content = await extractPageContent(result.url);
        if (!content) continue;

        const info = extractProductInfo(content, bank.name, type);
        if (!info) continue;

        const key = bank.name + '::' + type + '::' + info.title;
        if (existingKeys.has(key)) continue;

        const product = createProductObject(info, result.url);
        results.products.push(product);
        existingKeys.add(key);
        results.added++;
        results.found++;

        console.log(`      Найдено: ${info.rate || '?'} ${info.limit || ''} ${info.term || ''}`);
      }

      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Сохраняем результаты
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(results, null, 2));

  console.log(`\nРезультат:`);
  console.log(`  Просканировано: ${results.searched}`);
  console.log(`  Найдено продуктов: ${results.found}`);
  console.log(`  Добавлено новых: ${results.added}`);
  console.log(`  Ошибок: ${results.errors.length}`);
  console.log(`  Сохранено: ${OUTPUT_FILE}`);

  if (results.added > 0) {
    console.log(`\nНовые продукты:`);
    results.products.forEach((p, i) => {
      console.log(`  ${i + 1}. [${p.bankName}] ${p.title} (${p.type})`);
    });
  }
}

main().catch(err => {
  console.error('Фатальная ошибка:', err);
  process.exit(1);
});
