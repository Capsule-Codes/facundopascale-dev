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
- [ ] T2.2 Build-time data layer `src/lib/site-data.ts`: typed fetchers for showcase, products, log
      (published content_items + blog posts), site settings; locale resolution of `translations`; fixture
      fallback when Supabase env is absent (CI). Unit tests — route: delegated writer
- [ ] T2.3 Blueprint design tokens (paper/ink/cyanotype/accent, light default + ink dark), Newsreader +
      JetBrains Mono, Shiki bridge — route: delegated writer
- [ ] T2.4 Home redesign (Lámina 00 hero + planta, A agency projects + testimonial, B products, C build
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
- Delivery forecast stage 2: ~1100 authored lines → over budget, chain strategy pending (user).

## Next step

T2.2 — data layer.
