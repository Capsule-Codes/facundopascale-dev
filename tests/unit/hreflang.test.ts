import { describe, it, expect } from 'vitest';
import { computeHreflangPair, X_DEFAULT_PATH } from '../../src/lib/hreflang';

describe('computeHreflangPair — static pages', () => {
  it('emits /es/ and /en/ for the home', () => {
    const pair = computeHreflangPair({ kind: 'static', pageKey: 'home' });
    expect(pair).toEqual({ es: '/es', en: '/en' });
  });

  it('respects the PATHS map for about (sobre-mi ↔ about)', () => {
    const pair = computeHreflangPair({ kind: 'static', pageKey: 'about' });
    expect(pair).toEqual({ es: '/es/sobre-mi', en: '/en/about' });
  });

  it('respects the PATHS map for work (trabajo ↔ work)', () => {
    const pair = computeHreflangPair({ kind: 'static', pageKey: 'work' });
    expect(pair).toEqual({ es: '/es/trabajo', en: '/en/work' });
  });

  it('respects the PATHS map for contact (contacto ↔ contact)', () => {
    const pair = computeHreflangPair({ kind: 'static', pageKey: 'contact' });
    expect(pair).toEqual({ es: '/es/contacto', en: '/en/contact' });
  });

  it('handles blog and uses which share the same segment in both locales', () => {
    expect(computeHreflangPair({ kind: 'static', pageKey: 'blog' })).toEqual({
      es: '/es/blog',
      en: '/en/blog',
    });
    expect(computeHreflangPair({ kind: 'static', pageKey: 'uses' })).toEqual({
      es: '/es/uses',
      en: '/en/uses',
    });
  });
});

describe('computeHreflangPair — collection entries', () => {
  it('emits both sides when a sibling exists for blog', () => {
    const pair = computeHreflangPair({
      kind: 'collection',
      collection: 'blog',
      currentLocale: 'es',
      currentSlug: 'mi-post',
      siblingSlug: 'my-post',
    });
    expect(pair).toEqual({ es: '/es/blog/mi-post', en: '/en/blog/my-post' });
  });

  it('emits both sides when a sibling exists for work (trabajo ↔ work)', () => {
    const pair = computeHreflangPair({
      kind: 'collection',
      collection: 'work',
      currentLocale: 'en',
      currentSlug: 'festivalpro',
      siblingSlug: 'festivalpro',
    });
    expect(pair).toEqual({ es: '/es/trabajo/festivalpro', en: '/en/work/festivalpro' });
  });

  it('returns null for an orphan (no sibling)', () => {
    const pair = computeHreflangPair({
      kind: 'collection',
      collection: 'blog',
      currentLocale: 'es',
      currentSlug: 'orphan',
      siblingSlug: null,
    });
    expect(pair).toBeNull();
  });
});

describe('X_DEFAULT_PATH', () => {
  it('points to the Spanish home (/es)', () => {
    expect(X_DEFAULT_PATH).toBe('/es');
  });
});
