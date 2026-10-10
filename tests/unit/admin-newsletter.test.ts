import { describe, expect, it, vi } from 'vitest';

import type { ContentItem } from '../../src/lib/admin-content';
import {
  broadcastState,
  createContentRepo,
  newsletterAvailability,
  sendBroadcast,
  sendTest,
  type NewsletterDeps,
} from '../../src/lib/admin-newsletter';
import { fakeClient } from './fake-supabase';

const NOW = new Date('2026-10-10T12:00:00.000Z');
const ok = <T>(data: T) => ({ data, error: null });
const err = (message: string) => ({ data: null, error: { message, name: 'x', statusCode: 500 } });

const item = (overrides: Partial<ContentItem> = {}): ContentItem => ({
  id: '3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b',
  channel: 'newsletter',
  status: 'drafting',
  title: 'Issue 1',
  body: 'Hello **world**',
  locale: 'es',
  scheduled_for: null,
  published_at: null,
  url: null,
  product_id: null,
  project_id: null,
  show_in_log: false,
  meta: {},
  created_at: '2026-10-01T00:00:00.000Z',
  updated_at: '2026-10-01T00:00:00.000Z',
  ...overrides,
});

function deps(overrides: Partial<NewsletterDeps> = {}) {
  const resend = {
    emails: { send: vi.fn().mockResolvedValue(ok({ id: 'e1' })) },
    broadcasts: { create: vi.fn().mockResolvedValue(ok({ id: 'b1' })) },
  };
  const repo = { markBroadcast: vi.fn().mockResolvedValue(undefined) };
  const value: NewsletterDeps = {
    resend,
    repo,
    now: () => NOW,
    config: {
      segments: { es: 'seg-es', en: 'seg-en' },
      topicId: undefined,
      from: 'Facundo Pascale <newsletter@facundopascale.dev>',
      siteUrl: 'https://www.facundopascale.dev',
    },
    ...overrides,
  };
  return { deps: value, resend, repo };
}

describe('newsletterAvailability', () => {
  it('reports missing client and missing segment separately', () => {
    const { deps: d } = deps();
    expect(newsletterAvailability(d, 'es')).toEqual({ ok: true, segmentId: 'seg-es' });
    expect(newsletterAvailability({ ...d, resend: null }, 'es')).toEqual({
      ok: false,
      reason: 'RESEND_API_KEY is not set.',
    });
    expect(
      newsletterAvailability({ ...d, config: { ...d.config, segments: { es: 'a' } } }, 'en')
    ).toEqual({ ok: false, reason: 'RESEND_SEGMENT_EN is not set.' });
  });
});

describe('broadcastState', () => {
  it('reads the stored broadcast fields from meta', () => {
    expect(broadcastState({})).toBeNull();
    expect(
      broadcastState({
        broadcast_id: 'b1',
        broadcast_sent_at: '2026-10-10T12:00:00.000Z',
        broadcast_scheduled_for: '2026-10-12T09:00:00.000Z',
        other: 1,
      })
    ).toEqual({
      id: 'b1',
      sentAt: '2026-10-10T12:00:00.000Z',
      scheduledFor: '2026-10-12T09:00:00.000Z',
    });
  });
});

describe('sendTest', () => {
  it('emails the admin with a [TEST] subject and renders the item', async () => {
    const { deps: d, resend, repo } = deps();
    const result = await sendTest(d, item(), 'admin@example.com');
    expect(result).toEqual({ kind: 'sent' });
    expect(resend.emails.send).toHaveBeenCalledTimes(1);
    const payload = resend.emails.send.mock.calls[0]![0];
    expect(payload.to).toBe('admin@example.com');
    expect(payload.subject).toBe('[TEST] Issue 1');
    expect(payload.from).toBe('Facundo Pascale <newsletter@facundopascale.dev>');
    expect(payload.html).toContain('<strong>world</strong>');
    expect(payload.text).toContain('Issue 1');
    expect(repo.markBroadcast).not.toHaveBeenCalled();
  });

  it('refuses non-newsletter items', async () => {
    const { deps: d, resend } = deps();
    expect(await sendTest(d, item({ channel: 'blog' }), 'a@b.co')).toEqual({
      kind: 'not_newsletter',
    });
    expect(resend.emails.send).not.toHaveBeenCalled();
  });

  it('is unavailable without a Resend client', async () => {
    const { deps: d } = deps({ resend: null });
    expect(await sendTest(d, item(), 'a@b.co')).toEqual({
      kind: 'unavailable',
      reason: 'RESEND_API_KEY is not set.',
    });
  });

  it('refuses an item without a body', async () => {
    const { deps: d, resend } = deps();
    expect(await sendTest(d, item({ body: '  ' }), 'a@b.co')).toEqual({ kind: 'empty' });
    expect(resend.emails.send).not.toHaveBeenCalled();
  });

  it('returns failed when Resend errors', async () => {
    const { deps: d, resend } = deps();
    resend.emails.send.mockResolvedValue(err('nope'));
    expect(await sendTest(d, item(), 'a@b.co')).toEqual({ kind: 'failed' });
  });

  it('returns failed when the SDK throws', async () => {
    const { deps: d, resend } = deps();
    resend.emails.send.mockRejectedValue(new Error('network'));
    expect(await sendTest(d, item(), 'a@b.co')).toEqual({ kind: 'failed' });
  });
});

