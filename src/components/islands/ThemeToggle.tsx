import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme') as Theme | null;
      if (stored === 'light' || stored === 'dark') {
        setTheme(stored);
        return;
      }
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      setTheme(prefersLight ? 'light' : 'dark');
    } catch {
      /* ignore: localStorage/matchMedia unavailable — keep SSR default 'dark' */
    }
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* ignore: localStorage unavailable — theme still applies for this session */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      aria-pressed={theme === 'light'}
      className="font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] border border-[var(--color-border)] px-2 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}
