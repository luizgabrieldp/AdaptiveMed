'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/lib/store/data-context';
import { useFocusTimer } from '@/components/focus/focus-timer-context';
import {
  ERROR_LOG_CAUSE_STYLES,
  ErrorLog,
  StudyArea,
  StudyTopic,
  getAreaStyle,
} from '@/types/database';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Layers,
  RotateCcw,
  Sparkles,
  Timer,
  Trophy,
} from 'lucide-react';

interface ErrorFlashcardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errors: ErrorLog[];
  topicMap: Map<string, StudyTopic>;
  areas: StudyArea[];
}

export const ErrorFlashcardModal: React.FC<ErrorFlashcardModalProps> = ({
  open,
  onOpenChange,
  errors,
  topicMap,
  areas,
}) => {
  const { errorLogs, toggleErrorLogReviewed } = useData();
  const { focusOnTopic } = useFocusTimer();

  // Mantém um snapshot do baralho ao abrir o modal para evitar que cards marcados
  // como revisados desapareçam no meio da sessão e desloquem os índices.
  const [sessionDeck, setSessionDeck] = useState<ErrorLog[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [sessionDecisions, setSessionDecisions] = useState<
    Record<string, 'mastered' | 'pending'>
  >({});
  const cardContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      setSessionDeck(errors);
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsCompleted(false);
      setIsUpdating(false);
      setSessionDecisions({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const liveErrorById = useMemo(() => {
    const map = new Map<string, ErrorLog>();
    errorLogs.forEach(item => map.set(item.id, item));
    return map;
  }, [errorLogs]);

  const currentSnapshot = sessionDeck[currentIndex];
  const currentCard = currentSnapshot
    ? liveErrorById.get(currentSnapshot.id) || currentSnapshot
    : undefined;

  const totalCards = sessionDeck.length;
  const progressPct =
    totalCards > 0
      ? isCompleted
        ? 100
        : Math.round(((currentIndex + 1) / totalCards) * 100)
      : 0;

  const currentTopic = currentCard ? topicMap.get(currentCard.topic_id) : undefined;
  const areaName = currentTopic?.area || areas[0]?.name || 'Clínica Médica';
  const areaStyle = getAreaStyle(areaName, areas);

  const advanceOrComplete = useCallback(
    (cardId: string, decision: 'mastered' | 'pending') => {
      setSessionDecisions(prev => ({ ...prev, [cardId]: decision }));
      if (currentIndex + 1 >= totalCards) {
        setIsCompleted(true);
        setIsFlipped(false);
      } else {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
      }
    },
    [currentIndex, totalCards]
  );

  // Move o foco para o cartão ao abrir ou trocar de cartão para a tecla Espaço funcionar imediatamente
  useEffect(() => {
    if (!open || isCompleted || totalCards === 0) return;
    const raf = requestAnimationFrame(() => {
      cardContainerRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(raf);
  }, [open, currentIndex, isCompleted, totalCards]);

  // Atalho de teclado: Espaço revela/vira o cartão (sem interferir com botões/inputs focados)
  useEffect(() => {
    if (!open || isCompleted || totalCards === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName;
        if (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          tag === 'BUTTON' ||
          target?.closest('button')
        ) {
          return;
        }
        e.preventDefault();
        setIsFlipped(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isCompleted, totalCards]);

  const handleKeepPending = async () => {
    if (!currentCard || isUpdating) return;
    try {
      setIsUpdating(true);
      if (currentCard.is_reviewed) {
        await toggleErrorLogReviewed(currentCard.id, false);
      }
      advanceOrComplete(currentCard.id, 'pending');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkMastered = async () => {
    if (!currentCard || isUpdating) return;
    try {
      setIsUpdating(true);
      if (!currentCard.is_reviewed) {
        await toggleErrorLogReviewed(currentCard.id, true);
      }
      advanceOrComplete(currentCard.id, 'mastered');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex <= 0) return;
    setCurrentIndex(prev => prev - 1);
    setIsFlipped(false);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= totalCards) return;
    setCurrentIndex(prev => prev + 1);
    setIsFlipped(false);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
    setSessionDecisions({});
  };

  const handleFocusOnCurrentTopic = () => {
    if (!currentCard) return;
    focusOnTopic(areaName, currentTopic ? currentCard.topic_id : null, true);
    onOpenChange(false);
  };

  const masteredCount = useMemo(
    () => Object.values(sessionDecisions).filter(v => v === 'mastered').length,
    [sessionDecisions]
  );
  const keptPendingCount = useMemo(
    () => Object.values(sessionDecisions).filter(v => v === 'pending').length,
    [sessionDecisions]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-6">
        <DialogHeader className="mb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            <Layers className="h-4 w-4" />
            <span>Treino Ativo de Erros • Flashcards</span>
          </div>
          <DialogTitle className="text-lg sm:text-xl">
            Revisão de Regras de Ouro
          </DialogTitle>
          <DialogDescription className="text-xs">
            Tente recordar o conceito-chave antes de revelar o verso. Use a tecla{' '}
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-foreground font-mono text-[10px]">
              Espaço
            </kbd>{' '}
            para virar o cartão.
          </DialogDescription>
        </DialogHeader>

        {totalCards === 0 ? (
          <div className="py-10 text-center space-y-3 rounded-2xl border border-dashed border-border bg-muted/20 p-6">
            <p className="text-sm font-bold text-foreground">
              Nenhum erro disponível para treinar neste filtro.
            </p>
            <p className="text-xs text-muted-foreground">
              Cadastre erros ou ajuste os filtros na página para iniciar uma sessão de flashcards.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Fechar
            </Button>
          </div>
        ) : isCompleted ? (
          <div className="py-6 px-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-center space-y-5 animate-fade-in">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-500/30 shadow-sm">
              <Trophy className="h-7 w-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-foreground">
                Treino concluído!
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Você revisou todos os <strong className="text-foreground">{totalCards}</strong>{' '}
                {totalCards === 1 ? 'cartão deste ciclo' : 'cartões deste ciclo'}.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
              <div className="p-3 rounded-xl bg-card border border-emerald-500/30 text-center">
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Dominados
                </p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                  {masteredCount}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-card border border-amber-500/30 text-center">
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Mantidos Pendentes
                </p>
                <p className="text-2xl font-black text-amber-700 dark:text-amber-400 tabular-nums mt-0.5">
                  {keptPendingCount}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRestart}
                className="w-full sm:w-auto text-xs font-bold gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Treinar Novamente
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto text-xs font-bold gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Concluir & Fechar
              </Button>
            </div>
          </div>
        ) : currentCard ? (
          <div className="space-y-4">
            {/* Barra de Progresso */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-foreground tabular-nums">
                  Cartão {currentIndex + 1} de {totalCards}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {progressPct}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Cartão (Frente / Verso) */}
            <div
              ref={cardContainerRef}
              tabIndex={-1}
              className="rounded-2xl border border-border bg-muted/20 p-4 sm:p-5 space-y-4 shadow-inner outline-none"
            >
              {/* Metadados da Frente (sempre visíveis para contextualizar o cartão) */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${areaStyle.bg} ${areaStyle.text} ${areaStyle.border}`}
                  >
                    {areaName}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      ERROR_LOG_CAUSE_STYLES[currentCard.cause]
                    }`}
                  >
                    {currentCard.cause}
                  </span>
                  {currentCard.question_ref && (
                    <span className="text-[10px] font-mono text-muted-foreground bg-card px-2 py-0.5 rounded border border-border">
                      {currentCard.question_ref}
                    </span>
                  )}
                  {currentCard.is_reviewed && (
                    <Badge variant="concluido" className="text-[10px] py-0 px-2">
                      Revisado
                    </Badge>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-extrabold text-foreground leading-snug">
                  {currentTopic?.subject_name || 'Assunto removido'}
                </h3>
              </div>

              {!isFlipped ? (
                /* Frente do Cartão */
                <div className="rounded-xl border border-dashed border-border bg-card p-5 text-center space-y-4 animate-fade-in">
                  <div className="mx-auto h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground">
                      Tente lembrar a regra de ouro deste erro
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      O que causou este erro e qual conduta/conceito resolve a questão?
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setIsFlipped(true)}
                    className="font-bold text-xs gap-2 shadow-md shadow-primary/20"
                  >
                    <Eye className="h-4 w-4" />
                    Revelar Regra de Ouro
                  </Button>
                </div>
              ) : (
                /* Verso do Cartão */
                <div className="space-y-4 animate-fade-in">
                  <div className="rounded-xl border border-primary/30 bg-card p-4 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Regra de Ouro
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsFlipped(false)}
                        className="text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:underline"
                      >
                        Ocultar
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {currentCard.concept_summary}
                    </p>
                  </div>

                  {/* Ações do Verso */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUpdating}
                      onClick={handleKeepPending}
                      className="h-10 text-xs font-bold gap-1.5 border-amber-500/40 text-amber-800 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20"
                    >
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      Continuar Pendente
                    </Button>

                    <Button
                      type="button"
                      variant="success"
                      disabled={isUpdating}
                      onClick={handleMarkMastered}
                      className="h-10 text-xs font-bold gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      Dominei — Marcar como Revisado
                    </Button>
                  </div>

                  <div className="flex justify-center pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleFocusOnCurrentTopic}
                      className="text-xs font-bold gap-1.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15"
                    >
                      <Timer className="h-3.5 w-3.5" />
                      Focar neste Assunto
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Navegação Anterior / Próximo */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="text-xs font-semibold gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Anterior
              </Button>

              <span className="text-[11px] text-muted-foreground font-medium">
                {isFlipped ? 'Avalie seu domínio acima' : 'Pressione Espaço para virar'}
              </span>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentIndex + 1 >= totalCards}
                className="text-xs font-semibold gap-1"
              >
                Próximo
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
