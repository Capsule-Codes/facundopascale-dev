import { describe, expect, it } from 'vitest';

import {
  listShowcase,
  parseShowcaseForm,
  updateShowcase,
  type ShowcaseInput,
} from '../../src/lib/admin-showcase';
import { fakeClient, form } from './fake-supabase';

const UUID = '3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b';
const valid = { project_id: UUID, position: '2', summary_es: 'Hola', summary_en: 'Hi' };

describe('parseShowcaseForm', () => {
  it('accepts a valid row and trims summaries', () => {
    const result = parseShowcaseForm(
      form({ ...valid, highlighted: 'on', summary_es: '  Hola  ', summary_en: ' Hi ' })
    );
    expect(result).toEqual({
      ok: true,
      value: {
        project_id: UUID,
        highlighted: true,
        position: 2,
        summaries: { es: 'Hola', en: 'Hi' },
      },
    });
  });

  it('treats an unchecked box as not highlighted and empty summaries as allowed', () => {
    const result = parseShowcaseForm(form({ ...valid, summary_es: '', summary_en: '' }));
    expect(result.ok && result.value).toMatchObject({
      highlighted: false,
      summaries: { es: '', en: '' },
    });
  });

  it('limits each summary to 400 characters', () => {
    expect(parseShowcaseForm(form({ ...valid, summary_es: 'x'.repeat(400) })).ok).toBe(true);
    const result = parseShowcaseForm(
      form({ ...valid, summary_es: 'x'.repeat(401), summary_en: 'y'.repeat(401) })
    );
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual(['summary_en', 'summary_es']);
  });

  it('requires an integer position from 0 to 999', () => {
    for (const position of ['0', '999']) {
      expect(parseShowcaseForm(form({ ...valid, position })).ok).toBe(true);
    }
    for (const position of ['', '-1', '1000', '1.5', 'abc', '1e2']) {
      const result = parseShowcaseForm(form({ ...valid, position }));
      expect(!result.ok && result.errors.position, position).toBeTruthy();
    }
  });

  it('requires a valid project id and returns the submitted values on error', () => {
    const result = parseShowcaseForm(form({ ...valid, project_id: 'nope', position: '5000' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.project_id).toBeTruthy();
      expect(result.values).toEqual({
        project_id: 'nope',
        highlighted: false,
        position: '5000',
        summary_es: 'Hola',
        summary_en: 'Hi',
      });
    }
  });
});

describe('listShowcase', () => {
  it('reads the personal.showcase view ordered by highlighted desc then position asc', async () => {
    const { client, calls, targets } = fakeClient({
      data: [
        {
          id: 'a',
          title: 'Alpha',
          highlighted: true,
          position: 1,
          showcase_translations: { es: { summary: 'Hola' }, en: {} },
        },
        { id: 'b', title: 'Beta', highlighted: false, position: 0, showcase_translations: null },
      ],
      error: null,
    });
    const rows = await listShowcase(client);
    expect(targets).toEqual([{ schema: 'personal', table: 'showcase' }]);
    expect(calls).toContainEqual(['order', 'highlighted', { ascending: false }]);
    expect(calls).toContainEqual(['order', 'position', { ascending: true }]);
    expect(rows).toEqual([
      {
        id: 'a',
        title: 'Alpha',
        highlighted: true,
        position: 1,
        summaries: { es: 'Hola', en: '' },
      },
      { id: 'b', title: 'Beta', highlighted: false, position: 0, summaries: { es: '', en: '' } },
    ]);
  });

  it('throws on a Supabase error', async () => {
    const { client } = fakeClient({ data: null, error: { message: 'boom' } });
    await expect(listShowcase(client)).rejects.toThrow('boom');
  });
});

describe('updateShowcase', () => {
  const input: ShowcaseInput = {
    project_id: UUID,
    highlighted: true,
    position: 3,
    summaries: { es: 'Nuevo', en: 'New' },
  };

  it('writes only highlighted, position and translations to personal.project_showcase', async () => {
    const { client, calls, targets } = fakeClient(
      {
        data: { translations: { es: { summary: 'viejo', extra: 1 }, fr: { summary: 'x' } } },
        error: null,
      },
      { data: { project_id: UUID }, error: null }
    );
    expect(await updateShowcase(client, input)).toBe(true);
    expect(targets).toEqual([
      { schema: 'personal', table: 'project_showcase' },
      { schema: 'personal', table: 'project_showcase' },
    ]);
    expect(calls).toContainEqual(['eq', 'project_id', UUID]);
    const update = calls.find(([m]) => m === 'update');
    expect(update?.[1]).toEqual({
      highlighted: true,
      position: 3,
      translations: {
        es: { summary: 'Nuevo', extra: 1 },
        en: { summary: 'New' },
        fr: { summary: 'x' },
      },
    });
  });

  it('returns false and writes nothing when the row does not exist', async () => {
    const { client, calls } = fakeClient({ data: null, error: null });
    expect(await updateShowcase(client, input)).toBe(false);
    expect(calls.some(([m]) => m === 'update')).toBe(false);
  });

  it('returns false when the update matches no row (RLS)', async () => {
    const { client } = fakeClient(
      { data: { translations: {} }, error: null },
      { data: null, error: null }
    );
    expect(await updateShowcase(client, input)).toBe(false);
  });

  it('throws on read and write errors', async () => {
    const read = fakeClient({ data: null, error: { message: 'denied' } });
    await expect(updateShowcase(read.client, input)).rejects.toThrow('denied');
    const write = fakeClient(
      { data: { translations: {} }, error: null },
      { data: null, error: { message: 'rls' } }
    );
    await expect(updateShowcase(write.client, input)).rejects.toThrow('rls');
  });
});
