import { ImageResponse } from '@vercel/og';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createElement, type ReactNode } from 'react';

import { buildOgSlug, DEFAULT_OG_SLUG } from '../../lib/og';
import { LOCALES, type Locale } from '../../lib/i18n';

/**
 * Dynamic OpenGraph images, rendered at build time by Satori (wrapped by
 * `@vercel/og`'s `ImageResponse`).
 *
 * ## Font choice
 *
 * Satori ONLY accepts raw TTF/OTF font data — it cannot parse WOFF or WOFF2,
 * and `@fontsource-variable/fraunces` ships exclusively WOFF2, so we cannot
 * reuse the runtime web font. Options considered:
 *
 *   (a) Fetch the Google Fonts TTF at build time. Rejected: requires network
 *       during CI builds and adds a runtime failure mode for a deterministic
 *       asset.
 *   (b) Commit a small Fraunces TTF to `src/assets/og/`. Chosen —
 *       deterministic, under 75 KB per weight, and NOT under `public/` so
 *       the raw font is not served to the web. Files are resolved from
 *       `process.cwd()` rather than `import.meta.url`: Vite rewrites
 *       `import.meta.url` during the server-bundle step and the TTFs are
 *       never emitted to `dist/server/`, so a URL-based resolution fails
 *       at prerender time. See the `FONT_DIR` block below for the inline
 *       rationale.
 *   (c) Pass no `fonts` array and let `@vercel/og`'s bundled Geist Regular
 *       take over. Fine as a fallback, but the site's brand is typography-
 *       forward and Fraunces is the display face — the OG image should
 *       match the in-page headline.
 *
 * ## Prerendering
 *
 * Under `output: 'static'` + `getStaticPaths`, this endpoint is prerendered
 * by Astro and emitted as a static `.png` asset by the Vercel adapter — it
 * does NOT become a serverless function. The build output contains PNGs at
 * `dist/og/**`, which the Vercel adapter then copies to
 * `.vercel/output/static/og/**`.
 *
 * ## Why `createElement`, not JSX
 *
 * Astro only recognises `.js/.ts` files under `src/pages/` as endpoints —
 * `.tsx` is rejected at check-time. We therefore build the Satori tree with
 * `React.createElement` directly, which gives us real `ReactElement` values
 * (with the `key` field required by strictest TS) without needing JSX
 * syntax. It's a tiny bit more verbose but the whole tree is only a handful
 * of nodes.
 *
 * ## Slug convention
 *
 * The URL shape is `/og/<collection>/<locale>/<bare-slug>.png`, built via
 * `buildOgSlug` in `src/lib/og.ts`. The Layout's `<meta og:image>` uses the
 * same helper, so the two sides cannot drift.
 */

type OgEntry = {
  id: string;
  collection: 'blog' | 'work';
  data: {
    title: string;
    description?: string;
    tagline?: string;
    lang: Locale;
  };
};

type OgRouteProps = {
  entry: OgEntry | null;
  locale: Locale;
};

// The font files live at `src/assets/og/*.ttf`. We deliberately do NOT use
// `new URL('../..', import.meta.url)` here: Vite rewrites `import.meta.url`
// during the server bundle step and the TTFs are never emitted to the
// `dist/server/` tree, so the rewritten path fails at prerender time.
// Instead we resolve from `process.cwd()` — Astro's build runs with cwd set
// to the project root, and the source tree is always present there. This is
// BUILD-TIME only: `getStaticPaths` causes Astro to prerender all routes
// into static PNGs, so there's no serverless cold-start to worry about.
const FONT_DIR = path.resolve(process.cwd(), 'src/assets/og');
const FRAUNCES_REGULAR_PATH = path.join(FONT_DIR, 'fraunces-regular.ttf');
const FRAUNCES_BOLD_PATH = path.join(FONT_DIR, 'fraunces-bold.ttf');

const DEFAULT_COPY: Record<Locale, { title: string; subtitle: string }> = {
  es: {
    title: 'Facundo Pascale',
    subtitle: 'Arquitecto de software — construyendo producto sin atajos',
  },
  en: {
    title: 'Facundo Pascale',
    subtitle: 'Senior software architect — shipping product without shortcuts',
  },
};

export async function getStaticPaths(): Promise<
  { params: { slug: string }; props: OgRouteProps }[]
