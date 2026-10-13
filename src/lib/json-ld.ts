import type { Locale } from './i18n';

const PERSON_NAME = 'Facundo Pascale';

const SAME_AS = [
  'https://github.com/facupascale',
  'https://linkedin.com/in/facundopascale',
  'https://youtube.com/@facundopascale',
];

const absolute = (site: URL, path: string): string => new URL(path, site).toString();

/** Person + WebSite graph for the home pages. */
export function buildHomeJsonLd(site: URL, locale: Locale, description: string) {
  const personId = `${absolute(site, '/')}#person`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': personId,
        name: PERSON_NAME,
        url: absolute(site, `/${locale}/`),
        jobTitle:
          locale === 'es'
            ? 'Cofundador y tech lead de Capsule Codes'
            : 'Co-founder and tech lead at Capsule Codes',
        description,
        sameAs: SAME_AS,
      },
      {
        '@type': 'WebSite',
        '@id': `${absolute(site, '/')}#website`,
        url: absolute(site, '/'),
        name: PERSON_NAME,
        inLanguage: locale,
        publisher: { '@id': personId },
      },
    ],
  };
}

export interface BlogPostingInput {
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  publishedAt: Date;
  updatedAt: Date | null;
  locale: Locale;
}

/** BlogPosting for a single blog post. */
export function buildBlogPostingJsonLd(site: URL, input: BlogPostingInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.title,
    description: input.description,
    url: input.url,
    mainEntityOfPage: input.url,
    inLanguage: input.locale,
    datePublished: input.publishedAt.toISOString(),
    dateModified: (input.updatedAt ?? input.publishedAt).toISOString(),
    ...(input.imageUrl ? { image: input.imageUrl } : {}),
    author: { '@type': 'Person', name: PERSON_NAME, url: absolute(site, `/${input.locale}/`) },
  };
}

/** Serialize for an inline `<script type="application/ld+json">` (escapes `<`). */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
