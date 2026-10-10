/**
 * Renders a `newsletter` content item into an email: Markdown body -> inline
 * styled HTML inside a simple 600px template, plus a plain-text version.
 * Pure; Resend replaces `{{{RESEND_UNSUBSCRIBE_URL}}}` per recipient at send time.
 */
import { Marked } from 'marked';

import type { Locale } from './i18n';

export const UNSUBSCRIBE_PLACEHOLDER = '{{{RESEND_UNSUBSCRIBE_URL}}}';

// Blueprint tokens from `src/styles/global.css`, as hex (email clients ignore CSS variables).
const PAPER = '#F1EEE6';
const INK = '#14213D';
const ACCENT = '#C7380F';
const MUTED = '#4A5568';

const FONT_BODY = "Georgia,'Times New Roman',serif";
const FONT_MONO = "'SFMono-Regular',Menlo,Consolas,monospace";

const footerCopy: Record<Locale, { reason: string; site: string; unsubscribe: string }> = {
  es: {
    reason: 'Recibes este correo porque te suscribiste al newsletter de Facundo Pascale.',
    site: 'Visitar facundopascale.dev',
    unsubscribe: 'Cancelar suscripción',
  },
  en: {
    reason: 'You are receiving this because you subscribed to Facundo Pascale’s newsletter.',
    site: 'Visit facundopascale.dev',
    unsubscribe: 'Unsubscribe',
  },
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const linkStyle = `color:${ACCENT};text-decoration:underline;`;
const isSafeHref = (href: string) => /^(https?:\/\/|mailto:|\/|#)/i.test(href.trim());

const markdown = new Marked({
  gfm: true,
  renderer: {
    // Raw HTML in the body is shown as text, never injected into the email.
    html: ({ text }) => escapeHtml(text),
    link(token) {
      const label = this.parser.parseInline(token.tokens);
      if (!isSafeHref(token.href)) return label;
      return `<a style="${linkStyle}" href="${escapeHtml(token.href)}">${label}</a>`;
    },
    // Images are not supported in the first version; keep the alt text only.
    image: ({ text }) => escapeHtml(text),
  },
});

const blockStyles: Record<string, string> = {
  p: `margin:0 0 16px;font-size:17px;line-height:1.6;color:${INK};`,
  h1: `margin:24px 0 12px;font-size:26px;line-height:1.25;color:${INK};`,
  h2: `margin:24px 0 12px;font-size:22px;line-height:1.3;color:${INK};`,
  h3: `margin:20px 0 10px;font-size:18px;line-height:1.3;color:${INK};`,
  ul: `margin:0 0 16px;padding-left:24px;font-size:17px;line-height:1.6;color:${INK};`,
  ol: `margin:0 0 16px;padding-left:24px;font-size:17px;line-height:1.6;color:${INK};`,
  li: 'margin:0 0 6px;',
  blockquote: `margin:0 0 16px;padding:4px 16px;border-left:3px solid ${ACCENT};color:${MUTED};`,
  hr: `margin:24px 0;border:0;border-top:1px solid ${INK};`,
  pre: `margin:0 0 16px;padding:12px;overflow-x:auto;background:#FFFFFF;border:1px solid ${INK};font-family:${FONT_MONO};font-size:14px;`,
  code: `font-family:${FONT_MONO};font-size:15px;`,
};

const headingAlias: Record<string, string> = { h4: 'h3', h5: 'h3', h6: 'h3' };

/** Adds inline styles to attribute-less block tags (what the Markdown renderer emits). */
function inlineStyles(html: string): string {
  return html.replace(/<(p|h[1-6]|ul|ol|li|blockquote|hr|pre|code)>/g, (_match, tag: string) => {
    const style = blockStyles[headingAlias[tag] ?? tag];
    return `<${tag} style="${style}">`;
  });
}

export interface NewsletterEmailInput {
  title: string;
  body: string | null;
  locale: Locale;
  /** Site origin, with or without a trailing slash. */
  siteUrl: string;
}

export interface NewsletterEmail {
  subject: string;
  html: string;
  text: string;
}

export function renderNewsletterEmail(input: NewsletterEmailInput): NewsletterEmail {
  const { title, locale } = input;
  const body = input.body?.trim() ?? '';
  const footer = footerCopy[locale];
  const siteHome = `${input.siteUrl.replace(/\/+$/, '')}/${locale}/`;

  const content = inlineStyles(markdown.parse(body, { async: false }));
  const safeTitle = escapeHtml(title);

  const html = `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;font-family:${FONT_BODY};color:${INK};">
<tr><td style="padding:0 0 16px;border-bottom:2px solid ${INK};">
<h1 style="margin:0;font-size:28px;line-height:1.25;color:${INK};">${safeTitle}</h1>
</td></tr>
<tr><td style="padding:24px 0;">
${content}
</td></tr>
<tr><td style="padding:16px 0 0;border-top:1px solid ${INK};font-family:${FONT_MONO};font-size:13px;line-height:1.6;color:${MUTED};">
<p style="margin:0 0 8px;">${footer.reason}</p>
<p style="margin:0;"><a style="${linkStyle}" href="${escapeHtml(siteHome)}">${footer.site}</a> · <a style="${linkStyle}" href="${UNSUBSCRIBE_PLACEHOLDER}">${footer.unsubscribe}</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    title,
    '='.repeat(Math.min(title.length, 60)),
    '',
    body,
    '',
    '--',
    footer.reason,
    `${footer.site}: ${siteHome}`,
    `${footer.unsubscribe}: ${UNSUBSCRIBE_PLACEHOLDER}`,
    '',
  ].join('\n');

  return { subject: title, html, text };
}
