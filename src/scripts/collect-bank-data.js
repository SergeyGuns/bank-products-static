#!/usr/bin/env node
/**
 * Скрипт для обновления данных о банковских продуктах.
 * Использует браузер для сбора данных с banki.ru.
 */

const MORTGAGE_URLS = {
  "Газпромбанк": "https://www.banki.ru/products/hypothec/gazprombank/",
  "СберБанк": "https://www.banki.ru/products/hypothec/sberbank/",
  "ВТБ": "https://www.banki.ru/products/hypothec/vtb/",
  "Т-Банк": "https://www.banki.ru/products/hypothec/tcs/",
  "ПСБ": "https://www.banki.ru/products/hypothec/promsvyazbank/",
  "Альфа-Банк": "https://www.banki.ru/products/hypothec/alfabank/",
  "МТС Банк": "https://www.banki.ru/products/hypothec/mts-bank/",
  "Райффайзенбанк": "https://www.banki.ru/products/hypothec/raiffeisenbank/",
  "Росбанк": "https://www.banki.ru/products/hypothec/rosbank/",
  "Совкомбанк": "https://www.banki.ru/products/hypothec/sovcombank/",
  "Открытие": "https://www.banki.ru/products/hypothec/otkrytie/",
  "Россельхозбанк": "https://www.banki.ru/products/hypothec/rshb/",
  "Трансабанк": "https://www.banki.ru/products/hypothec/transbank/",
  "Транспортный кредитный банк": "https://www.banki.ru/products/hypothec/tkb/",
  "Ситибанк": "https://www.banki.ru/products/hypothec/citibank/",
};

const CONSUMER_LOAN_URLS = {
  "СберБанк": "https://www.banki.ru/products/credit/sberbank/",
  "ВТБ": "https://www.banki.ru/products/credit/vtb/",
  "ПСБ": "https://www.banki.ru/products/credit/promsvyazbank/",
  "Т-Банк": "https://www.banki.ru/products/credit/tcs/",
  "Альфа-Банк": "https://www.banki.ru/products/credit/alfabank/",
  "МТС Банк": "https://www.banki.ru/products/credit/mts-bank/",
  "Росбанк": "https://www.banki.ru/products/credit/rosbank/",
  "Ситибанк": "https://www.banki.ru/products/credit/citibank/",
  "Трансабанк": "https://www.banki.ru/products/credit/transbank/",
  "Транспортный кредитный банк": "https://www.banki.ru/products/credit/tkb/",
  "Совкомбанк": "https://www.banki.ru/products/credit/sovcombank/",
  "Открытие": "https://www.banki.ru/products/credit/otkrytie/",
  "Россельхозбанк": "https://www.banki.ru/products/credit/rshb/",
  "Газпромбанк": "https://www.banki.ru/products/credit/gazprombank/",
  "Райффайзенбанк": "https://www.banki.ru/products/credit/raiffeisenbank/",
};

console.log("Bank data collection script");
console.log(`Mortgage banks: ${Object.keys(MORTGAGE_URLS).length}`);
console.log(`Consumer loan banks: ${Object.keys(CONSUMER_LOAN_URLS).length}`);
