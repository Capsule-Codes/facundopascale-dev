/**
 * Content calendar logic for `/admin/content`, kept free of Astro types so it
 * can be unit-tested with fakes. Writes run through the signed-in user's
 * Supabase client, so RLS (`personal.is_admin()`) stays the real authority.
 * Repository functions throw on Supabase errors; "not found" is `null`/`false`.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export const CHANNELS = ['youtube', 'instagram', 'linkedin', 'newsletter', 'blog', 'ship'] as const;
export const STATUSES = ['idea', 'planned', 'drafting', 'scheduled', 'published'] as const;
export const LOCALES = ['es', 'en'] as const;

export type Channel = (typeof CHANNELS)[number];
export type Status = (typeof STATUSES)[number];
export type Locale = (typeof LOCALES)[number];

export type ContentItem = {
  id: string;
  channel: Channel;
  status: Status;
  title: string;
  body: string | null;
  locale: Locale;
  scheduled_for: string | null;
  published_at: string | null;
  url: string | null;
  product_id: string | null;
  project_id: string | null;
  show_in_log: boolean;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

/** Writable columns; everything else is owned by the database. */
export type ContentItemInput = Pick<
  ContentItem,
  | 'title'
  | 'channel'
  | 'status'
  | 'locale'
  | 'body'
  | 'url'
  | 'scheduled_for'
  | 'published_at'
  | 'product_id'
  | 'project_id'
  | 'show_in_log'
>;

/** Raw submitted strings, used to re-render the form after a validation error. */
export type ContentFormValues = {
  title: string;
  channel: string;
  status: string;
  locale: string;
  body: string;
  url: string;
  scheduled_for: string;
  published_at: string;
  product_id: string;
  project_id: string;
  show_in_log: boolean;
};

export type ParseResult =
  | { ok: true; value: ContentItemInput }
  | {
      ok: false;
      errors: Partial<Record<keyof ContentFormValues, string>>;
      values: ContentFormValues;
    };

const TITLE_MAX = 200;
const LOCAL_DATETIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Converts a `datetime-local` value to ISO UTC. `tzOffset` is the browser's
 * `Date#getTimezoneOffset()` (minutes UTC is ahead of local time); a missing
 * or invalid offset means the value is already UTC. Returns null when the
 * value is not a real calendar date and time.
 */
export function localInputToIso(value: string, tzOffset?: string | null): string | null {
  const match = LOCAL_DATETIME.exec(value);
  if (!match) return null;
  const [year, month, day, hour, minute, second] = match.slice(1).map((part) => Number(part ?? 0));
  const utc = Date.UTC(year!, month! - 1, day!, hour!, minute!, second!);
  const check = new Date(utc);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month! - 1 ||
    check.getUTCDate() !== day ||
    check.getUTCHours() !== hour ||
    check.getUTCMinutes() !== minute
  ) {
    return null;
  }
  const offset = tzOffset && /^-?\d+$/.test(tzOffset) ? Number(tzOffset) : 0;
  const minutes = Math.abs(offset) <= 14 * 60 ? offset : 0;
  return new Date(utc + minutes * 60_000).toISOString();
}

const text = (form: FormData, key: string) => {
  const value = form.get(key);
  return typeof value === 'string' ? value : '';
};

const isOneOf = <T extends string>(set: readonly T[], value: string): value is T =>
  (set as readonly string[]).includes(value);

