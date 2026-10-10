import { middleware as i18nMiddleware } from 'astro:i18n';
import { defineMiddleware, sequence } from 'astro:middleware';

import { checkIsAdmin } from './lib/admin-auth';
import { decideAdminAccess } from './lib/admin-guard';
import { createSupabaseServerClient } from './lib/supabase-server';

const page = (status: number, title: string, body: string) =>
  new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex, nofollow"><title>${title}</title></head><body><main><h1>${title}</h1><p>${body}</p></main></body></html>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } }
  );

/**
 * Guards on-demand `/admin` routes. Prerendered pages and the rest of the
 * site pass straight through. Authorization uses `auth.getUser()` (verified
 * against Supabase), never `getSession()`; RLS stays the real authority.
 */
const isAdminPath = (pathname: string) => pathname === '/admin' || pathname.startsWith('/admin/');

// i18n routing is `manual` in astro.config.ts: the public site keeps the same options
// (prefixed default locale, no redirect), while `/admin` stays unprefixed.
const localeRouting = i18nMiddleware({ prefixDefaultLocale: true, redirectToDefaultLocale: false });

const routeLocales = defineMiddleware((context, next) =>
  isAdminPath(context.url.pathname) ? next() : localeRouting(context, next)
);

const guardAdmin = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  if (!isAdminPath(pathname) || context.isPrerendered) return next();

  const supabase = createSupabaseServerClient({
    request: context.request,
    cookies: context.cookies,
    url: context.url,
  });

  if (!supabase) {
    return page(503, 'Admin unavailable', 'Supabase is not configured for this deployment.');
  }

  const { data } = await supabase.auth.getUser();
  const user = data.user ?? null;
  const isAdmin = user ? await checkIsAdmin(supabase) : false;

  const decision = decideAdminAccess({ pathname, configured: true, user, isAdmin });
  switch (decision.kind) {
    case 'redirect':
      return context.redirect(decision.to, 303);
    case 'forbidden':
      return page(403, 'Forbidden', 'This account is not allowed to access the admin area.');
    case 'unconfigured':
      return page(503, 'Admin unavailable', 'Supabase is not configured for this deployment.');
    case 'allow':
      context.locals.supabase = supabase;
      context.locals.user = user;
      return next();
  }
});

export const onRequest = sequence(routeLocales, guardAdmin);
