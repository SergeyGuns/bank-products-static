const { test, expect } = require('@playwright/test');

test.describe('Add Page Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/add');
        // Очищаем localStorage перед каждым тестом
        await page.evaluate(() => localStorage.clear());
        // Увеличиваем время ожидания для всех тестов
        test.slow();
    });


    test('базовые поля формы работают корректно', async ({ page }) => {
        // Заполняем основные поля
        await page.selectOption('select[name="type"]', 'credit-cards');
        await page.fill('input[name="id"]', 'test-card');
        await page.fill('input[name="title"]', 'Тестовая карта');
        await page.fill('input[name="bankName"]', 'Тест Банк');
        await page.fill('input[name="imageUrl"]', '/images/test.jpg');
        await page.fill('input[name="referralLink"]', 'refferal test link');
        await page.fill('textarea[name="shortDescription"]', 'Краткое описание');
        await page.fill('textarea[name="fullDescription"]', 'Полное описание');

        // Проверяем, что значения сохранились
        await expect(page.locator('select[name="type"]')).toHaveValue('credit-cards');
        await expect(page.locator('input[name="id"]')).toHaveValue('test-card');
        await expect(page.locator('input[name="title"]')).toHaveValue('Тестовая карта');
    });

    test('динамические поля параметров работают корректно', async ({ page }) => {
        // Исправляем селектор для кнопки
        const addButton = page.locator('.form-section', { hasText: 'Основные параметры' })
            .locator('button', { hasText: 'Добавить параметр' });
        await addButton.click();

        // Заполняем поля параметра
        const paramInputs = page.locator('#mainParams .param-row').last().locator('input');
        await paramInputs.first().fill('Кредитный лимит');
        await paramInputs.nth(1).fill('до 500 000 ₽');

        // Проверяем, что поля заполнились
        await expect(paramInputs.first()).toHaveValue('Кредитный лимит');
        await expect(paramInputs.nth(1)).toHaveValue('до 500 000 ₽');
    });


    test('генерация JSON работает корректно', async ({ page }) => {
        // Заполняем минимальный набор полей
        await page.fill('input[name="id"]', 'test-card');
        await page.fill('input[name="title"]', 'Тестовая карта');
        await page.fill('input[name="bankName"]', 'Тест Банк');
        await page.fill('input[name="imageUrl"]', '/images/test.jpg');
        await page.fill('input[name="imageUrl"]', '/images/test.jpg');
        await page.fill('input[name="referralLink"]', 'refferal test link');
        await page.fill('textarea[name="shortDescription"]', 'Краткое описание');
        await page.fill('textarea[name="fullDescription"]', 'Полное описание');

        // Добавляем параметр
        await page.locator('#mainParams .param-row input').first().fill('Тест');
        await page.locator('#mainParams .param-row input').nth(1).fill('Значение');

        // Генерируем JSON
        await page.click('button:text("Сгенерировать JSON")');

        // Проверяем результат
        const jsonContent = await page.locator('#jsonResult').textContent();
        const json = JSON.parse(jsonContent);

        expect(json.id).toBe('test-card');
        expect(json.title).toBe('Тестовая карта');
        expect(json.parameters.main).toHaveProperty('Тест', 'Значение');
    });



    test('очистка формы работает', async ({ page }) => {
        // Заполняем форму
        await page.fill('input[name="id"]', 'test-card');
        await page.fill('input[name="title"]', 'Тестовая карта');

        // Нажимаем кнопку очистки и подтверждаем
        page.on('dialog', dialog => dialog.accept());
        await page.click('button:text("Очистить форму")');

        // Проверяем, что форма очистилась
        await expect(page.locator('input[name="id"]')).toHaveValue('');
        await expect(page.locator('input[name="title"]')).toHaveValue('');
    });

    test('обработка массивов в значениях параметров', async ({ page }) => {
        // Заполняем обязательные поля формы
        await page.fill('input[name="id"]', 'test-card');
        await page.fill('input[name="title"]', 'Тестовая карта');
        await page.fill('input[name="bankName"]', 'Тест Банк');
        await page.fill('input[name="imageUrl"]', '/test.jpg');
        await page.fill('input[name="referralLink"]', 'refferal test link');
        await page.fill('textarea[name="shortDescription"]', 'Тест');
        await page.fill('textarea[name="fullDescription"]', 'Тест');

        // Добавляем параметр с массивом значений
        const requirementsSection = page.locator('.form-section', { hasText: 'Требования' });
        const paramInputs = requirementsSection.locator('.param-row').first().locator('input');
        await paramInputs.first().fill('Документы');
        await paramInputs.nth(1).fill('Паспорт РФ | СНИЛС | ИНН');

        // Генерируем JSON
        await page.click('button[type="submit"]');
        // Проверяем JSON
        const jsonContent = await page.locator('#jsonResult').textContent();
        expect(jsonContent).toBeTruthy();

        const json = JSON.parse(jsonContent);
        expect(json.parameters.requirements).toBeTruthy();
        expect(Array.isArray(json.parameters.requirements['Документы'])).toBe(true);
        expect(json.parameters.requirements['Документы']).toEqual(['Паспорт РФ', 'СНИЛС', 'ИНН']);
    });
});
