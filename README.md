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

| Variable                 | Used by                       | Required for       |
| ------------------------ | ----------------------------- | ------------------ |
| `RESEND_API_KEY`         | Contact form (Astro Action)   | Production deploy  |
| `CONTACT_EMAIL_TO`       | Contact form recipient        | Production deploy  |
| `VERCEL_DEPLOY_HOOK_URL` | `/api/revalidate` cron        | Scheduled rebuilds |
| `CRON_SECRET`            | `/api/revalidate` bearer auth | Scheduled rebuilds |

## Project docs

- Design spec: `docs/superpowers/specs/2026-04-13-personal-site-design.md`
- Implementation plan: `docs/superpowers/plans/2026-04-13-personal-site.md`
- Handoff / progress log: `docs/superpowers/HANDOFF.md`

## License

- **Code** is licensed under the [MIT License](./LICENSE).
- **Written content** (blog posts, case studies, page copy under `src/content/`) is licensed under [Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/) unless otherwise noted in the post itself.
