/**
 * Password change for `/admin/password`, kept free of Astro types so it can be
 * unit-tested with a fake client. Passwords are never logged or echoed back.
 */
import { formText } from './admin-form';

export const PASSWORD_MIN = 12;
/** bcrypt only hashes the first 72 bytes, so longer input is silently truncated. */
export const PASSWORD_MAX = 72;

export const CURRENT_INCORRECT = 'Current password is incorrect';
export const UPDATE_FAILED = 'Could not update your password. Please try again.';

type Awaitable<T> = T | Promise<T>;

export type PasswordClient = {
  auth: {
    signInWithPassword(credentials: {
      email: string;
      password: string;
    }): Awaitable<{ error: unknown }>;
    updateUser(attributes: { password: string }): Awaitable<{ error: unknown }>;
  };
};

export type PasswordField = 'current_password' | 'new_password' | 'confirm_password';

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; errors: Partial<Record<PasswordField, string>>; notice?: string };

const REQUIRED = 'This field is required';

/** Supabase reports weak passwords with a stable code; only those messages are safe to show. */
function weakPasswordMessage(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) return null;
  const { code, message } = error as { code?: unknown; message?: unknown };
  return code === 'weak_password' && typeof message === 'string' && message ? message : null;
}

function validate(form: FormData): Partial<Record<PasswordField, string>> {
  const current = formText(form, 'current_password');
  const next = formText(form, 'new_password');
  const confirm = formText(form, 'confirm_password');
  const errors: Partial<Record<PasswordField, string>> = {};

  if (!current) errors.current_password = REQUIRED;
  if (!next) errors.new_password = REQUIRED;
  else if (next.length < PASSWORD_MIN)
    errors.new_password = `Use at least ${PASSWORD_MIN} characters.`;
  else if (next.length > PASSWORD_MAX)
    errors.new_password = `Use ${PASSWORD_MAX} characters or fewer.`;
  else if (next === current)
    errors.new_password = 'Choose a password different from the current one.';
  if (!confirm) errors.confirm_password = REQUIRED;
  else if (next && confirm !== next) errors.confirm_password = 'Passwords do not match.';
  return errors;
}

export async function handleChangePassword(
  client: PasswordClient,
  user: { email?: string | null | undefined },
  form: FormData
): Promise<ChangePasswordResult> {
  const errors = validate(form);
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const email = user.email;
  if (!email) return { ok: false, errors: {}, notice: UPDATE_FAILED };

  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password: formText(form, 'current_password'),
  });
  if (signInError) return { ok: false, errors: { current_password: CURRENT_INCORRECT } };

  const { error } = await client.auth.updateUser({ password: formText(form, 'new_password') });
  if (error) {
    const weak = weakPasswordMessage(error);
    return weak
      ? { ok: false, errors: { new_password: weak } }
      : { ok: false, errors: {}, notice: UPDATE_FAILED };
  }
  return { ok: true };
}
