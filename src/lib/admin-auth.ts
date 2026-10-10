/**
 * Sign-in logic for `/admin/login`, kept free of Astro types so it can be
 * unit-tested with a fake client. Every failure returns the same message so
 * the form never reveals whether an account exists or is an admin.
 */

export const GENERIC_LOGIN_ERROR = 'Invalid email or password';

type Awaitable<T> = T | Promise<T>;

export type AuthClient = {
  auth: {
    signInWithPassword(credentials: {
      email: string;
      password: string;
    }): Awaitable<{ error: unknown }>;
    signOut(): Awaitable<unknown>;
  };
  schema(name: 'personal'): {
    rpc(fn: 'is_admin'): PromiseLike<{ data: unknown; error: unknown }>;
  };
};

export type LoginResult = { ok: true } | { ok: false; error: string };

/** True only when the SQL function answers a strict `true` for the signed-in user. */
export async function checkIsAdmin(client: Pick<AuthClient, 'schema'>): Promise<boolean> {
  const { data, error } = await client.schema('personal').rpc('is_admin');
  return !error && data === true;
}

export async function handleLogin(client: AuthClient, form: FormData): Promise<LoginResult> {
  const email = form.get('email');
  const password = form.get('password');
  if (typeof email !== 'string' || typeof password !== 'string') {
    return { ok: false, error: GENERIC_LOGIN_ERROR };
  }
  const trimmed = email.trim();
  if (!trimmed || !password) return { ok: false, error: GENERIC_LOGIN_ERROR };

  const { error } = await client.auth.signInWithPassword({ email: trimmed, password });
  if (error) return { ok: false, error: GENERIC_LOGIN_ERROR };

  if (!(await checkIsAdmin(client))) {
    await client.auth.signOut();
    return { ok: false, error: GENERIC_LOGIN_ERROR };
  }
  return { ok: true };
}
