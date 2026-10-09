import { createClient } from '@supabase/supabase-js';

import { localizedPath, type Locale } from './i18n';
import {
  fixtureContentItems,
  fixtureProducts,
  fixtureShowcase,
  fixtureSiteSettings,
} from './site-data.fixtures';

/**
 * Build-time data layer for the personal site. Pages call the `get*`
 * fetchers while Astro prerenders; each table is requested at most once per
 * build and shared across pages and locales. Without Supabase env vars
 * (CI, contributors) deterministic fixtures are served instead. With env
 * present, any request failure throws so a broken build is never published
 * with stale or placeholder content.
 */

// ---------------------------------------------------------------------------
// Row shapes (as returned by PostgREST)
// ---------------------------------------------------------------------------

type Translations<T> = Partial<Record<string, Partial<T>>> | null;

export type ShowcaseImageRow = {
  alt?: string | null;
  width?: number | null;
  height?: number | null;
  /** Public URL of the stored image. */
  blobKey: string;
  sortOrder?: number | null;
};

export type ShowcaseRow = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  translations: Translations<{ title: string; description: string }>;
  showcase_translations: Translations<{ summary: string }>;
  image: string | null;
  images: ShowcaseImageRow[] | null;
  image_orientation: string | null;
  technologies: string[] | null;
  category: string | null;
  live_url: string | null;
  app_store_url: string | null;
  play_store_url: string | null;
  highlighted: boolean;
  position: number;
};

export type ProductStatus = 'idea' | 'beta' | 'live' | 'sunset';

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  translations: Translations<{ tagline: string; description: string }>;
  status: ProductStatus;
  url: string | null;
  logo: string | null;
  brand_color: string | null;
  show_on_personal: boolean;
  show_on_agency: boolean;
  position: number;
};

export type ContentChannel = 'youtube' | 'instagram' | 'linkedin' | 'newsletter' | 'blog' | 'ship';

export type ContentItemRow = {
  id: string;
  channel: ContentChannel;
  title: string;
  body: string | null;
  locale: Locale;
  published_at: string;
  url: string | null;
  product_id: string | null;
  project_id: string | null;
  meta: Record<string, unknown> | null;
};

export type SiteSettingsRow = {
  id: number;
  email: string | null;
  socials: Record<string, string> | null;
  translations: Translations<{ bio: string }>;
};

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export type GalleryImage = { src: string; alt: string; width: number; height: number };

export type ShowcaseProject = {
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  description: string;
  image: string | null;
  imageOrientation: string | null;
  gallery: GalleryImage[];
  technologies: string[];
  category: string | null;
  links: { live?: string; appStore?: string; playStore?: string };
  highlighted: boolean;
  position: number;
};

export type Product = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  status: ProductStatus;
  url: string | null;
  logo?: string;
  brandColor?: string;
};

export type LogEntry = {
  id: string;
  kind: ContentChannel;
  title: string;
  date: Date;
  /** Internal href for blog posts, external URL for everything else. */
  url: string;
  locale: Locale;
};

export type SiteSettings = {
  email?: string;
  socials: Record<string, string>;
  bio: string;
};

// ---------------------------------------------------------------------------
// Pure mappers
// ---------------------------------------------------------------------------

const FALLBACK_LOCALES = ['en', 'es'] as const;

/** Requested locale, then `en`, then `es`. Empty strings count as missing. */
function pick<T extends Record<string, string>>(
  translations: Translations<T>,
  locale: Locale,
  field: keyof T & string
): string | undefined {
  for (const loc of [locale, ...FALLBACK_LOCALES]) {
    const value = translations?.[loc]?.[field];
    if (typeof value === 'string' && value.trim() !== '') return value;
  }
  return undefined;
}

const nonEmpty = (value: string | null | undefined): string | undefined =>
  value && value.trim() !== '' ? value : undefined;

export function toShowcaseProject(row: ShowcaseRow, locale: Locale): ShowcaseProject {
  const description =
    pick(row.translations, locale, 'description') ?? nonEmpty(row.description) ?? '';
  const links: ShowcaseProject['links'] = {};
  if (row.live_url) links.live = row.live_url;
  if (row.app_store_url) links.appStore = row.app_store_url;
  if (row.play_store_url) links.playStore = row.play_store_url;

  const gallery = [...(row.images ?? [])]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((img) => ({
      src: img.blobKey,
      alt: img.alt ?? '',
      width: img.width ?? 0,
      height: img.height ?? 0,
    }));

  return {
    id: row.id,
    title: pick(row.translations, locale, 'title') ?? row.title,
    subtitle: row.subtitle ?? '',
    summary: pick(row.showcase_translations, locale, 'summary') ?? description,
    description,
    image: row.image,
    imageOrientation: row.image_orientation,
    gallery,
    technologies: row.technologies ?? [],
    category: row.category,
    links,
    highlighted: row.highlighted,
    position: row.position,
  };
}

export function toProduct(row: ProductRow, locale: Locale): Product {
  const product: Product = {
    slug: row.slug,
    name: row.name,
    tagline: pick(row.translations, locale, 'tagline') ?? '',
    description: pick(row.translations, locale, 'description') ?? '',
    status: row.status,
    url: row.url,
  };
  if (row.logo) product.logo = row.logo;
  if (row.brand_color) product.brandColor = row.brand_color;
  return product;
}

