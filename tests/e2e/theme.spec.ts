import { test, expect, type Page } from '@playwright/test';

const html = (page: Page) => page.locator('html');
const toggle = (page: Page) => page.getByRole('button', { name: 'Toggle theme' });
const storedTheme = (page: Page) => page.evaluate(() => localStorage.getItem('theme'));

const seedTheme = (page: Page, value: 'light' | 'dark') =>
  page.addInitScript((v) => {
    localStorage.setItem('theme', v);
  }, value);

test.describe('theme', () => {
  test.describe('system preference without a stored choice', () => {
    test.use({ colorScheme: 'light' });
    test('defaults to light', async ({ page }) => {
      await page.goto('/en/');
      await expect(html(page)).toHaveAttribute('data-theme', 'light');
    });
  });

  test.describe('system dark without a stored choice', () => {
    test.use({ colorScheme: 'dark' });
    test('follows the system preference', async ({ page }) => {
      await page.goto('/en/');
      await expect(html(page)).toHaveAttribute('data-theme', 'dark');
    });

    test('a stored light choice wins over system dark', async ({ page }) => {
      await seedTheme(page, 'light');
      await page.goto('/en/');
      await expect(html(page)).toHaveAttribute('data-theme', 'light');
    });
  });

  test.describe('system light with a stored choice', () => {
    test.use({ colorScheme: 'light' });
    test('a stored dark choice wins over system light', async ({ page }) => {
      await seedTheme(page, 'dark');
      await page.goto('/en/');
      await expect(html(page)).toHaveAttribute('data-theme', 'dark');
    });

    test('toggle flips the theme, persists it and keeps aria-pressed in sync', async ({ page }) => {
      await page.goto('/en/');
      await expect(html(page)).toHaveAttribute('data-theme', 'light');
      await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false');

      await toggle(page).click();
      await expect(html(page)).toHaveAttribute('data-theme', 'dark');
      await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
      expect(await storedTheme(page)).toBe('dark');

      await toggle(page).click();
      await expect(html(page)).toHaveAttribute('data-theme', 'light');
      await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false');
      expect(await storedTheme(page)).toBe('light');
    });

    test('toggle state agrees with a stored dark theme after load', async ({ page }) => {
      await seedTheme(page, 'dark');
      await page.goto('/en/');
      await expect(html(page)).toHaveAttribute('data-theme', 'dark');
      await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
    });
  });
});
