#!/usr/bin/env node

/**
 * LLM Product Agent — поиск банковских продуктов через LLM
 *
 * Алгоритм:
 * 1. Берёт список банков и продуктов из sources.json
 * 2. Для каждого продукта формирует поисковый запрос
 * 3. Использует LLM для извлечения структурированных данных
 * 4. Сохраняет результат в products.json
 *
 * Использование: node src/scripts/llm-agent.js [--bank СберБанк] [--type credit-cards]
 */

const fs = require('fs').promises;
const path = require('path');

const SOURCES_FILE = path.join(__dirname, '../data/sources.json');
const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');
const OUTPUT_FILE = path.join(__dirname, '../data/llm-products.json');

const args = process.argv.slice(2);
const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const targetBank = get('--bank');
const targetType = get('--type');

// Маппинг типов для поисковых запросов
const TYPE_QUERIES = {
  'credit-cards': 'кредитные карты условия ставка лимит',
  'debit-cards': 'дебетовые карты кэшбэк обслуживание',
  'consumer-loans': 'потребительский кредит ставка сумма срок',
  'mortgage': 'ипотека ставка первоначный взнос срок',
  'deposits': 'вклад ставка срок минимальная сумма',
  'auto-loans': 'автокредит ставка первоначный взнос',
  'business-loans': 'бизнес кредит для ИП ООО',
};

async function loadJSON(p) {
  try { return JSON.parse(await fs.readFile(p, 'utf-8')); }
  catch { return null; }
}

async function searchProduct(bank, productType) {
  const query = `${bank} ${productType} ${TYPE_QUERIES[productType] || ''} 2026`;
  console.log(`  Поиск: ${query}`);

  try {
    const { web_search } = await import('hermes-tools');
    const results = await web_search(query, { limit: 5 });
    return results;
  } catch (err) {
    console.error('  Ошибка поиска:', err.message);
    return null;
  }
}

async function extractProductData(searchResults, bank, productType) {
  if (!searchResults || searchResults.length === 0) return null;

  const prompt = `
Извлеки информацию о банковских продуктах из следующих результатов поиска.

Банк: ${bank}
Тип продукта: ${productType}

Результаты поиска:
${JSON.stringify(searchResults, null, 2)}

Верни JSON массив продуктов в формате:
[{
  "title": "Название продукта",
  "rate": "Процентная ставка (например: от 12.9%)",
  "limit": "Лимит/сумма (например: до 1 000 000 ₽)",
  "term": "Срок (например: до 5 лет)",
  "fees": "Комиссии/обслуживание",
  "requirements": "Требования к клиенту",
  "url": "Ссылка на продукт"
}]

Если данных нет, верни пустой массив [].
`;

  try {
    // Используем LLM через API
    const response = await fetch('https://api.openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-3-super-120b-a12b:free',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.error('  LLM ошибка:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    return JSON.parse(content);
  } catch (err) {
    console.error('  Ошибка LLM:', err.message);
    return null;
  }
}

function createProductObject(extracted, bank, productType, sourceUrl) {
  const params = { main: {}, fees: {}, requirements: {} };

  if (extracted.rate) params.main['Процентная ставка'] = extracted.rate;
  if (extracted.limit) params.main[productType.includes('card') ? 'Кредитный лимит' : 'Сумма'] = extracted.limit;
  if (extracted.term) params.main['Срок'] = extracted.term;
  if (extracted.fees) params.fees['Обслуживание'] = extracted.fees;
  if (extracted.requirements) params.requirements['Основные'] = extracted.requirements;

  const id = bank.toLowerCase().replace(/\s+/g, '-') + '-' + productType + '-' + Date.now();

  return {
    id,
    title: extracted.title || `${productType} от ${bank}`,
    bankName: bank,
    type: productType,
    featured: false,
    shortDescription: extracted.title || `${productType} от ${bank}`,
    fullDescription: `${extracted.title || productType} от ${bank}. ${extracted.rate || ''} ${extracted.limit || ''}`,
    parameters: params,
    features: Object.values(params.main).filter(Boolean).slice(0, 3),
    conditions: Object.values(params.requirements).filter(Boolean).slice(0, 3),
    referralLink: extracted.url || sourceUrl || '',
    meta: {
      title: `${extracted.title || productType} от ${bank}`,
      description: extracted.title || `${productType} от ${bank}`,
    },
    version: {
      date: new Date().toISOString().split('T')[0],
      source: 'llm-agent',
      updatedBy: 'llm-search',
    },
    validFrom: new Date().toISOString().split('T')[0],
    status: 'active',
  };
}

async function main() {
  console.log('LLM Product Agent: запуск...\n');

  const sources = await loadJSON(SOURCES_FILE);
  const existingData = await loadJSON(PRODUCTS_FILE);

  if (!sources) {
    console.error('sources.json не найден');
    process.exit(1);
  }

  const existingProducts = existingData?.products || [];
  const existingKeys = new Set(existingProducts.map(p => p.bankName + '::' + p.type + '::' + p.title));

  const results = {
    searched: 0,
    found: 0,
    added: 0,
    errors: [],
    products: [],
  };

  const banks = targetBank
    ? sources.sources.filter(s => s.bank === targetBank)
    : sources.sources;

  for (const bank of banks) {
    console.log(`\n${bank.bank}:`);

    const productTypes = targetType
      ? { [targetType]: bank.products[targetType] }
      : bank.products;

    for (const [type, url] of Object.entries(productTypes)) {
      if (!url) continue;

      results.searched++;
      console.log(`  ${type}: ${url}`);

      // Поиск через LLM
      const searchResults = await searchProduct(bank.bank, type);
      if (!searchResults) {
        results.errors.push({ bank: bank.bank, type, error: 'нет результатов поиска' });
        continue;
      }

      // Извлечение данных
      const extracted = await extractProductData(searchResults, bank.bank, type);
      if (!extracted || extracted.length === 0) {
        results.errors.push({ bank: bank.bank, type, error: 'LLM не извлёк данные' });
        continue;
      }

      results.found += extracted.length;

      // Создание объектов продуктов
      for (const item of extracted) {
        const key = bank.bank + '::' + type + '::' + item.title;
        if (existingKeys.has(key)) continue;

        const product = createProductObject(item, bank.bank, type, url);
        results.products.push(product);
        existingKeys.add(key);
        results.added++;
      }

      // Пауза между запросами
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Сохранение результатов
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
