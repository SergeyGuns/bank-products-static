/**
 * Основной скрипт генерации статического сайта банковских продуктов
 * Обновлен для поддержки partials и улучшенной обработки данных
 */

const fs = require('fs').promises;
const path = require('path');
const Handlebars = require('handlebars');

// Регистрация хелперов
Handlebars.registerHelper('add', (a, b) => a + b);
Handlebars.registerHelper('isArray', value => Array.isArray(value));
Handlebars.registerHelper('length', arr => Array.isArray(arr) ? arr.length : 0);
// Comparison helpers
Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('ne', (a, b) => a !== b);
Handlebars.registerHelper('gt', (a, b) => a > b);
Handlebars.registerHelper('gte', (a, b) => a >= b);
Handlebars.registerHelper('lt', (a, b) => a < b);
Handlebars.registerHelper('lte', (a, b) => a <= b);
Handlebars.registerHelper('and', (a, b) => a && b);
Handlebars.registerHelper('or', (a, b) => a || b);
Handlebars.registerHelper('not', a => !a);

async function main() {
    try {
        const baseDir = path.join(__dirname, '../');
        const distDir = path.join(__dirname, '../../dist');

        // Чтение данных
        const templatesDir = path.join(baseDir, 'templates');
        
        // Рекурсивное чтение шаблонов из подпапок
        const readTemplatesRecursively = async (dir, prefix = '') => {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            let files = [];
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
                if (entry.isDirectory()) {
                    const subFiles = await readTemplatesRecursively(fullPath, relPath);
                    files = files.concat(subFiles);
                } else {
                    files.push(relPath);
                }
            }
            return files;
        };
        
        const [products, categories, templates] = await Promise.all([
            fs.readFile(path.join(baseDir, 'data/products.json'), 'utf-8'),
            fs.readFile(path.join(baseDir, 'data/categories.json'), 'utf-8'),
            readTemplatesRecursively(templatesDir)
        ]);

        const { products: productList } = JSON.parse(products);
        const { categories: categoryList } = JSON.parse(categories);

        // Группировка продуктов по типу
        const groupedProducts = productList.reduce((acc, product) => {
            (acc[product.type] = acc[product.type] || []).push(product);
            return acc;
        }, {});

        // Очистка dist/ от старых файлов
        const cleanDir = async (dir) => {
            const items = await fs.readdir(dir, { withFileTypes: true });
            for (const item of items) {
                const fullPath = path.join(dir, item.name);
                if (item.isDirectory()) {
                    await cleanDir(fullPath);
                    // Удаляем пустые директории
                    const remaining = await fs.readdir(fullPath);
                    if (remaining.length === 0) {
                        await fs.rmdir(fullPath);
                    }
                } else {
                    await fs.unlink(fullPath);
                }
            }
        };
        
        try {
            await cleanDir(distDir);
        } catch (e) {
            // distDir может не существовать
        }

        // Создание директорий
        await Promise.all([
            'products', 'category', 'compare', 'css', 'img', 'articles', 'bank', 'calculator', 'compare'
        ].map(dir => fs.mkdir(path.join(distDir, dir), { recursive: true })));

        // Загрузка шаблонов
        const templateMap = {};
        for (const file of templates) {
            const filePath = path.join(baseDir, 'templates', file);
            const stat = await fs.stat(filePath);

            if (stat.isFile()) {
                const content = await fs.readFile(filePath, 'utf-8');
                templateMap[file] = Handlebars.compile(content);
            } else if (stat.isDirectory()) {
                // Обработка файлов в поддиректориях
                const subFiles = await fs.readdir(filePath);
                for (const subFile of subFiles) {
                    if (path.extname(subFile) === '.html') {
                        const subFilePath = path.join(filePath, subFile);
                        const subContent = await fs.readFile(subFilePath, 'utf-8');
                        templateMap[subFile] = Handlebars.compile(subContent);
                    }
                }
            }
        }

        // Загрузка и регистрация частичных шаблонов из директории partials
        const partialsDir = path.join(baseDir, 'templates', 'partials');
        try {
            const partialsFiles = await fs.readdir(partialsDir);
            for (const partialFile of partialsFiles) {
                if (path.extname(partialFile) === '.html') {
                    const partialName = path.basename(partialFile, '.html');
                    const partialContent = await fs.readFile(path.join(partialsDir, partialFile), 'utf8');
                    Handlebars.registerPartial(partialName, partialContent);
                    console.log(`Зарегистрирован partial: ${partialName}`);
                }
            }
        } catch (error) {
            console.log('Директория partials не найдена или пуста, пропускаем регистрацию частичных шаблонов');
        }

        // Регистрация основного layout
        Handlebars.registerPartial('layout', templateMap['layout.html']);

        // Генерация страниц
        await Promise.all([
            generateProductPages(productList, templateMap['product-page.html'], distDir),
            generateCategoryPages(categoryList, productList, templateMap['category-page.html'], templateMap['compare-page.html'], distDir),
            generateIndexPage(productList, categoryList, templateMap['index-page.html'], distDir),
            generateStaticPages(templateMap, distDir),
            copyStaticFiles(baseDir, distDir),
            generateSitemap(productList, categoryList, distDir),
            generateRobotsTXT(distDir)
        ]);

        console.log('Сайт успешно сгенерирован!');
    } catch (error) {
        console.error('Ошибка во время генерации:', error);
        process.exit(1);
    }
}

