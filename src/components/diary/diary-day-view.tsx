'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useData } from '@/lib/store/data-context';
import { StudyTopic, TopicReview, getAreaStyle } from '@/types/database';
import {
  calculateReviewStatus,
  formatDateBR,
  getTodayDateString,
  addDaysToDate,
} from '@/lib/spaced-repetition';
import { ReviewCompletionModal } from '@/components/dashboard/review-completion-modal';
import { RecordPlannedStudyModal } from './record-planned-study-modal';
import { PlanTopicModal } from './plan-topic-modal';
import { EditPlannedTopicModal } from './edit-planned-topic-modal';
import { ReviewsTable } from '@/components/reviews/reviews-table';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Plus,
  Sparkles,
  BookOpen,
  CalendarCheck2,
  ListOrdered,
  X,
  AlertTriangle,
  CalendarPlus,
  Flame,
  Layers,
  ShieldAlert,
  Edit2,
} from 'lucide-react';

interface DiaryDayViewProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export const DiaryDayView: React.FC<DiaryDayViewProps> = ({ selectedDate, onDateChange }) => {
  const {
    topics,
    reviews,
    areas,
    prevalentTopics,
    workloadConfig,
    updatePlannedTopicDate,
    rescheduleReview,
  } = useData();

  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<TopicReview | null>(null);

