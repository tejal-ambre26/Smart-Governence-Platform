import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('civicpulse_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  const applyTheme = (t) => {
    const isDark = t === 'dark';
    const root = document.documentElement;

    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark-mode');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      document.body.classList.remove('dark-mode');
    }
  };

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('civicpulse_theme', theme);
  }, [theme]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme === 'dark' ? 'dark' : 'light');
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, effectiveTheme: theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'light',
      setTheme: () => {},
      toggleTheme: () => {},
      effectiveTheme: 'light',
    };
  }
  return context;
}

