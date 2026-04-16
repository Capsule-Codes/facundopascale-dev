import { test, expect } from '@playwright/test';

test.describe('home', () => {
  test('loads /es/ with hero heading', async ({ page }) => {
    await page.goto('/es/');
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toContainText('software serio');
  });

  test('loads /en/ with hero heading', async ({ page }) => {
    await page.goto('/en/');
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toContainText('serious software');
  });

  test('root redirects to /es/', async ({ page }) => {
    await page.goto('/');
    // Static output uses meta-refresh instead of 301
    await page.waitForURL(/\/es\/$/);
    await expect(page).toHaveURL(/\/es\/$/);
  });

  test('displays eyebrow tagline', async ({ page }) => {
    await page.goto('/es/');
    await expect(page.getByText('// software architect · indie builder')).toBeVisible();
  });

  test('featured work projects are visible', async ({ page }) => {
    await page.goto('/es/');
    await expect(page.getByRole('heading', { level: 2, name: 'Trabajo destacado' })).toBeVisible();
    // At least one project card with an h3
    await expect(page.locator('h3').first()).toBeVisible();
  });

  test('skip-to-content link exists', async ({ page }) => {
    await page.goto('/es/');
    const skipLink = page.locator('a[href="#main"]');
    await expect(skipLink).toHaveCount(1);
    await expect(skipLink).toHaveText('Saltar al contenido');
  });

  test('skip-to-content link in EN', async ({ page }) => {
    await page.goto('/en/');
    const skipLink = page.locator('a[href="#main"]');
    await expect(skipLink).toHaveText('Skip to content');
  });
});
