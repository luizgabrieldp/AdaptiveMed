'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useData } from '@/lib/store/data-context';
import { getAreaStyle, StudyTopic, TopicReview } from '@/types/database';
import {
  getTodayDateString,
  addDaysToDate,
  formatDateBR,
  calculateReviewStatus,
} from '@/lib/spaced-repetition';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Target,
  ArrowRight,
  Sparkles,
  Flame,
  Star,
  BookOpen,
  Calendar,
} from 'lucide-react';

export const WeeklySchedule: React.FC = () => {
  const router = useRouter();
  const { topics, reviews, areas, prevalentTopics } = useData();

  // Offset da semana atual (0 = semana corrente, -1 = semana anterior, +1 = próxima)
  const [weekOffset, setWeekOffset] = useState(0);

  const todayStr = useMemo(() => getTodayDateString(), []);

  // Mapeamento dos 7 dias da semana (Segunda a Domingo)
  const weekDays = useMemo(() => {
    // Acha a Segunda-feira da semana de referência
    const [y, m, d] = todayStr.split('-').map(Number);
    const refDate = new Date(y, m - 1, d);
    refDate.setDate(refDate.getDate() + weekOffset * 7);

    // No JS: 0=Domingo, 1=Segunda, 2=Terça, etc.
    const dayOfWeek = refDate.getDay();
    // Dias para voltar até Segunda (se Domingo=0 -> volta 6 dias, se Segunda=1 -> volta 0)
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(refDate);
    monday.setDate(monday.getDate() + diffToMonday);

    const days = [];
    const dayNames = [
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado',
      'Domingo',
    ];

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

  // Conjunto de nomes de assuntos de alta prevalência para badge rápida
  const highPrevalenceNames = useMemo(() => {
    const set = new Set<string>();
    prevalentTopics.forEach(p => {
      if (p.prevalence_level === 'ALTA' || p.rank_order <= 3) {
        set.add(p.subject_name.trim().toLowerCase());
      }
    });
    return set;
  }, [prevalentTopics]);

  // Mapa de tópicos por ID
  const topicMap = useMemo(() => {
    const map = new Map<string, StudyTopic>();
    topics.forEach(t => map.set(t.id, t));
    return map;
  }, [topics]);

  // Agrupamento de itens por dia da semana
  const dayScheduleMap = useMemo(() => {
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

    // 1. Revisões agendadas para os dias da semana
    reviews.forEach(r => {
      if (map.has(r.scheduled_date)) {
        const topic = topicMap.get(r.topic_id);
        const subjectName = topic?.subject_name || 'Assunto de Revisão';
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
          badgeText: isCompleted ? `R${r.review_number} Concluída` : `R${r.review_number}`,
          isCompleted,
          isHighPrevalence: isHigh,
          isOverdue: statusInfo.status === 'ATRASADO',
        });
      }
    });

    // 2. Assuntos com estudo planejado para os dias da semana
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
          badgeText: '1º Contato Planejado',
          isCompleted: false,
          isHighPrevalence: isHigh,
          isOverdue: planDate < todayStr,
        });
      }
    });

    return map;
  }, [weekDays, reviews, topics, topicMap, highPrevalenceNames, todayStr]);

  // Metas da Semana de Assuntos para Ver
  const weeklyGoals = useMemo(() => {
    const weekDateSet = new Set(weekDays.map(d => d.dateStr));

    // Tópicos explicitamente marcados como meta OU programados para esta semana
    const goalTopics = topics.filter(
      t =>
        t.is_weekly_goal ||
        (t.is_planned && t.planned_date && weekDateSet.has(t.planned_date))
    );

    const total = goalTopics.length;
    // Concluídos = aqueles que foram estudados (!is_planned)
    const completed = goalTopics.filter(t => !t.is_planned).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      topics: goalTopics,
      total,
      completed,
      progress,
    };
  }, [topics, weekDays]);

  const handleNavigateToDay = (dateStr: string) => {
    router.push(`/diario?date=${dateStr}&view=dia`);
  };

  return (
    <div className="space-y-4">
      {/* Barra de Título & Navegação Semanal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl bg-card border border-border shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-foreground">Agenda da Semana</h2>
              <Badge variant="outline" className="text-xs font-semibold">
                {weekDays[0].dayNumber}/{weekDays[0].monthNumber} a {weekDays[6].dayNumber}/{weekDays[6].monthNumber}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Visualize de segunda a domingo seus assuntos programados e revisões diárias.
            </p>
          </div>
        </div>

        {/* Controles de Semana */}
        <div className="flex items-center space-x-2 self-start sm:self-center">
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
            Hoje / Esta Semana
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
            variant="ghost"
            size="sm"
            onClick={() => router.push('/diario')}
            className="h-8 text-xs text-primary font-semibold gap-1 ml-1"
          >
            <span>Ver Diário</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Grid Principal: 7 Dias + Bloco de Metas da Semana */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Coluna 1-3: Agenda de Segunda a Domingo */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-2.5">
          {weekDays.map(day => {
            const items = dayScheduleMap.get(day.dateStr) || [];
            const areaStyleMap = areas;

            return (
              <div
                key={day.dateStr}
                onClick={() => handleNavigateToDay(day.dateStr)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[170px] group ${
                  day.isToday
                    ? 'bg-blue-500/10 border-blue-500/50 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/30'
                    : 'bg-card border-border hover:border-border/80 hover:bg-muted/40'
                }`}
              >
                {/* Header do Dia */}
                <div className="border-b border-border/60 pb-2 mb-2 flex items-center justify-between">
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

                  {day.isToday && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                      Hoje
                    </span>
                  )}
                </div>

                {/* Itens Agendados no Dia */}
                <div className="space-y-1.5 flex-1">
                  {items.length === 0 ? (
                    <div className="h-full flex items-center justify-center py-4">
                      <p className="text-[11px] text-muted-foreground/60 italic text-center">
                        Livre
                      </p>
                    </div>
                  ) : (
                    items.map(item => {
                      const style = getAreaStyle(item.area, areas);

                      return (
                        <div
                          key={item.id}
                          className={`p-2 rounded-xl border text-[11px] space-y-1 transition-all ${
                            item.isCompleted
                              ? 'bg-emerald-500/10 border-emerald-500/25 opacity-75'
                              : item.isOverdue
                              ? 'bg-rose-500/10 border-rose-500/30'
                              : 'bg-muted/50 border-border group-hover:border-primary/40'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded truncate border ${style.bg} ${style.text} ${style.border}`}
                            >
                              {item.area.split(' ')[0]}
                            </span>

                            <span
                              className={`text-[9px] font-semibold px-1 py-0.2 rounded ${
                                item.isCompleted
                                  ? 'text-emerald-400 bg-emerald-500/15'
                                  : item.isOverdue
                                  ? 'text-rose-400 bg-rose-500/15'
                                  : 'text-primary bg-primary/10'
                              }`}
                            >
                              {item.badgeText}
                            </span>
                          </div>

                          <p className="font-semibold text-foreground line-clamp-2 leading-tight">
                            {item.subjectName}
                          </p>

                          {item.isHighPrevalence && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-400">
                              <Star className="h-2.5 w-2.5 fill-amber-400" /> Top Banca
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Rodapé do Dia com Contador */}
                <div className="pt-2 mt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>
                    {items.length} {items.length === 1 ? 'item' : 'itens'}
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary font-semibold flex items-center gap-0.5">
                    Ver <ArrowRight className="h-2.5 w-2.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Coluna 4: Bloco "Meta da Semana de Assuntos para Ver" */}
        <Card className="lg:col-span-1 border-border shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="p-4 pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                    <Target className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-bold">Meta da Semana</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {weeklyGoals.completed}/{weeklyGoals.total}
                </Badge>
              </div>
              <CardDescription className="text-[11px] mt-0.5">
                Assuntos definidos como meta prioritária para estes 7 dias.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Barra de Progresso da Meta */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="text-emerald-400">{weeklyGoals.progress}%</span>
                </div>
                <Progress value={weeklyGoals.progress} className="h-2 bg-muted" />
              </div>

              {/* Lista dos Assuntos da Meta */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {weeklyGoals.topics.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground space-y-2">
                    <p className="italic">Nenhum assunto definido como meta nesta semana.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/diario')}
                      className="text-xs h-7 gap-1"
                    >
                      <BookOpen className="h-3 w-3" /> Programar no Diário
                    </Button>
                  </div>
                ) : (
                  weeklyGoals.topics.map(t => {
                    const isDone = !t.is_planned;
                    const style = getAreaStyle(t.area, areas);

                    return (
                      <div
                        key={t.id}
                        onClick={() => router.push(`/diario?search=${encodeURIComponent(t.subject_name)}`)}
                        className={`p-2.5 rounded-xl border text-xs space-y-1 transition-all cursor-pointer ${
                          isDone
                            ? 'bg-emerald-500/10 border-emerald-500/20'
                            : 'bg-muted/40 border-border hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${style.bg} ${style.text} ${style.border}`}
                          >
                            {t.area}
                          </span>
                          {isDone ? (
                            <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-bold">
                              <CheckCircle2 className="h-3 w-3" /> Concluído
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-0.5">
                              <Clock className="h-3 w-3" /> A Estudar
                            </span>
                          )}
                        </div>
                        <p className={`font-bold line-clamp-1 ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {t.subject_name}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </div>

          {/* Footer do Card de Metas */}
          <div className="p-4 border-t border-border/60">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/diario')}
              className="w-full text-xs font-bold gap-1.5 border-border"
            >
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>Gerenciar no Diário</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
