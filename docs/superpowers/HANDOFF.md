# HANDOFF — facundopascale-dev

**Last updated:** 2026-04-13
**Current commit:** `b78ac94`
**Branch:** `main`
**Working directory:** `/Users/facundo/Desktop/Projects/personal/facundopascale-dev`

## For the next Claude session

You are continuing execution of the facundopascale-dev implementation plan. The previous session completed **12 of 27 tasks** before context got full. This document has everything you need to pick up exactly where the last session stopped.

**How to resume:**

1. Read this file (you're doing it).
2. Read `docs/superpowers/specs/2026-04-13-personal-site-design.md` (the approved spec).
3. Read `docs/superpowers/plans/2026-04-13-personal-site.md` (the 27-task plan). **Warning: the plan is static and does NOT reflect the small deviations listed in "Known deviations" below.**
4. Run `git log --oneline` to confirm state matches the commits listed here.
5. Resume with **Task 13** using the 4-agent pipeline described below.

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

## Completed Tasks (12 / 27)

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

**Current state:** 21 commits on main (includes the 2 pre-work commits for spec + plan). `pnpm check`, `pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm test` all green. 11 pages built. Working tree clean.

---

## Pending Tasks (15 / 27)

### Phase 3 (remaining) — React Islands

- **Task 13: Theme toggle** (`ThemeToggle.tsx`). React island with anti-FOUC inline head script, localStorage persistence, accessible button. **⚠ CRITICAL: must also fix the light-mode accent contrast issue.** Currently `#f97316` on `#fafaf9` = 2.03:1, fails WCAG AA. Use a darker orange (e.g. `#c2410e` / orange-700) in the `:root[data-theme='light']` override in `src/styles/global.css`.

- **Task 14: Language switcher** (`LanguageSwitcher.tsx`). React island. Uses `findTranslation` (from Task 7) to find the sibling doc. Requires threading `currentDocId` + `currentCollection` props through `Layout.astro` → `Header.astro`. Includes fallback toast when sibling doesn't exist.

- **Task 15: Contact form** (`ContactForm.tsx` + Astro Action + Resend). Most complex React island. Uses Astro Actions API (Astro 6 native), rate limiting via in-memory Map, honeypot spam guard. Requires `RESEND_API_KEY` + `CONTACT_EMAIL_TO` env vars. May require adding `@astrojs/vercel` adapter to support server Actions.

### Phase 4 — MDX Content Features

- **Task 16: Shiki config + CodeBlock** — custom theme (vesper or similar warm-dark), CodeBlock wrapper with copy-to-clipboard button.
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

1. **Light-mode accent contrast (Task 13 MUST FIX).** `#f97316` on `#fafaf9` is 2.03:1, fails WCAG AA. In the `:root[data-theme='light']` CSS block, override `--color-accent` to `#c2410e` (orange-700) and `--color-accent-hover` to `#9a3412` (orange-800). Applies to the home CTA button, links, and PostCard/ProjectCard borders.

2. **Prose inverted is hardcoded (Task 13 also fix).** About, Uses, blog post, and case study pages all use `prose-invert`. In light mode, prose should switch to regular `prose` (no invert). Use `prose dark:prose-invert` or a theme-aware variant.

3. **Draft posts invisible in dev** (Task 6 concern, spec §4.4 promise broken). The spec says drafts should appear in `astro dev` but be excluded in production. Current `filterPublished` hides drafts in both. Fix when the user starts using drafts — add an `{ includeDrafts }` option or an `import.meta.env.DEV` bypass.

4. **`readingTime` defensive cast duplication.** Same `(p.data as unknown as { readingTime?: number }).readingTime` pattern exists in `src/pages/[locale]/index.astro` and `src/pages/[locale]/blog/index.astro` and `.../blog/[slug].astro`. If a fourth consumer appears, extract to a helper in `src/lib/content.ts`.

5. **PostCard `<h3>` heading inconsistency.** When PostCard is placed on the blog index page (which has h1 but no h2 section wrapper above the card), there's an h1 → h3 skip. Minor a11y. Consider parameterizing the heading level or always wrapping PostCard in an h2-containing section.

6. **`test:e2e` script was removed in Task 1.** Task 24 must add it back when Playwright config is created: `"test:e2e": "playwright test"`.

7. **`astro.config.ts` `site` is `'https://facundopascale.dev'`.** Domain not yet purchased. No action until the user buys it and connects to Vercel.

8. **`fallbackTitle` no-op ternary** in `src/pages/[locale]/uses/index.astro` (`loc === 'es' ? 'Uses' : 'Uses'`). Will be moot once Task 22 seeds real content. If you're in the file anyway, clean it up.

9. **Toc visual tightness on desktop**. With `max-w-3xl` container + `w-56 + ml-8` float, prose wraps in ~464px. Revisit once Task 23 seeds blog content and you can see a real post.

10. **Plan document has 1 typo-level bug** (line 775 of `docs/superpowers/plans/2026-04-13-personal-site.md`): `entries.filter((e) => !e.data.draft || true)` — the `|| true` makes it a no-op. This was deliberately omitted from the implementation (Task 6) per instructions. Don't re-add it.

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
