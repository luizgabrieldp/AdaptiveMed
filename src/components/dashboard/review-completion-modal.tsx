'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TopicReview, StudyTopic } from '@/types/database';
import {
  calculateNextReviewInterval,
  calculateNextReview,
  diffInDays,
  getTodayDateString,
  addDaysToDate,
  formatDateBR,
} from '@/lib/spaced-repetition';
import { useData } from '@/lib/store/data-context';
import { CheckCircle2, Sparkles, BrainCircuit, Target } from 'lucide-react';

interface ReviewCompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: TopicReview | null;
  topic?: StudyTopic;
  mode?: 'complete' | 'edit';
}

export const ReviewCompletionModal: React.FC<ReviewCompletionModalProps> = ({
  open,
  onOpenChange,
  review,
  topic,
  mode,
}) => {
  const { completeReview, updateCompletedReview } = useData();
  const [questionsDone, setQuestionsDone] = useState<string>('20');
  const [questionsCorrect, setQuestionsCorrect] = useState<string>('16');
  const [durationMinutes, setDurationMinutes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ nextDate?: string; pct: number; isEdit?: boolean; duration?: number } | null>(null);

  const isEdit = mode === 'edit' || (mode !== 'complete' && Boolean(review?.completed_date));

  React.useEffect(() => {
    if (review && open) {
      if (isEdit || review.completed_date) {
        setQuestionsDone(review.questions_done != null ? String(review.questions_done) : '20');
        setQuestionsCorrect(review.questions_correct != null ? String(review.questions_correct) : '16');
        setDurationMinutes(review.duration_minutes != null ? String(review.duration_minutes) : '');
      } else {
        const suggested = review.recommended_questions ? String(review.recommended_questions) : '20';
        setQuestionsDone(suggested);
        setQuestionsCorrect('');
        setDurationMinutes('');
      }
      setSuccessInfo(null);
    }
  }, [review, open, isEdit]);

  if (!review) return null;

  const doneNum = parseInt(questionsDone, 10) || 0;
  const correctNum = questionsCorrect !== '' ? parseInt(questionsCorrect, 10) || 0 : 0;
  const isCorrectFilled = questionsCorrect !== '';
  const calculatedPct =
    doneNum > 0 && isCorrectFilled && correctNum <= doneNum
      ? Math.min(100, Math.round((correctNum / doneNum) * 1000) / 10)
      : null;

  // Cálculo científico do próximo ciclo
  const baseCount = topic?.base_questions_count || topic?.initial_questions || 20;
  const prevInterval = review.previous_interval_days || 7;
  const nextReviewCalc = calculateNextReview({
    currentCycle: review.review_number,
    accuracy: calculatedPct ?? 80,
    baseQuestionsCount: baseCount,
    previousIntervalDays: prevInterval,
  });

  const nextCycleNumber = review.review_number < 8 ? nextReviewCalc.nextCycle : null;
  const nextInterval = nextReviewCalc.nextIntervalDays;
  const today = getTodayDateString();
  const estimatedNextDate = nextCycleNumber ? addDaysToDate(today, nextInterval) : null;
  const durNum = durationMinutes.trim() !== '' ? parseInt(durationMinutes, 10) : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (doneNum <= 0 || !isCorrectFilled || correctNum > doneNum) return;

    try {
      setIsSubmitting(true);
      if (isEdit) {
        await updateCompletedReview(review.id, doneNum, correctNum);
        setSuccessInfo({ nextDate: estimatedNextDate || undefined, pct: calculatedPct ?? 0, isEdit: true, duration: durNum });
      } else {
        const res = await completeReview(review.id, doneNum, correctNum, durNum);

        // Efeito festivo de gamificação
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#3B82F6', '#10B981', '#F59E0B'],
          });
        } catch {
          // Fallback silencioso se canvas-confetti não estiver disponível
        }

        setSuccessInfo({ nextDate: res.nextReviewDate, pct: calculatedPct ?? 0, isEdit: false, duration: durNum });
      }

      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessInfo(null);
        onOpenChange(false);
      }, 1400);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {successInfo ? (
          <div className="py-8 text-center space-y-4 animate-in zoom-in-95">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-10 w-10 animate-bounce" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {successInfo.isEdit ? 'Rendimento Atualizado!' : 'Revisão Concluída!'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Aproveitamento de <span className="font-bold text-emerald-400">{successInfo.pct}%</span>
                {successInfo.duration ? ` • ⏱️ ${successInfo.duration} min` : ''}
              </p>
              <div className="inline-block mt-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-muted border border-border">
                  {nextReviewCalc.diagnosisBadge}
                </span>
              </div>
            </div>
            {successInfo.nextDate && (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-left">
                <p className="text-xs text-blue-300 font-medium">Ciclo Adaptativo R{review.review_number + 1} Agendado:</p>
                <p className="text-base font-bold text-blue-400 mt-0.5">
                  {formatDateBR(successInfo.nextDate)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Meta sugerida: <strong>{nextReviewCalc.recommendedQuestions} questões</strong>
                </p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
                <BrainCircuit className="h-4 w-4" />
                <span>Ciclo de Revisão R{review.review_number}</span>
              </div>
              <DialogTitle className="text-xl">
                {isEdit ? `Editar Rendimento (R${review.review_number})` : (topic?.subject_name || 'Concluir Revisão')}
              </DialogTitle>
              <DialogDescription>
                {isEdit
                  ? `Ajuste as questões feitas e acertos de "${topic?.subject_name || 'Assunto'}". O aproveitamento e o agendamento adaptativo serão recalculados.`
                  : 'Informe o número de questões realizadas e acertos para o algoritmo calcular a data ótima da próxima revisão.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4">
              {/* Meta Recomendada para a Revisão Atual */}
              {review.recommended_questions ? (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-amber-400" /> Meta Científica (R{review.review_number}):
                  </span>
                  <span className="font-black text-amber-400">
                    🎯 {review.recommended_questions} questões
                  </span>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Questões Feitas
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    value={questionsDone}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setQuestionsDone(val);
                    }}
                    className="font-bold text-base"
                    placeholder="Ex: 20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Questões Acertadas
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    value={questionsCorrect}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setQuestionsCorrect(val);
                    }}
                    className="font-bold text-base text-emerald-400 placeholder:text-muted-foreground/35 placeholder:font-normal"
                    placeholder="Ex: 16"
                  />
                </div>
              </div>

              {/* Campo Opcional de Duração / Tempo de Estudo */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Tempo de Estudo (opcional)
                  </label>
                  <span className="text-[10px] text-muted-foreground">Em minutos</span>
                </div>
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={durationMinutes}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setDurationMinutes(val);
                    }}
                    placeholder="Ex: 45 min"
                    className="text-xs pr-14"
                  />
                  {durationMinutes && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none font-medium">
                      minutos
                    </span>
                  )}
                </div>
              </div>

              {/* Alerta de Acertos maior que Questões */}
              {isCorrectFilled && correctNum > doneNum && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] flex items-center gap-2">
                  <span>O número de acertos ({correctNum}) não pode ser maior que o total de questões ({doneNum}).</span>
                </div>
              )}

              {/* Pré-visualização Adaptativa Científica em Tempo Real */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Diagnóstico Clínico:</span>
                  <span className="font-bold text-xs">
                    {calculatedPct !== null
                      ? nextReviewCalc.diagnosisBadge
                      : '— (Informe os acertos)'}
                  </span>
                </div>

                {calculatedPct !== null && (
                  <p className="text-[11px] text-muted-foreground italic leading-relaxed bg-background/60 p-2 rounded-lg border border-border/50">
                    💡 {nextReviewCalc.pedagogicalNote}
                  </p>
                )}

                {nextCycleNumber && estimatedNextDate && (
                  <>
                    <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                        Próxima Revisão (R{nextCycleNumber}):
                      </span>
                      <span className="font-semibold text-foreground">
                        +{nextInterval} dias ({formatDateBR(estimatedNextDate)})
                      </span>
                    </div>

                    <div className="pt-1 border-t border-border/40 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Meta Sugerida (R{nextCycleNumber}):</span>
                      <span className="font-bold text-amber-400">
                        🎯 {nextReviewCalc.recommendedQuestions} questões
                      </span>
                    </div>
                  </>
                )}
                {review.review_number === 8 && (
                  <p className="text-[11px] text-emerald-400 font-medium pt-1 border-t border-border/60">
                    🎉 Último ciclo de revisão deste assunto! Fixação consolidada na memória de longo prazo.
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="success"
                disabled={isSubmitting || doneNum <= 0 || !isCorrectFilled || correctNum > doneNum}
                className="gap-1.5 font-bold"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isSubmitting ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Gravar e Agendar Próximo'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
