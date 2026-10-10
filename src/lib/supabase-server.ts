import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Request-scoped Supabase client for on-demand (admin) routes. Session
 * cookies are written through Astro's cookie jar with hardened attributes;
 * the adapter functions are exported so they can be unit-tested.
 */

export type CookieToSet = {
  name: string;
  value: string;
  options: Record<string, unknown>;
};

export type CookieJar = {
  set(name: string, value: string, options?: Record<string, unknown>): void;
};

export type SupabaseServerContext = {
  request: Request;
  cookies: CookieJar;
  url: URL;
};

export type SupabaseEnv = { url?: string | undefined; anonKey?: string | undefined };

export function readRequestCookies(header: string | null): { name: string; value: string }[] {
  if (!header) return [];
  return parseCookieHeader(header).map(({ name, value }) => ({ name, value: value ?? '' }));
}

/** Caller options are kept (maxAge, expires, ...) but security attributes are forced. */
export function forceCookieOptions(
  options: Record<string, unknown>,
  isLocalhostHttp: boolean
): Record<string, unknown> {
  return {
    ...options,
    httpOnly: true,
    secure: !isLocalhostHttp,
    sameSite: 'lax',
    path: '/',
  };
}

export function isLocalhostHttp(url: URL): boolean {
  return url.protocol === 'http:' && url.hostname === 'localhost';
}

export function writeCookies(jar: CookieJar, cookies: CookieToSet[], url: URL): void {
  const localhost = isLocalhostHttp(url);
  for (const { name, value, options } of cookies) {
    jar.set(name, value, forceCookieOptions(options, localhost));
  }
}

function envFromImportMeta(): SupabaseEnv {
  return {
    url: import.meta.env.PUBLIC_SUPABASE_URL as string | undefined,
    anonKey: import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined,
  };
}

/** Returns null when Supabase env vars are not configured. */
export function createSupabaseServerClient(
  { request, cookies, url }: SupabaseServerContext,
  env: SupabaseEnv = envFromImportMeta()
): SupabaseClient | null {
  if (!env.url || !env.anonKey) return null;
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => readRequestCookies(request.headers.get('cookie')),
      setAll: (toSet) =>
        writeCookies(
          cookies,
          toSet.map(({ name, value, options }) => ({
            name,
            value,
            options: (options ?? {}) as Record<string, unknown>,
          })),
          url
        ),
    },
  });
}
