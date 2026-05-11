#!/usr/bin/env node

/**
 * Image Downloader — скачивание логотипов банков
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../static/img/banks');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Логотипы банков (официальные URL)
const BANK_LOGOS = {
  'СберБанк': 'https://www.sberbank.ru/common/img/sberbank-logo.png',
  'Т-Банк': 'https://static.tinkoff.ru/dist/portal-new/assets/logos/tinkoff-logo.svg',
  'ВТБ': 'https://www.vtb.ru/content/dam/vtb2csu/logos/vtb-logo.png',
  'Газпромбанк': 'https://www.gazprombank.ru/content/dam/gazprombank/ru/logos/gazprombank-logo.png',
  'Альфа-Банк': 'https://alfabank.ru/_/logo-alfa.svg',
  'ПСБ': 'https://psb.ru/content/dam/psb/logos/psb-logo.png',
  'Райффайзенбанк': 'https://www.raiffeisen.ru/_layouts/15/images/RaiffeisenBank/logo.svg',
  'МТС Банк': 'https://www.mtsbank.ru/content/dam/mtsbank/logos/mtsbank-logo.png',
  'Росбанк': 'https://www.rosbank.ru/content/dam/rosbank/logos/rosbank-logo.png',
  'Совкомбанк': 'https://sovcombank.ru/content/dam/sovcombank/logos/sovcombank-logo.png',
  'Открытие': 'https://www.open.ru/content/dam/open/logos/open-logo.png',
  'Россельхозбанк': 'https://www.rshb.ru/content/dam/rshb/logos/rshb-logo.png',
  'Ситибанк': 'https://www.citibank.ru/russia/main/rus/images/citibank-logo.png',
  'Трансабанк': 'https://www.transbank.ru/images/logo.png',
  'Транспортный кредитный банк': 'https://www.tkb.ru/images/logo.png',
};

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        downloadFile(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error('HTTP ' + res.statusCode));
        return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Скачивание логотипов банков...\n');
  
  let success = 0;
  let failed = 0;
  
  for (const [bank, url] of Object.entries(BANK_LOGOS)) {
    const ext = url.endsWith('.svg') ? '.svg' : '.png';
    const filename = bank.toLowerCase().replace(/\s+/g, '-').replace(/[^a-zа-яё-]/g, '') + ext;
    const dest = path.join(OUTPUT_DIR, filename);
    
    try {
      await downloadFile(url, dest);
      console.log('✓ ' + bank + ' -> ' + filename);
      success++;
    } catch (err) {
      console.log('✗ ' + bank + ': ' + err.message);
      failed++;
    }
    
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('\nРезультат:');
  console.log('  Скачано: ' + success);
  console.log('  Ошибок: ' + failed);
  console.log('  Папка: ' + OUTPUT_DIR);
}

main().catch(err => {
  console.error('Ошибка:', err);
  process.exit(1);
});