  const [recordStudyModalOpen, setRecordStudyModalOpen] = useState(false);
  const [selectedPlannedTopic, setSelectedPlannedTopic] = useState<StudyTopic | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTopicToEdit, setSelectedTopicToEdit] = useState<StudyTopic | null>(null);

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [isBacklogExpanded, setIsBacklogExpanded] = useState(false);

  const todayStr = useMemo(() => getTodayDateString(), []);

  const topicMap = useMemo(() => {
    const map = new Map<string, StudyTopic>();
    topics.forEach(t => map.set(t.id, t));
    return map;
  }, [topics]);

  // Revisões agendadas para este dia
  const dayReviews = useMemo(() => {
    return reviews
      .filter(r => r.scheduled_date === selectedDate)
      .map(r => {
        const topic = topicMap.get(r.topic_id);
        const statusInfo = calculateReviewStatus(r.scheduled_date, r.completed_date, todayStr);
        return { review: r, topic, statusInfo };
      });
  }, [reviews, selectedDate, topicMap, todayStr]);

  // Estudos previamente programados para este dia (apenas com planned_date explícito)
  const dayPlannedTopics = useMemo(() => {
    return topics.filter(t => t.is_planned && t.planned_date === selectedDate);
  }, [topics, selectedDate]);

  // Assuntos da Semana / Pendentes disponíveis para agendar neste dia
  const availableBacklogTopics = useMemo(() => {
    return topics.filter(t => t.is_planned && t.planned_date !== selectedDate);
  }, [topics, selectedDate]);

  // Revisões Atrasadas (agendadas para antes de hoje que ainda não foram concluídas)
  const overdueReviews = useMemo(() => {
    return reviews
      .filter(r => !r.completed_date && r.scheduled_date < todayStr && r.scheduled_date !== selectedDate)
      .map(r => {
        const topic = topicMap.get(r.topic_id);
        const statusInfo = calculateReviewStatus(r.scheduled_date, r.completed_date, todayStr);
        return { review: r, topic, statusInfo };
      });
  }, [reviews, todayStr, selectedDate, topicMap]);

  const maxOverdueQuota = workloadConfig?.maxDailyOverdue ?? 2;
  const priorityOverdueReviews = useMemo(() => {
    return overdueReviews.slice(0, maxOverdueQuota);
  }, [overdueReviews, maxOverdueQuota]);

  const backlogOverdueReviews = useMemo(() => {
    return overdueReviews.slice(maxOverdueQuota);
  }, [overdueReviews, maxOverdueQuota]);

  // Estudos iniciais (R0) concluídos neste dia
  const dayCompletedTopics = useMemo(() => {
    return topics.filter(t => !t.is_planned && t.initial_date === selectedDate);
  }, [topics, selectedDate]);

  const handlePrevDay = () => onDateChange(addDaysToDate(selectedDate, -1));
  const handleNextDay = () => onDateChange(addDaysToDate(selectedDate, 1));
  const handleToday = () => onDateChange(todayStr);

  const isToday = selectedDate === todayStr;

  return (
    <div className="space-y-6">
      {/* Navegador de Data */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl bg-card border border-border shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-foreground">
                Visualização Diária: {formatDateBR(selectedDate)}
              </h3>
              {isToday && (
                <Badge variant="hoje" className="text-[10px]">
                  Hoje
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {dayReviews.length} {dayReviews.length === 1 ? 'revisão agendada' : 'revisões agendadas'} •{' '}
              {dayPlannedTopics.length} {dayPlannedTopics.length === 1 ? 'estudo planejado' : 'estudos planejados'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevDay}
            className="h-8 w-8 p-0"
            title="Dia anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant={isToday ? 'default' : 'outline'}
            size="sm"
            onClick={handleToday}
            className="h-8 text-xs font-semibold px-3"
          >
            Hoje
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextDay}
            className="h-8 w-8 p-0"
            title="Próximo dia"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Input
            type="date"
            value={selectedDate}
            onChange={e => e.target.value && onDateChange(e.target.value)}
            className="h-8 text-xs w-36 ml-1"
          />

          <Button
            size="sm"
            onClick={() => setPlanModalOpen(true)}
            className="h-8 text-xs font-bold gap-1 shadow-sm ml-2"
          >
            <Plus className="h-3.5 w-3.5" /> Programar Estudo
          </Button>
        </div>
      </div>

      {/* Grid Principal: Atividades do Dia + Painel Lateral de Agendamento */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Coluna Principal (2 colunas em desktop largo): Atividades do Dia */}
        <div className="xl:col-span-2 space-y-5">
          {/* Card 1: Estudos no Dia (Concluídos e Programados) */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-bold">Estudos do Dia (R0)</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">
                  {dayCompletedTopics.length + dayPlannedTopics.length}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Primeiro contato com a matéria agendado ou concluído neste dia.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 space-y-2.5">
              {dayCompletedTopics.length === 0 && dayPlannedTopics.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground space-y-2">
                  <p className="italic">Nenhum estudo programado ou concluído neste dia.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPlanModalOpen(true)}
                    className="text-xs h-7 gap-1"
                  >
                    <Plus className="h-3 w-3" /> Programar Novo Assunto
                  </Button>
                </div>
              ) : (
                <>
                  {/* Estudos Concluídos (R0 Feito) */}
                  {dayCompletedTopics.map(t => {
                    const style = getAreaStyle(t.area, areas);

                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          setSelectedTopicToEdit(t);
                          setEditModalOpen(true);
                        }}
                        className={`p-3 rounded-xl border ${style.cardBg} ${style.cardBorder} ${style.cardHover} flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer transition-all hover:scale-[1.01] group`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shadow-2xs ${style.bg} ${style.text} ${style.border}`}
                              title={t.area}
                            >
                              {t.area}
                            </span>
                            <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 border border-emerald-500/35 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              R0 Concluído
                            </span>
                          </div>

                          <p className="font-bold text-xs text-foreground truncate">{t.subject_name}</p>

                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            {t.initial_correct}/{t.initial_questions} questões ({t.initial_percentage}%)
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-center">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedTopicToEdit(t);
                              setEditModalOpen(true);
                            }}
                            className="h-7 text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="h-3 w-3" />
                            Editar
                          </Button>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            Concluído ✓
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Estudos Pendentes Programados */}
                  {dayPlannedTopics.map(t => {
                    const style = getAreaStyle(t.area, areas);

                    return (
                      <div
                        key={t.id}
                        className={`p-3 rounded-xl border ${style.cardBg} ${style.cardBorder} ${style.cardHover} flex flex-col sm:flex-row sm:items-center justify-between gap-2`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shadow-2xs ${style.bg} ${style.text} ${style.border}`}
                              title={t.area}
                            >
                              {t.area}
                            </span>
                            <Badge variant="outline" className="text-[9px] text-amber-700 dark:text-amber-300 bg-amber-500/15 border-amber-500/35">
                              A Estudar
                            </Badge>
                            {t.is_weekly_goal && (
                              <span className="text-[9px] font-bold text-amber-600 dark:text-amber-300">
                                • Meta da Semana
                              </span>
                            )}
                          </div>

                          <p className="font-bold text-xs text-foreground truncate">{t.subject_name}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedTopicToEdit(t);
                              setEditModalOpen(true);
                            }}
                            className="h-7 text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground"
                            title="Editar assunto planejado"
                          >
                            <Edit2 className="h-3 w-3" />
                            Editar
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updatePlannedTopicDate(t.id, null)}
                            title="Remover data e manter na Meta da Semana em aberto"
                            className="text-[11px] h-7 px-2 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
                          >
                            <X className="h-3.5 w-3.5 mr-1" /> Desagendar
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedPlannedTopic(t);
                              setRecordStudyModalOpen(true);
                            }}
                            className="text-xs h-7 font-bold gap-1 bg-amber-600 hover:bg-amber-500 text-white"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Registrar Questões
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Revisões Agendadas no Dia */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400">
                    <CalendarCheck2 className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-bold">Revisões Agendadas (Ciclos R1 a R8)</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">
                  {dayReviews.length}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Ciclos adaptativos previstos para este dia específico.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 space-y-2.5">
              {dayReviews.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground italic">
                  Nenhuma revisão agendada para este dia.
                </div>
              ) : (
                dayReviews.map(({ review, topic, statusInfo }) => {
                  const style = topic ? getAreaStyle(topic.area, areas) : null;
                  const isDone = Boolean(review.completed_date);

                  return (
                    <div
                      key={review.id}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                        isDone
                          ? 'bg-emerald-500/10 border-emerald-500/25'
                          : statusInfo.status === 'ATRASADO'
                          ? 'bg-rose-500/10 border-rose-500/30'
                          : 'bg-muted/40 border-border'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {topic && style && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${style.bg} ${style.text} ${style.border}`}
                            >
                              {topic.area}
                            </span>
                          )}
                          <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                            R{review.review_number}
                          </span>
                          {review.recommended_questions && (
                            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.2 rounded">
                              🎯 {review.recommended_questions} Qs
                            </span>
                          )}
                          <Badge
                            variant={isDone ? 'concluido' : statusInfo.status === 'ATRASADO' ? 'atrasado' : 'hoje'}
                            className="text-[9px] py-0 px-1.5"
                          >
                            {statusInfo.badgeText}
                          </Badge>
                        </div>

                        <p className="font-bold text-xs text-foreground truncate">
                          {topic?.subject_name || 'Assunto'}
                        </p>

                        {isDone && review.questions_done && (
                          <p className="text-[10px] text-emerald-400 font-semibold">
                            {review.questions_correct}/{review.questions_done} questões ({review.percentage}%)
                          </p>
                        )}
                      </div>

                      {!isDone && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedReview(review);
                            setCompletionModalOpen(true);
                          }}
                          className="text-xs h-7 font-bold gap-1 shrink-0 self-start sm:self-center"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Concluir
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral (1 coluna): Assuntos da Semana & Revisões em Atraso */}
        <div className="xl:col-span-1 space-y-5">
          {/* Card Lateral 1: Assuntos da Semana / Meta Disponíveis */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-primary/15 text-primary">
                    <CalendarPlus className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-bold">Assuntos da Semana</CardTitle>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {availableBacklogTopics.length}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Metas em aberto ou planejadas para outros dias.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-3 space-y-2 max-h-[360px] overflow-y-auto">
              {availableBacklogTopics.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground italic">
                  Todos os assuntos da semana já foram agendados para este dia!
                </div>
              ) : (
                availableBacklogTopics.map(t => {
                  const style = getAreaStyle(t.area, areas);

                  return (
                    <div
                      key={t.id}
                      className="p-2.5 rounded-xl border border-border/70 bg-card hover:bg-muted/40 transition-colors flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${style.bg} ${style.text} ${style.border}`}
                          >
                            {t.area}
                          </span>
                          {t.planned_date ? (
                            <span className="text-[9px] text-muted-foreground font-medium">
                              Em {formatDateBR(t.planned_date)}
                            </span>
                          ) : (
                            <span className="text-[9px] font-semibold text-amber-400 bg-amber-500/10 px-1 rounded">
                              Sem dia fixo
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-foreground truncate" title={t.subject_name}>
                          {t.subject_name}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updatePlannedTopicDate(t.id, selectedDate)}
                        className="text-[11px] h-7 px-2 font-bold shrink-0 hover:border-primary hover:text-primary"
                        title="Agendar para a data selecionada"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Agendar
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Card Lateral 2: Revisões em Atraso */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-bold">Revisões em Atraso</CardTitle>
                </div>
                <Badge variant={overdueReviews.length > 0 ? 'atrasado' : 'outline'} className="text-xs">
                  {overdueReviews.length}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Reprograme para este dia para regularizar sua curva de retenção.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-3 space-y-2.5 max-h-[460px] overflow-y-auto">
              {overdueReviews.length === 0 ? (
                <div className="py-6 text-center text-xs text-emerald-400 font-medium">
                  🎉 Nenhuma revisão em atraso pendente!
                </div>
              ) : (
                <>
                  {/* Fila Prioritária de Atrasos (respeitando a cota anti-sobrecarga) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                      <span className="font-semibold text-rose-300 flex items-center gap-1">
                        <Flame className="h-3 w-3 text-rose-400" />
                        Fila Prioritária de Hoje ({priorityOverdueReviews.length})
                      </span>
                      {backlogOverdueReviews.length > 0 && (
                        <span className="text-[10px] text-muted-foreground font-medium">
                          Cota: máx {maxOverdueQuota}/dia
                        </span>
                      )}
                    </div>

                    {priorityOverdueReviews.map(({ review, topic, statusInfo }) => {
                      const style = topic ? getAreaStyle(topic.area, areas) : null;

                      return (
                        <div
                          key={review.id}
                          className="p-2.5 rounded-xl border border-rose-500/25 bg-rose-500/5 hover:bg-rose-500/10 transition-colors flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              {topic && style && (
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${style.bg} ${style.text} ${style.border}`}
                                >
                                  {topic.area}
                                </span>
                              )}
                              <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1 rounded">
                                R{review.review_number}
                              </span>
                              <span className="text-[9px] font-bold text-rose-400">
                                {statusInfo.daysDiff}d atraso
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-foreground truncate" title={topic?.subject_name}>
                              {topic?.subject_name || 'Assunto'}
                            </p>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rescheduleReview(review.id, selectedDate)}
                            className="text-[11px] h-7 px-2 font-bold shrink-0 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                            title="Reprogramar para este dia"
                          >
                            Reprogramar
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Acordeão / Gaveta Recolhível: Backlog Protegido */}
                  {backlogOverdueReviews.length > 0 && (
                    <div className="pt-2 border-t border-border/70 space-y-2">
                      <button
                        type="button"
                        onClick={() => setIsBacklogExpanded(prev => !prev)}
                        className="w-full p-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 hover:bg-amber-500/15 transition-colors flex items-center justify-between text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-amber-400 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-amber-300">
                              Backlog de Atrasos (+{backlogOverdueReviews.length})
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {isBacklogExpanded ? 'Clique para recolher' : 'Protegidos contra sobrecarga cognitiva'}
                            </p>
                          </div>
                        </div>

                        {isBacklogExpanded ? (
                          <ChevronUp className="h-4 w-4 text-amber-400 shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-amber-400 shrink-0" />
                        )}
                      </button>

                      {isBacklogExpanded && (
                        <div className="space-y-2 pt-1 animate-in fade-in">
                          <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-[11px] text-muted-foreground leading-relaxed">
                            💡 <strong>Anti-Sobrecarga:</strong> Estes assuntos estão em espera para evitar fadiga cognitiva. Eles entrarão na sua fila de hoje automaticamente à medida que você liquidar os prioritários, ou você pode reprogramá-los manualmente abaixo.
                          </div>

                          {backlogOverdueReviews.map(({ review, topic, statusInfo }) => {
                            const style = topic ? getAreaStyle(topic.area, areas) : null;

                            return (
                              <div
                                key={review.id}
                                className="p-2.5 rounded-xl border border-border bg-card/80 hover:bg-muted/40 transition-colors flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0 space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    {topic && style && (
                                      <span
                                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${style.bg} ${style.text} ${style.border}`}
                                      >
                                        {topic.area}
                                      </span>
                                    )}
                                    <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1 rounded">
                                      R{review.review_number}
                                    </span>
                                    <span className="text-[9px] font-medium text-muted-foreground">
                                      {statusInfo.daysDiff}d pendente
                                    </span>
                                  </div>
                                  <p className="text-xs font-semibold text-foreground truncate" title={topic?.subject_name}>
                                    {topic?.subject_name || 'Assunto'}
                                  </p>
                                </div>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => rescheduleReview(review.id, selectedDate)}
                                  className="text-[11px] h-7 px-2 font-bold shrink-0 text-foreground border-border hover:border-primary hover:text-primary"
                                  title="Puxar para este dia"
                                >
                                  Puxar Hoje
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabela Geral de Assuntos & Revisões com Busca e Filtros */}
      <div className="space-y-3 pt-4 border-t border-border">
        <div className="flex items-center space-x-2">
          <ListOrdered className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            Catálogo Geral de Assuntos & 8 Ciclos
          </h3>
        </div>
        <ReviewsTable />
      </div>

      {/* Modais */}
      <PlanTopicModal
        open={planModalOpen}
        onOpenChange={setPlanModalOpen}
        defaultDate={selectedDate}
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

      <EditPlannedTopicModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        topic={selectedTopicToEdit}
      />
    </div>
  );
};
