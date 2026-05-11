#!/usr/bin/env node
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/data/products.json', 'utf8'));

const typeMapping = {
  'deposits': 'deposits',
  'loans': 'consumer-loans',
  'mortgages': 'mortgage',
  'credits': 'credits',
  'credit-cards': 'credit-cards',
  'debit-cards': 'debit-cards',
  'auto-loans': 'auto-loans',
  'business-loans': 'business-loans',
  'consumer-loans': 'consumer-loans',
  'mortgage': 'mortgage',
  'investment-products': 'investment-products',
  'insurance-products': 'insurance-products',
  'digital-services': 'digital-services',
  'savings': 'savings',
};

let fixed = 0;
let removed = 0;

data.products = data.products.filter(p => {
  // Удаляем продукты с полностью пустыми данными
  const hasEmptyMain = !p.parameters?.main || Object.keys(p.parameters.main).length === 0;
  const hasNoTitle = !p.title || p.title.length < 3;
  
  if (hasEmptyMain && hasNoTitle) {
    console.log('Удалён: ' + p.bankName + ' / ' + p.type + ' (пустые данные)');
    removed++;
    return false;
  }
  return true;
}).map(p => {
  // Исправляем id с кириллицей
  if (/[а-яА-ЯёЁ]/.test(p.id)) {
    const oldId = p.id;
    p.id = p.id.toLowerCase()
      .replace(/[а-яА-ЯёЁ]/g, (char) => {
        const map = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','sh':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','ya':'ya'};
        return map[char] || char;
      })
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    console.log('Исправлен id: ' + oldId + ' -> ' + p.id);
    fixed++;
  }

  // Исправляем невалидный type
  if (!typeMapping[p.type] && !['credit-cards','debit-cards','credits','deposits','mortgage','auto-loans','business-loans','consumer-loans','investment-products','insurance-products','digital-services','savings'].includes(p.type)) {
    // Определяем тип по данным
    if (p.type === 'loans') p.type = 'consumer-loans';
    else if (p.type === 'mortgages') p.type = 'mortgage';
    else if (p.type === 'deposits') p.type = 'deposits';
    else p.type = 'consumer-loans'; // fallback
    console.log('Исправлен type: ' + p.bankName + ' -> ' + p.type);
    fixed++;
  }

  // Исправляем невалидный status
  if (!['active', 'discontinued', 'updated', 'pending'].includes(p.status)) {
    p.status = 'active';
    console.log('Исправлен status: ' + p.bankName + ' / ' + p.type);
    fixed++;
  }

  // Исправляем пустой parameters.main
  if (!p.parameters?.main || Object.keys(p.parameters.main).length === 0) {
    p.parameters = p.parameters || {};
    p.parameters.main = { 'Процентная ставка': 'уточняйте на сайте банка' };
    p.parameters.fees = p.parameters.fees || {};
    p.parameters.requirements = p.parameters.requirements || {};
    console.log('Исправлен empty main: ' + p.bankName + ' / ' + p.type);
    fixed++;
  }

  // Исправляем пустой shortDescription
  if (!p.shortDescription || p.shortDescription.length < 5) {
    const typeLabels = {
      'credit-cards': 'Кредитная карта',
      'debit-cards': 'Дебетовая карта',
      'consumer-loans': 'Потребительский кредит',
      'mortgage': 'Ипотека',
      'deposits': 'Вклад',
      'credits': 'Кредит',
      'auto-loans': 'Автокредит',
      'business-loans': 'Бизнес-кредит',
    };
    p.shortDescription = (typeLabels[p.type] || p.type) + ' от ' + p.bankName;
    fixed++;
  }

  // Исправляем пустые features
  if (!p.features || p.features.length === 0) {
    p.features = Object.values(p.parameters?.main || {}).filter(v => v && v.length > 0).slice(0, 3);
    if (p.features.length === 0) p.features = ['Условия уточняйте на сайте'];
    fixed++;
  }

  // Исправляем пустые conditions
  if (!p.conditions || p.conditions.length === 0) {
    p.conditions = Object.values(p.parameters?.requirements || {}).filter(v => v && v.length > 0).slice(0, 3);
    if (p.conditions.length === 0) p.conditions = ['Уточняйте на сайте банка'];
    fixed++;
  }

  return p;
});

fs.writeFileSync('src/data/products.json', JSON.stringify(data, null, 2));
console.log('\nИсправлено: ' + fixed);
console.log('Удалено: ' + removed);
console.log('Всего продуктов: ' + data.products.length);
