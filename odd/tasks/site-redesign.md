# Feature: Site redesign (Blueprint + Build Log) with Supabase content and admin

## Objective

Redesign facundopascale.dev around the "Blueprint + Build Log" brand, backed by Supabase content
(agency projects, products, content calendar) with an `/admin` area and a Resend newsletter.

## Problem / why

Facundo is starting YouTube/Instagram/LinkedIn content as founder and agency owner (Capsule Codes).
The current site is MDX-in-git only: content cannot be planned, scheduled or edited without commits,
and agency projects are duplicated knowledge living in the Capsule Codes database.

## Decisions

- Audience priority: clients hiring the agency > people starting out > devs > founders.
- Positioning: the site sells; content is proof of work ("builder in public").
- Brand: Blueprint + Build Log hybrid. Design canvas: https://claude.ai/artifact/HJfKy4fAxSTuutZcLSm7mS
- Stay on Astro (no Next migration). Admin lives at `/admin` in the same app.
- Data: separate `personal` schema inside Supabase project `capsule-codes-db` (no extra project cost).
  Agency projects are referenced from `public.projects`, never duplicated.
- Products (Stagionaly, Elevate, Orbys) live in a shared table so capsulecodes.com can reuse them.
- Newsletter subscribers live in a Resend Audience (not duplicated in Postgres).
- Hourly rebuild cron is replaced by event-driven rebuilds (Supabase webhook / YouTube WebSub).
- LinkedIn auto-posting is phase 2.

## Scope (stages)

1. Data model + RLS in Supabase, seed featured projects and products.
2. Home redesign in Astro reading Supabase; event-driven rebuild.
3. `/admin` with Supabase Auth: projects, products, content calendar.
4. Newsletter: subscribe form + Resend broadcasts planned from the calendar.
5. Automations: YouTube WebSub into the Build Log; LinkedIn API later.

## Constraints

- ES/EN i18n stays. Blog stays MDX (versioned writing), referenced from the calendar by slug.
- TDD: enabled (session configuration, Strict TDD Mode). Runner: `pnpm test` (Vitest), `pnpm test:e2e` (Playwright).
- Do not modify existing `public.*` agency tables' behavior used by capsulecodes.com.

## Tasks

- [x] T1.1 Propose and approve data model (in conversation) — route: inline (approved 2026-10-08)
- [x] T1.2 Migration: `personal` schema, tables, RLS, versioned in `supabase/migrations/` — route: inline (single SQL file)
- [x] T1.3 Showcase model (list + `highlighted`), seed products and showcase, add Horus Surgical and UR POV
      to `public.projects` (unpublished until screenshots) — route: inline (2 SQL files)
- [x] T1.4 Screenshots: Horus from local run (controlled demo data, no patient data), UR POV from repo
      assets; upload to `images/projects/<id>/`; then set `published=true` (shows on capsulecodes.com too)
- [x] T2.1 View `personal.showcase` (published projects joined with showcase order) — route: inline (1 SQL file)
- [x] T2.2 Build-time data layer `src/lib/site-data.ts`: typed fetchers for showcase, products, log
      (published content_items + blog posts), site settings; locale resolution of `translations`; fixture
      fallback when Supabase env is absent (CI). Unit tests — route: delegated writer
- [x] T2.3 Blueprint design tokens (paper/ink/cyanotype/accent, light default + ink dark), Newsreader +
      JetBrains Mono, Shiki bridge — route: delegated writer
- [x] T2.4 Home redesign (Lámina 00 hero + planta, A agency projects + testimonial, B products, C build
      log, D contact + newsletter placeholder, title-block footer), portrait asset; update home e2e — route: delegated writer
- [ ] T2.5 `/work` + `/trabajo` list all showcase projects from Supabase (MDX case studies kept as detail
      pages) — route: delegated writer
- [ ] T2.6 Replace hourly cron with event-driven rebuild (Supabase DB webhook → Vercel deploy hook);
      needs remote authorization — route: inline

## Progress / evidence

- Branch `feat/site-redesign` created from `main`.
- T1.2 RED: `personal` schema and `public.products` absent (query 2026-10-08).
- T1.2 GREEN: migration `personal_schema` applied to capsule-codes-db; RLS enabled on all 5 tables;
  anon sees only published log items (draft hidden); anon insert into content_items blocked;
  non-admin authenticated insert into products blocked. Security advisors: no findings on new objects
  (pre-existing: mutable search_path on 2 public functions, leaked-password protection off, MFA options).
