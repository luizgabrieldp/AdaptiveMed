'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useData } from '@/lib/store/data-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { PerspectiveDashboardMockup } from '@/components/landing/perspective-dashboard-mockup';
import { FsrsLiveSimulator } from '@/components/landing/fsrs-live-simulator';
import { InteractiveDemoShowcase } from '@/components/landing/interactive-demo-showcase';
import { AnimatedBeamBento } from '@/components/landing/animated-beam-bento';
import {
  Stethoscope,
  Sparkles,
  ArrowRight,
  Check,
  ShieldCheck,
  BrainCircuit,
  Zap,
  ChevronDown,
  Play,
  Layers,
  CreditCard,
  HelpCircle,
} from 'lucide-react';

const HeroNeuralCanvas = dynamic(
  () => import('@/components/landing/hero-neural-canvas').then(mod => mod.HeroNeuralCanvas),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.16),transparent_65%)]"
      />
    ),
  }
);

const FAQ_ITEMS = [
  {
    q: 'O AdaptiveMed substitui meu cursinho (Medcurso, Estratégia, Sanar, Medcel)?',
    a: 'Não — ele potencializa o seu cursinho. Você continua assistindo às aulas e resolvendo questões na sua plataforma favorita e registra seus acertos em 10 segundos no AdaptiveMed. O motor FSRS-6 calcula exatamente quando e quantas questões revisar de cada assunto até a prova.',
  },
  {
    q: 'Como funciona o algoritmo FSRS-6 comparado a revisões fixas (1-7-15-30)?',
    a: 'Cronogramas fixos tratam um tema em que você tirou 95% igual a um tema em que tirou 52%. O FSRS-6 (Free Spaced Repetition Scheduler) mede dificuldade e estabilidade da sua memória a cada revisão R0..R8 e ajusta intervalos e volume de questões dinamicamente até a data da sua prova.',
  },
  {
    q: 'E se eu atrasar revisões em uma semana puxada de internato ou plantão?',
    a: 'Você nunca fica refém de uma bola de neve. Na Grade Semanal, o botão "Rebalancear Atrasados" redistribui automaticamente todas as revisões pendentes para os próximos dias disponíveis respeitando sua cota máxima diária.',
  },
  {
    q: 'Consigo levar meu cronograma para o Google Calendar, Apple Calendar ou planilhas?',
    a: 'Sim. Em 1 clique você exporta todas as próximas revisões para arquivos .ics (compatível com Google Calendar, Apple Calendar e Outlook) e também baixa relatórios completos de revisões e simulados em .csv.',
  },
  {
    q: 'Posso cancelar quando quiser? Há fidelidade?',
    a: 'Sem fidelidade ou multa. Tanto no Plano Mensal (R$ 7,99/mês) quanto no Plano Anual (R$ 69,90/ano), você gerencia ou cancela sua assinatura direto na página Minha Conta pelo portal seguro da Stripe.',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { user, profile, signOut } = useData();
  const [redirectNotice, setRedirectNotice] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const hasPaid = Boolean(profile?.is_subscribed || profile?.subscription_status === 'active');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const reason = params.get('reason');
      if (reason === 'no_account') {
        setRedirectNotice(
          'Não encontramos uma conta cadastrada com este e-mail. Escolha seu plano abaixo para liberar seu acesso imediato.'
        );
        document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
      } else if (reason === 'inactive_account') {
        setRedirectNotice(
          'Sua conta ainda não possui assinatura ativa. Escolha um dos planos abaixo para liberar seu acesso.'
        );
        document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  const handleCheckout = (planId: 'monthly' | 'annual') => {
    if (user) {
      router.push(`/pagamento?plan=${planId}`);
    } else {
      router.push(`/signup?plan=${planId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/25 selection:text-primary overflow-x-hidden">
      {/* NAVBAR FIXO */}
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Stethoscope className="h-5 w-5 text-white stroke-[2.2]" />
            </div>
            <span className="text-lg sm:text-xl font-black tracking-tight">AdaptiveMed</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-muted-foreground">
            <a href="#simulador" className="hover:text-foreground transition-colors">
              Simulador FSRS-6
            </a>
            <a href="#vitrine" className="hover:text-foreground transition-colors">
              Demo ao Vivo
            </a>
            <a href="#arquitetura" className="hover:text-foreground transition-colors">
              Como Funciona
            </a>
            <a href="#planos" className="hover:text-foreground transition-colors">
              Planos & Preços
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              Dúvidas
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <ThemeToggle />

            {user ? (
              hasPaid ? (
                <>
                  <Button
                    onClick={() => router.push('/dashboard')}
                    size="sm"
                    className="gap-1.5 font-bold text-xs shadow-md shadow-primary/20"
                  >
                    Meu Painel <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut()}
                    className="text-xs text-muted-foreground hover:text-foreground px-2.5"
                  >
                    Sair
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => router.push('/pagamento')}
                    size="sm"
                    className="gap-1.5 font-black text-xs shadow-md bg-amber-500 hover:bg-amber-600 text-slate-950"
                  >
                    Finalizar Assinatura <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut()}
                    className="text-xs text-muted-foreground hover:text-foreground px-2.5"
                  >
                    Sair
                  </Button>
                </>
              )
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="font-bold text-xs text-muted-foreground hover:text-foreground"
                >
                  <Link href="/login">Área do Aluno</Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="gap-1.5 font-bold text-xs shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <a href="#planos">Começar Agora</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* BANNER DE AVISO DE CONTA / REDIRECIONAMENTO */}
      {redirectNotice && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 py-3 px-4 text-center text-xs font-semibold text-amber-800 dark:text-amber-300 flex flex-wrap items-center justify-center gap-2 animate-fade-in">
          <span>{redirectNotice}</span>
          <a
            href="#planos"
            className="underline font-bold hover:opacity-80 inline-flex items-center gap-0.5 ml-1"
          >
            Ver Planos <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* BANNER PARA USUÁRIO AUTENTICADO SEM ASSINATURA */}
      {user && !hasPaid && (
        <div className="bg-amber-500/10 border-b border-amber-500/25 py-2.5 px-4 text-center text-xs font-medium text-amber-800 dark:text-amber-200 flex flex-wrap items-center justify-center gap-3 animate-fade-in">
          <span>
            Conectado como <strong className="font-bold">{user.email}</strong>. Ative um plano abaixo para liberar seu cronograma.
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push('/pagamento')}
            className="h-7 text-[11px] font-bold border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20"
          >
            Ir para Pagamento
          </Button>
        </div>
      )}

      {/* SEÇÃO 1: HERO 3D WEBGL CINEMATOGRÁFICA */}
      <section className="relative pt-14 pb-16 sm:pt-20 sm:pb-24 border-b border-border/60 overflow-hidden">
        {/* Fundo WebGL 3D reativo */}
        <HeroNeuralCanvas />

        {/* Gradiente sutil para legibilidade do texto sobre a malha 3D */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none bg-gradient-to-b from-background/55 via-background/35 to-background"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/35 bg-primary/10 text-primary text-xs font-bold tracking-wide backdrop-blur-md animate-fade-in">
              <BrainCircuit className="h-3.5 w-3.5" />
              <span>Motor Cognitivo FSRS-6 • Residência Médica & Revalida</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-foreground">
              Transforme seu estudo em{' '}
              <span className="bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                memória de longo prazo
              </span>{' '}
              sem acumular revisões.
            </h1>

            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              O AdaptiveMed calcula o dia exato de cada revisão (R1 a R8), ajusta sua bateria de questões pelo rendimento real, organiza seu Caderno de Erros e rebalanceia atrasos em 1 clique.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                size="lg"
                asChild
                className="w-full sm:w-auto h-12 px-7 text-sm font-extrabold gap-2 shadow-xl shadow-primary/25 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
              >
                <a href="#planos">
                  <span>Começar Agora — R$ 7,99/mês</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>

              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full sm:w-auto h-12 px-6 text-sm font-bold gap-2 bg-card/75 backdrop-blur-md border-border hover:bg-muted/80"
              >
                <a href="#vitrine">
                  <Play className="h-4 w-4 text-emerald-500 fill-emerald-500/20" />
                  <span>Testar Plataforma ao Vivo</span>
                </a>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" /> Algoritmo FSRS-6 real
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" /> Rebalanceamento 1-clique
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" /> Caderno de Erros & Heatmap 365d
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" /> Exportação .csv e .ics
              </span>
            </div>
          </div>

          {/* Mockup 3D em Perspectiva inclinada no Scroll */}
          <PerspectiveDashboardMockup />
        </div>
      </section>

      {/* SEÇÃO 2: SIMULADOR INTERATIVO REAL DO MOTOR FSRS-6 */}
      <section id="simulador" className="py-16 sm:py-24 border-b border-border/60 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="outline" className="text-xs font-bold gap-1.5 px-3 py-1 bg-primary/10 text-primary border-primary/30">
              <Zap className="h-3.5 w-3.5" /> Calcule na Hora
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              Veja o Motor FSRS-6 reagir ao seu desempenho real
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Arraste o controle de acertos e mude o ciclo ou o ano da prova. Os números abaixo são calculados em tempo real pelas mesmas funções que geram seu cronograma dentro do app.
            </p>
          </div>

          <FsrsLiveSimulator />
        </div>
      </section>

      {/* SEÇÃO 3: VITRINE DEMO INTERATIVA MULTI-ABAS */}
      <section id="vitrine" className="py-16 sm:py-24 border-b border-border/60 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <Badge variant="outline" className="text-xs font-bold gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
              <Layers className="h-3.5 w-3.5" /> Experimente Sem Cadastro
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              Grade Semanal, Top Banca, Caderno de Erros e Heatmap ao vivo
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Arraste revisões entre os dias, clique em <strong>Rebalancear Atrasados</strong> ou marque erros como revisados nesta demonstração real com dados de residência médica.
            </p>
          </div>

          <InteractiveDemoShowcase />
        </div>
      </section>

      {/* SEÇÃO 4: ARQUITETURA ANIMATED BEAM + BENTO GRID 3D */}
      <section id="arquitetura" className="py-16 sm:py-24 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <Badge variant="outline" className="text-xs font-bold gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30">
              <Sparkles className="h-3.5 w-3.5" /> Ecossistema Completo
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              Plugue no seu cursinho atual e elimine o caos das planilhas
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Do primeiro contato (R0) até a véspera da prova: cada ferramenta foi construída para reduzir atrito e maximizar questões certas no dia D.
            </p>
          </div>

          <AnimatedBeamBento />
        </div>
      </section>

      {/* SEÇÃO 5: PLANOS & PREÇOS TRANSPARENTES */}
      <section id="planos" className="py-16 sm:py-24 border-b border-border/60 bg-muted/20 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="outline" className="text-xs font-bold gap-1.5 px-3 py-1 bg-primary/10 text-primary border-primary/30">
              <CreditCard className="h-3.5 w-3.5" /> Preço Transparente e Acessível
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              Acesso total sem letras miúdas
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Todos os recursos incluídos em ambos os planos. Pagamento processado com segurança pela Stripe e ativação imediata.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch max-w-4xl mx-auto">
            {/* PLANO MENSAL */}
            <Card className="border-border bg-card/90 backdrop-blur-md flex flex-col justify-between shadow-lg">
              <div>
                <CardHeader className="pb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-extrabold">Plano Mensal</CardTitle>
                    <Badge variant="outline" className="text-[10px]">Flexível</Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Ideal para experimentar na reta final ou pagar mês a mês sem compromisso longo.
                  </CardDescription>
                  <div className="pt-3 flex items-baseline gap-1.5">
                    <span className="text-4xl font-black tracking-tight text-foreground font-mono">
                      R$ 7,99
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">/ mês</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-2">
                  <ul className="space-y-2.5 text-xs text-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Motor FSRS-6 completo com ciclos R0 a R8 adaptativos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Grade Semanal Drag-and-Drop + Rebalanceamento 1-Clique</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Caderno de Erros estruturado por causa + Heatmap Anual 365 dias</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Hub de Simulados Nacionais, Provas na Íntegra e Top Banca</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Exportação em .csv e agenda .ics (Google / Apple Calendar)</span>
                    </li>
                  </ul>
                </CardContent>
              </div>

              <CardFooter className="pt-4">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleCheckout('monthly')}
                  className="w-full h-11 font-bold text-sm border-primary/40 hover:bg-primary/10 gap-2"
                >
                  <span>Assinar Plano Mensal</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            {/* PLANO ANUAL */}
            <Card className="border-2 border-primary bg-gradient-to-b from-primary/[0.08] via-card to-card flex flex-col justify-between shadow-2xl shadow-primary/15 relative overflow-hidden">
              <div className="bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest text-center py-1.5">
                Mais Vantajoso • Economize ~27% no ano
              </div>

              <div>
                <CardHeader className="pb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-extrabold">Plano Anual</CardTitle>
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold">
                      Equivale a R$ 5,83/mês
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Cobertura integral do seu ciclo de estudos até o dia da prova de residência.
                  </CardDescription>
                  <div className="pt-3 flex items-baseline gap-1.5">
                    <span className="text-4xl font-black tracking-tight text-foreground font-mono">
                      R$ 69,90
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">/ ano</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-2">
                  <ul className="space-y-2.5 text-xs text-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>Tudo do Plano Mensal</strong> liberado por 12 meses completos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Cotas diárias anti-sobrecarga personalizadas (revisões, atrasados e novos)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Curva de Retenção comparativa vs Meta de Corte da sua banca</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Auto-Estudo semanal priorizando temas de alta prevalência</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Sincronização segura na nuvem e portabilidade total (.csv / .ics)</span>
                    </li>
                  </ul>
                </CardContent>
              </div>

              <CardFooter className="pt-4">
                <Button
                  size="lg"
                  onClick={() => handleCheckout('annual')}
                  className="w-full h-11 font-extrabold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-primary/25 gap-2"
                >
                  <span>Assinar Plano Anual — R$ 69,90</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground pt-2">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Checkout Criptografado Stripe
            </span>
            <span>•</span>
            <span>Ativação automática após confirmação</span>
            <span>•</span>
            <span>Cancele em 2 cliques na aba Minha Conta</span>
          </div>
        </div>
      </section>

      {/* SEÇÃO 6: FAQ */}
      <section id="faq" className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <Badge variant="outline" className="text-xs font-bold gap-1.5 px-3 py-1">
              <HelpCircle className="h-3.5 w-3.5 text-primary" /> Perguntas Frequentes
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Tudo esclarecido antes de começar
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={item.q}
                  className="rounded-2xl border border-border bg-card overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                  >
                    <span className="text-xs sm:text-sm font-bold text-foreground">{item.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-primary' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3 animate-fade-in">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/80 bg-card/40 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center">
              <Stethoscope className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-foreground">AdaptiveMed</span>
            <span>• Repetição Espaçada FSRS-6 para Residência Médica</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-foreground transition-colors">
              Entrar
            </Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">
              Criar Conta
            </Link>
            <a href="#planos" className="hover:text-foreground transition-colors">
              Planos
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
