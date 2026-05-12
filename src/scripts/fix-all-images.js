#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync('src/data/products.json', 'utf8'));

// Mapping: bankName -> slug
const bankSlugMap = {
    'Альфа-Банк': 'alfa-bank',
    'ВТБ': 'vtb',
    'Газпромбанк': 'gazprombank',
    'МТС Банк': 'mts-bank',
    'Открытие': 'otkrytie',
    'ПСБ': 'psb',
    'Райффайзенбанк': 'raiffeisen',
    'Росбанк': 'rosbank',
    'Россельхозбанк': 'rosselkhozbank',
    'СберБанк': 'sberbank',
    'Ситибанк': 'citibank',
    'Совкомбанк': 'sovcombank',
    'Т-Банк': 't-bank',
    'Трансабанк': 'transbank',
    'Транспортный кредитный банк': 'transport-credit-bank',
};

const bankColors = {
    'Альфа-Банк': '#ef3124',
    'ВТБ': '#003f7d',
    'Газпромбанк': '#0039a6',
    'МТС Банк': '#e30613',
    'Открытие': '#00b4e1',
    'ПСБ': '#00529b',
    'Райффайзенбанк': '#000000',
    'Росбанк': '#003087',
    'Россельхозбанк': '#006838',
    'СберБанк': '#1a9f29',
    'Ситибанк': '#056dae',
    'Совкомбанк': '#005eab',
    'Т-Банк': '#3366ff',
    'Трансабанк': '#005eab',
    'Транспортный кредитный банк': '#005eab',
};

const bankInitials = {
    'Альфа-Банк': 'АБ',
    'ВТБ': 'ВТБ',
    'Газпромбанк': 'ГПБ',
    'МТС Банк': 'МТС',
    'Открытие': 'ОТК',
    'ПСБ': 'ПСБ',
    'Райффайзенбанк': 'РБ',
    'Росбанк': 'РСБ',
    'Россельхозбанк': 'РСХБ',
    'СберБанк': 'СБ',
    'Ситибанк': 'СИТИ',
    'Совкомбанк': 'СКБ',
    'Т-Банк': 'ТБ',
    'Трансабанк': 'ТРБ',
    'Транспортный кредитный банк': 'ТКБ',
};

const logosDir = 'src/static/img/banks';

// Удаляем старые SVG
fs.readdirSync(logosDir).forEach(f => {
    if (f.endsWith('.svg')) {
        fs.unlinkSync(path.join(logosDir, f));
    }
});

// Создаём новые SVG с латинскими именами
const created = new Set();
data.products.forEach(p => {
    const slug = bankSlugMap[p.bankName];
    if (!slug || created.has(slug)) return;
    created.add(slug);
    
    const color = bankColors[p.bankName] || '#666666';
    const initials = bankInitials[p.bankName] || p.bankName.substring(0, 3).toUpperCase();
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40">
  <rect width="120" height="40" rx="4" fill="${color}" opacity="0.1"/>
  <rect x="1" y="1" width="118" height="38" rx="3" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.3"/>
  <text x="60" y="25" font-family="Arial, sans-serif" font-size="13" font-weight="600" fill="${color}" text-anchor="middle">${initials}</text>
</svg>`;
    
    fs.writeFileSync(path.join(logosDir, `${slug}.svg`), svg);
});

// Обновляем imageUrl всех продуктов на латинские пути
let updated = 0;
data.products.forEach(p => {
    const slug = bankSlugMap[p.bankName];
    if (slug) {
        const newUrl = `/static/img/banks/${slug}.svg`;
        if (p.imageUrl !== newUrl) {
            p.imageUrl = newUrl;
            updated++;
        }
    }
});

fs.writeFileSync('src/data/products.json', JSON.stringify(data, null, 2));
console.log(`Создано SVG: ${created.size}`);
console.log(`Обновлено imageUrl: ${updated}`);
