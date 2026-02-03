# Git workflow для управления контентом проекта bank-products-static

## Общие принципы

Проект использует Git для управления контентом (JSON файлы с информацией о банковских продуктах) вместо CMS. Это обеспечивает:

- Прозрачность изменений
- Возможность аудита всех изменений
- Контроль версий
- Возможность отката изменений
- Совместную работу с проверкой качества

## Структура репозитория

```
main branch (production) - стабильная версия сайта
├── develop branch - основная ветка разработки
└── feature branches - ветки для новых функций и контента
    └── content branches - ветки для добавления/изменения контента
```

## Работа с контентом

### 1. Добавление нового продукта

#### Процесс:
1. Создать новую ветку от `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b content/add-new-product-bankname-producttype
   ```

2. Добавить JSON файл с информацией о продукте:
   - В директорию `src/data/pdfs/[product-type]/`
   - С именем `[bank-name]-[product-type]-[unique-id].json`
   - Соблюдая структуру данных проекта

3. Запустить автоматическую проверку:
   ```bash
   npm run validate
   # или
   node scripts/validate.js
   ```

4. Запустить проверку через LLM (если доступна):
   ```bash
   npm run llm-validate
   # или
   node scripts/llm-validation-pipeline.js
   ```

5. Зафиксировать изменения:
   ```bash
   git add .
   git commit -m "feat(content): add new product for [Bank Name] [Product Type]"
   ```

6. Отправить ветку в удаленный репозиторий:
   ```bash
   git push origin content/add-new-product-bankname-producttype
   ```

7. Создать Pull Request в GitHub:
   - Из ветки `content/add-new-product-bankname-producttype` в `develop`
   - Указать тип изменений: `content-add`
   - Добавить описание продукта и источники информации
   - Назначить ревьюверов

#### Шаблон коммита:
```
feat(content): add new product for [Bank Name] [Product Type]

- Added JSON file with product information
- Verified against official bank website
- Checked formatting and structure

Closes #[issue-number]
```

### 2. Обновление существующего продукта

#### Процесс:
1. Создать новую ветку от `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b content/update-product-[id]
   ```

2. Обновить соответствующий JSON файл:
   - Обновить параметры продукта
   - Указать дату обновления
   - Указать источник новой информации

3. Запустить проверки:
   ```bash
   npm run validate
   npm run llm-validate
   ```

4. Зафиксировать изменения:
   ```bash
   git add .
   git commit -m "fix(content): update product [Product Name] with new parameters"
   ```

5. Отправить ветку и создать Pull Request:
   ```bash
   git push origin content/update-product-[id]
   ```

#### Шаблон коммита:
```
fix(content): update product [Product Name] with new parameters

- Updated interest rate from X% to Y%
- Changed fee structure
- Verified against official bank website as of [date]

Closes #[issue-number]
```

### 3. Удаление продукта

#### Процесс:
1. Создать ветку:
   ```bash
   git checkout -b content/remove-product-[id]
   ```

2. Удалить JSON файл:
   ```bash
   git rm src/data/pdfs/[product-type]/[product-file].json
   ```

3. Обновить связанные файлы (если необходимо):
   - Ссылки на продукт в других JSON файлах
   - Статьи или документация

4. Запустить проверки:
   ```bash
   npm run validate
   npm run build
   ```

5. Зафиксировать изменения:
   ```bash
   git commit -m "feat(content): remove discontinued product [Product Name]"
   ```

#### Шаблон коммита:
```
feat(content): remove discontinued product [Product Name]

- Removed JSON file for discontinued product
- Product no longer offered by bank as of [date]
- Updated related references

Closes #[issue-number]
```

## Автоматические проверки

### 1. Pre-commit hooks

#### Установка:
```bash
npm install husky --save-dev
npx husky install
npx husky add .husky/pre-commit "npm run validate"
```

#### Что проверяется:
- Валидация JSON файлов
- Проверка структуры данных
- Проверка обязательных полей
- Проверка формата значений

### 2. GitHub Actions

#### Проверки при Pull Request:
```yaml
# .github/workflows/content-validation.yml
name: Content Validation

on:
  pull_request:
    branches: [ develop, main ]

jobs:
  validate:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Validate JSON structure
      run: npm run validate
      
    - name: Check for broken links
      run: npm run test
      
    - name: LLM validation (if available)
      run: |
        if [ -f "scripts/llm-validation-pipeline.js" ]; then
          npm run llm-validate
        fi
        
    - name: Build site
      run: npm run build
```

#### Проверки при Merge в main:
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build site
      run: npm run build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

## Роли и ответственность

### 1. Контрибьюторы
- Могут создавать ветки и отправлять Pull Requests
- Отвечают за качество своих изменений
- Должны проходить автоматические проверки

### 2. Ревьюверы
- Проверяют Pull Requests на предмет:
  - Качества данных
  - Соответствия структуре проекта
  - Актуальности информации
  - Форматирования
- Имеют право Approve или Request Changes

### 3. Мейнтейнеры
- Могут мерджить Pull Requests
- Отвечают за общее качество контента
- Могут принимать решения о спорных изменениях
- Отвечают за разрешение конфликтов

## Шаблоны для Pull Requests

### Шаблон для добавления продукта:
```markdown
## Что было добавлено?

- [Описание добавленного продукта]
- [Банк-эмитент]
- [Тип продукта]

## Источник информации

- [Ссылка на официальную информацию]
- [Дата проверки]

## Проверки

- [ ] Валидация JSON пройдена
- [ ] LLM проверка пройдена
- [ ] Информация актуальна
- [ ] Формат соответствует требованиям
```

### Шаблон для обновления продукта:
```markdown
## Что было обновлено?

- [Описание изменений]
- [Причина изменений]

## Источник новой информации

- [Ссылка на официальную информацию]
- [Дата проверки]

## Проверки

- [ ] Валидация JSON пройдена
- [ ] LLM проверка пройдена
- [ ] Информация актуальна
- [ ] Формат соответствует требованиям
```

## Работа с версиями данных

### 1. Версионирование через имена файлов

Для отслеживания изменений во времени используются:
- Имена файлов с датами: `bank-product-2023-12-01.json`
- Директории с годами: `src/data/pdfs/2023/bank-product.json`

### 2. История изменений

- Все изменения фиксируются в Git
- Для каждого продукта можно посмотреть историю изменений
- Используется `git log --follow` для отслеживания истории файла

### 3. Архивация устаревших данных

- Устаревшие версии продуктов перемещаются в архивные директории
- Создается редирект на актуальную версию
- Обновляется информация о доступности продукта

## Часто используемые команды

```bash
# Проверить статус
git status

# Добавить изменения
git add .

# Сделать коммит
git commit -m "type(scope): description"

# Отправить в удаленный репозиторий
git push origin branch-name

# Обновить локальную ветку develop
git checkout develop
git pull origin develop

# Создать новую ветку для работы
git checkout -b feature/new-feature

# Обновить свою рабочую ветку из develop
git checkout feature/new-feature
git rebase develop

# Проверить историю изменений файла
git log --follow -- path/to/file.json

# Посмотреть изменения в файле
git diff HEAD~1 path/to/file.json
```

## Рекомендации

1. **Маленькие коммиты** - каждый коммит должен содержать логически связанную группу изменений
2. **Четкие сообщения** - использовать стандартизированные сообщения коммитов
3. **Проверка перед пушем** - всегда запускать локальные проверки перед отправкой
4. **Описание PR** - подробно описывать изменения в Pull Request
5. **Рецензирование** - дожидаться одобрения от других участников перед мерджем
6. **Регулярное обновление** - регулярно обновлять свою ветку из develop