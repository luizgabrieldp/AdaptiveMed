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
import {
  calculateNextReviewInterval,
  getTodayDateString,
  addDaysToDate,
  formatDateBR,
} from '@/lib/spaced-repetition';
import { useData } from '@/lib/store/data-context';
import { ManageAreasModal } from './manage-areas-modal';
import {
  PlusCircle,
  Sparkles,
  Calendar,
  Settings,
  Tag,
  X,
  Plus,
} from 'lucide-react';

interface NewTopicModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewTopicModal: React.FC<NewTopicModalProps> = ({ open, onOpenChange }) => {
  const { addTopic, areas, allTags } = useData();
  const [area, setArea] = useState<string>('');
  const [subjectName, setSubjectName] = useState('');
  const [initialDate, setInitialDate] = useState(getTodayDateString());
  const [initialQuestions, setInitialQuestions] = useState('25');
  const [initialCorrect, setInitialCorrect] = useState('20');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tags / Subáreas
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isManageAreasOpen, setIsManageAreasOpen] = useState(false);

  // Inicializa com a primeira área disponível
  useEffect(() => {
    if (areas.length > 0 && (!area || !areas.some(a => a.name === area))) {
      setArea(areas[0].name);
    }
  }, [areas, area]);

  const questionsNum = parseInt(initialQuestions, 10) || 0;
  const correctNum = parseInt(initialCorrect, 10) || 0;
  const calculatedPct =
    questionsNum > 0 ? Math.min(100, Math.round((correctNum / questionsNum) * 1000) / 10) : 0;

  const r1Interval = calculateNextReviewInterval(calculatedPct, 1);
  const r1EstimatedDate = addDaysToDate(initialDate, r1Interval);

  const handleAddTag = (tagToAdd?: string) => {
    const cleanTag = (tagToAdd || tagInput).trim();
    if (!cleanTag) return;
    if (!tags.includes(cleanTag)) {
      setTags(prev => [...prev, cleanTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) return;
    if (questionsNum <= 0) return;
    if (correctNum > questionsNum) return;

    setErrorMessage(null);

    // Se o usuário digitou uma tag/subárea mas não clicou em "+ Adicionar", inclui automaticamente
    const cleanTag = tagInput.trim();
    const finalTags = [...tags];
    if (cleanTag && !finalTags.includes(cleanTag)) {
      finalTags.push(cleanTag);
    }

    try {
      setIsSubmitting(true);
      await addTopic({
        area: area || (areas[0]?.name ?? 'Geral'),
        subject_name: subjectName.trim(),
        tags: finalTags,
        initial_date: initialDate,
        initial_questions: questionsNum,
        initial_correct: correctNum,
      });

      setIsSubmitting(false);
      onOpenChange(false);
      // Reset form
      setSubjectName('');
      setTags([]);
      setTagInput('');
      setInitialQuestions('25');
      setInitialCorrect('20');
      setInitialDate(getTodayDateString());
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar assunto no banco de dados.';
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
                <PlusCircle className="h-4 w-4" />
                <span>Novo Assunto Estudado</span>
              </div>
              <DialogTitle>Registrar Assunto & Agendar R1</DialogTitle>
              <DialogDescription>
                Cadastre o conteúdo estudado, atribua subáreas/tags e configure seu rendimento inicial.
              </DialogDescription>
            </DialogHeader>

            {errorMessage && (
              <div className="p-3 my-2 text-xs rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 font-medium">
                {errorMessage}
              </div>
            )}

            <div className="space-y-4 my-4">
              {/* Seletor de Grande Área */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Grande Área / Disciplina
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsManageAreasOpen(true)}
                    className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    <Settings className="h-3 w-3" /> Gerenciar / Criar Áreas
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {areas.map(item => {
                    const isSelected = area === item.name;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setArea(item.name)}
                        className={`text-xs px-2.5 py-2 rounded-lg border text-left font-medium transition-all truncate flex items-center ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                            : 'border-border bg-card hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full mr-2 shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subárea / Tags */}
              <div className="space-y-2 p-3 bg-muted/20 rounded-xl border border-border">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-primary" /> Subárea / Tags (Opcional)
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    Ex: Cardiologia, Pneumologia, ECG
                  </span>
                </div>

                {/* Input de tag */}
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Digite a subárea e aperte Enter..."
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="text-xs h-8 bg-background"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddTag()}
                    disabled={!tagInput.trim()}
                    className="text-xs h-8 shrink-0 font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5 mr-0.5" /> Adicionar
                  </Button>
                </div>

                {/* Tags Selecionadas */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tags.map(t => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-primary text-primary-foreground shadow-sm animate-in fade-in"
                      >
                        {t}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="hover:bg-primary-foreground/20 rounded p-0.5"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Sugestões rápidas de tags existentes */}
                {allTags.length > 0 && tags.length < allTags.length && (
                  <div className="pt-1">
                    <span className="text-[10px] text-muted-foreground block mb-1">
                      Sugestões rápidas usadas anteriormente:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {allTags
                        .filter(t => !tags.includes(t))
                        .slice(0, 5)
                        .map(suggested => (
                          <button
                            key={suggested}
                            type="button"
                            onClick={() => handleAddTag(suggested)}
                            className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-card hover:bg-muted text-muted-foreground transition-colors font-medium"
                          >
                            + {suggested}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Nome do Assunto */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Nome do Assunto
                </label>
                <Input
                  type="text"
                  required
                  value={subjectName}
                  onChange={e => setSubjectName(e.target.value)}
                  placeholder="Ex: Pneumonia Adquirida na Comunidade, Insuficiência Cardíaca..."
                  className="text-sm"
                />
              </div>

              {/* Data do Primeiro Contato */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Data do Primeiro Contato com a Matéria
                </label>
                <Input
                  type="date"
                  required
                  value={initialDate}
                  onChange={e => setInitialDate(e.target.value)}
                  className="text-sm"
                />
              </div>

              {/* Questões e Acertos */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Questões Feitas
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={initialQuestions}
                    onChange={e => setInitialQuestions(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Acertos Obtidos
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max={questionsNum || 1000}
                    required
                    value={initialCorrect}
                    onChange={e => setInitialCorrect(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Box de Previsão Adaptativa */}
              <div className="p-3.5 rounded-xl border border-border bg-card/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">Aproveitamento Inicial:</span>
                  <span
                    className={`font-black text-sm ${
                      calculatedPct >= 80
                        ? 'text-emerald-400'
                        : calculatedPct >= 65
                        ? 'text-blue-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {calculatedPct}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Previsão de R1:
                  </span>
                  <span className="font-bold text-foreground">
                    {r1Interval === 1 ? 'Amanhã (24h)' : `Em ${r1Interval} dias`} ({formatDateBR(r1EstimatedDate)})
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !subjectName.trim() || questionsNum <= 0}
                className="text-xs font-bold gap-1.5 shadow-md shadow-primary/20"
              >
                {isSubmitting ? 'Salvando...' : 'Cadastrar e Agendar R1'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Gerenciamento de Grandes Áreas */}
      <ManageAreasModal
        open={isManageAreasOpen}
        onOpenChange={setIsManageAreasOpen}
      />
    </>
  );
};
