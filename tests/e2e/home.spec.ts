import { test, expect } from '@playwright/test';

const COPY = {
  es: {
    h1: 'Software que se diseña antes de construirse.',
    skip: 'Saltar al contenido',
    sections: ['agency', 'products', 'content', 'contact'],
  },
  en: {
    h1: "Software that's designed before it's built.",
    skip: 'Skip to content',
    sections: ['agency', 'products', 'content', 'contact'],
  },
} as const;

test.describe('home', () => {
  for (const locale of ['es', 'en'] as const) {
    test.describe(locale, () => {
      test('has a single h1 with the hero headline', async ({ page }) => {
        await page.goto(`/${locale}/`);
        const h1 = page.getByRole('heading', { level: 1 });
        await expect(h1).toHaveCount(1);
        await expect(h1).toHaveText(COPY[locale].h1);
      });

      test('renders one h2 per lámina (A, B, C, D)', async ({ page }) => {
        await page.goto(`/${locale}/`);
        for (const id of COPY[locale].sections) {
          await expect(page.locator(`section#${id} h2`)).toHaveCount(1);
          await expect(page.locator(`section#${id} h2`)).toBeVisible();
        }
      });

      test('shows the highlighted showcase projects as cards', async ({ page }) => {
        await page.goto(`/${locale}/`);
        const cards = page.locator('section#agency article');
        // Fixtures provide 3 highlighted projects.
        await expect(cards).toHaveCount(3);
        await expect(cards.first().getByRole('heading', { level: 3 })).toBeVisible();
      });

      test('products link out in a new tab', async ({ page }) => {
        await page.goto(`/${locale}/`);
        const links = page.locator('section#products a[target="_blank"]');
        await expect(links).toHaveCount(3);
        for (const link of await links.all()) {
          await expect(link).toHaveAttribute('rel', /noopener/);
          await expect(link).toHaveAttribute('href', /^https:\/\//);
        }
      });

      test('contact section has a primary call to action and no newsletter input', async ({
        page,
      }) => {
        await page.goto(`/${locale}/`);
        await expect(page.locator('section#contact a[data-cta="book-call"]')).toBeVisible();
        await expect(page.locator('section#contact input')).toHaveCount(0);
      });

      test('skip-to-content link exists', async ({ page }) => {
        await page.goto(`/${locale}/`);
        const skipLink = page.locator('a[href="#main"]');
        await expect(skipLink).toHaveCount(1);
        await expect(skipLink).toHaveText(COPY[locale].skip);
      });

      test('does not scroll horizontally at 375px', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 800 });
        await page.goto(`/${locale}/`);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );
        expect(overflow).toBeLessThanOrEqual(0);
      });
    });
  }

  test('root redirects to /es/', async ({ page }) => {
    await page.goto('/');
    // Static output uses meta-refresh instead of 301
    await page.waitForURL(/\/es\/$/);
    await expect(page).toHaveURL(/\/es\/$/);
  });
});
