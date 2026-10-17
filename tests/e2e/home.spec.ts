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

      test('renders the featured testimonial in the agency lámina', async ({ page }) => {
        await page.goto(`/${locale}/`);
        const figure = page.locator('section#agency figure');
        await expect(figure).toHaveCount(1);
        await expect(figure.locator('blockquote')).toBeVisible();
        await expect(figure.locator('blockquote')).not.toBeEmpty();
        await expect(figure.locator('figcaption')).toContainText('Ricardo Mejia');
      });

      test('hides the build log when nothing is published', async ({ page }) => {
        // Without Supabase env the content log fixture is empty.
        await page.goto(`/${locale}/`);
        await expect(page.locator('section#content')).toBeVisible();
        await expect(page.locator('section#content #log')).toHaveCount(0);
      });

      test('has no blog or RSS links in the nav or the page', async ({ page }) => {
        await page.goto(`/${locale}/`);
        await expect(page.getByRole('navigation').first().locator('a[href*="/blog/"]')).toHaveCount(
          0
        );
        await expect(page.locator('a[href*="/blog/"]')).toHaveCount(0);
        await expect(page.locator('a[href*="rss.xml"], link[href*="rss.xml"]')).toHaveCount(0);
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

      test('products show their cover and link to the case study', async ({ page }) => {
        await page.goto(`/${locale}/`);
        const card = page.locator('section#products article').filter({ hasText: 'Elevate' });
        await expect(card.locator('img')).toHaveAttribute('src', /elevate%2Fcover|elevate\/cover/);
        await expect(
          card.getByRole('heading', { name: 'Elevate' }).getByRole('link')
        ).toHaveAttribute('href', /elevate\/$/);
      });

      test('contact section has a primary call to action', async ({ page }) => {
        await page.goto(`/${locale}/`);
        await expect(page.locator('section#contact a[data-cta="book-call"]')).toBeVisible();
      });

      test('newsletter form posts to the subscribe page with a labelled email and hidden honeypot', async ({
        page,
      }) => {
        await page.goto(`/${locale}/`);
        const form = page.locator('section#contact form[data-newsletter]');
        await expect(form).toHaveAttribute('method', 'post');
        await expect(form).toHaveAttribute('action', `/${locale}/newsletter/subscribe`);
        await expect(form.locator('input[name="locale"]')).toHaveValue(locale);
        const email = form.locator('input[type="email"]');
        await expect(email).toHaveAccessibleName(/\S/);
        await expect(email).toHaveAttribute('required', '');
        await expect(email).toHaveAttribute('name', 'email');
        const honeypot = form.locator('input[name="website"]');
        await expect(honeypot).toHaveAttribute('tabindex', '-1');
        await expect(honeypot).toHaveAttribute('autocomplete', 'off');
        const box = await honeypot.boundingBox();
        expect(box === null || box.x + box.width <= 0).toBe(true);
        await expect(form.locator('[aria-hidden="true"]:has(input[name="website"])')).toHaveCount(
          1
        );
        await expect(form.locator('button[type="submit"]')).toBeVisible();
        await expect(page.locator('section#contact')).not.toContainText(/PRÓXIMAMENTE|COMING SOON/);
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
