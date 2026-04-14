interface Props {
  currentLocale: 'es' | 'en';
  targetPath: string | null;
  targetHomePath: string;
}

export default function LanguageSwitcher({ currentLocale, targetPath, targetHomePath }: Props) {
  const other: 'es' | 'en' = currentLocale === 'es' ? 'en' : 'es';

  const onClick = () => {
    if (targetPath) {
      window.location.href = targetPath;
      return;
    }
    // No sibling translation — flash a toast via sessionStorage picked up by
    // a tiny listener in Layout.astro, then fall back to the localized home.
    try {
      sessionStorage.setItem('missing-translation', '1');
    } catch {
      /* ignore: sessionStorage unavailable (private mode, locked down env) */
    }
    window.location.href = targetHomePath;
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Switch to ${other.toUpperCase()}`}
      className="font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] border border-[var(--color-border)] px-2 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
    >
      {currentLocale.toUpperCase()} → {other.toUpperCase()}
    </button>
  );
}
