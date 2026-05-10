# Bank Products MVP — План итеративных улучшений

> **Для Hermes:** Используй навык subagent-driven-development для выполнения этого плана задача за задачей.

**Goal:** Сделать сайт bank-products-static прозрачным, удобным и готовым к росту — с фокусом на сравнение банковских продуктов, UX, качество кода и автоматизацию.

**Architecture:** Статический сайт на Node.js (Handlebars). Данные хранятся в JSON, генерируются HTML-страницы. Улучшения затрагивают: документацию, тесты, CI/CD, UI/фильтрацию, качество данных и производительность.

**Tech Stack:** Node.js, Handlebars, Express (dev-сервер), Jest, Playwright, GitHub Actions, gh-pages.

---

## ФАЗА 1: Фундамент (документация, тесты, CI)

### Task 1.1: Создать README.md

**Objective:** Новый разработчик должен понять проект за 2 минуты.

**Files:**
- Create: `README.md`

**Шаг 1:** Создай файл README.md с содержимым:

```markdown
# Bank Products Static

Статический сайт для сравнения банковских продуктов России.

## Возможности

- Сравнение кредитных карт, дебетовых карт, кредитов
- Страницы категорий с таблицами сравнения
- Кредитный калькулятор
- SEO-оптимизированные страницы (sitemap, robots.txt, schema.org)

## Быстрый старт

\`\`\`bash
npm install
npm run build     # Генерация в dist/
npm run dev       # Сборка + локальный сервер на :3000
npm run serve     # Только сервер на :3000
npm run test      # Все тесты
\`\`\`

## Структура

\`\`\`
src/
  data/       # JSON данные о продуктах и категориях
  templates/  # Handlebars шаблоны
  scripts/    # Скрипты генерации, скрапинга, утилиты
  static/     # Favicon, логотип, manifest
  tests/      # Playwright e2e-тесты
dist/         # Сгенерированный сайт (результат сборки)
\`\`\`

## Деплой

\`\`\`bash
npm run publish   # Сборка + push в gh-pages ветку
\`\`\`

## Лицензия
MIT
\`\`\`

**Шаг 2:** Проверь что файл создался:

Run: `ls -la README.md`
Expected: файл существует, размер > 0

**Шаг 3:** Commit:

```bash
git add README.md
git commit -m "docs: add project README with quickstart guide"
```

---

### Task 1.2: Написать unit-тест для генератора

**Objective:** Убедиться, что `npm run build` корректно создаёт index.html и ключевые страницы.

**Files:**
- Create: `src/scripts/generate.spec.js`
- Test: `src/scripts/generate.spec.js`

**Шаг 1: Напиши failing test**

```javascript
const path = require('path');
const fs = require('fs').promises;
const { main } = require('./generate');

describe('Site Generator', () => {
  const distDir = path.join(__dirname, '../../dist');

  beforeAll(async () => {
    await main();
  }, 30000);

  test('dist directory exists', async () => {
    const stat = await fs.stat(distDir);
    expect(stat.isDirectory()).toBe(true);
  });

  test('index.html is generated', async () => {
    const content = await fs.readFile(path.join(distDir, 'index.html'), 'utf-8');
    expect(content.length).toBeGreaterThan(100);
  });

  test('sitemap.xml is generated', async () => {
    const content = await fs.readFile(path.join(distDir, 'sitemap.xml'), 'utf-8');
    expect(content).toContain('<?xml');
    expect(content).toContain('<urlset');
  });

  test('robots.txt is generated', async () => {
    const content = await fs.readFile(path.join(distDir, 'robots.txt'), 'utf-8');
    expect(content).toContain('Sitemap');
  });

  test('category pages are generated', async () => {
    const cats = await fs.readdir(path.join(distDir, 'category'));
    expect(cats.length).toBeGreaterThan(0);
    expect(cats.every(f => f.endsWith('.html'))).toBe(true);
  });

  test('product pages are generated', async () => {
    const prods = await fs.readdir(path.join(distDir, 'products'));
    expect(prods.length).toBeGreaterThan(0);
    expect(prods.every(f => f.endsWith('.html'))).toBe(true);
  });
});
```

**Шаг 2: Запусти тест для проверки, что он FAIL (модуль ещё не экспортирует main)**

Run: `npx jest src/scripts/generate.spec.js -v`
Expected: FAIL — "Cannot find module './generate'" или "main is not exported"

Проверка FAIL нужна чтобы убедиться, что тест реально что-то проверяет, прежде чем чинить код.

**Шаг 3: Реализуй минимальное исправление — убедись что generate.js экспортирует main**

Файл `src/scripts/generate.js` уже содержит `module.exports = { main };` в строках 203-204. Если это так — test должен пройти. Если нет — добавь в конец файла:

```javascript
module.exports = { main };
```

**Шаг 4: Запусти тест для проверки PASS**

Run: `npx jest src/scripts/generate.spec.js -v`
Expected: 6 passed

**Шаг 5: Commit**

```bash
git add src/scripts/generate.spec.js
git commit -m "test: add unit tests for site generator"
```

---

### Task 1.3: Настроить GitHub Actions CI

**Objective:** При каждом push в main автоматически запускаются тесты и проверяется сборка.

**Files:**
- Create: `.github/workflows/ci.yml`

**Шаг 1: Создай workflow**

```yaml
name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npm run build
      - run: npm run test:jest

      - name: Upload dist as artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7
```

**Шаг 2: Проверь что yaml валидный**

Run: `node -e "const y=require('yaml'); y.parse(require('fs').readFileSync('.github/workflows/ci.yml','utf8')); console.log('Valid YAML')"`
Expected: "Valid YAML"

Если yaml модуль не установлен: `npm yaml`, или просто проверь `ls -la .github/workflows/ci.yml`.

**Шаг 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow for build & test"
```

