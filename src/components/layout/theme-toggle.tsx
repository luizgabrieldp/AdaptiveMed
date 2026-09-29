'use client';

import React, { useState } from 'react';
import { Sun, Moon, Laptop, ChevronDown } from 'lucide-react';
import { useTheme } from './theme-provider';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  isCollapsed?: boolean;
  onExpandSidebar?: () => void;
  interactiveExpand?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className,
  showLabel = false,
  isCollapsed = false,
  onExpandSidebar,
  interactiveExpand = false,
}) => {
  const { theme, setTheme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  const getThemeIcon = (t: string) => {
    switch (t) {
      case 'light':
        return <Sun className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
      case 'dark':
        return <Moon className="h-3.5 w-3.5 text-indigo-400 shrink-0" />;
      case 'system':
      default:
        return <Laptop className="h-3.5 w-3.5 text-blue-400 shrink-0" />;
    }
  };

  const getThemeLabel = (t: string) => {
    switch (t) {
      case 'light':
        return 'Claro';
      case 'dark':
        return 'Escuro';
      case 'system':
      default:
        return 'Auto';
    }
  };

  // 1. Barra Lateral Encolhida:
  // Mostra apenas 1 ícone compacto. Ao clicar nele, expande automaticamente a barra lateral!
  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={() => onExpandSidebar?.()}
        className={`h-9 w-9 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/80 transition-all flex items-center justify-center group ${className || ''}`}
        title="Alterar tema (expandir barra lateral)"
        aria-label="Alterar tema"
      >
        <span className="group-hover:scale-110 transition-transform">
          {getThemeIcon(theme)}
        </span>
      </button>
    );
  }

  // 2. Barra Lateral Estendida (modo dinâmico diminuir/aumentar):
  // Em repouso: exibe apenas o tema escolhido.
  // Ao passar o mouse (hover) ou focar: expande mostrando Claro, Escuro e Auto.
  if (interactiveExpand) {
    return (
      <div
        className={`relative inline-block transition-all duration-200 ${className || ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isHovered ? (
          <div className="flex items-center rounded-xl bg-muted/95 p-1 border border-border/90 shadow-lg animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => {
                setTheme('light');
                setIsHovered(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                theme === 'light'
                  ? 'bg-card text-foreground shadow-xs ring-1 ring-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
              }`}
              title="Modo Claro"
            >
              <Sun className="h-3.5 w-3.5 text-amber-500" />
              <span>Claro</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTheme('dark');
                setIsHovered(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                theme === 'dark'
                  ? 'bg-card text-foreground shadow-xs ring-1 ring-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
              }`}
              title="Modo Escuro"
            >
              <Moon className="h-3.5 w-3.5 text-indigo-400" />
              <span>Escuro</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTheme('system');
                setIsHovered(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                theme === 'system'
                  ? 'bg-card text-foreground shadow-xs ring-1 ring-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
              }`}
              title="Automático (Acompanha o Sistema Operacional)"
            >
              <Laptop className="h-3.5 w-3.5 text-blue-400" />
              <span>Auto</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsHovered(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/60 hover:bg-muted text-xs font-semibold text-foreground border border-border/80 transition-all shadow-2xs group"
            title="Passe o mouse ou clique para alterar o tema"
          >
            {getThemeIcon(theme)}
            <span>{getThemeLabel(theme)}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </div>
    );
  }

  // 3. Fallback Padrão (ex: cabeçalho móvel / outras telas):
  return (
    <div className={`flex items-center rounded-xl bg-muted/60 p-1 border border-border/80 ${className || ''}`}>
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
          theme === 'light'
            ? 'bg-card text-foreground shadow-xs'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Modo Claro"
      >
        <Sun className="h-3.5 w-3.5 text-amber-500" />
        {showLabel && <span>Claro</span>}
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
          theme === 'dark'
            ? 'bg-card text-foreground shadow-xs'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Modo Escuro"
      >
        <Moon className="h-3.5 w-3.5 text-indigo-400" />
        {showLabel && <span>Escuro</span>}
      </button>

      <button
        type="button"
        onClick={() => setTheme('system')}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
          theme === 'system'
            ? 'bg-card text-foreground shadow-xs'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Automático (Acompanha o Sistema Operacional)"
      >
        <Laptop className="h-3.5 w-3.5 text-blue-400" />
        {showLabel && <span>Auto</span>}
      </button>
    </div>
  );
};
