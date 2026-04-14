import { describe, it, expect } from 'vitest';
import { calculateReadingTime } from '../../src/lib/reading-time';

describe('calculateReadingTime', () => {
  it('returns 1 for empty content', () => {
    expect(calculateReadingTime('')).toBe(1);
  });

  it('returns 1 for a few words', () => {
    expect(calculateReadingTime('hello world')).toBe(1);
  });

  it('returns 3 for 600 words at 200 wpm', () => {
    const text = 'word '.repeat(600);
    expect(calculateReadingTime(text)).toBe(3);
  });

  it('strips markdown syntax before counting', () => {
    const md = '# Title\n\n**bold** _italic_ `code` [link](url) ![alt](image)';
    // Cleaned: "Title bold italic code link" — 5 content words → rounds up to 1 minute
    expect(calculateReadingTime(md)).toBe(1);
  });

  it('strips code fences', () => {
    const md = 'real words here\n\n```ts\nconst a = 1;\nconst b = 2;\n```\n\nmore real words';
    // Cleaned: "real words here more real words" — 6 content words → 1 minute
    expect(calculateReadingTime(md)).toBe(1);
  });

  it('always returns at least 1', () => {
    expect(calculateReadingTime('one')).toBe(1);
  });
});
