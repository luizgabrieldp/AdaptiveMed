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
import { StudyTopic, TopicReview, getAreaStyle, ERROR_LOG_CAUSES, ErrorLogCause } from '@/types/database';
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
  FileText,
  RefreshCw,
  AlertTriangle,
  Plus,
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
  const {
    deleteTopic,
    areas,
    updateTopicR0,
    updateTopic,
    deleteReviewsFromCycle,
    recalculateTopicReviews,
    errorLogs,
    addErrorLog,
    toggleErrorLogReviewed,
    deleteErrorLog,
  } = useData();
  const [selectedReviewToComplete, setSelectedReviewToComplete] = useState<TopicReview | null>(null);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'complete' | 'edit'>('complete');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [deletingCycleNum, setDeletingCycleNum] = useState<number | null>(null);

  // Estados do Caderno de Erros
  const [showErrorForm, setShowErrorForm] = useState(false);
  const [errorCause, setErrorCause] = useState<ErrorLogCause>('Lacuna teórica');
  const [errorConcept, setErrorConcept] = useState('');
  const [errorQuestionRef, setErrorQuestionRef] = useState('');
  const [isSavingError, setIsSavingError] = useState(false);

  // Estados para edição do R0
  const [isEditingR0, setIsEditingR0] = useState(false);
  const [r0Area, setR0Area] = useState<string>('');
  const [r0SubjectName, setR0SubjectName] = useState<string>('');
  const [r0Questions, setR0Questions] = useState<string>('20');
  const [r0Correct, setR0Correct] = useState<string>('0');
  const [r0Date, setR0Date] = useState<string>('');
  const [r0Notes, setR0Notes] = useState<string>('');
  const [isSavingR0, setIsSavingR0] = useState(false);

  // Estado para edição rápida de anotações no Drawer
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  React.useEffect(() => {
    if (topic && open) {
      setR0Area(topic.area || areas[0]?.name || 'Clínica Médica');
      setR0SubjectName(topic.subject_name || '');
      setR0Questions(String(topic.initial_questions || 20));
      setR0Correct(String(topic.initial_correct || 0));
      setR0Date(topic.initial_date || '');
      setR0Notes(topic.notes || '');
      setNotesDraft(topic.notes || '');
      setIsEditingR0(false);
      setIsEditingNotes(false);
      setShowErrorForm(false);
      setErrorConcept('');
      setErrorQuestionRef('');
    }
  }, [topic, open, areas]);

  const topicErrors = React.useMemo(
    () => (topic ? errorLogs.filter(e => e.topic_id === topic.id) : []),
    [errorLogs, topic]
  );

  const handleAddErrorLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !errorConcept.trim()) return;
    setIsSavingError(true);
    try {
      await addErrorLog({
        topic_id: topic.id,
        cause: errorCause,
        concept_summary: errorConcept.trim(),
        question_ref: errorQuestionRef.trim() || undefined,
      });
      setErrorConcept('');
      setErrorQuestionRef('');
      setShowErrorForm(false);
    } catch (err) {
      console.error('Erro ao salvar no Caderno de Erros:', err);
    } finally {
      setIsSavingError(false);
    }
  };

  const getCauseBadgeStyle = (cause: ErrorLogCause) => {
    switch (cause) {
      case 'Lacuna teórica':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
      case 'Interpretação':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
      case 'Pegadinha da banca':
        return 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30';
      case 'Distração':
        return 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30';
    }
  };

  if (!topic) return null;

  const areaColor = getAreaStyle(topic.area, areas);

  // Ordena as revisões existentes de 1 a 8
  const topicReviews = reviews.filter(r => r.topic_id === topic.id);
  const existingReviewsMap = new Map<number, TopicReview>();
  topicReviews.forEach(r => existingReviewsMap.set(r.review_number, r));

  const completedReviews = topicReviews
    .filter(r => Boolean(r.completed_date))
    .sort((a, b) => a.review_number - b.review_number);
  const pendingReviews = topicReviews.filter(r => !r.completed_date);

  // A trilha está pausada se não houver nenhuma revisão agendada/pendente e ainda não tiver atingido os 8 ciclos
  const isCyclePaused = pendingReviews.length === 0 && completedReviews.length < 8;
  const nextCycleToReactivate = completedReviews.length === 0 ? 1 : completedReviews[completedReviews.length - 1].review_number + 1;
  const lastCompletedCycle = completedReviews.length > 0 ? completedReviews[completedReviews.length - 1] : null;

  // Gera a lista das 8 revisões progressivas
  const reviewCycles = Array.from({ length: 8 }, (_, i) => i + 1);

  const r0DoneNum = parseInt(r0Questions, 10) || 0;
  const r0CorrectNum = parseInt(r0Correct, 10) || 0;
  const r0PreviewPct = r0DoneNum > 0 ? Math.round((r0CorrectNum / r0DoneNum) * 1000) / 10 : 0;

  const handleRecalculate = async () => {
    try {
      setIsRecalculating(true);
      await recalculateTopicReviews(topic.id);
    } catch (err) {
      console.error('Erro ao recalcular trilha:', err);
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleDeleteCycle = async (reviewNum: number) => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir o ciclo R${reviewNum} e pausar as revisões seguintes deste assunto? O estudo inicial (R0) e os ciclos anteriores continuarão salvos.`
      )
    ) {
      try {
        setDeletingCycleNum(reviewNum);
        await deleteReviewsFromCycle(topic.id, reviewNum);
      } catch (err) {
        console.error('Erro ao excluir ciclo de revisão:', err);
      } finally {
        setDeletingCycleNum(null);
      }
    }
  };

  const handleSaveR0 = async () => {
    if (r0DoneNum <= 0) return;
    if (r0CorrectNum > r0DoneNum) return;
    try {
      setIsSavingR0(true);
      await updateTopicR0(topic.id, r0DoneNum, r0CorrectNum, r0Date || undefined, undefined, {
        area: r0Area || topic.area,
        subject_name: r0SubjectName.trim() || topic.subject_name,
        notes: r0Notes.trim(),
      });
      setIsEditingR0(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingR0(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setIsSavingNotes(true);
      await updateTopic(topic.id, { notes: notesDraft.trim() });
      setIsEditingNotes(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingNotes(false);
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
                {/* Grande Área Médica */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Grande Área Médica</label>
                  <select
                    value={r0Area}
                    onChange={e => setR0Area(e.target.value)}
                    className="w-full h-8 rounded-lg border border-border bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {areas.map(a => (
                      <option key={a.id} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nome do Assunto */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Nome do Assunto ou Doença</label>
                  <Input
                    type="text"
                    required
                    value={r0SubjectName}
                    onChange={e => setR0SubjectName(e.target.value)}
                    className="h-8 text-xs font-bold"
                  />
                </div>

                {/* Data Inicial (R0) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Data em que Estudou (R0)</label>
                  <Input
                    type="date"
                    required
                    value={r0Date}
                    onChange={e => setR0Date(e.target.value)}
                    className="h-8 text-xs bg-card"
                  />
                </div>

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

                {/* Anotações no R0 */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Anotações / Foco do Estudo (opcional)</label>
                  <textarea
                    rows={2}
                    value={r0Notes}
                    onChange={e => setR0Notes(e.target.value)}
                    placeholder="Ex: Anote pontos de atenção, mnemônicos..."
                    className="w-full rounded-lg border border-border bg-card p-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
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
              <>
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

                {isCyclePaused && completedReviews.length === 0 && (
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                    <span className="text-[11px] text-amber-500 dark:text-amber-400 font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Trilha pausada no R0
                    </span>
                    <Button
                      size="sm"
                      onClick={handleRecalculate}
                      disabled={isRecalculating}
                      className="h-6 text-[10px] font-bold px-2.5 gap-1 bg-amber-600 hover:bg-amber-500 text-white"
                    >
                      <RefreshCw className={`h-2.5 w-2.5 ${isRecalculating ? 'animate-spin' : ''}`} />
                      {isRecalculating ? 'Recalculando...' : 'Recalcular R1'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Anotações do Estudo / Dúvidas e Mnemônicos */}
          <div className="p-3.5 rounded-xl bg-card border border-border space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" /> Anotações do Estudo
              </h4>
              {!isEditingNotes ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNotesDraft(topic.notes || '');
                    setIsEditingNotes(true);
                  }}
                  className="h-6 text-[11px] font-semibold px-2 gap-1 text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-3 w-3" /> {topic.notes ? 'Editar' : 'Adicionar'}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingNotes(false)}
                  className="h-6 text-[11px] font-semibold px-2 gap-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" /> Cancelar
                </Button>
              )}
            </div>

            {isEditingNotes ? (
              <div className="space-y-2 pt-1">
                <textarea
                  rows={3}
                  value={notesDraft}
                  onChange={e => setNotesDraft(e.target.value)}
                  placeholder="Adicione anotações, mnemônicos, pegadinhas de bancas ou o que precisa melhorar..."
                  className="w-full rounded-lg border border-border bg-card p-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditingNotes(false)}
                    disabled={isSavingNotes}
                    className="h-7 text-xs"
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="h-7 text-xs font-bold gap-1 bg-primary text-primary-foreground"
                  >
                    <Check className="h-3 w-3" /> {isSavingNotes ? 'Salvando...' : 'Salvar Anotação'}
                  </Button>
                </div>
              </div>
            ) : topic.notes ? (
              <p className="text-xs text-foreground bg-muted/30 p-2.5 rounded-lg whitespace-pre-wrap leading-relaxed border border-border/50">
                {topic.notes}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Nenhuma anotação registrada ainda para este estudo.
              </p>
            )}
          </div>

          {/* Caderno de Erros Estruturado */}
          <div className="p-3.5 rounded-xl bg-muted/20 border border-border/70 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Caderno de Erros ({topicErrors.length})
                </span>
              </div>
              {!showErrorForm ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowErrorForm(true)}
                  className="h-6 text-[11px] font-semibold px-2 gap-1 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                >
                  <Plus className="h-3 w-3" /> Registrar Erro
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowErrorForm(false)}
                  className="h-6 text-[11px] font-semibold px-2 gap-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" /> Fechar
                </Button>
              )}
            </div>

            {showErrorForm && (
              <form onSubmit={handleAddErrorLog} className="p-3 rounded-xl border border-rose-500/30 bg-card space-y-2.5 animate-fade-in">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Causa Raiz do Erro
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {ERROR_LOG_CAUSES.map(cause => (
                      <button
                        key={cause}
                        type="button"
                        onClick={() => setErrorCause(cause)}
                        className={`text-left px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
                          errorCause === cause
                            ? 'bg-primary/15 text-primary border-primary/50 ring-1 ring-primary/30'
                            : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/60'
                        }`}
                      >
                        {cause}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Referência da Questão (opcional)
                  </label>
                  <Input
                    value={errorQuestionRef}
                    onChange={e => setErrorQuestionRef(e.target.value)}
                    placeholder="Ex: ENARE 2024 Q18, USP-SP Q42..."
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Conceito / Regra para Nunca Mais Errar
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={errorConcept}
                    onChange={e => setErrorConcept(e.target.value)}
                    placeholder="Ex: Contraindicação de betabloqueador na intoxicação aguda por cocaína..."
                    className="w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSavingError || !errorConcept.trim()}
                    className="h-7 text-xs font-bold gap-1"
                  >
                    <Check className="h-3 w-3" /> {isSavingError ? 'Salvando...' : 'Salvar Erro'}
                  </Button>
                </div>
              </form>
            )}

            {topicErrors.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Nenhum erro catalogado para este assunto ainda. Registre erros recorrentes para fixar conceitos.
              </p>
            ) : (
              <div className="space-y-2">
                {topicErrors.map(err => (
                  <div
                    key={err.id}
                    className={`p-2.5 rounded-xl border transition-all space-y-1.5 ${
                      err.is_reviewed
                        ? 'bg-emerald-500/5 border-emerald-500/25 opacity-80'
                        : 'bg-card border-border/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getCauseBadgeStyle(
                            err.cause
                          )}`}
                        >
                          {err.cause}
                        </span>
                        {err.question_ref && (
                          <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/60">
                            {err.question_ref}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleErrorLogReviewed(err.id)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-colors flex items-center gap-1 ${
                            err.is_reviewed
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                              : 'bg-muted/50 text-muted-foreground border-border hover:text-foreground'
                          }`}
                          title={err.is_reviewed ? 'Marcar como pendente de revisão' : 'Marcar erro como dominado/revisado'}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {err.is_reviewed ? 'Revisado' : 'Marcar Revisado'}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteErrorLog(err.id)}
                          className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Excluir registro de erro"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <p
                      className={`text-xs leading-relaxed ${
                        err.is_reviewed ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}
                    >
                      {err.concept_summary}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Linha do Tempo das 8 Revisões */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <BrainCircuit className="h-3.5 w-3.5 text-primary" /> Ciclos de Revisão (R1 a R8)
              </h4>
              <span className="text-[11px] text-muted-foreground lowercase">
                {completedReviews.length} de 8 concluídas
              </span>
            </div>

            {/* Banner de Trilha Pausada se não houver revisões agendadas */}
            {isCyclePaused && (
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <Clock className="h-4 w-4" /> Trilha de Revisões Pausada
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Nenhum ciclo pendente no momento. Reative a trilha para gerar o ciclo R{nextCycleToReactivate} adaptado ao seu último desempenho.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleRecalculate}
                  disabled={isRecalculating}
                  className="h-8 px-3 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm shrink-0 gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
                  {isRecalculating ? 'Recalculando...' : 'Recalcular Trilha'}
                </Button>
              </div>
            )}

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
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteCycle(num)}
                              disabled={deletingCycleNum === num}
                              className="h-7 text-[11px] px-2 text-destructive hover:bg-destructive/10"
                              title={`Excluir R${num} e pausar revisões`}
                            >
                              <Trash2 className="h-3 w-3" />
                              <span className="hidden sm:inline text-[10px]">Excluir</span>
                            </Button>
                            <Button
                              size="sm"
                              variant={statusInfo.status === 'ATRASADO' ? 'destructive' : 'default'}
                              onClick={() => handleOpenComplete(existing)}
                              className="h-7 text-[11px] font-bold px-2.5 gap-1"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Concluir
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Se este foi o último concluído e a trilha está pausada */}
                      {isCompleted && isCyclePaused && lastCompletedCycle?.review_number === num && (
                        <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between">
                          <span className="text-[11px] text-amber-500 dark:text-amber-400 font-medium flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Trilha pausada neste ciclo
                          </span>
                          <Button
                            size="sm"
                            onClick={handleRecalculate}
                            disabled={isRecalculating}
                            className="h-6 text-[10px] font-bold px-2.5 gap-1 bg-amber-600 hover:bg-amber-500 text-white"
                          >
                            <RefreshCw className={`h-2.5 w-2.5 ${isRecalculating ? 'animate-spin' : ''}`} />
                            {isRecalculating ? 'Recalculando...' : `Recalcular R${num + 1}`}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                }

                // Se a trilha está pausada e este é o próximo ciclo a ser gerado
                if (isCyclePaused && num === nextCycleToReactivate) {
                  return (
                    <div
                      key={num}
                      className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/5 flex items-center justify-between gap-2 transition-all shadow-sm"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="h-6 w-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold">
                          R{num}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <span>{num}ª Revisão (Pausada)</span>
                            <Badge variant="outline" className="text-[9px] py-0 px-1 border-amber-500/30 text-amber-600 dark:text-amber-400">
                              Aguardando ativação
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Próximo ciclo a ser gerado com base no último desempenho registrado
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleRecalculate}
                        disabled={isRecalculating}
                        className="h-7 text-[11px] font-bold px-2.5 gap-1.5 bg-amber-600 hover:bg-amber-500 text-white shrink-0 shadow-sm"
                      >
                        <RefreshCw className={`h-3 w-3 ${isRecalculating ? 'animate-spin' : ''}`} />
                        {isRecalculating ? 'Recalculando...' : 'Recalcular Trilha'}
                      </Button>
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
