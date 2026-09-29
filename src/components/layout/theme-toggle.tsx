'use client';

import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from './theme-provider';
import { Button } from '@/components/ui/button';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className, showLabel = false }) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  return (
    <div className={`flex items-center rounded-xl bg-muted/60 p-1 border border-border/80 ${className || ''}`}>
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
          theme === 'light'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Modo Claro"
      >
        <Sun className="h-3.5 w-3.5" />
        {showLabel && <span>Claro</span>}
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
          theme === 'dark'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Modo Escuro"
      >
        <Moon className="h-3.5 w-3.5" />
        {showLabel && <span>Escuro</span>}
      </button>

      <button
        type="button"
        onClick={() => setTheme('system')}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
          theme === 'system'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Automático (Acompanha o Sistema Operacional)"
      >
        <Laptop className="h-3.5 w-3.5" />
        {showLabel && <span>Auto</span>}
      </button>
    </div>
  );
};
