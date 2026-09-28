'use client';

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StudyTopic, TopicReview, AREA_COLORS } from '@/types/database';
import {
  calculateReviewStatus,
  formatDateBR,
  calculateNextReviewInterval,
} from '@/lib/spaced-repetition';
import { ReviewCompletionModal } from '@/components/dashboard/review-completion-modal';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  BrainCircuit,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useData } from '@/lib/store/data-context';

interface TopicDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic: StudyTopic | null;
  reviews: TopicReview[];
}

export const TopicDrawer: React.FC<TopicDrawerProps> = ({
  open,
  onOpenChange,
  topic,
  reviews,
}) => {
  const { deleteTopic } = useData();
  const [selectedReviewToComplete, setSelectedReviewToComplete] = useState<TopicReview | null>(null);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!topic) return null;

  const areaColor = AREA_COLORS[topic.area];

  // Ordena as revisões existentes de 1 a 8
  const existingReviewsMap = new Map<number, TopicReview>();
  reviews
    .filter(r => r.topic_id === topic.id)
    .forEach(r => existingReviewsMap.set(r.review_number, r));

  // Gera a lista das 8 revisões progressivas
  const reviewCycles = Array.from({ length: 8 }, (_, i) => i + 1);

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir o assunto "${topic.subject_name}" e todas as suas revisões?`)) {
      setIsDeleting(true);
      await deleteTopic(topic.id);
      setIsDeleting(false);
      onOpenChange(false);
    }
  };

  const handleOpenComplete = (rev: TopicReview) => {
    setSelectedReviewToComplete(rev);
    setCompleteModalOpen(true);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="space-y-6">
          <SheetHeader>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${areaColor.bg} ${areaColor.text} ${areaColor.border}`}
              >
                {topic.area}
              </span>
              <span className="text-xs text-muted-foreground">
                Cadastrado em {formatDateBR(topic.initial_date)}
              </span>
            </div>
            <SheetTitle>{topic.subject_name}</SheetTitle>
            <SheetDescription>
              Cronograma progressivo de 8 ciclos adaptativos de retenção.
            </SheetDescription>
          </SheetHeader>

          {/* Dados do Primeiro Contato */}
          <div className="p-4 rounded-xl bg-card border border-border space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-blue-400" /> Primeiro Contato com a Matéria
            </h4>
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2 rounded-lg bg-muted/40">
                <p className="text-[10px] text-muted-foreground">Data Inicial</p>
                <p className="text-xs font-bold text-foreground mt-0.5">
                  {formatDateBR(topic.initial_date)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-muted/40">
                <p className="text-[10px] text-muted-foreground">Questões</p>
                <p className="text-xs font-bold text-foreground mt-0.5">
                  {topic.initial_correct} / {topic.initial_questions}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-muted/40">
                <p className="text-[10px] text-muted-foreground">Aproveitamento</p>
                <p className={`text-xs font-bold mt-0.5 ${topic.initial_percentage >= 80 ? 'text-emerald-400' : topic.initial_percentage >= 65 ? 'text-blue-400' : 'text-amber-400'}`}>
                  {topic.initial_percentage}%
                </p>
              </div>
            </div>
          </div>

          {/* Linha do Tempo das 8 Revisões */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BrainCircuit className="h-3.5 w-3.5 text-primary" /> Ciclos de Revisão (R1 a R8)
              </span>
              <span className="text-[11px] text-muted-foreground lowercase">
                {reviews.filter(r => r.topic_id === topic.id && r.completed_date).length} de 8 concluídas
              </span>
            </h4>

            <div className="space-y-2.5">
              {reviewCycles.map(num => {
                const existing = existingReviewsMap.get(num);

                if (existing) {
                  const isCompleted = Boolean(existing.completed_date);
                  const statusInfo = calculateReviewStatus(
                    existing.scheduled_date,
                    existing.completed_date
                  );

                  return (
                    <div
                      key={num}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isCompleted
                          ? 'border-emerald-500/20 bg-emerald-500/5'
                          : statusInfo.status === 'ATRASADO'
                          ? 'border-red-500/30 bg-red-500/5'
                          : statusInfo.status === 'REVISAR HOJE'
                          ? 'border-amber-500/40 bg-amber-500/5'
                          : 'border-border bg-card'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
                              isCompleted
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            R{num}
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            {num}ª Revisão
                          </span>
                        </div>

                        {isCompleted ? (
                          <Badge variant="concluido" className="text-[10px]">
                            {existing.percentage}% ({existing.questions_correct}/{existing.questions_done})
                          </Badge>
                        ) : (
                          <Badge
                            variant={
                              statusInfo.status === 'ATRASADO'
                                ? 'atrasado'
                                : statusInfo.status === 'REVISAR HOJE'
                                ? 'hoje'
                                : 'programado'
                            }
                            className="text-[10px]"
                          >
                            {statusInfo.badgeText}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {isCompleted
                            ? `Concluída em ${formatDateBR(existing.completed_date)}`
                            : `Programada para ${formatDateBR(existing.scheduled_date)}`}
                        </span>

                        {!isCompleted && (
                          <Button
                            size="sm"
                            variant={statusInfo.status === 'ATRASADO' ? 'destructive' : 'default'}
                            onClick={() => handleOpenComplete(existing)}
                            className="h-7 text-[11px] font-bold px-2.5 gap-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Concluir
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                }

                // Ciclo futuro progressivo (Just-in-Time)
                return (
                  <div
                    key={num}
                    className="p-3 rounded-xl border border-dashed border-border/70 bg-muted/20 opacity-70 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="h-6 w-6 rounded-full bg-muted/50 text-muted-foreground flex items-center justify-center text-xs font-semibold">
                        R{num}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {num}ª Revisão (Pendente)
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      Aguardando R{num - 1} <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ações do Assunto */}
          <div className="pt-4 border-t border-border flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs text-destructive hover:bg-destructive/10 gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isDeleting ? 'Excluindo...' : 'Excluir Assunto'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <ReviewCompletionModal
        open={completeModalOpen}
        onOpenChange={setCompleteModalOpen}
        review={selectedReviewToComplete}
        topic={topic}
      />
    </>
  );
};
