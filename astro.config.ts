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
    sitemap(),
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
