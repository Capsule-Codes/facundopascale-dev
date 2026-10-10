import { describe, expect, it } from 'vitest';

import { decideAdminAccess } from '../../src/lib/admin-guard';

const user = { id: 'u1', email: 'admin@example.com' };

describe('decideAdminAccess', () => {
  it('reports unconfigured for protected routes when Supabase is not configured', () => {
    expect(
      decideAdminAccess({ pathname: '/admin', configured: false, user: null, isAdmin: false })
    ).toEqual({ kind: 'unconfigured' });
  });

  it('reports unconfigured for the login page too (it cannot work)', () => {
    expect(
      decideAdminAccess({ pathname: '/admin/login', configured: false, user: null, isAdmin: false })
    ).toEqual({ kind: 'unconfigured' });
  });

  it('allows the login page for anonymous visitors', () => {
    expect(
      decideAdminAccess({ pathname: '/admin/login', configured: true, user: null, isAdmin: false })
    ).toEqual({ kind: 'allow' });
  });

  it('allows the login page for a signed-in non-admin so they can switch account', () => {
    expect(
      decideAdminAccess({ pathname: '/admin/login', configured: true, user, isAdmin: false })
    ).toEqual({ kind: 'allow' });
  });

  it('redirects a signed-in admin away from the login page', () => {
    expect(
      decideAdminAccess({ pathname: '/admin/login', configured: true, user, isAdmin: true })
    ).toEqual({ kind: 'redirect', to: '/admin' });
  });

  it('redirects anonymous visitors to the login page', () => {
    for (const pathname of ['/admin', '/admin/', '/admin/content']) {
      expect(decideAdminAccess({ pathname, configured: true, user: null, isAdmin: false })).toEqual(
        { kind: 'redirect', to: '/admin/login' }
      );
    }
  });

  it('forbids a signed-in non-admin', () => {
    expect(
      decideAdminAccess({ pathname: '/admin', configured: true, user, isAdmin: false })
    ).toEqual({ kind: 'forbidden' });
  });

  it('allows a signed-in admin', () => {
    expect(
      decideAdminAccess({ pathname: '/admin/content', configured: true, user, isAdmin: true })
    ).toEqual({ kind: 'allow' });
  });

  it('treats a trailing slash on the login path as the login page', () => {
    expect(
      decideAdminAccess({ pathname: '/admin/login/', configured: true, user: null, isAdmin: false })
    ).toEqual({ kind: 'allow' });
  });
});
