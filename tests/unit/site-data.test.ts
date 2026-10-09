import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createClient = vi.hoisted(() => vi.fn());
vi.mock('@supabase/supabase-js', () => ({ createClient }));

import {
  buildLog,
  getContentLog,
  getProducts,
  getShowcase,
  getSiteSettings,
  resetSiteDataCache,
  toLogEntry,
  toProduct,
  toShowcaseProject,
  toSiteSettings,
  type ContentItemRow,
  type ProductRow,
  type ShowcaseRow,
  type SiteSettingsRow,
} from '../../src/lib/site-data';

const showcaseRow: ShowcaseRow = {
  id: 'p1',
  title: 'Base title',
  subtitle: 'Base subtitle',
  description: 'Base description',
  translations: {
    en: { title: 'EN title', description: 'EN description' },
    es: { title: 'ES título', description: '' },
    it: { title: 'IT titolo', description: 'IT descrizione' },
  },
  showcase_translations: { es: { summary: 'Resumen ES' }, en: { summary: '' } },
  image: 'https://img/cover.webp',
  images: [
    { alt: 'two', width: 10, height: 20, blobKey: 'https://img/2.webp', sortOrder: 2 },
    { alt: 'zero', width: 10, height: 20, blobKey: 'https://img/0.webp', sortOrder: 0 },
    { alt: 'one', width: 10, height: 20, blobKey: 'https://img/1.webp', sortOrder: 1 },
  ],
  image_orientation: 'portrait',
  technologies: ['Swift', 'Supabase'],
  category: 'mobile',
  live_url: 'https://live.example',
  app_store_url: null,
  play_store_url: 'https://play.example',
  highlighted: true,
  position: 3,
};

const productRow: ProductRow = {
  id: 'pr1',
  slug: 'orbys',
  name: 'Orbys',
  translations: { es: { tagline: 'Tagline ES', description: 'Desc ES' }, en: { tagline: '' } },
  status: 'live',
  url: 'https://www.getorbys.com',
  logo: null,
  brand_color: '#123456',
  show_on_personal: true,
  show_on_agency: true,
  position: 1,
};

const contentRow: ContentItemRow = {
  id: 'c1',
  channel: 'youtube',
  title: 'Video',
  body: null,
  locale: 'es',
  published_at: '2026-05-10T10:00:00Z',
  url: 'https://youtu.be/x',
  product_id: null,
  project_id: null,
  meta: {},
};

describe('toShowcaseProject', () => {
  it('resolves requested locale, falling back per field to en, es, then base', () => {
    const en = toShowcaseProject(showcaseRow, 'en');
    expect(en.title).toBe('EN title');
    expect(en.description).toBe('EN description');
    // summary: en is empty -> es
    expect(en.summary).toBe('Resumen ES');

    const es = toShowcaseProject(showcaseRow, 'es');
    expect(es.title).toBe('ES título');
    // es description empty -> en
    expect(es.description).toBe('EN description');
    expect(es.summary).toBe('Resumen ES');
  });

  it('falls back to base columns when no translation exists', () => {
    const bare = { ...showcaseRow, translations: {}, showcase_translations: {} };
    const p = toShowcaseProject(bare, 'en');
    expect(p.title).toBe('Base title');
    expect(p.description).toBe('Base description');
    expect(p.summary).toBe('Base description');
  });

  it('sorts the gallery by sortOrder and maps blobKey to src', () => {
    const p = toShowcaseProject(showcaseRow, 'en');
    expect(p.gallery.map((g) => g.src)).toEqual([
      'https://img/0.webp',
      'https://img/1.webp',
      'https://img/2.webp',
    ]);
    expect(p.gallery[0]).toEqual({ src: 'https://img/0.webp', alt: 'zero', width: 10, height: 20 });
  });

  it('does not mutate the source images and tolerates null images', () => {
    const before = showcaseRow.images?.map((i) => i.sortOrder);
    toShowcaseProject(showcaseRow, 'en');
    expect(showcaseRow.images?.map((i) => i.sortOrder)).toEqual(before);
    expect(toShowcaseProject({ ...showcaseRow, images: null }, 'en').gallery).toEqual([]);
  });

  it('maps links, flags and technologies, omitting null links', () => {
    const p = toShowcaseProject(showcaseRow, 'en');
    expect(p.links).toEqual({ live: 'https://live.example', playStore: 'https://play.example' });
    expect(p.highlighted).toBe(true);
    expect(p.position).toBe(3);
    expect(p.technologies).toEqual(['Swift', 'Supabase']);
    expect(p.image).toBe('https://img/cover.webp');
  });
});

describe('toProduct', () => {
  it('resolves tagline and description with fallback, empty strings count as missing', () => {
    const en = toProduct(productRow, 'en');
    expect(en.tagline).toBe('Tagline ES');
    expect(en.description).toBe('Desc ES');
    expect(en.name).toBe('Orbys');
    expect(en.status).toBe('live');
    expect(en.url).toBe('https://www.getorbys.com');
  });

  it('omits logo and brandColor when null', () => {
    const p = toProduct(productRow, 'es');
    expect(p.logo).toBeUndefined();
    expect(p.brandColor).toBe('#123456');
  });

  it('returns empty strings when no translation exists at all', () => {
    const p = toProduct({ ...productRow, translations: {} }, 'es');
    expect(p.tagline).toBe('');
    expect(p.description).toBe('');
  });
});