export function toLogEntry(row: ContentItemRow): LogEntry {
  return {
    id: row.id,
    kind: row.channel,
    title: row.title,
    date: new Date(row.published_at),
    url: row.url ?? '',
    locale: row.locale,
  };
}

export function toSiteSettings(row: SiteSettingsRow, locale: Locale): SiteSettings {
  const settings: SiteSettings = {
    socials: row.socials ?? {},
    bio: pick(row.translations, locale, 'bio') ?? '',
  };
  if (row.email) settings.email = row.email;
  return settings;
}

/** Minimal shape of an Astro `blog` collection entry (already published and locale-filtered). */
export type BlogPostInput = {
  id: string;
  data: { title: string; publishedAt: Date; lang: Locale };
};

/**
 * Merge published content items for `locale` with blog posts into one
 * newest-first timeline. Blog posts must already be filtered with
 * `filterPublished` / `byLocale`.
 */
export function buildLog(
  entries: LogEntry[],
  blogPosts: BlogPostInput[],
  locale: Locale,
  limit: number
): LogEntry[] {
  const posts: LogEntry[] = blogPosts.map((post) => ({
    id: `blog:${post.id}`,
    kind: 'blog',
    title: post.data.title,
    date: post.data.publishedAt,
    url: localizedPath(
      'blog',
      locale,
      post.id.replace(`${post.data.lang}/`, '').replace(/\.mdx$/, '')
    ),
    locale: post.data.lang,
  }));

  return [...entries.filter((e) => e.locale === locale), ...posts]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

type QueryResult = PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;

/** The slice of the PostgREST builder this module uses (keeps the client untyped-schema friendly). */
interface Query extends QueryResult {
  eq(column: string, value: unknown): Query;
  order(column: string, options: { ascending: boolean }): Query;
  limit(count: number): Query;
}
type Table = { select(columns: string): Query };
type Client = { schema(name: string): { from(table: string): Table } };

type Source = {
  schema: 'personal' | 'public';
  table: string;
  fixture: unknown[];
  query: (table: Table) => QueryResult;
};

const SOURCES = {
  showcase: {
    schema: 'personal',
    table: 'showcase',
    fixture: fixtureShowcase,
    query: (q) =>
      q
        .select('*')
        .order('highlighted', { ascending: false })
        .order('position', { ascending: true }),
  },
  products: {
    schema: 'public',
    table: 'products',
    fixture: fixtureProducts,
    query: (q) => q.select('*').eq('show_on_personal', true).order('position', { ascending: true }),
  },
  contentItems: {
    schema: 'personal',
    table: 'content_items',
    fixture: fixtureContentItems,
    query: (q) =>
      q.select('*').eq('status', 'published').order('published_at', { ascending: false }),
  },
  siteSettings: {
    schema: 'personal',
    table: 'site_settings',
    fixture: [fixtureSiteSettings],
    query: (q) => q.select('*').eq('id', 1).limit(1),
  },
} as const satisfies Record<string, Source>;

type SourceName = keyof typeof SOURCES;
type RowOf = {
  showcase: ShowcaseRow;
  products: ProductRow;
  contentItems: ContentItemRow;
  siteSettings: SiteSettingsRow;
};

const cache = new Map<SourceName, Promise<unknown[]>>();
let client: Client | undefined;
let warned = false;

/** Clears memoized requests and warning state. Test-only. */
export function resetSiteDataCache(): void {
  cache.clear();
  client = undefined;
  warned = false;
}

function readEnv(): { url: string; key: string } | undefined {
  const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;
  return url && key ? { url, key } : undefined;
}

function load<K extends SourceName>(name: K): Promise<RowOf[K][]> {
  let pending = cache.get(name);
  if (!pending) {
    pending = request(name);
    cache.set(name, pending);
  }
  return pending as Promise<RowOf[K][]>;
}

async function request(name: SourceName): Promise<unknown[]> {
  const source: Source = SOURCES[name];
  const env = readEnv();
  if (!env) {
    if (!warned) {
      warned = true;
      console.warn(
        '[site-data] PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY not set: using fixtures.'
      );
    }
    return source.fixture;
  }

  client ??= createClient(env.url, env.key, {
    auth: { persistSession: false },
  }) as unknown as Client;
  const { data, error } = await source.query(client.schema(source.schema).from(source.table));
  if (error || !data) {
    throw new Error(
      `[site-data] Failed to load ${source.schema}.${source.table}: ${error?.message ?? 'no data'}`
    );
  }
  return data;
}

export async function getShowcase(locale: Locale): Promise<ShowcaseProject[]> {
  return (await load('showcase')).map((row) => toShowcaseProject(row, locale));
}

export async function getProducts(locale: Locale): Promise<Product[]> {
  return (await load('products')).map((row) => toProduct(row, locale));
}

/** Published content-calendar items for `locale`; merge with blog posts via `buildLog`. */
export async function getContentLog(locale: Locale): Promise<LogEntry[]> {
  return (await load('contentItems')).map(toLogEntry).filter((entry) => entry.locale === locale);
}

export async function getSiteSettings(locale: Locale): Promise<SiteSettings> {
  const [row] = await load('siteSettings');
  // Without env `load` already serves the fixture row, so a missing row here means
  // the live table is empty: fail the build rather than ship placeholder settings.
  if (!row) throw new Error('[site-data] No row found in personal.site_settings (id = 1)');
  return toSiteSettings(row, locale);
}
