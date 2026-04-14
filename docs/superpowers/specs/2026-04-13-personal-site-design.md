# Facundo Pascale · Personal Site — Design Spec

**Status:** Draft for review
**Date:** 2026-04-13
**Owner:** Facundo Pascale
**Target domain:** `facundopascale.dev` (not yet purchased)
**Repo location:** `/Users/facundo/Desktop/Projects/personal/facundopascale-dev`

---

## 1. Overview

A bilingual (ES/EN) personal website for Facundo Pascale, positioned as a senior software architect with 15+ years of experience. The site is the digital home for his personal brand, with Capsule Codes (his business) and his featured apps acting as proof of work, and a hybrid blog supporting AI-written, batch-scheduled content.

The site replaces the legacy `porfolio` (Astro, 2025) and coexists with the separate `capsule-codes-website` — it does **not** absorb or duplicate Capsule Codes content, only links to it.

### 1.1 Goals (priority order)

1. **Personal brand (primary).** When anyone searches for Facundo Pascale or lands from social, they find a solid, professional, opinionated image — not a generic portfolio.
2. **Leads for Capsule Codes (secondary).** Strategic mentions and a clear link to CC. The site is not a CC sales page.
3. **Audience for content (tertiary, grows over time).** The blog and video/social links create infrastructure to convert visitors into followers as Facundo starts publishing content.

### 1.2 Non-goals

- Comments system on the blog.
- Paid courses, gated premium content, or any authenticated area.
- Real-time AI translation of posts.
- Admin dashboards or CMS-based editing.
- A sales page for Capsule Codes (that lives on the CC site).

### 1.3 Success criteria (6–12 months)

- Ranks organically for "Facundo Pascale" plus a handful of technical keywords tied to published content.
- Trackable source of leads for Capsule Codes (UTMs or direct attribution).
- At least one bilingual post published per week, sourced from the scheduled backlog.
- Measurable referral traffic from YouTube/Twitter/LinkedIn/X into the site.

---

## 2. Audiences

**Primary:** mid/senior developers who want to learn from Facundo, tech leads evaluating him for consulting, founders looking for a team to build a product.

**Secondary:** recruiters and headhunters, advanced students, fellow creators.

---

## 3. Architecture & Site Map

### 3.1 Internationalization

Path-based i18n with Spanish as the default and English as the secondary locale. Every content page exists in both locales.

```
facundopascale.dev/           → 302 to /es/
facundopascale.dev/es/        → Spanish root
facundopascale.dev/en/        → English root
```

`hreflang` tags on every page indicate the equivalent translation. `sitemap.xml` includes both locales.

### 3.2 Pages

| Route (ES) | Route (EN) | Description | Rendering |
|---|---|---|---|
| `/es/` | `/en/` | Home — hero + featured work + latest posts + contact CTA | Static |
| `/es/sobre-mi/` | `/en/about/` | Long-form about: background, philosophy, approach | Static |
| `/es/trabajo/` | `/en/work/` | Featured work index (FestivalPro, Estudialo-AI, FitCoach) | Static |
| `/es/trabajo/[slug]/` | `/en/work/[slug]/` | Individual case study | Static, generated from `work` collection |
| `/es/blog/` | `/en/blog/` | Paginated blog index, filterable by tag | Static |
| `/es/blog/[slug]/` | `/en/blog/[slug]/` | Individual post with TOC, tags, reading time | Static, generated from `blog` collection |
| `/es/uses/` | `/en/uses/` | Tooling & setup page (editor, terminal, hardware, libraries, services) | Static, one MDX per locale |
| `/es/contacto/` | `/en/contact/` | Contact form + social links + Capsule Codes link | Static + Astro Action endpoint |

**Auto-generated:**

- `/es/rss.xml`, `/en/rss.xml`
- `/sitemap-index.xml`, `/sitemap-0.xml` (via `@astrojs/sitemap`)
- `/robots.txt`
- Custom `404.astro` rendered per locale.

### 3.3 Primary navigation

**Header:** `Work · Writing · Uses · About · Contact · [ES/EN toggle] · [theme toggle]`

**Footer:** same links + GitHub · LinkedIn · Twitter/X · YouTube · email · explicit "Capsule Codes" button · built-with credit · year.

