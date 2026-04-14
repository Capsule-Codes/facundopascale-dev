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
  integrations: [react(), mdx({ remarkPlugins: [remarkReadingTime] }), sitemap()],

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
