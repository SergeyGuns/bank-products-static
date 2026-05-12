#!/usr/bin/env node
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/data/products.json', 'utf8'));

let fixed = 0;
data.products.forEach(p => {
  if (!p.features || p.features.length === 0 || (p.features.length === 1 && p.features[0] === '')) {
    // Генерируем features из parameters
    p.features = [];
    if (p.parameters && p.parameters.main) {
      Object.entries(p.parameters.main).forEach(([key, value]) => {
        if (value && value !== '-') {
          p.features.push(`${key}: ${value}`);
        }
      });
    }
    if (p.shortDescription) {
      p.features.unshift(p.shortDescription);
    }
    // Убираем пустые
    p.features = p.features.filter(f => f && f.trim() !== '');
    if (p.features.length === 0) {
      p.features = ['Подробнее на странице продукта'];
    }
    fixed++;
  }
  // Убираем пустые строки из features
  if (p.features) {
    p.features = p.features.filter(f => f && f.trim() !== '');
  }
});

fs.writeFileSync('src/data/products.json', JSON.stringify(data, null, 2));
console.log(`Исправлено продуктов с пустыми features: ${fixed}`);
console.log(`Всего продуктов: ${data.products.length}`);
