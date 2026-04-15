import type { Locale } from './i18n';

/**
 * Slug convention for dynamic OpenGraph images.
 *
 * Why a dedicated helper: the plan's two references (endpoint + Layout meta)
 * were building the slug two different ways, producing URLs that disagreed.
 * Centralising it here means both sides import the same function and cannot
 * drift. It also gives us a clean seam for unit tests — the Satori render
 * itself is integration-tested by the build, not unit-tested.
 *
 * URL shape: `/og/<collection>/<locale>/<bare-slug>.png`
 *
 * - Locale lives inside the slug so ES and EN posts get distinct OG images.
 *   Titles and descriptions are localized per entry, so the rendered image
 *   must be too — serving one image for both locales would ship the wrong
 *   language to Twitter/Slack/LinkedIn previews.
 * - The collection prefix (`blog` / `work`) disambiguates posts that share
 *   a bare slug between collections (unlikely today, but the cost is one
 *   extra segment and it makes the scheme future-proof).
 * - `.mdx` is stripped; nested directories under a locale are rejected —
 *   the content collections flatten to `<locale>/<file>.mdx` today and we
 *   want to fail loudly if that ever changes.
 */

export const DEFAULT_OG_SLUG = 'default';

export interface OgSlugInput {
  /**
   * The Astro content entry id. Astro 6's glob loader produces ids of the
   * shape `<locale>/<file>.mdx` (sometimes pre-stripped of `.mdx` — we
   * normalise both). The helper is defensive: passing an already-stripped
   * bare id like `hola-mundo` also works.
   */
  id: string;
  collection: 'blog' | 'work';
  locale: Locale;
}

/**
 * Normalise a content entry into the URL slug used by the `/og/...png`
 * endpoint. Pure, side-effect-free, fully unit-tested.
 */
export function buildOgSlug(input: OgSlugInput): string {
  const withoutExt = input.id.replace(/\.mdx$/, '');
  const withoutLocale = withoutExt.replace(new RegExp(`^${input.locale}/`), '');

  if (withoutLocale.includes('/')) {
    throw new Error(
      `buildOgSlug: nested paths are not supported (got "${input.id}"). ` +
        'Content collections should be flat under each locale directory.'
    );
  }

  return `${input.collection}/${input.locale}/${withoutLocale}`;
}

/**
 * Build the absolute URL for an OG image given a slug and the Astro `site`.
 *
 * Returns `null` when `site` is undefined — callers (the Layout) must then
 * skip emitting `og:image` rather than shipping a relative URL. LinkedIn,
 * Slack and Discord crawlers require an absolute URL with scheme to render
 * a preview, so a relative href is worse than no tag at all.
 */
export function buildOgUrl(slug: string, site: URL | undefined): string | null {
  if (!site) return null;
  return new URL(`/og/${slug}.png`, site).toString();
}
