import { describe, expect, it, vi } from 'vitest';

import {
  countByStatus,
  createContentItem,
  deleteContentItem,
  formatUtc,
  getContentItem,
  isUuid,
  listContentItems,
  listProductOptions,
  listProjectOptions,
  localInputToIso,
  parseContentItemForm,
  updateContentItem,
  upcomingScheduled,
  type ContentItem,
  type ContentItemInput,
} from '../../src/lib/admin-content';

const NOW = new Date('2026-10-10T12:00:00.000Z');
const UUID = '3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b';

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const valid = { title: 'Launch post', channel: 'blog', status: 'idea', locale: 'es' };

describe('localInputToIso', () => {
  it('converts a local value to UTC using the browser offset (minutes behind UTC)', () => {
    expect(localInputToIso('2026-10-10T14:30', '180')).toBe('2026-10-10T17:30:00.000Z');
    expect(localInputToIso('2026-10-10T14:30', '-120')).toBe('2026-10-10T12:30:00.000Z');
  });

  it('crosses day boundaries and accepts seconds', () => {
    expect(localInputToIso('2026-10-10T22:00', '180')).toBe('2026-10-11T01:00:00.000Z');
    expect(localInputToIso('2026-10-10T01:00:30', '180')).toBe('2026-10-10T04:00:30.000Z');
  });

  it('treats a missing or invalid offset as UTC', () => {
    for (const offset of [undefined, null, '', 'abc', '1.5', '99999']) {
      expect(localInputToIso('2026-10-10T14:30', offset)).toBe('2026-10-10T14:30:00.000Z');
    }
  });

  it('returns null for malformed or impossible dates', () => {
    expect(localInputToIso('tomorrow', '0')).toBeNull();
    expect(localInputToIso('2026-13-40T10:00', '0')).toBeNull();
    expect(localInputToIso('2026-02-30T10:00', '0')).toBeNull();
  });
});

describe('parseContentItemForm', () => {
  it('accepts a minimal valid form with defaults', () => {
    const result = parseContentItemForm(form(valid), NOW);
    expect(result).toEqual({
      ok: true,
      value: {
        title: 'Launch post',
        channel: 'blog',
        status: 'idea',
        locale: 'es',
        body: null,
        url: null,
        scheduled_for: null,
        published_at: null,
        product_id: null,
        project_id: null,
        show_in_log: false,
      },
    });
  });

  it('trims the title and maps the checkbox, body and relations', () => {
    const result = parseContentItemForm(
      form({
        ...valid,
        title: '  Spaced  ',
        body: ' Some notes ',
        show_in_log: 'on',
        product_id: UUID,
        project_id: UUID,
      }),
      NOW
    );
    expect(result.ok && result.value).toMatchObject({
      title: 'Spaced',
      body: 'Some notes',
      show_in_log: true,
      product_id: UUID,
      project_id: UUID,
    });
  });

  it('requires a non-empty title of at most 200 characters', () => {
    const empty = parseContentItemForm(form({ ...valid, title: '   ' }), NOW);
    expect(!empty.ok && empty.errors.title).toBeTruthy();
    const long = parseContentItemForm(form({ ...valid, title: 'x'.repeat(201) }), NOW);
    expect(!long.ok && long.errors.title).toBeTruthy();
    expect(parseContentItemForm(form({ ...valid, title: 'x'.repeat(200) }), NOW).ok).toBe(true);
  });

  it('rejects values outside the allowed channel/status/locale sets', () => {
    const result = parseContentItemForm(
      form({ ...valid, channel: 'tiktok', status: 'done', locale: 'fr' }),
      NOW
    );
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(Object.keys(result.errors).sort()).toEqual(['channel', 'locale', 'status']);
  });

  it('allows only http(s) urls', () => {
    expect(parseContentItemForm(form({ ...valid, url: 'https://example.com/a' }), NOW).ok).toBe(
      true
    );
    expect(parseContentItemForm(form({ ...valid, url: 'http://example.com' }), NOW).ok).toBe(true);
    for (const url of ['javascript:alert(1)', 'ftp://x.test', 'not a url']) {
      const result = parseContentItemForm(form({ ...valid, url }), NOW);
      expect(!result.ok && result.errors.url).toBeTruthy();
    }
  });

  it('requires scheduled_for when scheduled and converts it with tz_offset', () => {
    const missing = parseContentItemForm(form({ ...valid, status: 'scheduled' }), NOW);
    expect(!missing.ok && missing.errors.scheduled_for).toBeTruthy();

    const ok = parseContentItemForm(
      form({ ...valid, status: 'scheduled', scheduled_for: '2026-10-12T09:00', tz_offset: '180' }),
      NOW
    );
    expect(ok.ok && ok.value.scheduled_for).toBe('2026-10-12T12:00:00.000Z');
  });

  it('reports an unparseable datetime', () => {
    const result = parseContentItemForm(form({ ...valid, scheduled_for: 'soon' }), NOW);
    expect(!result.ok && result.errors.scheduled_for).toBeTruthy();
  });

  it('defaults published_at to now when published, but keeps an explicit one', () => {
    const defaulted = parseContentItemForm(form({ ...valid, status: 'published' }), NOW);
    expect(defaulted.ok && defaulted.value.published_at).toBe(NOW.toISOString());

    const explicit = parseContentItemForm(
      form({ ...valid, status: 'published', published_at: '2026-10-01T08:00', tz_offset: '-120' }),
      NOW
    );
    expect(explicit.ok && explicit.value.published_at).toBe('2026-10-01T06:00:00.000Z');
  });

  it('rejects malformed relation ids', () => {
    const result = parseContentItemForm(
      form({ ...valid, product_id: 'nope', project_id: '123' }),
      NOW
    );
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual(['product_id', 'project_id']);
  });

  it('keeps the submitted raw values on failure for re-rendering', () => {
    const result = parseContentItemForm(form({ ...valid, title: '', body: 'keep me' }), NOW);
    expect(!result.ok && result.values.body).toBe('keep me');
  });
});