---

## ФАЗА 2: Улучшение сравнения (UI/UX)

### Task 2.1: Добавить клиентскую сортировку в таблицу сравнения

**Objective:** Пользователь может сортировать продукты по ставке, лимиту, названию банка прямо в браузере.

**Files:**
- Modify: `src/templates/compare-page.html`
- Create: `src/static/js/compare-sort.js`

**Шаг 1: Создай JS-файл для сортировки**

`src/static/js/compare-sort.js`:

```javascript
document.addEventListener('DOMContentLoaded', () => {
  const table = document.querySelector('.compare-table');
  if (!table) return;

  const headers = table.querySelectorAll('th[data-sort]');
  headers.forEach(th => {
    th.style.cursor = 'pointer';
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      const tbody = table.querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));
      const isAsc = th.dataset.order !== 'asc';

      headers.forEach(h => delete h.dataset.order);
      th.dataset.order = isAsc ? 'asc' : 'desc';

      rows.sort((a, b) => {
        const aVal = a.querySelector(`[data-col="${col}"]`)?.textContent.trim() || '';
        const bVal = b.querySelector(`[data-col="${col}"]`)?.textContent.trim() || '';
        const numA = parseFloat(aVal.replace(/[^\d.]/g, ''));
        const numB = parseFloat(bVal.replace(/[^\d.]/g, ''));
        if (!isNaN(numA) && !isNaN(numB)) {
          return isAsc ? numA - numB : numB - numA;
        }
        return isAsc ? aVal.localeCompare(bVal, 'ru') : bVal.localeCompare(aVal, 'ru');
      });

      rows.forEach(row => tbody.appendChild(row));
    });
  });
});
```

**Шаг 2: Добавь `data-sort` атрибуты в шаблон compare-page.html**

В заголовках таблицы добавь `data-sort="<column_name>"` и `data-col="<column_name>"` в ячейки. Подключи скрипт в layout:

```html
<script src="/js/compare-sort.js"></script>
```

**Шаг 3: Собери и проверь**

Run: `npm run build && ls -la dist/js/compare-sort.js`
Expected: dist/js/compare-sort.js существует

**Шаг 4: Commit**

```bash
git add src/static/js/compare-sort.js src/templates/compare-page.html src/templates/layout.html
git commit -m "feat: add client-side sorting to comparison tables"
```

---

### Task 2.2: Добавить фильтрацию по банку на страницах категорий

**Objective:** Пользователь может отфильтровать продукты по конкретному банку на странице категории.

**Files:**
- Modify: `src/templates/category-page.html`
- Create: `src/static/js/category-filter.js`

**Шаг 1: Создай JS-файл**

`src/static/js/category-filter.js`:

```javascript
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.category-products');
  if (!container) return;

  const banks = [...new Set(
    container.querySelectorAll('[data-bank]').map(el => el.dataset.bank)
  )].sort((a, b) => a.localeCompare(b, 'ru'));

  if (banks.length < 2) return;

  const filterContainer = document.createElement('div');
  filterContainer.className = 'filter-bar';

  const label = document.createElement('label');
  label.textContent = 'Банк: ';
  const select = document.createElement('select');
  select.id = 'bank-filter';

  const allOpt = document.createElement('option');
  allOpt.value = '';
  allOpt.textContent = 'Все банки';
  select.appendChild(allOpt);

  banks.forEach(bank => {
    const opt = document.createElement('option');
    opt.value = bank;
    opt.textContent = bank;
    select.appendChild(opt);
  });

  filterContainer.appendChild(label);
  filterContainer.appendChild(select);
  container.prepend(filterContainer);

  select.addEventListener('change', () => {
    const value = select.value;
    container.querySelectorAll('[data-bank]').forEach(el => {
      el.closest('.product-card').style.display =
        (!value || el.dataset.bank === value) ? '' : 'none';
    });
  });
});
```

**Шаг 2: Добавь `data-bank` атрибут в шаблон category-page.html**

Оберни каждый продукт в элемент с `data-bank="{{bankName}}"`.

**Шаг 3: Собери и проверь**

Run: `npm run build && grep -r "data-bank" dist/category/ | head -5`
Expected: data-bank атрибуты присутствуют в сгенерированных страницах

**Шаг 4: Commit**

```bash
git add src/static/js/category-filter.js src/templates/category-page.html
git commit -m "feat: add bank filter on category pages"
```

---

### Task 2.3: Добавить подсветку лучшего предложения

**Objective:** В таблице сравнения визуально выделяется продукт с лучшей ставкой.

**Files:**
- Modify: `src/templates/compare-page.html`

**Шаг 1:** Добавь CSS-класс `best-offer` к строке продукта с минимальной ставкой.

В шаблоне после цикла `{{#each products}}` добавь хелпер:

```handlebars
{{#compare this "rate" "min"}} ... {{/compare}}
```

Или проще — добавь inline-стиль к ячейке с лучшей ставкой:

```css
.best-rate { background: #e6f9f0; font-weight: bold; }
```

**Шаг 2: Добавь стили в CSS**

Run: `npm run build`
Expected: сборка проходит без ошибок

**Шаг 3: Commit**

```bash
git add src/templates/compare-page.html
git commit -m "feat: highlight best offer in comparison table with visual cue"
```

---

## ФАЗА 3: Качество данных

### Task 3.1: Добавить JSON Schema валидацию продуктов

**Objective:** При запуске `npm run validate` проверяется, что все продукты имеют обязательные поля.

