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
            'products', 'category', 'compare', 'css', 'img'
        ].map(dir => fs.mkdir(path.join(distDir, dir), { recursive: true })));

        // Загрузка шаблонов
        const templateFiles = await Promise.all(templates.map(file =>
            fs.readFile(path.join(baseDir, 'templates', file), 'utf-8')
        ));

        const templateMap = templates.reduce((acc, file, index) => {
            acc[file] = Handlebars.compile(templateFiles[index]);
            return acc;
        }, {});

        // Регистрация частичных шаблонов
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
    const copyFiles = async (srcDir, destDir) => {
        const files = await fs.readdir(srcDir);
        await Promise.all(files.map(async file => {
            const src = path.join(srcDir, file);
            const dest = path.join(destDir, file);
            await fs.mkdir(path.dirname(dest), { recursive: true });
            await fs.copyFile(src, dest);
        }));
    };

    await Promise.all([
        copyFiles(path.join(baseDir, 'img/bank-logos'), path.join(distDir, 'img/bank-logos')),
        copyFiles(path.join(baseDir, 'static'), distDir),
        fs.cp(path.join(baseDir, 'styles/theme.css'), path.join(distDir, 'css/theme.css'))
    ]);
}

async function generateSitemap(products, categories, distDir) {
    const baseUrl = 'https://your-site.ru';
    const urls = [
        `${baseUrl}/`,
        ...products.map(product => `${baseUrl}/products/${product.id}.html`),
        ...categories.map(category => `${baseUrl}/category/${category.id}.html`)
    ];

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.map(url => `
    <url>
        <loc>${url}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    `).join('')}
</urlset>`;

    await fs.writeFile(path.join(distDir, 'sitemap.xml'), sitemapXml);
}

async function generateRobotsTXT(distDir) {
    const robotsTxt = `
User-Agent: *
Allow: *.html
Allow: *.css
Allow: *.js
Allow: *.jpeg
Allow: *.jpg
Allow: *.JPG
Allow: *.png
Allow: *.svg
Allow: *.webp
Sitemap: https://bank-select.ru/sitemap.xml
`;

    await fs.writeFile(path.join(distDir, 'robots.txt'), robotsTxt);
    await fs.writeFile(path.join(distDir, 'CNAME'), 'bank-select.ru');
}

main().catch(console.error);