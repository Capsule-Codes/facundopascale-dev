import { describe, it, expect } from 'vitest';
import { resolveGalleryItem, GALLERY_DIMENSIONS } from '../../src/lib/gallery.ts';

describe('resolveGalleryItem', () => {
  it('defaults to a desktop 16:10 tile', () => {
    const r = resolveGalleryItem({ src: '/a.webp', alt: 'Dashboard' });
    expect(r).toEqual({
      src: '/a.webp',
      alt: 'Dashboard',
      caption: undefined,
      kind: 'desktop',
      ...GALLERY_DIMENSIONS.desktop,
    });
  });

  it('uses phone dimensions for phone screenshots', () => {
    const r = resolveGalleryItem({ src: '/p.webp', alt: 'Home', kind: 'phone' });
    expect(r.width).toBe(GALLERY_DIMENSIONS.phone.width);
    expect(r.height).toBeGreaterThan(r.width);
  });

  it('keeps the caption and explicit dimensions', () => {
    const r = resolveGalleryItem({
      src: '/a.webp',
      alt: 'x',
      caption: 'Weekly view',
      width: 800,
      height: 600,
    });
    expect(r.caption).toBe('Weekly view');
    expect([r.width, r.height]).toEqual([800, 600]);
  });
});
