import { describe, expect, it } from 'vitest';

import { UNSUBSCRIBE_PLACEHOLDER, renderNewsletterEmail } from '../../src/lib/newsletter-email';

const base = {
  title: 'Shipping notes',
  body: '# Heading\n\nSome **bold** text and a [link](https://example.com/a?x=1&y=2).\n\n- one\n- two',
  locale: 'en' as const,
  siteUrl: 'https://www.facundopascale.dev',
};

describe('renderNewsletterEmail', () => {
  it('uses the title as the subject', () => {
    expect(renderNewsletterEmail(base).subject).toBe('Shipping notes');
  });

  it('renders markdown to html with inline styles', () => {
    const { html } = renderNewsletterEmail(base);
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toMatch(/<h1 style="[^"]+">Heading<\/h1>/);
    expect(html).toMatch(/<li[^>]*>one<\/li>/);
    expect(html).toMatch(
      /<a style="[^"]+" href="https:\/\/example\.com\/a\?x=1&amp;y=2">link<\/a>/
    );
    expect(html).not.toContain('<style');
  });

  it('wraps the content in a 600px Blueprint template', () => {
    const { html } = renderNewsletterEmail(base);
    expect(html).toContain('max-width:600px');
    expect(html).toContain('#F1EEE6');
    expect(html).toContain('#14213D');
    expect(html).toContain('#C7380F');
  });

  it('escapes the title in the document', () => {
    const { html, subject } = renderNewsletterEmail({ ...base, title: '<script>x</script> & "q"' });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;x&lt;/script&gt; &amp; &quot;q&quot;');
    expect(subject).toBe('<script>x</script> & "q"');
  });

  it('escapes raw html written in the body', () => {
    const { html } = renderNewsletterEmail({ ...base, body: 'Hi <img src=x onerror=alert(1)>' });
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  it('drops links with unsafe protocols but keeps their text', () => {
    const { html } = renderNewsletterEmail({ ...base, body: '[click](javascript:alert(1))' });
    expect(html).not.toContain('javascript:');
    expect(html).toContain('click');
  });

  it('always includes the unsubscribe placeholder in the html', () => {
    expect(UNSUBSCRIBE_PLACEHOLDER).toBe('{{{RESEND_UNSUBSCRIBE_URL}}}');
    const { html } = renderNewsletterEmail(base);
    expect(html).toContain(`href="${UNSUBSCRIBE_PLACEHOLDER}"`);
  });

  it('localizes the footer and links to the site', () => {
    const en = renderNewsletterEmail(base);
    expect(en.html).toContain('You are receiving this because you subscribed');
    expect(en.html).toContain('href="https://www.facundopascale.dev/en/"');
    const es = renderNewsletterEmail({ ...base, locale: 'es' });
    expect(es.html).toContain('Recibes este correo porque te suscribiste');
    expect(es.html).toContain('Cancelar suscripción');
    expect(es.html).toContain('href="https://www.facundopascale.dev/es/"');
    expect(es.html).toContain('<html lang="es"');
  });

  it('builds a plain-text version with the title, body, site and unsubscribe link', () => {
    const { text } = renderNewsletterEmail(base);
    expect(text.startsWith('Shipping notes\n')).toBe(true);
    expect(text).toContain('# Heading');
    expect(text).toContain('Some **bold** text');
    expect(text).toContain('https://www.facundopascale.dev/en/');
    expect(text).toContain(UNSUBSCRIBE_PLACEHOLDER);
    expect(text).toContain('You are receiving this because you subscribed');
  });

  it('handles an empty body', () => {
    const { html, text } = renderNewsletterEmail({ ...base, body: null });
    expect(html).toContain(UNSUBSCRIBE_PLACEHOLDER);
    expect(text).toContain('Shipping notes');
  });

  it('strips a trailing slash from the site url', () => {
    const { html } = renderNewsletterEmail({ ...base, siteUrl: 'https://x.dev/' });
    expect(html).toContain('href="https://x.dev/en/"');
  });
});
