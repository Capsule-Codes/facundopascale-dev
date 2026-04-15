# HANDOFF — facundopascale-dev

**Last updated:** 2026-04-15
**Current commit:** `4d674ca`
**Branch:** `main`
**Working directory:** `/Users/facundo/Desktop/Projects/personal/facundopascale-dev`

## For the next Claude session

You are continuing execution of the facundopascale-dev implementation plan. **20 of 27 tasks** are done. This document has everything you need to pick up exactly where the last session stopped.

**How to resume:**

1. Read this file (you're doing it).
2. Read `docs/superpowers/specs/2026-04-13-personal-site-design.md` (the approved spec).
3. Read `docs/superpowers/plans/2026-04-13-personal-site.md` (the 27-task plan). **Warning: the plan is static and does NOT reflect the small deviations listed in "Known deviations" below.**
4. Run `git log --oneline` to confirm state matches the commits listed here.
5. Resume with **Task 19** using the 4-agent pipeline described below.

> ✅ **Tasks 17 and 18 re-review COMPLETE (2026-04-15).** Both were originally approved via the combined Spec+QA+DA reviewer and flagged for independent audit. The strict pipeline re-reviewed both with 3 separated agents:
> - **Task 18:** passed all 3 reviewers on the first round. No blockers.
> - **Task 17:** Spec+QA accepted, but the independent Devil's Advocate REJECTED round 1 for two blockers: (a) `text-yellow-700` light-mode contrast landed at 4.51:1 (0.01 over AA — gambling, not engineering), and (b) `<aside>` landmark with no accessible name collapsed multiple callouts into indistinguishable complementary regions. Round 2 fix committed as `293e19f`: bumped `warning` to `yellow-800` (~6.28:1) and `success` to `green-800` (~6.54:1) for ~1.75–1.96 headroom, swapped `<aside>` → `<div role="note" aria-labelledby={headerId}>` with a `crypto.randomUUID()`-derived id on the prefix `<p>`. Round 2 DA ACCEPTED after independent arithmetic verification and a 5-Callout fixture build. The combined-reviewer precedent is now explicitly weaker than the strict pipeline — if the user requests combined review again, warn him about this Task 17 miss before agreeing.

---

## Project Summary

A bilingual (ES/EN) personal website for Facundo Pascale built as an Astro 6 static site with:

- Astro 6 + React 19 + MDX + Tailwind CSS 4 (via `@tailwindcss/vite`) + sitemap
- i18n path-based routing (ES default)
- Content collections (blog, work, pages) with Zod schemas
- Design system: warm dark base (`#0c0a09`) + orange accent (`#f97316`) + Fraunces/Inter/JetBrains Mono (Fontsource)
- TypeScript strictest
- ESLint typescript-eslint v8 + Prettier + Husky + lint-staged
- Vitest for unit tests (3 files, 15 tests passing)
- Playwright installed (no tests yet)
- Vercel deployment planned (not yet pushed)

The site's **positioning** is: senior dev personal brand first, Capsule Codes leads second, content/audience third. Fully static, no database, no auth, no CMS.

---

## The 4-Agent Pipeline

The user asked for maximum rigor. Every task goes through 4 stages:

1. **Implementer** — writes code following the task spec, TDD where applicable, commits.
2. **Spec Reviewer** — verifies the implementation matches the spec by reading real files (not trusting the implementer's report).
3. **QA Agent** — exercises runtime behavior with edge cases, integration checks, dev server smoke tests.
4. **Devil's Advocate** — hostile final review, biased toward rejection. The devil's advocate is the **strict judge — no controller override**. If it rejects, the implementer fixes; the controller does NOT override.

If any of 2, 3, or 4 rejects → back to implementer with combined feedback → re-review.

**Optimization:** For small tasks (pure utilities with TDD, < 50 lines, no runtime surface), combine Spec + QA + DA into a single review agent with a clear 3-part mandate. Used successfully for Tasks 7, 8, 9, 10, 11, 12. Saves ~2 dispatches per task without losing rigor.

**Prompts for the 3 base roles** are at:

- `~/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.7/skills/subagent-driven-development/implementer-prompt.md`
- `~/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.7/skills/subagent-driven-development/spec-reviewer-prompt.md`
- `~/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.7/skills/subagent-driven-development/code-quality-reviewer-prompt.md`

QA and Devil's Advocate are custom — invent a prompt per task following the patterns used in the existing tasks (see any git commit message referencing "QA" or "DA").

---

## Completed Tasks (18 / 27)

### Phase 1 — Foundation (Tasks 1-4)

| # | Task | Commits | Notes |
|---|---|---|---|
| 1 | Bootstrap Astro project | `14fba0e` → `999636d` → `1915baf` | 3 commits: initial + QA fix + DA fix (ESLint was theatre, missing skip link not yet, README was Astro default, favicon was Astro logo, `.gitignore` missing `.vercel/`) |
| 2 | i18n routing + root redirect | `3f966a7` → `4eff25b` → `d5b6ea2` | 3 commits: initial + PageKey type fix + instant redirect + drop fallback + dead null check cleanup |
| 3 | Tailwind 4 tokens + fonts | `0afe84d` | 1 commit clean |
| 4 | Header + Footer | `3f398a9` → `4a53c5a` | 2 commits: initial + DA fixes (skip link, `<main>` landmark in Layout, `rel="noopener"`, focus-visible states, nav aria-labels) |

Bonus commit: `6c71465` — replaced "Writing"/"Uses" English labels with "Notas"/"Herramientas" in the ES nav (no-Spanglish policy).

### Phase 2 — Content Model (Tasks 5-8)

| # | Task | Commit | Notes |
|---|---|---|---|
| 5 | Content collections schemas | `3551661` | Clean. Uses `astro/zod` (not `astro:content`) and `z.url()` (not `z.string().url()`) — modern Zod 4 idioms. `src/content.config.ts` at Astro 6 location (NOT `src/content/config.ts`). Collections: `blog`, `work`, `pages`. |
| 6 | Content filtering utilities | `e9d5684` | Clean TDD. Functions: `isPublished`, `filterPublished`, `byLocale`, `sortByDate`. All take structural `PublishableEntry` type. |
| 7 | findTranslation utility | `ed2fc52` | Clean TDD. Returns sibling doc by `translationId` in target locale, or undefined. |
| 8 | Reading time remark plugin | `eaf8aff` | Clean TDD. `calculateReadingTime` + `remarkReadingTime` plugin. Wired into `mdx()` in `astro.config.ts` (renamed from `astro.config.mjs`). |

### Phase 3 (partial) — Static Pages (Tasks 9-12)

| # | Task | Commits | Notes |
|---|---|---|---|
| 9 | Home page + PostCard + ProjectCard | `2148054` → `c0c4312` | Initial + fix for nested `<main>`. The home uses `<div class="mx-auto max-w-5xl px-6">` as inner wrapper; Layout provides the only `<main>`. |
| 10 | About + Uses pages | `889729b` | Clean. `sobre-mi` (ES only), `about` (EN only), `uses` (both locales via shared file). Installed `@tailwindcss/typography` dev dep. Placeholder text renders until Task 22 seeds content. |
| 11 | Work index + [slug] | `6acbba6` | Clean. 4 files: `trabajo/index`, `work/index`, `trabajo/[slug]`, `work/[slug]`. Empty collection handled via `getStaticPaths` returning `[]` for slugs and placeholder text for indexes. Case study outer wrapper is `<article>` (not `<main>`). |
| 12 | Blog index + [slug] + PostMeta + Toc | `b78ac94` | Clean. Blog index and post route are single files serving both locales. Toc is bilingual via `locale` prop. |

### Phase 3 (partial) — React Islands

| # | Task | Commits | Notes |
|---|---|---|---|
| 13 | Theme toggle + light-mode WCAG fix + prose-invert sweep | `788b1f2` → `5a15af9` | 2 commits. Round 1 rejected by DA for spec violation (§8.1 "respects `prefers-color-scheme`" not honored) and asymmetric `localStorage` handling. Round 2 fix: inline script + island both read `matchMedia('(prefers-color-scheme: light)')` as fallback when no stored theme; island `useEffect` wrapped in try/catch; `toggle` keeps in-memory `setTheme` + `dataset.theme` unconditional, only wraps `localStorage.setItem` in try/catch (theme still applies visually in private-mode Safari). `aria-pressed` toggle button pattern (Option A) with static `aria-label="Toggle theme"` — stable accessible name pre-hydration. Light-mode accent: `#c2410e` (4.96:1) / hover `#9a3412` (7.00:1). 6 pages swapped `prose-invert` → `dark:prose-invert`. Tailwind 4 custom variant `@custom-variant dark (&:where([data-theme='dark'], [data-theme='dark'] *))` added to `src/styles/global.css`. |
| 14 | Language switcher island + missing-translation toast | `a38bace` → `34814f7` | 2 commits. Round 1 rejected by DA for WCAG 2.2 SC 4.1.3 violation — dynamically-created toast `<div>` had no `role="status"`, so screen readers would silently miss the fallback message. Round 2 fix: single-line `t.setAttribute('role', 'status')` added to the inline toast script in `Layout.astro`; controller applied directly (no full implementer pipeline for one-liner; DA accepted). Island is a `<button>` (plan-specified; non-blocking follow-up to consider anchor). Type narrowed to `currentCollection?: 'blog' \| 'work'` because `pages` collection schema lacks `translationId`. Implementation: `src/components/islands/LanguageSwitcher.tsx` (sessionStorage try/catch for miss-path flag), `Header.astro` uses if/else `getCollection` branching to avoid casts under strictest TS, `Layout.astro` threads `currentDocId` + `currentCollection` via conditional spread (`exactOptionalPropertyTypes`), inline `is:inline` toast script before `</body>` wrapped in try/catch, reads `document.documentElement.lang` for ES/EN text. Slug pages (`blog/[slug]`, `work/[slug]`, `trabajo/[slug]`) pass `currentDocId={entry.id}`. Static pages do NOT pass docId/collection — switcher falls through to `targetHomePath` (home of other locale) for them (known gap — see Open Concerns). |

### Phase 4 — MDX Content Features

| # | Task | Commits | Notes |
|---|---|---|---|
| 20 | Sitemap i18n + robots.txt + 404 page + hreflang alternates | `e91ffd7` → `cac7435` → `03895e1` → `4d674ca` | **DA rejected Round 1 for 4 structural SEO blockers.** Strict pipeline outcome: Spec ACCEPT_WITH_CONCERNS, QA ACCEPT_WITH_CONCERNS, DA REJECT. Blockers: (1) **canonical/hreflang trailing-slash mismatch** — canonical was `/es/sobre-mi/` but `hreflang="es"` was `/es/sobre-mi`, so canonical was NOT a member of the hreflang cluster and Google would ignore the whole cluster per their spec; (2) **sitemap duplicate `hreflang="es-AR"` on home groups** — the root `/` redirect was being indexed and paired as default-locale alias, producing two entries for `es-AR` in the same `<url>` group (RFC-invalid); (3) **sitemap `es-AR`/`en-US` vs HTML `es`/`en` asymmetry** — regional codes in one place and plain codes in the other would filter out `es-ES`/`es-MX`/`es-CL` users; (4) **cross-slug pages (about/contact/work) had zero valid hreflang signals anywhere** — sitemap can't pair them (path shapes differ), HTML was broken by #1. Round 2 fix (`4d674ca`) was surgical: `localizedPath` in `src/lib/i18n.ts` now returns trailing-slash form uniformly (audited 11 call sites in 7 files — zero string-concat consumers, all anchors or `new URL()` wraps, zero breakage); `astro.config.ts` `sitemap()` gained `filter: (page) => !/^https?:\/\/[^/]+\/?$/.test(page)` excluding the root redirect and `locales: { es: 'es', en: 'en' }` dropping the regional codes; `tests/unit/hreflang.test.ts` fixtures updated to expect trailing slashes. Round 2 DA re-verified 10 built HTML pages independently — every canonical is byte-identical to exactly one hreflang href; sitemap has 6+6 paired alternates with zero duplicates and zero `es-AR`/`en-US` codes; regex filter stress-tested against 5 edge cases including `www.` subdomain; zero regressions (root redirect still points at `/es/`, `LanguageSwitcher.tsx` still assigns correctly, RSS link shape unchanged). **Round 1 architecture kept intact**: helper `src/lib/hreflang.ts` (9 unit tests) branches on page type (home / static with `PATHS` via `localizedPath` / blog slug via `findTranslation` / work slug via `findTranslation` / orphan → skip hreflang, canonical still present); Layout accepts new optional `currentPageKey?: PageKey` prop; 9 page files wired (`[locale]/index.astro`, `sobre-mi/index.astro`, `about/index.astro`, `contact/index.astro`, `contacto/index.astro`, `uses/index.astro`, `blog/index.astro`, `work/index.astro`, `trabajo/index.astro`); 404 strategy (a) — single `src/pages/404.astro` at project root (NOT `[locale]/`) with an `is:inline` script that swaps title/subtitle/home-link + `<html lang>` + `<title>` from ES to EN when `navigator.language.toLowerCase().startsWith('en')` (wraps the read in try/catch, one-shot on load); per-locale 404s were ruled out after reading `node_modules/@astrojs/vercel/dist/index.js:327` — the adapter only maps `pathname === "/404"` for static output. 404 uses `<div>` inside `<Layout>` (NOT nested `<main>`, per invariant #8). `public/robots.txt` references `https://facundopascale.dev/sitemap-index.xml` matching `astro.config.ts` site. `.vercel/output/config.json` has catch-all route `^/.*$ → /404.html` with `status: 404` as last route (filesystem-first ordering). `@astrojs/sitemap` v3.7.2 confirmed via `node_modules/@astrojs/sitemap/dist/index.d.ts`. 41/41 tests passing (32 pre-existing + 9 new `hreflang.test.ts`). **Gotcha for next task**: the `@astrojs/sitemap` limitation (can't pair cross-slug URLs) is documented in follow-up #41 — HTML tags are the sole hreflang signal for about/contact/work in both directions. |
| 19 | Dynamic OG image generation via Satori / `@vercel/og` | `ef676da` → `57b88ef` | **First task run through the STRICT pipeline from the start (not combined reviewer).** Implementer addressed 10 pre-flagged plan bombs (WOFF→TTF font format, `(props as any)`, slug shape consistency endpoint↔Layout, locale prefix in slug, relative→absolute `og:image` URL, missing `og:title`/`og:description`/Twitter pair, `getCollection` import path, empty-collection guard, caret-range install, static-vs-function prerender). Chose slash-separated slug convention `/og/<collection>/<locale>/<bare>.png` with `buildOgSlug` in `src/lib/og.ts` as the single source of truth (imported by both the endpoint and `Layout.astro`); 11 new Vitest tests in `tests/unit/og.test.ts`. Committed Fraunces Regular + Bold TTFs (71,580 + 71,588 B) to `src/assets/og/` — NOT in `public/`. Endpoint uses `React.createElement` (Astro rejects `.tsx` endpoints; `createElement` yields real `ReactElement` values that satisfy strictest TS `key` requirement without JSX). Font paths resolved from `process.cwd()` with inline rationale — Vite rewrites `import.meta.url` during the server-bundle step so URL-based resolution fails at prerender. Layout gained full OpenGraph + Twitter meta: `og:type` (article for blog, website otherwise), `og:site_name`, `og:locale` (`es_AR`/`en_US`), `og:url`, `og:image` (absolute, guarded on `Astro.site`), `og:image:width=1200`, `og:image:height=630`, `og:image:type=image/png`, `og:image:alt` localized, `twitter:card=summary_large_image` + counterparts, `rel=canonical`. Build output: 3 default PNGs (`default.png`, `default/es.png`, `default/en.png`) at 52-54 KB each, all valid 1200×630 RGBA, all landed under `.vercel/output/static/og/**` (NOT under `/functions/`). `_render.func` contains zero bytes of satori/resvg/yoga/wasm — Satori is strictly build-time. **Strict pipeline verdicts:** Spec ACCEPT_WITH_CONCERNS (spec coverage complete, all 10 plan bombs verified in code); QA ACCEPT (gates green, 32/32 tests, all 17 meta tags present on 4 sample pages, locale correctness confirmed, PNG magic-byte validated); DA ACCEPT_WITH_CONCERNS (tried to reject for ~30 minutes, found no blockers). **DA follow-up fix `57b88ef`:** corrected a stale docstring that claimed `fileURLToPath(new URL(..., import.meta.url))` when the code actually uses `process.cwd()`, and made the subtitle resolution collection-aware (work prefers `tagline`, blog uses `description`) — `getStaticPaths` was previously dropping `entry.data.description` for work entries, making the fallback chain a dead branch. Gates all green post-fix. |
| 18 | Per-locale RSS feeds + autodiscovery | `7414d40` | **[COMBINED REVIEW — RE-REVIEWED 2026-04-15, PASSED STRICT PIPELINE]** 1 feat commit + HANDOFF doc `bd3c91b`. Passed combined Spec+QA+DA review in 1 round (reviewer verdict: ACCEPT, no rejects). Created `src/pages/[locale]/rss.xml.ts` emitting `/es/rss.xml` and `/en/rss.xml`. `@astrojs/rss@4.0.18` was already in `package.json` — no install needed. Endpoint uses `getStaticPaths` to enumerate both locales; both files emit as static under `dist/client/{es,en}/rss.xml` AND `.vercel/output/static/{es,en}/rss.xml` (confirmed NOT serverless, so no `export const prerender = true` needed — static `output` + adapter prerenders endpoints that declare `getStaticPaths`). **Deviation from plan on `site!`:** avoided the non-null assertion — under `typescript-eslint/recommended` v8, `no-non-null-assertion` is a warn, and strictest tsconfig is unforgiving of unchecked access. Replaced with an early `if (!site) return new Response('Site URL not configured', { status: 500 })` guard that narrows `site` to `URL` for the `rss()` call. **Deviation on `stylesheet: false`:** verified `@astrojs/rss` v4 types — `stylesheet?: string \| boolean \| undefined`, so `false` is technically valid, but the runtime only honors `typeof === 'string'`. Omitted the key entirely (cleaner, same behavior). **Slug derivation matches the sibling `[locale]/blog/[slug].astro`:** `entry.id.replace(\`${loc}/\`, '').replace(/\.mdx$/, '')` — the `.mdx` strip is a no-op under the Astro 6 glob loader but kept for parity so the feed URL shape tracks the real page shape bit-for-bit. **Link URL shape:** built as `\`/${loc}/blog/${slug}\`` (NO trailing slash — `@astrojs/rss` v4 defaults `trailingSlash: true` and its `createCanonicalURL` util adds the trailing slash during XML serialization, producing `https://facundopascale.dev/es/blog/slug/` in the feed item `<link>`. Astro's default `trailingSlash: 'ignore'` serves both shapes, so feed readers hit a real 200.) **Empty collection handling verified:** both rss.xml files are 210-211 bytes, valid XML with `<title>Facundo Pascale</title>`, locale-specific `<description>`, `<link>https://facundopascale.dev/</link>`, and NO `<item>` elements. **Autodiscovery added to `src/components/Layout.astro` `<head>`:** two unconditional `<link rel="alternate" type="application/rss+xml">` tags — one for ES ("Notas (ES)") and one for EN ("Writing (EN)") — placed after the favicon link. Verified they emit on every built HTML page (e.g. `/es/`, `/en/about/`, `/es/uses/`). The root `/index.html` (meta-refresh redirect) does NOT go through Layout, so it has no autodiscovery — expected. Final build: 15 routes (13 pages + 2 rss.xml). Gates all green. |
| 17 | Callout MDX component + `@/` path alias | `e6d594a` → `293e19f` | **[COMBINED REVIEW — RE-REVIEWED 2026-04-15, ROUND 2 REQUIRED]** Round 1 was the combined reviewer. Independent strict-pipeline DA rejected Round 1 for (a) `text-yellow-700` light at 4.51:1 (0.01 over AA) and (b) `<aside>` landmark with no accessible name. Round 2 (`293e19f`): warning → `yellow-800` (~6.28:1), success → `green-800` (~6.54:1), root element → `<div role="note" aria-labelledby={headerId}>` with `crypto.randomUUID()`-derived id on prefix `<p>`. Role applied uniformly to all 4 variants (WAI-ARIA 1.2 defines `note` as ancillary content — fits info/success/warning/danger equally for static prerendered prose; `alert`/`status` are live-region-only and wrong for non-dynamic content). Round 2 DA verified contrast with independent WCAG arithmetic (all 8 fg/bg combos clear AA with ≥0.25 headroom, worst is info light inherited from Task 13's global accent token), landmark with a 5-Callout fixture build (5 distinct ids in compiled HTML), and accepted. **Note:** danger light kept at `text-red-700` (5.93:1, +1.43 headroom) — not bumped to `-800` because it already had comfortable margin. 1 feat commit + HANDOFF doc `7ad8dae`. Passed combined Spec+QA+DA review in 1 round (reviewer verdict: ACCEPT, no rejects; non-blocking notes on `<aside>` landmark semantics, prose margin stacking, tight yellow-700/light contrast margin at 4.52:1). Created `src/components/mdx/Callout.astro` (4 variants: info/warning/success/danger + optional title), `src/components/mdx/index.ts` convenience registry, and added `baseUrl: "."` + `"@/*": ["src/*"]` to `tsconfig.json`. **Deviation from the plan on contrast:** the plan used `text-yellow-400`/`text-green-400`/`text-red-400` which FAIL WCAG AA on the light-mode `bg-elevated` (#f5f5f4): yellow-400 1.56:1, green-400 1.76:1, red-400 3.23:1. Applied the Task-15-proven `text-{color}-700 dark:text-{color}-400` pattern instead — warning 5.16:1 / 10.9:1, success 5.68:1 / 9.7:1, danger 6.67:1 / 5.6:1, info (`--color-accent`) 5.24:1 / 6.22:1. All 4 variants × 2 themes pass AA. Borders kept at `-500` per plan (decorative, redundant with `[INFO]`/`[WARNING]`/`[OK]`/`[DANGER]` prefix text — non-blocking WCAG 1.4.11 since essential meaning is in text; warning/success borders are soft ~2.22:1 in light mode, logged as follow-up #30). The `mdxComponents` registry in `index.ts` is **convenience re-export only**, NOT auto-wired — Astro's `@astrojs/mdx` has no global `mdx-components.tsx` equivalent, so authors must explicitly import components in MDX files. JSDoc in `index.ts` documents this explicitly. Smoke-tested via a temp `src/pages/[locale]/qa-callout.astro` importing `Callout` via `@/components/mdx/Callout.astro` and `Layout` via `@/components/Layout.astro` (exercises the new alias), placed the callout inside `<div class="prose dark:prose-invert">` to verify Prose doesn't break the component; built HTML confirmed all 4 variant class strings rendered correctly, compiled `_astro/*.css` contains `text-yellow-400`, `text-yellow-700`, `dark:text-yellow-400` (and green/red equivalents) plus `border-*-500`, and the `dark:` variant correctly expands to `:where([data-theme=dark],[data-theme=dark] *)` via the Task 13 custom variant (NOT `prefers-color-scheme`). Cleanup: smoke file deleted, final build 13 pages, gates all green. |
| 16 | Shiki dual-theme config + CodeBlock wrapper | `eae8408` → `e956b20` → `a483c89` | **3 commits. DA rejected round 1** for two blocking issues: (1) WCAG 2.2 SC 4.1.3 Status Messages — static `aria-label="Copy code"` hid the visible `copy`/`copied!` text change from screen readers (same clause that killed Task 14 round 1); (2) functional regression — script snapshotted `target.textContent` AFTER mutation, so a second click within the 2s window permanently stuck the button on `copied!`. DA also flagged two cleanups to bundle. **Round 2 fixes (`a483c89`):** (1) on click, mutate BOTH `textContent` AND `aria-label` — `setAttribute('aria-label', 'Copied')` on success, `'Copy failed'` on catch, restore to `'Copy code'`; chose dynamic aria-label over a separate `role="status"` live region because the button is already the focused element at click time. (2) Never snapshot — restore strings are literal `'copy'`/`'failed'`; per-button timeout handles tracked via `WeakMap<HTMLButtonElement, number>` with `clearTimeout` of any pending handle BEFORE scheduling the new one, eliminating the overlap race entirely. (3) Split the Shiki CSS bridge into 4 rules — `.shiki` owns container concerns (`color`, `background-color`), `.shiki span` owns token concerns only (`color`, `font-style`, `font-weight`, `text-decoration`); same split for `:root[data-theme='light']` override. (4) Moved lang label from `right-14` (which got covered by the 66px-wide `copied!` text) to `left-2` — label now sits in Shiki's top-left padding gutter, clear of the button regardless of button text width. **Also bundled two optional fixes** the DA called low-risk: (a) added `focus:opacity-100` alongside `focus-visible:opacity-100` so Android touch users (which fires `:focus` but not `:focus-visible`) can see the button; (b) on clipboard rejection, button text flips to `failed` + `aria-label="Copy failed"` for 2s so HTTPS-origin / permissions failures aren't silent. Smoke-tested again: built an `/[locale]/qa-codeblock.astro` with two `CodeBlock` instances, inspected dist HTML — confirmed initial `aria-label="Copy code"`, compiled script contains `WeakMap`, `clearTimeout`, dynamic `setAttribute('aria-label', 'Copied'|'Copy failed')`, literal restore strings; compiled CSS in `_astro/*.css` has 4 separated rules. Smoke file removed, 13 pages confirmed. Base architecture from round 1 unchanged: Dual themes via `themes: { light: 'vitesse-light', dark: 'vesper' }` + `defaultColor: false` in `astro.config.ts`; CodeBlock is a **manual opt-in wrapper** (not an `mdxComponents` auto-override — deferred to Task 17); uses `text-muted` and the project-standard focus ring. Copy script is a plain `<script>` deduped & bundled as `<script type="module">` inline by Astro. `aria-label="Copy code"`/`"Copied"`/`"Copy failed"` hardcoded English — see updated follow-up #27. |

### Phase 3 (cont.) — Contact form + Actions

| # | Task | Commits | Notes |
|---|---|---|---|
| 15 | Contact form + Astro Actions + Resend + Vercel adapter | `422939b` → `92dc4b2` → `13aebb6` | **3 commits. DA rejected TWICE** on WCAG 1.4.3 (both misses were contrast violations in `ContactForm.tsx`). Round 1: `text-dim` on 12px form labels gave 2.67:1 dark / 2.49:1 light (FAIL AA 4.5:1). Round 2 fix: one-line `text-dim` → `text-muted` (8.27:1 / 7.33:1). Round 2 DA approved the label fix but self-caught a round-1 miss — `text-red-400` on light bg ≈ 2.91:1 and `text-yellow-400` on light bg ≈ 1.56:1 (practically invisible). Round 3 fix: `text-red-700 dark:text-red-400` + `text-yellow-700 dark:text-yellow-400` (6.67:1 / 6.59:1 and 5.16:1 / 12.28:1 — all AA). Controller applied both fixes directly as one-liners; DA verified compiled CSS `.dark\:text-red-400:where([data-theme=dark],[data-theme=dark] *)` correctly targets the `@custom-variant dark` from Task 13, NOT `prefers-color-scheme`. **Key architecture changes:** added `@astrojs/vercel@10.0.4` adapter (`output: 'static'` + adapter = hybrid, actions dynamic, pages prerendered); Astro Action `sendContact` (`src/actions/index.ts`) uses `astro/zod` (NOT deprecated `astro:schema`), `z.email()` (Zod 4 idiom), `createRateLimiter` extracted to `src/lib/rate-limit.ts` with clock injection for testability (6 unit tests in `tests/unit/rate-limit.test.ts`, 21 total). ContactForm island uses `SubmitEvent<HTMLFormElement>` (React 19 deprecates `FormEvent`), captures `formEl = e.currentTarget` BEFORE `await` (React nulls synthetic event targets post-handler), parses `x-forwarded-for` chain (first IP only), env guard for missing `RESEND_API_KEY`/`CONTACT_EMAIL_TO`. Accessibility: `htmlFor`/`id` pairs, honeypot `aria-hidden="true" tabIndex={-1}`, status messages in `role="status" aria-live="polite"` container with `min-h-[1.5rem]` to avoid CLS, focus-visible outlines on inputs + button. Contact pages use `<div>` wrapper (Layout owns `<main>`). Rate limit is per-instance on serverless (documented tradeoff, spec §13.4 defers Upstash). `from: 'contact@facundopascale.dev'` hardcoded; domain not yet purchased/verified — runtime send will 403 until Task 27 provisions DNS. |

**Current state:** 39 commits on main (Task 17 Round 2 fix + HANDOFF re-review doc + Task 19 feat + Task 19 surgical fix + Task 20 Round 1 three commits + Task 20 Round 2 fix). `pnpm check` 0 errors / 0 warnings / 1 pre-existing hint, `pnpm lint` clean, `pnpm format:check` clean, `pnpm test` 41/41 passing (6 test files — rate-limit 6, content 5, reading-time 5, findTranslation 5, og 11, hreflang 9). Last `pnpm build` emitted 13 HTML pages + 2 RSS endpoints + sitemap-index.xml + sitemap-0.xml + robots.txt + 404.html + 3 default OG PNGs. Vercel adapter output: `.vercel/output/static/` + catch-all 404 route in `.vercel/output/config.json`. Working tree clean.

---

## Pending Tasks (7 / 27)

### Phase 5 — Seed Content

- **Task 21: Seed 3 featured work case studies** (ES + EN) — FestivalPro, Estudialo-AI, FitCoach. Real screenshots go in `public/images/work/`. Starting content is in the plan at Task 21.
- **Task 22: Seed About + Uses** (ES + EN) — 4 MDX files total.
- **Task 23: Seed blog posts** — 1 published + 1 future-dated (to validate scheduling) × 2 locales = 4 files.

### Phase 6 — Testing

- **Task 24: Playwright E2E** — happy paths for home, blog post, contact form, language switcher. Needs `playwright.config.ts`, browser install, 4 spec files.

### Phase 7 — Deployment

- **Task 25: Vercel Cron + Deploy Hook** — `vercel.json` with hourly cron, `src/pages/api/revalidate.ts` endpoint with `CRON_SECRET` bearer check.
- **Task 26: GitHub Actions CI** — `.github/workflows/ci.yml` running check + lint + test + e2e on PRs.
- **Task 27: Deploy to Vercel (manual)** — one-time human step: push to GitHub, import into Vercel, set env vars, connect custom domain once purchased.

---

## Known Deviations from the Plan

These are differences between what's in the plan document and what's actually in the code. Do NOT re-apply the plan verbatim — follow the code.

1. **Astro 6, not Astro 5.** `pnpm create astro@latest` installed Astro 6. All Astro 6 APIs are in use (`astro/loaders`, `astro/zod`, `src/content.config.ts` location).
2. **`@tailwindcss/vite` Vite plugin**, not `@astrojs/tailwind` integration. Correct for Astro 6.
3. **ESLint uses `typescript-eslint` v8 unified package**, not the standalone `@typescript-eslint/parser`. The plan's ESLint config was minimal (Astro recommended only); the real config has `js.configs.recommended` + `tseslint.configs.recommended` + `eslint-plugin-astro` composed via `tseslint.config(...)`.
4. **`tsconfig.json` extends `astro/tsconfigs/strictest`**, not `strict`. Slightly more restrictive — includes `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` which affect a lot of downstream code.
5. **`vitest run --passWithNoTests`** in the test script (not plain `vitest run`). Without this, CI breaks before content utilities exist.
6. **`.prettierignore` excludes `docs/`** to prevent Prettier from crashing on the embedded code blocks in the spec/plan MDX.
7. **`astro.config.mjs` renamed to `astro.config.ts`** during Task 8 so the remark plugin can be imported cleanly.
8. **`src/pages/[locale]/*` inner wrappers are `<div>` or `<article>`, NOT `<main>`.** Layout.astro already provides `<main id="main" class="flex-1">`. Repeat this invariant in every new page task.
9. **`PATHS` in `src/lib/i18n.ts` uses `as const satisfies Record<...>`** not a plain `Record<string, ...>` annotation. The latter widens `PageKey` to `string` and loses type safety.
10. **`localizedPath('blog', 'es')` label is "Notas", `localizedPath('uses', 'es')` label is "Herramientas"**. English stays as "Writing" / "Uses". The user explicitly asked to avoid Spanglish in the Spanish nav.
11. **Root redirect uses status 301**, not 302. 302 triggers Astro's hardcoded 2-second meta-refresh delay. DO NOT revert to 302.
12. **`i18n.fallback` is REMOVED from `astro.config.ts`.** The plan had `fallback: { en: 'es' }` which caused a build warning AND silent locale-mixing contradicting the explicit `findTranslation` architecture.
13. **`remarkReadingTime`** writes to `file.data.astro.frontmatter.readingTime`, but the Zod schema does NOT include `readingTime`. Consumers access it via `(p.data as unknown as { readingTime?: number }).readingTime` — a controlled cast with an inline comment.
14. **ESLint character class**: `/[#*_~>[\]]/g` (no escape before `[`) instead of `/[#*_~>\[\]]/g`. ESLint's `no-useless-escape` rule flagged the escape. Functionally identical.
15. **Favicon** is a placeholder "FP" monogram SVG on the brand palette (`#0c0a09` bg, `#f97316` FP text) at `public/favicon.svg`. NOT the Astro logo.
16. **`socials` in Footer.astro** use placeholder URLs (`github.com/facundopascale`, etc.). The user has NOT confirmed these are the correct usernames — verify with him before launch.

---

## Open Concerns / Debt to Track

Items flagged by reviewers but deferred. Address as noted:

1. ~~**Light-mode accent contrast (Task 13 MUST FIX).**~~ **RESOLVED in commit `788b1f2`.** Light block now overrides `--color-accent: #c2410e` (4.96:1) and `--color-accent-hover: #9a3412` (7.00:1). Dark mode accent unchanged.

2. ~~**Prose inverted is hardcoded (Task 13 also fix).**~~ **RESOLVED in commit `788b1f2`.** All 6 pages now use `prose dark:prose-invert`. Tailwind 4 custom variant added to `src/styles/global.css` so `dark:` responds to `data-theme='dark'`.

3. **Draft posts invisible in dev** (Task 6 concern, spec §4.4 promise broken). The spec says drafts should appear in `astro dev` but be excluded in production. Current `filterPublished` hides drafts in both. Fix when the user starts using drafts — add an `{ includeDrafts }` option or an `import.meta.env.DEV` bypass.

4. **`readingTime` defensive cast duplication.** Same `(p.data as unknown as { readingTime?: number }).readingTime` pattern exists in `src/pages/[locale]/index.astro` and `src/pages/[locale]/blog/index.astro` and `.../blog/[slug].astro`. If a fourth consumer appears, extract to a helper in `src/lib/content.ts`.

5. **PostCard `<h3>` heading inconsistency.** When PostCard is placed on the blog index page (which has h1 but no h2 section wrapper above the card), there's an h1 → h3 skip. Minor a11y. Consider parameterizing the heading level or always wrapping PostCard in an h2-containing section.

6. **`test:e2e` script was removed in Task 1.** Task 24 must add it back when Playwright config is created: `"test:e2e": "playwright test"`.

7. **`astro.config.ts` `site` is `'https://facundopascale.dev'`.** Domain not yet purchased. No action until the user buys it and connects to Vercel.

8. **`fallbackTitle` no-op ternary** in `src/pages/[locale]/uses/index.astro` (`loc === 'es' ? 'Uses' : 'Uses'`). Will be moot once Task 22 seeds real content. If you're in the file anyway, clean it up.

9. **Toc visual tightness on desktop**. With `max-w-3xl` container + `w-56 + ml-8` float, prose wraps in ~464px. Revisit once Task 23 seeds blog content and you can see a real post.

10. **Plan document has 1 typo-level bug** (line 775 of `docs/superpowers/plans/2026-04-13-personal-site.md`): `entries.filter((e) => !e.data.draft || true)` — the `|| true` makes it a no-op. This was deliberately omitted from the implementation (Task 6) per instructions. Don't re-add it.

11. **`ThemeToggle.tsx` `aria-label` is hardcoded English ("Toggle theme").** Task 13 DA accepted this as scope-controlled tradeoff — Header doesn't thread `locale` into the island yet. Follow-up: thread `locale` prop through `Header.astro → <ThemeToggle locale={locale} />` and localize via a small dictionary ("Cambiar tema" / "Toggle theme"). Do this when Task 14 (Language switcher) is done — it also needs locale threading into islands, so combine the work.

12. **`ThemeToggle` glyph (☀/☾) still flickers for ~1 frame on first paint for users with light-mode OS or `theme=light` stored.** The `data-theme` flips instantly (inline script), colors paint correctly, and the `aria-label`/`aria-pressed` are stable — so SR users are NOT affected. Only the 1-char visual glyph inside the button briefly shows the wrong icon until React hydrates. Pure polish. Fix only if a user complains: render the initial glyph via CSS `::before content: attr(data-theme...)` instead of React state, or have the inline script patch the button's textContent by `id`. Not worth it for a theme button.

13. **`eslint.config.js` `tseslint.config` signature deprecation hint** (pre-existing, not introduced by Task 13). Clean up next time someone touches the ESLint config.

14. **LanguageSwitcher static-page fallback gap (Task 14).** On static pages (`/es/sobre-mi`, `/en/about`, `/es/uses`, `/en/uses`, home, blog index, work index), clicking the switcher sends the user to `/en/` or `/es/` (home of other locale) + toast — even though the translated counterpart exists via `localizedPath`. Root cause: the `pages` content-collection schema omits `translationId`, so Task 14 narrowed `currentCollection` to `'blog' | 'work'`. Fix options: (a) add `translationId` to the `pages` schema in `src/content.config.ts`, seed it in the pages MDX during Task 22, and expand the Header logic back to include `'pages'`; or (b) add a small static-page translation map in `Header.astro` keyed on `PageKey` for the 5 static routes. Option (a) is cleaner and matches the plan's original intent. Address before launch.

15. **Language switcher is `<button>`, not `<a href>` (Task 14).** Plan-specified, but suboptimal: cmd/ctrl/middle-click don't open in new tab, screen readers announce "button" instead of "link", no JS-less fallback. Consider rewriting as an Astro-rendered `<a href>` for the happy path (targetPath known) and keeping the React island only for the miss-path (toast + redirect). Non-blocking polish.

16. **LanguageSwitcher toast strings hardcoded in inline script (Task 14).** Cannot import from i18n dictionary trivially (inline scripts run pre-hydration). Acceptable tradeoff. If the strings ever need more complexity, switch to a Layout-provided data attribute and read it from the script.

17. **ThemeToggle `aria-label` still hardcoded English (from Task 13 follow-up #11).** Now that Task 14 shipped with its own hardcoded English aria-label, consider a single Header-level i18n pass that threads a locale-aware labels dictionary into BOTH islands. Do this together when the next Header refactor happens.

18. **Playwright test hook for missing-translation toast (Task 24).** When Playwright lands, add an axe + functional test that injects `sessionStorage.setItem('missing-translation', '1')` before navigation and asserts the toast renders with `role="status"`. Catches regressions if someone refactors the inline script.

19. **[CRITICAL] `--color-text-dim` token fails WCAG AA theme-wide.** Dark `#57534e` on `#0c0a09` ≈ 2.67:1. Light `#a8a29e` on `#fafaf9` ≈ 2.49:1. Both fail AA 4.5:1 for normal text. Currently consumed by `PostMeta.astro`, `Footer.astro`, `ProjectCard.astro`, `PostCard.astro`, `Toc.astro`, `src/pages/[locale]/trabajo/[slug].astro`, `src/pages/[locale]/work/[slug].astro`, home hero section, and all pages that use `text-dim` for meta labels. **Action:** audit every consumer via `rg 'text-\[var\(--color-text-dim\)\]'`, then either (a) bump the token to a readable pair like `#78716c` (stone-500) dark / `#44403c` (stone-700) light, which gives ~5.5:1 both ways; or (b) reserve `text-dim` for decorative non-text only and swap consumers to `text-muted`. Option (a) is cleaner — preserves intent, passes AA globally. File blocking before launch.

20. **Dead-code honeypot double-check (Task 15).** `src/actions/index.ts` has `if (input.honeypot) throw BAD_REQUEST` AFTER Zod's `z.string().max(0).optional()` validates. An empty string is falsy so the check never fires; a non-empty string already failed Zod. Either remove the dead check or tighten Zod to reject empty strings too (non-blocker).

21. **Double-submit race in ContactForm (Task 15).** `onSubmit` has no `if (state === 'sending') return` entry guard. Rapid double-click before the disabled button re-renders can fire two concurrent `sendContact` calls. Rate limiter catches it but 2 emails may send first. Add entry guard.

22. **No progressive enhancement on contact form (Task 15).** Form has no `action`/`method` attrs — without JS it does nothing. Astro Actions supports `action={actions.sendContact}` on the form element for PE. Non-blocking per spec, but easy to add.

23. **Task 15 `from: 'contact@facundopascale.dev'` requires DNS verification in Resend.** Runtime sends will 403 until the domain is purchased, DNS records set, and Resend's domain is verified. Not a code bug — deployment pre-req for Task 27.

24. **Rate limit is per-instance on serverless (Task 15, spec §13.4 defer).** Cold starts multiply allowance by instance count. Spec explicitly defers Upstash/Redis until launch. Documented in `src/lib/rate-limit.ts` JSDoc.

25. **Contrast lint rule (stretch follow-up from Task 15 DA).** Consider adding a CI check (stylelint plugin or custom script) that flags `text-*-300/400/500` without a `dark:` variant, and `text-*-700/800/900` without a light-fallback. Would prevent Task-15-style round-2 DA misses from reaching review.

26. **Plan file needs update to reflect Task 15 lessons (stretch).** `docs/superpowers/plans/2026-04-13-personal-site.md` lines 1934-1935 still contain the unsafe hard-coded `text-red-400`/`text-yellow-400` classes. Future tasks referencing the plan verbatim could regress. Update the plan to use `text-red-700 dark:text-red-400` pattern.

27. **Hardcoded English strings across MDX components (Tasks 16, 17).**
    - **`CodeBlock.astro` (Task 16, Round 2).** The a11y pattern is DYNAMIC — on copy success the button's `aria-label` flips `'Copy code'` → `'Copied'` and the visible text flips `'copy'` → `'copied!'`; on clipboard rejection it flips to `'Copy failed'` / `'failed'`. WCAG SC 4.1.3 is satisfied, but all six strings (`'Copy code'`, `'Copied'`, `'Copy failed'`, `'copy'`, `'copied!'`, `'failed'`) are hardcoded English.
    - **`Callout.astro` (Task 17).** The variant prefix labels rendered inside the callout (`'INFO'`, `'WARNING'`, `'OK'`, `'DANGER'`) are hardcoded English, and the optional `title` prop is passed through verbatim (the author controls localization at the MDX call site, so `title` itself is fine — the deviation is only the prefix labels).

    Consistent with ThemeToggle (#11/#17) and LanguageSwitcher (#16) hardcoded-EN aria precedent. The i18n follow-up still applies — thread a locale dictionary into the MDX components (either via an Astro prop or via a per-page `data-*` attribute the inline script / template reads) when the Header-level i18n pass happens.

28. **`CodeBlock` is manual opt-in only (Task 16).** Authors must explicitly wrap a fenced block with `<CodeBlock lang="...">\`\`\`lang\n...\`\`\`</CodeBlock>` to get the lang label + copy button. Plain fenced blocks still get Shiki highlighting via the global `mdx()` `shikiConfig`, but no copy affordance. Task 17 plans to wire `mdxComponents` — if that task ever auto-overrides `<pre>` with CodeBlock, the `lang` will need to be parsed out of the child `<code>`'s `className="language-xxx"` (Astro's MDX integration does not forward `data-language` or `lang` to replaced `<pre>` components out of the box). Keep manual opt-in as the default and only add auto-override if a real need surfaces.

29. **Shiki dual-theme CSS bridge lives in `src/styles/global.css` (Task 16).** `astro.config.ts` sets `shikiConfig: { themes: { light: 'vitesse-light', dark: 'vesper' }, defaultColor: false, wrap: true }`. Every token carries both `--shiki-light` and `--shiki-dark` CSS vars with NO direct color, and a pair of CSS rules under the `/* Shiki dual-theme bridge */` comment picks the right variable based on `:root[data-theme='light']` (falls through to dark as the default). This ties into the project's manual `data-theme` system instead of raw `prefers-color-scheme`. If someone ever replaces the themes, verify both still read cleanly on `#0c0a09` (dark bg) and `#fafaf9` (light bg), and watch for vesper's own background `#101010` bleeding through the page `<pre>` — currently fine because `--shiki-dark-bg` is scoped to `.shiki` elements only. Task 19 (OG images) and Task 21-23 (seed content with code blocks) are the next consumers.

30. **`Callout.astro` soft borders in light mode (Task 17).** The four variants use `border-{color}-500` per the plan's palette intent. On the light-mode `bg-elevated` (#f5f5f4):
    - `border-yellow-500` (#eab308) → 2.22:1 (decorative-soft)
    - `border-green-500` (#22c55e) → 2.22:1 (decorative-soft)
    - `border-red-500` (#ef4444) → 3.77:1 (OK)
    - `border-[var(--color-accent)]` (#c2410e in light) → 5.24:1 (OK)

    WCAG 1.4.11 Non-text Contrast requires 3:1 only when the UI component CONVEYS essential meaning. In the Callout, variant meaning is redundantly conveyed by the `[INFO]`/`[WARNING]`/`[OK]`/`[DANGER]` prefix text (which passes AA 4.5:1 via the `-700 dark:-400` pattern), so the border is decorative and the 2.22:1 warning/success borders are non-blocking. If you ever want crispy light-mode borders, a full palette bump is needed: warning `-700` (`#a16207`) ≈ 5.16:1, success `-700` (`#15803d`) ≈ 5.68:1, danger `-700` (`#b91c1c`) ≈ 6.67:1 — which happens to be the same colors the Callout already uses for the PREFIX TEXT in light mode. So you could alias `border-{color}-500 dark:border-{color}-500` + light-override to `-700` if you want them to match. Leaving as-is for now — palette intent preserved, contrast guarantees come from the prefix text.

31. **`src/components/mdx/index.ts` convenience registry is NOT auto-wired (Task 17).** The file exports `mdxComponents = { Callout, CodeBlock }` for ergonomics, but `@astrojs/mdx` does not read this object — Astro has no global `mdx-components.tsx` equivalent à la Next.js. Authors must still explicitly import components in each MDX file (`import Callout from '@/components/mdx/Callout.astro'`). The actually-useful part of Task 17 is the `@/` path alias in `tsconfig.json` (`baseUrl: "."` + `"@/*": ["src/*"]`). JSDoc on the registry documents this limitation. If Tasks 21–23 (content seeding) want true auto-wiring, the options are (a) a custom renderer that passes `components={mdxComponents}` to `<Content />`, or (b) every MDX file imports from `@/components/mdx` (DRY but still manual). Task 22/23 implementer decides which pattern fits the real seeds.

32. **RSS feed is summary-only (no full content, Task 18).** The endpoint populates `title`, `description`, `pubDate`, `link`, and `categories` per item — no `content` field, so `<content:encoded>` is NOT emitted. Feed readers see the 50-200 char description excerpt only; readers who want the full article must click through. This matches the plan verbatim and is the common pattern for personal blogs (drives traffic to the real page), but if you ever want full-text feeds, you'd need to: (a) `render(entry)` each post at build time, (b) serialize the result to HTML string (non-trivial — `render` returns a component, not a string), (c) strip interactive islands and MDX components that don't make sense in a feed reader (CodeBlock copy button, Callout variant colors, etc.), and (d) pass the HTML as `content: htmlString` on the item. Skip until there's a real reason — the summary feed is universally acceptable.

33. **Drafts excluded from RSS even in dev (Task 18).** The endpoint uses `filterPublished` which already inherits the Task 6 behavior of hiding drafts unconditionally (follow-up #3). So `astro dev` will NOT serve draft posts in the feed, even though spec §4.4 says drafts should be visible in dev. This is NOT a Task 18 bug — it's the same upstream concern from Task 6. When follow-up #3 is fixed (add `{ includeDrafts }` or `import.meta.env.DEV` bypass), the RSS endpoint automatically inherits the fix with no change — both `filterPublished` call sites (the RSS feed and the blog index/slug pages) should get the same dev-visibility behavior.

34. **RSS autodiscovery links are locale-agnostic (Task 18).** Both `<link rel="alternate" type="application/rss+xml">` tags render on every page regardless of `locale` prop — ES users get both ES and EN feed links in their `<head>`, and vice versa. This is intentional: feed readers that do auto-discovery will surface both options to the user, and search engines can index both feeds from any page. If a future design decision wants to show ONLY the current-locale feed (e.g. to match per-page `hreflang` discipline from Task 20), swap the unconditional tags for a `{locale === 'es' ? ... : ...}` conditional in `Layout.astro`. Leaving as-is — more discoverable and cheap (2 extra lines of HTML per page).

35. **OG subtitle overflow risk (Task 19).** The subtitle `<div>` at `src/pages/og/[...slug].png.ts:230-238` has no `overflow: hidden` / line-clamp / max-lines. Blog `description` schema allows 50-200 chars; at 30px / `line-height: 1.35` in the 1040px content column, a 200-char Spanish string wraps to 4-5 lines and can bump into the footer. Empty collections mask the issue today. **Action:** add `overflow: 'hidden'` + a line-clamp strategy (or shrink to 26px) **BEFORE Task 21-23 seed real content** — DA explicitly flagged this timing.

36. **OG `og:image:alt` is formulaic (Task 19).** Layout emits `\`Cover image for: ${title}\`` / `\`Imagen de portada para: ${title}\`` — a copy of the title, NOT a description of the rendered PNG. Screen readers reading shared links on Twitter/Slack/LinkedIn get the title twice. **Action:** consider replacing with something that describes the IMAGE content (e.g. `\`${title} — Facundo Pascale, senior software architect\``) or wire from a new optional `ogImageAlt` frontmatter field.

37. **OG `og:type="article"` only for blog entries (Task 19).** Work pages get `website`. Work case studies are arguably articles too under OpenGraph semantics. Stylistic — OG spec allows either, and `website` is not invalid. Revisit if Facebook/LinkedIn previews render sub-optimally for work entries once seeded.

38. **OG slug Unicode round-trip unverified (Task 19).** `buildOgUrl` uses `new URL` which percent-encodes, but `params.slug` in `getStaticPaths` is raw UTF-8. If a post ever lands with `id: 'es/año-nuevo.mdx'`, the emitted file would be `dist/og/blog/es/año-nuevo.png` while the meta tag points to `%C3%B1`. Astro's router may normalize, but untestable with zero content. **Action:** Task 21-23 seed an ES post with a tilde/ñ in the slug and verify both the file name and meta URL resolve.

39. **OG subpath site stripping (Task 19).** `new URL('/og/${slug}.png', site)` is absolute — if `site` were ever changed to `https://example.com/subdir/`, the `/subdir/` prefix would be stripped. Today site is root-hosted so no impact. **Action:** only if the site ever moves to a subpath.

40. **Astro content-collection stale cache hazard (project-wide, surfaced by Tasks 17 round 2 and 19).** Deleted MDX fixtures remain in `node_modules/.astro/data-store.json` until `pnpm build` is run cleanly OR the cache is manually cleared. Past symptom: `UnknownContentCollectionError: Could not parse the entry 'en/callout-da-fixture'`. **Fix when encountered:** `rm -rf node_modules/.astro .astro && pnpm build`. **Permanent fix:** consider adding a `clean:astro` script to `package.json` and running it automatically in `prebuild`. Not blocking — just a paper cut for QA/DA agents creating temporary MDX fixtures.

41. **Sitemap cannot pair cross-slug URLs; HTML hreflang tags are the only signal for them (Task 20 round 2).** `@astrojs/sitemap`'s `i18n` option pairs URLs that share the same path across locales (e.g. `/en/blog/` ↔ `/es/blog/`). Pages whose slugs differ per locale — `/en/about/ ↔ /es/sobre-mi/`, `/en/work/ ↔ /es/trabajo/`, `/en/contact/ ↔ /es/contacto/` — will NOT get `<xhtml:link rel="alternate">` entries in `sitemap-0.xml`. For those pages the `<link rel="alternate" hreflang="...">` tags emitted by `Layout.astro` (via `computeHreflangPair` in `src/lib/hreflang.ts` + the `PATHS` map in `src/lib/i18n.ts`) are the ONLY hreflang signal Google sees. This is by design — the `PATHS` map is the single source of truth, and the Layout tags use it directly. If future tooling ever wants to close the sitemap gap, the path is `serialize()` callback on `@astrojs/sitemap` that injects `<xhtml:link>` entries manually by re-reading `PATHS`. Not blocking — Google explicitly accepts page-level hreflang as equivalent to sitemap hreflang.

42. **`x-default` always points at the ES home on every page (Task 20).** `hreflang.ts:84` uses `X_DEFAULT_PATH = localizedPath('home', DEFAULT_LOCALE)` which is `/es/`. For deep pages like `/en/about/`, Google sees `x-default → /es/` (the homepage) rather than the current page's ES sibling. Google permits homepage-as-x-default so both Round 1 and Round 2 DAs accepted it, but some SEO guides recommend emitting a per-page x-default pointing at the current page's default-locale sibling. If SEO audits flag this, the fix is to compute x-default inside `computeHreflangPair` as whichever hreflang points to DEFAULT_LOCALE — a 2-line change.

43. **404 client-side language swap only mutates visible text + `<html lang>` + `<title>` (Task 20).** The `is:inline` script in `src/pages/404.astro` does not update `<meta name="description">`, `og:title`, `og:description`, `og:locale`, or `twitter:*` tags — those stay in the default ES locale even when an EN user sees the EN visible copy. Low-impact: 404 pages are rarely shared on social, and `<title>` + `<html lang>` are what screen readers and browser tabs use. Non-blocking, but asymmetric. If a future task wants full EN consistency, the swap script would need to also mutate the head tags.

44. **404 canonical is a self-reference to `/404/` (Task 20).** Layout emits `<link rel="canonical">` on every page including the 404, which produces `https://facundopascale.dev/404/` as the canonical URL on the error page. Canonicals on error pages are pointless and slightly confusing for crawlers. Cosmetic only — if it ever matters, add a `noCanonical` prop to Layout and set it on `src/pages/404.astro`.

45. **`findTranslation` N+1 on every Layout render with collection entries (Tasks 14 + 20).** Layout calls `getCollection('blog')` or `getCollection('work')` via `findTranslation` once per slug page render to resolve the hreflang sibling. Empty collections make it zero-cost today. Under Astro's static build, each HTML page is rendered independently, so a blog index with N posts re-loads the blog collection N+1 times. Acceptable for < 100 posts; beyond that, memoize the collections at module level in `src/lib/translations.ts`.

46. **RSS item `<link>` tags still lack trailing slashes (Task 18, surfaced by Task 20).** `src/pages/[locale]/rss.xml.ts` constructs item links as `\`/${loc}/blog/${slug}\`` with no trailing slash. `@astrojs/rss` v4's `createCanonicalURL` adds the slash during serialization, so the FINAL feed XML does have the slash — but the source code string doesn't match the Task 20 canonical convention. Pre-existing, carry-over from Task 18. Non-blocking because the output is correct; flag only if someone changes the RSS link construction.

---

## User Rules and Preferences (from CLAUDE.md and in-session decisions)

- **Never build after changes.** (Global rule from `~/.claude/CLAUDE.md`.) QA and Devil's Advocate agents MAY run `pnpm build` during verification; the implementer MAY run it once at the end of a task. Don't waste builds.
- **Never use cat/grep/find/sed/ls**. Use `bat`/`rg`/`fd`/`sd`/`eza` via the Bash tool.
- **Never commit with AI attribution.** Use conventional commits format.
- **When asking a question, stop and wait.** Don't continue and assume answers.
- **Never agree without verification.** If a claim seems off, say "dejame verificar" and check code/docs before responding.
- **Rioplatense Spanish when the user writes in Spanish**, English when he writes in English. Direct, no-BS tone.
- **`main` branch is OK for all 27 tasks** (explicit user approval for this project).
- **Devil's Advocate is the strict judge.** No controller override on DA rejections.
- **Full pipeline on all tasks, not a pilot.** User explicitly chose "completo" over "phase 1 pilot".
- **Combined review agent is allowed for small tasks.** Used for Tasks 7, 8, 9, 10, 11, 12.

---

## Pipeline Quick Reference for Next Session

When you pick up with **Task 19** (or the next pending task):

1. **Create/update the task tracking** via `TaskCreate` for visibility (optional, in-session only).
2. **Dispatch the Implementer** with the full Task 13 text from the plan file AND a note about the light-mode accent contrast fix.
3. **Wait for the Implementer's report.** Review their status (DONE / DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT).
4. **Dispatch the Spec Reviewer.** Verify by reading files, not trusting report.
5. **Dispatch the QA agent.** Exercise runtime behavior (dev server, build output HTML, React island behavior for interactive tasks).
6. **Dispatch the Devil's Advocate.** Biased toward rejection. If it rejects, send specific fix instructions to a new implementer agent, then re-dispatch the DA.
7. **Mark the task complete** only after DA approval.

**Model selection guidance:**
- Implementer for mechanical tasks: standard model (Sonnet default works)
- QA and Spec Review: standard model
- Devil's Advocate and Implementer for integration-heavy tasks: most capable model

**Context watch:** Each full 4-agent pipeline is ~4-7 dispatches. After ~12-15 tasks, controller context fills up. Pause at natural boundaries (end of phase) and create a new handoff doc if you're running low.

---

## Files that matter

- Spec: `docs/superpowers/specs/2026-04-13-personal-site-design.md`
- Plan: `docs/superpowers/plans/2026-04-13-personal-site.md`
- This handoff: `docs/superpowers/HANDOFF.md`
- Design tokens: `src/styles/global.css`
- i18n helpers: `src/lib/i18n.ts`
- Content utilities: `src/lib/content.ts`, `src/lib/translations.ts`, `src/lib/reading-time.ts`
- Content schemas: `src/content.config.ts`
- Astro config: `astro.config.ts` (NOT `.mjs`)
- Layout: `src/components/Layout.astro` (contains the only `<main id="main">`)
- Components ready for reuse: `Header`, `Footer`, `PostCard`, `ProjectCard`, `PostMeta`, `Toc`

---

## When you're done with all 27 tasks

1. Update this HANDOFF.md with the final status.
2. Update `~/.claude/projects/-Users-facundo-Desktop-Projects-personal/memory/MEMORY.md` to reflect completion.
3. Ask the user to test the deployed site end-to-end.
4. Celebrate. Then shut up and wait for the next task.
