import { test, expect } from '@playwright/test';

test.describe('language switcher', () => {
  test('navigates from ES blog post to EN translation', async ({ page }) => {
    await page.goto('/es/blog/2026-04-15-hola-mundo/');
    // Wait for the React island to hydrate
    const switcher = page.getByRole('button', { name: /Switch to EN/i });
    await switcher.waitFor({ state: 'attached' });
    await switcher.click();
    await expect(page).toHaveURL(/\/en\/blog\/2026-04-15-hello-world\/?/);
  });

  test('navigates from EN to ES on home page', async ({ page }) => {
    await page.goto('/en/');
    const switcher = page.getByRole('button', { name: /Switch to ES/i });
    await switcher.waitFor({ state: 'attached' });
    await switcher.click();
    await expect(page).toHaveURL(/\/es\/$/);
  });

  test('navigates from ES to EN on home page', async ({ page }) => {
    await page.goto('/es/');
    const switcher = page.getByRole('button', { name: /Switch to EN/i });
    await switcher.waitFor({ state: 'attached' });
    await switcher.click();
    await expect(page).toHaveURL(/\/en\/$/);
  });

  test('displays locale labels correctly', async ({ page }) => {
    await page.goto('/es/');
    const switcher = page.getByRole('button', { name: /Switch to EN/i });
    await switcher.waitFor({ state: 'attached' });
    await expect(switcher).toHaveText('ES → EN');
  });
});
