# Bank Products Static

Статический сайт для сравнения банковских продуктов России.

## Возможности

- Сравнение кредитных карт, дебетовых карт, кредитов
- Страницы категорий с таблицами сравнения
- Кредитный калькулятор
- SEO-оптимизированные страницы (sitemap, robots.txt, schema.org)

## Быстрый старт

```bash
npm install
npm run build     # Генерация в dist/
npm run dev       # Сборка + локальный сервер на :3000
npm run serve     # Только сервер на :3000
npm run test      # Все тесты
```

## Структура

```
src/
  data/       # JSON данные о продуктах и категориях
  templates/  # Handlebars шаблоны
  scripts/    # Скрипты генерации, скрапинга, утилиты
  static/     # Favicon, логотип, manifest
  tests/      # Playwright e2e-тесты
dist/         # Сгенерированный сайт (результат сборки)
```

## Деплой

Деплой автоматический через GitHub Actions при пуше в `master`.

### Настройка GitHub Pages (один раз)

1. Открой **Settings → Pages** в репозитории
2. **Source**: GitHub Actions
3. При первом деплое workflow создаст окружение `github-pages`

### Кастомный домен (bank-select.ru)

1. В настройках Pages введи `bank-select.ru`
2. Добавь DNS записи:
   - **A**: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - **CNAME**: `sergeyguns.github.io`

### Локальная разработка

```bash
npm install
npm run dev       # Сборка + сервер на :9999
npm run build     # Только сборка в dist/
npm run test      # Все тесты (Jest + Playwright)
```

### Добавление графиков на страницы

Используется Chart.js (CDN). Пример:

```html
<!-- 1. Подключи Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>

<!-- 2. Добавь canvas -->
<div class="chart-container" style="position:relative;height:300px;">
    <canvas id="myChart"></canvas>
</div>

<!-- 3. Инициализируй график -->
<script>
new Chart(document.getElementById('myChart'), {
    type: 'bar',
    data: {
        labels: ['A', 'B', 'C'],
        datasets: [{
            label: 'Данные',
            data: [10, 20, 30],
            backgroundColor: 'rgba(30, 64, 175, 0.8)',
            borderRadius: 6
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false
    }
});
</script>
```

Подробнее см. скилл `chartjs`.

## Лицензия
MIT
