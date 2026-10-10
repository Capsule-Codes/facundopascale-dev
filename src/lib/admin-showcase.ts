/**
 * Showcase editing for `/admin/showcase`. Rows are read from the
 * `personal.showcase` view (published projects joined with titles) and written
 * to `personal.project_showcase`. Writes run through the signed-in user's
 * client, so RLS (`personal.is_admin()`) stays the real authority.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  FORM_LOCALES,
  POSITION_ERROR,
  check,
  formText,
  isUuid,
  lengthError,
  mergeTranslations,
  parsePosition,
  translationField,
  type Locale,
} from './admin-form';

export const SUMMARY_MAX = 400;

export type ShowcaseEntry = {
  id: string;
  title: string;
  highlighted: boolean;
  position: number;
  summaries: Record<Locale, string>;
};

export type ShowcaseInput = {
  project_id: string;
  highlighted: boolean;
  position: number;
  summaries: Record<Locale, string>;
};

/** Raw submitted strings, used to re-render a row after a validation error. */
export type ShowcaseFormValues = {
  project_id: string;
  highlighted: boolean;
  position: string;
  summary_es: string;
  summary_en: string;
};

export type ShowcaseParseResult =
  | { ok: true; value: ShowcaseInput }
  | {
      ok: false;
      errors: Partial<Record<keyof ShowcaseFormValues, string>>;
      values: ShowcaseFormValues;
    };

export function parseShowcaseForm(form: FormData): ShowcaseParseResult {
  const values: ShowcaseFormValues = {
    project_id: formText(form, 'project_id').trim(),
    highlighted: form.get('highlighted') !== null,
    position: formText(form, 'position').trim(),
    summary_es: formText(form, 'summary_es').trim(),
    summary_en: formText(form, 'summary_en').trim(),
  };
  const errors: Partial<Record<keyof ShowcaseFormValues, string>> = {};

  if (!isUuid(values.project_id)) errors.project_id = 'Unknown project.';
  const position = parsePosition(values.position);
  if (position === null) errors.position = POSITION_ERROR;
  if (values.summary_es.length > SUMMARY_MAX) {
    errors.summary_es = lengthError('Spanish summary', SUMMARY_MAX);
  }
  if (values.summary_en.length > SUMMARY_MAX) {
    errors.summary_en = lengthError('English summary', SUMMARY_MAX);
  }

  if (Object.keys(errors).length > 0 || position === null) return { ok: false, errors, values };

  return {
    ok: true,
    value: {
      project_id: values.project_id,
      highlighted: values.highlighted,
      position,
      summaries: { es: values.summary_es, en: values.summary_en },
    },
  };
}

type Client = Pick<SupabaseClient, 'schema'>;

type ShowcaseViewRow = {
  id: string;
  title: string;
  highlighted: boolean;
  position: number;
  showcase_translations: unknown;
};

/** Published projects, highlighted first, then by position (same order as the public site). */
export async function listShowcase(client: Client): Promise<ShowcaseEntry[]> {
  const { data } = check(
    await client
      .schema('personal')
      .from('showcase')
      .select('id, title, highlighted, position, showcase_translations')
      .order('highlighted', { ascending: false })
      .order('position', { ascending: true }),
    'Could not load the showcase'
  );
  return ((data ?? []) as ShowcaseViewRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    highlighted: row.highlighted,
    position: row.position,
    summaries: Object.fromEntries(
      FORM_LOCALES.map((locale) => [
        locale,
        translationField(row.showcase_translations, locale, 'summary'),
      ])
    ) as Record<Locale, string>,
  }));
}

/**
 * Updates highlighted, position and the per-locale summaries, keeping any other
 * translation keys. Returns false when no row matched (missing id, or RLS hid it).
 */
export async function updateShowcase(client: Client, input: ShowcaseInput): Promise<boolean> {
  const table = () => client.schema('personal').from('project_showcase');
  const { data: current } = check(
    await table().select('translations').eq('project_id', input.project_id).maybeSingle(),
    'Could not load the showcase entry'
  );
  if (!current) return false;

  const translations = mergeTranslations(
    (current as { translations: unknown }).translations,
    Object.fromEntries(FORM_LOCALES.map((locale) => [locale, { summary: input.summaries[locale] }]))
  );
  const { data } = check(
    await table()
      .update({ highlighted: input.highlighted, position: input.position, translations })
      .eq('project_id', input.project_id)
      .select('project_id')
      .maybeSingle(),
    'Could not update the showcase entry'
  );
  return data !== null && data !== undefined;
}
