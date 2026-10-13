import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

import { remarkReadingTime } from './src/lib/reading-time';

const SUPABASE_STORAGE_HOST = 'qijznxwebaukhrkqkbdn.supabase.co';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.facundopascale.dev',
  integrations: [
    react(),
    mdx({
      remarkPlugins: [remarkReadingTime],
      shikiConfig: {
        // Dual themes. Shiki emits both styles as `--shiki-light` and
        // `--shiki-dark` CSS variables on every token. With `defaultColor: false`
        // no direct color is inlined, so the visible color is chosen by the
        // override rules in `src/styles/global.css` keyed on `data-theme`.
        // This matches the project's manual theme system and does NOT rely
        // on raw `prefers-color-scheme` media queries on the root.
        themes: {
          light: 'vitesse-light',
          dark: 'vesper',
        },
        defaultColor: false,
        wrap: true,
      },
    }),
    // Sitemap with i18n alternates. `@astrojs/sitemap` v3.7 expects the
    // shape `{ defaultLocale, locales: Record<string, string> }` where each
    // value is the hreflang code. Verified against
    // `node_modules/@astrojs/sitemap/dist/index.d.ts` (`SitemapOptions.i18n`).
    //
    // Codes are plain `es` / `en` (not `es-AR` / `en-US`). Rationale: the
    // page-level `<link rel="alternate" hreflang="...">` tags emitted by
    // Layout.astro use `es` / `en` (see `src/components/Layout.astro` around
    // the hreflang pair). When the sitemap and HTML disagree on the hreflang
    // value, Google treats them as separate clusters and users whose locale
    // is e.g. `es-ES` / `es-MX` can fall outside the `es-AR`-only cluster
    // while still matching `es`. Using plain language codes on both sides
    // aligns the signals and preserves reach.
    //
    // The `filter` callback excludes the project root (`/`) from the
    // sitemap. The root is a redirect shim (`src/pages/index.astro` calls
    // `Astro.redirect('/es/', 301)`; under static output Astro prerenders it as
    // a meta-refresh HTML page served with 200, not a real 301), not a canonical URL. When it is
    // included, the i18n pairing logic emits a duplicate
    // `hreflang="es"` entry in the home `<url>` group — one for `/` and one
    // for `/es/` — which violates the RFC (one href per hreflang value per
    // group). The filter receives absolute URL strings like
    // `https://www.facundopascale.dev/` (verified against
    // `node_modules/@astrojs/sitemap/dist/index.js` line 95), so the regex
    // matches any URL whose path is empty or just `/`.
    sitemap({
      i18n: {
        defaultLocale: 'es',
        locales: {
          es: 'es',
          en: 'en',
        },
      },
      filter: (page) =>
        !/^https?:\/\/[^/]+\/?$/.test(page) &&
        !/^https?:\/\/[^/]+\/admin(\/|$)/.test(page) &&
        !/^https?:\/\/[^/]+\/(es|en)\/newsletter(\/|$)/.test(page),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    // Manual so src/middleware.ts can keep locale routing off `/admin` (unprefixed on-demand
    // pages would otherwise 404). The same options are applied there.
    routing: 'manual',
  },

  // Static-first: pages prerender by default. The Vercel adapter only
  // makes dynamic endpoints (e.g. Astro Actions) run as serverless functions.
  output: 'static',
  // FitCoach became Elevate; keep the old case-study URLs alive.
  redirects: {
    '/en/work/fitcoach': { status: 301, destination: '/en/work/elevate' },
    '/es/trabajo/fitcoach': { status: 301, destination: '/es/trabajo/elevate' },
    '/es/work/fitcoach': { status: 301, destination: '/es/trabajo/elevate' },
  },
  // Origin check on POSTs to on-demand pages (default is already true; explicit for /admin).
  security: { checkOrigin: true },
  // Showcase images live in Supabase Storage. Astro needs the pattern to optimize them; the
  // Vercel optimizer's own allow-list is set in `imagesConfig.remotePatterns` below, because the
  // adapter drops Astro patterns that carry a `protocol` (its filter is always false for them).
  image: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: SUPABASE_STORAGE_HOST,
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  adapter: vercel({
    webAnalytics: { enabled: true },
    imageService: true,
    // Only widths listed in `sizes` can be requested from /_vercel/image; the defaults are too
    // coarse for phone-sized cards and gallery thumbnails. WebP only: at the same quality number sharp's
    // AVIF came out 20-55% larger than WebP on the portrait and the UI screenshots.
    imagesConfig: {
      sizes: [320, 480, 640, 750, 828, 960, 1200, 1440, 1920],
      minimumCacheTTL: 604800,
      remotePatterns: [
        {
          protocol: 'https',
          hostname: SUPABASE_STORAGE_HOST,
          pathname: '/storage/v1/object/public/**',
        },
      ],
    },
  }),
});
