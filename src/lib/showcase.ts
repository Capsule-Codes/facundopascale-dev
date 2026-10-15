import { findCaseStudy, type CaseStudyRef } from './case-studies';
import { localizedPath, type Locale } from './i18n';
import type { GalleryImage, ShowcaseProject } from './site-data';
import { wrapIndex } from './work-detail';

export type ProjectHref = { href: string; external: boolean };

/**
 * Where a showcase project points: its case study when one matches the title,
 * otherwise the first external link (website, App Store, Google Play), or `null`.
 */
export function resolveProjectHref(
  project: Pick<ShowcaseProject, 'title' | 'links'>,
  studies: CaseStudyRef[],
  locale: Locale
): ProjectHref | null {
  const study = findCaseStudy(project.title, studies);
  if (study) return { href: localizedPath('work', locale, study.slug), external: false };
  const { live, appStore, playStore } = project.links;
  const external = live ?? appStore ?? playStore;
  return external ? { href: external, external: true } : null;
}

export type DeviceFrame = 'phone' | 'browser';

/** Portrait screenshots sit in a phone frame; everything else in a browser window. */
export function deviceFrameFor(orientation: string | null | undefined): DeviceFrame {
  return orientation?.toLowerCase() === 'portrait' ? 'phone' : 'browser';
}

/** Screenshots to show for a project: the gallery, else the cover image, else none. */
export function showcaseScreens(
  project: Pick<ShowcaseProject, 'title' | 'image' | 'gallery'>
): GalleryImage[] {
  if (project.gallery.length > 0) {
    return project.gallery.map((img) => ({ ...img, alt: img.alt || project.title }));
  }
  return project.image ? [{ src: project.image, alt: project.title, width: 0, height: 0 }] : [];
}

const TAB_STEPS: Record<string, number> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

/**
 * Roving-tabindex target for a key press in a tablist (WAI-ARIA tabs pattern):
 * arrows step and wrap, Home / End jump to the ends, any other key returns `null`.
 */
export function nextTabIndex(current: number, key: string, count: number): number | null {
  if (key === 'Home') return 0;
  if (key === 'End') return Math.max(0, count - 1);
  const step = TAB_STEPS[key];
  return step === undefined ? null : wrapIndex(current, step, count);
}
