import { describe, expect, it } from 'vitest';

import {
  getSiteSettings,
  parseSettingsForm,
  updateSiteSettings,
  type SettingsInput,
} from '../../src/lib/admin-settings';
import { fakeClient, form } from './fake-supabase';

const valid = { email: '', bio_es: 'Hola', bio_en: 'Hi' };

describe('parseSettingsForm', () => {
  it('accepts a minimal form: empty email and no socials', () => {
    expect(parseSettingsForm(form(valid))).toEqual({
      ok: true,
      value: {
        email: null,
        socials: {},
        translations: { es: { bio: 'Hola' }, en: { bio: 'Hi' } },
      },
    });
  });

  it('trims and validates the email', () => {
    const ok = parseSettingsForm(form({ ...valid, email: ' me@example.com ' }));
    expect(ok.ok && ok.value.email).toBe('me@example.com');
    for (const email of ['nope', 'a@b', 'a b@c.d', '@c.d']) {
      const result = parseSettingsForm(form({ ...valid, email }));
      expect(!result.ok && result.errors.email, email).toBeTruthy();
    }
  });

  it('collects the five known social urls, trimmed, and omits empty ones', () => {
    const result = parseSettingsForm(
      form({
        ...valid,
        social_github: ' https://github.com/me ',
        social_x: '',
        social_youtube: 'http://youtube.com/@me',
      })
    );
    expect(result.ok && result.value.socials).toEqual({
      github: 'https://github.com/me',
      youtube: 'http://youtube.com/@me',
    });
  });

  it('rejects non-http(s) social urls with a per-field error', () => {
    const result = parseSettingsForm(
      form({ ...valid, social_linkedin: 'javascript:alert(1)', social_instagram: 'insta' })
    );
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual([
      'social_instagram',
      'social_linkedin',
    ]);
  });

  it('limits each bio to 2000 characters', () => {
    expect(parseSettingsForm(form({ ...valid, bio_es: 'x'.repeat(2000) })).ok).toBe(true);
    const result = parseSettingsForm(form({ ...valid, bio_en: 'x'.repeat(2001) }));
    expect(!result.ok && result.errors.bio_en).toBeTruthy();
  });

  it('returns raw values on error', () => {
    const result = parseSettingsForm(form({ ...valid, email: 'bad', social_x: 'also bad' }));
    expect(!result.ok && result.values).toMatchObject({
      email: 'bad',
      social_x: 'also bad',
      bio_es: 'Hola',
    });
  });
});

describe('getSiteSettings', () => {
  it('reads personal.site_settings row 1 and returns null when absent', async () => {
    const found = fakeClient({
      data: { id: 1, email: 'a@b.co', socials: { github: 'https://g' }, translations: null },
      error: null,
    });
    const row = await getSiteSettings(found.client);
    expect(found.targets).toEqual([{ schema: 'personal', table: 'site_settings' }]);
    expect(found.calls).toContainEqual(['eq', 'id', 1]);
    expect(row?.email).toBe('a@b.co');
    expect(await getSiteSettings(fakeClient({ data: null, error: null }).client)).toBeNull();
  });

  it('throws on a Supabase error', async () => {
    const { client } = fakeClient({ data: null, error: { message: 'boom' } });
    await expect(getSiteSettings(client)).rejects.toThrow('boom');
  });
});

describe('updateSiteSettings', () => {
  const input: SettingsInput = {
    email: 'me@example.com',
    socials: { github: 'https://github.com/me', x: 'https://x.com/me' },
    translations: { es: { bio: 'Nueva' }, en: { bio: 'New' } },
  };

  const current = {
    id: 1,
    email: 'old@example.com',
    socials: {
      github: 'https://github.com/old',
      youtube: 'https://youtube.com/old',
      mastodon: 'https://mastodon.social/@me',
    },
    translations: { es: { bio: 'vieja', pronouns: 'el' }, fr: { bio: 'salut' } },
  };

  it('updates only email, socials and translations, merging and removing known social keys', async () => {
    const { client, calls, targets } = fakeClient(
      { data: current, error: null },
      { data: { id: 1 }, error: null }
    );
    expect(await updateSiteSettings(client, input)).toBe(true);
    expect(targets.every((t) => t.schema === 'personal' && t.table === 'site_settings')).toBe(true);
    const update = calls.find(([m]) => m === 'update')?.[1] as Record<string, unknown>;
    expect(Object.keys(update).sort()).toEqual(['email', 'socials', 'translations']);
    expect(update.email).toBe('me@example.com');
    // github replaced, x added, youtube (known, now empty) removed, mastodon (unknown) kept.
    expect(update.socials).toEqual({
      github: 'https://github.com/me',
      x: 'https://x.com/me',
      mastodon: 'https://mastodon.social/@me',
    });
    expect(update.translations).toEqual({
      es: { bio: 'Nueva', pronouns: 'el' },
      en: { bio: 'New' },
      fr: { bio: 'salut' },
    });
    expect(calls.filter(([m, k, v]) => m === 'eq' && k === 'id' && v === 1)).toHaveLength(2);
  });

  it('handles missing socials and translations on the stored row', async () => {
    const { client, calls } = fakeClient(
      { data: { id: 1, email: null, socials: null, translations: null }, error: null },
      { data: { id: 1 }, error: null }
    );
    await updateSiteSettings(client, { ...input, email: null });
    const update = calls.find(([m]) => m === 'update')?.[1] as Record<string, unknown>;
    expect(update.email).toBeNull();
    expect(update.socials).toEqual(input.socials);
  });

  it('returns false when there is no row or the update matched none', async () => {
    const missing = fakeClient({ data: null, error: null });
    expect(await updateSiteSettings(missing.client, input)).toBe(false);
    expect(missing.calls.some(([m]) => m === 'update')).toBe(false);
    const hidden = fakeClient({ data: current, error: null }, { data: null, error: null });
    expect(await updateSiteSettings(hidden.client, input)).toBe(false);
  });

  it('throws on read and write errors', async () => {
    const read = fakeClient({ data: null, error: { message: 'denied' } });
    await expect(updateSiteSettings(read.client, input)).rejects.toThrow('denied');
    const write = fakeClient(
      { data: current, error: null },
      { data: null, error: { message: 'rls' } }
    );
    await expect(updateSiteSettings(write.client, input)).rejects.toThrow('rls');
  });
});
