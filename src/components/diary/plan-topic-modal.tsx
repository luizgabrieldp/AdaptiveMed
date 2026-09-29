'use client';

import React, { useState } from 'react';
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
import { getTodayDateString } from '@/lib/spaced-repetition';
import { CalendarPlus, Check, Target, Tag, Sparkles } from 'lucide-react';

interface PlanTopicModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
  defaultArea?: string;
  defaultSubject?: string;
}

export const PlanTopicModal: React.FC<PlanTopicModalProps> = ({
  open,
  onOpenChange,
  defaultDate,
  defaultArea,
  defaultSubject,
}) => {
  const { areas, addPlannedTopic, prevalentTopics, topics } = useData();

  const [area, setArea] = useState(defaultArea || areas[0]?.name || 'Clínica Médica');
  const [subjectName, setSubjectName] = useState(defaultSubject || '');
  const [hasSpecificDate, setHasSpecificDate] = useState(Boolean(defaultDate));
  const [plannedDate, setPlannedDate] = useState(defaultDate || getTodayDateString());
  const [tagInput, setTagInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sugestões de assuntos prevalentes para preenchimento rápido (somente os ainda não estudados)
  const suggestedTopics = React.useMemo(() => {
    const studiedSet = new Set(
      topics
        .filter(t => !t.is_planned)
        .map(t => t.subject_name.trim().toLowerCase())
    );
    return prevalentTopics
      .filter(p => p.area === area && !studiedSet.has(p.subject_name.trim().toLowerCase()))
      .slice(0, 5);
  }, [prevalentTopics, topics, area]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) return;

    try {
      setIsSubmitting(true);
      const tags = tagInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      await addPlannedTopic({
        area,
        subject_name: subjectName.trim(),
        planned_date: hasSpecificDate && plannedDate ? plannedDate : undefined,
        tags,
        is_weekly_goal: true,
        notes: notes.trim() || undefined,
      });

      // Limpa e fecha
      setSubjectName('');
      setTagInput('');
      setNotes('');
      onOpenChange(false);
    } catch (err) {
      console.error('Erro ao programar estudo:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-primary/15 text-primary">
              <CalendarPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Programar Estudo</DialogTitle>
              <DialogDescription className="text-xs">
                Planeje um novo assunto para estudar previamente. Ao concluir o estudo, registre suas questões para ativar os ciclos adaptativos.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

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
              placeholder="Ex: Doença do Refluxo Gastroesofágico (DRGE)"
              value={subjectName}
              onChange={e => setSubjectName(e.target.value)}
              className="text-xs"
            />

            {/* Sugestões de temas frequentes */}
            {suggestedTopics.length > 0 && (
              <div className="pt-1 flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Sparkles className="h-2.5 w-2.5 text-amber-400" /> Sugestões da Banca:
                </span>
                {suggestedTopics.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSubjectName(p.subject_name)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-muted/80 hover:bg-primary/20 hover:text-primary transition-colors border border-border"
                  >
                    {p.subject_name.slice(0, 24)}...
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Subáreas / Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Tag className="h-3 w-3" /> Subáreas / Tags (opcional)
            </label>
            <Input
              type="text"
              placeholder="Ex: Gastro, Esofagite"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Data Prevista (Opcional) */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <label htmlFor="has-date-toggle" className="text-xs font-semibold text-foreground flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="has-date-toggle"
                  checked={hasSpecificDate}
                  onChange={e => setHasSpecificDate(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span>Definir dia específico nesta semana (opcional)</span>
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
                O tema entrará na lista de <strong className="text-foreground">Assuntos da Semana</strong>. Você poderá arrastá-lo para a coluna de qualquer dia ou clicar em registrar quando estudá-lo.
              </p>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || !subjectName.trim()}
              className="w-full sm:w-auto font-bold text-xs gap-1.5 shadow-md shadow-primary/20"
            >
              <Check className="h-4 w-4" />
              {isSubmitting ? 'Agendando...' : 'Programar Estudo'}
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
