/**
 * Helpers shared by the `/admin` showcase, products and settings modules:
 * form-field readers, validators and the translations merge. Free of Astro
 * types so everything stays unit-testable.
 */

export type Locale = 'es' | 'en';
export const FORM_LOCALES: readonly Locale[] = ['es', 'en'];

export const POSITION_MIN = 0;
export const POSITION_MAX = 999;

export const formText = (form: FormData, key: string) => {
  const value = form.get(key);
  return typeof value === 'string' ? value : '';
};

export const isHttpUrl = (value: string) => {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

/** Deliberately loose: one `@`, no spaces, a dot in the domain. */
export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

/** Whole number from 0 to 999, or null. */
export function parsePosition(value: string): number | null {
  if (!/^\d{1,3}$/.test(value)) return null;
  const position = Number(value);
  return position >= POSITION_MIN && position <= POSITION_MAX ? position : null;
}

export const POSITION_ERROR = `Position must be a whole number from ${POSITION_MIN} to ${POSITION_MAX}.`;

export const lengthError = (label: string, max: number) =>
  `${label} must be ${max} characters or fewer.`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Merges `patch` into stored translations per locale and per key, so locales
 * and keys the admin does not edit (other languages, extra fields) survive.
 */
export function mergeTranslations(
  existing: unknown,
  patch: Partial<Record<Locale, Record<string, string>>>
): Record<string, unknown> {
  const merged: Record<string, unknown> = isRecord(existing) ? { ...existing } : {};
  for (const locale of FORM_LOCALES) {
    const fields = patch[locale];
    if (!fields) continue;
    const current = merged[locale];
    merged[locale] = { ...(isRecord(current) ? current : {}), ...fields };
  }
  return merged;
}

/** String value of `translations[locale][key]`, or ''. */
export function translationField(translations: unknown, locale: Locale, key: string): string {
  if (!isRecord(translations)) return '';
  const fields = translations[locale];
  if (!isRecord(fields)) return '';
  const value = fields[key];
  return typeof value === 'string' ? value : '';
}

export function check<T extends { error: { message: string } | null }>(result: T, what: string): T {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result;
}

/** Shown when a write fails for a reason the user cannot fix (DB or RLS error). */
export const SAVE_FAILED = 'Could not save your changes. Please try again.';
