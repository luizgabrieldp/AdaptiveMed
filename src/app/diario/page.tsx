'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { DiaryDayView } from '@/components/diary/diary-day-view';
import { DiaryWeekView } from '@/components/diary/diary-week-view';
import { DiaryMonthView } from '@/components/diary/diary-month-view';
import { ReviewsTable } from '@/components/reviews/reviews-table';
import { PlanTopicModal } from '@/components/diary/plan-topic-modal';
import { NewTopicModal } from '@/components/dashboard/new-topic-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/lib/store/data-context';
import { getTodayDateString, formatDateBR } from '@/lib/spaced-repetition';
import { exportTopicsAndReviewsToCSV } from '@/lib/export/csv-generator';
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  Table as TableIcon,
  Plus,
  BookOpen,
  Download,
  CalendarCheck2,
  Sparkles,
} from 'lucide-react';

type ViewMode = 'dia' | 'semana' | 'mes' | 'tabela';

export default function DiarioPage() {
  const { topics, reviews, stats } = useData();

  const [viewMode, setViewMode] = useState<ViewMode>('semana');
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateString());

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [newTopicModalOpen, setNewTopicModalOpen] = useState(false);

  // Lê parâmetros da URL caso informado via link externo ou navegação (ex: ?view=dia&date=2026-10-01)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlView = params.get('view');
      const urlDate = params.get('date');

      if (urlView && ['dia', 'semana', 'mes', 'tabela'].includes(urlView)) {
        setViewMode(urlView as ViewMode);
      }
      if (urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate)) {
        setSelectedDate(urlDate);
      }
    }
  }, []);

  const handleSelectDayFromView = (dateStr: string) => {
    setSelectedDate(dateStr);
    setViewMode('dia');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Diário
              </h1>
              <div className="p-1 rounded-lg bg-primary/10 text-primary">
                <CalendarCheck2 className="h-6 w-6 stroke-[2.2]" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Planejamento de estudos, metas semanais e cronograma adaptativo de repetição espaçada.
            </p>
          </div>

          {/* Ações Rápidas */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportTopicsAndReviewsToCSV(topics, reviews)}
              className="text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Exportar</span> CSV
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPlanModalOpen(true)}
              className="text-xs gap-1.5 font-semibold text-primary border-primary/30 hover:bg-primary/10"
            >
              <Plus className="h-3.5 w-3.5" /> Programar Estudo
            </Button>

            <Button
              size="sm"
              onClick={() => setNewTopicModalOpen(true)}
              className="text-xs gap-1.5 font-bold shadow-md shadow-primary/20"
            >
              <BookOpen className="h-4 w-4" /> Registrar Assunto Estudado
            </Button>
          </div>
        </div>

        {/* Barra de Seleção de Visualização */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 bg-muted/50 rounded-2xl border border-border">
          {/* Segmented Control */}
          <div className="grid grid-cols-4 sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('dia')}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                viewMode === 'dia'
                  ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Dia</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('semana')}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                viewMode === 'semana'
                  ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Semana</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('mes')}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                viewMode === 'mes'
                  ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
              }`}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              <span>Mês</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('tabela')}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                viewMode === 'tabela'
                  ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Tabela</span>
            </button>
          </div>

          {/* Indicador de Data Ativa quando no modo Dia */}
          {viewMode === 'dia' && (
            <div className="flex items-center px-3 text-xs text-muted-foreground font-medium">
              Data selecionada: <span className="font-bold text-foreground ml-1">{formatDateBR(selectedDate)}</span>
            </div>
          )}
        </div>

        {/* Conteúdo Ativo */}
        <div>
          {viewMode === 'dia' && (
            <DiaryDayView
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          )}

          {viewMode === 'semana' && (
            <DiaryWeekView
              onSelectDay={handleSelectDayFromView}
            />
          )}

          {viewMode === 'mes' && (
            <DiaryMonthView
              currentDate={selectedDate}
              onSelectDay={handleSelectDayFromView}
            />
          )}

          {viewMode === 'tabela' && (
            <div className="space-y-4">
              <ReviewsTable />
            </div>
          )}
        </div>
      </div>

      {/* Modais Globais */}
      <PlanTopicModal
        open={planModalOpen}
        onOpenChange={setPlanModalOpen}
        defaultDate={selectedDate}
      />

      <NewTopicModal
        open={newTopicModalOpen}
        onOpenChange={setNewTopicModalOpen}
      />
    </AppLayout>
  );
}