type Call = [method: string, ...args: unknown[]];

/** Chainable, awaitable stand-in for a postgrest builder that records every call. */
function fakeClient(result: { data: unknown; error: unknown }) {
  const calls: Call[] = [];
  const target = { schema: '', table: '' };
  const builder: Record<string, unknown> = {};
  for (const m of [
    'select',
    'eq',
    'order',
    'insert',
    'update',
    'delete',
    'single',
    'maybeSingle',
  ]) {
    builder[m] = (...args: unknown[]) => {
      calls.push([m, ...args]);
      return builder;
    };
  }
  builder.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve);
  const client = {
    schema: vi.fn((name: string) => {
      target.schema = name;
      return {
        from: (table: string) => {
          target.table = table;
          return builder;
        },
      };
    }),
  };
  return { client: client as never, calls, target };
}

const row = (over: Partial<ContentItem>): ContentItem => ({
  id: 'i',
  channel: 'blog',
  status: 'idea',
  title: 'T',
  body: null,
  locale: 'es',
  scheduled_for: null,
  published_at: null,
  url: null,
  product_id: null,
  project_id: null,
  show_in_log: true,
  meta: {},
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...over,
});

describe('listContentItems', () => {
  it('reads personal.content_items, applies filters and orders by the effective date desc', async () => {
    const { client, calls, target } = fakeClient({
      data: [
        row({ id: 'created-old', created_at: '2026-01-01T00:00:00Z' }),
        row({ id: 'scheduled', scheduled_for: '2026-12-01T00:00:00Z' }),
        row({ id: 'published', published_at: '2026-06-01T00:00:00Z' }),
      ],
      error: null,
    });
    const items = await listContentItems(client, { status: 'scheduled', channel: 'blog' });
    expect(target).toEqual({ schema: 'personal', table: 'content_items' });
    expect(calls).toContainEqual(['eq', 'status', 'scheduled']);
    expect(calls).toContainEqual(['eq', 'channel', 'blog']);
    expect(items.map((i) => i.id)).toEqual(['scheduled', 'published', 'created-old']);
  });

  it('applies no filter when none is given', async () => {
    const { client, calls } = fakeClient({ data: [], error: null });
    await listContentItems(client);
    expect(calls.some(([m]) => m === 'eq')).toBe(false);
  });

  it('throws on a Supabase error', async () => {
    const { client } = fakeClient({ data: null, error: { message: 'boom' } });
    await expect(listContentItems(client)).rejects.toThrow('boom');
  });
});

