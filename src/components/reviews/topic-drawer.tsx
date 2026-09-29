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
import { StudyTopic, TopicReview, getAreaStyle } from '@/types/database';
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
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
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
  const { deleteTopic, areas, updateTopicR0 } = useData();
  const [selectedReviewToComplete, setSelectedReviewToComplete] = useState<TopicReview | null>(null);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'complete' | 'edit'>('complete');
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados para edição do R0
  const [isEditingR0, setIsEditingR0] = useState(false);
  const [r0Questions, setR0Questions] = useState<string>('20');
  const [r0Correct, setR0Correct] = useState<string>('0');
  const [r0Date, setR0Date] = useState<string>('');
  const [isSavingR0, setIsSavingR0] = useState(false);

  React.useEffect(() => {
    if (topic && open) {
      setR0Questions(String(topic.initial_questions || 20));
      setR0Correct(String(topic.initial_correct || 0));
      setR0Date(topic.initial_date || '');
      setIsEditingR0(false);
    }
  }, [topic, open]);

  if (!topic) return null;

  const areaColor = getAreaStyle(topic.area, areas);

  // Ordena as revisões existentes de 1 a 8
  const existingReviewsMap = new Map<number, TopicReview>();
  reviews
    .filter(r => r.topic_id === topic.id)
    .forEach(r => existingReviewsMap.set(r.review_number, r));

  // Gera a lista das 8 revisões progressivas
  const reviewCycles = Array.from({ length: 8 }, (_, i) => i + 1);

  const r0DoneNum = parseInt(r0Questions, 10) || 0;
  const r0CorrectNum = parseInt(r0Correct, 10) || 0;
  const r0PreviewPct = r0DoneNum > 0 ? Math.round((r0CorrectNum / r0DoneNum) * 1000) / 10 : 0;

  const handleSaveR0 = async () => {
    if (r0DoneNum <= 0) return;
    if (r0CorrectNum > r0DoneNum) return;
    try {
      setIsSavingR0(true);
      await updateTopicR0(topic.id, r0DoneNum, r0CorrectNum, r0Date || undefined);
      setIsEditingR0(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingR0(false);
    }
  };

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
    setModalMode('complete');
    setCompleteModalOpen(true);
  };

  const handleOpenEditReview = (rev: TopicReview) => {
    setSelectedReviewToComplete(rev);
    setModalMode('edit');
    setCompleteModalOpen(true);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="space-y-6">
          <SheetHeader>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${areaColor.bg} ${areaColor.text} ${areaColor.border}`}
              >
                {topic.area}
              </span>
              {topic.tags && topic.tags.length > 0 && topic.tags.map(t => (
                <span
                  key={t}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border"
                >
                  #{t}
                </span>
              ))}
              <span className="text-xs text-muted-foreground">
                Cadastrado em {formatDateBR(topic.initial_date)}
              </span>
            </div>
            <SheetTitle>{topic.subject_name}</SheetTitle>
            <SheetDescription>
              Cronograma progressivo de 8 ciclos adaptativos de retenção.
            </SheetDescription>
          </SheetHeader>

          {/* Dados do Primeiro Contato (R0) */}
          <div className="p-4 rounded-xl bg-card border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-blue-400" /> Primeiro Contato com a Matéria (R0)
              </h4>
              {!isEditingR0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingR0(true)}
                  className="h-6 text-[11px] font-semibold px-2 gap-1 text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-3 w-3" /> Editar R0
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingR0(false)}
                  className="h-6 text-[11px] font-semibold px-2 gap-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" /> Cancelar
                </Button>
              )}
            </div>

            {isEditingR0 ? (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground">Questões Feitas</label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={r0Questions}
                      onChange={e => setR0Questions(e.target.value.replace(/\D/g, ''))}
                      className="h-8 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground">Questões Acertadas</label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={r0Correct}
                      onChange={e => setR0Correct(e.target.value.replace(/\D/g, ''))}
                      className="h-8 text-xs font-bold text-emerald-400"
                    />
                  </div>
                </div>

                {r0Correct !== '' && r0CorrectNum > r0DoneNum && (
                  <p className="text-[11px] text-rose-400 font-medium">
                    O número de acertos ({r0CorrectNum}) não pode ser maior que o de questões ({r0DoneNum}).
                  </p>
                )}

                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-xs">
                  <span className="text-muted-foreground text-[11px]">Novo Aproveitamento Calculado:</span>
                  <span className={`font-bold ${r0PreviewPct >= 80 ? 'text-emerald-400' : r0PreviewPct >= 65 ? 'text-blue-400' : 'text-amber-400'}`}>
                    {r0PreviewPct}% ({r0CorrectNum}/{r0DoneNum})
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditingR0(false)}
                    disabled={isSavingR0}
                    className="h-7 text-xs"
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveR0}
                    disabled={isSavingR0 || r0DoneNum <= 0 || r0Correct === '' || r0CorrectNum > r0DoneNum}
                    className="h-7 text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <Check className="h-3 w-3" /> {isSavingR0 ? 'Salvando...' : 'Salvar R0'}
                  </Button>
                </div>
              </div>
            ) : (
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
            )}
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
                          <div className="flex items-center gap-2">
                            <Badge variant="concluido" className="text-[10px]">
                              {existing.percentage}% ({existing.questions_correct}/{existing.questions_done})
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenEditReview(existing)}
                              className="h-6 text-[11px] font-semibold px-2 gap-1 text-muted-foreground hover:text-foreground hover:bg-muted"
                              title="Editar acertos e questões desta revisão"
                            >
                              <Pencil className="h-3 w-3" /> Editar
                            </Button>
                          </div>
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
        mode={modalMode}
      />
    </>
  );
};
