'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  Sparkles,
  Trees,
  SlidersHorizontal,
  User,
  LogOut,
} from 'lucide-react';
import { useData } from '@/lib/store/data-context';
import { NotificationManager } from '@/components/notifications/notification-manager';
import { ManageAreasModal } from '@/components/dashboard/manage-areas-modal';
import { ThemeToggle } from './theme-toggle';

export const Header: React.FC = () => {
  const { isDemoMode, signOut } = useData();
  const [manageAreasOpen, setManageAreasOpen] = useState(false);

  return (
    <>
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-1.5 sm:gap-2 border-b border-border bg-card/85 backdrop-blur-md px-2 sm:px-3.5 py-2.5">
        <Link
          href="/dashboard"
          aria-label="AdaptiveMed - Ir para o Painel"
          className="flex items-center gap-1.5 sm:gap-2 min-w-0"
        >
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-emerald-500 shadow-md shadow-blue-500/20 shrink-0">
            <Stethoscope className="h-4 w-4 text-white stroke-[2.2]" />
          </div>
          <span className="hidden min-[410px]:inline font-bold text-xs sm:text-base text-foreground tracking-tight truncate">
            AdaptiveMed
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {isDemoMode && (
            <span className="hidden sm:flex text-[10px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full items-center gap-1 border border-blue-500/20">
              <Sparkles className="h-3 w-3" /> Demo
            </span>
          )}
          <Link
            href="/foco"
            title="Foco & Floresta"
            aria-label="Foco & Floresta"
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg border border-border bg-muted/40 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-colors shrink-0"
          >
            <Trees className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Link>
          <NotificationManager />
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setManageAreasOpen(true)}
            title="Gerenciar Grandes Áreas"
            aria-label="Gerenciar Grandes Áreas"
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg border border-border bg-muted/40 hover:bg-primary/15 text-primary flex items-center justify-center transition-colors shrink-0"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
          <Link
            href="/conta"
            title="Minha Conta & Assinatura"
            aria-label="Minha Conta & Assinatura"
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg border border-border bg-muted/40 hover:bg-muted text-foreground flex items-center justify-center transition-colors shrink-0"
          >
            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Link>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              window.location.href = '/login';
            }}
            title="Sair da Plataforma"
            aria-label="Sair da Plataforma"
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg border border-border bg-muted/40 hover:bg-destructive/15 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors shrink-0"
          >
            <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </header>

      <ManageAreasModal
        open={manageAreasOpen}
        onOpenChange={setManageAreasOpen}
      />
    </>
  );
};