**Files:**
- Create: `src/schemas/product-schema.json` (если нет — проверь, может уже существует)
- Modify: `src/scripts/validate-data.js`

**Шаг 1: Проверь текущий валидатор**

Run: `npm run validate`
Expected: вывод результатов валидации

**Шаг 2: Добавь проверку обязательных полей**

В `validate-data.js` добавь проверку:
- `id`, `title`, `bankName`, `type` — обязательные
- `parameters.main` должен содержать хотя бы одно поле
- `referralLink` должен быть валидным URL

**Шаг 3: Запусти валидацию**

Run: `npm run validate`
Expected: список ошибок или "All products valid"

**Шаг 4: Commit**

```bash
git add src/scripts/validate-data.js src/schemas/product-schema.json
git commit -m "feat: enhance product validation with required fields and URL checks"
```

---

### Task 3.2: Исправить imageUrl placeholder

**Objective:** Убрать битые ссылки на изображения `/img/products/.jpg` и добавить fallback.

**Files:**
- Modify: `src/data/products.json` (или скрипт, который генерирует данные)
- Modify: `src/templates/layout.html`

**Шаг 1: Добавь в шаблон product-page.html fallback**

```html
<img src="{{product.imageUrl}}" alt="{{product.title}}"
     onerror="this.src='/static/logo.svg'; this.style.opacity='0.5';">
```

**Шаг 2: Пересобери и проверь**

Run: `npm run build && grep -r "onerror" dist/products/ | head -3`
Expected: onerror атрибут присутствует в карточках продуктов

**Шаг 3: Commit**

```bash
git add src/templates/product-page.html
git commit -m "fix: add image fallback for broken product image URLs"
```

---

## ФАЗА 4: Технические улучшения

### Task 4.1: Добавить e2e тест Playwright

**Objective:** Автоматическая проверка что ключевые страницы открываются и работают.

**Files:**
- Create: `src/tests/homepage.test.js`

**Шаг 1: Напиши тест**

```javascript
const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost:3000';

test.describe('Homepage', () => {
  test('loads successfully', async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveURL(BASE + '/');
  });

  test('has title', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('has categories', async ({ page }) => {
    await page.goto(BASE);
    const links = page.locator('a[href^="/category/"]');
    expect(await links.count()).toBeGreaterThan(0);
  });
});

test.describe('Category page', () => {
  test('loads credit-cards', async ({ page }) => {
    await page.goto(`${BASE}/category/credit-cards.html`);
    await expect(page).toHaveURL(/credit-cards/);
  });
});
```

**Шаг 2: Запусти сервер в фоне и проверь тест**

Terminal 1: `npm run serve`
Terminal 2: `npx playwright test src/tests/homepage.test.js`
Expected: 4 passed

**Шаг 3: Commit**

```bash
git add src/tests/homepage.test.js
git commit -m "test: add Playwright e2e tests for homepage and category pages"
```

---

### Task 4.2: Добавить Dark Mode toggle

**Objective:** Пользователь может переключить тему между светлой и тёмной.

**Files:**
- Create: `src/static/css/dark-mode.css`
- Modify: `src/templates/layout.html`
- Create: `src/static/js/dark-mode.js`

**Шаг 1: Создай CSS переменные**

`src/static/css/dark-mode.css`:

```css
[data-theme="dark"] {
  --bg: #1a1a2e;
  --text: #e0e0e0;
  --card-bg: #16213e;
  --border: #0f3460;
  --accent: #e94560;
}

[data-theme="dark"] body { background: var(--bg); color: var(--text); }
[data-theme="dark"] .product-card { background: var(--card-bg); border-color: var(--border); }
[data-theme="dark"] header { background: var(--card-bg); }
[data-theme="dark"] a { color: #7ec8e3; }
```

**Шаг 2: Создай JS toggle**

`src/static/js/dark-mode.js`:

```javascript
(function() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  const btn = document.createElement('button');
  btn.id = 'theme-toggle';
  btn.textContent = '🌙';
  btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999;font-size:1.5rem;padding:0.5rem;border-radius:50%;border:none;cursor:pointer;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.2);';
  btn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    btn.textContent = isDark ? '🌙' : '☀️';
  });
  document.body.appendChild(btn);
})();
```

**Шаг 3: Подключи в layout.html**

```html
<link rel="stylesheet" href="/css/dark-mode.css">
<script src="/js/dark-mode.js"></script>
```

**Шаг 4: Собери и проверь**

Run: `npm run build && grep -q "data-theme" dist/static/css/dark-mode.css && echo "OK"`
Expected: "OK"

**Шаг 5: Commit**

```bash
git add src/static/css/dark-mode.css src/static/js/dark-mode.js src/templates/layout.html
git commit -m "feat: add dark mode toggle with localStorage persistence"
```

---

---

## ФАЗА 5: Агентский поиск и актуализация данных

> **Контекст:** Сайт — статический, данные хранятся в JSON. Нет backend-а, нет API. Есть набор Node.js-скриптов для скрапинга (bank-scraper.js, product-parser.js и др.). Задача — построить систему, где AI-агенты самостоятельно ищут новые банковские продукты, извлекают параметры и обновляют JSON-файлы, которые потом попадают на сайт через `npm run build && npm run publish`.

### Архитектура агентской системы

