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
import { GraduationCap } from 'lucide-react';

interface NewMockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewMockModal: React.FC<NewMockModalProps> = ({ open, onOpenChange }) => {
  const { addMockExam } = useData();
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState(getTodayDateString());
  const [totalQuestions, setTotalQuestions] = useState('100');
  const [correctAnswers, setCorrectAnswers] = useState('75');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalNum = parseInt(totalQuestions, 10) || 0;
  const correctNum = parseInt(correctAnswers, 10) || 0;
  const calculatedPct =
    totalNum > 0 ? Math.min(100, Math.round((correctNum / totalNum) * 1000) / 10) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName.trim() || totalNum <= 0 || correctNum > totalNum) return;

    try {
      setIsSubmitting(true);
      await addMockExam({
        exam_name: examName.trim(),
        exam_date: examDate,
        total_questions: totalNum,
        correct_answers: correctNum,
      });

      setIsSubmitting(false);
      onOpenChange(false);
      setExamName('');
      setTotalQuestions('100');
      setCorrectAnswers('75');
      setExamDate(getTodayDateString());
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
              <GraduationCap className="h-4 w-4" />
              <span>Simulado Geral</span>
            </div>
            <DialogTitle>Registrar Simulado Geral</DialogTitle>
            <DialogDescription>
              Lance o resultado do seu simulado com total de questões e gabarito conferido.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Nome do Simulado
              </label>
              <Input
                type="text"
                required
                placeholder="Ex: Simulado Geral Medcurso 02, Simulado Nacional ENARE..."
                value={examName}
                onChange={e => setExamName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Data de Realização
              </label>
              <Input
                type="date"
                required
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Total de Questões
                </label>
                <Input
                  type="number"
                  min="1"
                  max="300"
                  required
                  value={totalQuestions}
                  onChange={e => setTotalQuestions(e.target.value)}
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
                  max={totalQuestions || '300'}
                  required
                  value={correctAnswers}
                  onChange={e => setCorrectAnswers(e.target.value)}
                  className="font-bold text-base text-emerald-400"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Aproveitamento Final:</span>
              <span className="font-extrabold text-base text-primary">
                {calculatedPct}%
              </span>
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
              disabled={isSubmitting || !examName.trim() || totalNum <= 0 || correctNum > totalNum}
              className="font-bold"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Simulado'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
