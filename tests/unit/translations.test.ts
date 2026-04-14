import { describe, it, expect } from 'vitest';
import { findTranslation } from '../../src/lib/translations';

type Doc = { id: string; data: { lang: 'es' | 'en'; translationId: string } };

const docs: Doc[] = [
  { id: 'es/post-a', data: { lang: 'es', translationId: 'post-a-2026-04' } },
  { id: 'en/post-a', data: { lang: 'en', translationId: 'post-a-2026-04' } },
  { id: 'es/orphan', data: { lang: 'es', translationId: 'orphan-2026-04' } },
];

describe('findTranslation', () => {
  it('finds the sibling in the other locale', () => {
    const result = findTranslation(docs[0]!, docs, 'en');
    expect(result?.id).toBe('en/post-a');
  });

  it('returns undefined when no sibling exists', () => {
    const result = findTranslation(docs[2]!, docs, 'en');
    expect(result).toBeUndefined();
  });

  it('does not return the input itself when target locale equals current locale', () => {
    const result = findTranslation(docs[0]!, docs, 'es');
    expect(result).toBeUndefined();
  });
});
