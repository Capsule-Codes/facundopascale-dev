/**
 * Pure access decision for requests under `/admin`. The guard is UX only:
 * Row Level Security (`personal.is_admin()`) remains the real authority for
 * every read and write.
 */

export const ADMIN_HOME = '/admin';
export const ADMIN_LOGIN = '/admin/login';

export type AdminUser = { id: string; email?: string | undefined };

export type AdminGuardInput = {
  pathname: string;
  /** Whether Supabase env vars are present at runtime. */
  configured: boolean;
  user: AdminUser | null;
  isAdmin: boolean;
};

export type AdminGuardDecision =
  | { kind: 'allow' }
  | { kind: 'redirect'; to: string }
  | { kind: 'forbidden' }
  | { kind: 'unconfigured' };

function normalize(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

export function decideAdminAccess({
  pathname,
  configured,
  user,
  isAdmin,
}: AdminGuardInput): AdminGuardDecision {
  if (!configured) return { kind: 'unconfigured' };

  if (normalize(pathname) === ADMIN_LOGIN) {
    if (user && isAdmin) return { kind: 'redirect', to: ADMIN_HOME };
    return { kind: 'allow' };
  }

  if (!user) return { kind: 'redirect', to: ADMIN_LOGIN };
  if (!isAdmin) return { kind: 'forbidden' };
  return { kind: 'allow' };
}
