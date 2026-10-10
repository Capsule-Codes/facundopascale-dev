# facundopascale.dev

Personal website and blog for Facundo Pascale. Built with Astro, deployed on Vercel.

## Stack

- **Astro 6** + **React 19** islands
- **Tailwind CSS 4** via `@tailwindcss/vite` with custom dark variant
- **MDX** content collections with i18n (ES default, EN secondary)
- **Shiki** dual-theme code blocks (vitesse-light / vesper)
- **Satori / @vercel/og** for build-time OG image generation
- **Resend** for the contact form (via Astro Actions)
- **Vitest** + **Playwright** for unit and E2E tests
- **Vercel** static + adapter (hybrid: pages prerendered, actions/API dynamic)

## Requirements

- Node `>=22.12.0`
- pnpm `10.17.1` (pinned via `packageManager`)

## Development

```bash
pnpm install         # install dependencies
pnpm dev             # start dev server at http://localhost:4321
pnpm check           # astro check (type-check)
pnpm lint            # eslint
pnpm format:check    # verify formatting
pnpm format          # write formatting
pnpm test            # vitest unit tests
pnpm test:watch      # vitest watch mode
pnpm test:e2e        # playwright e2e (requires `pnpm exec playwright install`)
pnpm build           # production build
pnpm preview         # preview production build locally
```

## Project structure

```
src/
├── actions/           # Astro Actions (contact form)
├── assets/og/         # Fonts shipped to OG image generator
├── components/        # Astro + React components
│   ├── islands/       # React islands (theme toggle, language switcher, contact form)
│   └── mdx/           # MDX-only components (Callout, CodeBlock)
├── content/           # MDX content collections
│   ├── blog/{es,en}/
│   ├── work/{es,en}/
│   └── pages/{es,en}/
├── lib/               # Pure utilities (i18n, content, hreflang, og, rate-limit, …)
├── pages/             # Astro routes (file-based)
│   └── api/           # Dynamic API routes
├── styles/            # Tailwind 4 design tokens
└── env.d.ts
```

## Environment variables

Copy `.env.example` to `.env` and fill in the required values.

| Variable                   | Used by                                                                    | Required for                                     |
| -------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------ |
| `RESEND_API_KEY`           | Contact form (Astro Action)                                                | Production deploy                                |
| `CONTACT_EMAIL_TO`         | Contact form recipient                                                     | Production deploy                                |
| `NEWSLETTER_SECRET`        | Newsletter confirmation-link signing (HMAC)                                | Production deploy                                |
| `RESEND_SEGMENT_ES`        | Resend segment id for Spanish subscribers                                  | Production deploy                                |
| `RESEND_SEGMENT_EN`        | Resend segment id for English subscribers                                  | Production deploy                                |
| `RESEND_TOPIC_NEWSLETTER`  | Optional Resend topic id; confirmed contacts are opted in                  | Optional                                         |
| `NEWSLETTER_FROM`          | Optional sender, default `Facundo Pascale <newsletter@facundopascale.dev>` | Optional                                         |
| `PUBLIC_SUPABASE_URL`      | Build-time content (`src/lib/site-data.ts`); `/admin` at runtime           | Real content (fixtures otherwise); admin sign-in |
| `PUBLIC_SUPABASE_ANON_KEY` | Build-time content (public anon key); `/admin` at runtime                  | Real content (fixtures otherwise); admin sign-in |

Newsletter (double opt-in): `/{locale}/newsletter/subscribe` sends a signed 48h confirmation link and
`/{locale}/newsletter/confirm` creates the contact in Resend (segment per language). Subscribers live only in
Resend; nothing is stored until the link is confirmed. Without `RESEND_API_KEY`, `NEWSLETTER_SECRET` and the
language's segment id, both pages answer 503.

`/admin` renders on demand, so it needs the same `PUBLIC_SUPABASE_*` variables available at runtime (not only
at build). Without them it answers 503. Access requires a Supabase Auth user listed in `personal.admins`.

Rebuilds are event-driven: changes to the site's Supabase content call the Vercel deploy hook stored in
Supabase Vault as `facundopascale_deploy_hook`, and `pg_cron` publishes scheduled content every 15 minutes
(`supabase/migrations/20261009150000_event_driven_rebuild.sql`).

## Project docs

- Design spec: `docs/superpowers/specs/2026-04-13-personal-site-design.md`
- Implementation plan: `docs/superpowers/plans/2026-04-13-personal-site.md`
- Handoff / progress log: `docs/superpowers/HANDOFF.md`

## License

- **Code** is licensed under the [MIT License](./LICENSE).
- **Written content** (blog posts, case studies, page copy under `src/content/`) is licensed under [Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/) unless otherwise noted in the post itself.
