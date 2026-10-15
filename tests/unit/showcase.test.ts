import { describe, it, expect } from 'vitest';
import { deviceFrameFor, resolveProjectHref, showcaseScreens } from '../../src/lib/showcase';
import type { CaseStudyRef } from '../../src/lib/case-studies';

const studies: CaseStudyRef[] = [
  { slug: 'festivalpro', title: 'Festival Pro' },
  { slug: 'horus', title: 'Horus' },
];

const project = (
  title: string,
  links: { live?: string; appStore?: string; playStore?: string } = {}
) => ({ title, links });

describe('resolveProjectHref', () => {
  it('prefers the matching case study, localized', () => {
    const p = project('Festival PRO', { live: 'https://festival.pro' });
    expect(resolveProjectHref(p, studies, 'es')).toEqual({
      href: '/es/trabajo/festivalpro/',
      external: false,
    });
    expect(resolveProjectHref(p, studies, 'en')).toEqual({
      href: '/en/work/festivalpro/',
      external: false,
    });
  });

  it('falls back to the website, then the App Store, then Google Play', () => {
    const all = {
      live: 'https://a.dev',
      appStore: 'https://apps.apple.com/x',
      playStore: 'https://play.google.com/x',
    };
    expect(resolveProjectHref(project('Nope', all), studies, 'es')).toEqual({
      href: 'https://a.dev',
      external: true,
    });
    expect(
      resolveProjectHref(
        project('Nope', { appStore: all.appStore, playStore: all.playStore }),
        studies,
        'es'
      )
    ).toEqual({ href: all.appStore, external: true });
    expect(
      resolveProjectHref(project('Nope', { playStore: all.playStore }), studies, 'es')
    ).toEqual({
      href: all.playStore,
      external: true,
    });
  });

  it('returns null when there is nowhere to go', () => {
    expect(resolveProjectHref(project('Nope'), studies, 'en')).toBeNull();
  });
});

describe('deviceFrameFor', () => {
  it('uses a phone frame for portrait screenshots', () => {
    expect(deviceFrameFor('portrait')).toBe('phone');
    expect(deviceFrameFor('Portrait')).toBe('phone');
  });

  it('uses a browser frame for everything else', () => {
    expect(deviceFrameFor('landscape')).toBe('browser');
    expect(deviceFrameFor(null)).toBe('browser');
    expect(deviceFrameFor(undefined)).toBe('browser');
  });
});

describe('showcaseScreens', () => {
  const shot = { src: 'https://cdn/x.png', alt: 'X', width: 100, height: 200 };

  it('returns the gallery when it has images', () => {
    expect(
      showcaseScreens({ title: 'T', image: 'https://cdn/cover.png', gallery: [shot] })
    ).toEqual([shot]);
  });

  it('falls back to the cover image with the title as alt', () => {
    expect(showcaseScreens({ title: 'T', image: 'https://cdn/cover.png', gallery: [] })).toEqual([
      { src: 'https://cdn/cover.png', alt: 'T', width: 0, height: 0 },
    ]);
  });

  it('fills a missing gallery alt with the title', () => {
    expect(showcaseScreens({ title: 'T', image: null, gallery: [{ ...shot, alt: '' }] })).toEqual([
      { ...shot, alt: 'T' },
    ]);
  });

  it('is empty without any image', () => {
    expect(showcaseScreens({ title: 'T', image: null, gallery: [] })).toEqual([]);
  });
});
