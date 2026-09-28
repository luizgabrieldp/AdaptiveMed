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

const COMMON_INSTITUTIONS = ['USP-SP', 'ENARE', 'UNICAMP', 'SUS-SP', 'UFRJ', 'UNIFESP', 'UFMG', 'SCMRP'];

export const NewInstitutionModal: React.FC<NewInstitutionModalProps> = ({
  open,
  onOpenChange,
  defaultInstitution,
}) => {
  const { addInstitutionExam } = useData();
  const [institution, setInstitution] = useState(defaultInstitution || 'USP-SP');
  const [customInst, setCustomInst] = useState('');
  const [examYear, setExamYear] = useState('2025');
  const [scorePercentage, setScorePercentage] = useState('80.0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalInstName = institution === 'OUTRA' ? customInst.trim() : institution;
    const yearNum = parseInt(examYear, 10);
    const scoreNum = parseFloat(scorePercentage);

    if (!finalInstName || isNaN(yearNum) || isNaN(scoreNum)) return;

    try {
      setIsSubmitting(true);
      await addInstitutionExam({
        institution_name: finalInstName.toUpperCase(),
        exam_year: yearNum,
        score_percentage: scoreNum,
      });

      setIsSubmitting(false);
      onOpenChange(false);
      setCustomInst('');
      setScorePercentage('80.0');
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
                Instituição / Banca
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {COMMON_INSTITUTIONS.map(inst => (
                  <button
                    key={inst}
                    type="button"
                    onClick={() => setInstitution(inst)}
                    className={`text-xs px-2.5 py-1 rounded-md border font-semibold transition-all ${
                      institution === inst
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {inst}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setInstitution('OUTRA')}
                  className={`text-xs px-2.5 py-1 rounded-md border font-semibold transition-all ${
                    institution === 'OUTRA'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Outra...
                </button>
              </div>

              {institution === 'OUTRA' && (
                <Input
                  type="text"
                  required
                  placeholder="Digite a sigla da banca (ex: AMP, AMRIGS, PSU-MG)"
                  value={customInst}
                  onChange={e => setCustomInst(e.target.value)}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Ano da Prova
                </label>
                <Input
                  type="number"
                  min="2010"
                  max="2030"
                  required
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
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  value={scorePercentage}
                  onChange={e => setScorePercentage(e.target.value)}
                  className="font-bold text-base text-emerald-400"
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
            <Button type="submit" disabled={isSubmitting} className="font-bold">
              {isSubmitting ? 'Salvando...' : 'Salvar Prova'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
