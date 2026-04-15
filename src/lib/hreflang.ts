import { localizedPath, type Locale, type PageKey, LOCALES, DEFAULT_LOCALE } from './i18n';

/**
 * A resolved pair of hreflang alternates for the current page. Both sides are
 * absolute-ish path strings (site-rooted, e.g. `/es/blog/foo`). The consumer
 * (Layout.astro) converts them to absolute URLs via `new URL(path, Astro.site)`.
 *
 * Why a pair instead of an array? Because the two locales are fixed, known at
 * compile time, and we always want to emit them together or not at all. A
 * `Record<Locale, string>` makes the call sites trivial to iterate in a stable
 * order and makes the type system catch missing locales.
 */
export type HreflangPair = Record<Locale, string>;

/**
 * Descriptor for a "static" page — one that has a stable `PageKey` in the
 * `PATHS` map and a 1:1 sibling in the other locale. Examples: home, about,
 * uses, contact, the blog index, the work index.
 */
export type StaticPageDescriptor = {
  kind: 'static';
  pageKey: PageKey;
};

/**
 * Descriptor for a content-collection entry (blog post or work case study)
 * whose sibling existence depends on `translationId`. The caller MUST resolve
 * the sibling slug (via `findTranslation` from `src/lib/translations.ts`) and
 * pass it in — this module stays pure and avoids importing from `astro:content`.
 */
export type CollectionPageDescriptor = {
  kind: 'collection';
  collection: 'blog' | 'work';
  currentLocale: Locale;
  currentSlug: string;
  /** Slug of the sibling in the OTHER locale, or `null` if no sibling exists. */
  siblingSlug: string | null;
};

export type PageDescriptor = StaticPageDescriptor | CollectionPageDescriptor;

/**
 * Compute the hreflang pair for a given page. Returns `null` when the page
 * has no sibling in the other locale (orphan content entry) — the caller
 * should skip emitting hreflang tags entirely in that case and rely only on
 * the canonical `<link>` already present in Layout.
 *
 * Note: the ROUTE shape per locale differs (`/es/sobre-mi` ↔ `/en/about`),
 * so we MUST go through `localizedPath` — a naive `pathname.replace('/en/',
 * '/es/')` would produce 404s for every static page with a translated slug.
 */
export function computeHreflangPair(descriptor: PageDescriptor): HreflangPair | null {
  if (descriptor.kind === 'static') {
    const pair: Partial<HreflangPair> = {};
    for (const loc of LOCALES) {
      pair[loc] = localizedPath(descriptor.pageKey, loc);
    }
    return pair as HreflangPair;
  }

  // Collection entry: we need BOTH sides to exist.
  if (descriptor.siblingSlug === null) return null;

  const key = descriptor.collection; // 'blog' | 'work' — both are PageKey values
  const otherLocale: Locale = descriptor.currentLocale === 'es' ? 'en' : 'es';

  const pair: Partial<HreflangPair> = {
    [descriptor.currentLocale]: localizedPath(
      key,
      descriptor.currentLocale,
      descriptor.currentSlug
    ),
    [otherLocale]: localizedPath(key, otherLocale, descriptor.siblingSlug),
  };
  return pair as HreflangPair;
}

/**
 * The `x-default` target. Per the spec and `DEFAULT_LOCALE`, unknown-locale
 * search engines should be pointed at the Spanish home — NOT the current page.
 * This matches what Google recommends when the default is a full site, not
 * a per-URL fallback.
 */
export const X_DEFAULT_PATH: string = localizedPath('home', DEFAULT_LOCALE);
