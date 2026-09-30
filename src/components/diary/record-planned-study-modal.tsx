'use client';

import React, { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { useData } from '@/lib/store/data-context';
import { StudyTopic, getAreaStyle } from '@/types/database';
import {
  calculateNextReviewInterval,
  calculateNextReview,
  getTodayDateString,
  addDaysToDate,
  formatDateBR,
} from '@/lib/spaced-repetition';
import { CheckCircle2, Sparkles, BrainCircuit, ArrowRight, AlertTriangle, Info } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RecordPlannedStudyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic?: StudyTopic | null;
}

export const RecordPlannedStudyModal: React.FC<RecordPlannedStudyModalProps> = ({
  open,
  onOpenChange,
  topic,
}) => {
  const { recordPlannedTopicStudy, areas } = useData();

  const [studyDate, setStudyDate] = useState(getTodayDateString());
  const [questionsDone, setQuestionsDone] = useState<string>('25');
  const [questionsCorrect, setQuestionsCorrect] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultDate, setResultDate] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStudyDate(getTodayDateString());
      setQuestionsDone('25');
      setQuestionsCorrect('');
      setDurationMinutes('');
      setResultDate(null);
    }
  }, [open, topic]);

  if (!topic) return null;

  const qDone = parseInt(questionsDone, 10) || 0;
  const qCorrect = questionsCorrect !== '' ? parseInt(questionsCorrect, 10) || 0 : 0;
  const isCorrectFilled = questionsCorrect !== '';
  const percentage =
    qDone > 0 && isCorrectFilled && qCorrect <= qDone
      ? Math.round((qCorrect / qDone) * 1000) / 10
      : null;
  const reviewCalc = calculateNextReview({
    currentCycle: 0,
    accuracy: percentage ?? 80,
    baseQuestionsCount: qDone || 25,
  });
  const r1Interval = reviewCalc.nextIntervalDays;
  const estimatedR1Date = addDaysToDate(studyDate || getTodayDateString(), r1Interval);
  const durNum = durationMinutes.trim() !== '' ? parseInt(durationMinutes, 10) : undefined;

  const areaStyle = getAreaStyle(topic.area, areas);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qDone <= 0 || !isCorrectFilled || qCorrect > qDone) return;

    try {
      setIsSubmitting(true);
      await recordPlannedTopicStudy(topic.id, {
        study_date: studyDate,
        questions_done: qDone,
        questions_correct: qCorrect,
        duration_minutes: durNum,
      });

      // Efeito festivo de confete ao consolidar 1º contato
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      // Conclusão em 1 clique: fecha o modal diretamente
      onOpenChange(false);
    } catch (err) {
      console.error('Erro ao registrar estudo:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Registrar Estudo Concluído</DialogTitle>
              <DialogDescription className="text-xs">
                Informe as questões feitas para ativar o algoritmo adaptativo de revisão.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Detalhes do Assunto */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
              <span
                className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${areaStyle.bg} ${areaStyle.text} ${areaStyle.border}`}
              >
                {topic.area}
              </span>
              <h4 className="font-bold text-sm text-foreground">{topic.subject_name}</h4>
              <p className="text-[11px] text-muted-foreground">
                Planejado originalmente para {formatDateBR(topic.planned_date || topic.initial_date)}
              </p>
            </div>

            {/* Callout de Recomendação Científica */}
            <div className="p-3 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/30 text-xs flex items-start gap-2.5">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-900 dark:text-blue-100 font-medium leading-relaxed">
                <strong className="font-bold">Recomendação AdaptiveMed:</strong> Resolva de <strong className="font-bold">25 a 30 questões</strong> no primeiro estudo para calibrar a escala da sua curva de retenção e garantir máxima precisão diagnóstica.
              </p>
            </div>

            {/* Data em que estudou */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Data do Estudo
              </label>
              <Input
                type="date"
                required
                value={studyDate}
                onChange={e => setStudyDate(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Questões Feitas e Acertos */}
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
                  placeholder="Ex: 25"
                  value={questionsDone}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setQuestionsDone(val);
                  }}
                  className="text-sm font-semibold"
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
                  placeholder="Ex: 18"
                  value={questionsCorrect}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setQuestionsCorrect(val);
                  }}
                  className="text-sm font-semibold text-emerald-400 placeholder:text-muted-foreground/35 placeholder:font-normal"
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
            {isCorrectFilled && qCorrect > qDone && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>O número de acertos ({qCorrect}) não pode ser maior que o total de questões ({qDone}).</span>
              </div>
            )}

            {/* Alerta de Amostragem Baixa */}
            {qDone > 0 && qDone < 10 && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                <span>Amostragem baixa (&lt; 10 questões) para cálculo preciso de retenção. Sugerimos mais questões para maior precisão diagnóstica.</span>
              </div>
            )}

            {/* Prévia da Repetição Espaçada Adaptativa Científica */}
            <div className="p-3.5 rounded-xl bg-muted/50 border border-border text-xs space-y-2.5">
              {/* Aproveitamento em Destaque */}
              <div className="flex items-center justify-between font-bold pb-2 border-b border-border/60">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  Taxa de Aproveitamento:
                </span>
                {percentage !== null ? (
                  <span className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                    <span className="text-primary text-base font-black">{percentage}%</span>
                    <span className="text-xs text-muted-foreground font-normal">({qCorrect} de {qDone} acertos)</span>
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground font-normal">— (Informe acertos)</span>
                )}
              </div>

              <div className="flex items-center justify-between font-bold">
                <span className="text-muted-foreground flex items-center gap-1">
                  <BrainCircuit className="h-3.5 w-3.5 text-primary" /> Diagnóstico:
                </span>
                <span className="font-bold text-xs">
                  {percentage !== null
                    ? reviewCalc.diagnosisBadge
                    : '— (Informe os acertos)'}
                </span>
              </div>

              {percentage !== null && (
                <p className="text-[11px] text-muted-foreground italic leading-relaxed bg-background/60 p-2 rounded-lg border border-border/50">
                  💡 {reviewCalc.pedagogicalNote}
                </p>
              )}

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border/60">
                <span>Próxima Revisão (R1):</span>
                <span className="font-bold text-foreground">
                  +{r1Interval} dias ({formatDateBR(estimatedR1Date)})
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                <span>Meta Sugerida para R1:</span>
                <span className="font-bold text-amber-400">
                  🎯 {reviewCalc.recommendedQuestions} questões
                </span>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting || qDone <= 0 || !isCorrectFilled || qCorrect > qDone}
                className="w-full sm:w-auto font-bold text-xs gap-1.5 shadow-md shadow-primary/20"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isSubmitting ? 'Salvando...' : 'Concluir Estudo & Ativar R1'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto text-xs text-muted-foreground"
              >
                Cancelar
              </Button>
            </DialogFooter>
          </form>
      </DialogContent>
    </Dialog>
  );
};
