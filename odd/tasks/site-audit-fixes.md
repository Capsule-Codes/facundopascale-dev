# Feature: Site audit fixes (2026-10-12 live audit)

## Objective

Fix the issues from the live audit of facundopascale.dev (canonical origin, language switcher, 404, SEO, a11y, perf, copy).

## Route

Delegated direct: single writer on branch `fix/site-audit`. TDD: not enabled; runner `pnpm test` (vitest) used for functional checks.

## Tasks

- [x] A1 (P0) www origin for site/robots/comments (A9 comment fix included)
- [x] A2 (P0) + A6 (P1) Language switcher: static-page twins, server-rendered `<a>`
- [x] A3 (P0) Broken `/es/about` link in hola-mundo post
- [x] A4 (P1) Locale-aware 404
- [x] A5 (P1) `seoDescription` for work case studies (11 x 2 locales)
- [x] A7 (P1) Home portrait LCP (quality, fetchpriority)
- [x] A8 (P1) Skip link (verify existing, fix if broken)
- [x] A10 (P1) Footer GitHub URL
- [x] A11 (P2) Blog index heading order
- [x] A12 (P2) JSON-LD Person/WebSite/BlogPosting
- [x] A13 (P2) Localize "Uses" link text in es About
- [x] A14 Horus AWS migration completed: cover + copy

## Checks

`pnpm build`, `pnpm test`, `pnpm exec astro check`, lint, Playwright smoke on `pnpm preview`.

## Progress / evidence

- A1/A9 01629a3 (root `/` stays a meta-refresh shim: the Vercel adapter does not emit a config redirect for `/`; comment corrected)
- A2+A6+A10 92e8086 (A8: skip link already existed in Header; verified by e2e)
- A3+A13 e50452f; A11 29466c7; A5 f2bed3d; A14 818a02d; A7 046c8ec; A4 f05437c; A12 d38aa55; e2e 5387aec
- Skipped: font preload (hashed fontsource asset, not trivial/safe).
- Checks: pnpm build clean, pnpm test 294 pass, astro check 0/0, eslint clean, playwright 79 pass.