```
┌─────────────────────────────────────────────────────────────┐
│                    Orchestrator (Hermes)                     │
│  Запускает пайплайн по расписанию или по требованию         │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   ┌─────────────┐ ┌───────────┐ ┌──────────────┐
   │  Discovery   │ │ Extraction│ │  Validation  │
   │  Agent       │ │ Agent     │ │  Agent       │
   │              │ │           │ │              │
   │ Ищет новые   │ │ Извлекает │ │ Проверяет    │
   │ продукты на  │ │ параметры │ │ данные,      │
   │ сайтах банков│ │ из HTML/  │ │ сравнивает   │
   │ и агрегаторов│ │ PDF       │ │ с имеющимися │
   └──────┬──────┘ └─────┬─────┘ └──────┬───────┘
          │              │              │
          └──────────────┼──────────────┘
                         ▼
              ┌─────────────────────┐
              │   Merge & Commit    │
              │   Обновляет JSON,   │
              │   коммитит в ветку  │
              │   data-update/*     │
              └─────────┬───────────┘
                        ▼
              ┌─────────────────────┐
              │   CI/CD Pipeline    │
              │   build → test →    │
              │   publish (gh-pages)│
              └─────────────────────┘
```

**Принципы:**
- Каждый агент — отдельный `delegate_task` с чистым контекстом
- Агенты работают параллельно где возможно (разные банки/категории)
- Результат каждого агента — верифицируемый артефакт (JSON-файл, diff, лог)
- Оркестратор принимает решение: merge / request changes / abort
- Всё логируется, ошибки не молчат

---

### Task 5.1: Создать скрипт-обёртку `agent-discover.js`

**Objective:** Единая точка входа для Discovery Agent — загружает список банков, итеративно ищет новые продукты, сохраняет результат.

**Files:**
- Create: `src/scripts/agent-discover.js`

**Шаг 1: Создай скрипт**

```javascript
/**
 * Discovery Agent — поиск новых банковских продуктов
 * 
 * Алгоритм:
 * 1. Загружает конфигурацию банков и URL
 * 2. Для каждого банка загружает страницы продуктов
 * 3. Парсит список продуктов (названия, ссылки)
 * 4. Сравнивает с уже имеющимися в products.json
 * 5. Выводит список новых продуктов
 * 
 * Использование: node src/scripts/agent-discover.js [--bank sberbank] [--category credit-cards]
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const BANKS_CONFIG = path.join(__dirname, '../config/bank-urls-config.json');
const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');

// Парсинг аргументов
const args = process.argv.slice(2);
const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const targetBank = get('--bank');
const targetCategory = get('--category');

async function loadJSON(p) {
  try { return JSON.parse(await fs.readFile(p, 'utf-8')); }
  catch { return null; }
}

async function fetchPage(url) {
  try {
    const { data } = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9',
      }
    });
    return data;
  } catch (err) {
    return { error: err.message, url };
  }
}

/**
 * Универсальный парсер — ищет карточки продуктов на странице
 * Работает по эвристикам: ищет элементы с ценами, ставками, названиями
 */
function extractProductCards(html, bankName) {
  const $ = cheerio.load(html);
  const products = [];

  // Эвристика 1: карточки с классами product/card/offer
  $('[class*="product"], [class*="card"], [class*="offer"], [class*="tariff"]').each((_, el) => {
    const $el = $(el);
    const title = $el.find('h2, h3, h4, [class*="title"], [class*="name"]').first().text().trim();
    if (!title || title.length < 5) return;

    // Ищем процентные ставки
    const text = $el.text();
    const rateMatch = text.match(/(\d+[.,]?\d*)\s*%/);
    const limitMatch = text.match(/(\d[\d\s]*)\s*[₽руб]/);

    products.push({
      title,
      bankName,
      rate: rateMatch ? rateMatch[1] + '%' : null,
      limit: limitMatch ? limitMatch[0].trim() : null,
      source: 'heuristic-card',
    });
  });

  // Эвристика 2: таблицы с параметрами
  $('table tr').each((_, row) => {
    const cells = $(row).find('td, th').map((_, c) => $(c).text().trim()).get();
    if (cells.length >= 2) {
      const title = cells[0];
      if (title.length > 3 && title.length < 100) {
        products.push({
          title,
          bankName,
          params: cells.slice(1),
          source: 'heuristic-table',
        });
      }
    }
  });

  return products;
}

async function main() {
  console.log('🔍 Discovery Agent: запуск...');

  const [banksConfig, productsData] = await Promise.all([
    loadJSON(BANKS_CONFIG),
    loadJSON(PRODUCTS_FILE),
  ]);

  if (!banksConfig) {
    console.error('❌ Не найден bank-urls-config.json');
    process.exit(1);
  }

  const existingProducts = productsData?.products || [];
  const existingIds = new Set(existingProducts.map(p => p.id));
  const existingTitles = new Set(existingProducts.map(p => `${p.bankName}::${p.title}`));

  const banks = targetBank
    ? (banksConfig.banks || []).filter(b => b.name === targetBank)
    : (banksConfig.banks || []);

  const results = {
    scanned: 0,
    newProducts: [],
    errors: [],
    timestamp: new Date().toISOString(),
  };

  for (const bank of banks) {
    console.log(`\n🏦 ${bank.name}: сканирование...`);

    const urls = targetCategory
      ? (bank.urls || []).filter(u => u.includes(targetCategory))
      : (bank.urls || []);

    for (const url of urls) {
      results.scanned++;
      console.log(`  📄 ${url}`);

      const html = await fetchPage(url);
      if (html.error) {
        results.errors.push({ bank: bank.name, url, error: html.error });
        continue;
      }

      const cards = extractProductCards(html, bank.name);

      for (const card of cards) {
        const key = `${card.bankName}::${card.title}`;
        if (!existingTitles.has(key)) {
          results.newProducts.push({ ...card, discoveredUrl: url });
          existingTitles.add(key); // дедупликация в рамках запуска
        }
      }

      // Пауза между запросами
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Сохраняем результат
  const outFile = path.join(__dirname, '../data/discover-results.json');
  await fs.writeFile(outFile, JSON.stringify(results, null, 2));

  console.log(`\n✅ Результат:`);
  console.log(`   Просканировано URL: ${results.scanned}`);
  console.log(`   Новых продуктов: ${results.newProducts.length}`);
  console.log(`   Ошибок: ${results.errors.length}`);
  console.log(`   Сохранено: ${outFile}`);

  if (results.newProducts.length > 0) {
    console.log(`\n📋 Новые продукты:`);
    results.newProducts.forEach((p, i) => {
      console.log(`   ${i + 1}. [${p.bankName}] ${p.title}`);
    });
  }
}

main().catch(err => {
  console.error('💥 Фатальная ошибка:', err);
  process.exit(1);
});
```