> {
  const [blog, work] = await Promise.all([getCollection('blog'), getCollection('work')]);

  const paths: { params: { slug: string }; props: OgRouteProps }[] = [];

  for (const entry of blog) {
    const locale = entry.data.lang;
    paths.push({
      params: { slug: buildOgSlug({ id: entry.id, collection: 'blog', locale }) },
      props: {
        entry: {
          id: entry.id,
          collection: 'blog',
          data: {
            title: entry.data.title,
            description: entry.data.description,
            lang: locale,
          },
        },
        locale,
      },
    });
  }

  for (const entry of work) {
    const locale = entry.data.lang;
    paths.push({
      params: { slug: buildOgSlug({ id: entry.id, collection: 'work', locale }) },
      props: {
        entry: {
          id: entry.id,
          collection: 'work',
          data: {
            title: entry.data.title,
            description: entry.data.description,
            tagline: entry.data.tagline,
            lang: locale,
          },
        },
        locale,
      },
    });
  }

  // Site-wide fallback: one default per locale so pages without an entry
  // (home, about, uses, contact) still get a localized OG image.
  for (const locale of LOCALES) {
    paths.push({
      params: { slug: `${DEFAULT_OG_SLUG}/${locale}` },
      props: { entry: null, locale },
    });
  }

  // Last-resort fallback if the Layout ever cannot derive a locale.
  paths.push({
    params: { slug: DEFAULT_OG_SLUG },
    props: { entry: null, locale: 'es' },
  });

  return paths;
}

function box(style: Record<string, string | number>, ...children: ReactNode[]) {
  return createElement('div', { style }, ...children);
}

export const GET: APIRoute = async ({ props }) => {
  // Astro types `APIContext.props` as `Record<string, any>`. We narrow to the
  // concrete shape we constructed in `getStaticPaths` — no `any` leaks out.
  const { entry, locale } = props as OgRouteProps;

  const fallback = DEFAULT_COPY[locale];
  const title = entry?.data.title ?? fallback.title;
  // Work entries carry BOTH a long `description` and a punchy `tagline`; the
  // OG card has limited room so prefer the tagline. Blog entries only have
  // `description`, and the fallback catches the no-entry case.
  const rawSubtitle =
    entry?.collection === 'work'
      ? (entry.data.tagline ?? entry.data.description ?? fallback.subtitle)
      : (entry?.data.description ?? fallback.subtitle);
  // Overflow guard: at 30px Fraunces in a 1040px column (1200 − 160 padding),
  // roughly 45-55 chars fit per line. 3 lines ≈ 135-165 chars. We cap at 160
  // chars + ellipsis so a worst-case 200-char blog description cannot push
  // the subtitle into the footer. String-level cap is chosen over Satori CSS
  // line-clamp because Satori's CSS subset is version-dependent and a hard
  // truncation is 100% deterministic across any `@vercel/og` version.
  const subtitle =
    rawSubtitle.length > 160 ? `${rawSubtitle.slice(0, 159).trimEnd()}…` : rawSubtitle;

  const [fraunces, frauncesBold] = await Promise.all([
    fs.readFile(FRAUNCES_REGULAR_PATH),
    fs.readFile(FRAUNCES_BOLD_PATH),
  ]);

  const eyebrow =
    entry?.collection === 'work'
      ? locale === 'es'
        ? '// trabajo'
        : '// work'
      : entry?.collection === 'blog'
        ? locale === 'es'
          ? '// notas'
          : '// writing'
        : '// facundopascale.dev';

  const footerLeft =
    locale === 'es'
      ? 'facundo pascale · arquitecto de software'
      : 'facundo pascale · senior software architect';

  const tree = box(
    {
      width: '1200px',
      height: '630px',
      background: '#1c1410',
      color: '#fafaf9',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '80px',
      fontFamily: 'Fraunces',
    },
    box(
      {
        color: '#f97316',
        fontSize: '28px',
        fontFamily: 'monospace',
        letterSpacing: '0.05em',
      },
      eyebrow
    ),
    box(
      { display: 'flex', flexDirection: 'column', gap: '24px' },
      box(
        {
          fontSize: '76px',
          fontWeight: 700,
          lineHeight: 1.1,
          color: '#fafaf9',
        },
        title
      ),
      box(
        {
          fontSize: '30px',
          color: '#a8a29e',
          lineHeight: 1.35,
          fontWeight: 400,
        },
        subtitle
      )
    ),
    box(
      {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '22px',
        color: '#78716c',
        fontFamily: 'monospace',
      },
      box({}, footerLeft),
      box({ color: '#f97316' }, 'facundopascale.dev')
    )
  );

  return new ImageResponse(tree, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Fraunces', data: fraunces, weight: 400, style: 'normal' },
      { name: 'Fraunces', data: frauncesBold, weight: 700, style: 'normal' },
    ],
  });
};
