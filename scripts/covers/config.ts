export type CoverFrame = 'phone' | 'browser';

export interface CoverConfig {
  /** Kebab-case project slug; also the output folder name. */
  slug: string;
  title: string;
  /** Tagline; "\n" becomes a line break. */
  tagline: string;
  /** Uppercase pill text under the tagline. */
  pill: string;
  /** 2 to 5 hex stops, light to dark, used by the radial background. */
  gradient: string[];
  textColor: string;
  /** Logo path relative to scripts/covers/. */
  logo: string;
  /** Screenshot paths relative to scripts/covers/ (max 2, phone frame only for 2). */
  screenshots: string[];
  frame: CoverFrame;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isValidSlug(slug: string): boolean {
  return SLUG.test(slug);
}

/** Returns a list of human-readable problems; empty means valid. */
export function validateCoverConfig(c: CoverConfig): string[] {
  const errors: string[] = [];
  if (!isValidSlug(c.slug)) errors.push('slug must be lowercase kebab-case');
  if (!c.title.trim()) errors.push('title is required');
  if (!c.tagline.trim()) errors.push('tagline is required');
  if (!c.pill.trim()) errors.push('pill is required');
  if (c.gradient.length < 2 || c.gradient.length > 5 || !c.gradient.every((g) => HEX.test(g))) {
    errors.push('gradient needs 2 to 5 hex colors');
  }
  if (!HEX.test(c.textColor)) errors.push('textColor must be a hex color');
  if (!c.logo.trim()) errors.push('logo is required');
  if (c.screenshots.length < 1 || c.screenshots.length > 2) {
    errors.push('screenshots needs 1 or 2 entries');
  }
  if (c.frame === 'browser' && c.screenshots.length !== 1) {
    errors.push('browser frame takes exactly 1 screenshot');
  }
  return errors;
}
