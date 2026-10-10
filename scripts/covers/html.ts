import path from 'node:path';
import { isValidSlug, validateCoverConfig, type CoverConfig } from './config.ts';

export const COVER_WIDTH = 1600;
export const COVER_HEIGHT = 1000;

/** Already-resolved image sources (data URIs or URLs), in config order. */
export interface CoverSources {
  logo: string;
  screenshots: string[];
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ESCAPES[ch] ?? ch);
}

/** Radial brand gradient; 4 stops reproduce the UR POV recipe (0/45/80/100). */
function gradientCss(stops: string[]): string {
  const positions =
    stops.length === 4
      ? [0, 45, 80, 100]
      : stops.map((_, i) => Math.round((i / (stops.length - 1)) * 100));
  const list = stops.map((s, i) => `${s} ${positions[i]}%`).join(',');
  return `radial-gradient(1200px 800px at 80% 10%,${list})`;
}

function frameHtml(config: CoverConfig, sources: CoverSources): string {
  const alt = escapeHtml(`${config.title} screenshot`);
  if (config.frame === 'browser') {
    return `<div class="browser"><div class="bar"><i></i><i></i><i></i></div><img src="${sources.screenshots[0]}" alt="${alt}"></div>`;
  }
  const [first, second] = sources.screenshots;
  if (second === undefined) {
    return `<div class="phone"><img src="${first}" alt="${alt}"></div>`;
  }
  return `<div class="stage"><div class="phone"><img src="${first}" alt="${alt}"></div><div class="phone second"><img src="${second}" alt="${alt}"></div></div>`;
}

export function buildCoverHtml(config: CoverConfig, sources: CoverSources): string {
  const errors = validateCoverConfig(config);
  if (errors.length > 0)
    throw new Error(`Invalid cover config "${config.slug}": ${errors.join('; ')}`);

  const tagline = config.tagline.split('\n').map(escapeHtml).join('<br>');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box}
body{width:${COVER_WIDTH}px;height:${COVER_HEIGHT}px;font-family:-apple-system,"Inter",sans-serif;background:${gradientCss(config.gradient)};display:flex;align-items:center;justify-content:space-between;padding:0 140px;overflow:hidden;color:${config.textColor}}
.copy{max-width:640px}
.logo{width:120px;height:120px;background:#fff;border-radius:28px;padding:14px;box-shadow:0 20px 50px rgba(0,0,0,.18)}
h1{font-size:96px;font-weight:800;letter-spacing:-2px;margin-top:40px}
p{font-size:34px;opacity:.92;margin-top:16px;line-height:1.3}
.tag{display:inline-block;margin-top:36px;font-size:22px;letter-spacing:3px;text-transform:uppercase;background:rgba(255,255,255,.18);padding:12px 22px;border-radius:999px}
.phone{width:393px;height:852px;border-radius:56px;border:14px solid #0E2236;overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,.35);transform:rotate(-4deg);background:#0E2236}
.phone img{width:100%;height:100%;display:block}
.stage{position:relative;width:640px;height:852px}
.stage .phone{position:absolute;top:0;left:0}
.stage .phone.second{left:247px;top:60px;transform:rotate(4deg)}
.browser{width:800px;border-radius:20px;border:14px solid #0E2236;border-top-width:0;overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,.35);transform:rotate(-4deg);background:#0E2236}
.browser .bar{height:44px;background:#0E2236;display:flex;align-items:center;gap:10px;padding:0 18px}
.browser .bar i{width:14px;height:14px;border-radius:50%;background:rgba(255,255,255,.35)}
.browser img{width:100%;aspect-ratio:16/10;display:block;object-fit:cover}
</style></head><body>
<div class="copy"><img class="logo" src="${sources.logo}" alt=""><h1>${escapeHtml(config.title)}</h1><p>${tagline}</p><span class="tag">${escapeHtml(config.pill)}</span></div>
${frameHtml(config, sources)}
</body></html>
`;
}

/** public/images/work/<slug>/cover.webp under the given repo root. */
export function coverOutputPath(root: string, slug: string): string {
  if (!isValidSlug(slug)) throw new Error(`Invalid slug "${slug}": must be lowercase kebab-case`);
  return path.join(root, 'public', 'images', 'work', slug, 'cover.webp');
}
