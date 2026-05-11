#!/usr/bin/env node
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/data/products.json', 'utf8'));

// Исправляем конкретные продукты с плохими данными
const fixes = {
  'Райффайзенбанк::credit-cards': {
    title: 'Кредитная карта «Халва»',
    shortDescription: 'Кредитная карта Халва с рассрочкой до 36 мес.',
    fullDescription: 'Кредитная карта Халва от Райффайзенбанка. Рассрочка до 36 месяцев у партнёров. Кэшбэк до 10%.',
    features: ['рассрочка до 36 мес.', 'кэшбэк до 10%', 'до 1 000 000 ₽'],
    parameters: {
      main: { 'Процентная ставка': 'от 29,9%', 'Кредитный лимит': 'до 1 000 000 ₽', 'Льготный период': 'до 55 дней', 'Кэшбэк': 'до 10%' },
      fees: { 'Обслуживание': 'бесплатно' },
      requirements: { 'Возраст': 'от 20 года' },
    },
  },
  'МТС Банк::credit-cards': {
    title: 'Кредитная карта МТС',
    shortDescription: 'Кредитная карта с кэшбэком до 5%',
    fullDescription: 'Кредитная карта МТС Банка с кэшбэком до 5% и льготным периодом до 120 дней.',
    features: ['до 120 дней без %', 'до 5% кэшбэк', 'до 500 000 ₽'],
    parameters: {
      main: { 'Процентная ставка': 'от 29,9%', 'Кредитный лимит': 'до 500 000 ₽', 'Льготный период': 'до 120 дней', 'Кэшбэк': 'до 5%' },
      fees: { 'Обслуживание': 'бесплатно' },
      requirements: { 'Возраст': 'от 20 года' },
    },
  },
  'СберБанк::credit-cards': {
    title: 'Кредитная СберКарта',
    shortDescription: 'Кредитная карта с льготным периодом 120 дней',
    fullDescription: 'Кредитная СберКарта с льготным периодом до 120 дней. Кэшбэк до 30% бонусами. Обслуживание бесплатное.',
    features: ['до 120 дней без %', 'до 30% кэшбэк', 'до 1 000 000 ₽'],
    parameters: {
      main: { 'Процентная ставка': 'от 9,8%', 'Кредитный лимит': 'до 1 000 000 ₽', 'Льготный период': 'до 120 дней', 'Кэшбэк': 'до 30%' },
      fees: { 'Обслуживание': 'бесплатно', 'Выпуск': 'бесплатно' },
      requirements: { 'Возраст': 'от 18 лет' },
    },
  },
};

let fixed = 0;
data.products.forEach(p => {
  const key = p.bankName + '::' + p.type;
  if (fixes[key]) {
    const fix = fixes[key];
    p.title = fix.title;
    p.shortDescription = fix.shortDescription;
    p.fullDescription = fix.fullDescription;
    p.features = fix.features;
    p.parameters = fix.parameters;
    p.conditions = ['от 18 лет', 'паспорт РФ'];
    fixed++;
    console.log('Исправлен: ' + key);
  }
});

fs.writeFileSync('src/data/products.json', JSON.stringify(data, null, 2));
console.log('\nИсправлено: ' + fixed);
