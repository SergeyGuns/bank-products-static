const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost:9999';

// Viewports для тестирования
const viewports = {
  mobile_small: { width: 320, height: 568 },
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
};

// Страницы для тестирования
const pages = [
  { name: 'Главная', path: '/' },
  { name: 'Кредитные карты', path: '/category/credit-cards.html' },
  { name: 'Дебетовые карты', path: '/category/debit-cards.html' },
  { name: 'Кредиты', path: '/category/credits.html' },
  { name: 'Сравнение кредитных карт', path: '/compare/credit-cards.html' },
  { name: 'Сравнение дебетовых карт', path: '/compare/debit-cards.html' },
  { name: 'Сравнение кредитов', path: '/compare/credits.html' },
  { name: 'О проекте', path: '/about.html' },
  { name: 'Контакты', path: '/contacts.html' },
  { name: 'Политика конфиденциальности', path: '/privacy.html' },
  { name: 'Калькулятор', path: '/calculator.html' },
];

test.describe('Responsive Layout Tests', () => {
  for (const page of pages) {
    for (const [viewportName, viewport] of Object.entries(viewports)) {
      test(`${page.name} — ${viewportName} (${viewport.width}x${viewport.height})`, async ({ page: pw }) => {
        await pw.setViewportSize(viewport);
        await pw.goto(BASE + page.path);
        
        // Проверка что нет горизонтального скролла
        const scrollWidth = await pw.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await pw.evaluate(() => document.documentElement.clientWidth);
        
        // Допуск 5px для скроллбара
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
      });
    }
  }
});

test.describe('Mobile Navigation', () => {
  test('Hamburger menu visible on mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto(BASE + '/');
    
    const hamburger = page.locator('.mobile-menu-toggle');
    await expect(hamburger).toBeVisible();
  });

  test('Nav links hidden on mobile by default', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto(BASE + '/');
    
    const navMenu = page.locator('.nav-menu');
    // На мобильном меню скрыто по умолчанию
    await expect(navMenu).not.toHaveClass(/active/);
  });

  test('Hamburger toggle opens menu', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto(BASE + '/');
    
    await page.click('.mobile-menu-toggle');
    
    const navMenu = page.locator('.nav-menu');
    await expect(navMenu).toHaveClass(/active/);
  });

  test('Nav links visible on desktop', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto(BASE + '/');
    
    const navLinks = page.locator('.nav-links');
    await expect(navLinks).toBeVisible();
    
    const hamburger = page.locator('.mobile-menu-toggle');
    await expect(hamburger).not.toBeVisible();
  });
});

test.describe('Touch-friendly buttons', () => {
  test('Buttons have minimum 44px height on mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto(BASE + '/');
    
    const buttons = page.locator('.btn');
    const count = await buttons.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const box = await buttons.nth(i).boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe('Comparison Table Responsive', () => {
  test('Table has horizontal scroll on mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto(BASE + '/compare/credit-cards.html');
    
    const container = page.locator('.comparison-table-container');
    await expect(container).toBeVisible();
    
    // Проверяем overflow-x
    const overflowX = await container.evaluate(el => getComputedStyle(el).overflowX);
    expect(overflowX).toBe('auto');
  });
});

test.describe('Card Grid Responsive', () => {
  test('Cards in single column on mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto(BASE + '/category/credit-cards.html');
    
    const grid = page.locator('.grid');
    await expect(grid).toBeVisible();
    
    // Проверяем что grid имеет 1 колонку на мобильском
    const gridCols = await grid.evaluate(el => {
      const style = getComputedStyle(el);
      return style.gridTemplateColumns.split(' ').length;
    });
    expect(gridCols).toBe(1);
  });

  test('Cards in two columns on desktop', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto(BASE + '/category/credit-cards.html');
    
    const grid = page.locator('.grid');
    await expect(grid).toBeVisible();
    
    const gridCols = await grid.evaluate(el => {
      const style = getComputedStyle(el);
      return style.gridTemplateColumns.split(' ').length;
    });
    expect(gridCols).toBe(2);
  });
});

test.describe('Footer Responsive', () => {
  test('Footer sections in single column on mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto(BASE + '/');
    
    const footerSections = page.locator('.footer-sections');
    await expect(footerSections).toBeVisible();
  });
});
