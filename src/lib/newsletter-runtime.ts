import { Resend } from 'resend';

import { createRateLimiter } from './rate-limit';
import type { ConfirmDeps, ResendLike, SegmentIds, SubscribeDeps } from './newsletter';

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 5;
const DEFAULT_FROM = 'Facundo Pascale <newsletter@facundopascale.dev>';

// Per-instance limiter; same serverless tradeoff as the contact form.
const checkRateLimit = createRateLimiter({ windowMs: WINDOW_MS, maxRequests: MAX_REQUESTS });

const env = import.meta.env;

const resendClient = (): ResendLike | null =>
  env.RESEND_API_KEY ? (new Resend(env.RESEND_API_KEY) as unknown as ResendLike) : null;

const segments = (): SegmentIds => ({
  es: env.RESEND_SEGMENT_ES || undefined,
  en: env.RESEND_SEGMENT_EN || undefined,
});

/** Client IP for rate limiting (first hop of `x-forwarded-for`). */
export const clientIp = (request: Request): string =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

export const buildSubscribeDeps = (site: URL | undefined): SubscribeDeps => ({
  resend: site ? resendClient() : null,
  secret: env.NEWSLETTER_SECRET || undefined,
  from: env.NEWSLETTER_FROM || DEFAULT_FROM,
  siteUrl: site?.origin ?? '',
  segments: segments(),
  rateLimit: checkRateLimit,
});

export const buildConfirmDeps = (): ConfirmDeps => ({
  resend: resendClient(),
  secret: env.NEWSLETTER_SECRET || undefined,
  segments: segments(),
  topicId: env.RESEND_TOPIC_NEWSLETTER || undefined,
});
