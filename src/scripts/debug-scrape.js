#!/usr/bin/env node
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  await page.goto('https://www.banki.ru/products/hypothec/gazprombank/', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));
  
  // Get page structure
  const info = await page.evaluate(() => {
    const result = { bodyLength: document.body.innerText.length, classes: new Set() };
    
    // Find all elements with class containing "offer" or "card" or "product"
    document.querySelectorAll('[class]').forEach(el => {
      const cls = el.className;
      if (typeof cls === 'string' && (cls.includes('offer') || cls.includes('card') || cls.includes('product') || cls.includes('item'))) {
        result.classes.add(cls.substring(0, 100));
      }
    });
    
    // Get text around percentages
    const text = document.body.innerText;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0 && l.length < 300);
    const rateLines = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('%')) {
        rateLines.push(lines.slice(Math.max(0, i-1), Math.min(lines.length, i+2)).join(' | '));
      }
    }
    result.rateLines = rateLines.slice(0, 15);
    
    return {
      bodyLength: result.bodyLength,
      classes: [...result.classes].slice(0, 30),
      rateLines: result.rateLines
    };
  });
  
  console.log(`Body length: ${info.bodyLength}`);
  console.log('\nClasses with offer/card/product/item:');
  info.classes.forEach(c => console.log(`  ${c}`));
  console.log('\nLines with %:');
  info.rateLines.forEach(l => console.log(`  ${l}`));
  
  await browser.close();
})();