describe('sendBroadcast', () => {
  it('refuses non-newsletter items', async () => {
    const { deps: d, resend } = deps();
    expect(await sendBroadcast(d, item({ channel: 'youtube' }))).toEqual({
      kind: 'not_newsletter',
    });
    expect(resend.broadcasts.create).not.toHaveBeenCalled();
  });

  it('refuses when a broadcast id is already stored', async () => {
    const { deps: d, resend, repo } = deps();
    const result = await sendBroadcast(d, item({ meta: { broadcast_id: 'old' } }));
    expect(result).toEqual({ kind: 'already_sent', broadcastId: 'old' });
    expect(resend.broadcasts.create).not.toHaveBeenCalled();
    expect(repo.markBroadcast).not.toHaveBeenCalled();
  });

  it('refuses an item without a body', async () => {
    const { deps: d, resend } = deps();
    expect(await sendBroadcast(d, item({ body: null }))).toEqual({ kind: 'empty' });
    expect(resend.broadcasts.create).not.toHaveBeenCalled();
  });

  it('is unavailable when the locale segment is missing', async () => {
    const { deps: d, resend } = deps();
    d.config.segments = { es: 'seg-es' };
    expect(await sendBroadcast(d, item({ locale: 'en' }))).toEqual({
      kind: 'unavailable',
      reason: 'RESEND_SEGMENT_EN is not set.',
    });
    expect(resend.broadcasts.create).not.toHaveBeenCalled();
  });

  it('targets the segment of the item locale', async () => {
    const { deps: d, resend } = deps();
    await sendBroadcast(d, item({ locale: 'en' }));
    expect(resend.broadcasts.create.mock.calls[0]![0]).toMatchObject({
      segmentId: 'seg-en',
      send: true,
      subject: 'Issue 1',
      from: 'Facundo Pascale <newsletter@facundopascale.dev>',
    });
    await sendBroadcast(d, item({ locale: 'es' }));
    expect(resend.broadcasts.create.mock.calls[1]![0].segmentId).toBe('seg-es');
  });

  it('adds topicId only when configured', async () => {
    const { deps: d, resend } = deps();
    await sendBroadcast(d, item());
    expect(resend.broadcasts.create.mock.calls[0]![0]).not.toHaveProperty('topicId');
    d.config.topicId = 'topic-1';
    await sendBroadcast(d, item());
    expect(resend.broadcasts.create.mock.calls[1]![0].topicId).toBe('topic-1');
  });

  it('sends the rendered html (with unsubscribe placeholder) and text', async () => {
    const { deps: d, resend } = deps();
    await sendBroadcast(d, item());
    const payload = resend.broadcasts.create.mock.calls[0]![0];
    expect(payload.html).toContain('{{{RESEND_UNSUBSCRIBE_URL}}}');
    expect(payload.text).toContain('Issue 1');
  });

  it('sends now and publishes when scheduled_for is missing', async () => {
    const { deps: d, resend, repo } = deps();
    const result = await sendBroadcast(d, item({ meta: { keep: 'me' } }));
    expect(result).toEqual({ kind: 'sent', broadcastId: 'b1' });
    expect(resend.broadcasts.create.mock.calls[0]![0]).not.toHaveProperty('scheduledAt');
    expect(repo.markBroadcast).toHaveBeenCalledWith('3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b', {
      status: 'published',
      published_at: NOW.toISOString(),
      meta: { keep: 'me', broadcast_id: 'b1', broadcast_sent_at: NOW.toISOString() },
    });
  });

  it('sends now when scheduled_for is in the past', async () => {
    const { deps: d, resend, repo } = deps();
    const result = await sendBroadcast(d, item({ scheduled_for: '2026-10-09T09:00:00.000Z' }));
    expect(result).toEqual({ kind: 'sent', broadcastId: 'b1' });
    expect(resend.broadcasts.create.mock.calls[0]![0]).not.toHaveProperty('scheduledAt');
    expect(repo.markBroadcast.mock.calls[0]![1]).toMatchObject({
      status: 'published',
      published_at: NOW.toISOString(),
    });
  });

  it('schedules at scheduled_for when it is in the future', async () => {
    const { deps: d, resend, repo } = deps();
    const when = '2026-10-12T09:00:00.000Z';
    const result = await sendBroadcast(
      d,
      item({ scheduled_for: when, published_at: null, meta: { keep: 1 } })
    );
    expect(result).toEqual({ kind: 'scheduled', broadcastId: 'b1', scheduledFor: when });
    expect(resend.broadcasts.create.mock.calls[0]![0]).toMatchObject({
      send: true,
      scheduledAt: when,
    });
    expect(repo.markBroadcast).toHaveBeenCalledWith('3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b', {
      status: 'scheduled',
      published_at: null,
      meta: {
        keep: 1,
        broadcast_id: 'b1',
        broadcast_sent_at: NOW.toISOString(),
        broadcast_scheduled_for: when,
      },
    });
  });

  it('does not touch the database when Resend returns an error', async () => {
    const { deps: d, resend, repo } = deps();
    resend.broadcasts.create.mockResolvedValue(err('bad segment'));
    expect(await sendBroadcast(d, item())).toEqual({ kind: 'resend_failed' });
    expect(repo.markBroadcast).not.toHaveBeenCalled();
  });

  it('does not touch the database when the SDK throws', async () => {
    const { deps: d, resend, repo } = deps();
    resend.broadcasts.create.mockRejectedValue(new Error('network'));
    expect(await sendBroadcast(d, item())).toEqual({ kind: 'resend_failed' });
    expect(repo.markBroadcast).not.toHaveBeenCalled();
  });

  it('returns a distinct error with the broadcast id when the update fails after sending', async () => {
    const { deps: d, repo } = deps();
    repo.markBroadcast.mockRejectedValue(new Error('db down'));
    expect(await sendBroadcast(d, item())).toEqual({ kind: 'saved_failed', broadcastId: 'b1' });
  });

  it('treats a response without an id as a failure', async () => {
    const { deps: d, resend, repo } = deps();
    resend.broadcasts.create.mockResolvedValue(ok(null));
    expect(await sendBroadcast(d, item())).toEqual({ kind: 'resend_failed' });
    expect(repo.markBroadcast).not.toHaveBeenCalled();
  });
});

