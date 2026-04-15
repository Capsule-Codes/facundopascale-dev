import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

import { remarkReadingTime } from './src/lib/reading-time';

// https://astro.build/config
export default defineConfig({
  site: 'https://facundopascale.dev',
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
    // With this config the integration emits `<xhtml:link rel="alternate">`
    // entries on every URL that has a locale-prefixed counterpart.
    sitemap({
      i18n: {
        defaultLocale: 'es',
        locales: {
          es: 'es-AR',
          en: 'en-US',
        },
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },

  // Static-first: pages prerender by default. The Vercel adapter only
  // makes dynamic endpoints (e.g. Astro Actions) run as serverless functions.
  output: 'static',
  adapter: vercel({
    webAnalytics: { enabled: true },
    imageService: true,
  }),
});
