# Project case studies and covers

## Objective

Every client project and own product gets a UR POV-style cover and a full case study (es/en) with internal images, like Estudialo. FitCoach is retired in favor of Elevate.

## Problem / why

Covers are inconsistent (plain SVGs vs the UR POV cover) and most showcase projects have no case study. FitCoach no longer exists as a product; it became Elevate (Gym, Coach, Nutri).

## Scope

- Projects: Anchor, Estudialo, Festival PRO, Happiness To Go, HFlow, Horus, Investamind, UR POV, Stagionaly, Orbys, Elevate.
- Reusable cover template (1600x1000, brand gradient, logo tile, title, tagline, pill, phone-framed screenshot).
- Case study pages render an internal-image gallery.
- FitCoach case study -> Elevate; `/work/fitcoach` redirects.

## Constraints

- Client screenshots never show real user data: apps are booted against local backends with invented seed data (HTG: local Supabase via `supabase start`; HFlow: local Postgres). Never point at client production.
- Client repos are not committed to; local-only artifacts are cleaned up.
- Covers of client projects live in `public.projects` (shared with capsulecodes.com): changing them changes the agency site too.
- Figma: accessible files are Elevate Gym/Coach/Nutri, FestivalPro, Investamind, Stagionaly, Orbys. UR POV and Anchor files need edit access (pending from the user).
- TDD: strict, Vitest `pnpm test`, Playwright `pnpm test:e2e` (source: project config + session).

## Tasks

- [x] T1 Capture assets: HFlow screens (local Postgres + fake data) — delegated
  - Evidence: 11 PNGs in scratchpad `captures/hflow/` (1440x900@2x, incl. dark dashboard); local Postgres + neon-http-proxy + local Redis/SRH containers (`hflow-demo-*`, stopped, kept for retakes); fake workspace "Northwind Studio"; client repo untouched. UI is Spanish-only (hardcoded). No marketing page (`/` redirects to sign-in). Brand: monochrome, mark = black rounded square with three bars (`apps/frontend/src/public/logo.png`).
- [x] T2 Capture assets: Happiness To Go screens (local Supabase + fake data) — delegated
  - Evidence: 13 PNGs in scratchpad `captures/htg/` (phone 390x844@3x + landing 1440x900@2x); zero requests to `*.supabase.co`; client repo untouched (pre-existing deletions only). Local stack `htg_demo_local` (ports 56321/56322) stopped with volume kept for retakes.
- [x] T3 Cover template in repo (UR POV recipe) + gallery support in case-study pages — delegated (writer trigger: 2+ non-trivial files)
  - Commits: `ee5dbad` feat(work): add reusable project cover generator; gallery commit = the one that carries this doc update (`git log --grep "case-study galleries"`).
  - Cover generator: `scripts/covers/` (config.ts, html.ts, projects.ts, render.ts, assets/ur-pov/), `pnpm covers [slug]` -> `public/images/work/<slug>/cover.webp` (1600x1000). Frames: `phone` (1 or 2 overlapping) and `browser` (16:10). ur-pov render visually matches the scratchpad cover. Add new projects in `scripts/covers/projects.ts`.
  - Gallery: `gallery` is now `{ src, alt, caption?, kind?: phone|desktop, width?, height? }[]`; `src/lib/gallery.ts` + `src/components/Gallery.astro` rendered after the body in both locales. Estudialo (es/en) carries one gallery entry: its existing `estudialo-ai.svg` (no real screenshots exist yet) -- replace in T5.
  - Checks: `pnpm test` 281 passed; `pnpm check` 0 errors; `pnpm lint` clean; `pnpm build` ok; `pnpm test:e2e` 63 passed (incl. tests/e2e/gallery.spec.ts); `pnpm covers ur-pov` ok. TDD: unit RED observed for covers and gallery; gallery e2e was written alongside the implementation (RED not separately observed).
  - Review: assessed medium (`slice_budget_reached`, package.json config change); consent granted; reliability lens approved; acknowledged (lineage `review-f55e78f25ebdc1b8`). Reviewed boundary advances to `2002d1c`.
