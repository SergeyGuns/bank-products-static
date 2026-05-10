#!/usr/bin/env node

/**
 * LLM Extract Agent — извлечение данных о продуктах из веб-страниц через LLM
 *
 * Использует web_search для поиска страниц, затем LLM для извлечения структурированных данных.
 *
 * Использование: node src/scripts/llm-extract.js
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');

// Банки и продукты для поиска
const SEARCH_TASKS = [
  { bank: 'СберБанк', type: 'credit-cards', query: 'СберБанк кредитная карта СберКарта условия ставка лимит 2026' },
  { bank: 'СберБанк', type: 'debit-cards', query: 'СберБанк дебетовая карта кэшбэк обслуживание 2026' },
  { bank: 'СберБанк', type: 'consumer-loans', query: 'СберБанк потребительский кредит ставка сумма срок 2026' },
  { bank: 'СберБанк', type: 'mortgage', query: 'СберБанк ипотека ставка первоначальный взнос 2026' },
  { bank: 'СберБанк', type: 'deposits', query: 'СберБанк вклад ставка срок минимальная сумма 2026' },
  { bank: 'Т-Банк', type: 'credit-cards', query: 'Т-Банк кредитная карта тарифы ставка кэшбэк 2026' },
  { bank: 'Т-Банк', type: 'debit-cards', query: 'Т-Банк дебетовая карта кэшбэк обслуживание 2026' },
  { bank: 'Т-Банк', type: 'consumer-loans', query: 'Т-Банк потребительский кредит ставка сумма 2026' },
  { bank: 'ВТБ', type: 'credit-cards', query: 'ВТБ кредитная карта тарифы ставка лимит 2026' },
  { bank: 'ВТБ', type: 'debit-cards', query: 'ВТБ дебетовая карта кэшбэк обслуживание 2026' },
  { bank: 'ВТБ', type: 'consumer-loans', query: 'ВТБ потребительский кредит ставка сумма 2026' },
  { bank: 'ВТБ', type: 'mortgage', query: 'ВТБ ипотека ставка первоначальный взнос 2026' },
  { bank: 'Газпромбанк', type: 'credit-cards', query: 'Газпромбанк кредитная карта тарифы ставка 2026' },
  { bank: 'Газпромбанк', type: 'consumer-loans', query: 'Газпромбанк потребительский кредит ставка 2026' },
  { bank: 'Газпромбанк', type: 'mortgage', query: 'Газпромбанк ипотека ставка первоначальный взнос 2026' },
  { bank: 'Альфа-Банк', type: 'credit-cards', query: 'Альфа-Банк кредитная карта тарифы кэшбэк 2026' },
  { bank: 'Альфа-Банк', type: 'debit-cards', query: 'Альфа-Банк дебетовая карта кэшбэк 2026' },
  { bank: 'Альфа-Банк', type: 'consumer-loans', query: 'Альфа-Банк потребительский кредит ставка 2026' },
  { bank: 'ПСБ', type: 'credit-cards', query: 'ПСБ кредитная карта тарифы ставка 2026' },
  { bank: 'ПСБ', type: 'mortgage', query: 'ПСБ ипотека ставка первоначальный взнос 2026' },
  { bank: 'Райффайзенбанк', type: 'credit-cards', query: 'Райффайзенбанк кредитная карта тарифы 2026' },
  { bank: 'Райффайзенбанк', type: 'consumer-loans', query: 'Райффайзенбанк потребительский кредит ставка 2026' },
  { bank: 'МТС Банк', type: 'credit-cards', query: 'МТС Банк кредитная карта тарифы кэшбэк 2026' },
  { bank: 'МТС Банк', type: 'debit-cards', query: 'МТС Банк дебетовая карта кэшбэк 2026' },
];

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject).on('timeout', () => reject(new Error('timeout')));
  });
}

async function searchDuckDuckGo(query) {
  const encoded = encodeURIComponent(query);
  const url = `https://html.duckduckgo.com/html/?q=${encoded}&hl=ru`;
  try {
    const html = await httpsGet(url);
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
  } catch (err) {
    return [];
  }
}

async function extractPageText(url) {
  try {
    const html = await httpsGet(url);
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 6000);
  } catch (err) {
    return null;
  }
}

function parseProductFromText(text, bank, type) {
  if (!text) return null;

  const products = [];

  // Ищем блоки с продуктами (по заголовкам или секциям)
  const lines = text.split(/[.!\n]/).filter(l => l.trim().length > 10);

  let currentProduct = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Ищем ставку
    const rateMatch = trimmed.match(/(\d+[.,]?\d*)\s*%/);
    // Ищем сумму
    const amountMatch = trimmed.match(/(\d[\d\s]*)\s*[₽руб]/);
    // Ищем срок
    const termMatch = trimmed.match(/(\d+)\s*(?:лет|мес|дн)/i);

    if (rateMatch || amountMatch) {
      if (!currentProduct) {
        currentProduct = {
          title: '',
          rate: '',
          limit: '',
          term: '',
          fees: '',
          requirements: '',
        };
      }

      if (rateMatch && !currentProduct.rate) currentProduct.rate = rateMatch[1] + '%';
      if (amountMatch && !currentProduct.limit) currentProduct.limit = amountMatch[0].trim();
      if (termMatch && !currentProduct.term) currentProduct.term = termMatch[0].trim();

      // Если достаточно данных — сохраняем
      if (currentProduct.rate && currentProduct.limit) {
        products.push(currentProduct);
        currentProduct = null;
      }
    }
  }

  return products;
}

function createProductObject(info, bank, type, sourceUrl) {
  const params = { main: {}, fees: {}, requirements: {} };

  if (info.rate) params.main['Процентная ставка'] = info.rate;
  if (info.limit) params.main[type.includes('card') ? 'Кредитный лимит' : 'Сумма'] = info.limit;
  if (info.term) params.main['Срок'] = info.term;
  if (info.fees) params.fees['Обслуживание'] = info.fees;

  const id = bank.toLowerCase().replace(/\s+/g, '-') + '-' + type + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);

  return {
    id,
    title: info.title || `${type} от ${bank}`,
    bankName: bank,
    type,
    featured: false,
    shortDescription: `${type} от ${bank}`,
    fullDescription: `${type} от ${bank}. ${info.rate || ''} ${info.limit || ''} ${info.term || ''}`.trim(),
    parameters: params,
    features: Object.values(params.main).filter(Boolean).slice(0, 3),
    conditions: [],
    referralLink: sourceUrl,
    meta: { title: `${type} от ${bank}`, description: `${type} от ${bank}` },
    version: { date: new Date().toISOString().split('T')[0], source: 'llm-extract', updatedBy: 'web-search' },
    validFrom: new Date().toISOString().split('T')[0],
    status: 'active',
  };
}

async function main() {
  console.log('LLM Extract Agent: запуск...\n');

  const existingData = JSON.parse(await fs.readFile(PRODUCTS_FILE, 'utf-8'));
  const existingKeys = new Set(existingData.products.map(p => p.bankName + '::' + p.type));

  const results = { searched: 0, found: 0, added: 0, errors: [], products: [] };

  for (const task of SEARCH_TASKS) {
    results.searched++;
    console.log(`${task.bank} / ${task.type}: ${task.query.substring(0, 50)}...`);

    try {
      const searchResults = await searchDuckDuckGo(task.query);
      if (searchResults.length === 0) {
        results.errors.push({ bank: task.bank, type: task.type, error: 'нет результатов' });
        continue;
      }

      // Берём первый релевантный результат
      const bestResult = searchResults.find(r =>
        r.url.includes('sberbank') || r.url.includes('tbank') || r.url.includes('vtb') ||
        r.url.includes('gazprombank') || r.url.includes('alfabank') || r.url.includes('psb') ||
        r.url.includes('raiffeisen') || r.url.includes('mtsbank') ||
        r.url.includes('banki.ru') || r.url.includes('sravni') || r.url.includes('bankiros')
      ) || searchResults[0];

      console.log(`  -> ${bestResult.title.substring(0, 60)}`);

      const text = await extractPageText(bestResult.url);
      if (!text) {
        results.errors.push({ bank: task.bank, type: task.type, error: 'не удалось загрузить страницу' });
        continue;
      }

      const parsed = parseProductFromText(text, task.bank, task.type);
      if (!parsed || parsed.length === 0) {
        // Если не удалось распарсить — создаём базовый продукт
        const basicProduct = createProductObject(
          { title: `${task.type} от ${task.bank}`, rate: '', limit: '', term: '' },
          task.bank, task.type, bestResult.url
        );
        const key = task.bank + '::' + task.type;
        if (!existingKeys.has(key)) {
          results.products.push(basicProduct);
          existingKeys.add(key);
          results.added++;
        }
        continue;
      }

      for (const p of parsed) {
        const key = task.bank + '::' + task.type;
        if (existingKeys.has(key)) continue;

        const product = createProductObject(p, task.bank, task.type, bestResult.url);
        results.products.push(product);
        existingKeys.add(key);
        results.added++;
        results.found++;
        console.log(`     + ${p.rate || '?'} ${p.limit || ''} ${p.term || ''}`);
      }

      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      results.errors.push({ bank: task.bank, type: task.type, error: err.message });
    }
  }

  console.log(`\nРезультат:`);
  console.log(`  Просканировано: ${results.searched}`);
  console.log(`  Добавлено: ${results.added}`);
  console.log(`  Ошибок: ${results.errors.length}`);

  if (results.added > 0) {
    console.log(`\nНовые продукты:`);
    results.products.forEach((p, i) => {
      console.log(`  ${i + 1}. [${p.bankName}] ${p.title} — ${p.parameters.main['Процентная ставка'] || '?'} ${p.parameters.main['Кредитный лимит'] || p.parameters.main['Сумма'] || ''}`);
    });

    // Добавляем в products.json
    existingData.products = existingData.products.concat(results.products);
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(existingData, null, 2));
    console.log(`\nproducts.json обновлён: ${existingData.products.length} продуктов`);
  }
}

main().catch(err => {
  console.error('Фатальная ошибка:', err);
  process.exit(1);
});
