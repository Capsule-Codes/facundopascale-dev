import { test, expect } from '@playwright/test';

const switcherFor = (page: import('@playwright/test').Page, label: string) =>
  page.getByRole('link', { name: label, exact: true });

test.describe('language switcher', () => {
  test('navigates from ES blog post to EN translation', async ({ page }) => {
    await page.goto('/es/blog/2026-04-15-hola-mundo/');
    await switcherFor(page, 'ES → EN').click();
    await expect(page).toHaveURL(/\/en\/blog\/2026-04-15-hello-world\/?/);
  });

  test('navigates from EN to ES on home page', async ({ page }) => {
    await page.goto('/en/');
    await switcherFor(page, 'EN → ES').click();
    await expect(page).toHaveURL(/\/es\/$/);
  });

  test('navigates from ES to EN on home page', async ({ page }) => {
    await page.goto('/es/');
    await switcherFor(page, 'ES → EN').click();
    await expect(page).toHaveURL(/\/en\/$/);
  });

  test('exposes target language on the link', async ({ page }) => {
    await page.goto('/es/');
    const switcher = switcherFor(page, 'ES → EN');
    await expect(switcher).toHaveAttribute('hreflang', 'en');
    await expect(switcher).toHaveAttribute('lang', 'en');
  });

  const twins: Array<[string, string]> = [
    ['/es/sobre-mi/', '/en/about/'],
    ['/en/about/', '/es/sobre-mi/'],
    ['/es/blog/', '/en/blog/'],
    ['/en/blog/', '/es/blog/'],
    ['/es/contacto/', '/en/contact/'],
    ['/en/contact/', '/es/contacto/'],
    ['/es/uses/', '/en/uses/'],
    ['/en/uses/', '/es/uses/'],
    ['/es/trabajo/', '/en/work/'],
    ['/en/work/', '/es/trabajo/'],
  ];
  for (const [from, to] of twins) {
    test(`static page ${from} switches to ${to}`, async ({ page }) => {
      await page.goto(from);
      const label = from.startsWith('/es') ? 'ES → EN' : 'EN → ES';
      await switcherFor(page, label).click();
      await expect(page).toHaveURL(new RegExp(`${to}$`));
    });
  }
});