describe('toLogEntry', () => {
  it('maps a content row', () => {
    expect(toLogEntry(contentRow)).toEqual({
      id: 'c1',
      kind: 'youtube',
      title: 'Video',
      date: new Date('2026-05-10T10:00:00Z'),
      url: 'https://youtu.be/x',
      locale: 'es',
    });
  });
});

describe('toSiteSettings', () => {
  const row: SiteSettingsRow = {
    id: 1,
    email: null,
    socials: { github: 'https://github.com/x' },
    translations: { es: { bio: 'Bio ES' }, en: { bio: '' } },
  };

  it('resolves bio with fallback and keeps email undefined when null', () => {
    const s = toSiteSettings(row, 'en');
    expect(s.bio).toBe('Bio ES');
    expect(s.email).toBeUndefined();
    expect(s.socials).toEqual({ github: 'https://github.com/x' });
  });

  it('keeps email when present', () => {
    expect(toSiteSettings({ ...row, email: 'a@b.c' }, 'es').email).toBe('a@b.c');
  });
});

describe('buildLog', () => {
  const post = (id: string, lang: 'es' | 'en', publishedAt: string) => ({
    id: `${lang}/${id}.mdx`,
    data: { title: `Post ${id}`, publishedAt: new Date(publishedAt), lang },
  });

  it('merges content entries and blog posts, newest first, with internal blog hrefs', () => {
    const entries = [
      toLogEntry(contentRow),
      toLogEntry({ ...contentRow, id: 'c2', published_at: '2026-06-01T00:00:00Z' }),
    ];
    const log = buildLog(entries, [post('hello', 'es', '2026-05-20')], 'es', 10);
    expect(log.map((e) => e.id)).toEqual(['c2', 'blog:es/hello.mdx', 'c1']);
    const blog = log[1]!;
    expect(blog.kind).toBe('blog');
    expect(blog.url).toBe('/es/blog/hello/');
    expect(blog.date).toEqual(new Date('2026-05-20'));
  });

  it('keeps only content entries of the requested locale', () => {
    const entries = [toLogEntry(contentRow), toLogEntry({ ...contentRow, id: 'c3', locale: 'en' })];
    expect(buildLog(entries, [], 'en', 10).map((e) => e.id)).toEqual(['c3']);
  });

  it('applies the limit after sorting', () => {
    const posts = [post('a', 'en', '2026-01-01'), post('b', 'en', '2026-03-01')];
    const log = buildLog([], posts, 'en', 1);
    expect(log).toHaveLength(1);
    expect(log[0]!.title).toBe('Post b');
  });
});

/** Chainable, awaitable stand-in for a postgrest query builder. */
function fakeBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order', 'limit']) builder[m] = () => builder;
  builder.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return builder;
}

function mockClient(tables: Record<string, { data: unknown; error: unknown }>) {
  const from = vi.fn((table: string) => fakeBuilder(tables[table] ?? { data: [], error: null }));
  const schema = vi.fn(() => ({ from }));
  createClient.mockReturnValue({ schema });
  return { from, schema };
}

describe('fetchers without Supabase env', () => {
  beforeEach(() => {
    resetSiteDataCache();
    vi.stubEnv('PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('PUBLIC_SUPABASE_ANON_KEY', '');
    createClient.mockReset();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('serves deterministic fixtures and never creates a client', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const showcase = await getShowcase('en');
    expect(showcase.filter((p) => p.highlighted)).toHaveLength(3);
    expect(showcase.length).toBeGreaterThanOrEqual(5);

    const products = await getProducts('es');
    expect(products.map((p) => p.name)).toEqual(['Stagionaly', 'Elevate', 'Orbys']);
    expect(products.map((p) => p.url)).toEqual([
      'https://www.stagionaly.com',
      'https://byelevate.app',
      'https://www.getorbys.com',
    ]);

    expect(await getContentLog('es')).toEqual([]);
    expect((await getSiteSettings('es')).email).toBeUndefined();

    expect(createClient).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe('fetchers with Supabase env', () => {
  beforeEach(() => {
    resetSiteDataCache();
    vi.stubEnv('PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    createClient.mockReset();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('reads the right schema/table and memoizes one request per table', async () => {
    const { from, schema } = mockClient({
      showcase: { data: [showcaseRow], error: null },
      products: { data: [productRow], error: null },
      content_items: { data: [contentRow], error: null },
      site_settings: {
        data: [{ id: 1, email: 'a@b.c', socials: {}, translations: {} }],
        error: null,
      },
    });

    const [es, en] = await Promise.all([getShowcase('es'), getShowcase('en')]);
    expect(es[0]!.title).toBe('ES título');
    expect(en[0]!.title).toBe('EN title');
    await getShowcase('es');
    expect(from.mock.calls.filter(([t]) => t === 'showcase')).toHaveLength(1);

    expect((await getProducts('es'))[0]!.slug).toBe('orbys');
    expect((await getContentLog('es'))[0]!.id).toBe('c1');
    expect(await getContentLog('en')).toEqual([]);
    expect((await getSiteSettings('es')).email).toBe('a@b.c');

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(schema).toHaveBeenCalledWith('personal');
    expect(schema).toHaveBeenCalledWith('public');
  });

  it('throws instead of falling back to fixtures when the request fails', async () => {
    mockClient({ showcase: { data: null, error: { message: 'boom' } } });
    await expect(getShowcase('en')).rejects.toThrow(/showcase.*boom/);
  });
});
