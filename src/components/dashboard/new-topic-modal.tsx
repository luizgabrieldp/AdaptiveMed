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
import { MedicalArea, MEDICAL_AREAS, AREA_COLORS } from '@/types/database';
import {
  calculateNextReviewInterval,
  getTodayDateString,
  addDaysToDate,
  formatDateBR,
} from '@/lib/spaced-repetition';
import { useData } from '@/lib/store/data-context';
import { PlusCircle, Sparkles, Calendar } from 'lucide-react';

interface NewTopicModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewTopicModal: React.FC<NewTopicModalProps> = ({ open, onOpenChange }) => {
  const { addTopic } = useData();
  const [area, setArea] = useState<MedicalArea>('Clínica Médica');
  const [subjectName, setSubjectName] = useState('');
  const [initialDate, setInitialDate] = useState(getTodayDateString());
  const [initialQuestions, setInitialQuestions] = useState('25');
  const [initialCorrect, setInitialCorrect] = useState('20');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questionsNum = parseInt(initialQuestions, 10) || 0;
  const correctNum = parseInt(initialCorrect, 10) || 0;
  const calculatedPct =
    questionsNum > 0 ? Math.min(100, Math.round((correctNum / questionsNum) * 1000) / 10) : 0;

  const r1Interval = calculateNextReviewInterval(calculatedPct, 1);
  const r1EstimatedDate = addDaysToDate(initialDate, r1Interval);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) return;
    if (questionsNum <= 0) return;
    if (correctNum > questionsNum) return;

    try {
      setIsSubmitting(true);
      await addTopic({
        area,
        subject_name: subjectName.trim(),
        initial_date: initialDate,
        initial_questions: questionsNum,
        initial_correct: correctNum,
      });

      setIsSubmitting(false);
      onOpenChange(false);
      // Reset form
      setSubjectName('');
      setInitialQuestions('25');
      setInitialCorrect('20');
      setInitialDate(getTodayDateString());
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
              <PlusCircle className="h-4 w-4" />
              <span>Novo Assunto Estudado</span>
            </div>
            <DialogTitle>Registrar Assunto & Agendar R1</DialogTitle>
            <DialogDescription>
              Cadastre o conteúdo estudado e seu rendimento inicial para o algoritmo calcular a 1ª revisão (R1).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            {/* Seletor de Grande Área */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Grande Área Médica
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MEDICAL_AREAS.map(item => {
                  const isSelected = area === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setArea(item)}
                      className={`text-xs px-2.5 py-2 rounded-lg border text-left font-medium transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                          : 'border-border bg-card hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-1.5"
                        style={{ backgroundColor: AREA_COLORS[item].primary }}
                      />
                      {item}
                    </button>
                  );
                })}
              </div>
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
                placeholder="Ex: Pneumonia Adquirida na Comunidade, Apendicite Aguda..."
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
                  placeholder="Ex: 25"
                  className="font-bold text-base"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Acertos
                </label>
                <Input
                  type="number"
                  min="0"
                  max={initialQuestions || '1000'}
                  required
                  value={initialCorrect}
                  onChange={e => setInitialCorrect(e.target.value)}
                  placeholder="Ex: 20"
                  className="font-bold text-base text-emerald-400"
                />
              </div>
            </div>

            {/* Card de Projeção da 1ª Revisão */}
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Aproveitamento Inicial:</span>
                <span className="font-bold text-foreground text-sm">{calculatedPct}%</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-blue-500/20">
                <span className="flex items-center gap-1 text-blue-300 font-medium">
                  <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                  1ª Revisão (R1) Programada:
                </span>
                <span className="font-bold text-blue-400">
                  +{r1Interval} dias ({formatDateBR(r1EstimatedDate)})
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !subjectName.trim() || questionsNum <= 0 || correctNum > questionsNum}
              className="gap-1.5 font-bold"
            >
              {isSubmitting ? 'Cadastrando...' : 'Cadastrar e Agendar R1'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
