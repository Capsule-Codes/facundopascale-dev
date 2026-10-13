# Feature: Site speed pass (2026-10-13)

## Objective

Cut bytes, JS and render-blocking work on facundopascale.dev without changing any visual.

## Route

Direct inline on branch `perf/site-speed`. TDD: not enabled; runner `pnpm test` (vitest) + `pnpm exec playwright test`.

## Tasks

- [x] P1 Baseline (Lighthouse mobile, simulated throttling, 3 runs median, local emulation of `serve` + `/_vercel/image`)
- [x] P2 Responsive optimized images (gallery, showcase cards, portrait): `astro:assets` `<Image>`, srcset/sizes, q75 WebP — 214cde8
- [x] P3 Drop React from every page but contact: ThemeToggle island -> inline script — 2b5043d
- [x] P4 Preload latin Newsreader + JetBrains Mono — 73b43f5
- [x] P5 Immutable `/_astro/*` via `vercel.json` (+ unit test) — f9e812d
- [x] Rejected after measuring: AVIF (20-55% larger than WebP at q75), `inlineStylesheets: 'always'` (no gain, HTML 31K -> 78K), preloading only Newsreader (FCP 0.8s -> 1.2s), `/images/*` cache headers (only the optimizer fetches them now)

## Acceptance

Same page height and visuals at 390 and 1440 (home, Elevate); fewer bytes; no JS on non-contact pages; all checks green.

## Before / after (local prod build, Lighthouse mobile, median of 3)

Home uses the real Supabase showcase images (temporary local fixture mirroring the 3 live ones; not committed).

| Page      | Perf       | LCP            | FCP            | CLS            | TBT | Total       | Images      | JS       |
| --------- | ---------- | -------------- | -------------- | -------------- | --- | ----------- | ----------- | -------- |
| /es/      | 92 -> 99   | 3.10 -> 2.04 s | 1.40 -> 0.84 s | 0.002 -> 0.000 | 0   | 445 -> 277K | 277 -> 164K | 54 -> 0K |
| /en/      | 94 -> 99   | 3.08 -> 2.04 s | 1.28 -> 0.84 s | 0.001 -> 0.000 | 0   | 444 -> 277K | 277 -> 164K | 54 -> 0K |
| elevate   | 100 -> 100 | 1.37 -> 1.53 s | 1.29 -> 0.78 s | 0.001 -> 0.000 | 0   | 212 -> 125K | 45 -> 12K   | 54 -> 0K |
| orbys     | 100 -> 100 | 1.34 -> 1.55 s | 1.27 -> 0.80 s | 0.001 -> 0.000 | 0   | 238 -> 130K | 71 -> 18K   | 54 -> 0K |
| /es/blog/ | 100 -> 100 | 1.32 -> 1.52 s | 1.24 -> 0.77 s | 0.001 -> 0.000 | 0   | 165 -> 110K | 0 -> 0K     | 54 -> 0K |

Live prod reference (2026-10-13, /es/): perf 95-96, LCP 2.7-2.8 s, total 461K, img 277K, JS 66K.

Full-scroll image bytes (Playwright, all lazy images loaded): home 275K -> 194K at 390px/DPR3, 275K -> 90K at 1440; Elevate 246K -> 172K (390), 246K -> 124K (1440); Orbys 298K -> 178K (390), 298K -> 92K (1440).

Text-only pages show LCP +0.2 s (the LCP element is a paragraph that repaints on the font swap; FCP is 0.5 s earlier). Score is unchanged.

## Verification

pnpm build (no warnings), pnpm test 295 pass, astro check 0/0 (1 pre-existing hint), pnpm lint clean, prettier clean, playwright 81 pass. Screenshots home + Elevate at 1440 and 390: identical heights, mean pixel diff < 0.15 (0.85 on Elevate 1440 from image resampling); viewed.

## Unverified

Real Vercel optimizer output (AVIF/WebP sizes, cache headers), `vercel.json` headers taking effect, and the Supabase remote pattern being accepted in production: only a deploy shows them. Local numbers use an emulated `/_vercel/image` (sharp).
