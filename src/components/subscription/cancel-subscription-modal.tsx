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
import { AlertTriangle, ShieldCheck, HeartHandshake, Loader2, CheckCircle2 } from 'lucide-react';

interface CancelSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPeriodEnd?: string | null;
  onSuccess: (periodEnd?: string) => void;
}

const CANCELLATION_REASONS = [
  'Já fui aprovado(a) na Residência / Concurso 🎉',
  'Dificuldades financeiras no momento',
  'Pouco tempo livre para estudar agora',
  'Vou fazer uma pausa temporária nos estudos',
  'Dúvidas sobre o funcionamento da plataforma',
  'Outro motivo',
];

export const CancelSubscriptionModal: React.FC<CancelSubscriptionModalProps> = ({
  open,
  onOpenChange,
  currentPeriodEnd,
  onSuccess,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customFeedback, setCustomFeedback] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formattedDate = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString('pt-BR')
    : 'o término do seu ciclo atual';

  const handleConfirmCancel = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const finalReason =
        selectedReason === 'Outro motivo' && customFeedback.trim()
          ? `Outro: ${customFeedback.trim()}`
          : selectedReason || 'Não informado';

      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          reason: finalReason,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar cancelamento');
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onOpenChange(false);
        onSuccess(data.periodEnd || formattedDate);
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Não foi possível cancelar no momento. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Cancelamento Confirmado</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Sua renovação automática foi cancelada. Seu acesso continuará liberado até{' '}
              <strong className="text-foreground">{formattedDate}</strong> sem novas cobranças.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader className="space-y-1">
              <div className="flex items-center gap-2 text-rose-400 mb-1">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Cancelamento de Assinatura</span>
              </div>
              <DialogTitle className="text-lg font-bold">
                Deseja realmente cancelar sua renovação?
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Sentiremos sua falta! Veja como funcionará o encerramento do seu plano:
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Box explicativo de garantia de acesso */}
              <div className="p-3.5 rounded-xl bg-card border border-border space-y-2 text-xs">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Cobranças futuras interrompidas:</strong> Nenhuma nova cobrança será feita no seu cartão de crédito.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <HeartHandshake className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Acesso garantido até {formattedDate}:</strong> Você poderá continuar estudando e usando todas as funções normalmente até essa data.
                  </p>
                </div>
              </div>

              {/* Pergunta de Motivo (Feedback Opcional) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Poderia nos contar o motivo? <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {CANCELLATION_REASONS.map(reason => (
                    <label
                      key={reason}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        selectedReason === reason
                          ? 'border-primary bg-primary/10 text-foreground font-medium'
                          : 'border-border bg-card/50 text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cancellationReason"
                        value={reason}
                        checked={selectedReason === reason}
                        onChange={() => setSelectedReason(reason)}
                        className="h-3.5 w-3.5 text-primary focus:ring-primary border-border"
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>

                {selectedReason === 'Outro motivo' && (
                  <textarea
                    value={customFeedback}
                    onChange={e => setCustomFeedback(e.target.value)}
                    placeholder="Nos conte brevemente o que poderíamos melhorar..."
                    rows={2}
                    className="w-full mt-2 rounded-lg border border-border bg-card p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                )}
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs">
                  {errorMessage}
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="w-full sm:w-auto text-xs"
              >
                Manter Minha Assinatura
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmCancel}
                disabled={isLoading}
                className="w-full sm:w-auto text-xs font-bold gap-1.5"
              >
                {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Confirmar Cancelamento</span>
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
