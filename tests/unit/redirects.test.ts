import { describe, it, expect } from 'vitest';
import config from '../../astro.config';

type Redirect = string | { status: number; destination: string };

const redirects = (config.redirects ?? {}) as Record<string, Redirect>;

function target(from: string) {
  const r = redirects[from];
  return typeof r === 'string' ? { status: 301, destination: r } : r;
}

describe('legacy FitCoach redirects', () => {
  it.each([
    ['/en/work/fitcoach', '/en/work/elevate'],
    ['/es/trabajo/fitcoach', '/es/trabajo/elevate'],
    ['/es/work/fitcoach', '/es/trabajo/elevate'],
  ])('%s permanently redirects to %s', (from, to) => {
    expect(target(from)).toEqual({ status: 301, destination: to });
  });
});