- [x] T4 Elevate case study replaces FitCoach (+ redirect, title matching) — delegated (writer trigger: 2+ non-trivial files)
  - Commits: `feat(work): replace FitCoach with the Elevate case study` (`git log --grep "replace FitCoach"`).
  - Case study: `src/content/work/{es,en}/elevate.mdx` (translationId `elevate`, live link byelevate.app, 7-image gallery: coach desktop + 2 mobile, gym desktop + mobile, nutri desktop + mobile, in `public/images/work/elevate/*.webp`); status stated as web live, apps pre-release. Cover `public/images/work/elevate/cover.webp` via `pnpm covers elevate` (navy gradient, 2 phones). Old fitcoach.mdx/svg removed; blog posts relinked to Elevate.
  - Redirects: `redirects` in `astro.config.ts` (301) for `/en/work/fitcoach`, `/es/trabajo/fitcoach`, `/es/work/fitcoach`; emitted into `.vercel/output/config.json` (checked). `serve` in e2e ignores Vercel routes, so covered by unit test `tests/unit/redirects.test.ts` (RED observed first, then GREEN).
  - Matching: product "Elevate" already prefix-matches the case study; unit tests added for "Elevate Coach"/"Elevate - ..." variants. Elevate is a product, not a showcase row, so it stays in the case-studies section.
  - Checks: `pnpm test` 288 passed; `pnpm check` 0 errors; `pnpm lint` clean; `pnpm build` ok; `pnpm test:e2e` 63 passed; `pnpm covers elevate` ok.
  - Review: assessed medium (`slice_budget_reached`, executable change in astro.config.ts); consent granted; reliability lens approved; acknowledged (lineage `review-cfb9f06df43d4c3e`). Reviewed boundary advances to `a961c19`.
  - Follow-ups: offline-first blog posts still describe FitCoach-era sync details under the Elevate name.
