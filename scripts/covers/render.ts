// Usage: pnpm covers [slug]   (no slug renders every project in projects.ts)
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { buildCoverHtml, coverOutputPath, COVER_HEIGHT, COVER_WIDTH } from './html.ts';
import { covers } from './projects.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

async function toDataUri(relative: string): Promise<string> {
  const mime = MIME[path.extname(relative).toLowerCase()];
  if (!mime) throw new Error(`Unsupported image type: ${relative}`);
  const bytes = await readFile(path.resolve(here, relative));
  return `data:${mime};base64,${bytes.toString('base64')}`;
}

const slug = process.argv[2];
const selected = slug ? covers.filter((c) => c.slug === slug) : covers;
if (selected.length === 0) {
  console.error(`Unknown slug "${slug}". Known: ${covers.map((c) => c.slug).join(', ')}`);
  process.exit(1);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: COVER_WIDTH, height: COVER_HEIGHT },
    deviceScaleFactor: 1,
  });
  for (const config of selected) {
    const html = buildCoverHtml(config, {
      logo: await toDataUri(config.logo),
      screenshots: await Promise.all(config.screenshots.map(toDataUri)),
    });
    await page.setContent(html, { waitUntil: 'load' });
    const png = await page.screenshot({ type: 'png' });
    const out = coverOutputPath(root, config.slug);
    await mkdir(path.dirname(out), { recursive: true });
    await sharp(png).webp({ quality: 88 }).toFile(out);
    console.warn(`${config.slug}: ${path.relative(root, out)}`);
  }
} finally {
  await browser.close();
}
