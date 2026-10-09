import { test, expect } from '@playwright/test';

test.describe('favicon', () => {
  test('declares the SVG icon and an Apple touch icon', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute(
      'href',
      '/favicon.svg'
    );
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
      'href',
      '/apple-touch-icon.png'
    );
  });

  test('serves the Blueprint monogram', async ({ request }) => {
    const svg = await request.get('/favicon.svg');
    expect(svg.ok()).toBe(true);
    const body = await svg.text();
    // Paper background, ink monogram drawn as paths (no font dependency in browser tabs).
    expect(body).toContain('#F1EEE6');
    expect(body).toContain('#14213D');
    expect(body).not.toContain('<text');

    const png = await request.get('/apple-touch-icon.png');
    expect(png.ok()).toBe(true);
    expect(png.headers()['content-type']).toBe('image/png');
  });
});
