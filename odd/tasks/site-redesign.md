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
- [x] T2.5 `/work` + `/trabajo` list all showcase projects from Supabase (MDX case studies kept as detail
      pages) — route: delegated writer
- [x] T2.6 Event-driven rebuild: DB triggers + pg_cron, Vercel project, deploy hook in Vault, verified end to end — route: inline
- [x] T2.7 Favicon: Blueprint monogram ("FP" Newsreader outlines, paper + cyanotype frame, dark variant) and Apple touch icon — route: inline
- [x] T3.1 Grant admin: dedicated Supabase Auth user (not the shared agency admin) in `personal.admins` — route: inline (1 SQL file)
- [x] T3.2 Auth plumbing: `@supabase/ssr` cookie client, middleware guarding `/admin/*` (on-demand, `prerender = false`),
      login/logout, admin layout, noindex + sitemap exclusion — route: delegated writer
- [x] T3.3 Content calendar: list by status/date, create/edit/delete `personal.content_items` — route: delegated writer
- [x] T3.4 Showcase (highlight, order, summaries) and products (personal fields) editing — route: delegated writer
- [x] T3.5 Site settings (email, socials, bio) editing — route: delegated writer

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

- T2.5: `WorkList` + shared `ShowcaseCard` (home uses it too); MDX case studies matched by normalized title
  prefix (`src/lib/case-studies.ts`), unmatched ones (FitCoach) listed. RED unit + 8 e2e failing; GREEN unit
  79/79, e2e 54/54, check/lint/build ok; real-data screenshot verified. Slice #4 `feat/site-redesign-05-work`.

- RDD slice 7e26ada..d38d323 (lineage review-adacea672ea5b4be): granted, APPROVED, acknowledged; boundary → d38d323.
  Open follow-ups: case-study matching loose for short titles; no e2e for empty showcase.
- T2.6 RED: `personal.request_site_rebuild()` / `publish_due_content()` absent. GREEN (rolled-back txn):
  publish_due_content published 1 due item (published_at set), second run 0, no pg_net request without the
  Vault secret, cron job `personal-publish-due-content` (\*/15) present. Advisors: no findings on new
  functions; revoked anon EXECUTE on `personal.is_admin()` (flagged after exposing `personal`); anon reads
  still 200, anon RPC is_admin → 42501. Repo: removed `vercel.json` cron and `/api/revalidate`; README env
  table updated. check 0 errors, build ok. Remote authorization granted by user (2026-10-09).
- Blocker: no Vercel project for facundopascale.dev (checked personal hobby + CapsuleCodes teams) → no
  deploy hook; Vault secret `facundopascale_deploy_hook` not set yet; PUBLIC*SUPABASE*\* not set in Vercel.

- Vercel (user: CapsuleCodes Pro team, 2026-10-09): project `facundopascale-dev` created and linked
  (prj_fR0WhdOcsKtioX6BZ8L5KwAzrXzX), framework astro, PUBLIC_SUPABASE_URL/ANON_KEY added to production,
  preview and development (anon key as `config`, it is public). `vercel link` appended `.env*` to
  .gitignore → reverted (`.env.local` already ignored; `.env*` would hide `.env.example`).
- Blocked on user: (1) Git connect fails — Vercel GitHub app for CapsuleCodes lacks write access to
  `facupascale/facundopascale-dev` (400); (2) Web Analytics has no documented enable API
  (`features.webAnalytics: false`) → enable in dashboard; code already has `webAnalytics.enabled`.
  Contact form env (RESEND_API_KEY, CONTACT_EMAIL_TO) not set in Vercel.

- Repo transferred (user, 2026-10-09) from `facupascale` to `Capsule-Codes/facundopascale-dev` (public);
  local `origin` updated; Vercel Git connected. Deploy hook `supabase-content` (ref `main`) created and
  stored only in Vault as `facundopascale_deploy_hook`. GREEN: no-op update on `personal.site_settings`
  → pg_net request → production deployment built and Ready. Deployments build `main` until the chain lands.
- Env is Production-only (user: single environment); preview/dev builds fall back to fixtures. Web
  Analytics enabled and RESEND_API_KEY / CONTACT_EMAIL_TO set by user (verified 2026-10-09).

- Delivery (user, 2026-10-09): chain pushed. Tracker draft PR #1 (`feat/site-redesign` → `main`, stage 1);
  slices #2 02-data (`size:exception`), #3 03-tokens, #4 04-home (`size:exception`), #5 05-work,
  #6 06-rebuild, each targeting its parent branch.

- T2.7 (user chose "monograma plano"): RED favicon e2e 2 failed; GREEN e2e 56/56, build/check/lint ok; rendered
  light/dark/32px checked. Commit dff144a, RDD assess medium under_budget (pending in slice). PR #7 (07-favicon → 06-rebuild).

- Stage 2 landed (2026-10-09): chain merged; retarget via `gh pr edit --base` failed silently (Projects classic
  GraphQL error), so #3–#7 merged into parent branches; fixed with #8 (chain head → tracker, verified identical),
  then #1 → `main` (f7271b9). First prod build failed on stale Vercel build cache (`Cannot find module 'tslib'`;
  clean frozen install resolves it) → `vercel deploy --prod --force` Ready; DB-triggered rebuild afterwards Ready.
  facundopascale.dev serves the redesign.

