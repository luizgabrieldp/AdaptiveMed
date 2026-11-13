'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PagamentoSucessoPage() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState('Verificando seu pagamento junto ao Stripe...');
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    async function activateAccount() {
      try {
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get('session_id');

        if (!sessionId || sessionId === 'demo_session') {
          setHasError(true);
          setStatusMessage('Sessão de pagamento inválida ou expirada.');
          setTimeout(() => router.replace('/pagamento'), 2000);
          return;
        }

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace('/login?redirectedFrom=/pagamento');
          return;
        }

        // Valida sessão e ativa assinatura exclusivamente no servidor
        const res = await fetch(`/api/checkout?session_id=${encodeURIComponent(sessionId)}`);
        const sessionData = await res.json();

        if (res.ok && sessionData.valid) {
          setIsSuccess(true);
          setStatusMessage('Pagamento confirmado! Liberando seu acesso...');

          const { data: prof } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single();

          setTimeout(() => {
            if (prof && prof.onboarding_completed) {
              router.replace('/dashboard');
            } else {
              router.replace('/onboarding');
            }
          }, 1500);
        } else {
          setHasError(true);
          setStatusMessage(
            sessionData.error || 'Não foi possível confirmar o pagamento. Redirecionando...'
          );
          setTimeout(() => router.replace('/pagamento'), 2500);
        }
      } catch (err) {
        console.error('Erro na ativação pós-checkout:', err);
        setHasError(true);
        setStatusMessage('Erro ao confirmar pagamento. Redirecionando para a página de planos...');
        setTimeout(() => router.replace('/pagamento'), 2500);
      }
    }

    activateAccount();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full p-8 rounded-2xl bg-card border border-border shadow-xl text-center space-y-4">
        <div
          className={`mx-auto w-14 h-14 rounded-2xl border flex items-center justify-center ${
            hasError
              ? 'bg-destructive/10 border-destructive/30 text-destructive'
              : isSuccess
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500'
              : 'bg-primary/10 border-primary/20 text-primary'
          }`}
        >
          {hasError ? (
            <AlertCircle className="h-7 w-7" />
          ) : isSuccess ? (
            <CheckCircle2 className="h-7 w-7" />
          ) : (
            <Loader2 className="h-7 w-7 animate-spin" />
          )}
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">
            {hasError
              ? 'Confirmação Pendente'
              : isSuccess
              ? 'Pagamento Confirmado'
              : 'Processando Confirmação'}
          </h2>
          <p className="text-xs text-muted-foreground">{statusMessage}</p>
        </div>

        {hasError && (
          <Button variant="outline" size="sm" onClick={() => router.replace('/pagamento')}>
            Voltar para Planos
          </Button>
        )}
      </div>
    </div>
  );
}
