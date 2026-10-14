# Work detail redesign

## Objective

Make the case study page (`/es/trabajo/<slug>/`, `/en/work/<slug>/`) read like a proper case study
(hero with cover, meta and links; framed MDX body; compact gallery; next project + CTA) while
keeping the site's Blueprint identity (paper, ink, accent, Newsreader display, JetBrains Mono labels).

## Problem / why

- No hero: the cover is never shown; role/year/stack are a tiny eyebrow + chips; links are a tiny
  "→ Live" at the very bottom.
- Gallery renders phones two-up at ~330px wide (~600px+ tall each), pages are 5.6k–7.7k px tall.
- No next project, no closing CTA.

## Scope

- `src/components/WorkDetail.astro` (new, shared by both locale routes), thin route pages.
- `src/components/Gallery.astro` redesign (phones in balanced rows / mobile scroll-snap strip,
  desktop 2-up with featured first when odd, grouped when mixed).
- `src/lib/work-detail.ts` pure helpers (rows, desktop layout, grouping, next project, link kinds).
- `Toc.astro` gets an optional class override so it can sit in a grid column.
- e2e: update gallery spec, add case-study spec (hero cover + links, next project, 390px overflow).

## Constraints

- Astro 6, `astro:assets` `<Image>` through the Vercel optimizer, `quality={75}`, correct `sizes`.
- SEO/hreflang/OG/JSON-LD/language switcher untouched (Layout owns them).
- All copy es (voseo) / en. No push. Conventional commits, no trailers.

## TDD

- Mode: strict TDD for pure logic (user instruction). Runner: `pnpm test` (vitest, `tests/unit`).

## Tasks

- [x] T1 Pure helpers + unit tests (RED → GREEN) — route: inline
- [x] T2 WorkDetail component (hero, body + TOC, next project, CTA), thin routes — route: inline
- [x] T3 Gallery redesign — route: inline
- [x] T4 e2e updates + new specs; full verification; screenshots before/after — route: inline

Route note: executed inline by the delegated writer agent (this agent is the delegated worker).

## Acceptance criteria

- Hero shows cover (eager, fetchpriority high) and link buttons for every frontmatter link.
- Phones: max 4 per row, balanced rows, no lonely last item; strip with scroll-snap < 768px.
- Desktop shots: 2-up, featured first when odd count.
- Next project follows the work index order (`order` asc) and wraps around.
- No horizontal overflow at 390px. Build without new warnings.

## Checks

`pnpm build`, `pnpm test`, `pnpm exec astro check`, `pnpm lint`, `pnpm exec playwright test`.

## Progress / evidence

- T1 b3e7230 (RED: module missing → GREEN: 19 tests). T2 b3bffc9. T3 b648e0d. T4 1cd2404.
- Heights 1440 / 390, before → after: ur-pov 5876→5423 / 6027→6642; elevate 7474→5996 /
  6487→7329; horus 5610→6788 / 7723→9216. Mobile and horus grow from the new hero (cover +
  meta), next-project card and CTA, and a ~68ch body measure (77 chars/line at 16px).
- `pnpm build` 0 warnings · `pnpm test` 314 passed · `astro check` 0 errors/0 warnings ·
  `pnpm lint` clean · `playwright test` 97 passed.
- Known gap: phone frames use a 9:19.5 crop (object-top), so Elevate's three long scroll
  captures are cropped; there is no lightbox to see them in full.

## Next step

Review; push/PR are the user's decision.
