import { test, expect } from '@playwright/test';

const PAGES = {
  es: {
    path: '/es/trabajo/ur-pov/',
    store: 'Google Play',
    next: 'Siguiente proyecto',
    cta: '¿Tenés un proyecto parecido?',
    contact: '/es/contacto/',
    index: '/es/trabajo/',
  },
  en: {
    path: '/en/work/ur-pov/',
    store: 'Google Play',
    next: 'Next project',
    cta: 'Have a similar project?',
    contact: '/en/contact/',
    index: '/en/work/',
  },
} as const;

for (const locale of ['es', 'en'] as const) {
  const c = PAGES[locale];
  test.describe(`case study page (${locale})`, () => {
    test('hero shows the cover as the eager LCP image and the project links', async ({ page }) => {
      await page.goto(c.path);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      const cover = page.locator('[data-case-cover] img');
      await expect(cover).toBeVisible();
      await expect(cover).toHaveAttribute('loading', 'eager');
      await expect(cover).toHaveAttribute('fetchpriority', 'high');
      await expect(cover).toHaveAttribute('srcset', /\/_vercel\/image\?url=.+ \d+w,/);
      await expect(cover).toHaveAttribute('sizes', /\S/);

      const store = page.locator('[data-case-links] a', { hasText: c.store });
      await expect(store).toHaveAttribute('href', /play\.google\.com/);
      await expect(store).toHaveAttribute('target', '_blank');
      await expect(store).toHaveAttribute('rel', /noopener/);
    });

    test('a project without links renders no link list', async ({ page }) => {
      await page.goto(c.path.replace('ur-pov', 'horus'));
      await expect(page.locator('[data-case-links]')).toHaveCount(0);
    });

    test('next project link leads to another case study', async ({ page }) => {
      await page.goto(c.path);
      const next = page.locator('a[data-next-project]');
      await expect(next).toContainText(c.next);
      const href = await next.getAttribute('href');
      expect(href).toMatch(new RegExp(`^${c.index}[a-z0-9-]+/$`));
      expect(href).not.toBe(c.path);
      await next.click();
      await expect(page).toHaveURL(new RegExp(`${href}$`));
      await expect(page.locator('[data-case-cover] img')).toBeVisible();
    });

    test('closes with a contact CTA and a link back to the index', async ({ page }) => {
      await page.goto(c.path);
      const cta = page.locator('[data-case-cta]');
      await expect(cta.getByRole('heading', { level: 2 })).toContainText(c.cta);
      await expect(cta.locator(`a[href="${c.contact}"]`)).toHaveCount(1);
      await expect(cta.locator(`a[href="${c.index}"]`)).toHaveCount(1);
    });
  });
}

test('the last case study wraps around to the first one', async ({ page }) => {
  // anchor has the highest `order`, so its next project is the first (festivalpro).
  await page.goto('/en/work/anchor/');
  await expect(page.locator('a[data-next-project]')).toHaveAttribute(
    'href',
    '/en/work/festivalpro/'
  );
});

test('mixed galleries group desktop and phone shots', async ({ page }) => {
  await page.goto('/es/trabajo/elevate/');
  await expect(page.locator('[data-gallery-group="desktop"] img')).toHaveCount(3);
  await expect(page.locator('[data-gallery-group="phone"] img')).toHaveCount(4);
  await expect(page.locator('[data-gallery-group] h3')).toHaveCount(2);
});

for (const path of ['/es/trabajo/ur-pov/', '/es/trabajo/elevate/', '/en/work/horus/']) {
  test(`no horizontal overflow at 390px: ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('phones scroll horizontally on mobile and sit in rows of at most 4 on desktop', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/es/trabajo/ur-pov/');
  const strip = page.locator('[data-phone-strip]');
  const scrollable = await strip.evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(scrollable).toBe(true);

  await page.setViewportSize({ width: 1440, height: 900 });
  const tops = await strip
    .locator('li:not([aria-hidden]) img')
    .evaluateAll((imgs) => imgs.map((i) => Math.round(i.getBoundingClientRect().top)));
  const perRow = new Map<number, number>();
  for (const t of tops) perRow.set(t, (perRow.get(t) ?? 0) + 1);
  expect([...perRow.values()]).toEqual([4, 4]);
});
