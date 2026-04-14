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

export function localizedPath(key: PageKey, locale: Locale, slug?: string): string {
  const pathsForKey = PATHS[key];
  if (!pathsForKey) throw new Error(`Unknown page key: ${key}`);
  const segment = pathsForKey[locale];
  const base = segment ? `/${locale}/${segment}` : `/${locale}`;
  return slug ? `${base}/${slug}` : base;
}
