const WORDS_PER_MINUTE = 200;

export function calculateReadingTime(content: string): number {
  const cleaned = content
    // Remove fenced code blocks (including triple-backtick fences and their contents)
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`[^`]*`/g, '')
    // Remove image syntax ![alt](src)
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // Replace link syntax [text](url) with just "text"
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    // Strip inline markdown punctuation
    .replace(/[#*_~>[\]]/g, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned ? cleaned.split(' ').length : 0;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

// Minimal remark plugin that extracts text from the parsed MDX AST,
// computes reading time, and writes it into the frontmatter.
// Astro's MDX integration exposes the parsed file's frontmatter at `file.data.astro.frontmatter`.
export function remarkReadingTime() {
  return function transformer(tree: unknown, file: { data?: Record<string, unknown> }): void {
    const toText = (node: unknown): string => {
      if (typeof node !== 'object' || node === null) return '';
      const n = node as { value?: string; children?: unknown[] };
      if (typeof n.value === 'string') return n.value;
      if (Array.isArray(n.children)) return n.children.map(toText).join(' ');
      return '';
    };

    const content = toText(tree);
    const rt = calculateReadingTime(content);

    file.data ??= {};
    const astroData = (file.data.astro ??= {}) as Record<string, unknown>;
    const frontmatter = (astroData.frontmatter ??= {}) as Record<string, unknown>;
    frontmatter.readingTime = rt;
  };
}
