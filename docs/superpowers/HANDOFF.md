# HANDOFF — facundopascale-dev

**Last updated:** 2026-04-14
**Current commit:** `(Task 16 pending commit — update after)`
**Branch:** `main`
**Working directory:** `/Users/facundo/Desktop/Projects/personal/facundopascale-dev`

## For the next Claude session

You are continuing execution of the facundopascale-dev implementation plan. **16 of 27 tasks** are done. This document has everything you need to pick up exactly where the last session stopped.

**How to resume:**

1. Read this file (you're doing it).
2. Read `docs/superpowers/specs/2026-04-13-personal-site-design.md` (the approved spec).
3. Read `docs/superpowers/plans/2026-04-13-personal-site.md` (the 27-task plan). **Warning: the plan is static and does NOT reflect the small deviations listed in "Known deviations" below.**
4. Run `git log --oneline` to confirm state matches the commits listed here.
5. Resume with **Task 16** using the 4-agent pipeline described below.

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

## Completed Tasks (16 / 27)

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
| 16 | Shiki dual-theme config + CodeBlock wrapper | `(pending)` | Dual themes via `themes: { light: 'vitesse-light', dark: 'vesper' }` + `defaultColor: false` in `astro.config.ts`. Every Shiki token carries `--shiki-light`/`--shiki-dark` vars; the visible color is chosen by a CSS bridge in `src/styles/global.css` keyed on `:root[data-theme='light']` (dark is the default). `src/components/mdx/CodeBlock.astro` is a **manual opt-in wrapper** (not an `mdxComponents` auto-override — that's deferred to Task 17) with a `lang` label + a copy-to-clipboard button. Uses `text-muted` (NOT `text-dim`, respecting Open Concern #19) and the project-standard `focus-visible:outline-*-[var(--color-accent)]` focus ring. Button reveals on both `group-hover:opacity-100` and `focus-visible:opacity-100`/`group-focus-within:opacity-100` so keyboard users can find it. Copy script is a plain `<script>` (deduped & bundled as `<script type="module">` inline by Astro) with `instanceof HTMLButtonElement` narrowing. Smoke-tested with a temp MDX page — inspected dist HTML to confirm: dual CSS vars on tokens, correct CodeBlock DOM, copy script inlined, multi-instance on the same page OK. Smoke test files removed before commit. `aria-label="Copy code"` hardcoded English per the same precedent as ThemeToggle/LanguageSwitcher — see new follow-up #27. |

### Phase 3 (cont.) — Contact form + Actions

| # | Task | Commits | Notes |
|---|---|---|---|
| 15 | Contact form + Astro Actions + Resend + Vercel adapter | `422939b` → `92dc4b2` → `13aebb6` | **3 commits. DA rejected TWICE** on WCAG 1.4.3 (both misses were contrast violations in `ContactForm.tsx`). Round 1: `text-dim` on 12px form labels gave 2.67:1 dark / 2.49:1 light (FAIL AA 4.5:1). Round 2 fix: one-line `text-dim` → `text-muted` (8.27:1 / 7.33:1). Round 2 DA approved the label fix but self-caught a round-1 miss — `text-red-400` on light bg ≈ 2.91:1 and `text-yellow-400` on light bg ≈ 1.56:1 (practically invisible). Round 3 fix: `text-red-700 dark:text-red-400` + `text-yellow-700 dark:text-yellow-400` (6.67:1 / 6.59:1 and 5.16:1 / 12.28:1 — all AA). Controller applied both fixes directly as one-liners; DA verified compiled CSS `.dark\:text-red-400:where([data-theme=dark],[data-theme=dark] *)` correctly targets the `@custom-variant dark` from Task 13, NOT `prefers-color-scheme`. **Key architecture changes:** added `@astrojs/vercel@10.0.4` adapter (`output: 'static'` + adapter = hybrid, actions dynamic, pages prerendered); Astro Action `sendContact` (`src/actions/index.ts`) uses `astro/zod` (NOT deprecated `astro:schema`), `z.email()` (Zod 4 idiom), `createRateLimiter` extracted to `src/lib/rate-limit.ts` with clock injection for testability (6 unit tests in `tests/unit/rate-limit.test.ts`, 21 total). ContactForm island uses `SubmitEvent<HTMLFormElement>` (React 19 deprecates `FormEvent`), captures `formEl = e.currentTarget` BEFORE `await` (React nulls synthetic event targets post-handler), parses `x-forwarded-for` chain (first IP only), env guard for missing `RESEND_API_KEY`/`CONTACT_EMAIL_TO`. Accessibility: `htmlFor`/`id` pairs, honeypot `aria-hidden="true" tabIndex={-1}`, status messages in `role="status" aria-live="polite"` container with `min-h-[1.5rem]` to avoid CLS, focus-visible outlines on inputs + button. Contact pages use `<div>` wrapper (Layout owns `<main>`). Rate limit is per-instance on serverless (documented tradeoff, spec §13.4 defers Upstash). `from: 'contact@facundopascale.dev'` hardcoded; domain not yet purchased/verified — runtime send will 403 until Task 27 provisions DNS. |

**Current state:** 29 commits on main (includes the 2 pre-work commits for spec + plan). `pnpm check`, `pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm test` all green. 13 pages built. Working tree clean.

---

## Pending Tasks (12 / 27)

### Phase 4 — MDX Content Features

- **Task 17: Callout MDX component** — info/warning/success/danger variants. Register via `mdxComponents` and `@/` path alias in `tsconfig.json`.
- **Task 18: RSS feeds per locale** — `src/pages/[locale]/rss.xml.ts` using `@astrojs/rss`.
- **Task 19: OG image generation via Satori** — dynamic `/og/[...slug].png.ts` endpoint using `@vercel/og`. Needs install.
- **Task 20: Sitemap i18n + robots + 404 + hreflang** — sitemap config update, `public/robots.txt`, `src/pages/404.astro`, hreflang alternates in Layout `<head>`.

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

27. **`CodeBlock.astro` `aria-label="Copy code"` hardcoded English (Task 16).** Consistent with ThemeToggle (#11/#17) and LanguageSwitcher (#16) hardcoded-EN aria precedent. Add to the next Header-level i18n pass that threads a locale dictionary into the islands and component slot props. A second string also needs locale threading: the transient `copied!` toast text on successful clipboard write.

28. **`CodeBlock` is manual opt-in only (Task 16).** Authors must explicitly wrap a fenced block with `<CodeBlock lang="...">\`\`\`lang\n...\`\`\`</CodeBlock>` to get the lang label + copy button. Plain fenced blocks still get Shiki highlighting via the global `mdx()` `shikiConfig`, but no copy affordance. Task 17 plans to wire `mdxComponents` — if that task ever auto-overrides `<pre>` with CodeBlock, the `lang` will need to be parsed out of the child `<code>`'s `className="language-xxx"` (Astro's MDX integration does not forward `data-language` or `lang` to replaced `<pre>` components out of the box). Keep manual opt-in as the default and only add auto-override if a real need surfaces.

29. **Shiki dual-theme CSS bridge lives in `src/styles/global.css` (Task 16).** `astro.config.ts` sets `shikiConfig: { themes: { light: 'vitesse-light', dark: 'vesper' }, defaultColor: false, wrap: true }`. Every token carries both `--shiki-light` and `--shiki-dark` CSS vars with NO direct color, and a pair of CSS rules under the `/* Shiki dual-theme bridge */` comment picks the right variable based on `:root[data-theme='light']` (falls through to dark as the default). This ties into the project's manual `data-theme` system instead of raw `prefers-color-scheme`. If someone ever replaces the themes, verify both still read cleanly on `#0c0a09` (dark bg) and `#fafaf9` (light bg), and watch for vesper's own background `#101010` bleeding through the page `<pre>` — currently fine because `--shiki-dark-bg` is scoped to `.shiki` elements only. Task 19 (OG images) and Task 21-23 (seed content with code blocks) are the next consumers.

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

When you pick up with Task 13:

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
