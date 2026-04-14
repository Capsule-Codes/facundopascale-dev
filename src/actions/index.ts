import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { Resend } from 'resend';

import { createRateLimiter } from '../lib/rate-limit';

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 3;

// Per-instance rate limiter. On serverless each cold start gets a fresh Map —
// that is an intentional tradeoff for this personal site.
const checkRateLimit = createRateLimiter({ windowMs: WINDOW_MS, maxRequests: MAX_REQUESTS });

export const server = {
  sendContact: defineAction({
    accept: 'form',
    input: z.object({
      name: z.string().min(2).max(100),
      // Modern Zod 4 form; matches the style used in src/content.config.ts.
      email: z.email(),
      message: z.string().min(10).max(5000),
      // Honeypot must be empty. Zod rejects any non-empty value at the schema
      // layer, producing a VALIDATION error. The handler also defensively
      // double-checks below.
      honeypot: z.string().max(0).optional(),
    }),
    handler: async (input, context) => {
      if (input.honeypot) {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: 'Invalid submission',
        });
      }

      const forwardedFor = context.request.headers.get('x-forwarded-for') ?? 'unknown';
      // x-forwarded-for can be a comma-separated chain; use the first entry.
      const ip = forwardedFor.split(',')[0]?.trim() || 'unknown';

      if (!checkRateLimit(ip)) {
        throw new ActionError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Rate limit exceeded',
        });
      }

      const apiKey = import.meta.env.RESEND_API_KEY;
      const to = import.meta.env.CONTACT_EMAIL_TO;

      if (!apiKey || !to) {
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Contact form is not configured',
        });
      }

      const resend = new Resend(apiKey);

      const { error } = await resend.emails.send({
        from: 'contact@facundopascale.dev',
        to,
        replyTo: input.email,
        subject: `[facundopascale.dev] ${input.name}`,
        text: `From: ${input.name} <${input.email}>\n\n${input.message}`,
      });

      if (error) {
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }

      return { ok: true };
    },
  }),
};
