# Portfolio follow-ups

## Objective

Close the four optional follow-ups left after `project-case-studies` and the capsulecodes.com fixes, in the order the user asked.

## Problem / why

- The offline-first blog post (es/en, still `draft: true`) describes Elevate's early "FitCoach-era" sync: single writer, last-write-wins, "no operation log needed". The current Elevate case study documents an RPC queue, dead letters and deletion reconciliation, so the post contradicts the case study.
- The Orbys cover is the weakest one: the live app has sparse data. Plan: local demo seed plus recapture.
- capsulecodes.com admin cannot upload or change a project's cover (`projects.image`); covers were set by hand in the DB.
- The HTG `cover_media_id` on capsulecodes.com has unclear provenance (it may have been set by an agent outside its brief).

## Scope and constraints

- facundopascale-dev: T1, T2. capsule-codes-website (`/Users/facundo/Projects/personal/capsule-codes-website`): T3, T4.
- Demo data only, never production backends. Never print or commit keys, and never read `.env` files.
- Back up DB rows before writes. Never delete existing images or storage objects.
- No AI attribution in commits. Push, PR and merge are the user's call. Test capsulecodes locally before any PR.
- Elevate apps are not "in production" (the website is live; the apps are not in the stores).

## Tasks

- [x] T1 — Align the offline-first post (es/en) with Elevate's current sync engine (route: delegated writer, preparation trigger: reads the Elevate repo).
- [ ] T2 — Recapture the Orbys cover and gallery with local demo data (route: delegated, needs the Orbys repo and local seed).
- [ ] T3 — capsulecodes.com admin: upload or replace the project cover (`image`) (route: delegated writer, 2+ files).
- [ ] T4 — Verify HTG `cover_media_id` provenance and fix it if wrong (route: inline, read-only SQL first).

## Acceptance criteria

- T1: the post never contradicts `src/content/work/*/elevate.mdx`. es/en are in parity, and `pnpm build` passes.
- T2: the Orbys cover shows populated demo data and was regenerated via `pnpm covers orbys`.
- T3: the admin can set the cover, the gallery `images[]` is untouched, and tests, tsc and build pass, verified locally.
- T4: HTG cover_media_id points to the cover (or null) with evidence recorded.

## Checks

- facundopascale-dev: `pnpm build`, `pnpm test` (vitest).
- capsule-codes-website: `npm test`, `npx tsc --noEmit`, `RESEND_API_KEY=re_dummy npm run build`.
- TDD: strict mode is enabled globally. It applies to code tasks (T3); content and image tasks use build checks.

## Progress

- Branch `feat/portfolio-followups` (facundopascale-dev).
- T1 done: both posts aligned with the Elevate sync engine; pnpm build, pnpm test and the fitcoach grep checked. commit: docs(blog): align offline-first post with Elevate's sync engine
