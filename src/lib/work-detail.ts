/**
 * Pure layout and navigation helpers for the work case study page.
 * Kept free of Astro imports so they can be unit tested.
 */

/**
 * Split `n` items into the fewest rows of at most `max`, with row sizes differing by
 * at most one (bigger rows first). Avoids a lonely last item: 5 → [3, 2], 7 → [4, 3].
 */
export function balancedRows(n: number, max: number): number[] {
  if (max < 1) throw new RangeError('max must be at least 1');
  if (n <= 0) return [];
  const rows = Math.ceil(n / max);
  const base = Math.floor(n / rows);
  const extra = n % rows;
  return Array.from({ length: rows }, (_, i) => base + (i < extra ? 1 : 0));
}

/** 2-up grid for desktop shots: feature the first one when the count is odd, so no orphan. */
export function desktopLayout(n: number): { featured: boolean } {
  return { featured: n % 2 === 1 };
}

export interface GalleryGroup<T extends { kind: string }> {
  kind: T['kind'];
  items: T[];
}

/** Group gallery items by kind, ordering groups by first appearance and keeping item order. */
export function groupGallery<T extends { kind: string }>(items: T[]): GalleryGroup<T>[] {
  const groups = new Map<T['kind'], T[]>();
  for (const item of items) {
    const list = groups.get(item.kind);
    if (list) list.push(item);
    else groups.set(item.kind, [item]);
  }
  return [...groups].map(([kind, list]) => ({ kind, items: list }));
}

/**
 * Next case study after `slug` in work index order (`order` asc, slug as tie-break),
 * wrapping around. Undefined when there is nothing else to show.
 */
export function nextProject<T extends { slug: string; order: number }>(
  entries: T[],
  slug: string
): T | undefined {
  const sorted = [...entries].sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
  const i = sorted.findIndex((e) => e.slug === slug);
  if (i === -1 || sorted.length < 2) return undefined;
  return sorted[(i + 1) % sorted.length];
}

export type ProjectLinkKind = 'live' | 'appStore' | 'playStore' | 'github' | 'caseStudy';

export interface ProjectLink {
  kind: ProjectLinkKind;
  href: string;
}

const STORE_HOSTS: Record<string, ProjectLinkKind> = {
  'apps.apple.com': 'appStore',
  'play.google.com': 'playStore',
};

function liveKind(href: string): ProjectLinkKind {
  try {
    return STORE_HOSTS[new URL(href).hostname] ?? 'live';
  } catch {
    return 'live';
  }
}

/** Frontmatter `links` as an ordered list, classifying store listings behind `live`. */
export function projectLinks(links: {
  live?: string | undefined;
  github?: string | undefined;
  caseStudy?: string | undefined;
}): ProjectLink[] {
  const out: ProjectLink[] = [];
  if (links.live) out.push({ kind: liveKind(links.live), href: links.live });
  if (links.github) out.push({ kind: 'github', href: links.github });
  if (links.caseStudy) out.push({ kind: 'caseStudy', href: links.caseStudy });
  return out;
}

/** Step through `n` items with wrap-around (lightbox prev/next). */
export function wrapIndex(i: number, delta: number, n: number): number {
  if (n <= 1) return 0;
  return (((i + delta) % n) + n) % n;
}

/** Minimum horizontal travel, in px, for a swipe to change the image. */
export const SWIPE_THRESHOLD = 50;

/**
 * Lightbox step for a touch gesture: swipe left → next (1), right → previous (-1).
 * Short or mostly vertical gestures (scrolling a tall capture) return 0.
 */
export function swipeStep(dx: number, dy: number): -1 | 0 | 1 {
  if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return 0;
  return dx < 0 ? 1 : -1;
}

/** Height/width ratio above which a capture is treated as a long scroll screenshot. */
const LONG_CAPTURE_RATIO = 2.3;
/** Room the lightbox toolbar, caption and controls take from the viewport height. */
const LIGHTBOX_CHROME = 160;

/**
 * How the lightbox sizes an image at its natural aspect: screen-shaped shots fit the
 * viewport height; long captures keep a readable width and scroll vertically instead.
 */
export function lightboxFit(width: number, height: number): { maxWidth: string; scroll: boolean } {
  const ratio = height / width;
  if (ratio > LONG_CAPTURE_RATIO) return { maxWidth: 'min(100%, 440px)', scroll: true };
  const aspect = Math.round((width / height) * 1000) / 1000;
  return {
    maxWidth: `min(1400px, calc((100dvh - ${LIGHTBOX_CHROME}px) * ${aspect}))`,
    scroll: false,
  };
}
