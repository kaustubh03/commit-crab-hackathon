import * as React from 'react';
import { Button } from '../../ui/button';

// Simple theme toggle component storing preference in localStorage and
// toggling the `dark` class on <html>. Avoids hydration mismatch by reading
// initial state from documentElement.
export const ThemeToggle: React.FC = () => {
  const storageKey = 'cc-theme';
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light'
  );

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    try {
      localStorage.setItem(storageKey, theme);
    } catch (_) {
      // ignore write errors (e.g. private mode)
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <Button size="sm" variant="ghost" aria-label="Toggle theme" onClick={toggle} className="w-full justify-start">
      {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
    </Button>
  );
};
