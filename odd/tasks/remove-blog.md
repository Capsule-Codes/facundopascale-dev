# Remove the blog from the public site

## Objective

Take the blog ("Notas" / "Writing") off facundopascale.dev. The owner believes nobody reads it and wants the site focused on work, products, and contact.

## Scope

- Remove the public blog surface: `/[locale]/blog/` index and post routes, the RSS feeds, the header nav entry, `PostCard`, blog OG images, the RSS `<link rel="alternate">`, and blog-specific hreflang / JSON-LD code paths.
- Drop blog posts from the home build log; other content channels stay.
- Redirect old URLs (`/es/blog/*`, `/en/blog/*`, `/:locale/rss.xml`) to the locale home via `vercel.json` so indexed links don't 404.
- Keep `src/content/blog/**` MDX sources and the `blog` collection definition so the posts can come back later; keep `Toc` and the MDX components (case studies use them); leave the admin content calendar alone.

## Constraints

- TDD on (project config), runner: `pnpm test` (vitest) and `pnpm exec playwright test`.
- One writer, delegated (writer trigger: 2+ non-trivial files, ~30 files referenced).

## Tasks

- [x] T1 — Remove the blog surface, redirect old URLs, update tests. Route: delegated direct.
- [x] T2 — Hide the home build log when it is empty (production has no published content items, so it was fed only by blog posts). Route: direct inline (one file plus its test).

## Acceptance criteria

- No nav link, page, feed, or home link points at `/blog/` or `rss.xml`.
- Old blog URLs redirect to the locale home in production.
- `astro check`, unit tests, and e2e pass.

## Progress

- Created 2026-10-17.
- T1 done 2026-10-17. RED: new home e2e (no blog/RSS links) failed in es and en before implementation. GREEN: `astro check` 0 errors; `pnpm test` 321 passed; `playwright test` 91 passed; `pnpm lint` clean. Left on purpose: `@astrojs/rss` dependency, `src/content/blog/**`, `blog` collection, admin `blog` channel, `blog` log-kind label on home.
- T2 done 2026-10-17. RED: "hides the build log when nothing is published" failed in es and en. GREEN: `astro check` 0 errors; `playwright test` 91 passed; lint clean.
