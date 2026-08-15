import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme, setTheme } = useTheme();

  const isDark = theme === 'dark';

  const handleToggle = () => {
    if (toggleTheme) {
      toggleTheme();
    } else {
      setTheme(isDark ? 'light' : 'dark');
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={`Theme: ${isDark ? 'Dark' : 'Light'} (Click to switch)`}
      aria-label="Toggle theme"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-xs font-semibold shadow-xs cursor-pointer"
    >
      {isDark ? (
        <>
          <Moon className="h-4 w-4 text-indigo-400 fill-indigo-400/20" />
          <span>Dark</span>
        </>
      ) : (
        <>
          <Sun className="h-4 w-4 text-amber-500 fill-amber-500/20" />
          <span>Light</span>
        </>
      )}
    </button>
  );
}

