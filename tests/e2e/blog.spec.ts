import { test, expect } from '@playwright/test';

test.describe('blog', () => {
  test('ES blog index has correct heading', async ({ page }) => {
    await page.goto('/es/blog/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Notas');
  });

  test('EN blog index has correct heading', async ({ page }) => {
    await page.goto('/en/blog/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Writing');
  });

  test('blog index lists the published post', async ({ page }) => {
    await page.goto('/es/blog/');
    await expect(page.getByRole('heading', { level: 2, name: /Bienvenido al blog/ })).toBeVisible();
  });

  test('blog index lists the offline-first post in both locales', async ({ page }) => {
    await page.goto('/es/blog/');
    await expect(page.getByRole('heading', { level: 2, name: /offline-first/i })).toBeVisible();
    await page.goto('/en/blog/');
    await expect(page.getByRole('heading', { level: 2, name: /offline-first/i })).toBeVisible();
  });

  test('offline-first post page renders', async ({ page }) => {
    await page.goto('/es/blog/2026-10-13-arquitectura-offline-first/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Arquitectura offline-first en la práctica'
    );
  });

  test('post page renders with correct heading', async ({ page }) => {
    await page.goto('/es/blog/2026-04-15-hola-mundo/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bienvenido al blog');
  });

  test('post page has a callout with role="note"', async ({ page }) => {
    await page.goto('/es/blog/2026-04-15-hola-mundo/');
    const callout = page.locator('[role="note"]');
    await expect(callout).toBeVisible();
  });

  test('post page displays publish date', async ({ page }) => {
    await page.goto('/es/blog/2026-04-15-hola-mundo/');
    await expect(page.locator('time')).toBeVisible();
  });
});
