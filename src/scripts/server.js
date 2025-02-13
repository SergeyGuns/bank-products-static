const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 9999;

// Статические файлы из папки dist
app.use(express.static(path.join(__dirname, '../../dist')));

// Обработка HTML файлов без расширения
app.get('*', (req, res, next) => {
    if (!req.url.includes('.')) {
        res.sendFile(path.join(__dirname, '../../dist', req.url + '.html'));
    } else {
        next();
    }
});

// Обработка 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../../dist/404.html'));
});

// Добавляем маршрут для страницы отладки
app.get('/debug', (req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/debug.html'));
});

app.post('/api/products', async (req, res) => {
    try {
        await sheetsAPI.init();
        await sheetsAPI.addProduct(req.body);
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving to sheets:', error);
        res.status(500).json({ error: error.message });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`
    🚀 Сервер запущен на http://localhost:${PORT}

    Доступные страницы:
    - Главная: http://localhost:${PORT}
    - Категории: http://localhost:${PORT}/category/credit-cards
    - Продукты: http://localhost:${PORT}/products/[id-продукта]
    - Сравнение: http://localhost:${PORT}/compare/credit-cards

    Для остановки сервера нажмите Ctrl+C
    `);
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Что-то пошло не так!');
});
