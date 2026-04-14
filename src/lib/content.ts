import type { Locale } from './i18n';

type PublishableEntry = {
  data: { publishedAt: Date; draft?: boolean; lang: Locale };
};

export function isPublished<T extends PublishableEntry>(entry: T, now: Date = new Date()): boolean {
  if (entry.data.draft) return false;
  return entry.data.publishedAt.getTime() <= now.getTime();
}

export function filterPublished<T extends PublishableEntry>(
  entries: T[],
  now: Date = new Date()
): T[] {
  return entries.filter((e) => isPublished(e, now));
}

export function byLocale<T extends PublishableEntry>(entries: T[], locale: Locale): T[] {
  return entries.filter((e) => e.data.lang === locale);
}

export function sortByDate<T extends PublishableEntry>(entries: T[]): T[] {
  return [...entries].sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}
