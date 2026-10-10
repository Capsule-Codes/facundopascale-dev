import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  handleSubscribe,
  handleConfirm,
  type SubscribeDeps,
  type ConfirmDeps,
  type ResendLike,
} from '../../src/lib/newsletter';
import { signToken } from '../../src/lib/newsletter-token';

const SECRET = 'test-secret-0123456789';
const NOW = 1_800_000_000_000;
const EMAIL = 'ada.lovelace@example.com';

const ok = <T>(data: T) => ({ data, error: null });
const err = (message: string, name = 'validation_error', statusCode: number | null = 422) => ({
  data: null,
  error: { message, name, statusCode },
});

function fakeResend(overrides: Partial<Record<string, unknown>> = {}) {
  const resend = {
    emails: { send: vi.fn().mockResolvedValue(ok({ id: 'e1' })) },
    contacts: {
      create: vi.fn().mockResolvedValue(ok({ id: 'c1' })),
      update: vi.fn().mockResolvedValue(ok({ id: 'c1' })),
      segments: { add: vi.fn().mockResolvedValue(ok({ id: 's1' })) },
      topics: { update: vi.fn().mockResolvedValue(ok({ id: 'c1' })) },
    },
    ...overrides,
  };
  return resend as typeof resend & ResendLike;
}

function subscribeDeps(overrides: Partial<SubscribeDeps> = {}): SubscribeDeps {
  return {
    resend: fakeResend(),
    secret: SECRET,
    from: 'Facundo Pascale <newsletter@facundopascale.dev>',
    siteUrl: 'https://facundopascale.dev',
    segments: { es: 'seg-es', en: 'seg-en' },
    rateLimit: () => true,
    now: () => NOW,
    ...overrides,
  };
}

const form = (over: Partial<{ email: string; locale: string; honeypot: string }> = {}) => ({
  email: EMAIL,
  locale: 'es',
  honeypot: '',
  ...over,
});

afterEach(() => vi.restoreAllMocks());

