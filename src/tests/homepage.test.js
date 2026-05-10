const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost:9999';

test.describe('Homepage', () => {
  test('loads successfully', async ({ page }) => {
    await page.goto(BASE + '/');
    await expect(page).toHaveURL(BASE + '/');
  });

  test('has title', async ({ page }) => {
    await page.goto(BASE + '/');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('has category links', async ({ page }) => {
    await page.goto(BASE + '/');
    const links = page.locator('a[href^="/category/"]');
    expect(await links.count()).toBeGreaterThan(0);
  });

  test('has compare links', async ({ page }) => {
    await page.goto(BASE + '/');
    const links = page.locator('a[href^="/compare/"]');
    expect(await links.count()).toBeGreaterThan(0);
  });
});

test.describe('Category pages', () => {
  test('credit-cards loads', async ({ page }) => {
    await page.goto(BASE + '/category/credit-cards.html');
    await expect(page).toHaveURL(/credit-cards/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('debit-cards loads', async ({ page }) => {
    await page.goto(BASE + '/category/debit-cards.html');
    await expect(page).toHaveURL(/debit-cards/);
  });

  test('credits loads', async ({ page }) => {
    await page.goto(BASE + '/category/credits.html');
    await expect(page).toHaveURL(/credits/);
  });
});

test.describe('Product pages', () => {
  test('at least one product page loads', async ({ page }) => {
    await page.goto(BASE + '/category/credit-cards.html');
    const firstProduct = page.locator('a[href^="/products/"]').first();
    if (await firstProduct.count() > 0) {
      await firstProduct.click();
      await expect(page).toHaveURL(/products/);
    }
  });
});

test.describe('Static pages', () => {
  test('calculator page loads', async ({ page }) => {
    await page.goto(BASE + '/calculator.html');
    await expect(page).toHaveURL(/calculator/);
  });

  test('404 page works', async ({ page }) => {
    const response = await page.goto(BASE + '/nonexistent-page.html');
    expect(response.status()).toBe(404);
  });
});