- T1.2 commit: `355fb85`. RDD assess (base main, committed-only): medium, review_due=false (under_budget, 218 lines) — pending in slice.
- Manual step pending (user): add `personal` to Settings → API → Exposed schemas.
- T1.3 RED: `personal.project_showcase` absent, 0 products, 0 showcase rows.
- T1.3 GREEN: 8 showcase rows (highlighted: Investamind, Festival PRO, Horus Surgical); 3 products live
  (stagionaly.com, byelevate.app — user said elev.app but it does not resolve, code uses byelevate.app —, getorbys.com).
- Rule: the personal site only renders showcase rows whose `public.projects.published` is true.

- T1.4: Horus screenshots from a local stack (Postgres + API + Vite) with synthetic `aurora/demo/seed-demo.sql`
  data, signed in as dev-pool Cognito user `portfolio-demo@example.com` (pool `us-west-2_DOTKk3ewU`,
  tagged Environment=dev; credentials kept outside both repos). Seed membership added in the Horus repo
  (uncommitted, client repo). HIPAA/SOC 2 banner hidden; no real PII in any capture (reviewed visually).
  UR POV cover composed from the app's own logo and splash (onboarding images are low-res stock photos).
- T1.4 RED: both projects had `image = ''`, `images = []`, `published = false`.
- T1.4 GREEN: 4 webp uploaded via Supabase CLI to `images/projects/<id>/` (all 200 image/webp);
  migration `publish_horus_and_urpov` applied; anon reads both as published (Horus 3 images, UR POV 1).
  `show_on_home` left false on capsulecodes.com.

- T2.1 RED: `personal.showcase` → PGRST205 (absent). GREEN: anon REST returns 8 published rows ordered
  highlighted first. `personal` schema exposed in Data API (user, 2026-10-09).
- Stage 2 decisions: PostgREST cannot embed across schemas → view. Build Log merges published
  `content_items` with blog posts. Years-of-experience claims stay out (LinkedIn/CV disagree).
- Delivery forecast stage 2: ~1100 authored lines → over budget. Strategy: ask-on-risk → user chose
  `feature-branch-chain` (2026-10-09): slice PRs target `feat/site-redesign`, one final PR to `main`.

- T2.2 RED: vitest 1 failed file (module absent). GREEN: 58/58 (17 new); check 0 errors; lint clean;
  smoke with real anon key: showcase 8, products 3, content_items 0, settings 1. Env read via
  `import.meta.env.PUBLIC_SUPABASE_URL/ANON_KEY`; fixtures when absent; throw on fetch error when present.
- Slices (feature-branch-chain, tracker `feat/site-redesign` → `main`): #1 `feat/site-redesign-02-data`
  (T2.2, ~806 authored lines, 307 of them tests — single cohesive unit, `size:exception` recommended).

- RDD slice main..d884ef7 (lineage review-21035c8edf66e9f1): consent granted, 1 lens (reliability),
  APPROVED and acknowledged; reviewed boundary → d884ef7. Advisory follow-ups fixed in next commit:
  settings empty-row now throws with env present; fake builder asserts filters/order (60/60 tests).
  Open follow-ups (non-blocking): seed/publish migrations join by non-unique title; storage host
  hard-coded in publish migration; rejected promise stays cached (intended: fail build).

- T2.3: light paper default + ink dark; Newsreader (display and body, as in the reference) + JetBrains
  Mono; Fraunces/Inter removed (OG keeps committed TTFs). Brand orange #E8471C fails AA as text (3.39:1)
  → `--color-accent` #C7380F for text (4.53:1), `--color-accent-brand` for fills/large text. No unit seam
  (CSS only). Checks: test 60/60, check 0 errors, lint clean, build ok, e2e 24/24. Slice #2
  `feat/site-redesign-03-tokens` (child of 02-data).

- T2.4: home rebuilt (Láminas 00/A/B/C/D + title-block footer) on Supabase data; testimonials from
  `public.reviews` (featured: Ricardo Mejia). RED: 11 unit + 12 e2e failing; GREEN: unit 68/68, e2e 32/32,
  check/lint/build ok; real-data build verified visually. Slice #3 `feat/site-redesign-04-home`.
- Open content items (user): `site_settings.email/socials` empty → CTA falls back to contact page;
  showcase summaries empty → cards show long descriptions; footer "Argentina ↔ Italia" and hard-coded
  socials (incl. Twitter) to confirm.
- Security follow-up (pre-existing, capsulecodes.com): `public.reviews` lets any authenticated user
  insert/update/delete. Not changed without user OK.

- RDD slice d884ef7..7e26ada (lineage review-86dabe577176aba0): consent granted, reliability lens,
  APPROVED and acknowledged; boundary → 7e26ada. Advisory follow-ups fixed next commit: theme e2e
  (default/system/stored/toggle; fixed inverted `aria-pressed`), testimonial + log render e2e,
  testimonial date `Date | null`. Unit 71/71, e2e 42/42.

## Next step

T2.5 — /work and /trabajo from Supabase.