const isHttpUrl = (value: string) => {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

export function parseContentItemForm(form: FormData, now: Date): ParseResult {
  const values: ContentFormValues = {
    title: text(form, 'title').trim(),
    channel: text(form, 'channel'),
    status: text(form, 'status'),
    locale: text(form, 'locale'),
    body: text(form, 'body').trim(),
    url: text(form, 'url').trim(),
    scheduled_for: text(form, 'scheduled_for').trim(),
    published_at: text(form, 'published_at').trim(),
    product_id: text(form, 'product_id').trim(),
    project_id: text(form, 'project_id').trim(),
    show_in_log: form.get('show_in_log') !== null,
  };
  const errors: Partial<Record<keyof ContentFormValues, string>> = {};
  const tzOffset = text(form, 'tz_offset');

  if (!values.title) errors.title = 'Title is required.';
  else if (values.title.length > TITLE_MAX) {
    errors.title = `Title must be ${TITLE_MAX} characters or fewer.`;
  }
  if (!isOneOf(CHANNELS, values.channel)) errors.channel = 'Choose a channel.';
  if (!isOneOf(STATUSES, values.status)) errors.status = 'Choose a status.';
  if (!isOneOf(LOCALES, values.locale)) errors.locale = 'Choose a language.';
  if (values.url && !isHttpUrl(values.url)) errors.url = 'Enter a full http(s) URL.';
  for (const key of ['product_id', 'project_id'] as const) {
    if (values[key] && !UUID.test(values[key])) errors[key] = 'Choose a valid option.';
  }

  let scheduledFor: string | null = null;
  if (values.scheduled_for) {
    scheduledFor = localInputToIso(values.scheduled_for, tzOffset);
    if (!scheduledFor) errors.scheduled_for = 'Enter a valid date and time.';
  } else if (values.status === 'scheduled') {
    errors.scheduled_for = 'A scheduled item needs a date and time.';
  }

  let publishedAt: string | null = null;
  if (values.published_at) {
    publishedAt = localInputToIso(values.published_at, tzOffset);
    if (!publishedAt) errors.published_at = 'Enter a valid date and time.';
  } else if (values.status === 'published') {
    publishedAt = now.toISOString();
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors, values };

  return {
    ok: true,
    value: {
      title: values.title,
      channel: values.channel as Channel,
      status: values.status as Status,
      locale: values.locale as Locale,
      body: values.body || null,
      url: values.url || null,
      scheduled_for: scheduledFor,
      published_at: publishedAt,
      product_id: values.product_id || null,
      project_id: values.project_id || null,
      show_in_log: values.show_in_log,
    },
  };
}

type Client = Pick<SupabaseClient, 'schema'>;

const items = (client: Client) => client.schema('personal').from('content_items');

function check<T extends { error: { message: string } | null }>(result: T, what: string): T {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result;
}

/** Effective calendar date: when it ships, else when it shipped, else when it was created. */
const sortKey = (item: ContentItem) =>
  Date.parse(item.scheduled_for ?? item.published_at ?? item.created_at);

export async function listContentItems(
  client: Client,
  filters: { status?: Status | undefined; channel?: Channel | undefined } = {}
): Promise<ContentItem[]> {
  let query = items(client).select('*');
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.channel) query = query.eq('channel', filters.channel);
  // PostgREST cannot order by coalesce(); the table is small, so sort here.
  const { data } = check(await query, 'Could not load content items');
  return ((data ?? []) as ContentItem[]).sort((a, b) => sortKey(b) - sortKey(a));
}

export async function getContentItem(client: Client, id: string): Promise<ContentItem | null> {
  const { data } = check(
    await items(client).select('*').eq('id', id).maybeSingle(),
    'Could not load the content item'
  );
  return (data as ContentItem | null) ?? null;
}

export async function createContentItem(
  client: Client,
  input: ContentItemInput
): Promise<ContentItem> {
  const { data } = check(
    await items(client).insert(input).select().single(),
    'Could not create the content item'
  );
  return data as ContentItem;
}

/** Returns null when no row matched (missing id, or RLS hid it). */
export async function updateContentItem(
  client: Client,
  id: string,
  input: ContentItemInput
): Promise<ContentItem | null> {
  const { data } = check(
    await items(client).update(input).eq('id', id).select().maybeSingle(),
    'Could not update the content item'
  );
  return (data as ContentItem | null) ?? null;
}

/** True when a row was actually removed. */
export async function deleteContentItem(client: Client, id: string): Promise<boolean> {
  const { data } = check(
    await items(client).delete().eq('id', id).select('id'),
    'Could not delete the content item'
  );
  return ((data as unknown[] | null) ?? []).length > 0;
}

export type RelationOption = { id: string; label: string };

export async function listProductOptions(client: Client): Promise<RelationOption[]> {
  const { data } = check(
    await client.schema('public').from('products').select('id, name').order('name'),
    'Could not load products'
  );
  return ((data ?? []) as { id: string; name: string }[]).map((p) => ({
    id: p.id,
    label: p.name,
  }));
}

export async function listProjectOptions(client: Client): Promise<RelationOption[]> {
  const { data } = check(
    await client.schema('personal').from('showcase').select('id, title').order('title'),
    'Could not load projects'
  );
  return ((data ?? []) as { id: string; title: string }[]).map((p) => ({
    id: p.id,
    label: p.title,
  }));
}

export function countByStatus(list: ContentItem[]): Record<Status, number> {
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
  for (const item of list) counts[item.status] += 1;
  return counts;
}

/** Scheduled items, soonest first. */
export function upcomingScheduled(list: ContentItem[], limit: number): ContentItem[] {
  return list
    .filter((item) => item.status === 'scheduled' && item.scheduled_for)
    .sort((a, b) => Date.parse(a.scheduled_for!) - Date.parse(b.scheduled_for!))
    .slice(0, limit);
}

export const isUuid = (value: string) => UUID.test(value);

/** Server-side text for an instant; a client script upgrades it to local time. */
export function formatUtc(iso: string | null | undefined): string {
  return iso ? `${iso.slice(0, 16).replace('T', ' ')} UTC` : '';
}
