import { test, expect } from '@playwright/test';

test.describe('site audit regressions', () => {
  test('skip link is the first tab stop and targets main', async ({ page }) => {
    await page.goto('/en/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await expect(skip).toHaveAttribute('href', '#main');
    await expect(page.locator('main#main')).toHaveCount(1);
  });

  test('skip link is localized in Spanish', async ({ page }) => {
    await page.goto('/es/');
    await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toHaveCount(1);
  });

  test('404 renders English under /en/ and Spanish otherwise', async ({ page }) => {
    await page.goto('/en/does-not-exist/');
    await expect(page.locator('h1')).toHaveText('Page not found');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.goto('/es/nope/');
    await expect(page.locator('h1')).toHaveText('Página no encontrada');
  });

  test('canonical and og:url use the www origin', async ({ page }) => {
    await page.goto('/en/about/');
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
      'href',
      'https://www.facundopascale.dev/en/about/'
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      'https://www.facundopascale.dev/en/about/'
    );
  });

  test('home has no horizontal overflow at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ['/es/', '/en/']) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBeLessThanOrEqual(0);
    }
  });
});
