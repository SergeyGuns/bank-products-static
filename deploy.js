#!/usr/bin/env node
/**
 * Деплой на GitHub Pages с кастомным доменом bank-select.ru
 * Использует git worktree для публикации в ветку gh-pages
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const cname = 'bank-select.ru';

try {
    // Проверяем что dist существует
    if (!fs.existsSync(distDir)) {
        console.error('dist/ не найден. Сначала запустите npm run build');
        process.exit(1);
    }

    // Копируем CNAME в dist
    fs.writeFileSync(path.join(distDir, 'CNAME'), cname);
    console.log(`CNAME создан: ${cname}`);

    // Создаём .nojekyll
    fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
    console.log('.nojekyll создан');

    // Инициализируем git worktree для gh-pages
    try {
        execSync('git worktree add gh-pages-temp gh-pages', { stdio: 'pipe' });
    } catch (e) {
        // Ветка может не существовать — создаём
        execSync('git checkout --orphan gh-pages', { stdio: 'pipe' });
        execSync('git rm -rf .', { stdio: 'pipe' });
        execSync('git commit --allow-empty -m "init gh-pages"', { stdio: 'pipe' });
        execSync('git checkout master', { stdio: 'pipe' });
        execSync('git worktree add gh-pages-temp gh-pages', { stdio: 'pipe' });
    }

    // Очищаем старое содержимое
    execSync('rm -rf gh-pages-temp/*', { stdio: 'pipe' });

    // Копируем dist в worktree
    execSync('cp -r dist/* gh-pages-temp/', { stdio: 'pipe' });

    // Коммитим и пушим
    execSync('cd gh-pages-temp && git add -A && git commit -m "Deploy: ' + new Date().toISOString() + '"', { stdio: 'pipe' });
    execSync('cd gh-pages-temp && git push origin gh-pages --force', { stdio: 'pipe' });

    // Очищаем worktree
    execSync('git worktree remove gh-pages-temp', { stdio: 'pipe' });

    console.log('✅ Деплой завершён: https://bank-select.ru');
} catch (error) {
    console.error('❌ Ошибка деплоя:', error.message);
    process.exit(1);
}
