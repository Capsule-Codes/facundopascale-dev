import { test, expect } from '@playwright/test';

test.describe('contact form', () => {
  test('ES form has all expected fields with correct labels', async ({ page }) => {
    await page.goto('/es/contacto/');
    // Wait for React island hydration
    await page.waitForSelector('form');

    await expect(page.locator('label[for="contact-name"]')).toHaveText('Nombre');
    await expect(page.locator('label[for="contact-email"]')).toHaveText('Email');
    await expect(page.locator('label[for="contact-message"]')).toHaveText('Mensaje');
    await expect(page.getByRole('button', { name: 'Enviar' })).toBeVisible();
  });

  test('EN form has language-appropriate labels', async ({ page }) => {
    await page.goto('/en/contact/');
    await page.waitForSelector('form');

    await expect(page.locator('label[for="contact-name"]')).toHaveText('Name');
    await expect(page.locator('label[for="contact-email"]')).toHaveText('Email');
    await expect(page.locator('label[for="contact-message"]')).toHaveText('Message');
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
  });

  test('honeypot field exists but is hidden', async ({ page }) => {
    await page.goto('/es/contacto/');
    await page.waitForSelector('form');

    const honeypot = page.locator('input[name="honeypot"]');
    await expect(honeypot).toHaveAttribute('aria-hidden', 'true');
    await expect(honeypot).not.toBeVisible();
  });

  test('required fields have required attribute', async ({ page }) => {
    await page.goto('/es/contacto/');
    await page.waitForSelector('form');

    await expect(page.locator('input[name="name"]')).toHaveAttribute('required', '');
    await expect(page.locator('input[name="email"]')).toHaveAttribute('required', '');
    await expect(page.locator('textarea[name="message"]')).toHaveAttribute('required', '');
  });

  test('page heading is correct in ES', async ({ page }) => {
    await page.goto('/es/contacto/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Contacto');
  });

  test('page heading is correct in EN', async ({ page }) => {
    await page.goto('/en/contact/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Contact');
  });
});
