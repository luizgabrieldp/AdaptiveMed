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
import { useData } from '@/lib/store/data-context';
import { StudyTopic } from '@/types/database';
import {
  getTodayDateString,
  calculateNextReview,
  addDaysToDate,
  formatDateBR,
} from '@/lib/spaced-repetition';
import { Edit3, Check, Tag, Trash2, AlertTriangle, BrainCircuit, Sparkles } from 'lucide-react';

interface EditPlannedTopicModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic: StudyTopic | null;
}

export const EditPlannedTopicModal: React.FC<EditPlannedTopicModalProps> = ({
  open,
  onOpenChange,
  topic,
}) => {
  const { areas, updateTopic, updateTopicR0, deleteTopic } = useData();

  const [area, setArea] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [hasSpecificDate, setHasSpecificDate] = useState(false);
  const [plannedDate, setPlannedDate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [notes, setNotes] = useState('');

  // Campos para quando R0 já foi realizado
  const [studyDate, setStudyDate] = useState('');
  const [questionsDone, setQuestionsDone] = useState('25');
  const [questionsCorrect, setQuestionsCorrect] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isCompleted = Boolean(
    topic &&
      (!topic.is_planned ||
        (topic.initial_questions != null && topic.initial_questions > 0))
  );

  useEffect(() => {
    if (topic && open) {
      setArea(topic.area || areas[0]?.name || 'Clínica Médica');
      setSubjectName(topic.subject_name || '');
      const hasDate = Boolean(topic.planned_date);
      setHasSpecificDate(hasDate);
      setPlannedDate(topic.planned_date || getTodayDateString());
      setTagInput(topic.tags ? topic.tags.join(', ') : '');
      setNotes(topic.notes || '');

      setStudyDate(topic.initial_date || topic.planned_date || getTodayDateString());
      setQuestionsDone(
        topic.initial_questions != null ? String(topic.initial_questions) : '25'
      );
      setQuestionsCorrect(
        topic.initial_correct != null ? String(topic.initial_correct) : ''
      );
      setDurationMinutes(
        topic.initial_duration_minutes != null
          ? String(topic.initial_duration_minutes)
          : ''
      );

      setShowDeleteConfirm(false);
    }
  }, [topic, open, areas]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) return;

    if (isCompleted) {
      if (qDone <= 0 || !isCorrectFilled || qCorrect > qDone) return;
    }

    try {
      setIsSubmitting(true);
      const tags = tagInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const targetPlannedDate = hasSpecificDate && plannedDate ? plannedDate : undefined;

      await updateTopic(topic.id, {
        area,
        subject_name: subjectName.trim(),
        tags,
        planned_date: targetPlannedDate,
        initial_date: isCompleted ? studyDate : targetPlannedDate || topic.initial_date,
        notes: notes.trim() || undefined,
      });

      if (isCompleted) {
        await updateTopicR0(topic.id, qDone, qCorrect, studyDate, durNum);
      }

      onOpenChange(false);
    } catch (err) {
      console.error('Erro ao editar assunto:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteTopic(topic.id);
      setShowDeleteConfirm(false);
      onOpenChange(false);
    } catch (err) {
      console.error('Erro ao excluir estudo:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-primary/15 text-primary">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                {isCompleted ? 'Editar Estudo Realizado (R0)' : 'Editar Assunto da Semana'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isCompleted
                  ? 'Ajuste questões feitas, acertos ou data. O ciclo R1 será recalculado automaticamente.'
                  : 'Modifique os dados do estudo programado, dia previsto ou anotações.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {showDeleteConfirm ? (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 space-y-3.5 my-2">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-destructive/20 text-destructive shrink-0 mt-0.5">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">
                  Excluir estudo definitivamente?
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Isso apagará o assunto <strong className="text-foreground">"{topic.subject_name}"</strong> e{' '}
                  <strong className="text-destructive">todas as revisões futuras associadas</strong> do seu cronograma.
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
                onClick={handleDelete}
                className="text-xs font-bold gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Grande Área */}
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

            {/* Subáreas / Tags */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Tag className="h-3 w-3" /> Subáreas / Tags (separadas por vírgula)
              </label>
              <Input
                type="text"
                placeholder="Ex: Pneumologia, Crise Aguda"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Se for estudo já concluído (R0 feito), exibe campos de rendimento */}
            {isCompleted ? (
              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border space-y-3">
                <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Rendimento do 1º Contato (R0)
                </h5>

                {/* Data do Estudo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Data em que Estudou
                  </label>
                  <Input
                    type="date"
                    required
                    value={studyDate}
                    onChange={e => setStudyDate(e.target.value)}
                    className="text-xs bg-card"
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
                      className="text-sm font-semibold bg-card"
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
                      className="text-sm font-semibold text-emerald-500 dark:text-emerald-400 bg-card"
                    />
                  </div>
                </div>

                {/* Duração / Tempo de Estudo */}
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
                      className="text-xs pr-14 bg-card"
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

                {/* Prévia do Diagnóstico com Aproveitamento Explícito */}
                <div className="p-3 rounded-xl bg-card border border-border text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold pb-1.5 border-b border-border/60">
                    <span className="text-muted-foreground">Taxa de Aproveitamento:</span>
                    {percentage !== null ? (
                      <span className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                        <span className="text-primary text-base font-black">{percentage}%</span>
                        <span className="text-xs text-muted-foreground font-normal">({qCorrect}/{qDone})</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground font-normal">—</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between font-bold">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <BrainCircuit className="h-3.5 w-3.5 text-primary" /> Diagnóstico:
                    </span>
                    <span className="font-bold text-xs">
                      {percentage !== null ? reviewCalc.diagnosisBadge : '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                    <span>Próxima Revisão (R1):</span>
                    <span className="font-bold text-foreground">
                      +{r1Interval} dias ({formatDateBR(estimatedR1Date)})
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Data Prevista se ainda estiver planejado */
              <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="edit-has-date-toggle" className="text-xs font-semibold text-foreground flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="edit-has-date-toggle"
                      checked={hasSpecificDate}
                      onChange={e => setHasSpecificDate(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Definir dia específico nesta semana</span>
                  </label>
                </div>

                {hasSpecificDate ? (
                  <Input
                    type="date"
                    required={hasSpecificDate}
                    value={plannedDate}
                    onChange={e => setPlannedDate(e.target.value)}
                    className="text-xs bg-card"
                  />
                ) : (
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Sem dia fixo: o card permanecerá na lista lateral de <strong className="text-foreground">Assuntos da Semana</strong> para você agendar ou arrastar quando quiser.
                  </p>
                )}
              </div>
            )}

            {/* Anotações */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Anotações / Foco do Estudo (opcional)
              </label>
              <Input
                type="text"
                placeholder="Ex: Focar em critérios diagnósticos e tratamento de 1ª linha"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="flex-col sm:flex-row justify-between items-center gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full sm:w-auto text-xs text-destructive hover:bg-destructive/15 gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir Estudo
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="w-full sm:w-auto text-xs text-muted-foreground"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !subjectName.trim() ||
                    (isCompleted && (qDone <= 0 || !isCorrectFilled || qCorrect > qDone))
                  }
                  className="w-full sm:w-auto font-bold text-xs gap-1.5 shadow-md shadow-primary/20"
                >
                  <Check className="h-4 w-4" />
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
