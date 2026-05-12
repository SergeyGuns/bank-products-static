#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync('src/data/products.json', 'utf8'));

// Цвета банков для логотипов
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

// Создаём SVG логотипы для банков
const logosDir = 'src/static/img/banks';
if (!fs.existsSync(logosDir)) {
    fs.mkdirSync(logosDir, { recursive:  true });
}

let fixed = 0;
data.products.forEach(p => {
    if (!p.imageUrl) {
        const bankSlug = p.bankName.toLowerCase().replace(/[^a-zа-я0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        const logoPath = `/static/img/banks/${bankSlug}.svg`;
        const logoFile = path.join('src/static/img/banks', `${bankSlug}.svg`);
        
        // Создаём SVG если не существует
        if (!fs.existsSync(logoFile)) {
            const color = bankColors[p.bankName] || '#666666';
            const initials = p.bankName.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase();
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40">
  <rect width="120" height="40" rx="4" fill="${color}" opacity="0.1"/>
  <rect x="1" y="1" width="118" height="38" rx="3" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.3"/>
  <text x="60" y="25" font-family="Arial, sans-serif" font-size="14" font-weight="600" fill="${color}" text-anchor="middle">${initials}</text>
</svg>`;
            fs.writeFileSync(logoFile, svg);
        }
        
        p.imageUrl = logoPath;
        fixed++;
    }
});

fs.writeFileSync('src/data/products.json', JSON.stringify(data, null, 2));
console.log(`Добавлено imageUrl для ${fixed} продуктов`);

// Проверка
const missing = data.products.filter(p => !p.imageUrl);
console.log(`Продуктов без imageUrl: ${missing.length}`);