async function generateProductPages(products, productTemplate, distDir) {
    const typeLabels = {
        'credit-cards': 'Кредитные карты',
        'debit-cards': 'Дебетовые карты',
        'mortgage': 'Ипотека',
        'consumer-loans': 'Кредиты',
        'deposits': 'Вклады',
        'auto-loans': 'Автокредиты',
        'business-loans': 'Бизнес-кредиты',
        'credits': 'Кредиты',
        'digital-services': 'Цифровые сервисы',
        'insurance-products': 'Страхование',
        'investment-products': 'Инвестиции',
        'savings': 'Сбережения',
    };
    const typeSchema = {
        'credit-cards': 'CreditCard',
        'debit-cards': 'PaymentCard',
        'mortgage': 'MortgageLoan',
        'consumer-loans': 'LoanOrCredit',
        'deposits': 'DepositAccount',
        'auto-loans': 'LoanOrCredit',
        'business-loans': 'LoanOrCredit',
        'credits': 'LoanOrCredit',
        'digital-services': 'Service',
        'insurance-products': 'InsurancePolicy',
        'investment-products': 'InvestmentFund',
        'savings': 'DepositAccount',
    };
    await Promise.all(products.map(product => {
        const enriched = {
            ...product,
            typeLabel: typeLabels[product.type] || 'Продукты',
            schemaType: typeSchema[product.type] || 'Product',
        };
        return fs.writeFile(
            path.join(distDir, 'products', `${product.id}.html`),
            productTemplate({ product: enriched, meta: product.meta, currentPath: `/products/${product.id}.html` })
        );
    }));
}

async function generateCategoryPages(categories, products, categoryTemplate, compareTemplate, distDir) {
    await Promise.all(categories.map(async category => {
        const categoryProducts = products.filter(p => p.type === category.id);
        const banks = [...new Set(categoryProducts.map(p => p.bankName))].sort((a, b) => a.localeCompare(b, 'ru'));
        const categoryHtml = categoryTemplate({ category, products: categoryProducts, banks, meta: category.meta });

        await fs.writeFile(path.join(distDir, 'category', `${category.id}.html`), categoryHtml);

        if (categoryProducts.length > 0) {
            const parametersList = {
                main: Object.keys(categoryProducts[0].parameters?.main || {}),
                fees: Object.keys(categoryProducts[0].parameters?.fees || {}),
                requirements: Object.keys(categoryProducts[0].parameters?.requirements || {})
            };

            if (['credit-cards', 'debit-cards'].includes(category.id) && categoryProducts[0].parameters?.cashback) {
                parametersList.cashback = Object.keys(categoryProducts[0].parameters.cashback);
            }

            const compareHtml = compareTemplate({
                category,
                products: categoryProducts,
                parametersList,
                isCreditOrDebitCard: ['credit-cards', 'debit-cards'].includes(category.id),
                compareScripts: true,
                meta: {
                    title: `Сравнение ${category.title} | Выбор лучших предложений`,
                    description: `Сравните ${category.title} от разных банков и выберите самое выгодное предложение`
                }
            });

            await fs.writeFile(path.join(distDir, 'compare', `${category.id}.html`), compareHtml);
        }
    }));
}

async function generateIndexPage(products, categories, indexTemplate, distDir) {
    const stats = {
      totalProducts: products.length,
      lastUpdated: new Date().toISOString().split('T')[0],
      categories: categories.length,
      banks: [...new Set(products.map(p => p.bankName))].length,
    };

    const indexHtml = indexTemplate({
        products,
        categories,
        stats,
        meta: {
            title: 'Банковские продукты | Главная',
            description: 'Лучшие банковские продукты - кредитные карты, дебетовые карты и кредиты'
        }
    });

    await fs.writeFile(path.join(distDir, 'index.html'), indexHtml);
}

