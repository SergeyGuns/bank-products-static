#!/usr/bin/env node

/**
 * Image Generator — генерация SVG иконок для банков
 * Создаёт простые цветные иконки с названием банка
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../static/img/banks');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Цвета для банков
const BANK_COLORS = {
  'СберБанк': '#21A038',
  'Т-Банк': '#FFDD2D',
  'ВТБ': '#003F7D',
  'Газпромбанк': '#00529B',
  'Альфа-Банк': '#EF3124',
  'ПСБ': '#00529B',
  'Райффайзенбанк': '#00A3E0',
  'МТС Банк': '#E30613',
  'Росбанк': '#E30613',
  'Совкомбанк': '#00B4E6',
  'Открытие': '#00B4E6',
  'Россельхозбанк': '#007A3E',
  'Ситибанк': '#003B70',
  'Трансабанк': '#00529B',
  'Транспортный кредитный банк': '#00529B',
};

function generateSVG(bankName, color) {
  const initials = bankName
    .split(' ')
    .map(w => w[0])
    .join('')
    .substring(0, 3)
    .toUpperCase();
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80">
  <rect width="120" height="80" rx="8" fill="${color}"/>
  <text x="60" y="45" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle">${initials}</text>
</svg>`;
}

function main() {
  console.log('Генерация SVG иконок для банков...\n');
  
  let created = 0;
  
  for (const [bank, color] of Object.entries(BANK_COLORS)) {
    const filename = bank.toLowerCase().replace(/\s+/g, '-').replace(/[^a-zа-яё-]/g, '') + '.svg';
    const dest = path.join(OUTPUT_DIR, filename);
    
    const svg = generateSVG(bank, color);
    fs.writeFileSync(dest, svg);
    console.log('✓ ' + bank + ' -> ' + filename);
    created++;
  }
  
  console.log('\nСоздано иконок: ' + created);
  console.log('Папка: ' + OUTPUT_DIR);
}

main();
