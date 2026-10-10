import { describe, it, expect } from 'vitest';
import { signToken, verifyToken, TOKEN_TTL_SECONDS } from '../../src/lib/newsletter-token';

const SECRET = 'test-secret-0123456789';
const NOW = 1_800_000_000_000; // ms

describe('newsletter token', () => {
  it('round-trips a normalised email and locale', () => {
    const token = signToken({ email: '  Ada@Example.COM ', locale: 'es' }, SECRET, () => NOW);
    expect(verifyToken(token, SECRET, 'es', () => NOW)).toEqual({
      email: 'ada@example.com',
      locale: 'es',
    });
  });

  it('is url-safe', () => {
    const token = signToken({ email: 'a@b.co', locale: 'en' }, SECRET, () => NOW);
    expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  });

  it('expires after 48 hours (injected clock)', () => {
    const token = signToken({ email: 'a@b.co', locale: 'en' }, SECRET, () => NOW);
    expect(TOKEN_TTL_SECONDS).toBe(48 * 60 * 60);
    const justBefore = NOW + (TOKEN_TTL_SECONDS - 1) * 1000;
    const after = NOW + (TOKEN_TTL_SECONDS + 1) * 1000;
    expect(verifyToken(token, SECRET, 'en', () => justBefore)).not.toBeNull();
    expect(verifyToken(token, SECRET, 'en', () => after)).toBeNull();
  });

  it('rejects a different secret', () => {
    const token = signToken({ email: 'a@b.co', locale: 'en' }, SECRET, () => NOW);
    expect(verifyToken(token, 'another-secret', 'en', () => NOW)).toBeNull();
  });

  it('rejects a wrong locale', () => {
    const token = signToken({ email: 'a@b.co', locale: 'en' }, SECRET, () => NOW);
    expect(verifyToken(token, SECRET, 'es', () => NOW)).toBeNull();
  });

  it('rejects a tampered payload', () => {
    const token = signToken({ email: 'a@b.co', locale: 'en' }, SECRET, () => NOW);
    const [, sig] = token.split('.');
    const forged = Buffer.from(
      JSON.stringify({ e: 'evil@b.co', l: 'en', x: NOW / 1000 + 1000 })
    ).toString('base64url');
    expect(verifyToken(`${forged}.${sig}`, SECRET, 'en', () => NOW)).toBeNull();
  });

  it('rejects a tampered signature', () => {
    const token = signToken({ email: 'a@b.co', locale: 'en' }, SECRET, () => NOW);
    const [payload] = token.split('.');
    expect(verifyToken(`${payload}.AAAA`, SECRET, 'en', () => NOW)).toBeNull();
  });

  it.each(['', 'nodots', 'a.b.c', '.', 'a.', '.b', '%%%.%%%'])('rejects malformed %j', (bad) => {
    expect(verifyToken(bad, SECRET, 'en', () => NOW)).toBeNull();
  });

  it('rejects an empty secret', () => {
    const token = signToken({ email: 'a@b.co', locale: 'en' }, SECRET, () => NOW);
    expect(verifyToken(token, '', 'en', () => NOW)).toBeNull();
  });
});
