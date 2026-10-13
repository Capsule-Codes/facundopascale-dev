import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type HeaderRule = { source: string; headers: { key: string; value: string }[] };

const config = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8')) as {
  headers: HeaderRule[];
};

describe('vercel.json headers', () => {
  // Astro's adapter emits this rule after Vercel's filesystem handler, so static files never get
  // it: production served /_astro/* with `max-age=0, must-revalidate`.
  it('serves content-hashed /_astro assets as immutable', () => {
    const rule = config.headers.find((h) => h.source === '/_astro/(.*)');
    const cacheControl = rule?.headers.find((h) => h.key.toLowerCase() === 'cache-control');
    expect(cacheControl?.value).toBe('public, max-age=31536000, immutable');
  });
});
