'use client';

import React, { useState } from 'react';
import { ERROR_LOG_CAUSES, ErrorLogCause } from '@/types/database';
import {
  QuickErrorLogState,
} from '@/lib/focus-timer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookX, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

interface QuickErrorLogPrefillProps {
  value: QuickErrorLogState;
  onChange: React.Dispatch<React.SetStateAction<QuickErrorLogState>>;
  defaultExpanded?: boolean;
}

/**
 * Bloco compacto de pré-registro no Caderno de Erros para os modais de validação R0/R1..R8.
 */
export const QuickErrorLogPrefill: React.FC<QuickErrorLogPrefillProps> = ({
  value,
  onChange,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded || value.drafts.length > 0);

  const handleAddDraft = () => {
    const summary = value.pendingSummary.trim();
    if (!summary) return;
    onChange(prev => ({
      ...prev,
      drafts: [
        ...prev.drafts,
        {
          localId: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          cause: prev.pendingCause,
          concept_summary: summary,
          question_ref: prev.pendingRef.trim(),
        },
      ],
      pendingSummary: '',
      pendingRef: '',
    }));
  };

  const handleRemoveDraft = (localId: string) => {
    onChange(prev => ({
      ...prev,
      drafts: prev.drafts.filter(d => d.localId !== localId),
    }));
  };

  const totalCount = value.drafts.length + (value.pendingSummary.trim() ? 1 : 0);

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-2.5">
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
            <BookX className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
              Pré-registro no Caderno de Erros
              <span className="text-[10px] font-medium text-muted-foreground">(opcional)</span>
              {totalCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold">
                  {totalCount}
                </span>
              )}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              Salva direto no Caderno de Erros para você detalhar depois.
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="space-y-2.5 pt-1 border-t border-amber-500/20">
          {value.drafts.length > 0 && (
            <div className="space-y-1.5">
              {value.drafts.map(draft => (
                <div
                  key={draft.localId}
                  className="flex items-start justify-between gap-2 p-2 rounded-lg bg-background/80 border border-border text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">
                        {draft.cause}
                      </span>
                      {draft.question_ref && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {draft.question_ref}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-foreground mt-1 break-words">
                      {draft.concept_summary}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDraft(draft.localId)}
                    className="p-1 text-muted-foreground hover:text-rose-500 transition-colors shrink-0"
                    title="Remover rascunho"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-muted-foreground">
                Causa do erro
              </label>
              <select
                value={value.pendingCause}
                onChange={e =>
                  onChange(prev => ({
                    ...prev,
                    pendingCause: e.target.value as ErrorLogCause,
                  }))
                }
                className="w-full h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground"
              >
                {ERROR_LOG_CAUSES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-muted-foreground">
                Ref. questão (opcional)
              </label>
              <Input
                type="text"
                placeholder="Ex: Q42 / ENARE 2024"
                value={value.pendingRef}
                onChange={e =>
                  onChange(prev => ({ ...prev, pendingRef: e.target.value }))
                }
                className="h-8 text-xs bg-background"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-muted-foreground">
              Resumo rápido do erro / conceito que faltou
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Ex: Conduta em acidente botrópico grave (12 ampolas)..."
                value={value.pendingSummary}
                onChange={e =>
                  onChange(prev => ({ ...prev, pendingSummary: e.target.value }))
                }
                onKeyDown={e => {
                  if (e.key === 'Enter' && value.pendingSummary.trim()) {
                    e.preventDefault();
                    handleAddDraft();
                  }
                }}
                className="h-8 text-xs bg-background flex-1"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddDraft}
                disabled={!value.pendingSummary.trim()}
                className="h-8 px-2.5 text-xs font-bold gap-1 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" /> Add erro
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Ao salvar este estudo, o pré-registro vai direto para a página <strong>Caderno de Erros</strong> (mesmo sem clicar em &ldquo;Add erro&rdquo;).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
