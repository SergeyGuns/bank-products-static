#!/usr/bin/env node
/**
 * Скачивание и парсинг PDF документов банков
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// PDF для скачивания (прямые ссылки)
const PDFS = [
    {
        bank: 'Альфа-Банк',
        type: 'mortgage',
        url: 'https://alfabank.servicecdn.ru/site-upload/c8/2b/9202/mortgage_tariffs.pdf',
        file: 'alfa-mortgage-tariffs.pdf'
    },
    {
        bank: 'ВТБ',
        type: 'deposits',
        url: 'https://vtbrussia.ru/media-files/vtb.ru/sitepages/tariffs/deposit_rules.pdf',
        file: 'vtb-deposit-rules.pdf'
    },
];

function downloadPDF(url, dest) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                return downloadPDF(res.headers.location, dest).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`HTTP ${res.statusCode}`));
            }
            const file = fs.createWriteStream(dest);
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(dest);
            });
        }).on('error', reject);
    });
}

async function main() {
    const outDir = path.join(__dirname, '..', 'data', 'pdfs');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    
    for (const pdf of PDFS) {
        const dest = path.join(outDir, pdf.file);
        console.log(`\nDownloading: ${pdf.bank} ${pdf.type}`);
        console.log(`  URL: ${pdf.url}`);
        try {
            await downloadPDF(pdf.url, dest);
            const size = fs.statSync(dest).size;
            console.log(`  Saved: ${dest} (${size} bytes)`);
        } catch (err) {
            console.error(`  Error: ${err.message}`);
        }
    }
    
    console.log('\nDone.');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
