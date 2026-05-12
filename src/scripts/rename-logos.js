#!/usr/bin/env node
const fs = require('fs');

// Mapping кириллических названий в латиницу
const bankSlugMap = {
    'альфа-банк': 'alfa-bank',
    'втб': 'vtb',
    'газпромбанк': 'gazprombank',
    'дтс-банк': 'mts-bank',
    'мтс-банк': 'mts-bank',
    'открытие': 'otkrytie',
    'псб': 'psb',
    'райффайзенбанк': 'raiffeisen',
    'росбанк': 'rosbank',
    'россельхозбанк': 'rosselkhozbank',
    'сбербанк': 'sberbank',
    'ситибанк': 'citibank',
    'совкомбанк': 'sovcombank',
    'т-банк': 't-bank',
    'трансабанк': 'transbank',
    'транспортный-кредитный-банк': 'transport-credit-bank',
};

const logosDir = 'src/static/img/banks';
const files = fs.readdirSync(logosDir);

files.forEach(file => {
    if (!file.endsWith('.svg')) return;
    
    // Декодируем имя файла и конвертируем в латиницу
    const name = file.replace('.svg', '').toLowerCase();
    const latinName = bankSlugMap[name];
    
    if (latinName && latinName !== name) {
        const oldPath = `${logosDir}/${file}`;
        const newPath = `${logosDir}/${latinName}.svg`;
        
        if (!fs.existsSync(newPath)) {
            fs.copyFileSync(oldPath, newPath);
        }
        fs.unlinkSync(oldPath);
        console.log(`Renamed: ${file} -> ${latinName}.svg`);
    }
});
