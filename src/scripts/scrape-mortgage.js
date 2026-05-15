#!/usr/bin/env node
/**
 * Скрипт для сбора актуальных данных по ипотеке с banki.ru
 * Парсит текстовые данные со страницы
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BANKS = [
  { name: 'Газпромбанк', url: 'https://www.banki.ru/products/hypothec/gazprombank/', type: 'mortgage' },
  { name: 'СберБанк', url: 'https://www.banki.ru/products/hypothec/sberbank/', type: 'mortgage' },
  { name: 'ВТБ', url: 'https://www.banki.ru/products/hypothec/vtb/', type: 'mortgage' },
  { name: 'Т-Банк', url: 'https://www.banki.ru/products/hypothec/tcs/', type: 'mortgage' },
  { name: 'ПСБ', url: 'https://www.banki.ru/products/hypothec/promsvyazbank/', type: 'mortgage' },
  { name: 'Альфа-Банк', url: 'https://www.banki.ru/products/hypothec/alfabank/', type: 'mortgage' },
  { name: 'МТС Банк', url: 'https://www.banki.ru/products/hypothec/mts-bank/', type: 'mortgage' },
  { name: 'Райффайзенбанк', url: 'https://www.banki.ru/products/hypothec/raiffeisenbank/', type: 'mortgage' },
  { name: 'Росбанк', url: 'https://www.banki.ru/products/hypothec/rosbank/', type: 'mortgage' },
  { name: 'Совкомбанк', url: 'https://www.banki.ru/products/hypothec/sovcombank/', type: 'mortgage' },
  { name: 'Открытие', url: 'https://www.banki.ru/products/hypothec/otkrytie/', type: 'mortgage' },
  { name: 'Россельхозбанк', url: 'https://www.banki.ru/products/hypothec/rshb/', type: 'mortgage' },
  { name: 'Трансабанк', url: 'https://www.banki.ru/products/hypothec/transbank/', type: 'mortgage' },
  { name: 'Транспортный кредитный банк', url: 'https://www.banki.ru/products/hypothec/tkb/', type: 'mortgage' },
  { name: 'Ситибанк', url: 'https://www.banki.ru/products/hypothec/citibank/', type: 'mortgage' },
];

function parseRate(text) {
  // Match patterns like "5.99%", "17.501%–25.584%", "от 9.5%", "от 20,5%"
  const match = text.match(/(?:от\s+)?([\d.,]+)(?:%[–-]([\d.,]+))?%/);
  if (match) {
    return {
      rate: match[1].replace(',', '.'),
      rateTo: match[2] ? match[2].replace(',', '.') : null,
      raw: match[0]
    };
  }
  return null;
}

function parseMoney(text) {
  // Match patterns like "от 10 738 ₽", "до 60 млн ₽", "до 60 000 000 ₽"
  const match = text.match(/(от|до)\s+([\d\s,.]+)\s*(млн|тыс)?\s*₽/i);
  if (match) {
    let amount = match[2].replace(/\s/g, '').replace(',', '.');
    if (match[3] === 'млн') amount = parseFloat(amount) * 1000000;
    if (match[3] === 'тыс') amount = parseFloat(amount) * 1000;
    return { direction: match[1], amount: amount, raw: match[0] };
  }
  return null;
}

function parseDownPayment(text) {
  // Match patterns like "от 20.01%", "от 15%", "не менее 20%"
  const match = text.match(/(?:от|не менее)\s+([\d.,]+)%/);
  if (match) {
    return match[1].replace(',', '.');
  }
  return null;
}

async function scrapeBank(page, bank) {
  console.log(`\n--- ${bank.name} ---`);
  
  try {
    await page.goto(bank.url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 5000));
    
    const data = await page.evaluate(() => {
      const text = document.body.innerText;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0 && l.length < 500);
      
      const programs = [];
      let currentProgram = null;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Detect program names (usually in quotes or after "программа")
        if (line.includes('«') && line.includes('»') && line.includes('%')) {
          if (currentProgram) programs.push(currentProgram);
          currentProgram = { name: line.match(/«([^»]+)»/)?.[1] || line, rates: [], conditions: [] };
        } else if (line.includes('ипотека') && line.includes('%') && !currentProgram) {
          currentProgram = { name: line, rates: [], conditions: [] };
        }
        
        if (currentProgram) {
          if (line.includes('%')) currentProgram.rates.push(line);
          if (line.includes('₽') || line.includes('взнос') || line.includes('срок')) {
            currentProgram.conditions.push(line);
          }
        }
      }
      if (currentProgram) programs.push(currentProgram);
      
      // Also extract summary rates
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
      
      // Extract offer data from structured sections
      const offers = [];
      let inOffer = false;
      let currentOffer = {};
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Start of offer (bank name + program name)
        if (line.includes('ипотека') || line.includes('Ипотека')) {
          if (line.includes('Газпромбанк') || line.includes('СберБанк') || line.includes('ВТБ') || 
              line.includes('Т-Банк') || line.includes('ПСБ') || line.includes('Альфа-Банк') ||
              line.includes('МТС Банк') || line.includes('Райффайзенбанк') || line.includes('Росбанк') ||
              line.includes('Совкомбанк') || line.includes('Открытие') || line.includes('Россельхозбанк') ||
              line.includes('Трансабанк') || line.includes('Ситибанк')) {
            if (Object.keys(currentOffer).length > 0) {
              offers.push(currentOffer);
            }
            currentOffer = { program: line };
          }
        }
        
        if (line.includes('Ставка') && i + 1 < lines.length && lines[i+1].includes('%')) {
          currentOffer.rate = lines[i+1];
        }
        if (line.includes('ПСК') && i + 1 < lines.length && lines[i+1].includes('%')) {
          currentOffer.psk = lines[i+1];
        }
        if (line.includes('Платёж') && i + 1 < lines.length && lines[i+1].includes('₽')) {
          currentOffer.payment = lines[i+1];
        }
        if (line.includes('Первоначальный взнос') && i + 1 < lines.length && lines[i+1].includes('%')) {
          currentOffer.downPayment = lines[i+1];
        }
      }
      if (Object.keys(currentOffer).length > 0) offers.push(currentOffer);
      
      return { programs, summaryRates, offers, rawLines: lines.slice(0, 100) };
    });
    
    console.log(`  Summary rates:`, data.summaryRates.map(r => `${r.label}: ${r.value}`).join(', '));
    console.log(`  Programs found: ${data.programs.length}`);
    data.programs.forEach(p => console.log(`    - ${p.name}: ${p.rates.join(', ')}`));
    console.log(`  Structured offers: ${data.offers.length}`);
    data.offers.forEach(o => console.log(`    - ${o.program}: rate=${o.rate}, psk=${o.psk}, payment=${o.payment}, down=${o.downPayment}`));
    
    return { bank: bank.name, ...data };
    
  } catch (err) {
    console.error(`  Error: ${err.message}`);
    return { bank: bank.name, error: err.message };
  }
}

async function main() {
  console.log('Starting mortgage data collection from banki.ru...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  const results = [];
  
  for (const bank of BANKS) {
    const data = await scrapeBank(page, bank);
    results.push(data);
    await new Promise(r => setTimeout(r, 2000));
  }
  
  await browser.close();
  
  const outputPath = path.join(__dirname, '..', 'data', 'scraping-results-mortgage.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\nResults saved to ${outputPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
