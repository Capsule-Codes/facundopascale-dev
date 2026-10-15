# Projects showcase redesign

## Objective

Adapt the fp projects UI to the structure of capsulecodes.com while keeping fp's paper/ink visual language (square corners, 1.5px ink rules, mono metadata, accent orange, Newsreader + JetBrains Mono).

## Problem / why

The user finds fp's projects section very different from capsule's and asked to adapt both the home section and the index cards ("las dos").

## Scope

- Home projects section (`src/pages/[locale]/index.astro`): replace the 3-card grid with a master/detail showcase — numbered list (01, 02…) on the left (horizontal scroller on mobile); on the right the selected project's screenshots in a device frame (phone or browser by orientation), title, summary, up to 4 tech chips and "Ver proyecto" link. Plus a "Ver todos" link to the work index. Works without JS (first project shown; list items link to detail as fallback), progressive enhancement via a small script.
- Work index cards (`src/components/ShowcaseCard.astro`, used by `WorkList.astro`): whole card is one link to the case study (or primary external link when no case study), 16:10 image (portrait images contained over blurred copy), category chip, title, subtitle/summary clamp, "Ver proyecto →" CTA at the bottom; grid 1 / 2 / 3 columns.

## Constraints

- Keep fp tokens; no capsule dark/rounded styling. es/en parity, voseo in es UI copy.
- Accessible: list is buttons with `aria-pressed`/tablist semantics, keyboard operable; reduced motion respected.
- No new data fields required.

## Tasks

- [x] T1 — Index cards redesign (route: delegated writer, 2+ non-trivial files). Commit `dae73a2`. RED observed (`tests/unit/showcase.test.ts`, module missing) → GREEN 9/9; `resolveProjectHref`, `deviceFrameFor`, `showcaseScreens` in `src/lib/showcase.ts`. e2e `work.spec.ts`: card is a single link to its case study / website.
- [x] T2 — Home master/detail showcase (route: delegated writer, same writer). Commit `51bf306`. RED observed (`nextTabIndex is not a function`, 5 failing) → GREEN 14/14. New `src/components/ProjectsShowcase.astro` (tablist + server-rendered panels, phone/browser ink frames, step buttons). e2e `home.spec.ts`: tablist, click + ArrowRight switching (wraps), "see all projects" link.

## Checks

- `pnpm test` (vitest), `pnpm build`, `pnpm test:e2e` (Playwright) — e2e updated for new markup.
- TDD: strict (global). Pure helpers (e.g. selection/index logic, link resolution) get unit tests RED first.

## Delivery

- Strategy: ask-on-risk. Forecast ~350–450 authored lines.

## Progress

- Branch `feat/projects-showcase-redesign`.
- TDD: strict (global config), runner vitest (`pnpm test`).
- Evidence (after T2): `pnpm test` 336 passed; `pnpm build` complete; `pnpm test:e2e` 106 passed; `pnpm check` 0 errors.
- Notes: no-JS fallback keeps the first panel visible with focusable tabs (list items do not link out). Fixtures carry no images, so screenshots show the blueprint placeholders; the phone frame was checked by temporarily marking a fixture portrait (reverted).
- Next step: native review / PR decision (not pushed).
- RDD review `20db8f4..029144b` (medium, consent granted): reliability lens approved, acknowledged (lineage `review-6d10826c13632a06`). Advisory R3-empty-link-fallback fixed in `13e91e5` (RED→GREEN, 337 tests).
- PR #31 open, CI green (checks + Vercel). Preview is SSO-protected; real-image visual check pending.
