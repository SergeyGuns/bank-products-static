#!/usr/bin/env node
/**
 * Деплой на GitHub Pages с кастомным доменом bank-select.ru
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const cname = 'bank-select.ru';
const worktreeDir = path.join(__dirname, '..', 'gh-pages-deploy');

function run(cmd) {
    return execSync(cmd, { stdio: 'pipe' }).toString().trim();
}

function rmrf(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

try {
    if (!fs.existsSync(distDir)) {
        console.error('dist/ не найден. Сначала запустите npm run build');
        process.exit(1);
    }

    // CNAME и .nojekyll
    fs.writeFileSync(path.join(distDir, 'CNAME'), cname);
    fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
    console.log('CNAME создан');

    // Удаляем старый worktree из git
    try { run(`git worktree remove ${worktreeDir} --force`); } catch(e) {}
    try { run('git worktree prune'); } catch(e) {}

    // Удаляем директорию если осталась
    rmrf(worktreeDir);

    // Проверяем существует ли ветка gh-pages
    let branchExists = false;
    try {
        run('git rev-parse --verify gh-pages');
        branchExists = true;
    } catch(e) {}

    if (!branchExists) {
        run('git checkout --orphan gh-pages');
        run('git rm -rf .');
        run('git commit --allow-empty -m "init gh-pages"');
        run('git checkout master');
    }

    // Создаём worktree
    run(`git worktree add ${worktreeDir} gh-pages`);

    // Очищаем worktree (кроме .git)
    for (const f of fs.readdirSync(worktreeDir)) {
        if (f !== '.git') {
            rmrf(path.join(worktreeDir, f));
        }
    }

    // Копируем dist
    for (const f of fs.readdirSync(distDir)) {
        const src = path.join(distDir, f);
        const dst = path.join(worktreeDir, f);
        if (fs.statSync(src).isDirectory()) {
            fs.cpSync(src, dst, { recursive: true });
        } else {
            fs.copyFileSync(src, dst);
        }
    }

    // Коммитим и пушим
    const msg = `Deploy: ${new Date().toISOString()}`;
    try {
        run(`cd ${worktreeDir} && git add -A && git commit -m "${msg}"`);
    } catch(e) {
        // Если нет изменений — это нормально
        console.log('Нет изменений для коммита');
    }
    run(`cd ${worktreeDir} && git push origin gh-pages --force`);

    // Очищаем
    run(`git worktree remove ${worktreeDir} --force`);
    rmrf(worktreeDir);

    console.log('✅ Деплой завершён: https://bank-select.ru');
} catch (error) {
    console.error('❌ Ошибка:', error.message);
    try { run(`git worktree remove ${worktreeDir} --force`); } catch(e) {}
    rmrf(worktreeDir);
    process.exit(1);
}
