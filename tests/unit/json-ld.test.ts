import { describe, it, expect } from 'vitest';
import { buildHomeJsonLd, serializeJsonLd } from '../../src/lib/json-ld';

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

  it('escapes < so the payload cannot close the script tag', () => {
    expect(serializeJsonLd({ a: '</script>' })).not.toContain('<');
  });
});
