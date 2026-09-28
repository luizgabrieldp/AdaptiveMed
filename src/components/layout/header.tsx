'use client';

import React from 'react';
import Link from 'next/link';
import { Stethoscope, Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from './theme-provider';
import { useData } from '@/lib/store/data-context';
import { Button } from '@/components/ui/button';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { isDemoMode } = useData();

  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/75 backdrop-blur-md px-4 py-3">
      <Link href="/dashboard" className="flex items-center space-x-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-emerald-500 shadow-md shadow-blue-500/20">
          <Stethoscope className="h-4 w-4 text-white stroke-[2.2]" />
        </div>
        <span className="font-bold text-lg text-foreground tracking-tight">
          AdaptiveMed
        </span>
      </Link>

      <div className="flex items-center space-x-2">
        {isDemoMode && (
          <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 border border-blue-500/20">
            <Sparkles className="h-3 w-3" /> Demo
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
};
