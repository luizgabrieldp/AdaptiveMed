'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck2,
  TrendingUp,
  GraduationCap,
  Calendar,
  Sun,
  Moon,
  LogOut,
  Flame,
  Stethoscope,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { useData } from '@/lib/store/data-context';
import { useTheme } from './theme-provider';
import { downloadICalendar } from '@/lib/export/ical-generator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ManageAreasModal } from '@/components/dashboard/manage-areas-modal';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { profile, stats, topics, reviews, isDemoMode, signOut } = useData();
  const { theme, toggleTheme } = useTheme();
  const [manageAreasOpen, setManageAreasOpen] = useState(false);

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: stats.todayReviewsCount > 0 ? String(stats.todayReviewsCount) : undefined,
      badgeVariant: 'hoje' as const,
    },
    {
      label: 'Diário de Revisões',
      href: '/revisoes',
      icon: CalendarCheck2,
      badge: topics.length > 0 ? String(topics.length) : undefined,
      badgeVariant: 'secondary' as const,
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
  ];

  return (
    <aside className="hidden lg:flex w-72 flex-col justify-between border-r border-border bg-card/60 backdrop-blur-md p-5 shrink-0 min-h-screen sticky top-0">
      <div>
        {/* Logo & Brand */}
        <Link href="/dashboard" className="flex items-center space-x-3 group px-2 mb-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Stethoscope className="h-6 w-6 text-white stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-xl tracking-tight text-foreground bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
                AdaptiveMed
              </span>
            </div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Residência Médica
            </p>
          </div>
        </Link>

        {/* Streak & Status Pill */}
        <div className="mb-6 mx-2 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Flame className="h-5 w-5 fill-amber-500 text-amber-500 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">
                {stats.currentStreak} {stats.currentStreak === 1 ? 'dia' : 'dias'} de ofensiva
              </p>
              <p className="text-[10px] text-muted-foreground">Sequência ativa</p>
            </div>
          </div>
          {stats.todayReviewsCount > 0 && (
            <Badge variant="hoje" className="text-[11px] px-2 py-0.5">
              {stats.todayReviewsCount} hoje
            </Badge>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 font-semibold'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 text-[11px] rounded-full font-semibold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badgeVariant === 'hoje'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Productivity Quick Export */}
        <div className="mt-6 pt-6 border-t border-border/80 px-2 space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Produtividade & Gestão
          </p>
          <button
            onClick={() => setManageAreasOpen(true)}
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors text-left"
          >
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <span>Gerenciar Grandes Áreas</span>
          </button>
          <button
            onClick={() => downloadICalendar(topics, reviews)}
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors text-left"
          >
            <Calendar className="h-4 w-4 text-blue-400" />
            <span>Sincronizar Calendário (.ics)</span>
          </button>
        </div>
      </div>

      {/* User Footer Profile & Theme Toggle */}
      <div className="pt-4 border-t border-border/80 px-2 space-y-3">
        {isDemoMode && (
          <div className="flex items-center justify-between text-[11px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="h-3 w-3" /> Modo Demonstração
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Link
            href="/onboarding"
            className="flex items-center space-x-3 overflow-hidden group hover:opacity-85 transition-opacity"
            title="Clique para ajustar suas metas e especialidade"
          >
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              {profile?.full_name ? profile.full_name.slice(0, 2).toUpperCase() : 'DR'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {profile?.full_name || 'Estudante de Medicina'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {profile?.target_specialty || 'Residência Médica'}{' '}
                {profile?.target_cutoff_percentage ? `• Meta: ${profile.target_cutoff_percentage}%` : ''}
              </p>
            </div>
          </Link>

          <div className="flex items-center space-x-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                await signOut();
                window.location.href = '/login';
              }}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
