'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Stethoscope,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  LogOut,
  Loader2,
  Tag,
  Flame,
} from 'lucide-react';

export default function PagamentoPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/login?redirectedFrom=/pagamento');
        return;
      }
      setUser(user);

      // Busca perfil
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data: prof }) => {
          setProfile(prof);
          // Se já tiver pago, vai direto para o dashboard
          if (prof?.is_subscribed || prof?.subscription_status === 'active') {
            router.replace('/dashboard');
          } else {
            setLoadingUser(false);
          }
        });
    });
  }, [router]);

  const handleCheckout = async (planId: 'monthly' | 'annual') => {
    try {
      setCheckoutLoading(planId);
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          email: user?.email,
          userId: user?.id,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Erro ao iniciar checkout');
        setCheckoutLoading(null);
      }
    } catch (err: any) {
      alert('Erro inesperado ao conectar com Stripe');
      setCheckoutLoading(null);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-xs">Carregando seus dados de acesso...</p>
        </div>
      </div>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Doutor(a)';

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col justify-between">
      {/* Luzes decorativas de fundo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Topo / Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 shadow-md shadow-blue-500/20">
            <Stethoscope className="h-5 w-5 text-white stroke-[2.2]" />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
            AdaptiveMed
          </span>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="hidden sm:inline text-muted-foreground">
            Logado como <strong className="text-foreground">{user?.email}</strong>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sair</span>
          </Button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8 flex-1 w-full relative z-10">
        {/* Banner de Aviso: Falta finalizar pagamento */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold animate-in fade-in">
            <Lock className="h-3.5 w-3.5" />
            <span>Falta você finalizar o pagamento</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Olá, {firstName}! Desbloqueie seu acesso agora.
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Sua conta está criada e segura. Escolha o plano ideal abaixo para liberar seu cronograma de repetição espaçada, simulados e análise de desempenho.
          </p>
        </div>

        {/* Destaque de Cupom */}
        <div className="max-w-md mx-auto p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-center text-primary flex items-center justify-center gap-2">
          <Tag className="h-4 w-4 shrink-0" />
          <span>
            Possui cupom de desconto ou parceria de 100%? Você poderá digitá-lo no checkout a seguir!
          </span>
        </div>

        {/* Grid de Planos */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto items-stretch">
          {/* PLANO MENSAL */}
          <Card
            className={`border transition-all flex flex-col justify-between ${
              selectedPlan === 'monthly'
                ? 'border-primary ring-2 ring-primary/30 bg-card shadow-lg'
                : 'border-border bg-card/60 hover:border-border/80'
            }`}
            onClick={() => setSelectedPlan('monthly')}
          >
            <div>
              <CardHeader className="space-y-1 pb-3">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Flexibilidade
                </div>
                <CardTitle className="text-xl font-bold">Plano Mensal</CardTitle>
                <CardDescription className="text-xs">
                  Acesso completo mês a mês. Cancele quando quiser.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-foreground">R$ 7,99</span>
                  <span className="text-xs text-muted-foreground">/mês</span>
                </div>

                <ul className="space-y-2 text-xs text-muted-foreground pt-2 border-t border-border">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Algoritmo de repetição espaçada adaptativa</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Todas as Grandes Áreas e bancas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Sem fidelidade (cancele a qualquer momento)</span>
                  </li>
                </ul>
              </CardContent>
            </div>

            <CardFooter className="pt-3">
              <Button
                onClick={() => handleCheckout('monthly')}
                disabled={Boolean(checkoutLoading)}
                variant={selectedPlan === 'monthly' ? 'default' : 'outline'}
                className="w-full text-xs font-bold h-10 gap-1.5"
              >
                {checkoutLoading === 'monthly' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Assinar Mensal (R$ 7,99)</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* PLANO ANUAL (DESTAQUE) */}
          <Card
            className={`border-2 relative flex flex-col justify-between scale-[1.02] shadow-xl ${
              selectedPlan === 'annual'
                ? 'border-primary ring-2 ring-primary/40 bg-card'
                : 'border-primary/60 bg-card'
            }`}
            onClick={() => setSelectedPlan('annual')}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-extrabold text-[11px] px-3 py-0.5 shadow-md">
                🔥 MAIS ESCOLHIDO (ECONOMIZE 27%)
              </Badge>
            </div>

            <div>
              <CardHeader className="space-y-1 pt-6 pb-3">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 fill-emerald-400" /> Ano Completo de Estudos
                </div>
                <CardTitle className="text-xl font-black">Plano Anual VIP</CardTitle>
                <CardDescription className="text-xs">
                  Cobertura durante todo o seu ano de preparação.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-emerald-400">R$ 69,90</span>
                  <span className="text-xs text-muted-foreground">/ano</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Equivalente a apenas <strong className="text-foreground">R$ 5,82/mês</strong>.
                </p>

                <ul className="space-y-2 text-xs text-muted-foreground pt-2 border-t border-border">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Todas as funções do plano mensal</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Acesso ininterrupto por 12 meses</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Economia máxima garantida</span>
                  </li>
                </ul>
              </CardContent>
            </div>

            <CardFooter className="pt-3">
              <Button
                onClick={() => handleCheckout('annual')}
                disabled={Boolean(checkoutLoading)}
                className="w-full text-xs font-bold h-10 gap-1.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white shadow-md shadow-blue-500/20"
              >
                {checkoutLoading === 'annual' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Garantir Acesso Anual (R$ 69,90)</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Garantia */}
        <div className="text-center pt-2 text-xs text-muted-foreground flex items-center justify-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Pagamento 100% seguro processado pelo Stripe com criptografia de ponta a ponta.</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} AdaptiveMed • Todos os direitos reservados.
      </footer>
    </div>
  );
}
