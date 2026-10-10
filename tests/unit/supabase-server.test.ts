import { describe, expect, it, vi } from 'vitest';

const createServerClient = vi.hoisted(() => vi.fn(() => ({ tag: 'client' })));
vi.mock('@supabase/ssr', async (orig) => ({
  ...(await orig<typeof import('@supabase/ssr')>()),
  createServerClient,
}));

import {
  createSupabaseServerClient,
  forceCookieOptions,
  readRequestCookies,
  writeCookies,
} from '../../src/lib/supabase-server';

describe('readRequestCookies', () => {
  it('parses the cookie header into name/value pairs', () => {
    expect(readRequestCookies('a=1; sb-token=abc%20def')).toEqual([
      { name: 'a', value: '1' },
      { name: 'sb-token', value: 'abc def' },
    ]);
  });

  it('returns an empty list for a missing header', () => {
    expect(readRequestCookies(null)).toEqual([]);
    expect(readRequestCookies('')).toEqual([]);
  });
});

describe('forceCookieOptions', () => {
  it('forces httpOnly, secure, lax and root path over caller options', () => {
    const out = forceCookieOptions(
      { httpOnly: false, secure: false, sameSite: 'none', path: '/x', maxAge: 60 },
      false
    );
    expect(out).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60,
    });
  });

  it('drops secure on http://localhost only', () => {
    expect(forceCookieOptions({}, true).secure).toBe(false);
    expect(forceCookieOptions({}, true).httpOnly).toBe(true);
  });
});

describe('writeCookies', () => {
  it('writes every cookie through the Astro cookie jar with forced options', () => {
    const set = vi.fn();
    writeCookies(
      { set },
      [
        { name: 'sb-a', value: 'v1', options: { maxAge: 100, httpOnly: false } },
        { name: 'sb-b', value: '', options: { maxAge: 0 } },
      ],
      new URL('https://facundopascale.dev/admin/login')
    );
    expect(set).toHaveBeenCalledTimes(2);
    expect(set).toHaveBeenNthCalledWith(1, 'sb-a', 'v1', {
      maxAge: 100,
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
    expect(set.mock.calls[1]?.[2]).toMatchObject({ maxAge: 0, secure: true });
  });

  it('does not set secure over http://localhost', () => {
    const set = vi.fn();
    writeCookies(
      { set },
      [{ name: 'a', value: 'b', options: {} }],
      new URL('http://localhost:4321/admin')
    );
    expect(set.mock.calls[0]?.[2]).toMatchObject({ secure: false, httpOnly: true });
  });

  it('keeps secure on plain http for non-localhost hosts', () => {
    const set = vi.fn();
    writeCookies(
      { set },
      [{ name: 'a', value: 'b', options: {} }],
      new URL('http://example.com/admin')
    );
    expect(set.mock.calls[0]?.[2]).toMatchObject({ secure: true });
  });
});

describe('createSupabaseServerClient', () => {
  const ctx = {
    request: new Request('https://facundopascale.dev/admin', { headers: { cookie: 'a=1' } }),
    cookies: { set: vi.fn() },
    url: new URL('https://facundopascale.dev/admin'),
  };

  it('returns null when the env vars are absent', () => {
    expect(createSupabaseServerClient(ctx, {})).toBeNull();
    expect(createSupabaseServerClient(ctx, { url: 'https://x.supabase.co' })).toBeNull();
    expect(createSupabaseServerClient(ctx, { anonKey: 'k' })).toBeNull();
  });

  it('builds a server client wired to the cookie adapter when configured', () => {
    const client = createSupabaseServerClient(ctx, { url: 'https://x.supabase.co', anonKey: 'k' });
    expect(client).toEqual({ tag: 'client' });
    const [url, key, opts] = createServerClient.mock.calls[0] as unknown as [
      string,
      string,
      { cookies: { getAll(): unknown; setAll(c: unknown[]): void } },
    ];
    expect([url, key]).toEqual(['https://x.supabase.co', 'k']);
    expect(opts.cookies.getAll()).toEqual([{ name: 'a', value: '1' }]);
    opts.cookies.setAll([{ name: 'n', value: 'v', options: {} }]);
    expect(ctx.cookies.set).toHaveBeenCalledWith(
      'n',
      'v',
      expect.objectContaining({ httpOnly: true })
    );
  });
});
