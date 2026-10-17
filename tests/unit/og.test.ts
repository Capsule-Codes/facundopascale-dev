import { describe, it, expect } from 'vitest';
import { buildOgSlug, buildOgUrl, DEFAULT_OG_SLUG } from '../../src/lib/og';

describe('buildOgSlug', () => {
  it('builds a work slug that keeps the locale prefix', () => {
    expect(buildOgSlug({ id: 'en/festivalpro.mdx', collection: 'work', locale: 'en' })).toBe(
      'work/en/festivalpro'
    );
  });

  it('tolerates ids without the locale prefix already stripped', () => {
    // The glob loader in Astro 6 strips `.mdx` already — the helper must stay
    // idempotent so both shapes produce the same output.
    expect(buildOgSlug({ id: 'festivalpro', collection: 'work', locale: 'es' })).toBe(
      'work/es/festivalpro'
    );
  });

  it('strips an existing locale prefix from the id before re-prefixing', () => {
    // Defensive: the plan's other routes sometimes replace `${loc}/` in the id.
    // The helper must not double-prefix.
    expect(buildOgSlug({ id: 'es/festivalpro.mdx', collection: 'work', locale: 'es' })).toBe(
      'work/es/festivalpro'
    );
  });

  it('rejects ids containing path separators that would break URL segments', () => {
    // Any nested directory under a locale is not a shape the content collections
    // produce today, and it would smuggle extra URL segments into the slug.
    expect(() => buildOgSlug({ id: 'es/sub/post.mdx', collection: 'work', locale: 'es' })).toThrow(
      /nested/i
    );
  });
});

describe('DEFAULT_OG_SLUG', () => {
  it('is a plain single-segment identifier used for the site-wide fallback', () => {
    expect(DEFAULT_OG_SLUG).toBe('default');
  });
});

describe('buildOgUrl', () => {
  it('composes an absolute URL from a slug and an Astro site URL', () => {
    const site = new URL('https://facundopascale.dev/');
    expect(buildOgUrl('work/es/festivalpro', site)).toBe(
      'https://facundopascale.dev/og/work/es/festivalpro.png'
    );
  });

  it('preserves the scheme and host for the default slug', () => {
    const site = new URL('https://facundopascale.dev/');
    expect(buildOgUrl('default', site)).toBe('https://facundopascale.dev/og/default.png');
  });

  it('returns null when the Astro site URL is undefined', () => {
    // Under strictest TS, `Astro.site` is typed optional even though the
    // project sets it in astro.config.ts. The Layout is expected to skip the
    // og:image tag when the site is missing rather than emit a relative URL.
    expect(buildOgUrl('work/es/festivalpro', undefined)).toBeNull();
  });

  it('works when the site URL has no trailing slash', () => {
    const site = new URL('https://facundopascale.dev');
    expect(buildOgUrl('work/es/festivalpro', site)).toBe(
      'https://facundopascale.dev/og/work/es/festivalpro.png'
    );
  });
});
