/**
 * Sending a `newsletter` content item from `/admin/content/[id]`: a test email
 * to the signed-in admin, and a Resend broadcast to the item's language segment
 * (now, or scheduled at `scheduled_for`). Free of Astro types; every dependency
 * is injected so the rules are unit-testable without the network.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import type { ContentItem, Locale, Status } from './admin-content';
import type { SegmentIds } from './newsletter';
import { renderNewsletterEmail } from './newsletter-email';

type ResendResult<T> = { data: T | null; error: { message: string; name?: string } | null };

/** The slice of the Resend SDK used here (SDK 6.11: `emails.send`, `broadcasts.create`). */
export interface BroadcastResend {
  emails: {
    send(payload: {
      from: string;
      to: string;
      subject: string;
      html: string;
      text: string;
    }): Promise<ResendResult<{ id: string }>>;
  };
  broadcasts: {
    create(payload: {
      segmentId: string;
      from: string;
      subject: string;
      html: string;
      text: string;
      topicId?: string;
      name?: string;
      send: true;
      scheduledAt?: string;
    }): Promise<ResendResult<{ id: string }>>;
  };
}

export interface BroadcastUpdate {
  status: Status;
  published_at: string | null;
  meta: Record<string, unknown>;
}

/** Persists the outcome of a send. Throws when the row could not be updated. */
export interface ContentRepo {
  markBroadcast(id: string, update: BroadcastUpdate): Promise<void>;
}

export interface NewsletterConfig {
  segments: SegmentIds;
  topicId: string | undefined;
  from: string;
  siteUrl: string;
}

export interface NewsletterDeps {
  resend: BroadcastResend | null;
  repo: ContentRepo;
  now: () => Date;
  config: NewsletterConfig;
}

export type Availability = { ok: true; segmentId: string } | { ok: false; reason: string };

/** Whether the item's language can be sent to; the reason is shown to the admin. */
export function newsletterAvailability(deps: NewsletterDeps, locale: Locale): Availability {
  if (!deps.resend) return { ok: false, reason: 'RESEND_API_KEY is not set.' };
  const segmentId = deps.config.segments[locale];
  if (!segmentId)
    return { ok: false, reason: `RESEND_SEGMENT_${locale.toUpperCase()} is not set.` };
  return { ok: true, segmentId };
}

export interface BroadcastState {
  id: string;
  sentAt: string | null;
  scheduledFor: string | null;
}

const str = (value: unknown) => (typeof value === 'string' && value ? value : null);

/** The broadcast recorded in `meta`, or null when nothing was sent yet. */
export function broadcastState(meta: Record<string, unknown>): BroadcastState | null {
  const id = str(meta.broadcast_id);
  if (!id) return null;
  return {
    id,
    sentAt: str(meta.broadcast_sent_at),
    scheduledFor: str(meta.broadcast_scheduled_for),
  };
}

const hasBody = (item: ContentItem) => Boolean(item.body?.trim());

const render = (deps: NewsletterDeps, item: ContentItem) =>
  renderNewsletterEmail({
    title: item.title,
    body: item.body,
    locale: item.locale,
    siteUrl: deps.config.siteUrl,
  });

export type SendTestResult =
  | { kind: 'sent' }
  | { kind: 'not_newsletter' }
  | { kind: 'empty' }
  | { kind: 'unavailable'; reason: string }
  | { kind: 'failed' };

/** Sends the rendered item to the admin only. Never touches the database. */
export async function sendTest(
  deps: NewsletterDeps,
  item: ContentItem,
  adminEmail: string
): Promise<SendTestResult> {
  if (item.channel !== 'newsletter') return { kind: 'not_newsletter' };
  if (!deps.resend) return { kind: 'unavailable', reason: 'RESEND_API_KEY is not set.' };
  if (!hasBody(item)) return { kind: 'empty' };

  const email = render(deps, item);
  try {
    const { error } = await deps.resend.emails.send({
      from: deps.config.from,
      to: adminEmail,
      subject: `[TEST] ${email.subject}`,
      html: email.html,
      text: email.text,
    });
    if (error) {
      console.error('[newsletter] test send failed', error.name ?? 'unknown');
      return { kind: 'failed' };
    }
    return { kind: 'sent' };
  } catch {
    console.error('[newsletter] test send threw');
    return { kind: 'failed' };
  }
}

