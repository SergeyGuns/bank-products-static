#!/usr/bin/env node
/**
 * Сбор данных по потребительским кредитам с banki.ru
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BANKS = [
  { name: 'Газпромбанк', url: 'https://www.banki.ru/products/credit/gazprombank/' },
  { name: 'СберБанк', url: 'https://www.banki.ru/products/credit/sberbank/' },
  { name: 'ВТБ', url: 'https://www.banki.ru/products/credit/vtb/' },
  { name: 'Т-Банк', url: 'https://www.banki.ru/products/credit/tcs/' },
  { name: 'ПСБ', url: 'https://www.banki.ru/products/credit/promsvyazbank/' },
  { name: 'Альфа-Банк', url: 'https://www.banki.ru/products/credit/alfabank/' },
  { name: 'МТС Банк', url: 'https://www.banki.ru/products/credit/mts-bank/' },
  { name: 'Райффайзенбанк', url: 'https://www.banki.ru/products/credit/raiffeisenbank/' },
  { name: 'Росбанк', url: 'https://www.banki.ru/products/credit/rosbank/' },
  { name: 'Совкомбанк', url: 'https://www.banki.ru/products/credit/sovcombank/' },
  { name: 'Открытие', url: 'https://www.banki.ru/products/credit/otkrytie/' },
  { name: 'Россельхозбанк', url: 'https://www.banki.ru/products/credit/rshb/' },
  { name: 'Трансабанк', url: 'https://www.banki.ru/products/credit/transbank/' },
  { name: 'Транспортный кредитный банк', url: 'https://www.banki.ru/products/credit/tkb/' },
  { name: 'Ситибанк', url: 'https://www.banki.ru/products/credit/citibank/' },
];

async function scrapeBank(page, bank) {
  console.log(`\n--- ${bank.name} ---`);
  try {
    await page.goto(bank.url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 5000));
    
    const data = await page.evaluate(() => {
      const text = document.body.innerText;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0 && l.length < 500);
      
      const summaryRates = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('Средняя') && lines[i+1] && lines[i+1].includes('%')) {
          summaryRates.push({ label: 'Средняя', value: lines[i+1] });
        }
        if (lines[i].includes('Минимальная') && lines[i+1] && lines[i+1].includes('%')) {
          summaryRates.push({ label: 'Минимальная', value: lines[i+1] });
        }
        if (lines[i].includes('Максимальная') && lines[i+1] && lines[i+1].includes('%')) {
          summaryRates.push({ label: 'Максимальная', value: lines[i+1] });
        }
      }
      
      const offers = [];
      let currentOffer = {};
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('кредит') || line.includes('Кредит')) {
          if (Object.keys(currentOffer).length > 0) offers.push(currentOffer);
          currentOffer = { program: line };
        }
        if (line.includes('Ставка') && i + 1 < lines.length && lines[i+1].includes('%')) {
          currentOffer.rate = lines[i+1];
        }
        if (line.includes('ПСК') && i + 1 < lines.length && lines[i+1].includes('%')) {
          currentOffer.psk = lines[i+1];
        }
        if (line.includes('Сумма') && i + 1 < lines.length && (lines[i+1].includes('₽') || lines[i+1].includes('млн'))) {
          currentOffer.amount = lines[i+1];
        }
        if (line.includes('Срок') && i + 1 < lines.length) {
          currentOffer.term = lines[i+1];
        }
      }
      if (Object.keys(currentOffer).length > 0) offers.push(currentOffer);
      
      return { summaryRates, offers };
    });
    
    console.log(`  Summary:`, data.summaryRates.map(r => `${r.label}: ${r.value}`).join(', '));
    data.offers.forEach(o => console.log(`  Offer: ${o.program} | rate=${o.rate} | psk=${o.psk} | amount=${o.amount} | term=${o.term}`));
    
    return { bank: bank.name, ...data };
  } catch (err) {
    console.error(`  Error: ${err.message}`);
    return { bank: bank.name, error: err.message };
  }
}

async function main() {
  console.log('Starting consumer loan data collection...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  const results = [];
  for (const bank of BANKS) {
    const data = await scrapeBank(page, bank);
    results.push(data);
    await new Promise(r => setTimeout(r, 2000));
  }
  
  await browser.close();
  
  const outputPath = path.join(__dirname, '..', 'data', 'scraping-results-consumer-loans.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\nResults saved to ${outputPath}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
