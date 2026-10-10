import { createHmac, timingSafeEqual } from 'node:crypto';

import { isLocale, type Locale } from './i18n';

/** Confirmation links stay valid for 48 hours. */
export const TOKEN_TTL_SECONDS = 48 * 60 * 60;

export interface TokenClaims {
  email: string;
  locale: Locale;
}

/** Normalised form used everywhere an address is compared or stored. */
export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const sign = (payload: string, secret: string): Buffer =>
  createHmac('sha256', secret).update(payload).digest();

/**
 * Builds `base64url(json).base64url(hmac)`; the JSON is `{ e, l, x }` with the
 * normalised email, the locale and the expiry in epoch seconds.
 */
export function signToken(
  claims: TokenClaims,
  secret: string,
  now: () => number = Date.now
): string {
  const expiry = Math.floor(now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = Buffer.from(
    JSON.stringify({ e: normalizeEmail(claims.email), l: claims.locale, x: expiry })
  ).toString('base64url');
  return `${payload}.${sign(payload, secret).toString('base64url')}`;
}

/**
 * Returns the claims for a genuine, unexpired token issued for `locale`;
 * `null` for anything else (malformed, tampered, expired, other locale).
 */
export function verifyToken(
  token: string,
  secret: string,
  locale: Locale,
  now: () => number = Date.now
): TokenClaims | null {
  if (!secret) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts as [string, string];
  if (!payload || !signature) return null;

  const expected = sign(payload, secret);
  const given = Buffer.from(signature, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  let data: unknown;
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null) return null;
  const { e, l, x } = data as Record<string, unknown>;
  if (typeof e !== 'string' || typeof l !== 'string' || typeof x !== 'number') return null;
  if (!isLocale(l) || l !== locale) return null;
  if (Math.floor(now() / 1000) > x) return null;
  return { email: e, locale: l };
}
