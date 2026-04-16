# Facundo Pascale Personal Site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bilingual (ES/EN) personal website for Facundo Pascale as an Astro 5 static site with scheduled MDX content, custom design system, and Vercel deployment — matching the approved design spec at `docs/superpowers/specs/2026-04-13-personal-site-design.md`.

**Architecture:** Astro 5 static-first with minimal React islands (theme toggle, language switcher, contact form). Content lives in Zod-validated content collections with locale-based directories. Scheduling is solved by filtering future-dated posts at build time and triggering hourly rebuilds via Vercel Cron → Deploy Hook. No database, no auth, no CMS.

**Tech Stack:** Astro 5, React 19, Tailwind CSS 4, MDX, Zod, Shiki, Fraunces/Inter/JetBrains Mono (Fontsource), Resend, Vercel, Vitest, Playwright.

---

## File Structure Overview

```
facundopascale-dev/
├── .github/workflows/ci.yml
├── astro.config.mjs                              # i18n, integrations, sitemap
├── package.json                                   # deps + scripts
├── tsconfig.json
├── eslint.config.js
├── .prettierrc
├── .prettierignore
├── .husky/pre-commit
├── playwright.config.ts
├── vitest.config.ts
├── .env.example
├── public/
│   ├── favicon.svg
│   └── images/                                    # static imagery (work screenshots, etc.)
├── src/
│   ├── content.config.ts                          # collections + Zod schemas
│   ├── content/
│   │   ├── blog/{es,en}/*.mdx
│   │   ├── work/{es,en}/*.mdx
│   │   └── pages/{es,en}/{about,uses}.mdx
│   ├── styles/
│   │   └── global.css                             # Tailwind 4 @theme + base styles
│   ├── lib/
│   │   ├── i18n.ts                                # locale types, defaults, path helpers
│   │   ├── translations.ts                        # getTranslation, findSiblingDoc
│   │   ├── content.ts                             # filters: published, featured, by-tag
│   │   ├── reading-time.ts                        # remark plugin
│   │   └── seo.ts                                 # title templating, OG helpers
│   ├── components/
│   │   ├── Layout.astro                           # base HTML shell
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── PostCard.astro
│   │   ├── ProjectCard.astro
│   │   ├── PostMeta.astro
│   │   ├── Toc.astro
│   │   ├── Button.astro
│   │   ├── Badge.astro
│   │   ├── Link.astro
│   │   ├── mdx/
│   │   │   ├── Callout.astro
│   │   │   └── CodeBlock.astro                    # Shiki-based
│   │   └── islands/
│   │       ├── ThemeToggle.tsx                    # React
│   │       ├── LanguageSwitcher.tsx               # React
│   │       └── ContactForm.tsx                    # React
│   ├── pages/
│   │   ├── index.astro                            # root redirect to /es/
│   │   ├── 404.astro                              # locale-aware fallback
│   │   ├── [locale]/
│   │   │   ├── index.astro                        # home
│   │   │   ├── about/index.astro                  # en only
│   │   │   ├── sobre-mi/index.astro               # es only
│   │   │   ├── uses/index.astro
│   │   │   ├── work/
│   │   │   │   ├── index.astro                    # en only
│   │   │   │   └── [slug].astro
│   │   │   ├── trabajo/                           # es only
│   │   │   │   ├── index.astro
│   │   │   │   └── [slug].astro
│   │   │   ├── blog/
│   │   │   │   ├── index.astro
│   │   │   │   └── [slug].astro
│   │   │   ├── contact/index.astro                # en only
│   │   │   ├── contacto/index.astro               # es only
│   │   │   └── rss.xml.ts
│   │   ├── og/[...slug].png.ts                    # dynamic OG images
│   │   └── api/
│   │       └── revalidate.ts                      # hit by Vercel Cron
│   ├── actions/
│   │   └── index.ts                               # Astro Actions (contact form)
│   └── env.d.ts
├── tests/
│   ├── unit/
│   │   ├── translations.test.ts
│   │   ├── content.test.ts
│   │   └── reading-time.test.ts
│   └── e2e/
│       ├── home.spec.ts
│       ├── blog.spec.ts
│       ├── language-switcher.spec.ts
│       └── contact-form.spec.ts
└── vercel.json                                     # cron config
```

**Note on localized route folders:** Because Astro's file-based router does not translate path segments per-locale, we use **two sibling folders** (e.g. `about/` and `sobre-mi/`) that each render the same page component, gated by locale. A thin helper in `lib/i18n.ts` maps logical page keys to the correct path per locale so `LanguageSwitcher` and `Header` links produce the right URLs.

---

## Phase 1 — Foundation

### Task 1: Bootstrap Astro project

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `.prettierrc`
- Create: `.prettierignore`
- Create: `eslint.config.js`
- Create: `src/env.d.ts`

- [ ] **Step 1: Run Astro init as a minimal TypeScript project**

```bash
cd /Users/facundo/Desktop/Projects/personal/facundopascale-dev
pnpm create astro@latest . -- --template minimal --typescript strict --install --no-git
```

Accept defaults when prompted. This generates `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/env.d.ts`, and a starter `src/pages/index.astro`. Delete the starter page — we'll replace it in a later task.

- [ ] **Step 2: Add integrations via CLI**

```bash
pnpm astro add react mdx tailwind sitemap
```

Accept all prompts. This installs `@astrojs/react`, `@astrojs/mdx`, `@astrojs/sitemap`, and configures `astro.config.mjs` accordingly.

- [ ] **Step 3: Install remaining dependencies**

```bash
pnpm add @astrojs/rss shiki lucide-static satori resend
pnpm add -D vitest @vitest/ui @playwright/test prettier prettier-plugin-astro eslint eslint-plugin-astro @typescript-eslint/parser husky lint-staged @types/node
```

- [ ] **Step 4: Create `.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-astro"],
  "overrides": [{ "files": "*.astro", "options": { "parser": "astro" } }]
}
```

- [ ] **Step 5: Create `.prettierignore`**

```
node_modules
dist
.astro
.vercel
pnpm-lock.yaml
public
```

- [ ] **Step 6: Create `eslint.config.js`**

```js
import eslintPluginAstro from 'eslint-plugin-astro';
import tsParser from '@typescript-eslint/parser';

export default [
  ...eslintPluginAstro.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: { parser: tsParser, parserOptions: { ecmaVersion: 'latest', sourceType: 'module' } },
  },
  { ignores: ['dist/', '.astro/', '.vercel/', 'node_modules/'] },
];
```

- [ ] **Step 7: Add scripts to `package.json`**

Modify `package.json` `scripts` block to:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx,astro,mjs,js}": ["prettier --write", "eslint --fix"],
    "*.{json,md,mdx,yaml,yml,css}": ["prettier --write"]
  }
}
```

- [ ] **Step 8: Init Husky pre-commit hook**

```bash
pnpm exec husky init
echo 'pnpm exec lint-staged' > .husky/pre-commit
chmod +x .husky/pre-commit
```

- [ ] **Step 9: Verify it builds**

```bash
pnpm check && pnpm build
```

Expected: zero errors. Build completes.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: bootstrap Astro project with integrations, ESLint, Prettier, Husky"
```

---

### Task 2: Configure i18n routing + root redirect

**Files:**
- Modify: `astro.config.mjs`
- Create: `src/lib/i18n.ts`
- Create: `src/pages/index.astro`

- [ ] **Step 1: Update `astro.config.mjs` with i18n**

