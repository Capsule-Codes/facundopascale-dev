/**
 * Site settings editing for `/admin/settings` (`personal.site_settings`, single
 * row id = 1). Edits the contact email, five known social links and the
 * per-locale bio; unknown social keys and translation keys are preserved.
 * Writes run through the signed-in user's client, so RLS stays the authority.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  check,
  formText,
  isEmail,
  isHttpUrl,
  lengthError,
  mergeTranslations,
  translationField,
} from './admin-form';

export const SOCIAL_KEYS = ['youtube', 'linkedin', 'instagram', 'github', 'x'] as const;
export type SocialKey = (typeof SOCIAL_KEYS)[number];

export const BIO_MAX = 2000;
const SETTINGS_ID = 1;

export type SiteSettings = {
  id: number;
  email: string | null;
  socials: Record<string, string> | null;
  translations: Partial<Record<string, Partial<Record<string, string>>>> | null;
};

export type SettingsInput = {
  email: string | null;
  socials: Partial<Record<SocialKey, string>>;
  translations: { es: { bio: string }; en: { bio: string } };
};

/** Raw submitted strings, used to re-render the form after a validation error. */
export type SettingsFormValues = {
  email: string;
  social_youtube: string;
  social_linkedin: string;
  social_instagram: string;
  social_github: string;
  social_x: string;
  bio_es: string;
  bio_en: string;
};

export type SettingsParseResult =
  | { ok: true; value: SettingsInput }
  | {
      ok: false;
      errors: Partial<Record<keyof SettingsFormValues, string>>;
      values: SettingsFormValues;
    };

export function toSettingsFormValues(row: SiteSettings): SettingsFormValues {
  const social = (key: SocialKey) => row.socials?.[key] ?? '';
  return {
    email: row.email ?? '',
    social_youtube: social('youtube'),
    social_linkedin: social('linkedin'),
    social_instagram: social('instagram'),
    social_github: social('github'),
    social_x: social('x'),
    bio_es: translationField(row.translations, 'es', 'bio'),
    bio_en: translationField(row.translations, 'en', 'bio'),
  };
}

export function parseSettingsForm(form: FormData): SettingsParseResult {
  const values: SettingsFormValues = {
    email: formText(form, 'email').trim(),
    social_youtube: formText(form, 'social_youtube').trim(),
    social_linkedin: formText(form, 'social_linkedin').trim(),
    social_instagram: formText(form, 'social_instagram').trim(),
    social_github: formText(form, 'social_github').trim(),
    social_x: formText(form, 'social_x').trim(),
    bio_es: formText(form, 'bio_es').trim(),
    bio_en: formText(form, 'bio_en').trim(),
  };
  const errors: Partial<Record<keyof SettingsFormValues, string>> = {};

  if (values.email && !isEmail(values.email)) errors.email = 'Enter a valid email address.';
  const socials: Partial<Record<SocialKey, string>> = {};
  for (const key of SOCIAL_KEYS) {
    const url = values[`social_${key}`];
    if (!url) continue;
    if (isHttpUrl(url)) socials[key] = url;
    else errors[`social_${key}`] = 'Enter a full http(s) URL.';
  }
  if (values.bio_es.length > BIO_MAX) errors.bio_es = lengthError('Spanish bio', BIO_MAX);
  if (values.bio_en.length > BIO_MAX) errors.bio_en = lengthError('English bio', BIO_MAX);

  if (Object.keys(errors).length > 0) return { ok: false, errors, values };

  return {
    ok: true,
    value: {
      email: values.email || null,
      socials,
      translations: { es: { bio: values.bio_es }, en: { bio: values.bio_en } },
    },
  };
}

type Client = Pick<SupabaseClient, 'schema'>;

const settings = (client: Client) => client.schema('personal').from('site_settings');

export async function getSiteSettings(client: Client): Promise<SiteSettings | null> {
  const { data } = check(
    await settings(client).select('*').eq('id', SETTINGS_ID).maybeSingle(),
    'Could not load the site settings'
  );
  return (data as SiteSettings | null) ?? null;
}

/**
 * Writes email, socials and translations. Known social keys are replaced (an
 * empty one is removed); unknown keys and translation fields are kept. Returns
 * false when no row matched.
 */
export async function updateSiteSettings(client: Client, input: SettingsInput): Promise<boolean> {
  const current = await getSiteSettings(client);
  if (!current) return false;

  const socials: Record<string, string> = { ...current.socials };
  for (const key of SOCIAL_KEYS) delete socials[key];
  Object.assign(socials, input.socials);

  const { data } = check(
    await settings(client)
      .update({
        email: input.email,
        socials,
        translations: mergeTranslations(current.translations, input.translations),
      })
      .eq('id', SETTINGS_ID)
      .select('id')
      .maybeSingle(),
    'Could not update the site settings'
  );
  return data !== null && data !== undefined;
}
