#!/usr/bin/env node

/**
 * Скрипт для проверки корректности данных о банковских продуктах
 * Валидирует products.json по product-schema.json с использованием ajv
 */

const fs = require('fs').promises;
const path = require('path');
const Ajv = require('ajv');

const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');
const SCHEMA_FILE = path.join(__dirname, '../schemas/product-schema.json');

// Допустимые типы продуктов (расширенные по сравнению со scheme)
const VALID_TYPES = [
  'credit-cards', 'debit-cards', 'credits', 'deposits', 'mortgage',
  'auto-loans', 'business-loans', 'consumer-loans',
  'investment-products', 'insurance-products', 'digital-services',
  'savings', 'loans', 'investments', 'insurance'
];

async function validateProducts() {
  console.log('🔍 Валидация products.json...\n');

  // Загружаем данные и схему
  let productsData, schema;
  try {
    const [productsRaw, schemaRaw] = await Promise.all([
      fs.readFile(PRODUCTS_FILE, 'utf-8'),
      fs.readFile(SCHEMA_FILE, 'utf-8'),
    ]);
    productsData = JSON.parse(productsRaw);
    schema = JSON.parse(schemaRaw);
  } catch (err) {
    console.error(`❌ Ошибка чтения файлов: ${err.message}`);
    process.exit(1);
  }

  const products = productsData.products || [];
  console.log(`   Найдено продуктов: ${products.length}`);

  // Настраиваем ajv
  const ajv = new Ajv({ allErrors: true, verbose: true });
  const validate = ajv.compile(schema);

  const errors = [];
  const warnings = [];
  const seenIds = new Set();

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const productLabel = `[${i + 1}/${products.length}] ${product.title || product.id || '(no title)'}`;

    // Валидация по JSON Schema
    const valid = validate(product);
    if (!valid) {
      for (const err of validate.errors) {
        errors.push(`${productLabel}: ${err.instancePath} ${err.message}`);
      }
    }

    // Дополнительные проверки

    // 1. Уникальность ID
    if (product.id) {
      if (seenIds.has(product.id)) {
        errors.push(`${productLabel}: дубликат id "${product.id}"`);
      }
      seenIds.add(product.id);
    }

    // 2. Непустые обязательные поля
    if (!product.title || product.title.trim() === '') {
      errors.push(`${productLabel}: пустое поле title`);
    }
    if (!product.bankName || product.bankName.trim() === '') {
      errors.push(`${productLabel}: пустое поле bankName`);
    }

    // 3. Параметры main не пустые
    if (!product.parameters?.main || Object.keys(product.parameters.main).length === 0) {
      warnings.push(`${productLabel}: пустой parameters.main`);
    }

    // 4. Валидность URL referralLink
    if (product.referralLink && product.referralLink !== '') {
      try {
        new URL(product.referralLink);
      } catch {
        warnings.push(`${productLabel}: невалидный referralLink "${product.referralLink}"`);
      }
    }

    // 5. Предупреждение о placeholder imageUrl
    if (product.imageUrl && product.imageUrl.includes('/img/products/.jpg')) {
      warnings.push(`${productLabel}: placeholder imageUrl`);
    }
  }

  // Вывод результатов
  console.log(`\n📊 Результаты валидации:`);
  console.log(`   Продуктов проверено: ${products.length}`);
  console.log(`   Ошибок: ${errors.length}`);
  console.log(`   Предупреждений: ${warnings.length}`);

  if (errors.length > 0) {
    console.log(`\n❌ Ошибки:`);
    errors.forEach((e, i) => console.log(`   ${i + 1}. ${e}`));
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  Предупреждения:`);
    warnings.forEach((w, i) => console.log(`   ${i + 1}. ${w}`));
  }

  if (errors.length === 0) {
    console.log('\n✅ Все продукты прошли валидацию!');
    return true;
  } else {
    console.log(`\n❌ Обнаружено ${errors.length} ошибок`);
    return false;
  }
}

async function main() {
  try {
    const isValid = await validateProducts();
    process.exit(isValid ? 0 : 1);
  } catch (error) {
    console.error(`💥 Необработанная ошибка: ${error.message}`);
    process.exit(1);
  }
}

main();