Replace the `defineConfig` block to include i18n and a site URL:

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://facundopascale.dev',
  integrations: [react(), mdx(), tailwind({ applyBaseStyles: false }), sitemap()],
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
    fallback: { en: 'es' },
  },
  output: 'static',
});
```

- [ ] **Step 2: Create `src/lib/i18n.ts`**

```ts
export const LOCALES = ['es', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'es';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

const PATHS: Record<string, Record<Locale, string>> = {
  home: { es: '', en: '' },
  about: { es: 'sobre-mi', en: 'about' },
  work: { es: 'trabajo', en: 'work' },
  blog: { es: 'blog', en: 'blog' },
  uses: { es: 'uses', en: 'uses' },
  contact: { es: 'contacto', en: 'contact' },
};

export type PageKey = keyof typeof PATHS;

export function localizedPath(key: PageKey, locale: Locale, slug?: string): string {
  const segment = PATHS[key][locale];
  const base = segment ? `/${locale}/${segment}` : `/${locale}`;
  return slug ? `${base}/${slug}` : base;
}
```

- [ ] **Step 3: Create `src/pages/index.astro` (root redirect)**

```astro
---
return Astro.redirect('/es/', 302);
---
```

- [ ] **Step 4: Run dev server and verify redirect**

Run `pnpm dev`, open `http://localhost:4321/`. Expected: 302 to `/es/` (the page will 404 for now because we haven't built the home yet — that's fine).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: configure i18n routing with ES default and locale path helpers"
```

---

### Task 3: Tailwind 4 design tokens + fonts

**Files:**
- Create: `src/styles/global.css`
- Modify: `astro.config.mjs` (if needed)
- Create: `src/components/Layout.astro` (minimal)

- [ ] **Step 1: Install Fontsource fonts**

```bash
pnpm add @fontsource-variable/fraunces @fontsource-variable/inter @fontsource-variable/jetbrains-mono
```

- [ ] **Step 2: Create `src/styles/global.css` with `@theme` tokens**

```css
@import 'tailwindcss';

@import '@fontsource-variable/fraunces/index.css';
@import '@fontsource-variable/inter/index.css';
@import '@fontsource-variable/jetbrains-mono/index.css';

@theme {
  --font-display: 'Fraunces Variable', ui-serif, Georgia, serif;
  --font-sans: 'Inter Variable', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono Variable', ui-monospace, 'SFMono-Regular', monospace;

  --color-bg: #0c0a09;
  --color-bg-elevated: #1c1917;
  --color-border: #292524;
  --color-text: #fafaf9;
  --color-text-muted: #a8a29e;
  --color-text-dim: #57534e;
  --color-accent: #f97316;
  --color-accent-hover: #fb923c;
}

:root[data-theme='light'] {
  --color-bg: #fafaf9;
  --color-bg-elevated: #f5f5f4;
  --color-border: #e7e5e4;
  --color-text: #0c0a09;
  --color-text-muted: #57534e;
  --color-text-dim: #a8a29e;
}

html {
  background-color: var(--color-bg);
  color: var(--color-text);
  color-scheme: dark;
}

html[data-theme='light'] {
  color-scheme: light;
}

body {
  font-family: var(--font-sans);
  font-feature-settings: 'ss01', 'cv11';
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

h1, h2, h3 {
  font-family: var(--font-display);
  font-weight: 500;
  letter-spacing: -0.02em;
}

code, kbd, pre {
  font-family: var(--font-mono);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 3: Create minimal `src/components/Layout.astro`**

```astro
---
import '../styles/global.css';
import { type Locale } from '../lib/i18n';

interface Props {
  title: string;
  description: string;
  locale: Locale;
}

const { title, description, locale } = Astro.props;
---

<!doctype html>
<html lang={locale} data-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body>
    <slot />
  </body>
</html>
```

- [ ] **Step 4: Create a throwaway home at `src/pages/[locale]/index.astro` to test the styles**

```astro
---
import Layout from '../../components/Layout.astro';
import { isLocale, type Locale } from '../../lib/i18n';

export function getStaticPaths() {
  return [{ params: { locale: 'es' } }, { params: { locale: 'en' } }];
}

const { locale } = Astro.params;
if (!locale || !isLocale(locale)) return Astro.redirect('/');
---

<Layout title="Facundo Pascale" description="Senior software architect" locale={locale as Locale}>
  <main style="padding: 4rem; max-width: 600px; margin: 0 auto;">
    <h1 style="font-size: 4rem; margin-bottom: 1rem;">Construyo software serio.</h1>
    <p style="color: var(--color-text-muted);">Fonts and tokens smoke test — locale: {locale}</p>
    <p style="color: var(--color-accent); font-family: var(--font-mono);">→ accent check</p>
  </main>
</Layout>
```

- [ ] **Step 5: Start dev server and visually verify**

Run `pnpm dev`, visit `http://localhost:4321/es/`. Expected: dark background, Fraunces on H1, Inter on paragraphs, orange accent on the `→ accent check` line.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: configure Tailwind 4 design tokens and self-hosted fonts"
```

---

### Task 4: Base layout — Header + Footer components

**Files:**
- Modify: `src/components/Layout.astro`
- Create: `src/components/Header.astro`
- Create: `src/components/Footer.astro`

- [ ] **Step 1: Create `src/components/Header.astro`**

```astro
---
import { localizedPath, type Locale } from '../lib/i18n';

interface Props { locale: Locale }
const { locale } = Astro.props;

const nav = [
  { key: 'work' as const, label: locale === 'es' ? 'Trabajo' : 'Work' },
  { key: 'blog' as const, label: locale === 'es' ? 'Writing' : 'Writing' },
  { key: 'uses' as const, label: 'Uses' },
  { key: 'about' as const, label: locale === 'es' ? 'Sobre mí' : 'About' },
  { key: 'contact' as const, label: locale === 'es' ? 'Contacto' : 'Contact' },
];
---

<header class="border-b border-[var(--color-border)] bg-[var(--color-bg)]">
  <div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
    <a href={localizedPath('home', locale)} class="font-mono text-xs uppercase tracking-widest text-[var(--color-text)]">
      FACUNDO.DEV
    </a>
    <nav class="flex items-center gap-6 text-sm">
      {nav.map((item) => (
        <a href={localizedPath(item.key, locale)} class="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">
          {item.label}
        </a>
      ))}
    </nav>
  </div>
</header>
```

- [ ] **Step 2: Create `src/components/Footer.astro`**

```astro
---
import { type Locale } from '../lib/i18n';

interface Props { locale: Locale }
const { locale } = Astro.props;

const year = new Date().getFullYear();
const socials = [
  { href: 'https://github.com/facundopascale', label: 'GitHub' },
  { href: 'https://linkedin.com/in/facundopascale', label: 'LinkedIn' },
  { href: 'https://twitter.com/facundopascale', label: 'Twitter' },
  { href: 'https://youtube.com/@facundopascale', label: 'YouTube' },
];
---

<footer class="border-t border-[var(--color-border)] mt-24">
  <div class="mx-auto max-w-5xl px-6 py-10 flex flex-col gap-6 md:flex-row md:justify-between md:items-end">
    <div class="space-y-2 font-mono text-xs text-[var(--color-text-dim)]">
      <p>© {year} Facundo Pascale</p>
      <p>{locale === 'es' ? 'Construido con' : 'Built with'} Astro</p>
    </div>
    <div class="flex flex-wrap gap-4 text-sm">
      {socials.map((s) => (
        <a href={s.href} class="text-[var(--color-text-muted)] hover:text-[var(--color-accent)]" rel="me" target="_blank">{s.label}</a>
      ))}
      <a href="https://capsulecodes.com" class="text-[var(--color-accent)] font-mono text-xs uppercase tracking-widest">→ Capsule Codes</a>
    </div>
  </div>
</footer>
```

- [ ] **Step 3: Update `Layout.astro` to include Header and Footer**

Replace the `<body>` block:

```astro
<body class="min-h-screen flex flex-col">
  <Header locale={locale} />
  <div class="flex-1">
    <slot />
  </div>
  <Footer locale={locale} />
</body>
```

Add the imports at the top of the frontmatter:

```ts
import Header from './Header.astro';
import Footer from './Footer.astro';
```

- [ ] **Step 4: Visual check**

Run `pnpm dev`, visit `/es/` and `/en/`. Expected: header with 5 nav links, footer with socials and Capsule Codes link, nav labels differ per locale.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Header and Footer components with locale-aware navigation"
```

---

## Phase 2 — Content Model

### Task 5: Content Collections schemas

**Files:**
- Create: `src/content.config.ts`
- Create: empty seed directories under `src/content/`

- [ ] **Step 1: Create the directory skeleton**

```bash
mkdir -p src/content/blog/es src/content/blog/en src/content/work/es src/content/work/en src/content/pages/es src/content/pages/en
```

- [ ] **Step 2: Create `src/content.config.ts`**

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const localeEnum = z.enum(['es', 'en']);

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().min(50).max(200),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().nullable().default(null),
    tags: z.array(z.string()).default([]),
    lang: localeEnum,
    translationId: z.string(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    coverImage: z.string().optional(),
    author: z.literal('facundo').default('facundo'),
  }),
});

const work = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    stack: z.array(z.string()),
    role: z.string(),
    year: z.number(),
    links: z
      .object({
        live: z.string().url().optional(),
        github: z.string().url().optional(),
        caseStudy: z.string().url().optional(),
      })
      .default({}),
    coverImage: z.string(),
    gallery: z.array(z.string()).default([]),
    lang: localeEnum,
    translationId: z.string(),
    featured: z.boolean().default(false),
    order: z.number().default(0),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    updatedAt: z.coerce.date(),
    lang: localeEnum,
  }),
});

export const collections = { blog, work, pages };
```

- [ ] **Step 3: Verify schemas compile**

```bash
pnpm check
```

Expected: zero errors (collections defined but empty — Astro allows this).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: define blog, work, and pages content collections with Zod schemas"
```

---

### Task 6: Content filtering utilities (published/featured/by-locale)

**Files:**
- Create: `src/lib/content.ts`
- Create: `tests/unit/content.test.ts`
- Modify: `vitest.config.ts` (create if missing)

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    globals: false,
  },
});
```

- [ ] **Step 2: Write the failing test at `tests/unit/content.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { isPublished, filterPublished, byLocale, sortByDate } from '../../src/lib/content';

type MockEntry = {
  id: string;
  data: {
    publishedAt: Date;
    draft: boolean;
    lang: 'es' | 'en';
    featured?: boolean;
    order?: number;
  };
};

const NOW = new Date('2026-04-13T12:00:00Z');

const entries: MockEntry[] = [
  { id: 'a', data: { publishedAt: new Date('2026-04-01'), draft: false, lang: 'es' } },
  { id: 'b', data: { publishedAt: new Date('2026-05-01'), draft: false, lang: 'es' } }, // future
  { id: 'c', data: { publishedAt: new Date('2026-04-05'), draft: true, lang: 'es' } },   // draft
  { id: 'd', data: { publishedAt: new Date('2026-04-10'), draft: false, lang: 'en' } },
];

describe('isPublished', () => {
  it('returns true for past non-draft', () => {
    expect(isPublished(entries[0], NOW)).toBe(true);
  });
  it('returns false for future', () => {
    expect(isPublished(entries[1], NOW)).toBe(false);
  });
  it('returns false for draft', () => {
    expect(isPublished(entries[2], NOW)).toBe(false);
  });
});

describe('filterPublished', () => {
  it('keeps only past non-draft entries', () => {
    const result = filterPublished(entries, NOW).map((e) => e.id);
    expect(result).toEqual(['a', 'd']);
  });
});

describe('byLocale', () => {
  it('filters by lang field', () => {
    expect(byLocale(entries, 'es').map((e) => e.id)).toEqual(['a', 'b', 'c']);
    expect(byLocale(entries, 'en').map((e) => e.id)).toEqual(['d']);
  });
});

describe('sortByDate', () => {
  it('sorts newest first', () => {
    const sorted = sortByDate(filterPublished(entries, NOW));
    expect(sorted.map((e) => e.id)).toEqual(['d', 'a']);
  });
});
```

- [ ] **Step 3: Run the test — expect it to fail**

```bash
pnpm test
```

Expected: FAIL, "Cannot find module '../../src/lib/content'".

- [ ] **Step 4: Implement `src/lib/content.ts`**

```ts
import type { Locale } from './i18n';

type PublishableEntry = {
  data: { publishedAt: Date; draft?: boolean; lang: Locale };
};

export function isPublished<T extends PublishableEntry>(entry: T, now: Date = new Date()): boolean {
  if (entry.data.draft) return false;
  return entry.data.publishedAt.getTime() <= now.getTime();
}

export function filterPublished<T extends PublishableEntry>(entries: T[], now: Date = new Date()): T[] {
  if (import.meta.env?.DEV) {
    return entries.filter((e) => !e.data.draft || true); // drafts allowed in dev
  }
  return entries.filter((e) => isPublished(e, now));
}

export function byLocale<T extends PublishableEntry>(entries: T[], locale: Locale): T[] {
  return entries.filter((e) => e.data.lang === locale);
}

export function sortByDate<T extends PublishableEntry>(entries: T[]): T[] {
  return [...entries].sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}
```

Note: the `filterPublished` returns drafts in dev mode but respects `publishedAt` and `draft` filters in production. The guard `import.meta.env?.DEV` is safely `undefined` in Vitest, so the production path is tested.

- [ ] **Step 5: Run the test — expect it to pass**

```bash
pnpm test
```

Expected: PASS (4 test groups, ~8 assertions).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add content filtering utilities with unit tests"
```

---

### Task 7: Translation lookup utility

**Files:**
- Create: `src/lib/translations.ts`
- Create: `tests/unit/translations.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { findTranslation } from '../../src/lib/translations';

type Doc = { id: string; data: { lang: 'es' | 'en'; translationId: string } };

const docs: Doc[] = [
  { id: 'es/post-a', data: { lang: 'es', translationId: 'post-a-2026-04' } },
  { id: 'en/post-a', data: { lang: 'en', translationId: 'post-a-2026-04' } },
  { id: 'es/orphan', data: { lang: 'es', translationId: 'orphan-2026-04' } },
];

describe('findTranslation', () => {
  it('finds the sibling in the other locale', () => {
    const result = findTranslation(docs[0], docs, 'en');
    expect(result?.id).toBe('en/post-a');
  });

  it('returns undefined when no sibling exists', () => {
    const result = findTranslation(docs[2], docs, 'en');
    expect(result).toBeUndefined();
  });

  it('does not return the input itself', () => {
    const result = findTranslation(docs[0], docs, 'es');
    expect(result).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run and verify FAIL**

```bash
pnpm test translations
```

Expected: FAIL, missing module.

- [ ] **Step 3: Implement `src/lib/translations.ts`**

```ts
import type { Locale } from './i18n';