**Шаг 2: Проверь что скрипт запускается**

Run: `node src/scripts/agent-discover.js --bank tbank 2>&1 | head -20`
Expected: вывод с "Discovery Agent: запуск..." и результатом

**Шаг 3: Commit**

```bash
git add src/scripts/agent-discover.js
git commit -m "feat: add discovery agent script for finding new bank products"
```

---

### Task 5.2: Создать скрипт `agent-extract.js` для извлечения параметров

**Objective:** Для каждого нового продукта из discover-results.js извлекает детальные параметры (ставка, лимит, срок, комиссии) и формирует готовый объект для products.json.

**Files:**
- Create: `src/scripts/agent-extract.js`

**Шаг 1: Создай скрипт**

```javascript
/**
 * Extraction Agent — извлечение параметров продукта
 * 
 * На входе: discover-results.json (список новых продуктов)
 * На выходе: extracted-products.json (готовые объекты для products.json)
 * 
 * Использование: node src/scripts/agent-extract.js [--limit 5]
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const DISCOVER_RESULTS = path.join(__dirname, '../data/discover-results.json');
const OUTPUT_FILE = path.join(__dirname, '../data/extracted-products.json');

const args = process.argv.slice(2);
const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const limit = parseInt(get('--limit') || '10');

async function fetchPage(url) {
  try {
    const { data } = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ru-RU,ru;q=0.9',
      }
    });
    return data;
  } catch (err) {
    return null;
  }
}

/**
 * Извлекает параметры продукта со страницы
 * Возвращает объект в формате products.json
 */
function extractProductParams(html, productInfo) {
  const $ = cheerio.load(html);
  const text = $('body').text();

  const params = {
    main: {},
    fees: {},
    requirements: {},
  };

  // Процентная ставка
  const rateMatch = text.match(/(?:ставка|процент|%)[:\s]*(\d+[.,]?\d*)\s*%/i);
  if (rateMatch) params.main['Процентная ставка'] = rateMatch[1] + '%';

  // Сумма / лимит
  const amountMatch = text.match(/(?:сумма|лимит|до)[:\s]*(\d[\d\s]*)\s*[₽руб]/i);
  if (amountMatch) params.main[productInfo.title.includes('карт') ? 'Кредитный лимит' : 'Сумма кредита'] = amountMatch[0].trim();

  // Срок
  const termMatch = text.match(/(?:срок|период)[:\s]*(\d+)\s*(?:лет|мес|дн)/i);
  if (termMatch) params.main['Срок'] = termMatch[0].trim();

  // Льготный период (для карт)
  const graceMatch = text.match(/(?:льготный|без процентов)[:\s]*(\d+)\s*дн/i);
  if (graceMatch) params.main['Льготный период'] = graceMatch[1] + ' дней';

  // Кешбэк
  const cashbackMatch = text.match(/(?:кешбэк|кэшбэк|возврат)[:\s]*(\d+[.,]?\d*)\s*%/i);
  if (cashbackMatch) params.main['Кешбэк'] = cashbackMatch[1] + '%';

  // Обслуживание
  const serviceMatch = text.match(/(?:обслуживание|годовая плата)[:\s]*(\d[\d\s]*)\s*[₽руб]/i);
  if (serviceMatch) params.fees['Обслуживание'] = serviceMatch[0].trim();
  else params.fees['Обслуживание'] = 'бесплатно';

  // Возраст
  const ageMatch = text.match(/(?:возраст|от)[:\s]*(\d+)\s*лет/i);
  if (ageMatch) params.requirements['Возраст'] = 'от ' + ageMatch[1] + ' лет';

  // Стаж
  const expMatch = text.match(/(?:стаж|опыт)[:\s]*(\d+)\s*(?:мес|лет)/i);
  if (expMatch) params.requirements['Стаж'] = 'от ' + expMatch[0].trim();

  // Документы
  const docs = [];
  if (text.includes('паспорт')) docs.push('Паспорт РФ');
  if (text.includes('справка') || text.includes('доход')) docs.push('Справка о доходах');
  if (text.includes('СНИЛС')) docs.push('СНИЛС');
  if (docs.length > 0) params.requirements['Документы'] = docs;

  return {
    id: `${productInfo.bankName.toLowerCase().replace(/\s+/g, '-')}--${Date.now()}`,
    title: productInfo.title,
    bankName: productInfo.bankName,
    type: productInfo.type || 'unknown',
    featured: false,
    shortDescription: productInfo.title,
    fullDescription: `Продукт "${productInfo.title}" от ${productInfo.bankName}`,
    parameters: params,
    features: Object.values(params.main).filter(Boolean).slice(0, 3),
    conditions: Object.values(params.requirements).filter(Boolean).slice(0, 3),
    referralLink: productInfo.discoveredUrl || '',
    meta: {
      title: `${productInfo.title} от ${productInfo.bankName}`,
      description: productInfo.title,
    },
    version: {
      date: new Date().toISOString().split('T')[0],
      source: 'agent-extraction',
      updatedBy: 'discovery-pipeline',
    },
    validFrom: new Date().toISOString().split('T')[0],
    status: 'active',
  };
}

async function main() {
  console.log('🔬 Extraction Agent: запуск...');

  let discoverData;
  try {
    discoverData = JSON.parse(await fs.readFile(DISCOVER_RESULTS, 'utf-8'));
  } catch {
    console.error('❌ discover-results.json не найден. Сначала запусти agent-discover.js');
    process.exit(1);
  }

  const newProducts = (discoverData.newProducts || []).slice(0, limit);
  console.log(`   Найдено ${newProducts.length} продуктов для обработки`);

  const extracted = [];
  const errors = [];

  for (let i = 0; i < newProducts.length; i++) {
    const product = newProducts[i];
    console.log(`\n  [${i + 1}/${newProducts.length}] ${product.bankName}: ${product.title}`);

    if (!product.discoveredUrl) {
      errors.push({ product: product.title, error: 'нет URL' });
      continue;
    }

    const html = await fetchPage(product.discoveredUrl);
    if (!html) {
      errors.push({ product: product.title, error: 'не удалось загрузить страницу' });
      continue;
    }

    const params = extractProductParams(html, product);
    extracted.push(params);
    console.log(`    ✅ Извлечено: ${Object.keys(params.parameters.main).length} параметров`);

    await new Promise(r => setTimeout(r, 1500));
  }

  const result = {
    extracted,
    errors,
    timestamp: new Date().toISOString(),
    stats: { total: newProducts.length, success: extracted.length, failed: errors.length },
  };

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(result, null, 2));

  console.log(`\n✅ Готово:`);
  console.log(`   Извлечено: ${extracted.length}`);
  console.log(`   Ошибок: ${errors.length}`);
  console.log(`   Сохранено: ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error('💥 Фатальная ошибка:', err);
  process.exit(1);
});
```

**Шаг 2: Проверь запуск**

Run: `node src/scripts/agent-extract.js --limit 1 2>&1 | head -10`
Expected: вывод без синтаксических ошибок

**Шаг 3: Commit**

```bash
git add src/scripts/agent-extract.js
git commit -m "feat: add extraction agent for parsing product parameters from HTML"
```

---

### Task 5.3: Создать скрипт `agent-merge.js` для объединения данных

**Objective:** Безопасно объединяет извлечённые продукты с существующим products.json, с валидацией и дедупликацией.

**Files:**
- Create: `src/scripts/agent-merge.js`

**Шаг 1: Создай скрипт**

```javascript
/**
 * Merge Agent — объединение новых продуктов с products.json
 * 
 * На входе: extracted-products.json
 * На выходе: обновлённый products.json + merge-report.json
 * 
 * Использование: node src/scripts/agent-extract.js [--dry-run]
 */

