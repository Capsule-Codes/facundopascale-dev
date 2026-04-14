interface Entry {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  /** Window length in milliseconds. */
  windowMs: number;
  /** Maximum allowed requests per key per window. */
  maxRequests: number;
  /** Optional clock injector for testability. Defaults to Date.now. */
  now?: () => number;
}

export type RateLimitCheck = (key: string) => boolean;

/**
 * Creates an in-memory, per-instance fixed-window rate limiter.
 *
 * Returns a `check(key)` function:
 * - Returns `true` and records the hit when the request is allowed.
 * - Returns `false` when the window's `maxRequests` has been exhausted.
 * - Resets the window lazily once `resetAt` has elapsed.
 *
 * Note: state is held in a module-scoped `Map` per instance. On serverless
 * runtimes (e.g. Vercel Functions), each cold start gets its own Map, so the
 * limit is effectively per-instance, not global. That is an intentional
 * tradeoff for this personal site.
 */
export function createRateLimiter(opts: RateLimitOptions): RateLimitCheck {
  const store = new Map<string, Entry>();
  const now = opts.now ?? (() => Date.now());

  return function check(key: string): boolean {
    const t = now();
    const entry = store.get(key);
    if (!entry || entry.resetAt <= t) {
      store.set(key, { count: 1, resetAt: t + opts.windowMs });
      return true;
    }
    if (entry.count >= opts.maxRequests) {
      return false;
    }
    entry.count += 1;
    return true;
  };
}