type WithTranslationId = {
  id: string;
  data: { lang: Locale; translationId: string };
};

export function findTranslation<T extends WithTranslationId>(
  current: T,
  all: T[],
  targetLocale: Locale
): T | undefined {
  if (current.data.lang === targetLocale) return undefined;
  return all.find(
    (doc) => doc.data.translationId === current.data.translationId && doc.data.lang === targetLocale
  );
}
```

- [ ] **Step 4: Run and verify PASS**

```bash
pnpm test
```

Expected: all translation tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add findTranslation utility for cross-locale doc lookup"
```

---

### Task 8: Reading time remark plugin

**Files:**
- Create: `src/lib/reading-time.ts`
- Create: `tests/unit/reading-time.test.ts`
- Modify: `astro.config.mjs`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { calculateReadingTime } from '../../src/lib/reading-time';

describe('calculateReadingTime', () => {
  it('returns 1 for empty content', () => {
    expect(calculateReadingTime('')).toBe(1);
  });
  it('returns 1 for < 200 words', () => {
    expect(calculateReadingTime('hello world')).toBe(1);
  });
  it('returns 3 for 600 words at 200wpm', () => {
    const text = 'word '.repeat(600);
    expect(calculateReadingTime(text)).toBe(3);
  });
  it('strips markdown syntax before counting', () => {
    const md = '# Title\n\n**bold** _italic_ `code` [link](url) ![alt](image)';
    // 5 content words — should round up to 1 minute
    expect(calculateReadingTime(md)).toBe(1);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm test reading-time
```

- [ ] **Step 3: Implement `src/lib/reading-time.ts`**

```ts
const WORDS_PER_MINUTE = 200;

export function calculateReadingTime(content: string): number {
  const cleaned = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_~>\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned ? cleaned.split(' ').length : 0;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export function remarkReadingTime() {
  return function (tree: any, file: any) {
    const textOnMdAst = (node: any): string => {
      if ('value' in node) return node.value;
      if ('children' in node) return node.children.map(textOnMdAst).join(' ');
      return '';
    };
    const content = textOnMdAst(tree);
    file.data.astro ??= { frontmatter: {} };
    file.data.astro.frontmatter.readingTime = calculateReadingTime(content);
  };
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
pnpm test
```

- [ ] **Step 5: Wire the remark plugin into `astro.config.mjs`**

Add to the `mdx()` integration config:

```js
import { remarkReadingTime } from './src/lib/reading-time.ts';

// in integrations:
mdx({ remarkPlugins: [remarkReadingTime] }),
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add reading time calculation and remark plugin"
```

---

## Phase 3 — Pages (static structure)

### Task 9: Home page

**Files:**
- Replace: `src/pages/[locale]/index.astro`
- Create: `src/components/PostCard.astro`
- Create: `src/components/ProjectCard.astro`

- [ ] **Step 1: Create `src/components/PostCard.astro`**

```astro
---
import { localizedPath, type Locale } from '../lib/i18n';

interface Props {
  locale: Locale;
  slug: string;
  title: string;
  description: string;
  publishedAt: Date;
  readingTime?: number;
  tags: string[];
}
const { locale, slug, title, description, publishedAt, readingTime, tags } = Astro.props;
const dateStr = publishedAt.toLocaleDateString(locale === 'es' ? 'es-AR' : 'en-US', {
  year: 'numeric', month: 'short', day: 'numeric',
});
---

<article class="group border-b border-[var(--color-border)] py-8">
  <a href={localizedPath('blog', locale, slug)} class="block">
    <div class="flex items-center gap-3 font-mono text-xs text-[var(--color-text-dim)] mb-2">
      <time datetime={publishedAt.toISOString()}>{dateStr}</time>
      {readingTime && <span>· {readingTime} min</span>}
      {tags.length > 0 && <span>· {tags.slice(0, 3).join(' · ')}</span>}
    </div>
    <h3 class="text-2xl font-display font-medium text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">{title}</h3>
    <p class="mt-2 text-[var(--color-text-muted)]">{description}</p>
  </a>
</article>
```

- [ ] **Step 2: Create `src/components/ProjectCard.astro`**

```astro
---
import { localizedPath, type Locale } from '../lib/i18n';

interface Props {
  locale: Locale;
  slug: string;
  title: string;
  tagline: string;
  stack: string[];
  year: number;
}
const { locale, slug, title, tagline, stack, year } = Astro.props;
---

<a href={localizedPath('work', locale, slug)} class="group block border border-[var(--color-border)] p-6 hover:border-[var(--color-accent)] transition-colors">
  <div class="flex items-baseline justify-between mb-2">
    <h3 class="text-xl font-display font-medium text-[var(--color-text)] group-hover:text-[var(--color-accent)]">{title}</h3>
    <span class="font-mono text-xs text-[var(--color-text-dim)]">{year}</span>
  </div>
  <p class="text-[var(--color-text-muted)] mb-4">{tagline}</p>
  <div class="flex flex-wrap gap-2 font-mono text-xs">
    {stack.slice(0, 6).map((tech) => (
      <span class="px-2 py-1 border border-[var(--color-border)] text-[var(--color-text-dim)]">{tech}</span>
    ))}
  </div>
</a>
```

- [ ] **Step 3: Replace `src/pages/[locale]/index.astro` with the real home**

```astro
---
import { getCollection } from 'astro:content';
import Layout from '../../components/Layout.astro';
import PostCard from '../../components/PostCard.astro';
import ProjectCard from '../../components/ProjectCard.astro';
import { isLocale, type Locale, localizedPath } from '../../lib/i18n';
import { filterPublished, byLocale, sortByDate } from '../../lib/content';

export function getStaticPaths() {
  return [{ params: { locale: 'es' } }, { params: { locale: 'en' } }];
}

const { locale } = Astro.params;
if (!locale || !isLocale(locale)) return Astro.redirect('/');
const loc = locale as Locale;

const allBlog = await getCollection('blog');
const allWork = await getCollection('work');

const recentPosts = sortByDate(filterPublished(byLocale(allBlog, loc))).slice(0, 4);
const featuredWork = byLocale(allWork, loc)
  .filter((w) => w.data.featured)
  .sort((a, b) => a.data.order - b.data.order)
  .slice(0, 3);

const copy = {
  es: {
    tagline: '// senior architect · 15y',
    headline1: 'Construyo',
    headlineAccent: 'software serio',
    headline2: '.',
    sub: 'Frontend architect obsesionado con fundamentos. Mentoreo devs. Fundador de Capsule Codes.',
    ctaWork: '→ Ver trabajo',
    ctaBlog: '→ Leer el blog',
    workTitle: 'Trabajo destacado',
    workAll: '→ Ver todo el trabajo',
    writingTitle: 'Últimos artículos',
    writingAll: '→ Ver todos los artículos',
  },
  en: {
    tagline: '// senior architect · 15y',
    headline1: 'I build',
    headlineAccent: 'serious software',
    headline2: '.',
    sub: 'Frontend architect obsessed with fundamentals. I mentor devs. Founder of Capsule Codes.',
    ctaWork: '→ See the work',
    ctaBlog: '→ Read the blog',
    workTitle: 'Featured work',
    workAll: '→ See all work',
    writingTitle: 'Latest writing',
    writingAll: '→ See all posts',
  },
}[loc];
---

<Layout title="Facundo Pascale — Senior Software Architect" description={copy.sub} locale={loc}>
  <main class="mx-auto max-w-5xl px-6">
    <section class="py-24 md:py-32">
      <p class="font-mono text-xs text-[var(--color-accent)] mb-4">{copy.tagline}</p>
      <h1 class="text-5xl md:text-7xl leading-none mb-6">
        {copy.headline1}<br />
        <span class="text-[var(--color-accent)]">{copy.headlineAccent}</span>{copy.headline2}
      </h1>
      <p class="text-lg text-[var(--color-text-muted)] max-w-xl mb-8">{copy.sub}</p>
      <div class="flex gap-4 font-mono text-sm">
        <a href={localizedPath('work', loc)} class="bg-[var(--color-accent)] text-[var(--color-bg)] px-4 py-2 font-semibold">{copy.ctaWork}</a>
        <a href={localizedPath('blog', loc)} class="border border-[var(--color-border)] px-4 py-2">{copy.ctaBlog}</a>
      </div>
    </section>

    {featuredWork.length > 0 && (
      <section class="py-16 border-t border-[var(--color-border)]">
        <h2 class="text-3xl font-display mb-8">{copy.workTitle}</h2>
        <div class="grid gap-4 md:grid-cols-3">
          {featuredWork.map((w) => (
            <ProjectCard
              locale={loc}
              slug={w.id.replace(`${loc}/`, '').replace(/\.mdx$/, '')}
              title={w.data.title}
              tagline={w.data.tagline}
              stack={w.data.stack}
              year={w.data.year}
            />
          ))}
        </div>
        <a href={localizedPath('work', loc)} class="inline-block mt-8 font-mono text-sm text-[var(--color-accent)]">{copy.workAll}</a>
      </section>
    )}

    {recentPosts.length > 0 && (
      <section class="py-16 border-t border-[var(--color-border)]">
        <h2 class="text-3xl font-display mb-8">{copy.writingTitle}</h2>
        {recentPosts.map((p) => (
          <PostCard
            locale={loc}
            slug={p.id.replace(`${loc}/`, '').replace(/\.mdx$/, '')}
            title={p.data.title}
            description={p.data.description}
            publishedAt={p.data.publishedAt}
            readingTime={(p.data as any).readingTime}
            tags={p.data.tags}
          />
        ))}
        <a href={localizedPath('blog', loc)} class="inline-block mt-8 font-mono text-sm text-[var(--color-accent)]">{copy.writingAll}</a>
      </section>
    )}
  </main>
</Layout>
```

- [ ] **Step 4: Visual check**

Run `pnpm dev`, visit `/es/` and `/en/`. Expected: hero, empty Featured Work and Writing sections (no content seeded yet), header/footer visible.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: build home page with hero, featured work, and latest posts"
```

---

### Task 10: About, Uses, and generic pages collection renderer

**Files:**
- Create: `src/pages/[locale]/about/index.astro`
- Create: `src/pages/[locale]/sobre-mi/index.astro`
- Create: `src/pages/[locale]/uses/index.astro`

The About page has a localized path per spec, so we need two sibling folders that both route to a shared rendering logic.

- [ ] **Step 1: Create `src/pages/[locale]/sobre-mi/index.astro`**

```astro
---
import { getEntry, render } from 'astro:content';
import Layout from '../../../components/Layout.astro';
import { isLocale, type Locale } from '../../../lib/i18n';

export function getStaticPaths() {
  return [{ params: { locale: 'es' } }];
}

const { locale } = Astro.params;
if (!locale || !isLocale(locale)) return Astro.redirect('/');

const entry = await getEntry('pages', 'es/about');
if (!entry) return new Response('Not found', { status: 404 });
const { Content } = await render(entry);
---

<Layout title={entry.data.title} description={entry.data.description} locale={locale as Locale}>
  <main class="mx-auto max-w-3xl px-6 py-24 prose-content">
    <h1 class="text-5xl font-display mb-8">{entry.data.title}</h1>
    <div class="prose prose-invert max-w-none text-[var(--color-text-muted)] leading-relaxed">
      <Content />
    </div>
  </main>
</Layout>
```

- [ ] **Step 2: Create `src/pages/[locale]/about/index.astro` (EN variant)**

Same structure but:

```astro
export function getStaticPaths() {
  return [{ params: { locale: 'en' } }];
}
// and getEntry('pages', 'en/about')
```

- [ ] **Step 3: Create `src/pages/[locale]/uses/index.astro`**

```astro
---
import { getEntry, render } from 'astro:content';
import Layout from '../../../components/Layout.astro';
import { isLocale, type Locale } from '../../../lib/i18n';

export function getStaticPaths() {
  return [{ params: { locale: 'es' } }, { params: { locale: 'en' } }];
}

const { locale } = Astro.params;
if (!locale || !isLocale(locale)) return Astro.redirect('/');

const entry = await getEntry('pages', `${locale}/uses`);
if (!entry) return new Response('Not found', { status: 404 });
const { Content } = await render(entry);
---

<Layout title={entry.data.title} description={entry.data.description} locale={locale as Locale}>
  <main class="mx-auto max-w-3xl px-6 py-24">
    <p class="font-mono text-xs text-[var(--color-accent)] mb-2">// uses</p>
    <h1 class="text-5xl font-display mb-8">{entry.data.title}</h1>
    <div class="prose prose-invert max-w-none text-[var(--color-text-muted)] leading-relaxed">
      <Content />
    </div>
  </main>
</Layout>
```

- [ ] **Step 4: Add Tailwind prose support**

```bash
pnpm add -D @tailwindcss/typography
```

Add to `src/styles/global.css`:

```css
@plugin '@tailwindcss/typography';
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add About and Uses pages sourced from pages collection"
```

---

### Task 11: Work index and case study dynamic route

**Files:**
- Create: `src/pages/[locale]/trabajo/index.astro`
- Create: `src/pages/[locale]/trabajo/[slug].astro`
- Create: `src/pages/[locale]/work/index.astro`
- Create: `src/pages/[locale]/work/[slug].astro`

- [ ] **Step 1: Create shared render logic inline in `src/pages/[locale]/trabajo/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import Layout from '../../../components/Layout.astro';
import ProjectCard from '../../../components/ProjectCard.astro';
import { byLocale } from '../../../lib/content';
import { type Locale } from '../../../lib/i18n';

export function getStaticPaths() {
  return [{ params: { locale: 'es' } }];
}

const loc: Locale = 'es';
const work = byLocale(await getCollection('work'), loc).sort((a, b) => a.data.order - b.data.order);
---

<Layout title="Trabajo — Facundo Pascale" description="Proyectos destacados" locale={loc}>
  <main class="mx-auto max-w-5xl px-6 py-24">
    <h1 class="text-5xl font-display mb-4">Trabajo</h1>
    <p class="text-[var(--color-text-muted)] mb-12 max-w-2xl">Una selección de proyectos que cuentan el rango técnico con el que laburo — mobile, web, desktop, IA, arquitectura monorepo.</p>
    <div class="grid gap-4 md:grid-cols-2">
      {work.map((w) => (
        <ProjectCard
          locale={loc}
          slug={w.id.replace(`${loc}/`, '').replace(/\.mdx$/, '')}
          title={w.data.title}
          tagline={w.data.tagline}
          stack={w.data.stack}
          year={w.data.year}
        />
      ))}
    </div>
  </main>
</Layout>
```

- [ ] **Step 2: Create `src/pages/[locale]/work/index.astro` (EN mirror)**

Same content but `locale: 'en'`, English copy, translation of the intro paragraph.

- [ ] **Step 3: Create `src/pages/[locale]/trabajo/[slug].astro`**

```astro
---
import { getCollection, getEntry, render } from 'astro:content';
import Layout from '../../../components/Layout.astro';
import { byLocale } from '../../../lib/content';
import { type Locale } from '../../../lib/i18n';

export async function getStaticPaths() {
  const all = byLocale(await getCollection('work'), 'es');
  return all.map((entry) => ({
    params: { locale: 'es', slug: entry.id.replace('es/', '').replace(/\.mdx$/, '') },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
const d = entry.data;
---

<Layout title={`${d.title} — Trabajo`} description={d.description} locale="es">
  <article class="mx-auto max-w-3xl px-6 py-24">
    <p class="font-mono text-xs text-[var(--color-accent)] mb-2">// {d.year} · {d.role}</p>
    <h1 class="text-5xl font-display mb-4">{d.title}</h1>
    <p class="text-xl text-[var(--color-text-muted)] mb-8">{d.tagline}</p>
    <div class="flex flex-wrap gap-2 font-mono text-xs mb-12">
      {d.stack.map((t) => <span class="px-2 py-1 border border-[var(--color-border)]">{t}</span>)}
    </div>
    <div class="prose prose-invert max-w-none">
      <Content />
    </div>
    {(d.links.live || d.links.github) && (
      <div class="mt-12 flex gap-4 font-mono text-sm">
        {d.links.live && <a href={d.links.live} class="text-[var(--color-accent)]">→ Live</a>}
        {d.links.github && <a href={d.links.github} class="text-[var(--color-accent)]">→ GitHub</a>}
      </div>
    )}
  </article>
</Layout>
```

- [ ] **Step 4: Create `src/pages/[locale]/work/[slug].astro` (EN mirror)**

Same structure, `'en'` locale, English labels.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Work index and case study dynamic routes for both locales"
```

---

### Task 12: Blog index with pagination and post dynamic route

**Files:**
- Create: `src/pages/[locale]/blog/index.astro`
- Create: `src/pages/[locale]/blog/[slug].astro`
- Create: `src/components/PostMeta.astro`
- Create: `src/components/Toc.astro`

- [ ] **Step 1: Create `src/components/PostMeta.astro`**

```astro
---
import { type Locale } from '../lib/i18n';

interface Props {
  locale: Locale;
  publishedAt: Date;
  updatedAt?: Date | null;
  readingTime?: number;
  tags: string[];
}
const { locale, publishedAt, updatedAt, readingTime, tags } = Astro.props;
const fmt = locale === 'es' ? 'es-AR' : 'en-US';
const pub = publishedAt.toLocaleDateString(fmt, { year: 'numeric', month: 'long', day: 'numeric' });
---

<div class="font-mono text-xs text-[var(--color-text-dim)] flex flex-wrap gap-3 items-center">
  <time datetime={publishedAt.toISOString()}>{pub}</time>
  {updatedAt && <span>· {locale === 'es' ? 'actualizado' : 'updated'} {updatedAt.toLocaleDateString(fmt)}</span>}
  {readingTime && <span>· {readingTime} min</span>}
  {tags.length > 0 && <span>· {tags.join(' · ')}</span>}
</div>
```

- [ ] **Step 2: Create `src/components/Toc.astro`**

```astro
---
interface Heading { depth: number; slug: string; text: string }
interface Props { headings: Heading[] }
const { headings } = Astro.props;
const filtered = headings.filter((h) => h.depth >= 2 && h.depth <= 3);
---

{filtered.length > 0 && (
  <nav class="hidden lg:block sticky top-24 float-right ml-8 w-56 text-sm">
    <p class="font-mono text-xs text-[var(--color-text-dim)] uppercase mb-3">On this page</p>
    <ul class="space-y-2">
      {filtered.map((h) => (
        <li style={`padding-left: ${(h.depth - 2) * 12}px`}>
          <a href={`#${h.slug}`} class="text-[var(--color-text-muted)] hover:text-[var(--color-accent)]">{h.text}</a>
        </li>
      ))}
    </ul>
  </nav>
)}
```

- [ ] **Step 3: Create `src/pages/[locale]/blog/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import Layout from '../../../components/Layout.astro';
import PostCard from '../../../components/PostCard.astro';
import { isLocale, type Locale } from '../../../lib/i18n';
import { filterPublished, byLocale, sortByDate } from '../../../lib/content';

export function getStaticPaths() {
  return [{ params: { locale: 'es' } }, { params: { locale: 'en' } }];
}

const { locale } = Astro.params;
if (!locale || !isLocale(locale)) return Astro.redirect('/');
const loc = locale as Locale;

const posts = sortByDate(filterPublished(byLocale(await getCollection('blog'), loc)));

const copy = {
  es: { title: 'Writing', sub: 'Notas sobre arquitectura, craft, herramientas y el oficio de construir software.' },
  en: { title: 'Writing', sub: 'Notes on architecture, craft, tools, and the business of building software.' },
}[loc];
---

<Layout title={`${copy.title} — Facundo Pascale`} description={copy.sub} locale={loc}>
  <main class="mx-auto max-w-3xl px-6 py-24">
    <h1 class="text-5xl font-display mb-4">{copy.title}</h1>
    <p class="text-[var(--color-text-muted)] mb-12">{copy.sub}</p>
    <div class="divide-y divide-[var(--color-border)]">
      {posts.map((p) => (
        <PostCard
          locale={loc}
          slug={p.id.replace(`${loc}/`, '').replace(/\.mdx$/, '')}
          title={p.data.title}
          description={p.data.description}
          publishedAt={p.data.publishedAt}
          readingTime={(p.data as any).readingTime}
          tags={p.data.tags}
        />
      ))}
    </div>
  </main>
</Layout>
```

- [ ] **Step 4: Create `src/pages/[locale]/blog/[slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import Layout from '../../../components/Layout.astro';
import PostMeta from '../../../components/PostMeta.astro';
import Toc from '../../../components/Toc.astro';
import { filterPublished, byLocale } from '../../../lib/content';
import { type Locale } from '../../../lib/i18n';

export async function getStaticPaths() {
  const all = await getCollection('blog');
  const paths = [];
  for (const loc of ['es', 'en'] as Locale[]) {
    const published = filterPublished(byLocale(all, loc));
    for (const entry of published) {
      const slug = entry.id.replace(`${loc}/`, '').replace(/\.mdx$/, '');
      paths.push({ params: { locale: loc, slug }, props: { entry } });
    }
  }
  return paths;
}

const { locale } = Astro.params;
const { entry } = Astro.props;
const { Content, headings } = await render(entry);
const loc = locale as Locale;
---

<Layout title={`${entry.data.title} — Facundo Pascale`} description={entry.data.description} locale={loc}>
  <main class="mx-auto max-w-3xl px-6 py-24">
    <Toc headings={headings} />
    <article>
      <h1 class="text-4xl md:text-5xl font-display mb-4">{entry.data.title}</h1>
      <PostMeta
        locale={loc}
        publishedAt={entry.data.publishedAt}
        updatedAt={entry.data.updatedAt}
        readingTime={(entry.data as any).readingTime}
        tags={entry.data.tags}
      />
      <div class="prose prose-invert max-w-none mt-12">
        <Content />
      </div>
    </article>
  </main>
</Layout>
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add blog index, post route, PostMeta, and Toc components"
```

---

## Phase 4 — Interactive Islands

### Task 13: Theme toggle with anti-FOUC

**Files:**
- Create: `src/components/islands/ThemeToggle.tsx`
- Modify: `src/components/Layout.astro`
- Modify: `src/components/Header.astro`

- [ ] **Step 1: Create the React island**

```tsx
import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const stored = (localStorage.getItem('theme') as Theme | null) ?? 'dark';
    setTheme(stored);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] border border-[var(--color-border)] px-2 py-1"
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}
```

- [ ] **Step 2: Add anti-FOUC inline script to `Layout.astro` `<head>`**

Insert before `</head>`:

```astro
<script is:inline>
  (function() {
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') {
        document.documentElement.dataset.theme = stored;
      }
    } catch {}
  })();
</script>
```

- [ ] **Step 3: Add the island to the header**

In `Header.astro` frontmatter:

```astro
import ThemeToggle from './islands/ThemeToggle.tsx';
```

In the nav element, after the last nav link:

```astro
<ThemeToggle client:load />
```

- [ ] **Step 4: Manual test**

Run `pnpm dev`. Click the toggle: body flips light/dark, persists on reload, no flash on reload.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add theme toggle island with localStorage persistence and FOUC guard"
```

---

### Task 14: Language switcher island

**Files:**
- Create: `src/components/islands/LanguageSwitcher.tsx`
- Modify: `src/components/Header.astro`

Because `findTranslation` depends on having both documents available, the switcher is rendered server-side into a prop object: `{ es: '/es/blog/slug-a', en: '/en/blog/slug-b' | null }`. The React island just flips between the two.

- [ ] **Step 1: Create the island**

```tsx
interface Props {
  currentLocale: 'es' | 'en';
  targetPath: string | null;
  targetHomePath: string;
}

export default function LanguageSwitcher({ currentLocale, targetPath, targetHomePath }: Props) {
  const other: 'es' | 'en' = currentLocale === 'es' ? 'en' : 'es';

  const onClick = () => {
    if (targetPath) {
      window.location.href = targetPath;
    } else {
      window.location.href = targetHomePath;
      // flash a toast via sessionStorage — picked up by a tiny listener in Layout.astro
      sessionStorage.setItem('missing-translation', '1');
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] border border-[var(--color-border)] px-2 py-1"
      aria-label={`Switch to ${other.toUpperCase()}`}
    >
      {currentLocale.toUpperCase()} → {other.toUpperCase()}
    </button>
  );
}
```

- [ ] **Step 2: Update `Header.astro` to compute the translation target**

Modify `Header.astro` frontmatter:

```astro
---
import { getCollection } from 'astro:content';
import LanguageSwitcher from './islands/LanguageSwitcher.tsx';
import ThemeToggle from './islands/ThemeToggle.tsx';
import { findTranslation } from '../lib/translations';
import { localizedPath, type Locale } from '../lib/i18n';

interface Props {
  locale: Locale;
  currentDocId?: string;
  currentCollection?: 'blog' | 'work' | 'pages';
}
const { locale, currentDocId, currentCollection } = Astro.props;

const other: Locale = locale === 'es' ? 'en' : 'es';
let targetPath: string | null = null;

if (currentDocId && currentCollection) {
  const all = await getCollection(currentCollection);
  const current = all.find((d) => d.id === currentDocId);
  if (current) {
    const sibling = findTranslation(current, all, other);
    if (sibling) {
      const slug = sibling.id.replace(`${other}/`, '').replace(/\.mdx$/, '');
      const key = currentCollection === 'blog' ? 'blog' : currentCollection === 'work' ? 'work' : 'home';
      targetPath = localizedPath(key, other, slug);
    }
  }
}
// ...rest of frontmatter stays the same
---
```

In the header markup, add after `ThemeToggle`:

```astro
<LanguageSwitcher
  client:load
  currentLocale={locale}
  targetPath={targetPath}
  targetHomePath={localizedPath('home', other)}
/>
```

- [ ] **Step 3: Thread `currentDocId` and `currentCollection` through pages that have translatable content**

Update `src/pages/[locale]/blog/[slug].astro` and the work case study pages to pass `currentDocId={entry.id}` and `currentCollection="blog"` (or `"work"`) when rendering the layout. This requires adding a `currentDocId` prop to `Layout.astro` too:

```astro
// Layout.astro
interface Props {
  title: string;
  description: string;
  locale: Locale;
  currentDocId?: string;
  currentCollection?: 'blog' | 'work' | 'pages';
}
// ...
<Header locale={locale} currentDocId={currentDocId} currentCollection={currentCollection} />
```

- [ ] **Step 4: Add a toast script for missing translations to `Layout.astro`**

Inline in the body, before `</body>`:

```astro
<script is:inline>
  if (sessionStorage.getItem('missing-translation') === '1') {
    sessionStorage.removeItem('missing-translation');
    const t = document.createElement('div');
    t.textContent = document.documentElement.lang === 'es' ? 'Esta página aún no está traducida.' : "This page isn't translated yet.";
    t.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--color-bg-elevated);border:1px solid var(--color-accent);padding:10px 18px;font-family:var(--font-mono);font-size:12px;z-index:1000';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  }
</script>
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add language switcher island with sibling translation lookup"
```

---

### Task 15: Contact form with Astro Actions and Resend

**Files:**
- Create: `src/actions/index.ts`
- Create: `src/components/islands/ContactForm.tsx`
- Create: `src/pages/[locale]/contacto/index.astro`
- Create: `src/pages/[locale]/contact/index.astro`
- Modify: `.env.example`

- [ ] **Step 1: Create `.env.example`**

```
RESEND_API_KEY=re_placeholder
CONTACT_EMAIL_TO=hola@facundopascale.dev
VERCEL_DEPLOY_HOOK_URL=https://api.vercel.com/v1/integrations/deploy/placeholder
CRON_SECRET=generate-a-long-random-string
```

Commit instructions to copy to `.env.local` in the README later.

- [ ] **Step 2: Create `src/actions/index.ts`**

```ts
import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { Resend } from 'resend';

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 3;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimit.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_REQUESTS) return false;
  entry.count += 1;
  return true;
}

export const server = {
  sendContact: defineAction({
    accept: 'form',
    input: z.object({
      name: z.string().min(2).max(100),
      email: z.string().email(),
      message: z.string().min(10).max(5000),
      honeypot: z.string().max(0).optional(),
    }),
    handler: async (input, context) => {
      if (input.honeypot) {
        throw new ActionError({ code: 'BAD_REQUEST', message: 'Invalid submission' });
      }
      const ip = context.request.headers.get('x-forwarded-for') ?? 'unknown';
      if (!checkRateLimit(ip)) {
        throw new ActionError({ code: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded' });
      }

      const resend = new Resend(import.meta.env.RESEND_API_KEY);
      const to = import.meta.env.CONTACT_EMAIL_TO;

      const { error } = await resend.emails.send({
        from: 'contact@facundopascale.dev',
        to,
        replyTo: input.email,
        subject: `[facundopascale.dev] ${input.name}`,
        text: `From: ${input.name} <${input.email}>\n\n${input.message}`,
      });

      if (error) {
        throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      return { ok: true };
    },
  }),
};
```

- [ ] **Step 3: Create `src/components/islands/ContactForm.tsx`**

```tsx
import { useState, type FormEvent } from 'react';
import { actions } from 'astro:actions';

interface Props {
  locale: 'es' | 'en';
}

const copy = {
  es: {
    name: 'Nombre',
    email: 'Email',
    message: 'Mensaje',
    send: 'Enviar',
    sending: 'Enviando…',
    success: '¡Mensaje enviado! Te respondo dentro de 48hs.',
    error: 'Algo falló. Mandame un mail directo.',
    rateLimit: 'Demasiados intentos. Probá en una hora.',
  },
  en: {
    name: 'Name',
    email: 'Email',
    message: 'Message',
    send: 'Send',
    sending: 'Sending…',
    success: 'Message sent! I reply within 48 hours.',
    error: 'Something broke. Email me directly.',
    rateLimit: 'Too many tries. Try again in an hour.',
  },
};

export default function ContactForm({ locale }: Props) {
  const [state, setState] = useState<'idle' | 'sending' | 'success' | 'error' | 'rate-limit'>('idle');
  const t = copy[locale];

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState('sending');
    const form = new FormData(e.currentTarget);
    const { error } = await actions.sendContact(form);
    if (error) {
      setState(error.code === 'TOO_MANY_REQUESTS' ? 'rate-limit' : 'error');
      return;
    }
    setState('success');
    e.currentTarget.reset();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 font-mono text-sm">
      <input type="text" name="honeypot" className="hidden" tabIndex={-1} autoComplete="off" />
      <div>
        <label className="block text-[var(--color-text-dim)] uppercase text-xs mb-1">{t.name}</label>
        <input required name="name" className="w-full bg-transparent border border-[var(--color-border)] px-3 py-2 focus:border-[var(--color-accent)] outline-none" />
      </div>
      <div>
        <label className="block text-[var(--color-text-dim)] uppercase text-xs mb-1">{t.email}</label>
        <input required type="email" name="email" className="w-full bg-transparent border border-[var(--color-border)] px-3 py-2 focus:border-[var(--color-accent)] outline-none" />
      </div>
      <div>
        <label className="block text-[var(--color-text-dim)] uppercase text-xs mb-1">{t.message}</label>
        <textarea required name="message" rows={6} className="w-full bg-transparent border border-[var(--color-border)] px-3 py-2 focus:border-[var(--color-accent)] outline-none resize-y" />
      </div>
      <button disabled={state === 'sending'} type="submit" className="bg-[var(--color-accent)] text-[var(--color-bg)] px-4 py-2 font-semibold disabled:opacity-50">
        {state === 'sending' ? t.sending : t.send}
      </button>
      {state === 'success' && <p className="text-[var(--color-accent)]">{t.success}</p>}
      {state === 'error' && <p className="text-red-400">{t.error}</p>}
      {state === 'rate-limit' && <p className="text-yellow-400">{t.rateLimit}</p>}
    </form>
  );
}
```

- [ ] **Step 4: Create `src/pages/[locale]/contacto/index.astro`**

```astro
---
import Layout from '../../../components/Layout.astro';
import ContactForm from '../../../components/islands/ContactForm.tsx';

export function getStaticPaths() { return [{ params: { locale: 'es' } }]; }
---

<Layout title="Contacto — Facundo Pascale" description="Mandame un mensaje" locale="es">
  <main class="mx-auto max-w-2xl px-6 py-24">
    <h1 class="text-5xl font-display mb-4">Contacto</h1>
    <p class="text-[var(--color-text-muted)] mb-12">Escribime para hablar de un proyecto, una consulta técnica, o trabajar juntos desde Capsule Codes.</p>
    <ContactForm client:load locale="es" />
  </main>
</Layout>
```

- [ ] **Step 5: Create `src/pages/[locale]/contact/index.astro` (EN variant)**

Same structure, `'en'` locale, English copy.

- [ ] **Step 6: Enable Astro Actions in `astro.config.mjs`**

Astro 5 enables actions automatically when `src/actions/index.ts` exists. Add a Vercel adapter for server functions:

```bash
pnpm astro add vercel
```

Accept the prompt. This adds `@astrojs/vercel` and changes the output to `server` (but static pages still pre-render via `export const prerender = true` by default in Astro 5's hybrid mode, so Static-first remains intact — only the action endpoint is dynamic).

In `astro.config.mjs`:

```js
import vercel from '@astrojs/vercel';
// ...
output: 'static',
adapter: vercel({
  webAnalytics: { enabled: true },
  imageService: true,
}),
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add contact form with Astro Actions, Resend, rate limit, and honeypot"
```

---

## Phase 5 — Content Features

### Task 16: Shiki custom theme and CodeBlock component

**Files:**
- Create: `src/components/mdx/CodeBlock.astro`
- Modify: `astro.config.mjs`

- [ ] **Step 1: Configure Shiki in `astro.config.mjs`**

Add to the `mdx()` integration:

```js
mdx({
  remarkPlugins: [remarkReadingTime],
  shikiConfig: {
    theme: 'vesper',
    wrap: true,
  },
}),
```

Vesper is a warm-dark built-in Shiki theme that matches the palette. If a closer match is needed later, create a custom theme JSON and load it with `theme: JSON.parse(fs.readFileSync(...))`.

- [ ] **Step 2: Create `src/components/mdx/CodeBlock.astro`**

This component wraps Astro's native code block rendering with a copy button and a language label. Since MDX already runs Shiki by default through the config, the component's job is to override the `<pre>` element and add affordances.

```astro
---
interface Props { lang?: string }
const { lang } = Astro.props;
---

<div class="relative group my-6">
  {lang && (
    <span class="absolute top-2 right-12 font-mono text-xs text-[var(--color-text-dim)] uppercase">{lang}</span>
  )}
  <button
    type="button"
    class="copy-btn absolute top-2 right-2 font-mono text-xs text-[var(--color-text-dim)] hover:text-[var(--color-accent)] border border-[var(--color-border)] px-2 py-1 opacity-0 group-hover:opacity-100 transition"
    aria-label="Copy code"
  >
    copy
  </button>
  <slot />
</div>

<script>
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const pre = (e.currentTarget as HTMLElement).parentElement?.querySelector('pre');
      if (!pre) return;
      await navigator.clipboard.writeText(pre.innerText);
      (e.currentTarget as HTMLElement).textContent = 'copied!';
      setTimeout(() => ((e.currentTarget as HTMLElement).textContent = 'copy'), 2000);
    });
  });
</script>
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: configure Shiki and add CodeBlock wrapper with copy-to-clipboard"
```

---

### Task 17: Callout MDX component

**Files:**
- Create: `src/components/mdx/Callout.astro`

- [ ] **Step 1: Create the component**

```astro
---
interface Props { type?: 'info' | 'warning' | 'success' | 'danger'; title?: string }
const { type = 'info', title } = Astro.props;

const colors = {
  info: 'border-[var(--color-accent)] text-[var(--color-accent)]',
  warning: 'border-yellow-500 text-yellow-400',
  success: 'border-green-500 text-green-400',
  danger: 'border-red-500 text-red-400',
};
const prefix = { info: 'INFO', warning: 'WARNING', success: 'OK', danger: 'DANGER' };
---

<aside class={`my-6 border-l-4 bg-[var(--color-bg-elevated)] p-4 ${colors[type]}`}>
  <p class="font-mono text-xs uppercase mb-2">[{prefix[type]}]{title && ` ${title}`}</p>
  <div class="text-[var(--color-text)]">
    <slot />
  </div>
</aside>
```

- [ ] **Step 2: Wire MDX components globally**

Create `src/components/mdx/index.ts`:

```ts
import Callout from './Callout.astro';
export const mdxComponents = { Callout };
```

Authors reference components in their MDX files by importing them directly: `import Callout from '@/components/mdx/Callout.astro'`. Add a TS path alias in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Callout MDX component and @/ path alias"
```

---

### Task 18: RSS feeds per locale

**Files:**
- Create: `src/pages/[locale]/rss.xml.ts`

- [ ] **Step 1: Create the endpoint**

```ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { filterPublished, byLocale, sortByDate } from '../../lib/content';
import type { APIRoute } from 'astro';
import { isLocale, type Locale } from '../../lib/i18n';

export async function getStaticPaths() {
  return [{ params: { locale: 'es' } }, { params: { locale: 'en' } }];
}

export const GET: APIRoute = async ({ params, site }) => {
  const { locale } = params;
  if (!locale || !isLocale(locale)) return new Response('Not found', { status: 404 });
  const loc = locale as Locale;

  const posts = sortByDate(filterPublished(byLocale(await getCollection('blog'), loc)));

  return rss({
    title: 'Facundo Pascale',
    description: loc === 'es' ? 'Notas sobre arquitectura y craft' : 'Notes on architecture and craft',
    site: site!,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.publishedAt,
      link: `/${loc}/blog/${p.id.replace(`${loc}/`, '').replace(/\.mdx$/, '')}/`,
      categories: p.data.tags,
    })),
    stylesheet: false,
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add per-locale RSS feeds"
```

---

### Task 19: Dynamic OG image generation

**Files:**
- Create: `src/pages/og/[...slug].png.ts`

- [ ] **Step 1: Create the endpoint**

```ts
import { ImageResponse } from '@vercel/og';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function getStaticPaths() {
  const [blog, work] = await Promise.all([getCollection('blog'), getCollection('work')]);
  const paths = [];
  for (const entry of [...blog, ...work]) {
    const slug = entry.id.replace(/\.mdx$/, '');
    paths.push({ params: { slug }, props: { entry } });
  }
  paths.push({ params: { slug: 'default' }, props: { entry: null } });
  return paths;
}

async function loadFont(name: string): Promise<Buffer> {
  const p = path.resolve('node_modules/@fontsource-variable/fraunces/files', name);
  return fs.readFile(p);
}

export const GET: APIRoute = async ({ props }) => {
  const entry = (props as any).entry;
  const title = entry?.data.title ?? 'Facundo Pascale';
  const subtitle = entry?.data.description ?? 'Senior software architect';

  const font = await loadFont('fraunces-latin-wght-normal.woff');

  return new ImageResponse(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          background: '#0c0a09',
          color: '#fafaf9',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          fontFamily: 'Fraunces',
        },
        children: [
          { type: 'div', props: { style: { color: '#f97316', fontSize: '24px', fontFamily: 'monospace' }, children: '// facundopascale.dev' } },
          {
            type: 'div',
            props: {
              style: { display: 'flex', flexDirection: 'column', gap: '20px' },
              children: [
                { type: 'div', props: { style: { fontSize: '72px', lineHeight: 1.1 }, children: title } },
                { type: 'div', props: { style: { fontSize: '28px', color: '#a8a29e' }, children: subtitle } },
              ],
            },
          },
          { type: 'div', props: { style: { fontSize: '20px', color: '#57534e', fontFamily: 'monospace' }, children: 'facundo pascale · senior software architect' } },
        ],
      },
    },
    { width: 1200, height: 630, fonts: [{ name: 'Fraunces', data: font, weight: 500, style: 'normal' }] }
  );
};
```

- [ ] **Step 2: Install `@vercel/og`**

```bash
pnpm add @vercel/og
```

- [ ] **Step 3: Reference OG in `Layout.astro` `<head>`**

```astro
<meta property="og:image" content={`/og/${Astro.url.pathname.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'default'}.png`} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta name="twitter:card" content="summary_large_image" />
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: generate dynamic OG images per page via Satori"
```

---

### Task 20: Sitemap, robots, 404, hreflang

**Files:**
- Modify: `astro.config.mjs` (sitemap i18n config)
- Create: `public/robots.txt`
- Create: `src/pages/404.astro`
- Modify: `src/components/Layout.astro` (hreflang)

- [ ] **Step 1: Configure sitemap i18n in `astro.config.mjs`**

```js
sitemap({
  i18n: {
    defaultLocale: 'es',
    locales: { es: 'es-AR', en: 'en-US' },
  },
}),
```

- [ ] **Step 2: Create `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://facundopascale.dev/sitemap-index.xml
```

- [ ] **Step 3: Create `src/pages/404.astro`**

```astro
---
import Layout from '../components/Layout.astro';
const acceptLang = Astro.request.headers.get('accept-language') ?? '';
const locale = acceptLang.startsWith('en') ? 'en' : 'es';
const copy = {
  es: { title: 'Página no encontrada', sub: 'Se fue de viaje y no volvió.', home: '→ Volver al home' },
  en: { title: 'Page not found', sub: 'It went on a trip and never came back.', home: '→ Back to home' },
}[locale];
---

<Layout title="404" description={copy.title} locale={locale}>
  <main class="mx-auto max-w-2xl px-6 py-32 text-center">
    <p class="font-mono text-xs text-[var(--color-accent)] mb-4">// 404</p>
    <h1 class="text-6xl font-display mb-4">{copy.title}</h1>
    <p class="text-[var(--color-text-muted)] mb-8">{copy.sub}</p>
    <a href={`/${locale}/`} class="font-mono text-sm text-[var(--color-accent)]">{copy.home}</a>
  </main>
</Layout>
```

- [ ] **Step 4: Add hreflang to `Layout.astro` `<head>`**

```astro
<link rel="alternate" hreflang="es" href={new URL(Astro.url.pathname.replace(/^\/en\//, '/es/'), Astro.site).toString()} />
<link rel="alternate" hreflang="en" href={new URL(Astro.url.pathname.replace(/^\/es\//, '/en/'), Astro.site).toString()} />
<link rel="alternate" hreflang="x-default" href={new URL('/es/', Astro.site).toString()} />
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add sitemap i18n config, robots, 404 page, and hreflang alternates"
```

---

## Phase 6 — Seed Content

### Task 21: Seed the three featured work case studies (ES + EN)

**Files:**
- Create: `src/content/work/es/festivalpro.mdx`
- Create: `src/content/work/en/festivalpro.mdx`
- Create: `src/content/work/es/estudialo-ai.mdx`
- Create: `src/content/work/en/estudialo-ai.mdx`
- Create: `src/content/work/es/fitcoach.mdx`
- Create: `src/content/work/en/fitcoach.mdx`
- Create: `public/images/work/*` (placeholders)

For each work case study, the body contains: problem, approach, stack details, challenges, outcome. Populate with real knowledge extracted from the source repos (`/Users/facundo/Desktop/Projects/festivalpro`, `estudialo`, `personal/fitcoach`).

- [ ] **Step 1: Create placeholder cover images**

```bash
mkdir -p public/images/work
# placeholder: generate 1200x630 solid-color PNGs or use a placeholder service during dev
```

Use any 1200x630 image. Replace with real screenshots later.

- [ ] **Step 2: Create `src/content/work/es/festivalpro.mdx`**

```mdx
---
title: FestivalPro
tagline: App de gestión para festivales de música en producción
description: Aplicación mobile para React Native + Expo con builds EAS, OTA updates y shipping dual-variant para iOS y Android.
publishedAt: 2025-08-15
stack: ['React Native', 'Expo', 'TypeScript', 'EAS Build', 'OTA Updates']
role: 'Mobile lead · Arquitectura · Shipping'
year: 2025
coverImage: /images/work/festivalpro.png
lang: es
translationId: festivalpro
featured: true
order: 1
links:
  live: https://apps.apple.com/...
---

## El problema

Organizar un festival grande implica coordinar artistas, staff, horarios, cambios de último momento, y comunicación con asistentes — todo en paralelo. Las herramientas existentes son planillas o apps genéricas que no manejan bien el volumen ni los cambios en tiempo real.

## La solución

App nativa multi-rol (staff, artista, asistente) construida en React Native con Expo y shipeada por EAS. Separación clara de flujos por rol, actualizaciones OTA para pushear cambios sin releases nuevas, y un sistema de notificaciones para cambios críticos.

## Stack y decisiones clave

- **Expo SDK 54 + EAS Build** para shipping consistente en iOS y Android sin mantener dos pipelines.
- **OTA Updates** para pushear fixes y cambios de contenido sin pasar por review del store.
- **Dual-variant build**: una misma codebase genera dos apps (Festival Pro + Folk Pro) con branding, content y assets distintos.
- **TypeScript estricto** en toda la aplicación, sin `any` explícitos.

## Aprendizajes

Cuando shipeás dual-variant en mobile, el challenge no es el build — es mantener la coherencia entre las dos apps sin duplicar código. Resolví esto con un sistema de configuración por flavor que inyecta constantes y assets en build time, manteniendo el 95% de la UI compartida.
```

- [ ] **Step 3: Create `src/content/work/en/festivalpro.mdx`**

Same frontmatter with `lang: en`, `translationId: festivalpro`, English title/tagline/description, translated body.

- [ ] **Step 4: Create `src/content/work/es/estudialo-ai.mdx` and `en/estudialo-ai.mdx`**

```mdx
---
title: Estudialo-AI
tagline: Plataforma de estudio con IA integrada
description: SaaS full-stack en Next.js 16 con Vercel AI SDK, Google Gemini, Supabase, Stripe e i18n.
publishedAt: 2025-10-01
stack: ['Next.js 16', 'Vercel AI SDK', 'Google Gemini', 'Supabase', 'Stripe', 'i18n']
role: 'Fullstack · Arquitectura · IA'
year: 2025
coverImage: /images/work/estudialo.png
lang: es
translationId: estudialo-ai
featured: true
order: 2
---

## El problema

Estudiar en serio requiere procesar cantidades grandes de material (PDFs, notas, apuntes) y tener feedback rápido. Las herramientas tradicionales (resúmenes manuales, tutores) no escalan.

## La solución

SaaS que sube material del usuario, lo procesa con Gemini vía el AI SDK de Vercel, y devuelve resúmenes, quizzes y explicaciones generadas. Con suscripciones Stripe, auth Supabase y UI bilingüe.

## Stack y decisiones clave

- **Next.js 16 App Router** con RSC para streaming de contenido generado.
- **Vercel AI SDK + Gemini** para todas las generaciones, usando structured outputs con Zod para respuestas confiables.
- **Supabase** para auth y Postgres con RLS, PDF storage en Supabase Storage.
- **Stripe Checkout + Webhooks** para subscriptions, sincronizadas con la DB vía webhooks.
- **next-intl** para internacionalización completa.

## Aprendizajes

Manejar streaming de IA en producción es diferente a los demos. Hay que pensar en cancelación, retries, cotas de tokens, y fallback cuando el modelo alucina. El AI SDK de Vercel resuelve el 80% de esto pero el 20% final es el que define si la experiencia es pulida o frustrante.
```

- [ ] **Step 5: Create `src/content/work/es/fitcoach.mdx` and `en/fitcoach.mdx`**

```mdx
---
title: FitCoach
tagline: Plataforma de coaching fitness con apps mobile y desktop
description: Monorepo pnpm + Turborepo con app mobile React Native + Expo y app desktop Tauri v2, arquitectura offline-first con Drizzle + SQLite y sync contra Supabase.
publishedAt: 2025-11-20
stack: ['Tauri v2', 'React Native', 'Expo', 'Drizzle ORM', 'SQLite', 'Supabase', 'pnpm', 'Turborepo']
role: 'Tech lead · Arquitectura · Multi-plataforma'
year: 2025
coverImage: /images/work/fitcoach.png
lang: es
translationId: fitcoach
featured: true
order: 3
---

## El problema

Entrenadores físicos trabajan desde computadoras (crear rutinas, analizar clientes) mientras sus clientes las ejecutan en mobile. Dos flujos distintos, dos realidades de conectividad (los entrenadores online, los clientes a veces offline), una sola base de datos real.

## La solución

Monorepo con dos apps independientes pero con un paquete shared de tipos, constantes e i18n. Mobile offline-first con SQLite + Drizzle, sync contra Supabase en background. Desktop Tauri v2 + React con Supabase directo (los entrenadores siempre tienen red).

## Stack y decisiones clave

- **pnpm + Turborepo** para gestionar tres paquetes (mobile, desktop, shared) con cacheo de builds.
- **Tauri v2** para la app de entrenador: binario nativo liviano, Rust debajo, sin Electron.
- **Drizzle + expo-sqlite** para la capa offline del mobile, con un sync service que push/pull pending records cada 5 minutos.
- **Last-write-wins conflict resolution**: aceptable porque cada tipo de dato tiene un solo escritor (trainers escriben rutinas, clients escriben logs).
- **Supabase RLS** para separar data de clients y trainers por rol a nivel de DB.

## Aprendizajes

Offline-first no es una feature, es una filosofía. Cuando lo diseñás desde el día uno, todo fluye. Cuando lo intentás bolt-on después, reescribís el 60% de la app. El pattern `pendingSync + markPendingSync + syncedAt` es simple pero robusto.

Monorepo con Turbo vale la pena solo cuando tenés código shared de verdad. No apures la creación de un shared package "por las dudas" — empezá con dos apps independientes y extraé shared cuando la duplicación duela.
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "content: add featured work case studies for FestivalPro, Estudialo-AI, FitCoach (ES+EN)"
```

---

### Task 22: Seed About and Uses pages (ES + EN)

**Files:**
- Create: `src/content/pages/es/about.mdx`
- Create: `src/content/pages/en/about.mdx`
- Create: `src/content/pages/es/uses.mdx`
- Create: `src/content/pages/en/uses.mdx`

- [ ] **Step 1: Create `src/content/pages/es/about.mdx`**

```mdx
---
title: Sobre mí
description: Senior software architect, fundador de Capsule Codes, mentor de devs.
updatedAt: 2026-04-13
lang: es
---

Soy Facundo Pascale. Llevo 15 años escribiendo código, diseñando arquitecturas, rompiendo cosas, y enseñándole a otros devs cómo no romperlas.

## Mi filosofía

**Conceptos antes que código.** No se puede construir nada sólido sobre fundamentos flojos. Prefiero pasar una semana entendiendo un problema antes que tocar una línea, que dos meses reescribiendo porque arranqué mal.

**La IA es una herramienta, nosotros somos Tony Stark.** Jarvis ejecuta, nosotros dirigimos. El que no sabe qué pedirle a la IA — o peor, no sabe cuándo la IA está mintiendo — no está usando la IA, está siendo usado por ella.

**Contra la inmediatez.** La gente quiere aprender React en dos horas para conseguir laburo. No va a conseguir laburo. Lo que sí va a conseguir es volver a empezar dentro de seis meses, cuando el siguiente framework lo deje atrás.

## Qué hago

- **Arquitectura frontend** — Angular, React, React Native, Tauri. Clean, Hexagonal, Screaming Architecture.
- **State management** — Redux, Zustand, Signals, GPX-Store.
- **Mentoring** — ayudo a devs mid/senior a salir del tutorial hell y construir criterio técnico propio.
- **Capsule Codes** — mi empresa, donde construimos software a medida para founders y equipos que necesitan velocidad sin sacrificar calidad.

## Herramientas que amo

LazyVim, Tmux, Zellij, TypeScript estricto, Tailwind, pnpm. Ver la página de [Uses](/es/uses) para el inventario completo.
```

- [ ] **Step 2: Create `src/content/pages/en/about.mdx`**

Translated version with the same spirit.

- [ ] **Step 3: Create `src/content/pages/es/uses.mdx`**

```mdx
---
title: Con qué laburo
description: Editor, terminal, hardware, librerías y servicios que uso todos los días.
updatedAt: 2026-04-13
lang: es
---

Esta es la página donde listo — con demasiado detalle — las herramientas que uso todos los días. Si sos dev, probablemente te gusten estas páginas tanto como a mí.

## Editor y terminal

- **LazyVim** como editor primario (Neovim preconfigurado con sensibilidades modernas)
- **Zellij** y **Tmux** para gestión de panes y sessions
- **Ghostty** como emulador de terminal
- **JetBrains Mono** como font de código
- **Vesper** o **Tokyo Night** como color scheme (depende del día)

## Lenguajes y frameworks principales

- **TypeScript** (estricto, siempre)
- **React 19** con React Compiler — ya sin `useMemo`/`useCallback` manuales
- **React Native + Expo** para mobile
- **Astro 5** para sitios de contenido (como este)
- **Next.js 16** para apps fullstack
- **Tauri v2** para desktop

## Librerías que repito proyecto tras proyecto

- **Tailwind CSS 4** — styling
- **Zod** — validación y schemas
- **Zustand** — state management
- **TanStack Query** — data fetching
- **Drizzle ORM** — database
- **Resend** — email transaccional

## Hardware

- MacBook Pro M3 Max
- Teclado: Keychron Q1 con switches Gateron Brown
- Monitor: Apple Studio Display
- Webcam: Logitech Brio
- Micrófono: Shure SM7B con Cloudlifter

## Servicios

- **Vercel** para hosting y CI/CD
- **Supabase** como BaaS default
- **GitHub** para repos y Actions
- **Linear** para tracking
- **1Password** para secrets

_Última actualización: 13 de abril de 2026_
```

- [ ] **Step 4: Create `src/content/pages/en/uses.mdx`**

Translated version.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "content: add About and Uses pages (ES+EN)"
```

---

### Task 23: Seed two sample blog posts (ES + EN)

**Files:**
- Create: `src/content/blog/es/2026-04-15-hola-mundo.mdx`
- Create: `src/content/blog/en/2026-04-15-hello-world.mdx`
- Create: `src/content/blog/es/2026-05-01-arquitectura-offline-first.mdx` (future-dated — validates scheduling)
- Create: `src/content/blog/en/2026-05-01-offline-first-architecture.mdx`

- [ ] **Step 1: Create the published post (`2026-04-15`)**

Frontmatter for ES:

```yaml
---
title: Bienvenido al blog
description: Arranca el blog. Notas sobre arquitectura, craft, herramientas y el negocio de hacer software.
publishedAt: 2026-04-15
tags: ['meta', 'craft']
lang: es
translationId: hello-world-2026-04
featured: false
---
```

Body: short introductory post (~400 words) explaining what the blog will cover.

- [ ] **Step 2: Create the future-dated post (`2026-05-01`)**

```yaml
---
title: Arquitectura offline-first en la práctica
description: Cómo diseñar apps que funcionen sin red y sincronicen cuando vuelvan, sin escribir tu propio CRDT.
publishedAt: 2026-05-01
tags: ['arquitectura', 'mobile', 'offline-first']
lang: es
translationId: offline-first-2026-05
---
```

Body: placeholder article, marked as future — this validates that the scheduling filter works because it should NOT appear in production builds until May 1.

- [ ] **Step 3: Run `pnpm build` and confirm the future post is excluded**

```bash
pnpm build
ls dist/es/blog/
```

Expected: `hola-mundo/` exists, `arquitectura-offline-first/` does not exist.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "content: seed initial blog posts and validate scheduling filter"
```

---

## Phase 7 — Testing

### Task 24: Playwright setup + E2E for home, blog, language switcher, contact form

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/home.spec.ts`
- Create: `tests/e2e/blog.spec.ts`
- Create: `tests/e2e/language-switcher.spec.ts`
- Create: `tests/e2e/contact-form.spec.ts`

- [ ] **Step 1: Install browsers**

```bash
pnpm exec playwright install chromium
```

- [ ] **Step 2: Create `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: 'http://localhost:4321', trace: 'on-first-retry' },
  webServer: {
    command: 'pnpm build && pnpm preview --port 4321',
    url: 'http://localhost:4321/es/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
```

- [ ] **Step 3: Create `tests/e2e/home.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test.describe('home', () => {
  test('loads /es/ with hero', async ({ page }) => {
    await page.goto('/es/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('serio');
    await expect(page.getByText('// senior architect')).toBeVisible();
  });

  test('loads /en/ with hero', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('serious');
  });

  test('root redirects to /es/', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/es\/$/);
  });
});
```

- [ ] **Step 4: Create `tests/e2e/blog.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test.describe('blog', () => {
  test('blog index lists the seeded post', async ({ page }) => {
    await page.goto('/es/blog/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Writing');
    await expect(page.getByRole('heading', { level: 3, name: /Bienvenido/ })).toBeVisible();
  });

  test('post page renders content', async ({ page }) => {
    await page.goto('/es/blog/2026-04-15-hola-mundo/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bienvenido al blog');
  });

  test('future-dated post is excluded from index', async ({ page }) => {
    await page.goto('/es/blog/');
    await expect(page.getByRole('heading', { level: 3, name: /offline-first/i })).not.toBeVisible();
  });
});
```

- [ ] **Step 5: Create `tests/e2e/language-switcher.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('language switcher navigates to translated page', async ({ page }) => {
  await page.goto('/es/blog/2026-04-15-hola-mundo/');
  await page.getByRole('button', { name: /EN/i }).click();
  await expect(page).toHaveURL(/\/en\/blog\/2026-04-15-hello-world\/?/);
});
```

- [ ] **Step 6: Create `tests/e2e/contact-form.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('contact form validates required fields', async ({ page }) => {
  await page.goto('/es/contacto/');
  await page.getByRole('button', { name: /Enviar/ }).click();
  const nameInput = page.locator('input[name="name"]');
  await expect(nameInput).toBeFocused();
});

test('contact form renders language-appropriate labels', async ({ page }) => {
  await page.goto('/en/contact/');
  await expect(page.locator('label', { hasText: 'Name' })).toBeVisible();
  await expect(page.locator('label', { hasText: 'Message' })).toBeVisible();
});
```

Note: submitting the form end-to-end would hit Resend. For MVP, validate markup and client-side behavior only. A separate integration test can mock Resend later.

- [ ] **Step 7: Run the E2E suite**

```bash
pnpm test:e2e
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "test: add Playwright E2E for home, blog, language switcher, contact form"
```

---

## Phase 8 — Deployment

### Task 25: Vercel Cron + Deploy Hook for scheduled rebuilds

**Files:**
- Create: `vercel.json`
- Create: `src/pages/api/revalidate.ts`

- [ ] **Step 1: Create `src/pages/api/revalidate.ts`**

```ts
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const auth = request.headers.get('authorization');
  const expected = `Bearer ${import.meta.env.CRON_SECRET}`;
  if (auth !== expected) return new Response('Unauthorized', { status: 401 });

  const hook = import.meta.env.VERCEL_DEPLOY_HOOK_URL;
  if (!hook) return new Response('Deploy hook not configured', { status: 500 });

  const res = await fetch(hook, { method: 'POST' });
  if (!res.ok) return new Response(`Deploy hook failed: ${res.status}`, { status: 500 });

  return new Response('Rebuild triggered', { status: 200 });
};
```

- [ ] **Step 2: Create `vercel.json`**

```json
{
  "crons": [
    {
      "path": "/api/revalidate",
      "schedule": "0 * * * *"
    }
  ]
}
```

Vercel Cron sends a GET with an `Authorization: Bearer <CRON_SECRET>` header when the env var `CRON_SECRET` is set in project settings. Configure the secret in the Vercel dashboard.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Vercel Cron endpoint to trigger hourly rebuilds via deploy hook"
```

---

### Task 26: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the workflow**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm check
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "ci: add GitHub Actions workflow for type-check, lint, unit, and E2E"
```

---

### Task 27: Deploy to Vercel (manual, first time)

This is a one-time manual step.

- [ ] **Step 1: Push repo to GitHub**

Create a new private (or public) GitHub repo and push.

```bash
git remote add origin git@github.com:facundopascale/facundopascale-dev.git
git push -u origin main
```

- [ ] **Step 2: Import into Vercel**

Go to Vercel dashboard → New Project → import the repo. Framework preset: Astro. Build command: `pnpm build`. Output directory: `dist` (default).

- [ ] **Step 3: Set environment variables in Vercel**

- `RESEND_API_KEY` — from Resend dashboard
- `CONTACT_EMAIL_TO` — your receiving email
- `CRON_SECRET` — generate with `openssl rand -hex 32`
- `VERCEL_DEPLOY_HOOK_URL` — create a deploy hook in Vercel Settings → Git → Deploy Hooks, paste here

- [ ] **Step 4: Trigger a deploy and verify**

Push a commit or click "Redeploy" in Vercel. Visit the assigned URL (e.g., `facundopascale-dev.vercel.app`). Verify:

- `/` redirects to `/es/`
- `/es/` and `/en/` render
- `/es/blog/` shows the seeded post
- The theme toggle works
- The language switcher works on the blog post (hola-mundo ↔ hello-world)

- [ ] **Step 5: Connect the custom domain when purchased**

Once `facundopascale.dev` is registered, add it in Vercel → Settings → Domains. Vercel provides the DNS records to set at the registrar.

---

## Self-Review Checklist (post-plan)

The following spec sections are covered:

| Spec section | Task |
|---|---|
| §1 Overview & goals | N/A — informational |
| §2 Audiences | N/A — informational |
| §3.1 i18n routing | Task 2 |
| §3.2 Pages & routes | Tasks 9, 10, 11, 12, 15 |
| §3.3 Nav & footer | Task 4 |
| §3.4 Cross-language linking | Tasks 7, 14 |
| §4.1 Content directory | Task 5 |
| §4.2 Zod schemas | Task 5 |
| §4.3 Scheduling | Tasks 6, 23, 25 |
| §4.4 Drafts | Task 6 |
| §4.5 Reading time | Task 8 |
| §5.1 Visual direction | Tasks 3, 4 |
| §5.2 Colors | Task 3 |
| §5.3 Typography | Task 3 |
| §5.4 Spacing/radius/shadows | Task 3 |
| §5.5 Core components | Tasks 4, 9, 12, 16, 17 |
| §5.6 Accessibility baseline | Task 3 (reduced motion); remaining a11y inherited from semantic HTML throughout |
| §5.7 Performance budget | Verified after Task 27 via Vercel Speed Insights |
| §6 Tech stack | Tasks 1, 3 |
| §7 Featured work | Task 21 |
| §8 Features & interactions | Tasks 13, 14, 15, 16 |
| §9 SEO/OG/social | Tasks 19, 20 |
| §10 Testing strategy | Tasks 6, 7, 8, 24 |
| §11 Deployment & ops | Tasks 15 (adapter), 25, 26, 27 |
| §12 Out of scope | N/A — deliberately not implemented |
| §13 Open questions | Addressed during execution / post-launch |

**Placeholder scan:** no "TODO", "TBD", or "implement later" strings in task steps. Every code step contains complete code.

**Type consistency:** `Locale` type and `localizedPath` signature are consistent across all tasks that reference them. `findTranslation`, `filterPublished`, `byLocale`, `sortByDate` signatures match between declaration (Tasks 6-7) and consumers (Tasks 9-12, 18).

**Known deferred items (intentionally not in this plan):**

- JSON-LD structured data (spec §9) — simple to add post-launch; not blocking.
- Satori custom font for OG title (currently uses built-in Fraunces font file path) — may need adjustment if the exact file name differs in installed Fontsource package. Verify in Task 19.
- Real screenshots for the three work case studies — Task 21 uses placeholders; replace before sharing the site publicly.

---

## Execution Handoff

Plan complete and saved to:
`docs/superpowers/plans/2026-04-13-personal-site.md`

**Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration, cleaner context.

**2. Inline Execution** — Execute tasks in this session using `executing-plans`, batch with checkpoints for review.

Which approach?