describe('handleSubscribe', () => {
  it('sends exactly one localized email with a valid confirmation link', async () => {
    const deps = subscribeDeps();
    const result = await handleSubscribe(deps, form(), { ip: '1.2.3.4' });
    expect(result.kind).toBe('sent');
    const send = (deps.resend as ReturnType<typeof fakeResend>).emails.send;
    expect(send).toHaveBeenCalledTimes(1);
    const payload = send.mock.calls[0]![0];
    expect(payload.to).toBe(EMAIL);
    expect(payload.from).toBe('Facundo Pascale <newsletter@facundopascale.dev>');
    expect(payload.subject).toMatch(/confirm/i);
    const link = /https:\/\/facundopascale\.dev\/es\/newsletter\/confirm\?token=([\w.-]+)/.exec(
      payload.text
    );
    expect(link).not.toBeNull();
    expect(payload.html).toContain(link![0]);
    const { verifyToken } = await import('../../src/lib/newsletter-token');
    expect(verifyToken(link![1]!, SECRET, 'es', () => NOW)).toEqual({
      email: EMAIL,
      locale: 'es',
    });
  });

  it('localizes the email for en', async () => {
    const deps = subscribeDeps();
    await handleSubscribe(deps, form({ locale: 'en' }), { ip: 'x' });
    const payload = (deps.resend as ReturnType<typeof fakeResend>).emails.send.mock.calls[0]![0];
    expect(payload.subject).toBe('Confirm your subscription');
    expect(payload.text).toContain('/en/newsletter/confirm?token=');
  });

  it('returns not_found for an unknown locale', async () => {
    const result = await handleSubscribe(subscribeDeps(), form({ locale: 'fr' }), { ip: 'x' });
    expect(result.kind).toBe('not_found');
  });

  it('ignores honeypot submissions without sending', async () => {
    const deps = subscribeDeps();
    const result = await handleSubscribe(deps, form({ honeypot: 'http://spam' }), { ip: 'x' });
    expect(result.kind).toBe('ignored');
    expect((deps.resend as ReturnType<typeof fakeResend>).emails.send).not.toHaveBeenCalled();
  });

  it.each(['', 'nope', 'a@b', 'a b@c.com', `${'a'.repeat(250)}@x.com`])(
    'rejects invalid email %j',
    async (email) => {
      const deps = subscribeDeps();
      const result = await handleSubscribe(deps, form({ email }), { ip: 'x' });
      expect(result.kind).toBe('invalid');
      expect((deps.resend as ReturnType<typeof fakeResend>).emails.send).not.toHaveBeenCalled();
    }
  );

  it('rate limits per ip', async () => {
    const rateLimit = vi.fn().mockReturnValue(false);
    const deps = subscribeDeps({ rateLimit });
    const result = await handleSubscribe(deps, form(), { ip: '9.9.9.9' });
    expect(result.kind).toBe('rate_limited');
    expect(rateLimit).toHaveBeenCalledWith('9.9.9.9');
    expect((deps.resend as ReturnType<typeof fakeResend>).emails.send).not.toHaveBeenCalled();
  });

  it.each([
    ['no resend client', { resend: null }],
    ['no secret', { secret: undefined }],
    ['no segment for locale', { segments: { en: 'seg-en' } }],
  ])('is unavailable when %s', async (_name, over) => {
    const result = await handleSubscribe(subscribeDeps(over as Partial<SubscribeDeps>), form(), {
      ip: 'x',
    });
    expect(result.kind).toBe('unavailable');
  });

  it('reports failed when Resend rejects the email, without leaking the address', async () => {
    const spies = [
      vi.spyOn(console, 'error').mockImplementation(() => {}),
      vi.spyOn(console, 'warn').mockImplementation(() => {}),
      vi.spyOn(console, 'log').mockImplementation(() => {}),
    ];
    const resend = fakeResend({
      emails: { send: vi.fn().mockResolvedValue(err(`bad address ${EMAIL}`)) },
    });
    const result = await handleSubscribe(subscribeDeps({ resend }), form(), { ip: 'x' });
    expect(result.kind).toBe('failed');
    for (const spy of spies) {
      expect(JSON.stringify(spy.mock.calls)).not.toContain(EMAIL);
    }
  });

  it('never logs the email on success', async () => {
    const spies = [
      vi.spyOn(console, 'error').mockImplementation(() => {}),
      vi.spyOn(console, 'warn').mockImplementation(() => {}),
      vi.spyOn(console, 'log').mockImplementation(() => {}),
    ];
    await handleSubscribe(subscribeDeps(), form(), { ip: 'x' });
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });
});

function confirmDeps(overrides: Partial<ConfirmDeps> = {}): ConfirmDeps {
  return {
    resend: fakeResend(),
    secret: SECRET,
    segments: { es: 'seg-es', en: 'seg-en' },
    topicId: undefined,
    now: () => NOW,
    ...overrides,
  };
}

const token = (locale: 'es' | 'en' = 'es', email = EMAIL) =>
  signToken({ email, locale }, SECRET, () => NOW);

