#!/usr/bin/env node
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/data/products.json', 'utf8'));

const newProducts = [
  // Трансабанк
  { id: 'transbank-mortgage-1', title: 'Ипотека', bankName: 'Трансабанк', type: 'mortgage', featured: false, shortDescription: 'Ипотека на новостройки и вторичное жильё', fullDescription: 'Ипотечный кредит Трансабанка. Ставка от 21%. Первоначальный взнос от 10%.', parameters: { main: { 'Процентная ставка': 'от 21%', 'Сумма кредита': 'до 30 000 000 ₽', 'Срок': 'до 30 лет', 'Первоначальный взнос': 'от 10%' }, fees: { 'Оформление': 'бесплатно' }, requirements: { 'Возраст': 'от 21 года' } }, features: ['от 21%', 'до 30 000 000 ₽'], conditions: ['от 21 года'], referralLink: 'https://www.transbank.ru/', meta: { title: 'Ипотека Трансабанк', description: 'Ипотечный кредит от 21%' }, version: { date: '2026-05-11', source: 'manual-entry', updatedBy: 'agent' }, validFrom: '2026-05-11', status: 'active' },
  // ТКБ
  { id: 'tcb-mortgage-1', title: 'Ипотека', bankName: 'Транспортный кредитный банк', type: 'mortgage', featured: false, shortDescription: 'Ипотека на новостройки и вторичное жильё', fullDescription: 'Ипотечный кредит ТКБ. Ставка от 21%. Первоначальный взнос от 10%.', parameters: { main: { 'Процентная ставка': 'от 21%', 'Сумма кредита': 'до 30 000 000 ₽', 'Срок': 'до 30 лет', 'Первоначальный взнос': 'от 10%' }, fees: { 'Оформление': 'бесплатно' }, requirements: { 'Возраст': 'от 21 года' } }, features: ['от 21%', 'до 30 000 000 ₽'], conditions: ['от 21 года'], referralLink: 'https://www.tkb.ru/', meta: { title: 'Ипотека ТКБ', description: 'Ипотечный кредит от 21%' }, version: { date: '2026-05-11', source: 'manual-entry', updatedBy: 'agent' }, validFrom: '2026-05-11', status: 'active' },
  // Ситибанк
  { id: 'citibank-credit-cards-1', title: 'Кредитная карта Citibank', bankName: 'Ситибанк', type: 'credit-cards', featured: false, shortDescription: 'Кредитная карта с кэшбэком до 3%', fullDescription: 'Кредитная карта Ситибанка с кэшбэком до 3% и льготным периодом до 60 дней.', parameters: { main: { 'Процентная ставка': 'от 29,9%', 'Кредитный лимит': 'до 3 000 000 ₽', 'Льготный период': 'до 60 дней', 'Кэшбэк': 'до 3%' }, fees: { 'Обслуживание': 'бесплатно*' }, requirements: { 'Возраст': 'от 21 года' } }, features: ['до 60 дней без %', 'до 3% кэшбэк'], conditions: ['от 21 года'], referralLink: 'https://www.citibank.ru/russia/main/rus/personal_banking/cards.htm', meta: { title: 'Кредитная карта Ситибанк', description: 'Кредитная карта с кэшбэком до 3%' }, version: { date: '2026-05-11', source: 'manual-entry', updatedBy: 'agent' }, validFrom: '2026-05-11', status: 'active' },
  { id: 'citibank-mortgage-1', title: 'Ипотека', bankName: 'Ситибанк', type: 'mortgage', featured: false, shortDescription: 'Ипотека на новостройки и вторичное жильё', fullDescription: 'Ипотечный кредит Ситибанка. Ставка от 21%. Первоначальный взнос от 10%.', parameters: { main: { 'Процентная ставка': 'от 21%', 'Сумма кредита': 'до 60 000 000 ₽', 'Срок': 'до 30 лет', 'Первоначальный взнос': 'от 10%' }, fees: { 'Оформление': 'бесплатно' }, requirements: { 'Возраст': 'от 21 года' } }, features: ['от 21%', 'до 60 000 000 ₽'], conditions: ['от 21 года'], referralLink: 'https://www.citibank.ru/russia/main/rus/personal_banking/mortgage.htm', meta: { title: 'Ипотека Ситибанк', description: 'Ипотечный кредит от 21%' }, version: { date: '2026-05-11', source: 'manual-entry', updatedBy: 'agent' }, validFrom: '2026-05-11', status: 'active' },
];

const existingKeys = new Set(data.products.map(p => p.bankName + '::' + p.type));
let added = 0;
for (const p of newProducts) {
  const key = p.bankName + '::' + p.type;
  if (!existingKeys.has(key)) {
    data.products.push(p);
    existingKeys.add(key);
    added++;
    console.log('Добавлен: ' + key + ' - ' + p.title);
  }
}
fs.writeFileSync('src/data/products.json', JSON.stringify(data, null, 2));
console.log('\nИтого добавлено: ' + added);
console.log('Всего продуктов: ' + data.products.length);
