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
  addDaysToDate,
  formatDateBR,
  calculateReviewStatus,
} from '@/lib/spaced-repetition';
import { ReviewCompletionModal } from '@/components/dashboard/review-completion-modal';
import { RecordPlannedStudyModal } from './record-planned-study-modal';
import { PlanTopicModal } from './plan-topic-modal';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Clock,
  Target,
  Star,
  BookOpen,
} from 'lucide-react';

interface DiaryWeekViewProps {
  onSelectDay: (dateStr: string) => void;
}

export const DiaryWeekView: React.FC<DiaryWeekViewProps> = ({ onSelectDay }) => {
  const { topics, reviews, areas, prevalentTopics, updateTopicWeeklyGoal } = useData();

  const [weekOffset, setWeekOffset] = useState(0);

  // Modais
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<TopicReview | null>(null);

  const [recordStudyModalOpen, setRecordStudyModalOpen] = useState(false);
  const [selectedPlannedTopic, setSelectedPlannedTopic] = useState<StudyTopic | null>(null);

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planModalDate, setPlanModalDate] = useState<string | undefined>(undefined);

  const todayStr = useMemo(() => getTodayDateString(), []);

  // Calcula os 7 dias da semana
  const weekDays = useMemo(() => {
    const [y, m, d] = todayStr.split('-').map(Number);
    const refDate = new Date(y, m - 1, d);
    refDate.setDate(refDate.getDate() + weekOffset * 7);

    const dayOfWeek = refDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(refDate);
    monday.setDate(monday.getDate() + diffToMonday);

    const days = [];
    const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

    for (let i = 0; i < 7; i++) {
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);

      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      days.push({
        dateStr,
        dayNumber: current.getDate(),
        monthNumber: current.getMonth() + 1,
        dayName: dayNames[i],
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [todayStr, weekOffset]);

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

  // Itens mapeados por dia
  const dayItemsMap = useMemo(() => {
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

    weekDays.forEach(d => map.set(d.dateStr, []));

    // Revisões
    reviews.forEach(r => {
      if (map.has(r.scheduled_date)) {
        const topic = topicMap.get(r.topic_id);
        const subjectName = topic?.subject_name || 'Revisão';
        const area = topic?.area || 'Clínica Médica';
        const statusInfo = calculateReviewStatus(r.scheduled_date, r.completed_date, todayStr);
        const isCompleted = Boolean(r.completed_date);
        const isHigh =
          highPrevalenceNames.has(subjectName.toLowerCase()) ||
          Boolean(topic?.tags?.some(t => t.toLowerCase().includes('alta')));

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
      }
    });

    // Estudos programados
    topics.forEach(t => {
      const planDate = t.planned_date || (t.is_planned ? t.initial_date : null);
      if (t.is_planned && planDate && map.has(planDate)) {
        const isHigh =
          highPrevalenceNames.has(t.subject_name.toLowerCase()) ||
          Boolean(t.tags?.some(tag => tag.toLowerCase().includes('alta')));

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
  }, [weekDays, reviews, topics, topicMap, highPrevalenceNames, todayStr]);

  // Metas da semana
  const weeklyGoals = useMemo(() => {
    const weekDateSet = new Set(weekDays.map(d => d.dateStr));
    const goalTopics = topics.filter(
      t =>
        t.is_weekly_goal ||
        (t.is_planned && t.planned_date && weekDateSet.has(t.planned_date))
    );

    const total = goalTopics.length;
    const completed = goalTopics.filter(t => !t.is_planned).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      topics: goalTopics,
      total,
      completed,
      progress,
    };
  }, [topics, weekDays]);

  const handleOpenItem = (item: {
    type: 'review' | 'planned_study';
    topic?: StudyTopic;
    review?: TopicReview;
  }) => {
    if (item.type === 'review' && item.review) {
      setSelectedReview(item.review);
      setCompletionModalOpen(true);
    } else if (item.type === 'planned_study' && item.topic) {
      setSelectedPlannedTopic(item.topic);
      setRecordStudyModalOpen(true);
    }
  };

  const handleOpenPlanForDate = (dateStr: string) => {
    setPlanModalDate(dateStr);
    setPlanModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Controles da Semana */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl bg-card border border-border shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-foreground">Grade Semanal Completa</h3>
              <Badge variant="outline" className="text-xs font-semibold">
                {weekDays[0].dayNumber}/{weekDays[0].monthNumber} a {weekDays[6].dayNumber}/{weekDays[6].monthNumber}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Clique nos cards para concluir revisões ou registrar novos estudos estudados.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset(prev => prev - 1)}
            className="h-8 w-8 p-0"
            title="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant={weekOffset === 0 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setWeekOffset(0)}
            className="h-8 text-xs font-semibold px-3"
          >
            Esta Semana
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset(prev => prev + 1)}
            className="h-8 w-8 p-0"
            title="Próxima semana"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            onClick={() => handleOpenPlanForDate(todayStr)}
            className="h-8 text-xs font-bold gap-1 shadow-sm ml-2"
          >
            <Plus className="h-3.5 w-3.5" /> Programar Estudo
          </Button>
        </div>
      </div>

      {/* Grade Semanal de 7 Colunas + Painel de Metas */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Grade de 7 Colunas */}
        <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2.5">
          {weekDays.map(day => {
            const items = dayItemsMap.get(day.dateStr) || [];

            return (
              <div
                key={day.dateStr}
                className={`p-3 rounded-2xl border flex flex-col justify-between min-h-[360px] transition-all ${
                  day.isToday
                    ? 'bg-blue-500/10 border-blue-500/50 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/30'
                    : 'bg-card border-border'
                }`}
              >
                {/* Header da Coluna com Botão + */}
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <div>
                      <span
                        className={`text-xs font-bold block ${
                          day.isToday ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        {day.dayName}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {String(day.dayNumber).padStart(2, '0')}/{String(day.monthNumber).padStart(2, '0')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {day.isToday && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground">
                          Hoje
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenPlanForDate(day.dateStr)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/80 transition-colors"
                        title={`Programar estudo para ${day.dayName}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Lista de Itens do Dia */}
                  <div className="space-y-2 mt-2.5">
                    {items.length === 0 ? (
                      <div className="py-12 text-center text-[11px] text-muted-foreground/60 italic">
                        Sem pendências
                      </div>
                    ) : (
                      items.map(item => {
                        const style = getAreaStyle(item.area, areas);

                        return (
                          <div
                            key={item.id}
                            onClick={() => handleOpenItem(item)}
                            className={`p-2.5 rounded-xl border text-xs space-y-1.5 cursor-pointer transition-all hover:scale-[1.02] shadow-sm ${
                              item.isCompleted
                                ? 'bg-emerald-500/10 border-emerald-500/25 opacity-75'
                                : item.isOverdue
                                ? 'bg-rose-500/10 border-rose-500/35 hover:border-rose-500/60'
                                : item.type === 'planned_study'
                                ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/60'
                                : 'bg-muted/60 border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded truncate border ${style.bg} ${style.text} ${style.border}`}
                              >
                                {item.area.split(' ')[0]}
                              </span>

                              <span
                                className={`text-[9px] font-bold px-1 py-0.2 rounded ${
                                  item.isCompleted
                                    ? 'text-emerald-400 bg-emerald-500/15'
                                    : item.type === 'planned_study'
                                    ? 'text-amber-400 bg-amber-500/15'
                                    : item.isOverdue
                                    ? 'text-rose-400 bg-rose-500/15'
                                    : 'text-primary bg-primary/10'
                                }`}
                              >
                                {item.badgeText}
                              </span>
                            </div>

                            <p className="font-bold text-[11px] text-foreground line-clamp-2 leading-tight">
                              {item.subjectName}
                            </p>

                            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                              {item.isHighPrevalence && (
                                <span className="inline-flex items-center gap-0.5 font-bold text-amber-400 text-[9px]">
                                  <Star className="h-2.5 w-2.5 fill-amber-400" /> Top Banca
                                </span>
                              )}
                              <span className="text-primary font-semibold text-[9px] ml-auto">
                                {item.isCompleted ? 'Ver' : 'Concluir'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Footer com link para ver o dia */}
                <button
                  type="button"
                  onClick={() => onSelectDay(day.dateStr)}
                  className="pt-2 mt-2 border-t border-border/40 text-[10px] text-muted-foreground hover:text-primary transition-colors text-center w-full font-medium"
                >
                  Ver Detalhes do Dia →
                </button>
              </div>
            );
          })}
        </div>

        {/* Painel de Metas da Semana */}
        <Card className="xl:col-span-1 border-border shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="p-4 pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                    <Target className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-bold">Metas da Semana</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">
                  {weeklyGoals.completed}/{weeklyGoals.total}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Controle dos temas selecionados para esta semana de estudos.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="text-emerald-400">{weeklyGoals.progress}%</span>
                </div>
                <Progress value={weeklyGoals.progress} className="h-2 bg-muted" />
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {weeklyGoals.topics.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground space-y-2">
                    <p className="italic">Nenhuma meta configurada nesta semana.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenPlanForDate(todayStr)}
                      className="text-xs h-7 gap-1"
                    >
                      <Plus className="h-3 w-3" /> Adicionar Meta
                    </Button>
                  </div>
                ) : (
                  weeklyGoals.topics.map(t => {
                    const isDone = !t.is_planned;
                    const style = getAreaStyle(t.area, areas);

                    return (
                      <div
                        key={t.id}
                        className={`p-2.5 rounded-xl border text-xs space-y-1 transition-all ${
                          isDone
                            ? 'bg-emerald-500/10 border-emerald-500/20'
                            : 'bg-muted/40 border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${style.bg} ${style.text} ${style.border}`}
                          >
                            {t.area}
                          </span>

                          <button
                            type="button"
                            onClick={() => updateTopicWeeklyGoal(t.id, !t.is_weekly_goal)}
                            className="text-[10px] text-muted-foreground hover:text-foreground"
                            title="Remover da meta da semana"
                          >
                            ×
                          </button>
                        </div>

                        <p
                          className={`font-bold text-[11px] ${
                            isDone ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          {t.subject_name}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                          <span>
                            {t.planned_date ? formatDateBR(t.planned_date) : 'Data flexível'}
                          </span>
                          {isDone ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                              <CheckCircle2 className="h-3 w-3" /> Feito
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPlannedTopic(t);
                                setRecordStudyModalOpen(true);
                              }}
                              className="text-primary font-semibold hover:underline"
                            >
                              Registrar Estudo →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </div>

          <div className="p-4 border-t border-border/60">
            <Button
              onClick={() => handleOpenPlanForDate(todayStr)}
              size="sm"
              className="w-full text-xs font-bold gap-1.5 shadow-md shadow-primary/20"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar Assunto na Meta
            </Button>
          </div>
        </Card>
      </div>

      {/* Modais */}
      <PlanTopicModal
        open={planModalOpen}
        onOpenChange={setPlanModalOpen}
        defaultDate={planModalDate}
      />

      <RecordPlannedStudyModal
        open={recordStudyModalOpen}
        onOpenChange={setRecordStudyModalOpen}
        topic={selectedPlannedTopic}
      />

      <ReviewCompletionModal
        open={completionModalOpen}
        onOpenChange={setCompletionModalOpen}
        review={selectedReview}
        topic={selectedReview ? topicMap.get(selectedReview.topic_id) : undefined}
      />
    </div>
  );
};