- [ ] T5 Case studies + covers for remaining projects (one work unit per project)
  - [x] HFlow — delegated (writer trigger: 2+ non-trivial files)
    - Commit: `git log --grep "HFlow case study"`. `src/content/work/{es,en}/hflow.mdx`, 7 desktop WebP gallery images (1920x1200) in `public/images/work/hflow/`, cover via `pnpm covers hflow` (browser frame, dark teal gradient, dashboard crop). No public link (private product).
    - Cover generator: title now accepts `\n` for a line break (unit RED observed, then GREEN); used by HTG.
    - capsulecodes.com: row `79f2ba8b-f03c-4788-b7a9-cf314da242e3` ("HFlow - Enterprise Payroll Platform") now has the new cover first in `images` and as `image` (`projects/<id>/cover-1461808e.webp`, public URL 200); 10 existing images kept (sortOrder shifted +1). Backup of the previous row: scratchpad `db-backup/hflow.json`.
    - Title match: DB title prefix-matches case study "HFlow".
  - [x] Happiness To Go — delegated (writer trigger: 2+ non-trivial files)
    - Commit: `git log --grep "Happiness To Go case study"`. `src/content/work/{es,en}/happiness-to-go.mdx`, 7 phone + 1 desktop (landing) WebP gallery images in `public/images/work/happiness-to-go/` (phones 780x1688, landing 1920x1200), cover via `pnpm covers happiness-to-go` (two phones, sage-to-green gradient, `Happiness\nTo Go` title). No links: the landing has no confirmed public URL in the client repo.
    - capsulecodes.com: row `ebf137d8-df0a-41f8-befb-25878643a952` ("Happiness To Go - Wellness & Habits App") now has the new cover first in `images` and as `image` (`projects/<id>/cover-a7432a81.webp`, public URL 200); 7 existing images kept (sortOrder shifted +1). Backup of the previous row: scratchpad `db-backup/happiness-to-go.json`.
    - Title match: DB title prefix-matches case study "Happiness To Go".
  - Review (HFlow + HTG slice): assessed medium (`slice_budget_reached`); consent granted; reliability lens approved; acknowledged (lineage `review-e57519f866c79cb9`). Reviewed boundary advances to `8d2b237`.
  - [x] Investamind — delegated (writer trigger: 2+ non-trivial files)
    - Commit: `git log --grep "Investamind case study"`. `src/content/work/{es,en}/investamind.mdx`, 5 phone WebP gallery images (780x1661, rounded-corner mask applied to remove the bezel's purple corner fill) in `public/images/work/investamind/`, cover via `pnpm covers investamind` (two phones, #6C63FF gradient). Public link: App Store `id6757620060` (id found in the client's `eas.json`). No docs/PDF or pricing material used; the premium screen shows the in-app demo plan only.
    - capsulecodes.com: row `c8f18f1d-3509-44c7-b411-42e202fdfbac` ("Investamind") now has the new cover first in `images` and as `image` (`projects/<id>/cover-ee56177d.webp`, public URL 200); 8 existing images kept (sortOrder shifted +1). Backup: scratchpad `db-backup/investamind.json`.
    - Title match: DB title "Investamind" = case study "Investamind".
  - [x] Festival Pro (rewrite of the existing case study) — delegated (writer trigger: 2+ non-trivial files)
    - Commit: `git log --grep "Festival Pro case study"`. `festivalpro.mdx` es/en rewritten to the 4-section depth (same slug and translationId, neutral Spanish instead of voseo), 5 phone WebP gallery images (780x1736) in `public/images/work/festivalpro/`, cover via `pnpm covers festivalpro` (dark and light variant side by side). Old `festivalpro.svg` removed. No artist names in alt text or body. `tests/e2e/gallery.spec.ts`: the "no gallery" check pointed at festivalpro, which now has one; it now checks `/en/work/` (every case study has a gallery).
    - capsulecodes.com: row `9d8054fa-887d-4b17-a294-585dd32b59ff` ("Festival PRO") new cover first and as `image` (`projects/<id>/cover-d5918617.webp`, URL 200); 7 existing images kept (+1). Backup: scratchpad `db-backup/festivalpro.json`.
    - Title match: "Festival PRO" prefix-matches "Festival Pro" (normalized).
  - [x] Stagionaly — delegated (writer trigger: 2+ non-trivial files)
    - Commit: `git log --grep "Stagionaly case study"`. `stagionaly.mdx` es/en, 5 real-device phone WebP images (780x1695: offers, offer detail, chat, applications, notifications) in `public/images/work/stagionaly/`, cover via `pnpm covers stagionaly` (rosso/ink gradient). Live link web only. The "delivery ledger" in the research summary does not exist in the repo; the case study describes the push webhook, preferences and the single-owner token fix instead.
    - Database: there is no cover to replace. `public.products` (not `personal.products`) has no logo/image column in use and the site renders no product cover; `public.projects` has no Stagionaly row. Nothing changed in the database. Product title "Stagionaly" = case study title.
  - [x] Orbys — delegated (writer trigger: 2+ non-trivial files)
    - Commit: `git log --grep "Orbys case study"`. `orbys.mdx` es/en, 6 desktop WebP images (1440 wide) in `public/images/work/orbys/` (landing + five live "as-is" screens), cover via `pnpm covers orbys` (browser frame, red gradient). Live link `https://www.getorbys.com`.
    - Shipped vs proposal: the "redesign" frames are NOT used. The platform redesign shipped in June 2026 (PR #29 `feat/platform-redesign`), but the frames include screens with no matching code found in the repo (client portal, integrations with QuickBooks/Zapier, roles matrix, onboarding checklist), so they are treated as proposals and omitted.
    - Database: same as Stagionaly, no product cover exists and no `public.projects` row, nothing changed.

## Delivery

Strategy: ask-on-risk; chain strategy cached from stage 2–4: feature-branch-chain, merged top-down.

## Progress / evidence

- Branch `feat/project-case-studies` created from main 36826ed.

## Next step

T1/T2 asset capture.
