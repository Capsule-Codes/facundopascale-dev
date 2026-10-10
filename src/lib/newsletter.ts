import { emailCopy } from './newsletter-copy';
import { isLocale, type Locale } from './i18n';
import { normalizeEmail, signToken, verifyToken } from './newsletter-token';

type ResendError = { message: string; name?: string; statusCode?: number | null };
type ResendResult = { data: unknown; error: ResendError | null };

/** The slice of the Resend SDK this module uses; keeps handlers testable without the network. */
export interface ResendLike {
  emails: {
    send(payload: {
      from: string;
      to: string;
      subject: string;
      text: string;
      html: string;
    }): Promise<ResendResult>;
  };
  contacts: {
    create(payload: {
      email: string;
      unsubscribed?: boolean;
      segments?: { id: string }[];
      topics?: { id: string; subscription: 'opt_in' | 'opt_out' }[];
    }): Promise<ResendResult>;
    update(payload: { email: string; unsubscribed?: boolean }): Promise<ResendResult>;
    segments: {
      add(payload: { email: string; segmentId: string }): Promise<ResendResult>;
    };
    topics: {
      update(payload: {
        email: string;
        topics: { id: string; subscription: 'opt_in' | 'opt_out' }[];
      }): Promise<ResendResult>;
    };
  };
}

export type SegmentIds = Partial<Record<Locale, string>>;

export interface SubscribeDeps {
  resend: ResendLike | null;
  secret: string | undefined;
  from: string;
  /** Absolute site origin used to build the confirmation link. */
  siteUrl: string;
  segments: SegmentIds;
  /** Returns false when the key has exhausted its allowance. */
  rateLimit: (key: string) => boolean;
  now?: () => number;
}

export interface SubscribeForm {
  email: string;
  locale: string;
  honeypot: string;
}

export type SubscribeResult =
  | { kind: 'sent' }
  /** Honeypot tripped: the page shows the same neutral result, nothing is sent. */
  | { kind: 'ignored' }
  | { kind: 'not_found' }
  | { kind: 'invalid' }
  | { kind: 'rate_limited' }
  | { kind: 'unavailable' }
  | { kind: 'failed' };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

export const isValidEmail = (email: string): boolean =>
  email.length > 0 && email.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(email);

/**
 * Validates a subscription request and sends ONE confirmation email. The
 * address is only stored (in Resend) after the link is confirmed. Addresses are
 * never logged.
 */
export async function handleSubscribe(
  deps: SubscribeDeps,
  form: SubscribeForm,
  ctx: { ip: string }
): Promise<SubscribeResult> {
  if (!isLocale(form.locale)) return { kind: 'not_found' };
  const locale = form.locale;
  if (form.honeypot) return { kind: 'ignored' };

  const email = normalizeEmail(form.email);
  if (!isValidEmail(email)) return { kind: 'invalid' };

  if (!deps.rateLimit(ctx.ip)) return { kind: 'rate_limited' };

  if (!deps.resend || !deps.secret || !deps.segments[locale]) return { kind: 'unavailable' };

  const token = signToken({ email, locale }, deps.secret, deps.now);
  const url = `${deps.siteUrl.replace(/\/$/, '')}/${locale}/newsletter/confirm?token=${token}`;
  const copy = emailCopy[locale];

  const { error } = await deps.resend.emails.send({
    from: deps.from,
    to: email,
    subject: copy.subject,
    text: copy.text(url),
    html: copy.html(url),
  });
  if (error) {
    // Log only the error class; the message may echo the address.
    console.error('[newsletter] confirmation email failed', error.name ?? 'unknown');
    return { kind: 'failed' };
  }
  return { kind: 'sent' };
}

export interface ConfirmDeps {
  resend: ResendLike | null;
  secret: string | undefined;
  segments: SegmentIds;
  /** Optional Resend topic; contacts are opted in when set. */
  topicId: string | undefined;
  now?: () => number;
}

export type ConfirmResult =
  | { kind: 'confirmed' }
  | { kind: 'invalid' }
  | { kind: 'unavailable' }
  | { kind: 'failed' };

// Resend does not document what creating an existing contact returns, so match
// on the conflict status or an "already exists" style message.
const isAlreadyExists = (error: ResendError): boolean =>
  error.statusCode === 409 || /already\s+exists/i.test(error.message);

const isAlreadyInSegment = (error: ResendError): boolean => /already/i.test(error.message);

/**
 * Verifies the signed token and creates (or re-activates) the contact in the
 * locale's segment. Safe to repeat: confirming twice yields `confirmed`.
 */
export async function handleConfirm(
  deps: ConfirmDeps,
  token: string,
  locale: Locale
): Promise<ConfirmResult> {
  const segmentId = deps.segments[locale];
  if (!deps.resend || !deps.secret || !segmentId) return { kind: 'unavailable' };

  const claims = verifyToken(token, deps.secret, locale, deps.now);
  if (!claims) return { kind: 'invalid' };

  const { resend, topicId } = deps;
  const topics = topicId ? [{ id: topicId, subscription: 'opt_in' as const }] : undefined;

  const created = await resend.contacts.create({
    email: claims.email,
    unsubscribed: false,
    segments: [{ id: segmentId }],
    ...(topics ? { topics } : {}),
  });
  if (!created.error) return { kind: 'confirmed' };
  if (!isAlreadyExists(created.error)) return fail(created.error);

  // Contacts are shared across the Resend team (other products' lists): leave the global
  // `unsubscribed` flag alone and opt in through this site's segment and topic only.
  const added = await resend.contacts.segments.add({ email: claims.email, segmentId });
  if (added.error && !isAlreadyInSegment(added.error)) return fail(added.error);

  if (topics) {
    const topicResult = await resend.contacts.topics.update({ email: claims.email, topics });
    if (topicResult.error) return fail(topicResult.error);
  }
  return { kind: 'confirmed' };
}

function fail(error: ResendError): ConfirmResult {
  console.error('[newsletter] contact update failed', error.name ?? 'unknown');
  return { kind: 'failed' };
}
