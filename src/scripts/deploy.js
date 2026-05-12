#!/usr/bin/env node

/**
 * Deploy to gh-pages branch (clean deploy)
 * Полностью заменяет содержимое gh-pages на dist/ + CNAME
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '../..');
const DIST_DIR = path.join(BASE_DIR, 'dist');
const DEPLOY_DIR = path.join(BASE_DIR, '.deploy');

// 1. Сборка
console.log('Step 1: Building...');
execSync('npm run build', { cwd: BASE_DIR, stdio: 'inherit' });

// 2. Клонируем текущую gh-pages ветку (чтобы сохранить историю)
console.log('Step 2: Cloning gh-pages...');
if (fs.existsSync(DEPLOY_DIR)) {
    fs.rmSync(DEPLOY_DIR, { recursive: true });
}

execSync(`git clone --branch gh-pages --single-branch git@github.com:SergeyGuns/bank-products-static.git ${DEPLOY_DIR}`, { stdio: 'inherit' });

// 3. Удаляем ВСЕ старые файлы (кроме .git)
console.log('Step 3: Cleaning old files...');
const items = fs.readdirSync(DEPLOY_DIR);
for (const item of items) {
    if (item === '.git') continue;
    const itemPath = path.join(DEPLOY_DIR, item);
    fs.rmSync(itemPath, { recursive: true });
}

// 4. Копируем dist/
console.log('Step 4: Copying dist/...');
fs.cpSync(DIST_DIR, DEPLOY_DIR, { recursive: true });

// 5. Создаём CNAME
console.log('Step 5: Creating CNAME...');
fs.writeFileSync(path.join(DEPLOY_DIR, 'CNAME'), 'bank-select.ru');

// 6. Коммитим и пушим
console.log('Step 6: Pushing...');
execSync(`
    cd ${DEPLOY_DIR} &&
    git add -A &&
    git commit -m "Deploy: ${new Date().toISOString()}" &&
    git push origin gh-pages
`, { stdio: 'inherit' });

// 7. Очистка
fs.rmSync(DEPLOY_DIR, { recursive: true });

console.log('Deployed to gh-pages!');
