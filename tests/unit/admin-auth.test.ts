import { describe, expect, it, vi } from 'vitest';

import { GENERIC_LOGIN_ERROR, handleLogin, type AuthClient } from '../../src/lib/admin-auth';

function fakeClient(opts: {
  signIn?: { error: unknown };
  isAdmin?: { data: unknown; error: unknown };
}): AuthClient & {
  signOut: ReturnType<typeof vi.fn>;
  signInWithPassword: ReturnType<typeof vi.fn>;
} {
  const signInWithPassword = vi.fn(async () => opts.signIn ?? { error: null });
  const signOut = vi.fn(async () => ({ error: null }));
  const rpc = vi.fn(async () => opts.isAdmin ?? { data: true, error: null });
  return {
    auth: { signInWithPassword, signOut },
    schema: () => ({ rpc }),
    signInWithPassword,
    signOut,
  } as never;
}

function form(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

describe('handleLogin', () => {
  it('succeeds for an admin and trims the email', async () => {
    const client = fakeClient({});
    const result = await handleLogin(client, form({ email: ' a@b.co ', password: 'pw' }));
    expect(result).toEqual({ ok: true });
    expect(client.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.co', password: 'pw' });
    expect(client.signOut).not.toHaveBeenCalled();
  });

  it('signs out and returns the generic error for a non-admin', async () => {
    const client = fakeClient({ isAdmin: { data: false, error: null } });
    const result = await handleLogin(client, form({ email: 'a@b.co', password: 'pw' }));
    expect(result).toEqual({ ok: false, error: GENERIC_LOGIN_ERROR });
    expect(client.signOut).toHaveBeenCalledTimes(1);
  });

  it('signs out when the is_admin check errors', async () => {
    const client = fakeClient({ isAdmin: { data: null, error: { message: 'boom' } } });
    const result = await handleLogin(client, form({ email: 'a@b.co', password: 'pw' }));
    expect(result).toEqual({ ok: false, error: GENERIC_LOGIN_ERROR });
    expect(client.signOut).toHaveBeenCalledTimes(1);
  });

  it('returns the same generic error for bad credentials', async () => {
    const client = fakeClient({ signIn: { error: { message: 'Invalid login credentials' } } });
    const result = await handleLogin(client, form({ email: 'a@b.co', password: 'bad' }));
    expect(result).toEqual({ ok: false, error: 'Invalid email or password' });
    expect(client.signOut).not.toHaveBeenCalled();
  });

  it('rejects missing fields without calling Supabase', async () => {
    const client = fakeClient({});
    expect(await handleLogin(client, form({ email: '', password: 'pw' }))).toEqual({
      ok: false,
      error: GENERIC_LOGIN_ERROR,
    });
    expect(await handleLogin(client, form({ email: 'a@b.co' }))).toEqual({
      ok: false,
      error: GENERIC_LOGIN_ERROR,
    });
    expect(client.signInWithPassword).not.toHaveBeenCalled();
  });
});
