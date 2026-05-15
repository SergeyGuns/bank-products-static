#!/usr/bin/env node
/**
 * Поиск и парсинг PDF договоров банковских продуктов
 * Ищет PDF на сайтах банков, скачивает и извлекает текст
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Банки и их страницы с документами/тарифами
const BANKS = [
    { name: 'Газпромбанк', url: 'https://www.gazprombank.ru/personal/take_credit/mortgage/documents/' },
    { name: 'СберБанк', url: 'https://www.sberbank.ru/ru/person/credits/home/documents' },
    { name: 'ВТБ', url: 'https://www.vtb.ru/personal/ipoteka/documents/' },
    { name: 'Альфа-Банк', url: 'https://alfabank.ru/get-money/mortgage/documents/' },
    { name: 'Т-Банк', url: 'https://www.tbank.ru/personal/mortgage/documents/' },
    { name: 'ПСБ', url: 'https://www.psbank.ru/personal/mortgage/documents' },
    { name: 'МТС Банк', url: 'https://www.mtsbank.ru/personal/ipoteka/documents/' },
    { name: 'Райффайзенбанк', url: 'https://www.raiffeisen.ru/retail/mortgage/documents/' },
    { name: 'Росбанк', url: 'https://www.rosbank.ru/personal/ipoteka/documents/' },
    { name: 'Совкомбанк', url: 'https://sovcombank.ru/personal/ipoteka/documents/' },
    { name: 'Открытие', url: 'https://www.open.ru/personal/mortgage/documents/' },
    { name: 'Россельхозбанк', url: 'https://www.rshb.ru/personal/ipoteka/documents/' },
];

async function findPDFs(page, bank) {
    console.log(`\n--- ${bank.name} ---`);
    try {
        await page.goto(bank.url, { waitUntil: 'networkidle2', timeout: 20000 });
        await new Promise(r => setTimeout(r, 3000));
        
        const pdfs = await page.evaluate(() => {
            const results = [];
            document.querySelectorAll('a[href]').forEach(a => {
                const href = a.href || '';
                const text = a.textContent.trim();
                if (href.endsWith('.pdf') || href.includes('.pdf?') || href.includes('.pdf#')) {
                    results.push({ url: href, text: text.substring(0, 100) });
                }
            });
            return results;
        });
        
        console.log(`  Found ${pdfs.length} PDFs`);
        pdfs.slice(0, 5).forEach(p => console.log(`    ${p.text}: ${p.url.substring(0, 100)}`));
        
        return { bank: bank.name, url: bank.url, pdfs };
    } catch (err) {
        console.error(`  Error: ${err.message}`);
        return { bank: bank.name, url: bank.url, error: err.message, pdfs: [] };
    }
}

async function main() {
    console.log('Searching for PDF documents on bank websites...');
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    const results = [];
    for (const bank of BANKS) {
        const data = await findPDFs(page, bank);
        results.push(data);
        await new Promise(r => setTimeout(r, 1500));
    }
    
    await browser.close();
    
    const outputPath = path.join(__dirname, '..', 'data', 'pdf-documents.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`\nResults saved to ${outputPath}`);
    
    // Summary
    const totalPdfs = results.reduce((sum, r) => sum + (r.pdfs ? r.pdfs.length : 0), 0);
    console.log(`Total PDFs found: ${totalPdfs}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
