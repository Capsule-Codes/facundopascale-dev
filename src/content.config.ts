import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const localeEnum = z.enum(['es', 'en']);

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().min(50).max(200),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().nullable().default(null),
    tags: z.array(z.string()).default([]),
    lang: localeEnum,
    translationId: z.string(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    coverImage: z.string().optional(),
    author: z.literal('facundo').default('facundo'),
  }),
});

const work = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    stack: z.array(z.string()),
    role: z.string(),
    year: z.number(),
    links: z
      .object({
        live: z.url().optional(),
        github: z.url().optional(),
        caseStudy: z.url().optional(),
      })
      .default({}),
    coverImage: z.string(),
    gallery: z.array(z.string()).default([]),
    lang: localeEnum,
    translationId: z.string(),
    featured: z.boolean().default(false),
    order: z.number().default(0),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    updatedAt: z.coerce.date(),
    lang: localeEnum,
  }),
});

export const collections = { blog, work, pages };