### 3.4 Cross-language linking

Each translated document carries a `translationId` field. The language switcher reads the current document's `translationId`, finds the sibling in the target locale, and navigates there. If no sibling exists, it falls back to the target locale's home with a toast: "This page isn't translated yet."

---

## 4. Content Model

### 4.1 Directory layout

```
src/content/
├── blog/
│   ├── es/
│   │   └── YYYY-MM-DD-slug.mdx
│   └── en/
│       └── YYYY-MM-DD-slug.mdx
├── work/
│   ├── es/
│   │   ├── festivalpro.mdx
│   │   ├── estudialo-ai.mdx
│   │   └── fitcoach.mdx
│   └── en/
│       └── (mirrored)
└── pages/
    ├── es/{about,uses}.mdx
    └── en/{about,uses}.mdx
```

### 4.2 Schemas (Zod, inside `src/content/config.ts`)

**`blog`** collection:

```ts
{
  title: z.string(),
  description: z.string().min(120).max(160),   // SEO meta description
  publishedAt: z.date(),                        // drives scheduling
  updatedAt: z.date().nullable().default(null),
  tags: z.array(z.string()).default([]),
  lang: z.enum(['es', 'en']),
  translationId: z.string(),                    // links ES/EN siblings
  draft: z.boolean().default(false),
  featured: z.boolean().default(false),
  coverImage: z.string().optional(),
  readingTime: z.number().optional(),           // populated at build
  author: z.literal('facundo').default('facundo')
}
```

**`work`** collection:

```ts
{
  title: z.string(),
  tagline: z.string(),
  description: z.string(),
  publishedAt: z.date(),
  stack: z.array(z.string()),                   // e.g. ["Next.js 16", "Supabase", "Gemini"]
  role: z.string(),                              // e.g. "Fullstack · Architecture · Mobile lead"
  year: z.number(),
  links: z.object({
    live: z.string().url().optional(),
    github: z.string().url().optional(),
    caseStudy: z.string().url().optional()
  }).default({}),
  coverImage: z.string(),
  gallery: z.array(z.string()).default([]),
  lang: z.enum(['es', 'en']),
  translationId: z.string(),
  featured: z.boolean().default(false),
  order: z.number().default(0)                   // manual ordering of featured
}
```

**`pages`** collection (about, uses):

```ts
{
  title: z.string(),
  description: z.string(),
  updatedAt: z.date(),
  lang: z.enum(['es', 'en'])
}
```

### 4.3 Scheduling (future-dated posts)

Posts with `publishedAt` **in the future** are filtered at the collection loader level, so they produce no routes, no listings, and no sitemap entries.

A **Vercel Cron** hits a Deploy Hook every hour (`0 * * * *`), which triggers a production rebuild. When a post's `publishedAt` crosses the current time, the next scheduled rebuild publishes it automatically.

This mechanism applies identically to the `work` collection, so case studies can also be queued for a launch date.

### 4.4 Drafts

Posts with `draft: true` are included only in `astro dev`, never in production builds.

### 4.5 Reading time

Computed at build time via a custom remark plugin, averaging 200 words/minute, written into the frontmatter's `readingTime` field before render.

---

## 5. Design System

### 5.1 Visual direction

Hybrid **Dev-Editorial**: editorial typography (large serif for display, sans for body) with monospace accents for labels, metadata, and code. Dark by default with a warm, slightly brown-tinted background; light mode available via toggle.

### 5.2 Color tokens (Tailwind CSS 4, `@theme` directive)

**Dark mode (default):**

```css
--color-bg:           #0c0a09;   /* stone-950 */
--color-bg-elevated:  #1c1917;   /* stone-900 */
--color-border:       #292524;   /* stone-800 */
--color-text:         #fafaf9;   /* stone-50 */
--color-text-muted:   #a8a29e;   /* stone-400 */
--color-text-dim:     #57534e;   /* stone-600 */
--color-accent:       #f97316;   /* orange-500 */
--color-accent-hover: #fb923c;   /* orange-400 */
```

**Light mode:** mirrored palette (stone-50 background, stone-950 text, same orange accent).

### 5.3 Typography

