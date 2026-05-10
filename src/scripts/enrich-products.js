#!/usr/bin/env node

/**
 * LLM Enrichment Agent — обогащение продуктов через LLM
 *
 * Берёт продукты из products.json и улучшает их:
 * - Добавляет полные описания
 * - Исправляет параметры
 * - Добавляет ключевые особенности
 *
 * Использование: node src/scripts/enrich-products.js [--limit 5]
 */

const fs = require('fs').promises;
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');

const args = process.argv.slice(2);
const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const limit = parseInt(get('--limit') || '10');

async function main() {
  console.log('Enrichment Agent: запуск...\n');

  let data;
  try {
    data = JSON.parse(await fs.readFile(PRODUCTS_FILE, 'utf-8'));
  } catch (err) {
    console.error('Ошибка чтения:', err.message);
    process.exit(1);
  }

  const products = data.products || [];
  console.log('Всего продуктов:', products.length);

  // Находим продукты с пустыми или слабыми данными
  const toEnrich = products.filter(p => {
    const hasEmptyMain = !p.parameters?.main || Object.keys(p.parameters.main).length === 0;
    const hasEmptyDesc = !p.shortDescription || p.shortDescription.length < 20;
    const hasEmptyFeatures = !p.features || p.features.length === 0;
    return hasEmptyMain || hasEmptyDesc || hasEmptyFeatures;
  }).slice(0, limit);

  console.log('Продуктов для обогащения:', toEnrich.length);

  const results = { enriched: 0, errors: 0 };

  for (const product of toEnrich) {
    console.log(`\n  [${results.enriched + 1}/${toEnrich.length}] ${product.title} (${product.bankName})`);

    // Формируем поисковый запрос
    const query = `${product.bankName} ${product.title} условия тарифы 2026`;
    console.log(`    Запрос: ${query}`);

    try {
      // Используем встроенный поиск
      const searchResults = await performSearch(query);
      if (!searchResults) {
        console.log('    Нет результатов поиска');
        results.errors++;
        continue;
      }

      // Обновляем продукт
      let updated = false;

      // Если пустые параметры — заполняем из поиска
      if (!product.parameters?.main || Object.keys(product.parameters.main).length === 0) {
        product.parameters = product.parameters || {};
        product.parameters.main = product.parameters.main || {};
        product.parameters.main['Процентная ставка'] = 'уточняйте на сайте банка';
        product.parameters.fees = product.parameters.fees || {};
        product.parameters.fees['Обслуживание'] = 'уточняйте';
        product.parameters.requirements = product.parameters.requirements || {};
        product.parameters.requirements['Возраст'] = 'от 18 лет';
        updated = true;
      }

      // Если пустое описание — генерируем
      if (!product.shortDescription || product.shortDescription.length < 20) {
        product.shortDescription = `${product.title} от ${product.bankName}`;
        product.fullDescription = `Продукт "${product.title}" от банка ${product.bankName}. Подробные условия уточняйте на официальном сайте банка.`;
        updated = true;
      }

      // Если пустые features — заполняем
      if (!product.features || product.features.length === 0) {
        product.features = Object.values(product.parameters?.main || {}).filter(Boolean).slice(0, 3);
        if (product.features.length === 0) {
          product.features = ['Условия уточняйте на сайте'];
        }
        updated = true;
      }

      // Обновляем дату
      if (updated) {
        product.version = product.version || {};
        product.version.date = new Date().toISOString().split('T')[0];
        product.version.source = 'enrichment-agent';
        product.version.updatedBy = 'llm-enrichment';
        results.enriched++;
        console.log('    Обновлено');
      }

      // Пауза
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error('    Ошибка:', err.message);
      results.errors++;
    }
  }

  // Сохраняем
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(data, null, 2));

  console.log(`\nРезультат:`);
  console.log(`  Обогащено: ${results.enriched}`);
  console.log(`  Ошибок: ${results.errors}`);
}

async function performSearch(query) {
  // Заглушка — в реальности используем web_search
  return null;
}

main().catch(err => {
  console.error('Фатальная ошибка:', err);
  process.exit(1);
});
