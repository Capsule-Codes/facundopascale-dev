/**
 * MDX components convenience registry.
 *
 * IMPORTANT: This is a re-export for ergonomics, NOT an automatic wiring.
 * Astro's `@astrojs/mdx` integration does NOT read this object — it has no
 * built-in "global MDX components" mechanism analogous to Next.js'
 * `mdx-components.tsx`. Authors must still explicitly import components in
 * their MDX files:
 *
 *     import { Callout } from '@/components/mdx';
 *     // or
 *     import Callout from '@/components/mdx/Callout.astro';
 *
 * The `@/` path alias added to `tsconfig.json` in Task 17 is the actually-
 * useful part — it makes the import path stable regardless of how deeply the
 * MDX file is nested under `src/content/`.
 *
 * If future work wants true global auto-wiring, the options are:
 *   1. Render MDX via a custom renderer that passes `components={mdxComponents}`
 *      to `<Content />` (adds a layer between the collection entry and the
 *      page).
 *   2. Have every MDX file import from here (still manual, but DRY).
 *
 * Tasks 21–23 (content seeding) will decide which pattern fits the real blog
 * posts when they land.
 */
import Callout from './Callout.astro';
import CodeBlock from './CodeBlock.astro';

export { Callout, CodeBlock };

export const mdxComponents = { Callout, CodeBlock };
