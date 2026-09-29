'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useData } from '@/lib/store/data-context';
import { StudyTopic, TopicReview, getAreaStyle } from '@/types/database';
import {
  getTodayDateString,
  formatDateBR,
  calculateReviewStatus,
} from '@/lib/spaced-repetition';
import { ReviewCompletionModal } from '@/components/dashboard/review-completion-modal';
import { RecordPlannedStudyModal } from './record-planned-study-modal';
import { PlanTopicModal } from './plan-topic-modal';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  CalendarCheck2,
  Flame,
  AlertCircle,
} from 'lucide-react';

interface DiaryMonthViewProps {
  currentDate: string;
  onSelectDay: (dateStr: string) => void;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const DiaryMonthView: React.FC<DiaryMonthViewProps> = ({ currentDate, onSelectDay }) => {
  const { topics, reviews, prevalentTopics, areas } = useData();

  const todayStr = useMemo(() => getTodayDateString(), []);

  // Controla o mês atualmente visualizado
  const [activeYearMonth, setActiveYearMonth] = useState<{ year: number; month: number }>(() => {
    const [y, m] = (currentDate || todayStr).split('-').map(Number);
    return { year: y, month: m - 1 }; // month 0-indexed
  });

  // Modais de ação rápida
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<TopicReview | null>(null);

  const [recordStudyModalOpen, setRecordStudyModalOpen] = useState(false);
  const [selectedPlannedTopic, setSelectedPlannedTopic] = useState<StudyTopic | null>(null);

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planModalDate, setPlanModalDate] = useState<string | undefined>(undefined);

