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
import { CheckCircle2, Sparkles, BrainCircuit, Target, Trash2, AlertTriangle } from 'lucide-react';

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
  const { completeReview, updateCompletedReview, deleteReviewsFromCycle, topics, areas, updateTopic } = useData();
  const [area, setArea] = useState<string>('');
  const [subjectName, setSubjectName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [completedDate, setCompletedDate] = useState<string>('');
  const [questionsDone, setQuestionsDone] = useState<string>('20');
  const [questionsCorrect, setQuestionsCorrect] = useState<string>('16');
  const [durationMinutes, setDurationMinutes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isEdit = mode === 'edit' || (mode !== 'complete' && Boolean(review?.completed_date));

  React.useEffect(() => {
    if (review && open) {
      const currentTopic = topic || topics.find(t => t.id === review.topic_id);
      if (currentTopic) {
        setArea(currentTopic.area || areas[0]?.name || 'Clínica Médica');
        setSubjectName(currentTopic.subject_name || '');
        setNotes(currentTopic.notes || '');
      } else {
        setArea(areas[0]?.name || 'Clínica Médica');
        setSubjectName('');
        setNotes('');
      }

      if (isEdit || review.completed_date) {
        setQuestionsDone(review.questions_done != null ? String(review.questions_done) : '20');
        setQuestionsCorrect(review.questions_correct != null ? String(review.questions_correct) : '16');
        setDurationMinutes(review.duration_minutes != null ? String(review.duration_minutes) : '');
        setCompletedDate(review.completed_date || getTodayDateString());
      } else {
        const suggested = review.recommended_questions ? String(review.recommended_questions) : '20';
        setQuestionsDone(suggested);
        setQuestionsCorrect('');
        setDurationMinutes('');
        setCompletedDate(getTodayDateString());
      }
    }
  }, [review, open, isEdit, topic, topics, areas]);

  if (!review) return null;

  const doneNum = parseInt(questionsDone, 10) || 0;
  const correctNum = questionsCorrect !== '' ? parseInt(questionsCorrect, 10) || 0 : 0;
  const isCorrectFilled = questionsCorrect !== '';
  const calculatedPct =
    doneNum > 0 && isCorrectFilled && correctNum <= doneNum
      ? Math.min(100, Math.round((correctNum / doneNum) * 1000) / 10)
      : null;

  const currentTopic = topic || topics.find(t => t.id === review.topic_id);

  // Cálculo científico do próximo ciclo
  const baseCount = currentTopic?.base_questions_count || currentTopic?.initial_questions || 20;
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
      const targetTopic = topic || topics.find(t => t.id === review.topic_id);

      if (targetTopic) {
        const topicUpdates: Partial<StudyTopic> = {};
        if (area && area !== targetTopic.area) {
          topicUpdates.area = area;
        }
        if (subjectName.trim() && subjectName.trim() !== targetTopic.subject_name) {
          topicUpdates.subject_name = subjectName.trim();
        }
        if (notes.trim() !== (targetTopic.notes || '')) {
          topicUpdates.notes = notes.trim();
        }

        if (Object.keys(topicUpdates).length > 0) {
          await updateTopic(targetTopic.id, topicUpdates);
        }
      }

      if (isEdit) {
        await updateCompletedReview(review.id, doneNum, correctNum, completedDate || undefined);
      } else {
        await completeReview(review.id, doneNum, correctNum, durNum);

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
      }

      // Conclusão/Edição: fecha o modal diretamente
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReviewCycle = async () => {
    try {
      setIsDeleting(true);
      await deleteReviewsFromCycle(review.topic_id, review.review_number);
      setShowDeleteConfirm(false);
      onOpenChange(false);
    } catch (err) {
      console.error('Erro ao excluir ciclo de revisão:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        {showDeleteConfirm ? (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 space-y-3.5 my-2">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-destructive/20 text-destructive shrink-0 mt-0.5">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">
                  Excluir R{review.review_number} e pausar revisões?
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Isso apagará o ciclo <strong className="text-foreground">R{review.review_number}</strong> (e revisões seguintes) deste assunto da sua agenda.
                  O seu <strong className="text-emerald-500 font-semibold">estudo inicial (R0) continuará salvo intacto</strong> no seu histórico.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-destructive/20">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs"
              >
                Voltar
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={handleDeleteReviewCycle}
                className="text-xs font-bold gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isDeleting ? 'Excluindo...' : `Confirmar Exclusão de R${review.review_number}`}
              </Button>
            </div>
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
              {/* Grande Área Médica */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Grande Área Médica
                </label>
                <select
                  value={area}
                  onChange={e => setArea(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {areas.map(a => (
                    <option key={a.id} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nome do Assunto */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Nome do Assunto ou Doença
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Ex: Asma na Infância"
                  value={subjectName}
                  onChange={e => setSubjectName(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Data da Revisão (no modo de edição) */}
              {isEdit && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Data em que Realizou a Revisão
                  </label>
                  <Input
                    type="date"
                    required
                    value={completedDate}
                    onChange={e => setCompletedDate(e.target.value)}
                    className="text-xs bg-card"
                  />
                </div>
              )}

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

              {/* Anotações / Foco do Estudo */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Anotações / Foco do Estudo (opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Dúvidas, pegadinhas de bancas, mnemônicos ou pontos a revisar..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card p-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {/* Alerta de Acertos maior que Questões */}
              {isCorrectFilled && correctNum > doneNum && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] flex items-center gap-2">
                  <span>O número de acertos ({correctNum}) não pode ser maior que o total de questões ({doneNum}).</span>
                </div>
              )}

              {/* Pré-visualização Adaptativa Científica em Tempo Real */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2.5">
                {/* Aproveitamento em Destaque */}
                <div className="flex items-center justify-between font-bold pb-2 border-b border-border/60">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    Taxa de Aproveitamento:
                  </span>
                  {calculatedPct !== null ? (
                    <span className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                      <span className="text-primary text-base font-black">{calculatedPct}%</span>
                      <span className="text-xs text-muted-foreground font-normal">({correctNum} de {doneNum} acertos)</span>
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground font-normal">— (Informe acertos)</span>
                  )}
                </div>

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

            {/* Rodapé Otimizado em Linha Única */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-border mt-3 w-full">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs text-destructive hover:bg-destructive/15 gap-1.5 h-9 px-2.5 font-semibold shrink-0"
                title={`Excluir R${review.review_number} e pausar revisões posteriores`}
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0" />
                <span>Excluir R{review.review_number}</span>
              </Button>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  className="h-9 px-3 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="success"
                  disabled={isSubmitting || doneNum <= 0 || !isCorrectFilled || correctNum > doneNum}
                  className="h-9 px-3.5 text-xs font-bold gap-1.5 whitespace-nowrap"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  {isSubmitting
                    ? 'Salvando...'
                    : isEdit
                    ? `Salvar R${review.review_number}`
                    : `Concluir R${review.review_number}`}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
