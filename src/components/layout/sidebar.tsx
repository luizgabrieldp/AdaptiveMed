'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck2,
  TrendingUp,
  GraduationCap,
  LogOut,
  Flame,
  Stethoscope,
  Sparkles,
  SlidersHorizontal,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useData } from '@/lib/store/data-context';
import { useTheme } from './theme-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ManageAreasModal } from '@/components/dashboard/manage-areas-modal';
import { NotificationManager } from '@/components/notifications/notification-manager';
import { ThemeToggle } from './theme-toggle';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { profile, stats, topics, isDemoMode, signOut } = useData();
  const { theme } = useTheme();
  const [manageAreasOpen, setManageAreasOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Lê preferência de sidebar encolhida do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adaptivemed_sidebar_collapsed');
      if (saved === 'true') {
        setIsCollapsed(true);
      }
    }
  }, []);

  const toggleCollapsed = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('adaptivemed_sidebar_collapsed', String(next));
    }
  };

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: stats.todayReviewsCount > 0 ? String(stats.todayReviewsCount) : undefined,
      badgeVariant: 'hoje' as const,
    },
    {
      label: 'Diário',
      href: '/diario',
      icon: CalendarCheck2,
      badge: topics.length > 0 ? String(topics.length) : undefined,
      badgeVariant: 'secondary' as const,
    },
    {
      label: 'Assuntos Prevalentes',
      href: '/prevalencia',
      icon: Flame,
      badge: 'Banca',
      badgeVariant: 'hoje' as const,
    },
    {
      label: 'Curva & Evolução',
      href: '/evolucao',
      icon: TrendingUp,
    },
    {
      label: 'Simulados & Provas',
      href: '/simulados',
      icon: GraduationCap,
    },
    {
      label: 'Minha Conta & Assinatura',
      href: '/conta',
      icon: CreditCard,
    },
  ];

  return (
    <aside
      className={`hidden lg:flex flex-col justify-between border-r border-border bg-card/70 backdrop-blur-md p-3.5 sm:p-4 shrink-0 h-full overflow-y-auto transition-all duration-200 select-none ${
        isCollapsed ? 'w-[78px]' : 'w-72'
      }`}
    >
      <div>
        {/* Top Header: Logo + Toggle Encolher/Expandir */}
        <div className="flex items-center justify-between mb-6 px-1">
          <Link
            href="/dashboard"
            className="flex items-center space-x-3 group min-w-0"
            title="AdaptiveMed - Residência Médica"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Stethoscope className="h-5 w-5 text-white stroke-[2.2]" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent block truncate">
                  AdaptiveMed
                </span>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  Residência Médica
                </p>
              </div>
            )}
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 rounded-lg"
            title={isCollapsed ? 'Expandir barra lateral' : 'Encolher barra lateral'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Streak & Status */}
        {isCollapsed ? (
          <div
            className="mb-5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center cursor-default"
            title={`${stats.currentStreak} dias de ofensiva ativa`}
          >
            <Flame className="h-4 w-4 text-amber-500 fill-amber-500 animate-pulse" />
            <span className="text-[11px] font-black text-amber-400 mt-0.5">
              {stats.currentStreak}d
            </span>
          </div>
        ) : (
          <div className="mb-6 mx-1 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                <Flame className="h-4 w-4 fill-amber-500 text-amber-500 animate-pulse" />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-foreground truncate">
                  {stats.currentStreak} {stats.currentStreak === 1 ? 'dia' : 'dias'} de ofensiva
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {stats.streakQualifiedToday ? 'Ofensiva garantida hoje!' : 'Meta: 10 Qs ou 1 Simulado'}
                </p>
              </div>
            </div>
            {stats.todayReviewsCount > 0 && (
              <Badge variant="hoje" className="text-[10px] px-1.5 py-0.5 shrink-0">
                {stats.todayReviewsCount} hoje
              </Badge>
            )}
          </div>
        )}

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map(item => {
            const isActive =
              pathname === item.href ||
              (item.href === '/diario' && pathname === '/revisoes');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center rounded-xl text-xs font-semibold transition-all relative ${
                  isCollapsed
                    ? 'justify-center p-2.5'
                    : 'justify-between px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 font-bold'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} min-w-0`}>
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {item.badge && (
                  isCollapsed ? (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-400" />
                  ) : (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] rounded-md font-semibold shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badgeVariant === 'hoje'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )
                )}
              </Link>
            );
          })}
        </nav>

        {/* Gestão de Grandes Áreas (Sem exportação de calendário) */}
        <div className="mt-5 pt-4 border-t border-border/70 space-y-1">
          {!isCollapsed && (
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 mb-1.5">
              Personalização
            </p>
          )}
          <button
            type="button"
            onClick={() => setManageAreasOpen(true)}
            className={`w-full flex items-center rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors ${
              isCollapsed ? 'justify-center p-2.5' : 'space-x-2.5 px-3 py-2 text-left'
            }`}
            title="Gerenciar Grandes Áreas"
          >
            <SlidersHorizontal className="h-4 w-4 text-primary shrink-0" />
            {!isCollapsed && <span className="truncate">Gerenciar Grandes Áreas</span>}
          </button>
        </div>
      </div>

      {/* Footer: Perfil + Notificação + Tema */}
      <div className="pt-4 border-t border-border/70 space-y-3">
        {isDemoMode && !isCollapsed && (
          <div className="flex items-center justify-between text-[11px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg">
            <span className="flex items-center gap-1.5 font-medium truncate">
              <Sparkles className="h-3.5 w-3.5 shrink-0" /> Modo Demonstração
            </span>
          </div>
        )}

        {/* Seletor de Tema */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <span className="text-[11px] font-semibold text-muted-foreground">Tema:</span>
          )}
          <ThemeToggle />
        </div>

        {/* Informações do Usuário + Sair */}
        <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2' : 'justify-between'}`}>
          <Link
            href="/conta"
            className="flex items-center space-x-2.5 overflow-hidden group hover:opacity-85 transition-opacity flex-1 min-w-0"
            title="Minha Conta & Assinatura"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              {profile?.full_name ? profile.full_name.slice(0, 2).toUpperCase() : 'DR'}
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                  {profile?.full_name || 'Estudante de Medicina'}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {profile?.target_specialty || 'Residência Médica'}
                </p>
              </div>
            )}
          </Link>

          <div className={`flex items-center ${isCollapsed ? 'space-x-0 space-y-1 flex-col' : 'space-x-1 shrink-0'}`}>
            <NotificationManager />
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                await signOut();
                window.location.href = '/login';
              }}
              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
              title="Sair da Plataforma"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Gestão de Grandes Áreas */}
      <ManageAreasModal
        open={manageAreasOpen}
        onOpenChange={setManageAreasOpen}
      />
    </aside>
  );
};