### Stage 3 — `/admin`

- Decisions (user, 2026-10-09): email + password login; a new dedicated admin user (the only existing Auth user
  is the shared capsulecodes.com admin, not reused). Admin user created via Auth Admin API, email confirmed;
  credentials only in `~/.config/facundopascale-dev/admin.env` (600).
- Design: admin routes are on-demand (`prerender = false`) under the static site; every write goes through the
  signed-in user's Supabase client so RLS (`personal.is_admin()`) is the authority; DB triggers rebuild the site.
- Testing: e2e serves static output only, so auth/guard/actions are unit-tested with fakes; end-to-end auth is
  verified against `astro dev` with real Supabase and the admin credentials.
- T3.1 RED: `is_admin()` false for the new user. GREEN: migration `grant_site_admin` applied; new user true,
  agency admin false.
- T3.2 (writer): `@supabase/ssr` 0.12.7; guard/login/cookie adapter as pure functions. RED: 3 new suites failed
  (modules absent). GREEN: unit 102/102, check 0 errors, lint ok, build ok (only `/admin*` on `_render`), e2e 56/56.
  Live smoke (`astro dev` + real Supabase): found Astro i18n returning 404 for unprefixed on-demand pages
  (`/admin/login`) → i18n `routing: 'manual'` with the same options applied in middleware except `/admin`.
  After fix: unauth → login; bad password → generic error; login → /admin; cookie httpOnly + Lax; cross-origin
  POST 403; sign out → login. Static output identical to `main` (file list + root index).
  Open: a signed-in non-admin gets 403 on `/admin/logout` (non-admins are signed out at login, so rare).
- RDD stage 3 range main..0c58a39 (lineage review-f2585cc45d43ed53): high (auth), consent granted, 4 lenses
  (risk/resilience/readability/reliability), APPROVED and acknowledged; reviewed boundary → 0c58a39.
  (An earlier T3.1-only candidate was superseded when the writer's uncommitted files changed the workspace.)
- Correction: T3.2 evidence said `check 0 errors`, but the filtered output hid one error (`fallbackType` missing in
  the manual i18n middleware options). Fixed in 775619d with the previous default (`redirect`); check now 0 errors.
- T3.3 (writer + parent fix): `/admin/content` list with status/channel filters, new/edit/delete (confirm checkbox,
  no dialogs), dashboard counts + next 5 scheduled. RED: new suite failed (module absent). GREEN: unit 131/131,
  check 0 errors, lint ok, build ok, e2e 56/56. Live smoke (real Supabase, `idea` item, deleted afterwards, 0 rows
  left): validation error keeps values; create/update/delete redirects; scheduled date round-trips in local time;
  missing/invalid id → 404. Parent fix: tz offset now taken from the scheduled date at submit (DST), verified
  Europe/Rome −120 (Jul) / −60 (Jan).
  Open: DB/RLS write failures return 500 instead of a form error; relation pickers throw if products/showcase fail.
- RDD 0c58a39..fdd2701 (lineage review-0ed7bcb45e4e71c9): medium, slice_budget_reached, granted, reliability lens,
  APPROVED and acknowledged; boundary → fdd2701.
- T3.4 + T3.5 (writer, one commit: shared form helpers + nav): `/admin/showcase` (per-row forms: highlighted,
  position, ES/EN summary), `/admin/products` + `[slug]` (status, url, show_on_personal, position, translations only;
  test asserts slug/name never sent), `/admin/settings` (email, 5 socials, ES/EN bio). Translation/socials merges keep
  unknown keys. Write failures re-render with a generic notice. RED: 3 new suites failed (modules absent). GREEN: unit
  168/168, check 0 errors 0 warnings, lint ok, build ok, e2e 56/56. Live smoke (real Supabase): nav ok; invalid
  position/url/email → 400 with field errors; unchanged saves → 303 + notice; unknown slug → 404; md5 of showcase,
  products and settings identical before/after (lossless round-trip).
  Open: a view row with no `project_showcase` row shows "no longer exists" on save (not reachable today).
- RDD fdd2701..21e482c (lineage review-0722f58f5f0da9ab): medium, granted, reliability lens, APPROVED and
  acknowledged; boundary → 21e482c. (Two earlier candidates could not start because a writer's untracked files
  changed the workspace; review now always runs on committed work units.)
- Delivery: feature-branch-chain (cached). Tracker `feat/site-admin` → `main`; slices `feat/site-admin-0N-*`.

- Stage 3 delivered (user, 2026-10-10): PRs #9 tracker, #10 auth, #11 content (`size:exception`), #12 showcase
  (`size:exception`); merged top-down (#12→#11→#10→#9) so no retarget was needed; tracker verified identical to
  chain head; #9 → `main` (dfb5036). Production Ready; smoke on www.facundopascale.dev: unauth redirect, login,
  httpOnly cookie, cross-origin POST 403, all five admin pages 200, sign out; bad password shows the generic error
  (checked via POST); `/admin` absent from sitemap, `Disallow: /admin` in robots.

## Next step

Stage 4: Resend newsletter.