- **Display (H1, H2, hero):** Fraunces — editorial, warm serif, variable font.
- **Body (paragraphs, UI):** Inter — neutral, highly legible, variable font.
- **Mono (labels, code, tags, metadata):** JetBrains Mono — matches the dev-editorial language.

All three fonts are self-hosted via Fontsource (better performance than Google Fonts CDN, no external network dependency).

**Scale:** modular 1.25 — `0.75, 0.875, 1, 1.125, 1.25, 1.5, 2, 3, 4.5, 6rem`.

### 5.4 Spacing, radius, shadows

- Spacing: default Tailwind 4px scale.
- Radius: zero by default. Minimal `rounded-sm` on primary buttons only.
- Shadows: none by default. Depth comes from contrasting elevated surfaces + subtle borders.

### 5.5 Core components

Custom components, copy-paste style (no shadcn/ui, no MUI). Radix primitives allowed for a11y-sensitive primitives (Dialog, Tabs, Tooltip), styled manually.

- `Button`, `Link` (animated underline), `Card`, `Badge` (tags), `CodeBlock` (Shiki with warm-dark custom theme), `Callout` (info/warning/success — terminal style), `ThemeToggle`, `LanguageSwitcher`, `Toc`, `PostCard`, `ProjectCard`, `PostMeta`, `ContactForm`.

### 5.6 Accessibility baseline

- WCAG AA contrast ratios in both themes.
- Keyboard navigation on all interactive elements.
- Skip-to-content link.
- `prefers-reduced-motion` respected for the underline animations and theme transition.
- Alt text required on all images in content schemas (validated at build).

### 5.7 Performance budget

- Lighthouse 95+ on all four categories in production.
- LCP < 1.5s on 4G throttled.
- Total JS on home < 20 KB.
- Total CSS on home < 15 KB (Tailwind purged).
- First load HTML < 40 KB gzipped.

---

## 6. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Astro 5 |
| UI islands | React 19 (theme toggle, contact form, language switcher only) |
| Styles | Tailwind CSS 4 (`@theme` directive) |
| Content | MDX via `@astrojs/mdx` |
| Schema validation | Zod (content collections) |
| Syntax highlighting | Shiki with custom warm-dark theme |
| Icons | Lucide via `astro-icon` |
| Forms | Astro Actions (Astro 5 feature) |
| Transactional email | Resend |
| Fonts | Fontsource (self-hosted) |
| Analytics | Vercel Analytics + Vercel Speed Insights |
| SEO | `@astrojs/sitemap`, dynamic OG images via `@vercel/og` or Satori |
| RSS | `@astrojs/rss` |
| Unit tests | Vitest |
| E2E tests | Playwright (home, blog post, contact form) |
| Lint/format | ESLint + Prettier + Husky pre-commit |
| Deploy | Vercel with preview deploys per branch |
| CI | GitHub Actions (type-check, lint, tests) |
| Scheduler | Vercel Cron → Deploy Hook (hourly) |

### 6.1 Explicitly not included

- **No Supabase, no database, no backend.** The site is fully static. If a future feature demands state (gated content, comments, newsletter with subscriber list), Supabase is the planned choice but is out of scope for the MVP.
- **No CMS.** Content lives in the git repo as MDX.
- **No authentication.** No private area.
- **No component library (shadcn/ui, MUI, etc.).** Custom components only.
- **No animation library (Framer Motion).** CSS transitions and View Transitions API only.

---

## 7. Featured Work (MVP)

The `work` collection ships with three case studies, each covering a distinct technological surface to demonstrate range:

1. **FestivalPro** — React Native + Expo production app with EAS builds, OTA updates, and dual-variant shipping. Narrative: "I ship mobile at scale."
2. **Estudialo-AI** — Next.js 16 + Vercel AI SDK (Google Gemini) + Supabase + Stripe + i18n. Narrative: "Modern web with AI and payments, end-to-end."
3. **FitCoach** — pnpm + Turborepo monorepo shipping an Expo mobile app and a Tauri v2 desktop app, sharing a typed package, with Drizzle + SQLite offline-first sync against Supabase. Narrative: "I design senior-level multi-platform architecture."

Each case study includes: problem, solution, stack, role, aspect screenshots, and lessons learned.

---