const fs = require('fs').promises;
const path = require('path');

const EXTRACTED_FILE = path.join(__dirname, '../data/extracted-products.json');
const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');
const REPORT_FILE = path.join(__dirname, '../data/merge-report.json');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

function validateProduct(p) {
  const errors = [];
  if (!p.id) errors.push('missing id');
  if (!p.title) errors.push('missing title');
  if (!p.bankName) errors.push('missing bankName');
  if (!p.type || p.type === 'unknown') errors.push('missing/invalid type');
  if (!p.parameters?.main || Object.keys(p.parameters.main).length === 0) {
    errors.push('empty parameters.main');
  }
  return errors;
}

function categorizeProduct(p) {
  const title = (p.title || '').toLowerCase();
  const bank = (p.bankName || '').toLowerCase();

  if (title.includes('кредитн') || title.includes('credit card')) return 'credit-cards';
  if (title.includes('дебетов') || title.includes('debit')) return 'debit-cards';
  if (title.includes('автокред') || title.includes('авто')) return 'auto-loans';
  if (title.includes('ипотек') || title.includes('mortgage')) return 'mortgage';
  if (title.includes('вклад') || title.includes('депозит') || title.includes('deposit')) return 'deposits';
  if (title.includes('потребит') || title.includes('кредит')) return 'consumer-loans';
  if (title.includes('бизнес') || title.includes('business')) return 'business-loans';

  return p.type || 'unknown';
}

