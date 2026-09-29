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
import { Building2 } from 'lucide-react';

interface NewInstitutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultInstitution?: string;
}

export const NewInstitutionModal: React.FC<NewInstitutionModalProps> = ({
  open,
  onOpenChange,
  defaultInstitution,
}) => {
  const { addInstitutionExam } = useData();
  const [institution, setInstitution] = useState(defaultInstitution || '');
  const [examYear, setExamYear] = useState('2025');
  const [scorePercentage, setScorePercentage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (open) {
      if (defaultInstitution) {
        setInstitution(defaultInstitution);
      }
      setScorePercentage('');
    }
  }, [defaultInstitution, open]);

  const scoreNum = parseFloat(scorePercentage.replace(',', '.'));
  const isScoreValid = scorePercentage !== '' && !isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalInstName = institution.trim().toUpperCase();
    const cleanYear = examYear.trim();

    if (!finalInstName || !cleanYear || !isScoreValid) return;

    try {
      setIsSubmitting(true);
      await addInstitutionExam({
        institution_name: finalInstName,
        exam_year: cleanYear,
        score_percentage: scoreNum,
      });

      setIsSubmitting(false);
      onOpenChange(false);
      if (!defaultInstitution) setInstitution('');
      setScorePercentage('');
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    institution.trim().length > 0 &&
    examYear.trim().length > 0 &&
    isScoreValid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
              <Building2 className="h-4 w-4" />
              <span>Prova na Íntegra por Instituição</span>
            </div>
            <DialogTitle>Registrar Nota de Prova de Banca</DialogTitle>
            <DialogDescription>
              Cadastre seu rendimento em provas na íntegra de bancas examinadoras específicas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Instituição / Banca Examinadora
              </label>
              <Input
                type="text"
                required
                placeholder="Ex: SURCE, UFRN, SES-PE, ENARE, USP-SP..."
                value={institution}
                onChange={e => setInstitution(e.target.value)}
                className="font-semibold text-sm"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">
                Digite a sigla ou nome da banca examinadora desejada.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Ano ou Semestre da Prova
                </label>
                <Input
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="Ex: 2024, 24.1, 24.2..."
                  value={examYear}
                  onChange={e => setExamYear(e.target.value)}
                  className="font-bold text-base"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Nota / Acerto (%)
                </label>
                <Input
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="Ex: 80.0"
                  value={scorePercentage}
                  onChange={e => setScorePercentage(e.target.value)}
                  className="font-bold text-base text-emerald-400 placeholder:text-muted-foreground/35"
                />
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
            <Button type="submit" disabled={isSubmitting || !isFormValid} className="font-bold">
              {isSubmitting ? 'Salvando...' : 'Salvar Prova'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