  const handlePrevMonth = () => {
    setActiveYearMonth(prev => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setActiveYearMonth(prev => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const handleCurrentMonth = () => {
    const [y, m] = todayStr.split('-').map(Number);
    setActiveYearMonth({ year: y, month: m - 1 });
  };

  const topicMap = useMemo(() => {
    const map = new Map<string, StudyTopic>();
    topics.forEach(t => map.set(t.id, t));
    return map;
  }, [topics]);

  const highPrevalenceNames = useMemo(() => {
    const set = new Set<string>();
    prevalentTopics.forEach(p => {
      if (p.prevalence_level === 'ALTA' || p.rank_order <= 3) {
        set.add(p.subject_name.trim().toLowerCase());
      }
    });
    return set;
  }, [prevalentTopics]);

  // Montagem da grade do mês
  const calendarDays = useMemo(() => {
    const { year, month } = activeYearMonth;
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Domingo
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    // Dias do mês anterior
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = month === 0 ? 12 : month;
      const prevY = month === 0 ? year - 1 : year;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Dias do mês atual
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Dias do próximo mês para completar semanas completas
    const remainder = cells.length % 7;
    if (remainder !== 0) {
      const needed = 7 - remainder;
      for (let d = 1; d <= needed; d++) {
        const nextM = month === 11 ? 1 : month + 2;
        const nextY = month === 11 ? year + 1 : year;
        const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push({
          dateStr,
          dayNumber: d,
          isCurrentMonth: false,
          isToday: dateStr === todayStr,
        });
      }
    }

    return cells;
  }, [activeYearMonth, todayStr]);

  // Agrupamento de itens por data
  const monthItemsMap = useMemo(() => {
    const map = new Map<
      string,
      Array<{
        type: 'review' | 'planned_study';
        id: string;
        topic?: StudyTopic;
        review?: TopicReview;
        subjectName: string;
        area: string;
        badgeText: string;
        isCompleted: boolean;
        isHighPrevalence: boolean;
        isOverdue: boolean;
      }>
    >();

    // Revisões
    reviews.forEach(r => {
      const topic = topicMap.get(r.topic_id);
      const subjectName = topic?.subject_name || 'Revisão';
      const area = topic?.area || 'Clínica Médica';
      const statusInfo = calculateReviewStatus(r.scheduled_date, r.completed_date, todayStr);
      const isCompleted = Boolean(r.completed_date);
      const isHigh =
        highPrevalenceNames.has(subjectName.toLowerCase()) ||
        Boolean(topic?.tags?.some(t => t.toLowerCase().includes('alta')));

      if (!map.has(r.scheduled_date)) {
        map.set(r.scheduled_date, []);
      }

      map.get(r.scheduled_date)!.push({
        type: 'review',
        id: r.id,
        topic,
        review: r,
        subjectName,
        area,
        badgeText: isCompleted ? `R${r.review_number} Feita` : `R${r.review_number}`,
        isCompleted,
        isHighPrevalence: isHigh,
        isOverdue: statusInfo.status === 'ATRASADO',
      });
    });

    // Estudos planejados
    topics.forEach(t => {
      const planDate = t.planned_date || (t.is_planned ? t.initial_date : null);
      if (t.is_planned && planDate) {
        const isHigh =
          highPrevalenceNames.has(t.subject_name.toLowerCase()) ||
          Boolean(t.tags?.some(tag => tag.toLowerCase().includes('alta')));

        if (!map.has(planDate)) {
          map.set(planDate, []);
        }

        map.get(planDate)!.push({
          type: 'planned_study',
          id: t.id,
          topic: t,
          subjectName: t.subject_name,
          area: t.area,
          badgeText: 'A Estudar',
          isCompleted: false,
          isHighPrevalence: isHigh,
          isOverdue: planDate < todayStr,
        });
      }
    });

    return map;
  }, [reviews, topics, topicMap, highPrevalenceNames, todayStr]);

  // Estatísticas do Mês Atual
  const monthStats = useMemo(() => {
    const { year, month } = activeYearMonth;
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    let totalReviews = 0;
    let completedReviews = 0;
    let overdueReviews = 0;
    let plannedTopicsCount = 0;

    reviews.forEach(r => {
      if (r.scheduled_date.startsWith(prefix)) {
        totalReviews++;
        if (r.completed_date) {
          completedReviews++;
        } else if (r.scheduled_date < todayStr) {
          overdueReviews++;
        }
      }
    });

    topics.forEach(t => {
      const planDate = t.planned_date || (t.is_planned ? t.initial_date : null);
      if (t.is_planned && planDate && planDate.startsWith(prefix)) {
        plannedTopicsCount++;
      }
    });

    const completionRate =
      totalReviews > 0 ? Math.round((completedReviews / totalReviews) * 100) : 0;

    return {
      totalReviews,
      completedReviews,
      overdueReviews,
      plannedTopicsCount,
      completionRate,
    };
  }, [reviews, topics, activeYearMonth, todayStr]);

  const handleOpenItem = (
    e: React.MouseEvent,
    item: {
      type: 'review' | 'planned_study';
      topic?: StudyTopic;
      review?: TopicReview;
    }
  ) => {
    e.stopPropagation();
    if (item.type === 'review' && item.review) {
      setSelectedReview(item.review);
      setCompletionModalOpen(true);
    } else if (item.type === 'planned_study' && item.topic) {
      setSelectedPlannedTopic(item.topic);
      setRecordStudyModalOpen(true);
    }
  };

  const handleOpenPlanForDate = (e: React.MouseEvent, dateStr: string) => {
    e.stopPropagation();
    setPlanModalDate(dateStr);
    setPlanModalOpen(true);
  };

  const isCurrentViewingMonth =
    activeYearMonth.year === Number(todayStr.split('-')[0]) &&
    activeYearMonth.month === Number(todayStr.split('-')[1]) - 1;

  return (
    <div className="space-y-4">
      {/* Navegador do Mês */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl bg-card border border-border shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-foreground">
                {MONTH_NAMES[activeYearMonth.month]} de {activeYearMonth.year}
              </h3>
              {isCurrentViewingMonth && (
                <Badge variant="hoje" className="text-[10px]">
                  Mês Atual
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Visão macro dos seus ciclos espaçados e estudos programados no calendário mensal.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevMonth}
            className="h-8 w-8 p-0"
            title="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant={isCurrentViewingMonth ? 'default' : 'outline'}
            size="sm"
            onClick={handleCurrentMonth}
            className="h-8 text-xs font-semibold px-3"
          >
            Mês Atual
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            className="h-8 w-8 p-0"
            title="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mini Resumo do Mês */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 bg-card border-border">
          <p className="text-[11px] font-medium text-muted-foreground">Total de Revisões</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-foreground">
              {monthStats.totalReviews}
            </span>
            <Badge variant="outline" className="text-[10px]">
              Agendadas
            </Badge>
          </div>
        </Card>

        <Card className="p-3 bg-card border-border">
          <p className="text-[11px] font-medium text-muted-foreground">Revisões Realizadas</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-emerald-400">
              {monthStats.completedReviews}
            </span>
            <Badge variant="concluido" className="text-[10px]">
              {monthStats.completionRate}%
            </Badge>
          </div>
        </Card>

        <Card className="p-3 bg-card border-border">
          <p className="text-[11px] font-medium text-muted-foreground">Estudos Programados</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-blue-400">
              {monthStats.plannedTopicsCount}
            </span>
            <Badge variant="secondary" className="text-[10px]">
              Na Agenda
            </Badge>
          </div>
        </Card>

        <Card className="p-3 bg-card border-border">
          <p className="text-[11px] font-medium text-muted-foreground">Revisões Atrasadas</p>
          <div className="flex items-baseline justify-between mt-1">
            <span
              className={`text-xl font-extrabold ${
                monthStats.overdueReviews > 0 ? 'text-rose-400' : 'text-muted-foreground'
              }`}
            >
              {monthStats.overdueReviews}
            </span>
            {monthStats.overdueReviews > 0 ? (
              <Badge variant="atrasado" className="text-[10px]">
                Atenção
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px]">
                Em dia
              </Badge>
            )}
          </div>
        </Card>
      </div>

      {/* Grade do Calendário Mensal */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        {/* Cabeçalho dos Dias da Semana */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center py-2 text-xs font-bold text-muted-foreground">
          {WEEKDAY_NAMES.map((name, idx) => (
            <div
              key={name}
              className={`${idx === 0 || idx === 6 ? 'text-primary/70' : 'text-foreground/80'}`}
            >
              {name}
            </div>
          ))}
        </div>

        {/* Células dos Dias */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border/60">
          {calendarDays.map(cell => {
            const items = monthItemsMap.get(cell.dateStr) || [];
            const completedCount = items.filter(i => i.isCompleted).length;
            const pendingCount = items.filter(i => !i.isCompleted).length;
            const hasOverdue = items.some(i => i.isOverdue && !i.isCompleted);

            return (
              <div
                key={cell.dateStr}
                onClick={() => onSelectDay(cell.dateStr)}
                className={`group min-h-[105px] sm:min-h-[125px] p-2 flex flex-col justify-between transition-all cursor-pointer select-none ${
                  !cell.isCurrentMonth
                    ? 'bg-muted/15 text-muted-foreground/50 hover:bg-muted/30'
                    : cell.isToday
                    ? 'bg-primary/5 ring-1 ring-inset ring-primary/40 hover:bg-primary/10'
                    : 'bg-card hover:bg-muted/40'
                }`}
              >
                {/* Header do Dia */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`text-xs font-bold rounded-full flex items-center justify-center ${
                        cell.isToday
                          ? 'h-6 w-6 bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                          : cell.isCurrentMonth
                          ? 'text-foreground'
                          : 'text-muted-foreground/60'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {hasOverdue && (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"
                        title="Possui pendência atrasada"
                      />
                    )}
                  </div>

                  {/* Botão sutil para agendar estudo neste dia */}
                  <button
                    type="button"
                    onClick={e => handleOpenPlanForDate(e, cell.dateStr)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    title={`Agendar estudo para ${formatDateBR(cell.dateStr)}`}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                {/* Lista / Indicadores de Assuntos no Dia */}
                <div className="mt-1 space-y-1 flex-1 overflow-hidden">
                  {items.slice(0, 2).map(item => {
                    const areaStyle = getAreaStyle(item.area, areas);

                    return (
                      <div
                        key={item.id}
                        onClick={e => handleOpenItem(e, item)}
                        className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium flex items-center justify-between gap-1 transition-transform hover:scale-[1.02] shadow-2xs ${
                          item.isCompleted
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 line-through opacity-70'
                            : item.isOverdue
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : `${areaStyle.bg} ${areaStyle.text} border ${areaStyle.border}`
                        }`}
                        title={`${item.badgeText} • ${item.subjectName} (${item.area})`}
                      >
                        <span className="truncate">{item.subjectName}</span>
                        {item.isHighPrevalence && (
                          <Flame className="h-2.5 w-2.5 text-amber-400 shrink-0 fill-amber-400" />
                        )}
                      </div>
                    );
                  })}

                  {items.length > 2 && (
                    <div className="text-[10px] text-muted-foreground font-semibold px-1 py-0.5 text-center">
                      +{items.length - 2} mais
                    </div>
                  )}

                  {items.length === 0 && (
                    <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-40 transition-opacity">
                      <span className="text-[9px] text-muted-foreground">Livre</span>
                    </div>
                  )}
                </div>

                {/* Resumo do Rodapé do Card */}
                {items.length > 0 && (
                  <div className="pt-1 border-t border-border/40 flex items-center justify-between text-[9px] text-muted-foreground">
                    <span>
                      {items.length} {items.length === 1 ? 'item' : 'itens'}
                    </span>
                    {completedCount > 0 && (
                      <span className="text-emerald-400 font-semibold">
                        ✓ {completedCount}/{items.length}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modais de Ação Rápida */}
      <ReviewCompletionModal
        open={completionModalOpen}
        onOpenChange={setCompletionModalOpen}
        review={selectedReview}
        topic={
          selectedReview
            ? topics.find(t => t.id === selectedReview.topic_id)
            : undefined
        }
      />

      <RecordPlannedStudyModal
        open={recordStudyModalOpen}
        onOpenChange={setRecordStudyModalOpen}
        topic={selectedPlannedTopic}
      />

      <PlanTopicModal
        open={planModalOpen}
        onOpenChange={setPlanModalOpen}
        defaultDate={planModalDate}
      />
    </div>
  );
};
