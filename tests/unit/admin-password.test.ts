import { describe, expect, it, vi } from 'vitest';

import {
  CURRENT_INCORRECT,
  PASSWORD_MAX,
  PASSWORD_MIN,
  UPDATE_FAILED,
  handleChangePassword,
  type PasswordClient,
} from '../../src/lib/admin-password';

const CURRENT = 'current-password-123';
const NEXT = 'brand-new-password-456';

function fakeClient(opts: { signIn?: { error: unknown }; update?: { error: unknown } } = {}) {
  const signInWithPassword = vi.fn(async () => opts.signIn ?? { error: null });
  const updateUser = vi.fn(async () => opts.update ?? { error: null });
  const client = { auth: { signInWithPassword, updateUser } } as PasswordClient;
  return { client, signInWithPassword, updateUser };
}

function form(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

const valid = { current_password: CURRENT, new_password: NEXT, confirm_password: NEXT };
const user = { email: 'admin@example.com' };

describe('handleChangePassword', () => {
  it('re-verifies the current password then updates it', async () => {
    const { client, signInWithPassword, updateUser } = fakeClient();
    const result = await handleChangePassword(client, user, form(valid));
    expect(result).toEqual({ ok: true });
    expect(signInWithPassword).toHaveBeenCalledWith({ email: user.email, password: CURRENT });
    expect(updateUser).toHaveBeenCalledWith({ password: NEXT });
  });

  it.each(['current_password', 'new_password', 'confirm_password'])(
    'requires %s',
    async (field) => {
      const { client, signInWithPassword, updateUser } = fakeClient();
      const result = await handleChangePassword(client, user, form({ ...valid, [field]: '' }));
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors[field as keyof typeof result.errors]).toBeTruthy();
      expect(signInWithPassword).not.toHaveBeenCalled();
      expect(updateUser).not.toHaveBeenCalled();
    }
  );

  it('treats a missing field as empty', async () => {
    const { client } = fakeClient();
    const result = await handleChangePassword(client, user, new FormData());
    expect(result.ok).toBe(false);
  });

  it(`rejects a new password shorter than ${PASSWORD_MIN}`, async () => {
    const { client, updateUser } = fakeClient();
    const short = 'a'.repeat(PASSWORD_MIN - 1);
    const result = await handleChangePassword(
      client,
      user,
      form({ ...valid, new_password: short, confirm_password: short })
    );
    expect(result).toMatchObject({ ok: false, errors: { new_password: expect.any(String) } });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('accepts exactly the minimum and maximum lengths', async () => {
    for (const len of [PASSWORD_MIN, PASSWORD_MAX]) {
      const { client } = fakeClient();
      const pw = 'b'.repeat(len);
      const result = await handleChangePassword(
        client,
        user,
        form({ ...valid, new_password: pw, confirm_password: pw })
      );
      expect(result).toEqual({ ok: true });
    }
  });

  it(`rejects a new password longer than ${PASSWORD_MAX}`, async () => {
    const { client, updateUser } = fakeClient();
    const long = 'a'.repeat(PASSWORD_MAX + 1);
    const result = await handleChangePassword(
      client,
      user,
      form({ ...valid, new_password: long, confirm_password: long })
    );
    expect(result).toMatchObject({ ok: false, errors: { new_password: expect.any(String) } });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('rejects a confirmation that does not match', async () => {
    const { client, signInWithPassword } = fakeClient();
    const result = await handleChangePassword(
      client,
      user,
      form({ ...valid, confirm_password: `${NEXT}x` })
    );
    expect(result).toMatchObject({ ok: false, errors: { confirm_password: expect.any(String) } });
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it('rejects a new password equal to the current one', async () => {
    const { client, signInWithPassword } = fakeClient();
    const result = await handleChangePassword(
      client,
      user,
      form({ current_password: NEXT, new_password: NEXT, confirm_password: NEXT })
    );
    expect(result).toMatchObject({ ok: false, errors: { new_password: expect.any(String) } });
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it('returns a field error and skips updateUser when the current password is wrong', async () => {
    const { client, updateUser } = fakeClient({
      signIn: { error: { message: 'Invalid login credentials' } },
    });
    const result = await handleChangePassword(client, user, form(valid));
    expect(result).toEqual({ ok: false, errors: { current_password: CURRENT_INCORRECT } });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('returns a generic notice when updateUser fails', async () => {
    const { client } = fakeClient({ update: { error: { message: 'database exploded' } } });
    const result = await handleChangePassword(client, user, form(valid));
    expect(result).toEqual({ ok: false, errors: {}, notice: UPDATE_FAILED });
  });

  it('surfaces Supabase weak-password errors on the new password field', async () => {
    const { client } = fakeClient({
      update: { error: { code: 'weak_password', message: 'Password is too easy to guess' } },
    });
    const result = await handleChangePassword(client, user, form(valid));
    expect(result).toEqual({
      ok: false,
      errors: { new_password: 'Password is too easy to guess' },
    });
  });

  it('fails with a generic notice when the user has no email', async () => {
    const { client, signInWithPassword, updateUser } = fakeClient();
    const result = await handleChangePassword(client, { email: undefined }, form(valid));
    expect(result).toEqual({ ok: false, errors: {}, notice: UPDATE_FAILED });
    expect(signInWithPassword).not.toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('never leaks passwords into the result', async () => {
    const { client } = fakeClient({ update: { error: { message: `bad ${NEXT}` } } });
    const result = await handleChangePassword(client, user, form(valid));
    expect(JSON.stringify(result)).not.toContain(NEXT);
    expect(JSON.stringify(result)).not.toContain(CURRENT);
  });
});
