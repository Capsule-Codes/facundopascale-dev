import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  // Fail closed: if CRON_SECRET is unset, refuse to authenticate. Without this
  // guard the expected header would be the literal string "Bearer undefined"
  // and any caller could bypass auth. Trim to defend against env vars pasted
  // with stray whitespace or trailing newlines in the Vercel dashboard.
  const secret = import.meta.env.CRON_SECRET?.trim();
  if (!secret) return new Response('CRON_SECRET not configured', { status: 500 });

  const auth = request.headers.get('authorization');
  const expected = `Bearer ${secret}`;
  if (auth !== expected) return new Response('Unauthorized', { status: 401 });

  const hook = import.meta.env.VERCEL_DEPLOY_HOOK_URL;
  if (!hook) return new Response('Deploy hook not configured', { status: 500 });

  try {
    const res = await fetch(hook, { method: 'POST' });
    if (!res.ok) return new Response(`Deploy hook failed: ${res.status}`, { status: 502 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return new Response(`Deploy hook error: ${message}`, { status: 502 });
  }

  return new Response('Rebuild triggered', { status: 200 });
};
