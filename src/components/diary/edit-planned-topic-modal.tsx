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
import { getTodayDateString } from '@/lib/spaced-repetition';
import { Edit3, Check, Tag } from 'lucide-react';

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
  const { areas, updateTopic } = useData();

  const [area, setArea] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [hasSpecificDate, setHasSpecificDate] = useState(false);
  const [plannedDate, setPlannedDate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (topic && open) {
      setArea(topic.area || areas[0]?.name || 'Clínica Médica');
      setSubjectName(topic.subject_name || '');
      const hasDate = Boolean(topic.planned_date);
      setHasSpecificDate(hasDate);
      setPlannedDate(topic.planned_date || getTodayDateString());
      setTagInput(topic.tags ? topic.tags.join(', ') : '');
      setNotes(topic.notes || '');
    }
  }, [topic, open, areas]);

  if (!topic) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) return;

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
        initial_date: targetPlannedDate || topic.initial_date,
        notes: notes.trim() || undefined,
      });

      onOpenChange(false);
    } catch (err) {
      console.error('Erro ao editar assunto planejado:', err);
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
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Editar Assunto da Semana</DialogTitle>
              <DialogDescription className="text-xs">
                Modifique os dados do estudo programado, dia previsto ou anotações.
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

          {/* Data Prevista */}
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

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || !subjectName.trim()}
              className="w-full sm:w-auto font-bold text-xs gap-1.5 shadow-md shadow-primary/20"
            >
              <Check className="h-4 w-4" />
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
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
