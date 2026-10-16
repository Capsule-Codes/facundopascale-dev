import { describe, it, expect } from 'vitest';
import { cardCover } from '../../src/lib/card-cover';

const shot = { src: 'https://cdn/shot.png', alt: 'Shot', width: 1080, height: 2424 };

describe('cardCover', () => {
  it('uses the project cover, not the first gallery screenshot', () => {
    expect(
      cardCover({ title: 'Anchor', image: 'https://cdn/cover.webp', gallery: [shot] })
    ).toEqual({
      src: 'https://cdn/cover.webp',
      alt: 'Anchor',
    });
  });

  it('falls back to the first screenshot when there is no cover', () => {
    expect(cardCover({ title: 'Anchor', image: null, gallery: [shot] })).toEqual({
      src: 'https://cdn/shot.png',
      alt: 'Shot',
    });
    expect(cardCover({ title: 'Anchor', image: '', gallery: [] })).toBeNull();
  });
});
