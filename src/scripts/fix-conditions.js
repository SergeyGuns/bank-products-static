#!/usr/bin/env node
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/data/products.json', 'utf8'));

let fixed = 0;
data.products.forEach(p => {
  // Исправляем conditions — убираем вложенные массивы
  if (p.conditions) {
    p.conditions = p.conditions.map(c => {
      if (Array.isArray(c)) {
        return c.join(', ');
      }
      return c;
    });
  }
  
  // Исправляем type для старых продуктов
  if (p.type === 'credits' && p.title.toLowerCase().includes('потребит')) {
    p.type = 'consumer-loans';
    fixed++;
  }
  
  // Исправляем пустой conditions
  if (!p.conditions || p.conditions.length === 0) {
    p.conditions = ['Уточняйте на сайте банка'];
    fixed++;
  }
});

fs.writeFileSync('src/data/products.json', JSON.stringify(data, null, 2));
console.log('Исправлено: ' + fixed);
