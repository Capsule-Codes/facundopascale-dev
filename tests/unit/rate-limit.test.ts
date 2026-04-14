import { describe, it, expect } from 'vitest';
import { createRateLimiter } from '../../src/lib/rate-limit';

describe('createRateLimiter', () => {
  it('allows the first request for a new key', () => {
    const check = createRateLimiter({ windowMs: 60_000, maxRequests: 3, now: () => 0 });
    expect(check('1.2.3.4')).toBe(true);
  });

  it('allows up to maxRequests within the window', () => {
    let t = 0;
    const check = createRateLimiter({ windowMs: 60_000, maxRequests: 3, now: () => t });
    expect(check('ip')).toBe(true);
    t = 1_000;
    expect(check('ip')).toBe(true);
    t = 2_000;
    expect(check('ip')).toBe(true);
  });

  it('rejects the request that exceeds maxRequests within the window', () => {
    let t = 0;
    const check = createRateLimiter({ windowMs: 60_000, maxRequests: 3, now: () => t });
    expect(check('ip')).toBe(true);
    t = 1_000;
    expect(check('ip')).toBe(true);
    t = 2_000;
    expect(check('ip')).toBe(true);
    t = 3_000;
    expect(check('ip')).toBe(false);
  });

  it('resets the counter after the window expires', () => {
    let t = 0;
    const check = createRateLimiter({ windowMs: 60_000, maxRequests: 2, now: () => t });
    expect(check('ip')).toBe(true);
    expect(check('ip')).toBe(true);
    expect(check('ip')).toBe(false);
    // Advance just past the window boundary.
    t = 60_001;
    expect(check('ip')).toBe(true);
    expect(check('ip')).toBe(true);
    expect(check('ip')).toBe(false);
  });

  it('tracks different keys independently', () => {
    const check = createRateLimiter({ windowMs: 60_000, maxRequests: 1, now: () => 0 });
    expect(check('ip-a')).toBe(true);
    expect(check('ip-b')).toBe(true);
    expect(check('ip-a')).toBe(false);
    expect(check('ip-b')).toBe(false);
  });

  it('uses Date.now by default when no now() is provided', () => {
    const check = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });
    expect(check('k')).toBe(true);
    expect(check('k')).toBe(false);
  });
});
