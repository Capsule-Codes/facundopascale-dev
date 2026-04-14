import type { Locale } from './i18n';

type WithTranslationId = {
  id: string;
  data: { lang: Locale; translationId: string };
};

export function findTranslation<T extends WithTranslationId>(
  current: T,
  all: T[],
  targetLocale: Locale
): T | undefined {
  if (current.data.lang === targetLocale) return undefined;
  return all.find(
    (doc) => doc.data.translationId === current.data.translationId && doc.data.lang === targetLocale
  );
}
