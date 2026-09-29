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
import { ReviewsTable } from '@/components/reviews/reviews-table';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Plus,
  Sparkles,
  BookOpen,
  CalendarCheck2,
  ListOrdered,
} from 'lucide-react';

interface DiaryDayViewProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export const DiaryDayView: React.FC<DiaryDayViewProps> = ({ selectedDate, onDateChange }) => {
  const { topics, reviews, areas, prevalentTopics } = useData();

  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<TopicReview | null>(null);

  const [recordStudyModalOpen, setRecordStudyModalOpen] = useState(false);
  const [selectedPlannedTopic, setSelectedPlannedTopic] = useState<StudyTopic | null>(null);

  const [planModalOpen, setPlanModalOpen] = useState(false);

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

  // Estudos previamente programados para este dia
  const dayPlannedTopics = useMemo(() => {
    return topics.filter(t => {
      const planDate = t.planned_date || (t.is_planned ? t.initial_date : null);
      return t.is_planned && planDate === selectedDate;
    });
  }, [topics, selectedDate]);

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

      {/* Cards de Atividades do Dia Selecionado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Revisões Agendadas no Dia */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400">
                  <CalendarCheck2 className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-bold">Revisões Agendadas</CardTitle>
              </div>
              <Badge variant="outline" className="text-xs">
                {dayReviews.length}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Ciclos adaptativos (R1 a R8) previstos para este dia.
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

        {/* Card 2: Estudos no Dia (Concluídos e Programados) */}
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
              Primeiro contato com a matéria (concluídos e pendentes).
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
                  <Plus className="h-3 w-3" /> Programar Estudo
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
                      className="p-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${style.bg} ${style.text} ${style.border}`}
                          >
                            {t.area}
                          </span>
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                            R0 Concluído
                          </span>
                        </div>

                        <p className="font-bold text-xs text-foreground truncate">{t.subject_name}</p>

                        <p className="text-[10px] text-emerald-400 font-semibold">
                          {t.initial_correct}/{t.initial_questions} questões ({t.initial_percentage}%)
                        </p>
                      </div>

                      <span className="text-xs font-bold text-emerald-400 self-start sm:self-center">
                        Concluído ✓
                      </span>
                    </div>
                  );
                })}

                {/* Estudos Pendentes Programados */}
                {dayPlannedTopics.map(t => {
                  const style = getAreaStyle(t.area, areas);

                  return (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${style.bg} ${style.text} ${style.border}`}
                          >
                            {t.area}
                          </span>
                          <Badge variant="outline" className="text-[9px] text-amber-400 border-amber-500/30">
                            A Estudar
                          </Badge>
                          {t.is_weekly_goal && (
                            <span className="text-[9px] font-bold text-amber-300">
                              • Meta da Semana
                            </span>
                          )}
                        </div>

                        <p className="font-bold text-xs text-foreground truncate">{t.subject_name}</p>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedPlannedTopic(t);
                          setRecordStudyModalOpen(true);
                        }}
                        className="text-xs h-7 font-bold gap-1 shrink-0 self-start sm:self-center bg-amber-600 hover:bg-amber-500 text-white"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Registrar Questões
                      </Button>
                    </div>
                  );
                })}
              </>
            )}
          </CardContent>
        </Card>
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
    </div>
  );
};