## 8. Features & Interactions

The static HTML is enhanced with a minimal set of React islands and Astro Actions.

1. **Theme toggle** — respects `prefers-color-scheme`, persists in `localStorage`, inlined head script prevents flash of unstyled content.
2. **Language switcher** — uses `translationId` to navigate to the equivalent page in the target locale, with a fallback.
3. **Contact form** — Astro Action endpoint posts to Resend API. Honeypot for spam. Basic IP rate limit via an in-memory map (acceptable for Vercel's short-lived edge/function context — this is a personal site, not a high-traffic endpoint).
4. **Copy-to-clipboard** buttons on code blocks.
5. **Sticky TOC** on long posts (desktop only).
6. **View Transitions** between pages using Astro's built-in `<ViewTransitions />`.

---

## 9. SEO, OG, and social

- Title templating: `<Page> — Facundo Pascale` on all pages except home.
- Meta description enforced by schema (120–160 chars).
- Open Graph images dynamically generated per post/page via Satori using a branded template (dark background, orange accent, serif title, small metadata line).
- Structured data (`Article`, `Person`, `BreadcrumbList`) in JSON-LD on relevant pages.
- Twitter card `summary_large_image`.
- Canonical URLs and `hreflang` alternates on every page.

---

## 10. Testing Strategy

- **Unit (Vitest):** utility functions — `getTranslation`, reading time calculation, date filtering for scheduled posts, slug generation, frontmatter validation.
- **E2E (Playwright):** home loads in both locales; a blog post renders with TOC; the contact form submits successfully (mocked Resend); the language switcher navigates to the correct translated route; the theme toggle persists across navigation.
- **CI:** type-check + lint + unit + E2E on every PR. Block merge on failure.

---

## 11. Deployment & Operations

- **Hosting:** Vercel.
- **Branches:** `main` → production, feature branches → preview deploys.
- **Environment variables:** `RESEND_API_KEY`, `CONTACT_EMAIL_TO`, `VERCEL_DEPLOY_HOOK_URL` (used by the cron).
- **Cron:** `0 * * * *` hitting a Vercel endpoint that `fetch`es the Deploy Hook to trigger an hourly rebuild and publish any posts whose `publishedAt` has passed.
- **Analytics:** Vercel Analytics + Speed Insights enabled out of the box.
- **Monitoring:** Vercel's default function logs. No external APM at MVP scale.

---

## 12. Out of Scope (explicit YAGNI)

The following are deliberately **not** part of this spec and must not be added during implementation without a new design iteration:

- Comments, reactions, or any user-generated content.
- User accounts, authentication, or private pages.
- A newsletter subscription form (can be added once Facundo picks a provider — Resend Audiences, Buttondown, etc.).
- Any database (Supabase, Neon, or otherwise).
- A headless CMS.
- Multi-author support (author is hardcoded to `facundo`).
- Search-as-you-type (site search can be added later with Pagefind if needed, but not in MVP).
- A component playground or Storybook.
- Mobile-app-only features (PWA install prompts, push notifications).

---

## 13. Open Questions

1. **Domain registration.** `facundopascale.dev` is the intended domain but not yet purchased. Needs verification of availability and registration before launch.
2. **Existing `porfolio` retirement.** The 2025 Astro portfolio at `/Users/facundo/Desktop/Projects/personal/porfolio` should be archived (moved to a `_archive/` directory or marked read-only) once the new site is in production.
3. **Newsletter provider.** If a newsletter is added post-MVP, decide between Resend Audiences (already using Resend), Buttondown (self-contained), or ConvertKit/Mailchimp.
4. **Contact form rate limiting.** The in-memory rate limit is acceptable for MVP traffic but becomes unreliable across Vercel serverless instances. Revisit if the site takes off — a lightweight Upstash Redis is the natural upgrade.
5. **RSS content.** Should the RSS feeds contain the full MDX-rendered post body, or just the description? Trade-off: full body is nicer for readers, worse for driving clicks back to the site.

---

## 14. Out of this document (next steps)

This document is the **design spec**. The next artifact is an **implementation plan** that breaks the build into sequenced, testable steps. That plan will be written via the `superpowers:writing-plans` skill once this spec is approved by the owner.
