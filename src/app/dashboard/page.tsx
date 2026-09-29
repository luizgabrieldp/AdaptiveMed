'use client';

import React from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import { BentoGrid } from '@/components/dashboard/bento-grid';
import { WeeklySchedule } from '@/components/dashboard/weekly-schedule';
import { AreaPerformanceChart } from '@/components/dashboard/area-chart';
import { Button } from '@/components/ui/button';
import { useData } from '@/lib/store/data-context';
import { downloadICalendar } from '@/lib/export/ical-generator';
import { exportTopicsAndReviewsToCSV } from '@/lib/export/csv-generator';
import { formatGreetingName } from '@/lib/utils';
import {
  Calendar,
  Download,
  HeartPulse,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

export default function DashboardPage() {
  const { profile, topics, reviews } = useData();

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
              <HeartPulse className="h-6 w-6 text-rose-500 animate-pulse" />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground capitalize mt-0.5">
              {todayFormatted} • Foco:{' '}
              <span className="font-semibold text-blue-400">
                {profile?.target_specialty || 'Residência Médica'}
              </span>
              {profile?.target_cutoff_percentage && (
                <span className="ml-2 font-medium text-emerald-400">
                  • Meta de Corte: {profile.target_cutoff_percentage}%
                </span>
              )}
              {profile?.target_exams && profile.target_exams.length > 0 && (
                <span className="ml-2 font-medium text-indigo-400">
                  • Bancas: {profile.target_exams.join(', ')}
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportTopicsAndReviewsToCSV(topics, reviews)}
              className="text-xs gap-1.5"
              title="Baixar planilha de dados em CSV / Excel"
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadICalendar(topics, reviews)}
              className="text-xs gap-1.5"
              title="Exportar para Google Calendar / Apple Calendar"
            >
              <Calendar className="h-3.5 w-3.5 text-blue-400" /> Sincronizar Calendário
            </Button>

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
      </div>
    </AppLayout>
  );
}
