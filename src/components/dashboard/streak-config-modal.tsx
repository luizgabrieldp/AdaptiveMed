'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/lib/store/data-context';
import { StreakRuleType, DEFAULT_STREAK_CONFIG } from '@/types/database';
import {
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';

interface StreakConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STREAK_RULES: { id: StreakRuleType; label: string; description: string; badge?: string }[] = [
  {
    id: 'questions_or_mock',
    label: 'Questões OU Simulado',
    description: 'Atingir a meta de questões OU concluir um simulado mantém a ofensiva.',
    badge: 'Padrão',
  },
  {
    id: 'questions_only',
    label: 'Apenas Questões',
    description: 'Exige atingir a meta diária de questões (simulados isolados não contam).',
  },
  {
    id: 'questions_and_mock',
    label: 'Questões E Simulado',
    description: 'Exige cumprir a meta de questões E realizar ao menos um simulado no dia.',
    badge: 'Avançado',
  },
  {
    id: 'mock_only',
    label: 'Apenas Simulado',
    description: 'Apenas dias em que você conclui ao menos um simulado pontuam.',
  },
];

const QUESTION_TARGETS = [5, 10, 15, 20, 25, 30, 50];

export const StreakConfigModal: React.FC<StreakConfigModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { streakConfig, updateStreakConfig, stats } = useData();

  const [ruleType, setRuleType] = useState<StreakRuleType>(
    streakConfig?.ruleType || DEFAULT_STREAK_CONFIG.ruleType
  );
  const [minDailyQuestions, setMinDailyQuestions] = useState<number>(
    streakConfig?.minDailyQuestions || DEFAULT_STREAK_CONFIG.minDailyQuestions
  );
  const [isSaving, setIsSaving] = useState(false);

  // Sincroniza estado com a store quando o modal é aberto
  useEffect(() => {
    if (open) {
      setRuleType(streakConfig?.ruleType || DEFAULT_STREAK_CONFIG.ruleType);
      setMinDailyQuestions(streakConfig?.minDailyQuestions || DEFAULT_STREAK_CONFIG.minDailyQuestions);
    }
  }, [open, streakConfig]);

  // Avaliação em tempo real se o dia de hoje pontuaria sob o rascunho da regra
  const isDraftQualified = useMemo(() => {
    const q = stats.todayQuestionsCount || 0;
    const m = stats.todayMockCompleted ? 1 : 0;
    switch (ruleType) {
      case 'questions_only':
        return q >= minDailyQuestions;
      case 'mock_only':
        return m >= 1;
      case 'questions_and_mock':
        return q >= minDailyQuestions && m >= 1;
      case 'questions_or_mock':
      default:
        return q >= minDailyQuestions || m >= 1;
    }
  }, [ruleType, minDailyQuestions, stats.todayQuestionsCount, stats.todayMockCompleted]);

  // Mensagem e status da prévia ao vivo
  const draftFeedback = useMemo(() => {
    const q = stats.todayQuestionsCount || 0;
    const m = stats.todayMockCompleted;

    if (isDraftQualified) {
      return {
        isSuccess: true,
        title: 'Pontuaria Hoje! 🔥',
        message: 'Com essa configuração, seu progresso de hoje já garante a ofensiva ativa!',
      };
    }

    if (ruleType === 'mock_only') {
      return {
        isSuccess: false,
        title: 'Pendente Hoje',
        message: 'Você ainda não concluiu nenhum simulado na data de hoje.',
      };
    }

    if (ruleType === 'questions_only') {
      const diff = Math.max(0, minDailyQuestions - q);
      return {
        isSuccess: false,
        title: 'Pendente Hoje',
        message: `Você fez ${q} questões hoje. Faltam ${diff} questões para ativar a ofensiva.`,
      };
    }

    if (ruleType === 'questions_and_mock') {
      const diffQ = Math.max(0, minDailyQuestions - q);
      const needM = !m;
      const pendencias = [];
      if (diffQ > 0) pendencias.push(`mais ${diffQ} questões`);
      if (needM) pendencias.push('1 simulado');
      return {
        isSuccess: false,
        title: 'Pendente Hoje',
        message: `Faltam: ${pendencias.join(' e ')} para cumprir ambos os requisitos hoje.`,
      };
    }

    // questions_or_mock
    const diff = Math.max(0, minDailyQuestions - q);
    return {
      isSuccess: false,
      title: 'Pendente Hoje',
      message: `Você fez ${q} questões hoje. Faltam ${diff} questões (ou faça 1 simulado) para pontuar.`,
    };
  }, [isDraftQualified, ruleType, minDailyQuestions, stats.todayQuestionsCount, stats.todayMockCompleted]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateStreakConfig({
        ruleType,
        minDailyQuestions,
      });
      onOpenChange(false);
    } catch (err) {
      console.error('Erro ao salvar configuração da ofensiva:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full bg-card border-border p-6 shadow-xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500">
              <Flame className="h-5 w-5 fill-amber-500" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Configurar Regra da Ofensiva
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Personalize os critérios diários para manter seus dias consecutivos ativos.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Seletor de Regras */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Critério de Pontuação</span>
              <span className="text-amber-500 font-medium lowercase">1 por dia</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {STREAK_RULES.map((rule) => {
                const isSelected = ruleType === rule.id;
                return (
                  <button
                    key={rule.id}
                    type="button"
                    onClick={() => setRuleType(rule.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 text-xs ${
                      isSelected
                        ? 'border-amber-500/80 bg-amber-500/10 text-foreground ring-1 ring-amber-500/40 shadow-sm'
                        : 'border-border/60 bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <div className="space-y-0.5 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-semibold ${isSelected ? 'text-amber-400 font-bold' : 'text-foreground'}`}>
                          {rule.label}
                        </span>
                        {rule.badge && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            rule.badge === 'Padrão'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-purple-500/20 text-purple-300'
                          }`}>
                            {rule.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {rule.description}
                      </p>
                    </div>
                    <div className="pt-0.5">
                      {isSelected ? (
                        <div className="h-4 w-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-3.5 w-3.5 fill-current" />
                        </div>
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-border/80 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meta Mínima de Questões (se a regra exigir questões) */}
          {ruleType !== 'mock_only' && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Meta Mínima de Questões
                </label>
                <span className="text-xs font-bold text-amber-400">
                  {minDailyQuestions} questões/dia
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {QUESTION_TARGETS.map((target) => {
                  const isSelected = minDailyQuestions === target;
                  return (
                    <button
                      key={target}
                      type="button"
                      onClick={() => setMinDailyQuestions(target)}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-sm'
                          : 'bg-muted/30 text-muted-foreground border-border/60 hover:bg-muted/60 hover:text-foreground'
                      }`}
                    >
                      {target} Qs
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground leading-normal">
                Soma de questões resolvidas no primeiro contato (R0) e nas revisões (R1-R8) do dia.
              </p>
            </div>
          )}

          {/* Box de Prévia ao Vivo do Dia de Hoje */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            draftFeedback.isSuccess
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-amber-500/5 border-amber-500/20'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Prévia do seu dia hoje:
              </span>
              <Badge
                variant={draftFeedback.isSuccess ? 'concluido' : 'secondary'}
                className="text-[10px] font-semibold"
              >
                {draftFeedback.title}
              </Badge>
            </div>

            <p className="text-xs text-foreground font-medium mb-1">
              {draftFeedback.message}
            </p>

            <div className="text-[11px] text-muted-foreground flex items-center gap-3 pt-1 border-t border-border/40">
              <span>Feitas hoje: <strong className="text-foreground">{stats.todayQuestionsCount}</strong> Qs</span>
              <span>•</span>
              <span>Simulado: <strong className="text-foreground">{stats.todayMockCompleted ? 'Concluído' : 'Nenhum'}</strong></span>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2 border-t border-border/60 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-1.5 shadow-md shadow-amber-500/20"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Flame className="h-3.5 w-3.5 fill-current" />
                Salvar Regra
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
