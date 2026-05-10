#!/usr/bin/env node

/**
 * Extraction Agent — извлечение параметров продукта
 *
 * На входе: discover-results.json (список новых продуктов)
 * На выходе: extracted-products.json (готовые объекты для products.json)
 *
 * Использование: node src/scripts/agent-extract.js [--limit 5]
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const DISCOVER_RESULTS = path.join(__dirname, '../data/discover-results.json');
const OUTPUT_FILE = path.join(__dirname, '../data/extracted-products.json');

const args = process.argv.slice(2);
const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const limit = parseInt(get('--limit') || '10');

async function fetchPage(url) {
  try {
    const { data } = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ru-RU,ru;q=0.9',
      }
    });
    return data;
  } catch (err) {
    return null;
  }
}

function extractProductParams(html, productInfo) {
  const $ = cheerio.load(html);
  const text = $('body').text();

  const params = { main: {}, fees: {}, requirements: {} };

  const rateMatch = text.match(/(?:ставка|процент|%)[:\s]*(\d+[.,]?\d*)\s*%/i);
  if (rateMatch) params.main['Процентная ставка'] = rateMatch[1] + '%';

  const amountMatch = text.match(/(?:сумма|лимит|до)[:\s]*(\d[\d\s]*)\s*[₽руб]/i);
  if (amountMatch) params.main[productInfo.title.includes('карт') ? 'Кредитный лимит' : 'Сумма кредита'] = amountMatch[0].trim();

  const termMatch = text.match(/(?:срок|период)[:\s]*(\d+)\s*(?:лет|мес|дн)/i);
  if (termMatch) params.main['Срок'] = termMatch[0].trim();

  const graceMatch = text.match(/(?:льготный|без процентов)[:\s]*(\d+)\s*дн/i);
  if (graceMatch) params.main['Льготный период'] = graceMatch[1] + ' дней';

  const cashbackMatch = text.match(/(?:кешбэк|кэшбэк|возврат)[:\s]*(\d+[.,]?\d*)\s*%/i);
  if (cashbackMatch) params.main['Кешбэк'] = cashbackMatch[1] + '%';

  const serviceMatch = text.match(/(?:обслуживание|годовая плата)[:\s]*(\d[\d\s]*)\s*[₽руб]/i);
  if (serviceMatch) params.fees['Обслуживание'] = serviceMatch[0].trim();
  else params.fees['Обслуживание'] = 'бесплатно';

  const ageMatch = text.match(/(?:возраст|от)[:\s]*(\d+)\s*лет/i);
  if (ageMatch) params.requirements['Возраст'] = 'от ' + ageMatch[1] + ' лет';

  const expMatch = text.match(/(?:стаж|опыт)[:\s]*(\d+)\s*(?:мес|лет)/i);
  if (expMatch) params.requirements['Стаж'] = 'от ' + expMatch[0].trim();

  const docs = [];
  if (text.includes('паспорт')) docs.push('Паспорт РФ');
  if (text.includes('справка') || text.includes('доход')) docs.push('Справка о доходах');
  if (text.includes('СНИЛС')) docs.push('СНИЛС');
  if (docs.length > 0) params.requirements['Документы'] = docs;

  return {
    id: productInfo.bankName.toLowerCase().replace(/\s+/g, '-') + '--' + Date.now(),
    title: productInfo.title,
    bankName: productInfo.bankName,
    type: productInfo.type || 'unknown',
    featured: false,
    shortDescription: productInfo.title,
    fullDescription: 'Продукт "' + productInfo.title + '" от ' + productInfo.bankName,
    parameters: params,
    features: Object.values(params.main).filter(Boolean).slice(0, 3),
    conditions: Object.values(params.requirements).filter(Boolean).slice(0, 3),
    referralLink: productInfo.discoveredUrl || '',
    meta: {
      title: productInfo.title + ' от ' + productInfo.bankName,
      description: productInfo.title,
    },
    version: {
      date: new Date().toISOString().split('T')[0],
      source: 'agent-extraction',
      updatedBy: 'discovery-pipeline',
    },
    validFrom: new Date().toISOString().split('T')[0],
    status: 'active',
  };
}

function categorizeProduct(p) {
  const title = (p.title || '').toLowerCase();
  if (title.includes('кредитн') || title.includes('credit card')) return 'credit-cards';
  if (title.includes('дебетов') || title.includes('debit')) return 'debit-cards';
  if (title.includes('автокред') || title.includes('авто')) return 'auto-loans';
  if (title.includes('ипотек') || title.includes('mortgage')) return 'mortgage';
  if (title.includes('вклад') || title.includes('депозит') || title.includes('deposit')) return 'deposits';
  if (title.includes('потребит') || title.includes('кредит')) return 'consumer-loans';
  if (title.includes('бизнес') || title.includes('business')) return 'business-loans';
  return p.type || 'unknown';
}

async function main() {
  console.log('Extraction Agent: запуск...');

  let discoverData;
  try {
    discoverData = JSON.parse(await fs.readFile(DISCOVER_RESULTS, 'utf-8'));
  } catch {
    console.error('discover-results.json не найден. Сначала запусти agent-discover.js');
    process.exit(1);
  }

  const newProducts = (discoverData.newProducts || []).slice(0, limit);
  console.log('   Найдено ' + newProducts.length + ' продуктов для обработки');

  const extracted = [];
  const errors = [];

  for (let i = 0; i < newProducts.length; i++) {
    const product = newProducts[i];
    console.log('\n  [' + (i + 1) + '/' + newProducts.length + '] ' + product.bankName + ': ' + product.title);

    if (!product.discoveredUrl) {
      errors.push({ product: product.title, error: 'нет URL' });
      continue;
    }

    const html = await fetchPage(product.discoveredUrl);
    if (!html) {
      errors.push({ product: product.title, error: 'не удалось загрузить страницу' });
      continue;
    }

    const params = extractProductParams(html, product);
    params.type = categorizeProduct(product);
    extracted.push(params);
    console.log('    Извлечено: ' + Object.keys(params.parameters.main).length + ' параметров');

    await new Promise(r => setTimeout(r, 1500));
  }

  const result = {
    extracted,
    errors,
    timestamp: new Date().toISOString(),
    stats: { total: newProducts.length, success: extracted.length, failed: errors.length },
  };

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(result, null, 2));

  console.log('\nГотово:');
  console.log('   Извлечено: ' + extracted.length);
  console.log('   Ошибок: ' + errors.length);
  console.log('   Сохранено: ' + OUTPUT_FILE);
}

main().catch(err => {
  console.error('Фатальная ошибка:', err);
  process.exit(1);
});
