import { describe, it, expect } from 'vitest';
import { buildBlogPostingJsonLd, buildHomeJsonLd, serializeJsonLd } from '../../src/lib/json-ld';

const site = new URL('https://www.facundopascale.dev');

describe('json-ld', () => {
  it('builds Person + WebSite on the www origin', () => {
    const data = buildHomeJsonLd(site, 'en', 'desc');
    const [person, website] = data['@graph'] as unknown as [
      Record<string, unknown>,
      Record<string, unknown>,
    ];
    expect(person['@type']).toBe('Person');
    expect(person['url']).toBe('https://www.facundopascale.dev/en/');
    expect(website['@type']).toBe('WebSite');
    expect(website['url']).toBe('https://www.facundopascale.dev/');
  });

  it('builds BlogPosting, defaulting dateModified to datePublished', () => {
    const published = new Date('2026-04-15T00:00:00Z');
    const data = buildBlogPostingJsonLd(site, {
      title: 'T',
      description: 'D',
      url: 'https://www.facundopascale.dev/es/blog/x/',
      imageUrl: null,
      publishedAt: published,
      updatedAt: null,
      locale: 'es',
    });
    expect(data['@type']).toBe('BlogPosting');
    expect(data.dateModified).toBe(published.toISOString());
    expect('image' in data).toBe(false);
  });

  it('escapes < so the payload cannot close the script tag', () => {
    expect(serializeJsonLd({ a: '</script>' })).not.toContain('<');
  });
});
