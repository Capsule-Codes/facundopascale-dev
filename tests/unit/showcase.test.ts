import { describe, it, expect } from 'vitest';
import {
  deviceFrameFor,
  nextTabIndex,
  projectFrame,
  resolveProjectHref,
  showcaseScreens,
} from '../../src/lib/showcase';
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

  it('skips empty-string links', () => {
    const p = project('Nope', { live: '', appStore: '', playStore: 'https://play.google.com/x' });
    expect(resolveProjectHref(p, studies, 'es')).toEqual({
      href: 'https://play.google.com/x',
      external: true,
    });
    expect(resolveProjectHref(project('Nope', { live: '' }), studies, 'es')).toBeNull();
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
    expect(deviceFrameFor('vertical')).toBe('phone');
  });

  it('uses a browser frame for everything else', () => {
    expect(deviceFrameFor('landscape')).toBe('browser');
    expect(deviceFrameFor(null)).toBe('browser');
    expect(deviceFrameFor(undefined)).toBe('browser');
  });
});

describe('projectFrame', () => {
  const img = (width: number, height: number) => ({ src: 'x', alt: '', width, height });

  it('reads the first screenshot dimensions before the stored orientation', () => {
    expect(projectFrame({ imageOrientation: null, gallery: [img(1080, 2424)] })).toBe('phone');
    expect(projectFrame({ imageOrientation: 'portrait', gallery: [img(1600, 1000)] })).toBe(
      'browser'
    );
  });

  it('falls back to the stored orientation when dimensions are unknown', () => {
    expect(projectFrame({ imageOrientation: 'vertical', gallery: [img(0, 0)] })).toBe('phone');
    expect(projectFrame({ imageOrientation: null, gallery: [] })).toBe('browser');
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

describe('nextTabIndex', () => {
  it('moves forward with ArrowRight / ArrowDown and wraps at the end', () => {
    expect(nextTabIndex(0, 'ArrowRight', 3)).toBe(1);
    expect(nextTabIndex(1, 'ArrowDown', 3)).toBe(2);
    expect(nextTabIndex(2, 'ArrowRight', 3)).toBe(0);
  });

  it('moves back with ArrowLeft / ArrowUp and wraps at the start', () => {
    expect(nextTabIndex(2, 'ArrowLeft', 3)).toBe(1);
    expect(nextTabIndex(1, 'ArrowUp', 3)).toBe(0);
    expect(nextTabIndex(0, 'ArrowLeft', 3)).toBe(2);
  });

  it('jumps to the ends with Home / End', () => {
    expect(nextTabIndex(1, 'Home', 4)).toBe(0);
    expect(nextTabIndex(1, 'End', 4)).toBe(3);
  });

  it('ignores other keys', () => {
    expect(nextTabIndex(1, 'Enter', 3)).toBeNull();
    expect(nextTabIndex(1, 'a', 3)).toBeNull();
  });

  it('stays at 0 with a single tab', () => {
    expect(nextTabIndex(0, 'ArrowRight', 1)).toBe(0);
  });
});
