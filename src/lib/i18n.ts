export const LOCALES = ['es', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'es';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

const PATHS = {
  home: { es: '', en: '' },
  about: { es: 'sobre-mi', en: 'about' },
  work: { es: 'trabajo', en: 'work' },
  blog: { es: 'blog', en: 'blog' },
  uses: { es: 'uses', en: 'uses' },
  contact: { es: 'contacto', en: 'contact' },
} as const satisfies Record<string, Record<Locale, string>>;

export type PageKey = keyof typeof PATHS;

/**
 * Build a site-rooted path for a given page key and locale, always returning
 * the trailing-slash form (e.g. `/es/`, `/en/about/`, `/es/blog/my-post/`).
 *
 * Why trailing slash: Astro's static output materializes every page as
 * `dist/.../index.html`, which browsers and search engines canonicalize to
 * the trailing-slash URL. The `<link rel="canonical">` and `<meta
 * property="og:url">` tags emitted by Layout.astro are derived from
 * `Astro.url.pathname`, which includes that trailing slash. The hreflang
 * cluster MUST agree with the canonical — Google's guide is explicit: the
 * canonical URL must be one of the hrefs listed in the hreflang cluster,
 * otherwise the entire cluster is ignored. Emitting the trailing-slash form
 * here keeps every consumer (Layout canonical, hreflang, anchors, RSS,
 * language switcher) in lockstep with no per-caller glue.
 */
export function localizedPath(key: PageKey, locale: Locale, slug?: string): string {
  const segment = PATHS[key][locale];
  const base = segment ? `/${locale}/${segment}` : `/${locale}`;
  return slug ? `${base}/${slug}/` : `${base}/`;
}
