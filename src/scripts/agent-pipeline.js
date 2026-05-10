#!/usr/bin/env node

/**
 * Agent Pipeline — оркестратор агентской системы
 *
 * Запускает полный цикл:
 * 1. Discovery -> 2. Extraction -> 3. Merge -> 4. Validate -> 5. Build -> 6. Test -> 7. Commit
 *
 * Использование: node src/scripts/agent-pipeline.js [--dry-run] [--bank sberbank]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const targetBank = get('--bank');

const SCRIPTS = __dirname;
const BASE_DIR = path.join(__dirname, '../..');
const log = (msg) => console.log('[' + new Date().toISOString() + '] ' + msg);

function run(cmd) {
  log('> ' + cmd);
  try {
    const out = execSync(cmd, { timeout: 120000, cwd: BASE_DIR, stdio: 'pipe' });
    return { success: true, output: out.toString() };
  } catch (err) {
    return { success: false, output: (err.stderr || err.message || '').toString() };
  }
}

async function main() {
  log('Agent Pipeline: старт');
  const pipelineReport = { steps: [], startTime: new Date().toISOString() };

  // Step 1: Discovery
  log('--- Step 1: Discovery ---');
  const discoverArgs = targetBank ? '--bank ' + targetBank : '';
  const discover = run('node ' + SCRIPTS + '/agent-discover.js ' + discoverArgs);
  pipelineReport.steps.push({ name: 'discover', success: discover.success });
  if (!discover.success) { log('Discovery упал'); process.exit(1); }

  let discoverData;
  try {
    discoverData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/discover-results.json'), 'utf-8'));
  } catch (e) {
    log('Не удалось прочитать discover-results.json');
    process.exit(1);
  }

  if (!discoverData.newProducts || discoverData.newProducts.length === 0) {
    log('Новых продуктов не найдено. Пайплайн завершён.');
    process.exit(0);
  }
  log('   Найдено ' + discoverData.newProducts.length + ' новых продуктов');

  // Step 2: Extraction
  log('--- Step 2: Extraction ---');
  const extract = run('node ' + SCRIPTS + '/agent-extract.js --limit 20');
  pipelineReport.steps.push({ name: 'extract', success: extract.success });
  if (!extract.success) { log('Extraction упал'); process.exit(1); }

  // Step 3: Merge
  log('--- Step 3: Merge ---');
  const mergeArgs = dryRun ? '--dry-run' : '';
  const merge = run('node ' + SCRIPTS + '/agent-merge.js ' + mergeArgs);
  pipelineReport.steps.push({ name: 'merge', success: merge.success });
  if (!merge.success) { log('Merge упал'); process.exit(1); }

  if (dryRun) {
    log('[DRY RUN] Останавливаемся перед сборкой');
    log('Pipeline (dry-run) завершён');
    process.exit(0);
  }

  // Step 4: Validate
  log('--- Step 4: Validate ---');
  const validate = run('node ' + SCRIPTS + '/validate-data.js');
  pipelineReport.steps.push({ name: 'validate', success: validate.success });

  // Step 5: Build
  log('--- Step 5: Build ---');
  const build = run('node ' + SCRIPTS + '/generate.js');
  pipelineReport.steps.push({ name: 'build', success: build.success });
  if (!build.success) { log('Build упал'); process.exit(1); }

  // Step 6: Test
  log('--- Step 6: Test ---');
  const test = run('npx jest --passWithNoTests 2>&1');
  pipelineReport.steps.push({ name: 'test', success: test.success });

  // Step 7: Commit
  log('--- Step 7: Commit ---');
  const branchName = 'data-update/' + new Date().toISOString().split('T')[0];
  run('git checkout -b ' + branchName);
  run('git add src/data/');
  run('git commit -m "data: auto-update bank products via agent pipeline"');
  log('   Ветка создана: ' + branchName);

  pipelineReport.endTime = new Date().toISOString();
  fs.writeFileSync(
    path.join(__dirname, '../data/pipeline-report.json'),
    JSON.stringify(pipelineReport, null, 2)
  );

  log('Pipeline завершён успешно!');
  log('   Отчёт: src/data/pipeline-report.json');
}

main().catch(err => {
  log('Фатальная ошибка: ' + err.message);
  process.exit(1);
});
