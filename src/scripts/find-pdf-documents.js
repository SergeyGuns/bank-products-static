#!/usr/bin/env node
/**
 * Поиск PDF договоров для банковских продуктов
 * Ищет PDF на официальных сайтах банков
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Banks and their document pages
const BANKS_DOCS = [
  { name: 'Газпромбанк', docUrl: 'https://www.gazprombank.ru/personal/take_credit/mortgage/documents/' },
  { name: 'СберБанк', docUrl: 'https://www.sberbank.ru/ru/person/credits/home/documents' },
  { name: 'ВТБ', docUrl: 'https://www.vtb.ru/personal/ipoteka/documents/' },
  { name: 'Альфа-Банк', docUrl: 'https://alfabank.ru/get-money/mortgage/documents/' },
  { name: 'Т-Банк', docUrl: 'https://www.tbank.ru/personal/mortgage/documents/' },
  { name: 'ПСБ', docUrl: 'https://www.psbank.ru/personal/mortgage/documents' },
  { name: 'МТС Банк', docUrl: 'https://www.mtsbank.ru/personal/ipoteka/documents/' },
  { name: 'Райффайзенбанк', docUrl: 'https://www.raiffeisen.ru/retail/mortgage/documents/' },
  { name: 'Росбанк', docUrl: 'https://www.rosbank.ru/personal/ipoteka/documents/' },
  { name: 'Совкомбанк', docUrl: 'https://sovcombank.ru/personal/ipoteka/documents/' },
  { name: 'Открытие', docUrl: 'https://www.open.ru/personal/mortgage/documents/' },
  { name: 'Россельхозбанк', docUrl: 'https://www.rshb.ru/personal/ipoteka/documents/' },
];

async function findPDFs(page, bank) {
  console.log(`\n--- ${bank.name} ---`);
  try {
    await page.goto(bank.docUrl, { waitUntil: 'networkidle2', timeout: 20000 });
    await new Promise(r => setTimeout(r, 3000));
    
    const pdfs = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('a[href]').forEach(a => {
        const href = a.href || '';
        const text = a.textContent.trim();
        if (href.endsWith('.pdf') || href.includes('.pdf?')) {
          results.push({ url: href, text: text.substring(0, 100) });
        }
      });
      return results;
    });
    
    console.log(`  Found ${pdfs.length} PDFs`);
    pdfs.forEach(p => console.log(`    ${p.text}: ${p.url.substring(0, 120)}`));
    
    return { bank: bank.name, url: bank.docUrl, pdfs };
  } catch (err) {
    console.error(`  Error: ${err.message}`);
    return { bank: bank.name, url: bank.docUrl, error: err.message, pdfs: [] };
  }
}

async function main() {
  console.log('Searching for PDF documents...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  const results = [];
  for (const bank of BANKS_DOCS) {
    const data = await findPDFs(page, bank);
    results.push(data);
    await new Promise(r => setTimeout(r, 1500));
  }
  
  await browser.close();
  
  const outputPath = path.join(__dirname, '..', 'data', 'pdf-documents.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\nResults saved to ${outputPath}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
