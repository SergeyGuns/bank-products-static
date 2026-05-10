#!/usr/bin/env node

/**
 * Merge Agent — объединение новых продуктов с products.json
 *
 * На входе: extracted-products.json
 * На выходе: обновлённый products.json + merge-report.json
 *
 * Использование: node src/scripts/agent-merge.js [--dry-run]
 */

const fs = require('fs').promises;
const path = require('path');

const EXTRACTED_FILE = path.join(__dirname, '../data/extracted-products.json');
const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');
const REPORT_FILE = path.join(__dirname, '../data/merge-report.json');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

function validateProduct(p) {
  const errors = [];
  if (!p.id) errors.push('missing id');
  if (!p.title) errors.push('missing title');
  if (!p.bankName) errors.push('missing bankName');
  if (!p.type || p.type === 'unknown') errors.push('missing/invalid type');
  if (!p.parameters || !p.parameters.main || Object.keys(p.parameters.main).length === 0) {
    errors.push('empty parameters.main');
  }
  return errors;
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
  console.log('Merge Agent: запуск...');
  if (dryRun) console.log('   [DRY RUN]');

  let extractedData, productsData;
  try {
    extractedData = JSON.parse(await fs.readFile(EXTRACTED_FILE, 'utf-8'));
    productsData = JSON.parse(await fs.readFile(PRODUCTS_FILE, 'utf-8'));
  } catch (err) {
    console.error('Ошибка чтения файлов:', err.message);
    process.exit(1);
  }

  const existing = productsData.products || [];
  const existingIds = new Set(existing.map(p => p.id));
  const existingKeys = new Set(existing.map(p => p.bankName + '::' + p.title));

  const toAdd = [];
  const skipped = [];
  const invalid = [];

  for (const product of extractedData.extracted || []) {
    const errors = validateProduct(product);
    if (errors.length > 0) {
      invalid.push({ product: product.title, errors });
      continue;
    }

    if (product.type === 'unknown') {
      product.type = categorizeProduct(product);
    }

    const key = product.bankName + '::' + product.title;
    if (existingIds.has(product.id) || existingKeys.has(key)) {
      skipped.push({ product: product.title, reason: 'duplicate' });
      continue;
    }

    toAdd.push(product);
    existingIds.add(product.id);
    existingKeys.add(key);
  }

  const report = {
    timestamp: new Date().toISOString(),
    dryRun,
    stats: {
      extracted: (extractedData.extracted || []).length,
      toAdd: toAdd.length,
      skipped: skipped.length,
      invalid: invalid.length,
      totalBefore: existing.length,
      totalAfter: existing.length + toAdd.length,
    },
    added: toAdd.map(p => ({ id: p.id, title: p.title, bankName: p.bankName, type: p.type })),
    skipped,
    invalid,
  };

  console.log('\nРезультат:');
  console.log('   Извлечено: ' + report.stats.extracted);
  console.log('   К добавлению: ' + report.stats.toAdd);
  console.log('   Пропущено (дубли): ' + report.stats.skipped);
  console.log('   Невалидных: ' + report.stats.invalid);

  if (!dryRun && toAdd.length > 0) {
    productsData.products = existing.concat(toAdd);
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(productsData, null, 2));
    console.log('\nproducts.json обновлен: ' + report.stats.totalBefore + ' -> ' + report.stats.totalAfter);
  } else if (dryRun) {
    console.log('\n[DRY RUN] Будет добавлено: ' + toAdd.length);
  }

  await fs.writeFile(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log('   Отчет: ' + REPORT_FILE);
}

main().catch(err => {
  console.error('Фатальная ошибка:', err);
  process.exit(1);
});
