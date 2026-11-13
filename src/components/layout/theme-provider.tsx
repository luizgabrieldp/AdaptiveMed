'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  resolvedTheme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

  const applyTheme = useCallback((targetTheme: Theme, currentPath: string) => {
    let active: 'dark' | 'light';
    if (targetTheme === 'system') {
      if (currentPath === '/') {
        active = 'dark';
      } else {
        const prefersDark =
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches;
        active = prefersDark ? 'dark' : 'light';
      }
    } else {
      active = targetTheme;
    }
    setResolvedTheme(active);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', active === 'dark');
      document.documentElement.classList.toggle('light', active === 'light');
      document.documentElement.style.colorScheme = active;
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('adaptivemed_theme') as Theme | null;
    const initialTheme: Theme =
      saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
    setThemeState(initialTheme);
    applyTheme(initialTheme, pathname);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const currentSaved = localStorage.getItem('adaptivemed_theme') as Theme | null;
      if (!currentSaved || currentSaved === 'system') {
        applyTheme('system', pathname);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
      return () => mediaQuery.removeEventListener('change', handleSystemChange);
    } else {
      mediaQuery.addListener(handleSystemChange);
      return () => mediaQuery.removeListener(handleSystemChange);
    }
  }, [pathname, applyTheme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('adaptivemed_theme', t);
    applyTheme(t, pathname);
  };

  const toggleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
