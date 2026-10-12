import { describe, it, expect } from 'vitest';
import { validateCoverConfig, type CoverConfig } from '../../scripts/covers/config.ts';
import { buildCoverHtml, escapeHtml, coverOutputPath } from '../../scripts/covers/html.ts';

const base: CoverConfig = {
  slug: 'demo',
  title: 'Demo <App>',
  tagline: 'Line one\nLine two',
  pill: 'iOS · Android',
  gradient: ['#111111', '#222222', '#333333', '#444444'],
  textColor: '#ffffff',
  logo: 'assets/demo/logo.png',
  screenshots: ['assets/demo/a.png'],
  frame: 'phone',
};

describe('validateCoverConfig', () => {
  it('accepts a valid config', () => {
    expect(validateCoverConfig(base)).toEqual([]);
  });

  it('rejects a slug that is not kebab-case', () => {
    expect(validateCoverConfig({ ...base, slug: '../evil' })).toContain(
      'slug must be lowercase kebab-case'
    );
  });

  it('rejects an empty title', () => {
    expect(validateCoverConfig({ ...base, title: ' ' })).toContain('title is required');
  });

  it('requires at least one screenshot and at most two', () => {
    expect(validateCoverConfig({ ...base, screenshots: [] })).toContain(
      'screenshots needs 1 or 2 entries'
    );
    expect(validateCoverConfig({ ...base, screenshots: ['a', 'b', 'c'] })).toContain(
      'screenshots needs 1 or 2 entries'
    );
  });

  it('restricts two screenshots to the phone frame', () => {
    expect(validateCoverConfig({ ...base, frame: 'browser', screenshots: ['a', 'b'] })).toContain(
      'browser frame takes exactly 1 screenshot'
    );
  });

  it('requires 2 to 5 valid hex gradient stops', () => {
    expect(validateCoverConfig({ ...base, gradient: ['#111111'] })).toContain(
      'gradient needs 2 to 5 hex colors'
    );
    expect(validateCoverConfig({ ...base, gradient: ['#111111', 'red'] })).toContain(
      'gradient needs 2 to 5 hex colors'
    );
  });

  it('rejects a non-hex text color', () => {
    expect(validateCoverConfig({ ...base, textColor: 'white' })).toContain(
      'textColor must be a hex color'
    );
  });
});

describe('escapeHtml', () => {
  it('escapes markup characters', () => {
    expect(escapeHtml(`<a href="x">&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;'
    );
  });
});

describe('buildCoverHtml', () => {
  const srcs = { logo: 'data:image/png;base64,L', screenshots: ['data:image/png;base64,S'] };

  it('renders the canvas, copy and escaped title', () => {
    const html = buildCoverHtml(base, srcs);
    expect(html).toContain('width:1600px;height:1000px');
    expect(html).toContain('<h1>Demo &lt;App&gt;</h1>');
    expect(html).toContain('Line one<br>Line two');
    expect(html).toContain('iOS · Android');
    expect(html).toContain('data:image/png;base64,L');
  });

  it('turns a newline in the title into a line break', () => {
    const html = buildCoverHtml({ ...base, title: 'Happiness\nTo Go' }, srcs);
    expect(html).toContain('<h1>Happiness<br>To Go</h1>');
  });

  it('builds the radial gradient from the stops', () => {
    const html = buildCoverHtml(base, srcs);
    expect(html).toContain('#111111 0%');
    expect(html).toContain('#444444 100%');
  });

  it('uses the phone frame', () => {
    const html = buildCoverHtml(base, srcs);
    expect(html).toContain('class="phone"');
    expect(html).not.toContain('class="browser"');
  });

  it('uses the browser frame', () => {
    const html = buildCoverHtml({ ...base, frame: 'browser' }, srcs);
    expect(html).toContain('class="browser"');
    expect(html).not.toContain('class="phone"');
  });

  it('overlaps two phones', () => {
    const html = buildCoverHtml(base, {
      logo: 'L',
      screenshots: ['data:image/png;base64,S1', 'data:image/png;base64,S2'],
    });
    expect(html.match(/class="phone/g)).toHaveLength(2);
    expect(html).toContain('phone second');
  });

  it('throws on an invalid config', () => {
    expect(() => buildCoverHtml({ ...base, slug: 'BAD' }, srcs)).toThrow(/slug/);
  });
});

describe('coverOutputPath', () => {
  it('resolves under public/images/work/<slug>/cover.webp', () => {
    expect(coverOutputPath('/repo', 'ur-pov')).toBe('/repo/public/images/work/ur-pov/cover.webp');
  });

  it('rejects an invalid slug', () => {
    expect(() => coverOutputPath('/repo', '../x')).toThrow(/slug/);
  });
});