async function generateStaticPages(templateMap, distDir) {
    const staticPages = [
        { template: templateMap['404.html'], name: '404.html', meta: { title: '404 - Страница не найдена', description: 'Запрашиваемая страница не существует' } },
        { template: templateMap['add.html'], name: 'add.html', meta: { title: 'Добавление продукта', description: 'Страница для добавления нового продукта' } },
        { template: templateMap['calculator.html'], name: 'calculator.html', meta: { title: 'Кредитный калькулятор', description: 'Кредитный калькулятор' } },
        { template: templateMap['about.html'], name: 'about.html', meta: { title: 'О проекте | Bank-Select', description: 'Информация о сервисе Bank-Select' } },
        { template: templateMap['contacts.html'], name: 'contacts.html', meta: { title: 'Контакты | Bank-Select', description: 'Свяжитесь с нами' } },
        { template: templateMap['privacy.html'], name: 'privacy.html', meta: { title: 'Политика конфиденциальности | Bank-Select', description: 'Политика конфиденциальности' } },
        { template: templateMap['articles/credit-chose.html'], name: 'articles/credit-chose.html', meta: { title: 'Как правильно выбрать кредит', description: 'Рекомендации по выбору кредита' } },
        { template: templateMap['articles/credit-card-chose.html'], name: 'articles/credit-card-chose.html', meta: { title: 'Как выбрать кредитную карту', description: 'Рекомендации по выбору кредитной карты' } },
        { template: templateMap['articles/lending-intro.html'], name: 'articles/lending-intro.html', meta: { title: 'Льготное кредитование: как государство платит за ваш заём', description: 'Разбор механизма субсидирования ставок, законодательная база и ключевые критерии' } },
        { template: templateMap['articles/mortgage-2026.html'], name: 'articles/mortgage-2026.html', meta: { title: 'Семейная и специализированная ипотека в 2026 году', description: 'Обзор программ льготной ипотеки: семейная, сельская, ИТ, арктическая' } },
        { template: templateMap['articles/business-1764.html'], name: 'articles/business-1764.html', meta: { title: 'Программа 1764: льготные кредиты для бизнеса', description: 'Динамическая ставка для МСП, лимиты, подпрограммы, примеры расчёта' } },
        { template: templateMap['articles/it-credit-469.html'], name: 'articles/it-credit-469.html', meta: { title: 'Льготные кредиты для ИТ-сектора и стартапов под 3%', description: 'Программа Взлёт: кредиты для малых технологических компаний' } },
        { template: templateMap['articles/apk-1528.html'], name: 'articles/apk-1528.html', meta: { title: 'Программа 1528: льготные кредиты для сельского хозяйства', description: 'Субсидированные кредиты для сельхозпроизводителей' } },
        { template: templateMap['articles/umbrella-guarantees.html'], name: 'articles/umbrella-guarantees.html', meta: { title: 'Зонтичные поручительства: кредит без залога', description: 'Государственные гарантии для МСП с недостаточным обеспечением' } },
    ];

    await Promise.all(staticPages.map(({ template, name, meta }) =>
        fs.writeFile(path.join(distDir, name), template({ meta }))
    ));
}

async function copyStaticFiles(baseDir, distDir) {
    try {
        await fs.cp(path.join(baseDir, 'static'), distDir, { recursive: true });
    } catch (error) {
        console.log('Директория static не найдена, пропускаем копирование');
    }
}

async function generateSitemap(products, categories, distDir) {
    const baseUrl = 'https://bank-select.ru';
    const urls = [
        `${baseUrl}/`,
        ...products.map(p => `${baseUrl}/products/${p.id}.html`),
        ...categories.map(c => `${baseUrl}/category/${c.id}.html`),
        ...categories.filter(c => products.some(p => p.type === c.id)).map(c => `${baseUrl}/compare/${c.id}.html`)
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;

    await fs.writeFile(path.join(distDir, 'sitemap.xml'), sitemap);
}

async function generateRobotsTXT(distDir) {
    const robots = `User-Agent: *
Allow: /
Sitemap: https://bank-select.ru/sitemap.xml`;

    await fs.writeFile(path.join(distDir, 'robots.txt'), robots);
}

if (require.main === module) {
    main();
}

module.exports = { main };