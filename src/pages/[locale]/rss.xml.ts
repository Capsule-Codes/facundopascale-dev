import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { filterPublished, byLocale, sortByDate } from '../../lib/content';
import { isLocale, type Locale } from '../../lib/i18n';

export async function getStaticPaths() {
  return [{ params: { locale: 'es' } }, { params: { locale: 'en' } }];
}

export const GET: APIRoute = async ({ params, site }) => {
  const { locale } = params;
  if (!locale || !isLocale(locale)) {
    return new Response('Not found', { status: 404 });
  }
  // `site` comes from `astro.config.ts` (`site: 'https://facundopascale.dev'`).
  // Guard narrows the type for `rss()` without a non-null assertion — the
  // typescript-eslint `no-non-null-assertion` rule is active via the v8
  // `recommended` config, so `site!` would warn.
  if (!site) {
    return new Response('Site URL not configured', { status: 500 });
  }

  const loc: Locale = locale;
  const posts = sortByDate(filterPublished(byLocale(await getCollection('blog'), loc)));

  return rss({
    // Name is locale-agnostic; description is localized.
    title: 'Facundo Pascale',
    description:
      loc === 'es' ? 'Notas sobre arquitectura y craft' : 'Notes on architecture and craft',
    site,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.publishedAt,
      // Match the slug shape produced by `src/pages/[locale]/blog/[slug].astro`
      // so the feed link resolves to the real page URL. The Astro 6 glob loader
      // strips `.mdx` already — the defensive replace is a no-op but kept for
      // parity with the sibling route.
      link: `/${loc}/blog/${p.id.replace(`${loc}/`, '').replace(/\.mdx$/, '')}`,
      categories: p.data.tags,
    })),
    // `stylesheet` is omitted: the default already skips the XSL declaration.
  });
};
