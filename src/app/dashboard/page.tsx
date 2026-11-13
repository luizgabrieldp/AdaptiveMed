'use client';

import React from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import { BentoGrid } from '@/components/dashboard/bento-grid';
import { WeeklySchedule } from '@/components/dashboard/weekly-schedule';
import { AreaPerformanceChart } from '@/components/dashboard/area-chart';
import { ActivityHeatmap } from '@/components/evolution/activity-heatmap';
import { Button } from '@/components/ui/button';
import { useData } from '@/lib/store/data-context';
import { formatGreetingName } from '@/lib/utils';
import {
  HeartPulse,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  Trees,
} from 'lucide-react';

export default function DashboardPage() {
  const { profile, errorLogs } = useData();
  const pendingErrorsCount = errorLogs.filter(e => !e.is_reviewed).length;

  const todayFormatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header / Welcome */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Olá, {formatGreetingName(profile?.full_name)}
              </h1>
              <HeartPulse className="h-6 w-6 text-rose-500" />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground capitalize mt-0.5">
              {todayFormatted} • Foco:{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {profile?.target_specialty || 'Residência Médica'}
              </span>
              {profile?.target_cutoff_percentage && (
                <span className="ml-2 font-medium text-emerald-600 dark:text-emerald-400">
                  • Meta de Corte: {profile.target_cutoff_percentage}%
                </span>
              )}
              {profile?.target_exams && profile.target_exams.length > 0 && (
                <span className="ml-2 font-medium text-indigo-600 dark:text-indigo-400">
                  • Bancas: {profile.target_exams.join(', ')}
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/foco">
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 font-semibold border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
              >
                <Trees className="h-3.5 w-3.5 text-emerald-500" />
                <span>Foco & Floresta</span>
              </Button>
            </Link>

            <Link href="/erros">
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 font-semibold border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/10"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                <span>Caderno de Erros</span>
                {pendingErrorsCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold leading-none">
                    {pendingErrorsCount}
                  </span>
                )}
              </Button>
            </Link>

            <Link href="/diario">
              <Button
                size="sm"
                className="text-xs gap-1.5 font-bold shadow-md shadow-primary/20"
              >
                <BookOpen className="h-4 w-4" /> Acessar Diário <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Bento Grid de Monitoramento */}
        <BentoGrid />

        {/* Agenda da Semana (Segunda a Domingo + Meta da Semana) */}
        <WeeklySchedule />

        {/* Gráfico de Desempenho por Grande Área */}
        <div className="grid grid-cols-1 gap-6">
          <AreaPerformanceChart />
        </div>

        {/* Heatmap Anual de Consistência */}
        <ActivityHeatmap />
      </div>
    </AppLayout>
  );
}
