import { describe, it, expect } from 'vitest';
import { isPublished, filterPublished, byLocale, sortByDate } from '../../src/lib/content';

type MockEntry = {
  id: string;
  data: {
    publishedAt: Date;
    draft: boolean;
    lang: 'es' | 'en';
    featured?: boolean;
    order?: number;
  };
};

const NOW = new Date('2026-04-13T12:00:00Z');

const entries: MockEntry[] = [
  { id: 'a', data: { publishedAt: new Date('2026-04-01'), draft: false, lang: 'es' } },
  { id: 'b', data: { publishedAt: new Date('2026-05-01'), draft: false, lang: 'es' } }, // future
  { id: 'c', data: { publishedAt: new Date('2026-04-05'), draft: true, lang: 'es' } }, // draft
  { id: 'd', data: { publishedAt: new Date('2026-04-10'), draft: false, lang: 'en' } },
];

describe('isPublished', () => {
  it('returns true for past non-draft', () => {
    expect(isPublished(entries[0]!, NOW)).toBe(true);
  });
  it('returns false for future', () => {
    expect(isPublished(entries[1]!, NOW)).toBe(false);
  });
  it('returns false for draft', () => {
    expect(isPublished(entries[2]!, NOW)).toBe(false);
  });
});

describe('filterPublished', () => {
  it('keeps only past non-draft entries', () => {
    const result = filterPublished(entries, NOW).map((e) => e.id);
    expect(result).toEqual(['a', 'd']);
  });
});

describe('byLocale', () => {
  it('filters by lang field', () => {
    expect(byLocale(entries, 'es').map((e) => e.id)).toEqual(['a', 'b', 'c']);
    expect(byLocale(entries, 'en').map((e) => e.id)).toEqual(['d']);
  });
});

describe('sortByDate', () => {
  it('sorts newest first', () => {
    const sorted = sortByDate(filterPublished(entries, NOW));
    expect(sorted.map((e) => e.id)).toEqual(['d', 'a']);
  });
});
