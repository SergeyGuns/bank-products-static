/**
 * Улучшенный скрипт генерации статического сайта банковских продуктов
 * Включает регистрацию partials из директории partials
 */

const fs = require('fs').promises;
const path = require('path');
const Handlebars = require('handlebars');

// Регистрация хелперов
Handlebars.registerHelper('add', (a, b) => a + b);
Handlebars.registerHelper('isArray', value => Array.isArray(value));
Handlebars.registerHelper('length', arr => Array.isArray(arr) ? arr.length : 0);

async function main() {
    try {
        const baseDir = path.join(__dirname, '../');
        const distDir = path.join(__dirname, '../../dist');

        // Чтение данных
        const [products, categories, templates] = await Promise.all([
            fs.readFile(path.join(baseDir, 'data/products.json'), 'utf-8'),
            fs.readFile(path.join(baseDir, 'data/categories.json'), 'utf-8'),
            fs.readdir(path.join(baseDir, 'templates'))
        ]);

        const { products: productList } = JSON.parse(products);
        const { categories: categoryList } = JSON.parse(categories);

        // Группировка продуктов по типу
        const groupedProducts = productList.reduce((acc, product) => {
            (acc[product.type] = acc[product.type] || []).push(product);
            return acc;
        }, {});

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
    await Promise.all(products.map(product =>
        fs.writeFile(path.join(distDir, 'products', `${product.id}.html`), productTemplate({ product, meta: product.meta }))
    ));
}

async function generateCategoryPages(categories, products, categoryTemplate, compareTemplate, distDir) {
    await Promise.all(categories.map(async category => {
        const categoryProducts = products.filter(p => p.type === category.id);
        const categoryHtml = categoryTemplate({ category, products: categoryProducts, meta: category.meta });

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
                products: categoryProducts,
                parametersList,
                isCreditOrDebitCard: ['credit-cards', 'debit-cards'].includes(category.id),
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
    const indexHtml = indexTemplate({
        products,
        categories,
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
        { template: templateMap['calculator.html'], name: 'calculator.html', meta: { title: 'Кредитный калькулятор', description: 'Кредитный калькулятор' } }
    ];

    await Promise.all(staticPages.map(({ template, name, meta }) =>
        fs.writeFile(path.join(distDir, name), template({ meta }))
    ));
}

async function copyStaticFiles(baseDir, distDir) {
    const staticDir = path.join(baseDir, 'static');
    try {
        await fs.cp(staticDir, distDir, { recursive: true });
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