describe('getContentItem', () => {
  it('returns the row or null when absent', async () => {
    const found = fakeClient({ data: row({ id: 'x' }), error: null });
    expect((await getContentItem(found.client, 'x'))?.id).toBe('x');
    expect(found.calls).toContainEqual(['eq', 'id', 'x']);
    const missing = fakeClient({ data: null, error: null });
    expect(await getContentItem(missing.client, 'x')).toBeNull();
  });

  it('throws on a Supabase error', async () => {
    const { client } = fakeClient({ data: null, error: { message: 'nope' } });
    await expect(getContentItem(client, 'x')).rejects.toThrow('nope');
  });
});

const input: ContentItemInput = {
  title: 'T',
  channel: 'blog',
  status: 'idea',
  locale: 'es',
  body: null,
  url: null,
  scheduled_for: null,
  published_at: null,
  product_id: null,
  project_id: null,
  show_in_log: true,
};

describe('create/update/delete', () => {
  it('inserts and returns the created row', async () => {
    const { client, calls } = fakeClient({ data: row({ id: 'new' }), error: null });
    expect((await createContentItem(client, input)).id).toBe('new');
    expect(calls[0]).toEqual(['insert', input]);
  });

  it('updates by id and returns null when no row matched (RLS or missing)', async () => {
    const hit = fakeClient({ data: row({ id: 'x' }), error: null });
    expect((await updateContentItem(hit.client, 'x', input))?.id).toBe('x');
    expect(hit.calls).toContainEqual(['eq', 'id', 'x']);
    const miss = fakeClient({ data: null, error: null });
    expect(await updateContentItem(miss.client, 'x', input)).toBeNull();
  });

  it('deletes by id and reports whether a row was removed', async () => {
    const hit = fakeClient({ data: [{ id: 'x' }], error: null });
    expect(await deleteContentItem(hit.client, 'x')).toBe(true);
    expect(hit.calls).toContainEqual(['eq', 'id', 'x']);
    expect(await deleteContentItem(fakeClient({ data: [], error: null }).client, 'x')).toBe(false);
  });

  it('throws on Supabase errors in every write', async () => {
    const { client } = fakeClient({ data: null, error: { message: 'denied' } });
    await expect(createContentItem(client, input)).rejects.toThrow('denied');
    await expect(updateContentItem(client, 'x', input)).rejects.toThrow('denied');
    await expect(deleteContentItem(client, 'x')).rejects.toThrow('denied');
  });
});

describe('relation options', () => {
  it('reads products from public and projects from the personal.showcase view', async () => {
    const products = fakeClient({ data: [{ id: 'a', name: 'Orbys' }], error: null });
    expect(await listProductOptions(products.client)).toEqual([{ id: 'a', label: 'Orbys' }]);
    expect(products.target).toEqual({ schema: 'public', table: 'products' });

    const projects = fakeClient({ data: [{ id: 'b', title: 'Site' }], error: null });
    expect(await listProjectOptions(projects.client)).toEqual([{ id: 'b', label: 'Site' }]);
    expect(projects.target).toEqual({ schema: 'personal', table: 'showcase' });
  });

  it('throws on a Supabase error', async () => {
    const { client } = fakeClient({ data: null, error: { message: 'bad' } });
    await expect(listProductOptions(client)).rejects.toThrow('bad');
    await expect(listProjectOptions(client)).rejects.toThrow('bad');
  });
});

describe('dashboard helpers', () => {
  const items = [
    row({ id: 'a', status: 'scheduled', scheduled_for: '2026-10-20T00:00:00Z' }),
    row({ id: 'b', status: 'scheduled', scheduled_for: '2026-10-11T00:00:00Z' }),
    row({ id: 'c', status: 'idea' }),
    row({ id: 'd', status: 'scheduled', scheduled_for: '2026-10-15T00:00:00Z' }),
  ];

  it('counts every status, including empty ones', () => {
    expect(countByStatus(items)).toEqual({
      idea: 1,
      planned: 0,
      drafting: 0,
      scheduled: 3,
      published: 0,
    });
  });

  it('returns the next scheduled items soonest first, limited', () => {
    expect(upcomingScheduled(items, 2).map((i) => i.id)).toEqual(['b', 'd']);
  });
});

describe('isUuid / formatUtc', () => {
  it('validates uuids', () => {
    expect(isUuid(UUID)).toBe(true);
    expect(isUuid('42')).toBe(false);
    expect(isUuid("1' or '1'='1")).toBe(false);
  });

  it('formats ISO instants as UTC text and tolerates missing values', () => {
    expect(formatUtc('2026-10-10T17:30:00.000Z')).toBe('2026-10-10 17:30 UTC');
    expect(formatUtc(null)).toBe('');
  });
});
