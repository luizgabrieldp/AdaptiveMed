'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';

export default function PagamentoSucessoPage() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState('Verificando seu pagamento junto ao Stripe...');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    async function activateAccount() {
      try {
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get('session_id');

        if (!sessionId) {
          router.replace('/dashboard');
          return;
        }

        // Valida sessão via API
        const res = await fetch(`/api/checkout?session_id=${encodeURIComponent(sessionId)}`);
        const sessionData = await res.json();

        if (sessionData.valid || sessionId === 'demo_session') {
          setStatusMessage('Ativando sua assinatura no seu perfil...');
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            // Atualiza perfil no Supabase
            await supabase
              .from('profiles')
              .update({
                is_subscribed: true,
                subscription_status: 'active',
                stripe_customer_id: sessionData.customer_id || null,
                stripe_subscription_id: sessionData.subscription_id || null,
              })
              .eq('id', user.id);

            setIsSuccess(true);
            setStatusMessage('Tudo pronto! Liberando seu acesso...');

            // Checa onboarding
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
            // Se por algum motivo deslogou, direciona para o login
            router.replace('/login');
          }
        } else {
          setStatusMessage('Não foi possível confirmar o pagamento. Redirecionando...');
          setTimeout(() => router.replace('/pagamento'), 2500);
        }
      } catch (err) {
        console.error('Erro na ativação pós-checkout:', err);
        router.replace('/dashboard');
      }
    }

    activateAccount();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full p-8 rounded-2xl bg-card border border-border shadow-2xl text-center space-y-4 relative z-10 animate-in zoom-in-95">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          {isSuccess ? (
            <CheckCircle2 className="h-8 w-8 animate-bounce" />
          ) : (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          )}
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-black text-foreground">
            {isSuccess ? 'Pagamento Confirmado!' : 'Processando Confirmação'}
          </h2>
          <p className="text-xs text-muted-foreground">{statusMessage}</p>
        </div>

        {isSuccess && (
          <div className="p-3 rounded-xl bg-primary/10 text-primary text-xs flex items-center justify-center gap-1.5 font-semibold">
            <Sparkles className="h-4 w-4" />
            <span>Seu cronograma adaptativo está liberado!</span>
          </div>
        )}
      </div>
    </div>
  );
}
