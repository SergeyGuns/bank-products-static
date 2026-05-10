#!/usr/bin/env node

/**
 * Discovery Agent — поиск новых банковских продуктов
 *
 * Алгоритм:
 * 1. Загружает конфигурацию банков и URL
 * 2. Для каждого банка загружает страницы продуктов
 * 3. Парсит список продуктов (названия, ссылки)
 * 4. Сравнивает с уже имеющимися в products.json
 * 5. Выводит список новых продуктов
 *
 * Использование: node src/scripts/agent-discover.js [--bank sberbank] [--category credit-cards]
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const BANKS_CONFIG = path.join(__dirname, '../config/bank-urls-config.json');
const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');

const args = process.argv.slice(2);
const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const targetBank = get('--bank');
const targetCategory = get('--category');

async function loadJSON(p) {
  try { return JSON.parse(await fs.readFile(p, 'utf-8')); }
  catch { return null; }
}

async function fetchPage(url) {
  try {
    const { data } = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9',
      }
    });
    return data;
  } catch (err) {
    return { error: err.message, url };
  }
}

function extractProductCards(html, bankName) {
  const $ = cheerio.load(html);
  const products = [];

  $('[class*="product"], [class*="card"], [class*="offer"], [class*="tariff"]').each((_, el) => {
    const $el = $(el);
    const title = $el.find('h2, h3, h4, [class*="title"], [class*="name"]').first().text().trim();
    if (!title || title.length < 5) return;

    const text = $el.text();
    const rateMatch = text.match(/(\d+[.,]?\d*)\s*%/);
    const limitMatch = text.match(/(\d[\d\s]*)\s*[₽руб]/);

    products.push({
      title,
      bankName,
      rate: rateMatch ? rateMatch[1] + '%' : null,
      limit: limitMatch ? limitMatch[0].trim() : null,
      source: 'heuristic-card',
    });
  });

  $('table tr').each((_, row) => {
    const cells = $(row).find('td, th').map((_, c) => $(c).text().trim()).get();
    if (cells.length >= 2) {
      const title = cells[0];
      if (title.length > 3 && title.length < 100) {
        products.push({
          title,
          bankName,
          params: cells.slice(1),
          source: 'heuristic-table',
        });
      }
    }
  });

  return products;
}

async function main() {
  console.log('Discovery Agent: запуск...');

  const [banksConfig, productsData] = await Promise.all([
    loadJSON(BANKS_CONFIG),
    loadJSON(PRODUCTS_FILE),
  ]);

  if (!banksConfig) {
    console.error('Не найден bank-urls-config.json');
    process.exit(1);
  }

  const existingProducts = productsData?.products || [];
  const existingTitles = new Set(existingProducts.map(p => p.bankName + '::' + p.title));

  const banks = targetBank
    ? (banksConfig.banks || []).filter(b => b.name === targetBank)
    : (banksConfig.banks || []);

  const results = {
    scanned: 0,
    newProducts: [],
    errors: [],
    timestamp: new Date().toISOString(),
  };

  for (const bank of banks) {
    console.log('\n' + bank.name + ': сканирование...');

    const urls = targetCategory
      ? (bank.urls || []).filter(u => u.includes(targetCategory))
      : (bank.urls || []);

    for (const url of urls) {
      results.scanned++;
      console.log('  ' + url);

      const html = await fetchPage(url);
      if (html.error) {
        results.errors.push({ bank: bank.name, url, error: html.error });
        continue;
      }

      const cards = extractProductCards(html, bank.name);

      for (const card of cards) {
        const key = card.bankName + '::' + card.title;
        if (!existingTitles.has(key)) {
          results.newProducts.push(Object.assign({ discoveredUrl: url }, card));
          existingTitles.add(key);
        }
      }

      await new Promise(r => setTimeout(r, 2000));
    }
  }

  const outFile = path.join(__dirname, '../data/discover-results.json');
  await fs.writeFile(outFile, JSON.stringify(results, null, 2));

  console.log('\nРезультат:');
  console.log('   Просканировано URL: ' + results.scanned);
  console.log('   Новых продуктов: ' + results.newProducts.length);
  console.log('   Ошибок: ' + results.errors.length);
  console.log('   Сохранено: ' + outFile);

  if (results.newProducts.length > 0) {
    console.log('\nНовые продукты:');
    results.newProducts.forEach((p, i) => {
      console.log('   ' + (i + 1) + '. [' + p.bankName + '] ' + p.title);
    });
  }
}

main().catch(err => {
  console.error('Фатальная ошибка:', err);
  process.exit(1);
});