describe('createContentRepo', () => {
  it('updates status, published_at and meta on the item', async () => {
    const { client, calls, targets } = fakeClient({ data: [{ id: 'x' }], error: null });
    await createContentRepo(client).markBroadcast('x', {
      status: 'published',
      published_at: NOW.toISOString(),
      meta: { broadcast_id: 'b1' },
    });
    expect(targets).toEqual([{ schema: 'personal', table: 'content_items' }]);
    expect(calls).toContainEqual([
      'update',
      { status: 'published', published_at: NOW.toISOString(), meta: { broadcast_id: 'b1' } },
    ]);
    expect(calls).toContainEqual(['eq', 'id', 'x']);
  });

  it('throws when Supabase reports an error', async () => {
    const { client } = fakeClient({ data: null, error: { message: 'rls' } });
    await expect(
      createContentRepo(client).markBroadcast('x', {
        status: 'scheduled',
        published_at: null,
        meta: {},
      })
    ).rejects.toThrow('rls');
  });

  it('throws when no row matched', async () => {
    const { client } = fakeClient({ data: [], error: null });
    await expect(
      createContentRepo(client).markBroadcast('x', {
        status: 'scheduled',
        published_at: null,
        meta: {},
      })
    ).rejects.toThrow(/no row/i);
  });
});
