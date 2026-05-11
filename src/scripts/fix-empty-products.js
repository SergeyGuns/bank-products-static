#!/usr/bin/env node
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/data/products.json', 'utf8'));

const typeLabels = {
  'credit-cards': 'Кредитная карта',
  'debit-cards': 'Дебетовая карта',
  'consumer-loans': 'Потребительский кредит',
  'mortgage': 'Ипотека',
  'deposits': 'Вклад',
  'credits': 'Кредит',
  'auto-loans': 'Автокредит',
  'business-loans': 'Бизнес-кредит',
  'digital-services': 'Цифровые сервисы',
  'insurance-products': 'Страхование',
  'investment-products': 'Инвестиции',
  'savings': 'Накопительный счёт',
};

let fixed = 0;
data.products.forEach(p => {
  let changed = false;
  
  if (!p.shortDescription || p.shortDescription.length < 5 || p.shortDescription === p.type) {
    p.shortDescription = (typeLabels[p.type] || p.type) + ' от ' + p.bankName;
    changed = true;
  }
  
  if (!p.features || p.features.length === 0) {
    if (p.parameters?.main && Object.keys(p.parameters.main).length > 0) {
      p.features = Object.values(p.parameters.main).filter(v => v && v.length > 0).slice(0, 3);
    }
    if (!p.features || p.features.length === 0) {
      p.features = ['Условия уточняйте на сайте'];
    }
    changed = true;
  }
  
  if (!p.conditions || p.conditions.length === 0) {
    if (p.parameters?.requirements && Object.keys(p.parameters.requirements).length > 0) {
      p.conditions = Object.values(p.parameters.requirements).filter(v => v && v.length > 0).slice(0, 3);
    }
    if (!p.conditions || p.conditions.length === 0) {
      p.conditions = ['Уточняйте на сайте банка'];
    }
    changed = true;
  }
  
  if (!p.fullDescription || p.fullDescription.length < 10) {
    const mainParams = Object.entries(p.parameters?.main || {}).map(([k,v]) => k + ': ' + v).join('. ');
    p.fullDescription = p.shortDescription + '. ' + (mainParams || 'Подробные условия уточняйте на сайте банка.');
    changed = true;
  }
  
  if (changed) {
    fixed++;
    console.log('Исправлен: ' + p.bankName + ' / ' + p.type);
  }
});

fs.writeFileSync('src/data/products.json', JSON.stringify(data, null, 2));
console.log('\nВсего исправлено: ' + fixed);