export type SendBroadcastResult =
  | { kind: 'sent'; broadcastId: string }
  | { kind: 'scheduled'; broadcastId: string; scheduledFor: string }
  | { kind: 'not_newsletter' }
  | { kind: 'already_sent'; broadcastId: string }
  | { kind: 'empty' }
  | { kind: 'unavailable'; reason: string }
  /** Resend rejected or never answered: nothing was sent and nothing was saved. */
  | { kind: 'resend_failed' }
  /** Resend accepted the broadcast but the calendar update failed: it WAS sent. */
  | { kind: 'saved_failed'; broadcastId: string };

/**
 * Creates and sends (or schedules) a broadcast to the item's language segment,
 * then records it on the item. A stored `meta.broadcast_id` blocks a second send.
 */
export async function sendBroadcast(
  deps: NewsletterDeps,
  item: ContentItem
): Promise<SendBroadcastResult> {
  if (item.channel !== 'newsletter') return { kind: 'not_newsletter' };
  const existing = broadcastState(item.meta);
  if (existing) return { kind: 'already_sent', broadcastId: existing.id };
  if (!hasBody(item)) return { kind: 'empty' };

  const availability = newsletterAvailability(deps, item.locale);
  if (!availability.ok) return { kind: 'unavailable', reason: availability.reason };

  const now = deps.now();
  const scheduledFor =
    item.scheduled_for && Date.parse(item.scheduled_for) > now.getTime()
      ? item.scheduled_for
      : null;
  const email = render(deps, item);

  let broadcastId: string;
  try {
    const { data, error } = await deps.resend!.broadcasts.create({
      segmentId: availability.segmentId,
      from: deps.config.from,
      subject: email.subject,
      html: email.html,
      text: email.text,
      name: item.title,
      ...(deps.config.topicId ? { topicId: deps.config.topicId } : {}),
      send: true,
      ...(scheduledFor ? { scheduledAt: scheduledFor } : {}),
    });
    if (error || !data?.id) {
      console.error('[newsletter] broadcast failed', error?.name ?? 'no id');
      return { kind: 'resend_failed' };
    }
    broadcastId = data.id;
  } catch {
    console.error('[newsletter] broadcast threw');
    return { kind: 'resend_failed' };
  }

  const meta: Record<string, unknown> = {
    ...item.meta,
    broadcast_id: broadcastId,
    broadcast_sent_at: now.toISOString(),
    ...(scheduledFor ? { broadcast_scheduled_for: scheduledFor } : {}),
  };
  try {
    await deps.repo.markBroadcast(item.id, {
      status: scheduledFor ? 'scheduled' : 'published',
      published_at: scheduledFor ? item.published_at : now.toISOString(),
      meta,
    });
  } catch {
    console.error('[newsletter] broadcast sent but the item update failed', broadcastId);
    return { kind: 'saved_failed', broadcastId };
  }

  return scheduledFor
    ? { kind: 'scheduled', broadcastId, scheduledFor }
    : { kind: 'sent', broadcastId };
}

/** Writes through the signed-in user's client, so RLS stays the real authority. */
export function createContentRepo(client: Pick<SupabaseClient, 'schema'>): ContentRepo {
  return {
    async markBroadcast(id, update) {
      const { data, error } = await client
        .schema('personal')
        .from('content_items')
        .update(update)
        .eq('id', id)
        .select('id');
      if (error) throw new Error(`Could not record the broadcast: ${error.message}`);
      if (!data || data.length === 0)
        throw new Error('Could not record the broadcast: no row matched');
    },
  };
}
