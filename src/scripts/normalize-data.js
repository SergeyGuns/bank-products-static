#!/usr/bin/env node

/**
 * Скрипт нормализации данных products.json
 * - Убирает дублирование типов (mortgages -> mortgage, insurance -> insurance-products и т.д.)
 * - Нормализует названия банков (Т-Банк, T-Банк, T-Bank -> Т-Банк)
 * - Убирает невалидные продукты (пустые parameters.main)
 */

const fs = require('fs').promises;
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');

const TYPE_MAPPING = {
  'mortgages': 'mortgage',
  'insurance': 'insurance-products',
  'investments': 'investment-products',
  'loans': 'consumer-loans',
  'cards': 'credit-cards',
  'unknown': 'consumer-loans',
};

const BANK_MAPPING = {
  'tbank': 'Т-Банк',
  'T-Банк': 'Т-Банк',
  'T-Bank': 'Т-Банк',
  'ТБанк': 'Т-Банк',
  'Тинькофф Банк': 'Т-Банк',
  'Тинькофф': 'Т-Банк',
  'psb': 'ПСБ',
  'Промсвязьбанк': 'ПСБ',
  'Росбанк': 'Росбанк',
  'СберБанк': 'СберБанк',
  'Сбер': 'СберБанк',
  'Ситибанк': 'Ситибанк',
  'Альфа-Банк': 'Альфа-Банк',
  'Альфа Банк': 'Альфа-Банк',
  'Газпромбанк': 'Газпромбанк',
  'ВТБ': 'ВТБ',
  'Райффайзенбанк': 'Райффайзенбанк',
  'Райффайзен': 'Райффайзенбанк',
  'МТС Банк': 'МТС Банк',
  'МТС': 'МТС Банк',
  'ТрансаBank': 'Трансабанк',
  'Транспортный Кредитный Компания': 'Транспортный кредитный банк',
  'Пример Банка': null,
};

async function main() {
  let data;
  try {
    data = JSON.parse(await fs.readFile(PRODUCTS_FILE, 'utf-8'));
  } catch (err) {
    console.error('Ошибка чтения:', err.message);
    process.exit(1);
  }

  const products = data.products || [];
  console.log('Продуктов до нормализации:', products.length);

  const stats = {
    typesFixed: 0,
    banksFixed: 0,
    removed: 0,
  };

  const cleaned = [];

  for (const product of products) {
    // Пропускаем продукты с пустым parameters.main
    if (!product.parameters?.main || Object.keys(product.parameters.main).length === 0) {
      if (product.bankName === 'Пример Банка' || product.title.includes('Пример')) {
        stats.removed++;
        continue;
      }
    }

    // Нормализация типа
    if (TYPE_MAPPING[product.type]) {
      product.type = TYPE_MAPPING[product.type];
      stats.typesFixed++;
    }

    // Нормализация банка
    if (BANK_MAPPING[product.bankName] === null) {
      stats.removed++;
      continue;
    }
    if (BANK_MAPPING[product.bankName]) {
      product.bankName = BANK_MAPPING[product.bankName];
      stats.banksFixed++;
    }

    cleaned.push(product);
  }

  data.products = cleaned;
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(data, null, 2));

  console.log('\nРезультат:');
  console.log('  Типов исправлено:', stats.typesFixed);
  console.log('  Банков исправлено:', stats.banksFixed);
  console.log('  Удалено (примеры/пустые):', stats.removed);
  console.log('  Продуктов после:', cleaned.length);

  // Показать статистику по типам
  const types = {};
  const banks = new Set();
  cleaned.forEach(p => {
    types[p.type] = (types[p.type] || 0) + 1;
    banks.add(p.bankName);
  });

  console.log('\nПо типам:');
  Object.entries(types).sort((a, b) => b[1] - a[1]).forEach(([t, c]) => {
    console.log('  ' + t + ': ' + c);
  });

  console.log('\nБанки (' + banks.size + '):');
  [...banks].sort().forEach(b => console.log('  ' + b));
}

main().catch(err => {
  console.error('Ошибка:', err);
  process.exit(1);
});
