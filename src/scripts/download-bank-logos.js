#!/usr/bin/env node

/**
 * Script to download real bank logos from Wikimedia Commons
 * and create high-quality SVG placeholders for banks without available logos
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const LOGOS_DIR = '/tmp/bank-products-static/src/static/img/banks';

// Bank slug -> Wikimedia file URL mapping
const WIKIMEDIA_LOGOS = {
  'alfa-bank': 'https://upload.wikimedia.org/wikipedia/commons/7/77/Alfa-Bank.svg',
  'vtb': 'https://upload.wikimedia.org/wikipedia/commons/3/34/Vtb-logo.png',
  'mts-bank': 'https://upload.wikimedia.org/wikipedia/commons/3/34/New-logo-mts-bank.png',
  'otkritie': 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Logobank-upd.png',
  'psb': 'https://upload.wikimedia.org/wikipedia/commons/7/78/Logo-promsvyazbank_small.png',
  'rosbank': 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Rosbank_logo_en.jpg',
  'sberbank': 'https://upload.wikimedia.org/wikipedia/commons/a/af/Sberbank_logo_2020_en.png',
  'sovcombank': 'https://upload.wikimedia.org/wikipedia/commons/6/66/Sovkom_logo.png',
  't-bank': 'https://upload.wikimedia.org/wikipedia/commons/8/82/T-Bank_Mobile_logo.png',
};

// Banks without Wikimedia logos — will get SVG placeholders
const PLACEHOLDER_BANKS = {
  'gazprombank': { name: 'Газпромбанк', color: '#0039A6', initials: 'ГПБ' },
  'raiffeisen': { name: 'Райффайзенбанк', color: '#000000', initials: 'РБ' },
  'rosselkhozbank': { name: 'Россельхозбанк', color: '#006838', initials: 'РСХБ' },
  'citibank': { name: 'Ситибанк', color: '#DA020E', initials: 'CITI' },
  'transbank': { name: 'Трансбанк', color: '#005EAB', initials: 'ТРБ' },
  'transport-credit-bank': { name: 'ТКБ', color: '#005EAB', initials: 'ТКБ' },
};

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

function createPlaceholderSVG(bank, info) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="48" viewBox="0 0 160 48">
  <rect width="160" height="48" rx="6" fill="${info.color}" opacity="0.08"/>
  <rect x="1" y="1" width="158" height="46" rx="5" fill="none" stroke="${info.color}" stroke-width="1.5" opacity="0.25"/>
  <text x="80" y="30" font-family="Roboto, Arial, sans-serif" font-size="16" font-weight="600" fill="${info.color}" text-anchor="middle" letter-spacing="1">${info.initials}</text>
</svg>`;
}

async function main() {
  // Ensure directory exists
  if (!fs.existsSync(LOGOS_DIR)) {
    fs.mkdirSync(LOGOS_DIR, { recursive: true });
  }

  // Clean old files
  fs.readdirSync(LOGOS_DIR).forEach(f => {
    fs.unlinkSync(path.join(LOGOS_DIR, f));
  });

  let downloaded = 0;
  let placeholders = 0;

  // Download Wikimedia logos
  for (const [bank, url] of Object.entries(WIKIMEDIA_LOGOS)) {
    const ext = url.match(/\.(svg|png|jpg)/)?.[1] || 'svg';
    const dest = path.join(LOGOS_DIR, `${bank}.${ext}`);
    try {
      await downloadFile(url, dest);
      console.log(`✓ Downloaded: ${bank}.${ext}`);
      downloaded++;
    } catch (err) {
      console.log(`✗ Failed: ${bank} — ${err.message}`);
    }
  }

  // Create SVG placeholders for remaining banks
  for (const [bank, info] of Object.entries(PLACEHOLDER_BANKS)) {
    const dest = path.join(LOGOS_DIR, `${bank}.svg`);
    fs.writeFileSync(dest, createPlaceholderSVG(bank, info));
    console.log(`○ Placeholder: ${bank}.svg`);
    placeholders++;
  }

  console.log(`\nDone: ${downloaded} downloaded, ${placeholders} placeholders`);
}

main().catch(console.error);
