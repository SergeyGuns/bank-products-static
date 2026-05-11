#!/usr/bin/env node

/**
 * Manual Data Entry — ручное добавление продуктов на основе реальных данных
 */

const fs = require('fs').promises;
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');

const NEW_PRODUCTS = [
  // Альфа-Банк
  {
    id: 'alfa-bank-credit-cards-1',
    title: 'Кредитная карта 100 дней',
    bankName: 'Альфа-Банк',
    type: 'credit-cards',
    featured: false,
    shortDescription: 'Кредитная карта с льготным периодом 100 дней',
    fullDescription: 'Кредитная карта Альфа-Банка с льготным периодом до 100 дней. Кэшбэк 5% в выбранных категориях. Обслуживание бесплатное при выполнении условий.',
    parameters: {
      main: { 'Процентная ставка': 'от 29,9%', 'Кредитный лимит': 'до 1 000 000 ₽', 'Льготный период': 'до 100 дней', 'Кэшбэк': 'до 5%' },
      fees: { 'Обслуживание': 'бесплатно*', 'Снятие наличных': '0% до 50 тыс/мес' },
      requirements: { 'Возраст': 'от 18 лет', 'Документы': 'паспорт РФ' },
    },
    features: ['до 100 дней без %', 'до 5% кэшбэк', 'до 1 000 000 ₽'],
    conditions: ['от 18 лет', 'паспорт РФ'],
    referralLink: 'https://alfabank.ru/retail/cards/credit/',
    meta: { title: 'Кредитная карта Альфа-Банк 100 дней', description: 'Кредитная карта с льготным периодом 100 дней и кэшбэком до 5%' },
    version: { date: '2026-05-10', source: 'manual-entry', updatedBy: 'agent' },
    validFrom: '2026-05-10',
    status: 'active',
  },
  {
    id: 'alfa-bank-debit-cards-1',
    title: 'Альфа-Карта',
    bankName: 'Альфа-Банк',
    type: 'debit-cards',
    featured: false,
    shortDescription: 'Дебетовая карта с кэшбэком до 10%',
    fullDescription: 'Дебетовая карта Альфа-Банка с кэшбэком до 10% в выбранных категориях. Бесплатное обслуживание при покупках от 10 000 ₽/мес.',
    parameters: {
      main: { 'Кэшбэк': 'до 10%', 'Процент на остаток': 'до 6%', 'Снятие наличных': 'бесплатно до 50 тыс/мес' },
      fees: { 'Обслуживание': 'бесплатно*', 'Выпуск': 'бесплатно' },
      requirements: { 'Возраст': 'от 14 лет', 'Документы': 'паспорт РФ' },
    },
    features: ['до 10% кэшбэк', 'до 6% на остаток', 'бесплатное обслуживание*'],
    conditions: ['от 14 лет', 'паспорт РФ'],
    referralLink: 'https://alfabank.ru/retail/cards/debit/',
    meta: { title: 'Альфа-Карта дебетовая', description: 'Дебетовая карта с кэшбэком до 10% и процентом на остаток' },
    version: { date: '2026-05-10', source: 'manual-entry', updatedBy: 'agent' },
    validFrom: '2026-05-10',
    status: 'active',
  },
  {
    id: 'alfa-bank-consumer-loans-1',
    title: 'Потребительский кредит',
    bankName: 'Альфа-Банк',
    type: 'consumer-loans',
    featured: false,
    shortDescription: 'Потребительский кредит без залога и поручителей',
    fullDescription: 'Потребительский кредит Альфа-Банка на любые цели. Без залога и поручителей. Ставка от 13,9%. Сумма до 5 000 000 ₽.',
    parameters: {
      main: { 'Процентная ставка': 'от 13,9%', 'Сумма кредита': 'до 5 000 000 ₽', 'Срок': 'до 5 лет' },
      fees: { 'Оформление': 'бесплатно', 'Досрочное погашение': 'бесплатно' },
      requirements: { 'Возраст': 'от 21 года', 'Стаж': 'от 3 месяцев', 'Документы': 'паспорт РФ' },
    },
    features: ['от 13,9%', 'до 5 000 000 ₽', 'до 5 лет'],
    conditions: ['от 21 года', 'стаж от 3 мес.'],
    referralLink: 'https://alfabank.ru/retail/loans/',
    meta: { title: 'Потребительский кредит Альфа-Банк', description: 'Кредит наличными без залога и поручителей от 13,9%' },
    version: { date: '2026-05-10', source: 'manual-entry', updatedBy: 'agent' },
    validFrom: '2026-05-10',
    status: 'active',
  },
  {
    id: 'alfa-bank-mortgage-1',
    title: 'Ипотека',
    bankName: 'Альфа-Банк',
    type: 'mortgage',
    featured: false,
    shortDescription: 'Ипотека на новостройки и вторичное жильё',
    fullDescription: 'Ипотечный кредит Альфа-Банка на покупку жилья в новостройках и на вторичном рынке. Ставка от 20,1%. Первоначальный взнос от 10%.',
    parameters: {
      main: { 'Процентная ставка': 'от 20,1%', 'Сумма кредита': 'до 120 000 000 ₽', 'Срок': 'до 30 лет', 'Первоначальный взнос': 'от 10%' },
      fees: { 'Оформление': 'бесплатно', 'Страхование': 'обязательно' },
      requirements: { 'Возраст': 'от 21 года', 'Стаж': 'от 6 месяцев', 'Документы': 'паспорт РФ, справка о доходах' },
    },
    features: ['от 20,1%', 'до 120 000 000 ₽', 'до 30 лет'],
    conditions: ['от 21 года', 'взнос от 10%'],
    referralLink: 'https://alfabank.ru/retail/ipoteka/',
    meta: { title: 'Ипотека Альфа-Банк', description: 'Ипотечный кредит на новостройки и вторичное жильё от 20,1%' },
    version: { date: '2026-05-10', source: 'manual-entry', updatedBy: 'agent' },
    validFrom: '2026-05-10',
    status: 'active',
  },
  {
    id: 'alfa-bank-deposits-1',
    title: 'Вклад «Лучший»',
    bankName: 'Альфа-Банк',
    type: 'deposits',
    featured: false,
    shortDescription: 'Вклад с максимальной ставкой',
    fullDescription: 'Срочный вклад Альфа-Банка с повышенной процентной ставкой. Пополнение и частичное снятие без потери процентов.',
    parameters: {
      main: { 'Процентная ставка': 'до 18%', 'Минимальная сумма': 'от 10 000 ₽', 'Срок': 'от 1 месяца' },
      fees: { 'Пополнение': 'без ограничений', 'Частичное снятие': 'разрешено' },
      requirements: { 'Возраст': 'от 18 лет', 'Документы': 'паспорт РФ' },
    },
    features: ['до 18%', 'от 10 000 ₽', 'от 1 месяца'],
    conditions: ['от 18 лет', 'паспорт РФ'],
    referralLink: 'https://alfabank.ru/retail/deposits/',
    meta: { title: 'Вклад Альфа-Банк «Лучший»', description: 'Срочный вклад с максимальной ставкой до 18%' },
    version: { date: '2026-05-10', source: 'manual-entry', updatedBy: 'agent' },
    validFrom: '2026-05-10',
    status: 'active',
  },

  // ВТБ
  {
    id: 'vtb-credit-cards-1',
    title: 'Кредитная карта Мультикарта',
    bankName: 'ВТБ',
    type: 'credit-cards',
    featured: false,
    shortDescription: 'Кредитная карта с кэшбэком до 10%',
    fullDescription: 'Кредитная карта ВТБ с кэшбэком до 10% в выбранных категориях. Льготный период до 110 дней. Обслуживание бесплатное.',
    parameters: {
      main: { 'Процентная ставка': 'от 29,9%', 'Кредитный лимит': 'до 10 000 000 ₽', 'Льготный период': 'до 110 дней', 'Кэшбэк': 'до 10%' },
      fees: { 'Обслуживание': 'бесплатно', 'Снятие наличных': '3,9% + 390 ₽' },
      requirements: { 'Возраст': 'от 21 года', 'Документы': 'паспорт РФ' },
    },
    features: ['до 110 дней без %', 'до 10% кэшбэк', 'до 10 000 000 ₽'],
    conditions: ['от 21 года', 'паспорт РФ'],
    referralLink: 'https://www.vtb.ru/personal/cards/credit-cards/',
    meta: { title: 'Кредитная карта ВТБ Мультикарта', description: 'Кредитная карта с кэшбэком до 10% и льготным периодом 110 дней' },
    version: { date: '2026-05-10', source: 'manual-entry', updatedBy: 'agent' },
    validFrom: '2026-05-10',
    status: 'active',
  },
  {
    id: 'vtb-debit-cards-1',
    title: 'Дебетовая карта Мультикарта',
    bankName: 'ВТБ',
    type: 'debit-cards',
    featured: false,
    shortDescription: 'Дебетовая карта с кэшбэком до 5%',
    fullDescription: 'Дебетовая карта ВТБ с кэшбэком до 5% в выбранных категориях. Бесплатное обслуживание при покупках от 7 000 ₽/мес.',
    parameters: {
      main: { 'Кэшбэк': 'до 5%', 'Процент на остаток': 'до 5%', 'Снятие наличных': 'бесплатно' },
      fees: { 'Обслуживание': 'бесплатно*', 'Выпуск': 'бесплатно' },
      requirements: { 'Возраст': 'от 14 лет', 'Документы': 'паспорт РФ' },
    },
    features: ['до 5% кэшбэк', 'до 5% на остаток', 'бесплатное обслуживание*'],
    conditions: ['от 14 лет', 'паспорт РФ'],
    referralLink: 'https://www.vtb.ru/personal/cards/debit-cards/',
    meta: { title: 'Дебетовая карта ВТБ Мультикарта', description: 'Дебетовая карта с кэшбэком до 5% и процентом на остаток' },
    version: { date: '2026-05-10', source: 'manual-entry', updatedBy: 'agent' },
    validFrom: '2026-05-10',
    status: 'active',
  },

  // Газпромбанк
  {
    id: 'gazprombank-credit-cards-1',
    title: 'Кредитная карта GPB',
    bankName: 'Газпромбанк',
    type: 'credit-cards',
    featured: false,
    shortDescription: 'Кредитная карта с кэшбэком до 7%',
    fullDescription: 'Кредитная карта Газпромбанка с кэшбэком до 7% на все покупки. Льготный период до 60 дней.',
    parameters: {
      main: { 'Процентная ставка': 'от 29,9%', 'Кредитный лимит': 'до 3 000 000 ₽', 'Льготный период': 'до 60 дней', 'Кэшбэк': 'до 7%' },
      fees: { 'Обслуживание': 'от 0 ₽/мес*', 'Снятие наличных': '3,9% + 390 ₽' },
      requirements: { 'Возраст': 'от 21 года', 'Документы': 'паспорт РФ' },
    },
    features: ['до 60 дней без %', 'до 7% кэшбэк', 'до 3 000 000 ₽'],
    conditions: ['от 21 года', 'паспорт РФ'],
    referralLink: 'https://www.gazprombank.ru/personal/cards/credit/',
    meta: { title: 'Кредитная карта Газпромбанк', description: 'Кредитная карта с кэшбэком до 7% и льготным периодом 60 дней' },
    version: { date: '2026-05-10', source: 'manual-entry', updatedBy: 'agent' },
    validFrom: '2026-05-10',
    status: 'active',
  },
  {
    id: 'gazprombank-debit-cards-1',
    title: 'Дебетовая карта GPB',
    bankName: 'Газпромбанк',
    type: 'debit-cards',
    featured: false,
    shortDescription: 'Дебетовая карта с кэшбэком до 5%',
    fullDescription: 'Дебетовая карта Газпромбанка с кэшбэком до 5% в выбранных категориях. Бесплатное обслуживание.',
    parameters: {
      main: { 'Кэшбэк': 'до 5%', 'Процент на остаток': 'до 4%', 'Снятие наличных': 'бесплатно' },
      fees: { 'Обслуживание': 'бесплатно*', 'Выпуск': 'бесплатно' },
      requirements: { 'Возраст': 'от 14 лет', 'Документы': 'паспорт РФ' },
    },
    features: ['до 5% кэшбэк', 'до 4% на остаток', 'бесплатное обслуживание*'],
    conditions: ['от 14 лет', 'паспорт РФ'],
    referralLink: 'https://www.gazprombank.ru/personal/cards/debit/',
    meta: { title: 'Дебетовая карта Газпромбанк', description: 'Дебетовая карта с кэшбэком до 5% и процентом на остаток' },
    version: { date: '2026-05-10', source: 'manual-entry', updatedBy: 'agent' },
    validFrom: '2026-05-10',
    status: 'active',
  },

  // МТС Банк
  {
    id: 'mts-bank-debit-cards-1',
    title: 'Дебетовая карта МТС Деньги',
    bankName: 'МТС Банк',
    type: 'debit-cards',
    featured: false,
    shortDescription: 'Дебетовая карта с кэшбэком до 5%',
    fullDescription: 'Дебетовая карта МТС Банка с кэшбэком до 5% в выбранных категориях. Бесплатное обслуживание. Процент на остаток до 5%.',
    parameters: {
      main: { 'Кэшбэк': 'до 5%', 'Процент на остаток': 'до 5%', 'Снятие наличных': 'бесплатно' },
      fees: { 'Обслуживание': 'бесплатно', 'Выпуск': 'бесплатно' },
      requirements: { 'Возраст': 'от 14 лет', 'Документы': 'паспорт РФ' },
    },
    features: ['до 5% кэшбэк', 'до 5% на остаток', 'бесплатное обслуживание'],
    conditions: ['от 14 лет', 'паспорт РФ'],
    referralLink: 'https://www.mtsbank.ru/retail/cards/debit/',
    meta: { title: 'Дебетовая карта МТС Деньги', description: 'Дебетовая карта с кэшбэком до 5% и процентом на остаток' },
    version: { date: '2026-05-10', source: 'manual-entry', updatedBy: 'agent' },
    validFrom: '2026-05-10',
    status: 'active',
  },
  {
    id: 'mts-bank-consumer-loans-1',
    title: 'Потребительский кредит',
    bankName: 'МТС Банк',
    type: 'consumer-loans',
    featured: false,
    shortDescription: 'Потребительский кредит от 12,9%',
    fullDescription: 'Потребительский кредит МТС Банка на любые цели. Ставка от 12,9%. Сумма до 5 000 000 ₽. Без залога и поручителей.',
    parameters: {
      main: { 'Процентная ставка': 'от 12,9%', 'Сумма кредита': 'до 5 000 000 ₽', 'Срок': 'до 5 лет' },
      fees: { 'Оформление': 'бесплатно', 'Досрочное погашение': 'бесплатно' },
      requirements: { 'Возраст': 'от 20 года', 'Стаж': 'от 3 месяцев', 'Документы': 'паспорт РФ' },
    },
    features: ['от 12,9%', 'до 5 000 000 ₽', 'до 5 лет'],
    conditions: ['от 20 года', 'стаж от 3 мес.'],
    referralLink: 'https://www.mtsbank.ru/retail/loans/',
    meta: { title: 'Потребительский кредит МТС Банк', description: 'Кредит наличными без залога и поручителей от 12,9%' },
    version: { date: '2026-05-10', source: 'manual-entry', updatedBy: 'agent' },
    validFrom: '2026-05-10',
    status: 'active',
  },
  {
    id: 'mts-bank-mortgage-1',
    title: 'Ипотека',
    bankName: 'МТС Банк',
    type: 'mortgage',
    featured: false,
    shortDescription: 'Ипотека на новостройки и вторичное жильё',
    fullDescription: 'Ипотечный кредит МТС Банка на покупку жилья. Ставка от 20,5%. Первоначальный взнос от 10%.',
    parameters: {
      main: { 'Процентная ставка': 'от 20,5%', 'Сумма кредита': 'до 60 000 000 ₽', 'Срок': 'до 30 лет', 'Первоначальный взнос': 'от 10%' },
      fees: { 'Оформление': 'бесплатно', 'Страхование': 'обязательно' },
      requirements: { 'Возраст': 'от 21 года', 'Стаж': 'от 6 месяцев', 'Документы': 'паспорт РФ, справка о доходах' },
    },
    features: ['от 20,5%', 'до 60 000 000 ₽', 'до 30 лет'],
    conditions: ['от 21 года', 'взнос от 10%'],
    referralLink: 'https://www.mtsbank.ru/retail/mortgage/',
    meta: { title: 'Ипотека МТС Банк', description: 'Ипотечный кредит на новостройки и вторичное жильё от 20,5%' },
    version: { date: '2026-05-10', source: 'manual-entry', updatedBy: 'agent' },
    validFrom: '2026-05-10',
    status: 'active',
  },
  {
    id: 'mts-bank-deposits-1',
    title: 'Вклад «Надёжный»',
    bankName: 'МТС Банк',
    type: 'deposits',
    featured: false,
    shortDescription: 'Вклад с повышенной ставкой',
    fullDescription: 'Срочный вклад МТС Банка с повышенной процентной ставкой. Пополнение разрешено. Частичное снятие без потери процентов.',
    parameters: {
      main: { 'Процентная ставка': 'до 17%', 'Минимальная сумма': 'от 10 000 ₽', 'Срок': 'от 1 месяца' },
      fees: { 'Пополнение': 'без ограничений', 'Частичное снятие': 'разрешено' },
      requirements: { 'Возраст': 'от 18 лет', 'Документы': 'паспорт РФ' },
    },
    features: ['до 17%', 'от 10 000 ₽', 'от 1 месяца'],
    conditions: ['от 18 лет', 'паспорт РФ'],
    referralLink: 'https://www.mtsbank.ru/retail/deposits/',
    meta: { title: 'Вклад МТС Банк «Надёжный»', description: 'Срочный вклад с повышенной ставкой до 17%' },
    version: { date: '2026-05-10', source: 'manual-entry', updatedBy: 'agent' },
    validFrom: '2026-05-10',
    status: 'active',
  },

  // Райффайзенбанк
  {
    id: 'raiffeisenbank-debit-cards-1',
    title: 'Дебетовая карта',
    bankName: 'Райффайзенбанк',
    type: 'debit-cards',
    featured: false,
    shortDescription: 'Дебетовая карта с кэшбэком до 5%',
    fullDescription: 'Дебетовая карта Райффайзенбанка с кэшбэком до 5% в выбранных категориях. Бесплатное обслуживание при покупках от 10 000 ₽/мес.',
    parameters: {
      main: { 'Кэшбэк': 'до 5%', 'Процент на остаток': 'до 4%', 'Снятие наличных': 'бесплатно' },
      fees: { 'Обслуживание': 'бесплатно*', 'Выпуск': 'бесплатно' },
      requirements: { 'Возраст': 'от 14 лет', 'Документы': 'паспорт РФ' },
    },
    features: ['до 5% кэшбэк', 'до 4% на остаток', 'бесплатное обслуживание*'],
    conditions: ['от 14 лет', 'паспорт РФ'],
    referralLink: 'https://www.raiffeisen.ru/retail/cards/debit/',
    meta: { title: 'Дебетовая карта Райффайзенбанк', description: 'Дебетовая карта с кэшбэком до 5% и процентом на остаток' },
    version: { date: '2026-05-10', source: 'manual-entry', updatedBy: 'agent' },
    validFrom: '2026-05-10',
    status: 'active',
  },
  {
    id: 'raiffeisenbank-mortgage-1',
    title: 'Ипотека',
    bankName: 'Райффайзенбанк',
    type: 'mortgage',
    featured: false,
    shortDescription: 'Ипотека на новостройки и вторичное жильё',
    fullDescription: 'Ипотечный кредит Райффайзенбанка на покупку жилья. Ставка от 20,9%. Первоначальный взнос от 10%.',
    parameters: {
      main: { 'Процентная ставка': 'от 20,9%', 'Сумма кредита': 'до 60 000 000 ₽', 'Срок': 'до 30 лет', 'Первоначальный взнос': 'от 10%' },
      fees: { 'Оформление': 'бесплатно', 'Страхование': 'обязательно' },
      requirements: { 'Возраст': 'от 21 года', 'Стаж': 'от 6 месяцев', 'Документы': 'паспорт РФ, справка о доходах' },
    },
    features: ['от 20,9%', 'до 60 000 000 ₽', 'до 30 лет'],
    conditions: ['от 21 года', 'взнос от 10%'],
    referralLink: 'https://www.raiffeisen.ru/retail/mortgage/',
    meta: { title: 'Ипотека Райффайзенбанк', description: 'Ипотечный кредит на новостройки и вторичное жильё от 20,9%' },
    version: { date: '2026-05-10', source: 'manual-entry', updatedBy: 'agent' },
    validFrom: '2026-05-10',
    status: 'active',
  },
];

async function main() {
  console.log('Manual Data Entry: запуск...\n');

  const data = JSON.parse(await fs.readFile(PRODUCTS_FILE, 'utf-8'));
  const existingKeys = new Set(data.products.map(p => p.bankName + '::' + p.type));

  let added = 0;
  let updated = 0;

  for (const product of NEW_PRODUCTS) {
    const key = product.bankName + '::' + product.type;

    if (existingKeys.has(key)) {
      // Обновляем существующий
      const existing = data.products.find(p => p.bankName + '::' + p.type === key);
      if (existing) {
        const idx = data.products.indexOf(existing);
        data.products[idx] = { ...existing, ...product, id: existing.id };
        updated++;
        console.log(`  Обновлён: ${key}`);
      }
    } else {
      data.products.push(product);
      existingKeys.add(key);
      added++;
      console.log(`  Добавлен: ${key} - ${product.title}`);
    }
  }

  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(data, null, 2));

  console.log(`\nРезультат:`);
  console.log(`  Добавлено: ${added}`);
  console.log(`  Обновлено: ${updated}`);
  console.log(`  Всего продуктов: ${data.products.length}`);
}

main().catch(err => {
  console.error('Ошибка:', err);
  process.exit(1);
});
