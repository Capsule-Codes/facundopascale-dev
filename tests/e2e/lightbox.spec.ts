import { test, expect, type Page } from '@playwright/test';

const STATIC_DIR = '.vercel/output/static';

/** The static test server has no Vercel optimizer: serve the source file for /_vercel/image. */
async function serveOptimizedImagesFromDisk(page: Page) {
  await page.route('**/_vercel/image*', (route) => {
    const src = new URL(route.request().url()).searchParams.get('url') ?? '';
    return route.fulfill({ path: `${STATIC_DIR}${decodeURIComponent(src)}` });
  });
}

// Elevate's nutri patient plan is a 390x1365 scroll capture, cropped to 9:19.5 in the grid.
const CROPPED_ALT = /plan de comidas de un paciente/;

for (const width of [1440, 390]) {
  test(`lightbox shows a cropped phone capture in full and restores focus (${width}px)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width > 400 ? 900 : 844 });
    await serveOptimizedImagesFromDisk(page);
    await page.goto('/es/trabajo/elevate/');

    const trigger = page.locator('[data-gallery-group="phone"] button', {
      has: page.getByAltText(CROPPED_ALT),
    });
    const thumb = trigger.locator('img');
    await thumb.scrollIntoViewIfNeeded();
    const thumbBox = await thumb.boundingBox();
    expect(thumbBox!.height / thumbBox!.width).toBeLessThan(2.3); // cropped in the grid

    const dialog = page.locator('dialog[data-lightbox]');
    await expect(dialog).not.toBeVisible();
    await expect(dialog.locator('img')).not.toHaveAttribute('src', /./); // not loaded yet

    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();

    const img = dialog.locator('img[data-lightbox-img]');
    await expect(img).toHaveAttribute('alt', CROPPED_ALT);
    await expect(img).toHaveAttribute('srcset', /\/_vercel\/image\?url=.+ \d+w/);
    await expect
      .poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth))
      .toBeGreaterThan(0);
    const fit = await img.evaluate((el: HTMLImageElement) => ({
      objectFit: getComputedStyle(el).objectFit,
      rendered: el.getBoundingClientRect().height / el.getBoundingClientRect().width,
      natural: el.naturalHeight / el.naturalWidth,
    }));
    expect(fit.objectFit).not.toBe('cover');
    expect(fit.rendered).toBeCloseTo(fit.natural, 1);
    expect(fit.rendered).toBeGreaterThan(3); // the whole 390x1365 capture

    await expect(dialog.locator('[data-lightbox-counter]')).toHaveText(/^\d+ \/ 7$/);

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });
}

test('lightbox navigates with arrow keys and buttons, and closes on the backdrop', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/es/trabajo/elevate/');
  const first = page.locator('[data-lightbox-index="0"]');
  await first.click();
  const dialog = page.locator('dialog[data-lightbox]');
  const counter = dialog.locator('[data-lightbox-counter]');
  await expect(counter).toHaveText('1 / 7');
  await page.keyboard.press('ArrowRight');
  await expect(counter).toHaveText('2 / 7');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(counter).toHaveText('7 / 7');
  await dialog.getByRole('button', { name: 'Siguiente' }).click();
  await expect(counter).toHaveText('1 / 7');

  // Click the empty stage beside the image.
  await dialog.locator('[data-lightbox-stage]').click({ position: { x: 10, y: 200 } });
  await expect(dialog).not.toBeVisible();
  await expect(first).toBeFocused();
});