async function main() {
  console.log('🔀 Merge Agent: запуск...');
  if (dryRun) console.log('   [DRY RUN — файлы не изменяются]');

  let extractedData, productsData;
  try {
    extractedData = JSON.parse(await fs.readFile(EXTRACTED_FILE, 'utf-8'));
    productsData = JSON.parse(await fs.readFile(PRODUCTS_FILE, 'utf-8'));
  } catch (err) {
    console.error('❌ Ошибка чтения файлов:', err.message);
    process.exit(1);
  }

  const existing = productsData.products || [];
  const existingIds = new Set(existing.map(p => p.id));
  const existingKeys = new Set(existing.map(p => `${p.bankName}::${p.title}`));

  const toAdd = [];
  const skipped = [];
  const invalid = [];

  for (const product of extractedData.extracted || []) {
    // Валидация
    const errors = validateProduct(product);
    if (errors.length > 0) {
      invalid.push({ product: product.title, errors });
      continue;
    }

    // Категоризация
    if (product.type === 'unknown') {
      product.type = categorizeProduct(product);
    }

    // Дедупликация
    const key = `${product.bankName}::${product.title}`;
    if (existingIds.has(product.id) || existingKeys.has(key)) {
      skipped.push({ product: product.title, reason: 'duplicate' });
      continue;
    }

    toAdd.push(product);
    existingIds.add(product.id);
    existingKeys.add(key);
  }

  const report = {
    timestamp: new Date().toISOString(),
    dryRun,
    stats: {
      extracted: (extractedData.extracted || []).length,
      toAdd: toAdd.length,
      skipped: skipped.length,
      invalid: invalid.length,
      totalBefore: existing.length,
      totalAfter: existing.length + toAdd.length,
    },
    added: toAdd.map(p => ({ id: p.id, title: p.title, bankName: p.bankName, type: p.type })),
    skipped,
    invalid,
  };

  console.log(`\n📊 Результат:`);
  console.log(`   Извлечено: ${report.stats.extracted}`);
    console.log(`   К добавлению: ${report.stats.toAdd}`);
    console.log(`   Пропущено (дубли): ${report.stats.skipped}`);
    console.log(`   Невалидных: ${report.stats.invalid}`);

  if (!dryRun && toAdd.length > 0) {
    productsData.products = [...existing, ...toAdd];
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(productsData, null, 2));
    console.log(`\n✅ products.json обновлён: ${report.stats.totalBefore} → ${report.stats.totalAfter}`);
  } else if (dryRun) {
    console.log(`\n🔍 [DRY RUN] Будет добавлено: ${toAdd.length}`);
  }

  await fs.writeFile(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(`   Отчёт: ${REPORT_FILE}`);
}

main().catch(err => {
  console.error('💥 Фатальная ошибка:', err);
  process.exit(1);
});
```

**Шаг 2: Проверь dry-run**

Run: `node src/scripts/agent-merge.js --dry-run 2>&1 | head -15`
Expected: вывод без ошибок

**Шаг 3: Commit**

```bash
git add src/scripts/agent-merge.js
git commit -m "feat: add merge agent for safe product deduplication and JSON update"
```

---

### Task 5.4: Создать оркестратор `agent-pipeline.js`

**Objective:** Единая точка входа, которая запускает Discovery → Extraction → Merge → Build → Test → Commit. Это то, что будет вызываться из cron или вручную.

**Files:**
- Create: `src/scripts/agent-pipeline.js`

**Шаг 1: Создай скрипт**

```javascript
/**
 * Agent Pipeline — оркестратор агентской системы
 * 
 * Запускает полный цикл:
 * 1. Discovery → 2. Extraction → 3. Merge → 4. Validate → 5. Build → 6. Test → 7. Commit
 * 
 * Использование: node src/scripts/agent-pipeline.js [--dry-run] [--bank sberbank]
 */

const { execSync } = require('child_process');
const fs = require('fs').path;
const path = require('path');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const targetBank = get('--bank');

const SCRIPTS = path.join(__dirname);
const log = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`);

function run(cmd, opts = {}) {
  log(`> ${cmd}`);
  try {
    const out = execSync(cmd, { timeout: 120000, cwd: path.join(__dirname, '../..'), ...opts });
    return { success: true, output: out.toString() };
  } catch (err) {
    return { success: false, output: err.stderr?.toString() || err.message };
  }
}

async function main() {
  log('🚀 Agent Pipeline: старт');
  const pipelineReport = { steps: [], startTime: new Date().toISOString() };

  // ── Step 1: Discovery ──
  log('━━━ Step 1: Discovery ━━━');
  const discoverArgs = targetBank ? `--bank ${targetBank}` : '';
  const discover = run(`node ${SCRIPTS}/agent-discover.js ${discoverArgs}`);
  pipelineReport.steps.push({ name: 'discover', ...discover });
  if (!discover.success) { log('❌ Discovery упал, пайплайн остановлен'); process.exit(1); }

  // Проверяем есть ли новые продукты
  const discoverData = JSON.parse(require('fs').readFileSync(
    path.join(__dirname, '../data/discover-results.json'), 'utf-8'
  ));
  if (!discoverData.newProducts?.length) {
    log('ℹ️ Новых продуктов не найдено. Пайлайн завершён.');
    process.exit(0);
  }
  log(`   Найдено ${discoverData.newProducts.length} новых продуктов`);

  // ── Step 2: Extraction ──
  log('━━━ Step 2: Extraction ━━━');
  const extract = run(`node ${SCRIPTS}/agent-extract.js --limit 20`);
  pipelineReport.steps.push({ name: 'extract', ...extract });
  if (!extract.success) { log('❌ Extraction упал'); process.exit(1); }

  // ── Step 3: Merge ──
  log('━━━ Step 3: Merge ━━━');
  const mergeArgs = dryRun ? '--dry-run' : '';
  const merge = run(`node ${SCRIPTS}/agent-merge.js ${mergeArgs}`);
  pipelineReport.steps.push({ name: 'merge', ...merge });
  if (!merge.success) { log('❌ Merge упал'); process.exit(1); }

  if (dryRun) {
    log('🔍 [DRAY RUN] Останавливаемся перед сборкой');
    log('✅ Pipeline (dry-run) завершён');
    process.exit(0);
  }

  // ── Step 4: Validate ──
  log('━━━ Step 4: Validate ━━━');
  const validate = run(`node ${SCRIPTS}/validate-data.js`);
  pipelineReport.steps.push({ name: 'validate', ...validate });

  // ── Step 5: Build ──
  log('━━━ Step 5: Build ━━━');
  const build = run(`node ${SCRIPTS}/generate.js`);
  pipelineReport.steps.push({ name: 'build', ...build });
  if (!build.success) { log('❌ Build упал'); process.exit(1); }

  // ── Step 6: Test ──
  log('━━━ Step 6: Test ━━━');
  const test = run(`npx jest --passWithNoTests 2>&1`);
  pipelineReport.steps.push({ name: 'test', ...test });

  // ── Step 7: Commit ──
  log('━━━ Step 7: Commit ━━━');
  const branchName = `data-update/${new Date().toISOString().split('T')[0]}`;
  run(`git checkout -b ${branchName}`);
  run(`git add src/data/ docs/plans/ src/static/ src/templates/`);
  run(`git commit -m "data: auto-update bank products via agent pipeline"`);
  log(`   Ветка создана: ${branchName}`);
  log('   ⚠️  Для публикации: git push origin ' + branchName + ' && создать PR');

  pipelineReport.endTime = new Date().toISOString();
  await fs.writeFile(
    path.join(__dirname, '../data/pipeline-report.json'),
    JSON.stringify(pipelineReport, null, 2)
  );

  log('✅ Pipeline завершён успешно!');
  log(`   Отчёт: src/data/pipeline-report.json`);
}

main().catch(err => {
  log(`💥 Фатальная ошибка: ${err.message}`);
  process.exit(1);
});
```

