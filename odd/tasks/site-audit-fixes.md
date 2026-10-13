# Feature: Site audit fixes (2026-10-12 live audit)

## Objective

Fix the issues from the live audit of facundopascale.dev (canonical origin, language switcher, 404, SEO, a11y, perf, copy).

## Route

Delegated direct: single writer on branch `fix/site-audit`. TDD: not enabled; runner `pnpm test` (vitest) used for functional checks.

## Tasks

- [ ] A1 (P0) www origin for site/robots/comments (A9 comment fix included)
- [ ] A2 (P0) + A6 (P1) Language switcher: static-page twins, server-rendered `<a>`
- [ ] A3 (P0) Broken `/es/about` link in hola-mundo post
- [ ] A4 (P1) Locale-aware 404
- [ ] A5 (P1) `seoDescription` for work case studies (11 x 2 locales)
- [ ] A7 (P1) Home portrait LCP (quality, fetchpriority)
- [ ] A8 (P1) Skip link (verify existing, fix if broken)
- [ ] A10 (P1) Footer GitHub URL
- [ ] A11 (P2) Blog index heading order
- [ ] A12 (P2) JSON-LD Person/WebSite/BlogPosting
- [ ] A13 (P2) Localize "Uses" link text in es About
- [ ] A14 Horus AWS migration completed: cover + copy

## Checks

`pnpm build`, `pnpm test`, `pnpm exec astro check`, lint, Playwright smoke on `pnpm preview`.

## Progress / evidence

(commits recorded below)
