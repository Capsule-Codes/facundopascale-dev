import { describe, it, expect } from 'vitest';
import {
  balancedRows,
  desktopLayout,
  groupGallery,
  lightboxFit,
  nextProject,
  projectLinks,
  swipeStep,
  wrapIndex,
} from '../../src/lib/work-detail.ts';

describe('balancedRows', () => {
  it('returns no rows for an empty gallery', () => {
    expect(balancedRows(0, 4)).toEqual([]);
  });

  it('keeps a single row when everything fits', () => {
    expect(balancedRows(3, 4)).toEqual([3]);
    expect(balancedRows(4, 4)).toEqual([4]);
  });

  it('balances rows instead of leaving a lonely last item', () => {
    expect(balancedRows(5, 4)).toEqual([3, 2]);
    expect(balancedRows(6, 4)).toEqual([3, 3]);
    expect(balancedRows(7, 4)).toEqual([4, 3]);
    expect(balancedRows(8, 4)).toEqual([4, 4]);
    expect(balancedRows(9, 4)).toEqual([3, 3, 3]);
    expect(balancedRows(10, 4)).toEqual([4, 3, 3]);
  });

  it('never exceeds the per-row maximum and always sums to n', () => {
    for (let n = 1; n <= 30; n++) {
      const rows = balancedRows(n, 4);
      expect(rows.reduce((a, b) => a + b, 0)).toBe(n);
      expect(Math.max(...rows)).toBeLessThanOrEqual(4);
      if (rows.length > 1) expect(Math.min(...rows)).toBeGreaterThan(1);
    }
  });

  it('rejects a non-positive maximum', () => {
    expect(() => balancedRows(3, 0)).toThrow();
  });
});

describe('desktopLayout', () => {
  it('features the only shot', () => {
    expect(desktopLayout(1)).toEqual({ featured: true });
  });

  it('features the first shot when the count is odd so the 2-up grid has no orphan', () => {
    expect(desktopLayout(3)).toEqual({ featured: true });
    expect(desktopLayout(7)).toEqual({ featured: true });
  });

  it('keeps a plain 2-up grid when the count is even', () => {
    expect(desktopLayout(2)).toEqual({ featured: false });
    expect(desktopLayout(6)).toEqual({ featured: false });
    expect(desktopLayout(0)).toEqual({ featured: false });
  });
});

describe('groupGallery', () => {
  const d = (src: string) => ({ src, kind: 'desktop' as const });
  const p = (src: string) => ({ src, kind: 'phone' as const });

  it('splits by kind, keeping order inside each group', () => {
    const g = groupGallery([d('a'), p('b'), d('c'), p('d')]);
    expect(g.map((x) => x.kind)).toEqual(['desktop', 'phone']);
    expect(g[0]?.items.map((x) => x.src)).toEqual(['a', 'c']);
    expect(g[1]?.items.map((x) => x.src)).toEqual(['b', 'd']);
  });

  it('orders groups by first appearance', () => {
    expect(groupGallery([p('a'), d('b')]).map((x) => x.kind)).toEqual(['phone', 'desktop']);
  });

  it('omits empty groups', () => {
    expect(groupGallery([p('a'), p('b')]).map((x) => x.kind)).toEqual(['phone']);
    expect(groupGallery([])).toEqual([]);
  });
});

describe('nextProject', () => {
  const list = [
    { slug: 'c', order: 3 },
    { slug: 'a', order: 1 },
    { slug: 'b', order: 2 },
  ];

  it('returns the next entry by work index order', () => {
    expect(nextProject(list, 'a')?.slug).toBe('b');
    expect(nextProject(list, 'b')?.slug).toBe('c');
  });

  it('wraps around after the last entry', () => {
    expect(nextProject(list, 'c')?.slug).toBe('a');
  });

  it('returns undefined for a single entry or an unknown slug', () => {
    expect(nextProject([{ slug: 'a', order: 1 }], 'a')).toBeUndefined();
    expect(nextProject(list, 'zzz')).toBeUndefined();
  });

  it('breaks order ties by slug so the sequence is stable', () => {
    const tied = [
      { slug: 'y', order: 0 },
      { slug: 'x', order: 0 },
    ];
    expect(nextProject(tied, 'x')?.slug).toBe('y');
    expect(nextProject(tied, 'y')?.slug).toBe('x');
  });
});

describe('projectLinks', () => {
  it('returns nothing for no links', () => {
    expect(projectLinks({})).toEqual([]);
  });

  it('detects store listings behind the live link', () => {
    expect(projectLinks({ live: 'https://play.google.com/store/apps/details?id=com.x' })).toEqual([
      { kind: 'playStore', href: 'https://play.google.com/store/apps/details?id=com.x' },
    ]);
    expect(projectLinks({ live: 'https://apps.apple.com/app/id1' })).toEqual([
      { kind: 'appStore', href: 'https://apps.apple.com/app/id1' },
    ]);
  });

  it('labels other live links as a website and keeps a stable order', () => {
    expect(
      projectLinks({
        caseStudy: 'https://example.com/case',
        github: 'https://github.com/x/y',
        live: 'https://www.example.com',
      })
    ).toEqual([
      { kind: 'live', href: 'https://www.example.com' },
      { kind: 'github', href: 'https://github.com/x/y' },
      { kind: 'caseStudy', href: 'https://example.com/case' },
    ]);
  });

  it('does not mistake a lookalike host for a store', () => {
    expect(projectLinks({ live: 'https://apps.apple.com.evil.test/x' })[0]?.kind).toBe('live');
  });
});

describe('wrapIndex', () => {
  it('steps forward and backward', () => {
    expect(wrapIndex(2, 1, 5)).toBe(3);
    expect(wrapIndex(2, -1, 5)).toBe(1);
  });

  it('wraps around both ends', () => {
    expect(wrapIndex(4, 1, 5)).toBe(0);
    expect(wrapIndex(0, -1, 5)).toBe(4);
  });

  it('stays at 0 for an empty or single-item list', () => {
    expect(wrapIndex(0, 1, 1)).toBe(0);
    expect(wrapIndex(0, -1, 0)).toBe(0);
  });
});

describe('swipeStep', () => {
  it('maps a horizontal swipe left to next and right to previous', () => {
    expect(swipeStep(-80, 10)).toBe(1);
    expect(swipeStep(80, -5)).toBe(-1);
  });

  it('ignores short or mostly vertical gestures (scrolling a tall image)', () => {
    expect(swipeStep(-30, 0)).toBe(0);
    expect(swipeStep(-80, 120)).toBe(0);
  });
});

describe('lightboxFit', () => {
  it('fits a screen-shaped capture to the viewport height', () => {
    const fit = lightboxFit(1920, 1200);
    expect(fit.scroll).toBe(false);
    expect(fit.maxWidth).toBe('min(1400px, calc((100dvh - 160px) * 1.6))');
  });

  it('fits a regular phone screenshot to the viewport height', () => {
    expect(lightboxFit(780, 1696).scroll).toBe(false);
  });

  it('lets a long scroll capture keep a readable width and scroll vertically', () => {
    expect(lightboxFit(390, 1365)).toEqual({ maxWidth: 'min(100%, 440px)', scroll: true });
  });
});
