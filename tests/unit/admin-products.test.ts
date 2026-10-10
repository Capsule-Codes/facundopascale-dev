import { describe, expect, it } from 'vitest';

import {
  getProduct,
  listProducts,
  parseProductForm,
  updateProduct,
  type ProductInput,
} from '../../src/lib/admin-products';
import { fakeClient, form } from './fake-supabase';

const valid = {
  status: 'live',
  url: '',
  position: '1',
  tagline_es: 'Hola',
  tagline_en: 'Hi',
  description_es: 'Descripcion',
  description_en: 'Description',
};

describe('parseProductForm', () => {
  it('accepts a valid form and normalises optional fields', () => {
    const result = parseProductForm(
      form({ ...valid, url: ' https://orbys.app ', show_on_personal: 'on', tagline_es: ' Hola ' })
    );
    expect(result).toEqual({
      ok: true,
      value: {
        status: 'live',
        url: 'https://orbys.app',
        show_on_personal: true,
        position: 1,
        translations: {
          es: { tagline: 'Hola', description: 'Descripcion' },
          en: { tagline: 'Hi', description: 'Description' },
        },
      },
    });
  });

  it('maps an empty url to null and an unchecked box to false', () => {
    const result = parseProductForm(form(valid));
    expect(result.ok && result.value).toMatchObject({ url: null, show_on_personal: false });
  });

  it('restricts status to idea, beta, live and sunset', () => {
    for (const status of ['idea', 'beta', 'live', 'sunset']) {
      expect(parseProductForm(form({ ...valid, status })).ok, status).toBe(true);
    }
    const result = parseProductForm(form({ ...valid, status: 'archived' }));
    expect(!result.ok && result.errors.status).toBeTruthy();
  });

  it('allows only http(s) urls', () => {
    expect(parseProductForm(form({ ...valid, url: 'http://a.test' })).ok).toBe(true);
    for (const url of ['javascript:alert(1)', 'ftp://a.test', 'not a url']) {
      const result = parseProductForm(form({ ...valid, url }));
      expect(!result.ok && result.errors.url, url).toBeTruthy();
    }
  });

  it('requires an integer position from 0 to 999', () => {
    expect(parseProductForm(form({ ...valid, position: '999' })).ok).toBe(true);
    for (const position of ['', '-1', '1000', '2.5', 'x']) {
      const result = parseProductForm(form({ ...valid, position }));
      expect(!result.ok && result.errors.position, position).toBeTruthy();
    }
  });

  it('limits taglines to 200 and descriptions to 2000 characters', () => {
    expect(parseProductForm(form({ ...valid, tagline_en: 'x'.repeat(200) })).ok).toBe(true);
    const result = parseProductForm(
      form({ ...valid, tagline_en: 'x'.repeat(201), description_es: 'y'.repeat(2001) })
    );
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual([
      'description_es',
      'tagline_en',
    ]);
  });

  it('returns raw values on error so the form can re-render', () => {
    const result = parseProductForm(form({ ...valid, status: 'nope', show_on_personal: 'on' }));
    expect(!result.ok && result.values).toMatchObject({ status: 'nope', show_on_personal: true });
  });
});

describe('listProducts', () => {
  it('reads public.products ordered by position', async () => {
    const { client, calls, targets } = fakeClient({
      data: [{ slug: 'orbys', name: 'Orbys', status: 'live', show_on_personal: true, position: 0 }],
      error: null,
    });
    const rows = await listProducts(client);
    expect(targets).toEqual([{ schema: 'public', table: 'products' }]);
    expect(calls).toContainEqual(['order', 'position', { ascending: true }]);
    expect(rows).toHaveLength(1);
  });

  it('throws on a Supabase error', async () => {
    const { client } = fakeClient({ data: null, error: { message: 'boom' } });
    await expect(listProducts(client)).rejects.toThrow('boom');
  });
});

describe('getProduct', () => {
  it('filters by slug and returns null when absent', async () => {
    const found = fakeClient({
      data: {
        id: 'p',
        slug: 'orbys',
        name: 'Orbys',
        status: 'live',
        url: null,
        show_on_personal: true,
        position: 0,
        translations: { es: { tagline: 'Hola', description: 'D' } },
      },
      error: null,
    });
    const product = await getProduct(found.client, 'orbys');
    expect(found.calls).toContainEqual(['eq', 'slug', 'orbys']);
    expect(product?.translations?.es?.tagline).toBe('Hola');
    expect(await getProduct(fakeClient({ data: null, error: null }).client, 'x')).toBeNull();
  });

  it('throws on a Supabase error', async () => {
    const { client } = fakeClient({ data: null, error: { message: 'nope' } });
    await expect(getProduct(client, 'x')).rejects.toThrow('nope');
  });
});

describe('updateProduct', () => {
  const input: ProductInput = {
    status: 'beta',
    url: 'https://a.test',
    show_on_personal: false,
    position: 4,
    translations: {
      es: { tagline: 'T-es', description: 'D-es' },
      en: { tagline: 'T-en', description: 'D-en' },
    },
  };

  it('updates only the allowed columns and merges translations, keeping unknown keys', async () => {
    const { client, calls, targets } = fakeClient(
      {
        data: {
          id: 'p',
          slug: 'orbys',
          name: 'Orbys',
          status: 'live',
          url: null,
          show_on_personal: true,
          position: 0,
          translations: {
            es: { tagline: 'old', description: 'old', cta: 'Probar' },
            fr: { tagline: 'salut' },
          },
        },
        error: null,
      },
      { data: { slug: 'orbys' }, error: null }
    );
    expect(await updateProduct(client, 'orbys', input)).toBe(true);
    expect(targets.every((t) => t.schema === 'public' && t.table === 'products')).toBe(true);
    const update = calls.find(([m]) => m === 'update')?.[1] as Record<string, unknown>;
    expect(Object.keys(update).sort()).toEqual([
      'position',
      'show_on_personal',
      'status',
      'translations',
      'url',
    ]);
    expect(update).not.toHaveProperty('slug');
    expect(update).not.toHaveProperty('name');
    expect(update.translations).toEqual({
      es: { tagline: 'T-es', description: 'D-es', cta: 'Probar' },
      en: { tagline: 'T-en', description: 'D-en' },
      fr: { tagline: 'salut' },
    });
    expect(calls.filter(([m, k]) => m === 'eq' && k === 'slug')).toHaveLength(2);
  });

  it('returns false without writing when the slug is unknown', async () => {
    const { client, calls } = fakeClient({ data: null, error: null });
    expect(await updateProduct(client, 'ghost', input)).toBe(false);
    expect(calls.some(([m]) => m === 'update')).toBe(false);
  });

  it('returns false when the update matched no row and throws on errors', async () => {
    const product = {
      id: 'p',
      slug: 's',
      name: 'N',
      status: 'live',
      url: null,
      show_on_personal: true,
      position: 0,
      translations: null,
    };
    const none = fakeClient({ data: product, error: null }, { data: null, error: null });
    expect(await updateProduct(none.client, 's', input)).toBe(false);
    const bad = fakeClient(
      { data: product, error: null },
      { data: null, error: { message: 'rls' } }
    );
    await expect(updateProduct(bad.client, 's', input)).rejects.toThrow('rls');
  });
});