describe('handleConfirm', () => {
  it('creates the contact in the locale segment, subscribed', async () => {
    const deps = confirmDeps();
    const result = await handleConfirm(deps, token('es'), 'es');
    expect(result.kind).toBe('confirmed');
    const create = (deps.resend as ReturnType<typeof fakeResend>).contacts.create;
    expect(create).toHaveBeenCalledWith({
      email: EMAIL,
      unsubscribed: false,
      segments: [{ id: 'seg-es' }],
    });
  });

  it('chooses the en segment for en', async () => {
    const deps = confirmDeps();
    await handleConfirm(deps, token('en'), 'en');
    const create = (deps.resend as ReturnType<typeof fakeResend>).contacts.create;
    expect(create.mock.calls[0]![0].segments).toEqual([{ id: 'seg-en' }]);
  });

  it('adds the opt_in topic when configured', async () => {
    const deps = confirmDeps({ topicId: 'topic-1' });
    await handleConfirm(deps, token('es'), 'es');
    const create = (deps.resend as ReturnType<typeof fakeResend>).contacts.create;
    expect(create.mock.calls[0]![0].topics).toEqual([{ id: 'topic-1', subscription: 'opt_in' }]);
  });

  it('updates and adds the segment when the contact already exists', async () => {
    const resend = fakeResend();
    resend.contacts.create.mockResolvedValue(
      err('Contact already exists', 'validation_error', 409)
    );
    const deps = confirmDeps({ resend, topicId: 'topic-1' });
    const result = await handleConfirm(deps, token('es'), 'es');
    expect(result.kind).toBe('confirmed');
    expect(resend.contacts.update).toHaveBeenCalledWith({ email: EMAIL, unsubscribed: false });
    expect(resend.contacts.segments.add).toHaveBeenCalledWith({
      email: EMAIL,
      segmentId: 'seg-es',
    });
    expect(resend.contacts.topics.update).toHaveBeenCalledWith({
      email: EMAIL,
      topics: [{ id: 'topic-1', subscription: 'opt_in' }],
    });
  });

  it('treats an already-in-segment error as success on the existing path', async () => {
    const resend = fakeResend();
    resend.contacts.create.mockResolvedValue(
      err('Contact already exists', 'validation_error', 409)
    );
    resend.contacts.segments.add.mockResolvedValue(err('Contact is already in the segment'));
    const result = await handleConfirm(confirmDeps({ resend }), token('es'), 'es');
    expect(result.kind).toBe('confirmed');
  });

  it('fails when the existing-contact update fails', async () => {
    const resend = fakeResend();
    resend.contacts.create.mockResolvedValue(
      err('Contact already exists', 'validation_error', 409)
    );
    resend.contacts.update.mockResolvedValue(err('boom', 'internal_server_error', 500));
    const result = await handleConfirm(confirmDeps({ resend }), token('es'), 'es');
    expect(result.kind).toBe('failed');
  });

  it('fails on any other Resend error', async () => {
    const resend = fakeResend();
    resend.contacts.create.mockResolvedValue(err('nope', 'invalid_api_key', 401));
    const result = await handleConfirm(confirmDeps({ resend }), token('es'), 'es');
    expect(result.kind).toBe('failed');
    expect(resend.contacts.update).not.toHaveBeenCalled();
  });

  it('is idempotent: confirming twice succeeds both times', async () => {
    const resend = fakeResend();
    resend.contacts.create
      .mockResolvedValueOnce(ok({ id: 'c1' }))
      .mockResolvedValueOnce(err('Contact already exists', 'validation_error', 409));
    const deps = confirmDeps({ resend });
    expect((await handleConfirm(deps, token('es'), 'es')).kind).toBe('confirmed');
    expect((await handleConfirm(deps, token('es'), 'es')).kind).toBe('confirmed');
  });

  it('rejects an invalid, expired or wrong-locale token without calling Resend', async () => {
    const resend = fakeResend();
    const deps = confirmDeps({ resend });
    expect((await handleConfirm(deps, 'garbage', 'es')).kind).toBe('invalid');
    expect((await handleConfirm(deps, token('en'), 'es')).kind).toBe('invalid');
    const late = confirmDeps({ resend, now: () => NOW + 49 * 3600 * 1000 });
    expect((await handleConfirm(late, token('es'), 'es')).kind).toBe('invalid');
    expect(resend.contacts.create).not.toHaveBeenCalled();
  });

  it.each([
    ['no resend client', { resend: null }],
    ['no secret', { secret: undefined }],
    ['no segment for locale', { segments: { en: 'seg-en' } }],
  ])('is unavailable when %s', async (_n, over) => {
    const result = await handleConfirm(
      confirmDeps(over as Partial<ConfirmDeps>),
      token('es'),
      'es'
    );
    expect(result.kind).toBe('unavailable');
  });
});
