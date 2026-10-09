import { test, expect } from '@playwright/test';

const PAGES = {
  es: {
    path: '/es/trabajo/',
    highlighted: 'Destacados',
    more: 'Más proyectos',
    caseStudy: 'Caso de estudio',
  },
  en: {
    path: '/en/work/',
    highlighted: 'Highlighted',
    more: 'More projects',
    caseStudy: 'Case study',
  },
} as const;

test.describe('work list', () => {
  for (const locale of ['es', 'en'] as const) {
    const c = PAGES[locale];
    test.describe(locale, () => {
      test('has a single h1', async ({ page }) => {
        await page.goto(c.path);
        await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      });

      test('renders highlighted and more groups with fixture counts', async ({ page }) => {
        await page.goto(c.path);
        await expect(page.getByRole('heading', { level: 2, name: c.highlighted })).toBeVisible();
        await expect(page.getByRole('heading', { level: 2, name: c.more })).toBeVisible();
        await expect(page.locator('section#highlighted article')).toHaveCount(3);
        await expect(page.locator('section#more article')).toHaveCount(2);
      });

      test('external links open in a new tab', async ({ page }) => {
        await page.goto(c.path);
        const links = page.locator('article a[href^="http"]');
        expect(await links.count()).toBeGreaterThan(0);
        for (const link of await links.all()) {
          await expect(link).toHaveAttribute('target', '_blank');
          await expect(link).toHaveAttribute('rel', /noopener/);
        }
      });

      test('links a matched project to its case study', async ({ page }) => {
        await page.goto(c.path);
        const link = page
          .locator('article', { hasText: 'Festival PRO' })
          .getByRole('link', { name: new RegExp(c.caseStudy) });
        await expect(link).toHaveCount(1);
        await expect(link).toHaveAttribute('href', /festivalpro\/$/);
      });

      test('keeps unmatched case studies reachable', async ({ page }) => {
        await page.goto(c.path);
        await expect(page.locator('section#case-studies a[href*="fitcoach"]')).toHaveCount(1);
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
});
