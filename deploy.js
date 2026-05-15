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
const worktreeDir = path.join(__dirname, '..', 'gh-pages-deploy');

function run(cmd, opts = {}) {
    return execSync(cmd, { stdio: 'pipe', ...opts }).toString().trim();
}

try {
    // Проверяем что dist существует
    if (!fs.existsSync(distDir)) {
        console.error('dist/ не найден. Сначала запустите npm run build');
        process.exit(1);
    }

    // Копируем CNAME и .nojekyll в dist
    fs.writeFileSync(path.join(distDir, 'CNAME'), cname);
    fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
    console.log(`CNAME создан: ${cname}`);

    // Проверяем существует ли ветка gh-pages
    let branchExists = false;
    try {
        run('git rev-parse --verify gh-pages');
        branchExists = true;
    } catch (e) {
        branchExists = false;
    }

    // Удаляем старый worktree если есть
    try {
        run(`git worktree remove ${worktreeDir} --force`);
    } catch (e) {
        // игнорируем если нет
    }

    // Удаляем локальную папку worktree если осталась
    if (fs.existsSync(worktreeDir)) {
        fs.rmSync(worktreeDir, { recursive: true, force: true });
    }

    if (branchExists) {
        // Ветка существует — используем её
        run(`git worktree add ${worktreeDir} gh-pages`);
    } else {
        // Создаём orphan ветку
        run('git checkout --orphan gh-pages');
        run('git rm -rf .');
        run('git commit --allow-empty -m "init gh-pages"');
        run('git checkout master');
        run(`git worktree add ${worktreeDir} gh-pages`);
    }

    // Очищаем старое содержимое worktree
    const worktreeFiles = fs.readdirSync(worktreeDir).filter(f => f !== '.git');
    for (const f of worktreeFiles) {
        fs.rmSync(path.join(worktreeDir, f), { recursive: true, force: true });
    }

    // Копируем dist в worktree
    const distFiles = fs.readdirSync(distDir);
    for (const f of distFiles) {
        const src = path.join(distDir, f);
        const dst = path.join(worktreeDir, f);
        if (fs.statSync(src).isDirectory()) {
            fs.cpSync(src, dst, { recursive: true });
        } else {
            fs.copyFileSync(src, dst);
        }
    }

    // Коммитим и пушим
    const commitMsg = `Deploy: ${new Date().toISOString()}`;
    run(`cd ${worktreeDir} && git add -A && git commit -m "${commitMsg}"`);
    run(`cd ${worktreeDir} && git push origin gh-pages --force`);

    // Очищаем worktree
    run(`git worktree remove ${worktreeDir} --force`);

    console.log('✅ Деплой завершён: https://bank-select.ru');
} catch (error) {
    console.error('❌ Ошибка деплоя:', error.message);
    // Пытаемся почистить worktree при ошибке
    try {
        run(`git worktree remove ${worktreeDir} --force`);
    } catch (e) {}
    process.exit(1);
}
