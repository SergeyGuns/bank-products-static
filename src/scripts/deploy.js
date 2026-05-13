#!/usr/bin/env node

/**
 * Deploy to gh-pages branch
 * Используем git worktree для чистого деплоя
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '../..');
const DIST_DIR = path.join(BASE_DIR, 'dist');
const WORKTREE_DIR = path.join(BASE_DIR, '.gh-pages-worktree');

try {
    // 1. Сборка
    console.log('Step 1: Building...');
    execSync('npm run build', { cwd: BASE_DIR, stdio: 'inherit' });

    // 2. Удаляем старый worktree если есть
    console.log('Step 2: Cleaning worktree...');
    try {
        execSync('git worktree remove .gh-pages-worktree --force', { cwd: BASE_DIR, stdio: 'pipe' });
    } catch (e) {
        // Игнорируем ошибку если worktree не существует
    }
    if (fs.existsSync(WORKTREE_DIR)) {
        fs.rmSync(WORKTREE_DIR, { recursive: true });
    }

    // 3. Создаём orphan ветку gh-pages
    console.log('Step 3: Creating worktree...');
    try {
        execSync('git fetch origin gh-pages', { cwd: BASE_DIR, stdio: 'pipe' });
        execSync(`git worktree add ${WORKTREE_DIR} gh-pages`, { cwd: BASE_DIR, stdio: 'inherit' });
    } catch (e) {
        // Ветки нет, создаём новую
        execSync(`git worktree add --detach ${WORKTREE_DIR}`, { cwd: BASE_DIR, stdio: 'inherit' });
    }

    // 4. Удаляем все файлы в worktree
    console.log('Step 4: Cleaning files...');
    const items = fs.readdirSync(WORKTREE_DIR);
    for (const item of items) {
        if (item === '.git') continue;
        fs.rmSync(path.join(WORKTREE_DIR, item), { recursive: true, force: true });
    }

    // 5. Копируем dist/
    console.log('Step 5: Copying dist/...');
    fs.cpSync(DIST_DIR, WORKTREE_DIR, { recursive: true });

    // 6. Создаём CNAME
    console.log('Step 6: Creating CNAME...');
    fs.writeFileSync(path.join(WORKTREE_DIR, 'CNAME'), 'bank-select.ru');

    // 7. Проверяем что CNAME создан
    if (!fs.existsSync(path.join(WORKTREE_DIR, 'CNAME'))) {
        throw new Error('CNAME file was not created!');
    }
    console.log('CNAME content:', fs.readFileSync(path.join(WORKTREE_DIR, 'CNAME'), 'utf8'));

    // 8. Коммитим
    console.log('Step 7: Committing...');
    execSync(`git add -A`, { cwd: WORKTREE_DIR, stdio: 'inherit' });
    
    // Проверяем статус
    const status = execSync('git status --porcelain', { cwd: WORKTREE_DIR, encoding: 'utf8' });
    console.log('Git status:', status || '(clean)');
    
    if (!status.trim()) {
        console.log('No changes to commit, but pushing anyway...');
    }
    
    execSync(`git commit --allow-empty -m "Deploy: ${new Date().toISOString()}"`, { cwd: WORKTREE_DIR, stdio: 'inherit' });

    // 9. Пушим
    console.log('Step 8: Pushing...');
    execSync(`git push origin HEAD:gh-pages --force`, { cwd: WORKTREE_DIR, stdio: 'inherit' });

    // 10. Очистка
    console.log('Step 9: Cleanup...');
    execSync('git worktree remove .gh-pages-worktree --force', { cwd: BASE_DIR, stdio: 'pipe' });

    console.log('Deployed to gh-pages!');

} catch (error) {
    console.error('Deploy failed:', error.message);
    
    // Очистка при ошибке
    try {
        execSync('git worktree remove .gh-pages-worktree --force', { cwd: BASE_DIR, stdio: 'pipe' });
    } catch (e) {}
    
    process.exit(1);
}
