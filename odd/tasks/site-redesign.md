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
- [ ] T1.3 Seed featured projects (3) and products (3) — route: inline
- [ ] T2.x (to be detailed when stage 2 starts)

## Progress / evidence

- Branch `feat/site-redesign` created from `main`.
- T1.2 RED: `personal` schema and `public.products` absent (query 2026-10-08).
- T1.2 GREEN: migration `personal_schema` applied to capsule-codes-db; RLS enabled on all 5 tables;
  anon sees only published log items (draft hidden); anon insert into content_items blocked;
  non-admin authenticated insert into products blocked. Security advisors: no findings on new objects
  (pre-existing: mutable search_path on 2 public functions, leaked-password protection off, MFA options).
- Manual step pending (user): add `personal` to Settings → API → Exposed schemas.

## Next step

T1.3 — seed featured projects and products (needs user confirmation of the 3 projects and product statuses).
