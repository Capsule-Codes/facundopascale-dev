import { test, expect } from '@playwright/test';

const PAGES = {
  es: { path: '/es/trabajo/estudialo-ai/', heading: 'Galería' },
  en: { path: '/en/work/estudialo-ai/', heading: 'Gallery' },
} as const;

for (const locale of ['es', 'en'] as const) {
  const c = PAGES[locale];
  test.describe(`case study gallery (${locale})`, () => {
    test('renders lazy images with alt text and dimensions', async ({ page }) => {
      await page.goto(c.path);
      const section = page.locator('section#gallery');
      await expect(section.getByRole('heading', { level: 2, name: c.heading })).toBeVisible();
      const imgs = section.locator('img');
      expect(await imgs.count()).toBeGreaterThan(0);
      for (const img of await imgs.all()) {
        await expect(img).toHaveAttribute('alt', /\S{5,}/);
        await expect(img).toHaveAttribute('loading', 'lazy');
        await expect(img).toHaveAttribute('width', /^\d+$/);
        await expect(img).toHaveAttribute('height', /^\d+$/);
      }
    });

    test('has no horizontal overflow at 375px', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto(c.path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
}

test('case studies without a gallery render no gallery section', async ({ page }) => {
  await page.goto('/en/work/festivalpro/');
  await expect(page.locator('section#gallery')).toHaveCount(0);
});
