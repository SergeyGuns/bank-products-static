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

```bash
npm run publish   # Сборка + push в gh-pages ветку
```

## Лицензия
MIT