**Шаг 2: Проверь синтаксис**

Run: `node -c src/scripts/agent-pipeline.js`
Expected: "Syntax OK" (или нет вывода = OK)

**Шаг 3: Commit**

```bash
git add src/scripts/agent-pipeline.js
git commit -m "feat: add agent pipeline orchestrator for automated data updates"
```

---

### Task 5.5: Настроить cron для автоматического запуска

**Objective:** Пайплайн запускается автоматически раз в неделю (например, по понедельникам в 3:00).

**Files:**
- Modify: `.github/workflows/ci.yml` (добавить отдельный workflow)

**Шаг 1: Создай workflow для агентского пайплайна**

Create: `.github/workflows/agent-pipeline.yml`

```yaml
name: Agent Data Pipeline

on:
  schedule:
    - cron: '0 3 * * 1'  # Каждый понедельник в 3:00 UTC
  workflow_dispatch:       # Ручной запуск из UI

jobs:
  agent-pipeline:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Run Discovery Agent
        run: node src/scripts/agent-discover.js

      - name: Run Extraction Agent
        run: node src/scripts/agent-extract.js --limit 20

      - name: Run Merge Agent (dry-run first)
        run: node src/scripts/agent-merge.js --dry-run

      - name: Run Merge Agent
        run: node src/scripts/agent-merge.js

      - name: Validate data
        run: node src/scripts/validate-data.js

      - name: Build site
        run: node src/scripts/generate.js

      - name: Run tests
        run: npx jest --passWithNoTests

      - name: Commit changes
        run: |
          git config user.name "Agent Pipeline"
          git config user.email "agent@bank-select.ru"
          git checkout -b data-update/$(date +%Y-%m-%d)
          git add src/data/
          git diff --cached --quiet || git commit -m "data: weekly auto-update via agent pipeline"
          git push origin data-update/$(date +%Y-%m-%d)

      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v6
        with:
          title: "data: weekly product update"
          body: "Автоматическое обновление данных через Agent Pipeline"
          branch: data-update/${{ github.run_id }}
          base: main
```

**Шаг 2: Проверь синтаксис YAML**

Run: `ls -la .github/workflows/agent-pipeline.yml`
Expected: файл существует

**Шаг 3: Commit**

```bash
git add .github/workflows/agent-pipeline.yml
git commit -m "ci: add weekly agent pipeline workflow for automated data updates"
```

---

### Task 5.6: Добавить страницу "Последнее обновление" на сайт

**Objective:** Пользователь видит когда данные последний раз обновлялись и сколько продуктов в базе.

**Files:**
- Modify: `src/templates/index-page.html`
- Modify: `src/scripts/generate.js`

**Шаг 1: Добавь в generate.js передачу статистики**

В функции `generateIndexPage` добавь:

```javascript
const stats = {
  totalProducts: products.length,
  lastUpdated: new Date().toISOString().split('T')[0],
  categories: categories.length,
  banks: [...new Set(products.map(p => p.bankName))].length,
};
```

И передай в шаблон: `indexTemplate({ products, categories, stats, meta: {...} })`

**Шаг 2: Добавь в index-page.html блок статистики**

```html
<div class="stats-bar">
  <span>📊 {{stats.totalProducts}} продуктов</span>
  <span>🏦 {{stats.banks}} банков</span>
  <span>📂 {{stats.categories}} категорий</span>
  <span>🔄 Обновлено: {{stats.lastUpdated}}</span>
</div>
```

**Шаг 3: Собери и проверь**

Run: `npm run build && grep -q "stats-bar" dist/index.html && echo "OK"`
Expected: "OK"

**Шаг 4: Commit**

```bash
git add src/templates/index-page.html src/scripts/generate.js
git commit -m "feat: add data freshness stats bar to homepage"
```

---

## Чеклист финальной проверки

После выполнения всех задач:

```bash
# Полная сборка
npm run build

# Unit-тесты
npm run test:jest

# Валидация данных
npm run validate

# E2E-тесты (нужен запущенный сервер)
npm run serve &
npx playwright test src/tests/homepage.test.js
kill %1

# Деплой
npm run publish
```

---

## Приоритет выполнения

| Приоритет | Фаза | Оценка |
|-----------|------|--------|
| 🔴 Высокий | 1.1, 1.2, 1.3 (CI/CD + тесты) | ~1 ч |
| 🟡 Средний | 2.1, 2.2, 2.3 (UI сравнения) | ~1.5 ч |
| 🟢 Низкий | 3.1, 3.2 (данные), 4.1, 4.2 (допы) | ~1.5 ч |
| 🔵 Стратегический | 5.1–5.6 (агентская система) | ~3 ч |
