const fs = require('fs').promises;
const path = require('path');
const Handlebars = require('handlebars');
const glob = require('glob-promise');
// Регистрируем все необходимые хелперы
Handlebars.registerHelper('add', function(a, b) {
    return a + b;
});

Handlebars.registerHelper('isArray', function(value) {
    return Array.isArray(value);
});

Handlebars.registerHelper('length', function(arr) {
    return Array.isArray(arr) ? arr.length : 0;
});

async function main() {
    try {
        // Получаем данные из Firebase
        const products = JSON.parse(
            await fs.readFile(path.join(__dirname, '../data/products.json'), 'utf-8')
        ).products;
        // Группируем продукты по типу
        const groupedProducts = products.reduce((acc, product) => {
            if (!acc[product.type]) {
                acc[product.type] = [];
            }
            acc[product.type].push(product);
            return acc;
        }, {});

        // Создаем все необходимые директории
        await fs.mkdir(path.join(__dirname, '../../dist'), { recursive: true });
        await fs.mkdir(path.join(__dirname, '../../dist/products'), { recursive: true });
        await fs.mkdir(path.join(__dirname, '../../dist/category'), { recursive: true });
        await fs.mkdir(path.join(__dirname, '../../dist/compare'), { recursive: true });
        await fs.mkdir(path.join(__dirname, '../../dist/css'), { recursive: true });
        await fs.mkdir(path.join(__dirname, '../../dist/img'), { recursive: true });

        // Загрузка данных
        const categories = JSON.parse(
            await fs.readFile(path.join(__dirname, '../data/categories.json'), 'utf-8')
        );

        // Загрузка всех шаблонов
        const layout = await fs.readFile(
            path.join(__dirname, '../templates/layout.html'),
            'utf-8'
        );
        const productTemplate = await fs.readFile(
            path.join(__dirname, '../templates/product-page.html'),
            'utf-8'
        );
        const categoryTemplate = await fs.readFile(
            path.join(__dirname, '../templates/category-page.html'),
            'utf-8'
        );
        const indexTemplate = await fs.readFile(
            path.join(__dirname, '../templates/index-page.html'),
            'utf-8'
        );
        const compareTemplate = await fs.readFile(
            path.join(__dirname, '../templates/compare-page.html'),
            'utf-8'
        );
        const notFoundTemplate = await fs.readFile(
            path.join(__dirname, '../templates/404.html'),
            'utf-8'
        );
        const addProductTemplate = await fs.readFile(
            path.join(__dirname, '../templates/add.html'),
            'utf-8'
        );

        // Регистрация частичных шаблонов
        Handlebars.registerPartial('layout', layout);

        // Компи ляция всех шаблонов
        const compiledProductTemplate = Handlebars.compile(productTemplate);
        const compiledCategoryTemplate = Handlebars.compile(categoryTemplate);
        const compiledIndexTemplate = Handlebars.compile(indexTemplate);
        const compiledCompareTemplate = Handlebars.compile(compareTemplate);
        const compiled404Template = Handlebars.compile(notFoundTemplate);
        const compiledAddProductTemplate = Handlebars.compile(addProductTemplate);

        // Генерация страниц продуктов
        for (const product of products) {
            const html = compiledProductTemplate({
                product,
                meta: product.meta
            });

            await fs.writeFile(
                path.join(__dirname, `../../dist/products/${product.id}.html`),
                html
            );
        }

        // Генерация страниц категорий и сравнения
        for (const category of categories.categories) {
            const categoryProducts = products.filter(
                p => p.type === category.id
            );

            // Генерация страницы категории
            const categoryHtml = compiledCategoryTemplate({
                category,
                products: categoryProducts,
                meta: category.meta
            });

            await fs.writeFile(
                path.join(__dirname, `../../dist/category/${category.id}.html`),
                categoryHtml
            );

            // Генерация страницы сравнения
            if (categoryProducts.length > 0) {
                const parametersList = {
                    main: Object.keys(categoryProducts[0].parameters?.main || {}),
                    fees: Object.keys(categoryProducts[0].parameters?.fees || {}),
                    requirements: Object.keys(categoryProducts[0].parameters?.requirements || {})
                };

                if ((category.id === 'credit-cards' || category.id === 'debit-cards') &&
                    categoryProducts[0].parameters?.cashback) {
                    parametersList.cashback = Object.keys(categoryProducts[0].parameters.cashback);
                }

                const compareHtml = compiledCompareTemplate({
                    products: categoryProducts,
                    parametersList,
                    isCreditOrDebitCard: category.id === 'credit-cards' || category.id === 'debit-cards',
                    meta: {
                        title: `Сравнение ${category.title} | Выбор лучших предложений`,
                        description: `Сравните ${category.title} от разных банков и выберите самое выгодное предложение`
                    }
                });

                await fs.writeFile(
                    path.join(__dirname, `../../dist/compare/${category.id}.html`),
                    compareHtml
                );
            }
        }

        // Генерация главной страницы
        const indexHtml = compiledIndexTemplate({
            products,
            categories: categories.categories,
            meta: {
                title: 'Банковские продукты | Главная',
                description: 'Лучшие банковские продукты - кредитные карты, дебетовые карты и кредиты'
            }
        });

        await fs.writeFile(
            path.join(__dirname, '../../dist/index.html'),
            indexHtml
        );

        // Генерация 404 страницы
        const html404 = compiled404Template({
            meta: {
                title: '404 - Страница не найдена',
                description: 'Запрашиваемая страница не существует'
            }
        });

        await fs.writeFile(
            path.join(__dirname, '../../dist/404.html'),
            html404
        );

        // Генерация sitemap
        const sitemap = generateSitemap(products, categories.categories);
        await fs.writeFile(
            path.join(__dirname, '../../dist/sitemap.xml'),
            sitemap
        );
        // Генерация robots.txt
        const robotsTXT = generateRobotsTXT();
        await fs.writeFile(
            path.join(__dirname, '../../dist/robots.txt'),
            robotsTXT
        );

        // Копирование img файлов
        let files = []
        try {
          files = await fs.readdir(path.join(__dirname,'../img/bank-logos'))
        for (const entry of files) {
          const src = path.join(__dirname, '../img/bank-logos/'+entry);
          const dest = path.join(__dirname, '../../dist/img/bank-logos', entry);
          await fs.mkdir(path.dirname(dest), { recursive: true });
          await fs.copyFile(src, dest);
        }
        } catch(e) {
          console.log(e)
        }

        // Копирование CSS файла
        await fs.cp(
          path.join(__dirname, '../styles/theme.css'),
          path.join(__dirname, '../../dist/css/theme.css')
        )

        // Генерация страницы отладки
        const debugHtml = compiledAddProductTemplate({
            meta: {
                title: 'Отладка - Добавление продукта',
                description: 'Страница для добавления нового продукта'
            }
        });

        await fs.writeFile(
            path.join(__dirname, '../../dist/add.html'),
            debugHtml
        );

        console.log('Сайт успешно сгенерирован!');
    } catch (error) {
        console.error('Error during generation:', error);
        process.exit(1);
    }
}

function generateSitemap(products, categories) {
    const baseUrl = 'https://your-site.ru';
    let urls = [];

    // Добавляем главную страницу
    urls.push(`${baseUrl}/`);

    // Добавляем страницы продуктов
    products.forEach(product => {
        urls.push(`${baseUrl}/products/${product.id}.html`);
    });

    // Добавляем страницы категорий
    categories.forEach(category => {
        urls.push(`${baseUrl}/category/${category.id}.html`);
    });

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

    return sitemapXml;
}
function generateRobotsTXT() {
  return `
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
  `
}
main().catch(console.error);
