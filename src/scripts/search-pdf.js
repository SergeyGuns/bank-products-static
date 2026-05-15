#!/usr/bin/env node
/**
 * Поиск PDF договоров через DuckDuckGo
 * Ищет PDF с условиями продуктов банков
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const QUERIES = [
    'Газпромбанк ипотека условия договор pdf',
    'СберБанк ипотека тарифы pdf',
    'ВТБ ипотека условия кредитования pdf',
    'Альфа-Банк ипотека тарифы pdf',
    'Т-Банк ипотека условия pdf',
    'ПСБ ипотека тарифы pdf',
    'Газпромбанк кредитная карта тарифы pdf',
    'СберБанк кредитная карта условия pdf',
    'ВТБ кредитная карта тарифы pdf',
    'Альфа-Банк кредитная карта условия pdf',
    'Т-Банк кредитная карта тарифы pdf',
    'ПСБ кредитная карта условия pdf',
    'Газпромбанк вклад условия pdf',
    'СберБанк вклад тарифы pdf',
    'ВТБ вклад условия pdf',
];

async function searchPDFs(page, query) {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' filetype:pdf')}`;
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2000));
        
        const results = await page.evaluate(() => {
            const items = [];
            document.querySelectorAll('.result').forEach(el => {
                const link = el.querySelector('a.result__a');
                const snippet = el.querySelector('.result__snippet');
                if (link) {
                    items.push({
                        url: link.href,
                        title: link.textContent.trim(),
                        snippet: snippet ? snippet.textContent.trim().substring(0, 200) : ''
                    });
                }
            });
            return items;
        });
        
        return results.filter(r => r.url.includes('.pdf') || r.url.includes('pdf'));
    } catch (err) {
        return [];
    }
}

async function main() {
    console.log('Searching for PDF documents via DuckDuckGo...');
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    const allResults = {};
    
    for (const query of QUERIES) {
        console.log(`\nQuery: ${query}`);
        const pdfs = await searchPDFs(page, query);
        if (pdfs.length > 0) {
            allResults[query] = pdfs.slice(0, 3);
            pdfs.slice(0, 3).forEach(p => console.log(`  ${p.title}: ${p.url.substring(0, 100)}`));
        } else {
            console.log('  No PDFs found');
        }
        await new Promise(r => setTimeout(r, 2000));
    }
    
    await browser.close();
    
    const outputPath = path.join(__dirname, '..', 'data', 'pdf-search-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2), 'utf-8');
    
    const total = Object.values(allResults).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`\nTotal PDFs found: ${total}`);
    console.log(`Results saved to ${outputPath}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
