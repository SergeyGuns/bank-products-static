const path = require('path');
const fs = require('fs').promises;
const { main } = require('./generate');

describe('Site Generator', () => {
  const distDir = path.join(__dirname, '../../dist');

  beforeAll(async () => {
    await main();
  }, 30000);

  test('dist directory exists', async () => {
    const stat = await fs.stat(distDir);
    expect(stat.isDirectory()).toBe(true);
  });

  test('index.html is generated', async () => {
    const content = await fs.readFile(path.join(distDir, 'index.html'), 'utf-8');
    expect(content.length).toBeGreaterThan(100);
  });

  test('sitemap.xml is generated', async () => {
    const content = await fs.readFile(path.join(distDir, 'sitemap.xml'), 'utf-8');
    expect(content).toContain('<?xml');
    expect(content).toContain('<urlset');
  });

  test('robots.txt is generated', async () => {
    const content = await fs.readFile(path.join(distDir, 'robots.txt'), 'utf-8');
    expect(content).toContain('Sitemap');
  });

  test('category pages are generated', async () => {
    const cats = await fs.readdir(path.join(distDir, 'category'));
    expect(cats.length).toBeGreaterThan(0);
    expect(cats.every(f => f.endsWith('.html'))).toBe(true);
  });

  test('product pages are generated', async () => {
    const prods = await fs.readdir(path.join(distDir, 'products'));
    expect(prods.length).toBeGreaterThan(0);
    expect(prods.every(f => f.endsWith('.html'))).toBe(true);
  });
});
