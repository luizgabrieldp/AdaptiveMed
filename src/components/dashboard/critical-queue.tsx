'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/lib/store/data-context';
import { TopicReview, StudyTopic, AREA_COLORS } from '@/types/database';
import {
  calculateReviewStatus,
  getTodayDateString,
  formatDateBR,
} from '@/lib/spaced-repetition';
import { ReviewCompletionModal } from './review-completion-modal';
import { CheckCircle2, Clock, AlertCircle, Sparkles, Plus } from 'lucide-react';
import { NewTopicModal } from './new-topic-modal';

export const CriticalQueue: React.FC = () => {
  const { reviews, topics } = useData();
  const [selectedReview, setSelectedReview] = useState<TopicReview | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newTopicOpen, setNewTopicOpen] = useState(false);

  const topicMap = useMemo(() => {
    const map = new Map<string, StudyTopic>();
    topics.forEach(t => map.set(t.id, t));
    return map;
  }, [topics]);

  // Fila crítica: pendentes com scheduled_date <= hoje, ordenadas pelos mais atrasados primeiro
  const criticalItems = useMemo(() => {
    const today = getTodayDateString();
    return reviews
      .filter(r => !r.completed_date && r.scheduled_date <= today)
      .map(r => {
        const topic = topicMap.get(r.topic_id);
        const statusInfo = calculateReviewStatus(r.scheduled_date, r.completed_date);
        return {
          review: r,
          topic,
          statusInfo,
        };
      })
      .sort((a, b) => b.statusInfo.daysDiff - a.statusInfo.daysDiff);
  }, [reviews, topicMap]);

  const handleOpenReview = (review: TopicReview) => {
    setSelectedReview(review);
    setModalOpen(true);
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg font-bold">Fila Crítica de Revisões</CardTitle>
            {criticalItems.length > 0 && (
              <Badge variant="hoje" className="text-xs">
                {criticalItems.length} {criticalItems.length === 1 ? 'pendente' : 'pendentes'}
              </Badge>
            )}
          </div>
          <CardDescription>
            Assuntos programados para hoje ou com cronograma em atraso.
          </CardDescription>
        </div>
        <Button
          onClick={() => setNewTopicOpen(true)}
          size="sm"
          className="gap-1.5 font-semibold shadow-sm"
        >
          <Plus className="h-4 w-4" /> Novo Assunto
        </Button>
      </CardHeader>

      <CardContent>
        {criticalItems.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-xl bg-card border border-dashed border-border/80 space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-foreground">Sua fila de hoje está zerada!</p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-sm mx-auto">
                Excelente ritmo de estudos. O algoritmo adaptativo manterá seus agendamentos protegidos.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNewTopicOpen(true)}
              className="mt-2 text-xs"
            >
              Registrar novo conteúdo estudado
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {criticalItems.map(({ review, topic, statusInfo }) => {
              const areaStyle = topic?.area ? AREA_COLORS[topic.area] : null;
              const isOverdue = statusInfo.status === 'ATRASADO';

              return (
                <div
                  key={review.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                    isOverdue
                      ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50'
                      : 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50'
                  }`}
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {topic?.area && areaStyle && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${areaStyle.bg} ${areaStyle.text} ${areaStyle.border}`}
                        >
                          {topic.area}
                        </span>
                      )}
                      <span className="text-[11px] font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                        Ciclo R{review.review_number}
                      </span>
                      <Badge
                        variant={isOverdue ? 'atrasado' : 'hoje'}
                        className="text-[10px] py-0 px-2"
                      >
                        {statusInfo.badgeText}
                      </Badge>
                    </div>

                    <h4 className="font-bold text-sm sm:text-base text-foreground truncate">
                      {topic?.subject_name || 'Assunto sem título'}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Previsto: {formatDateBR(review.scheduled_date)}
                      </span>
                      {topic && (
                        <span>
                          1º Contato: {formatDateBR(topic.initial_date)} ({topic.initial_percentage}%)
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleOpenReview(review)}
                    variant={isOverdue ? 'destructive' : 'default'}
                    className="sm:self-center font-bold text-xs gap-1.5 shrink-0 shadow-sm"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Concluir Revisão
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Modais */}
      <ReviewCompletionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        review={selectedReview}
        topic={selectedReview ? topicMap.get(selectedReview.topic_id) : undefined}
      />
      <NewTopicModal open={newTopicOpen} onOpenChange={setNewTopicOpen} />
    </Card>
  );
};
