'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useData } from '@/lib/store/data-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import {
  Stethoscope,
  Target,
  Sparkles,
  TrendingUp,
  Brain,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Flame,
  Award,
  Zap,
  Clock,
  BookOpen,
  MapPin,
  ChevronRight,
  Star,
  Users,
  Smartphone,
  CalendarCheck,
  Calendar,
  GripVertical,
  AlertCircle,
  BarChart3,
  Check,
  Layers,
  FileText,
  ChevronDown,
  ChevronUp,
  MoveRight,
  Activity,
  HelpCircle,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { user, profile, signOut } = useData();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const hasPaid = Boolean(profile?.is_subscribed || profile?.subscription_status === 'active');
  const [redirectNotice, setRedirectNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const reason = params.get('reason');
      if (reason === 'no_account') {
        setRedirectNotice(
          '⚠️ Não encontramos uma conta cadastrada com este e-mail. Escolha seu plano abaixo para liberar seu acesso imediato!'
        );
        const el = document.getElementById('planos');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else if (reason === 'inactive_account') {
        setRedirectNotice(
          '🔒 Você não tem assinatura finalizada. Finalize sua assinatura escolhendo um dos planos abaixo para liberar seu acesso:'
        );
        const el = document.getElementById('planos');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  const handleCheckout = async (planId: 'monthly' | 'annual') => {
    if (user) {
      router.push(`/pagamento?plan=${planId}`);
    } else {
      router.push(`/signup?plan=${planId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* NAVBAR FIXO */}
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Stethoscope className="h-5 w-5 text-white stroke-[2.2]" />
            </div>
            <span className="text-xl font-black tracking-tight">AdaptiveMed</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-muted-foreground">
            <a href="#como-funciona" className="hover:text-foreground transition-colors">
              Como Funciona
            </a>
            <a href="#pilares" className="hover:text-foreground transition-colors">
              Recursos & Diário
            </a>
            <a href="#diagnosticos" className="hover:text-foreground transition-colors">
              Diagnósticos Clínicos
            </a>
            <a href="#bancas" className="hover:text-foreground transition-colors">
              Bancas & Regiões
            </a>
            <a href="#planos" className="hover:text-foreground transition-colors">
              Planos & Preços
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              Dúvidas
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {user ? (
              hasPaid ? (
                <>
                  <Button
                    onClick={() => router.push('/dashboard')}
                    size="sm"
                    className="gap-2 font-bold text-xs shadow-md shadow-primary/20"
                  >
                    Meu Painel <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut()}
                    className="text-xs text-muted-foreground hover:text-foreground px-2.5"
                    title="Desconectar conta"
                  >
                    Sair
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => router.push('/pagamento')}
                    size="sm"
                    className="gap-2 font-bold text-xs shadow-md bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-amber-500/20 animate-pulse"
                  >
                    Finalizar Assinatura <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut()}
                    className="text-xs text-muted-foreground hover:text-foreground px-2.5"
                    title="Desconectar conta"
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
                  <a href="#planos">Assinar Agora</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* BANNER DE AVISO DE CONTA / REDIRECIONAMENTO */}
      {redirectNotice && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 py-3 px-4 text-center text-xs font-semibold text-amber-300 flex items-center justify-center gap-2 animate-in fade-in">
          <span>{redirectNotice}</span>
          <a
            href="#planos"
            className="underline font-bold hover:text-amber-100 inline-flex items-center gap-0.5 ml-1"
          >
            Ver Planos <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* BANNER PARA USUÁRIO AUTENTICADO */}
      {user && !redirectNotice && (
        hasPaid ? (
          <div className="bg-primary/10 border-b border-primary/20 py-2.5 px-4 text-center text-xs font-medium text-primary flex items-center justify-center gap-2">
            <span>
              Você já está autenticado{' '}
              <strong className="font-bold">
                ({profile?.full_name || user?.email})
              </strong>
              .
            </span>
            <Link
              href="/dashboard"
              className="underline font-bold hover:text-primary/80 inline-flex items-center gap-0.5 ml-1"
            >
              Acessar meu painel <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="bg-amber-500/15 border-b border-amber-500/30 py-3 px-4 text-center text-xs font-semibold text-amber-300 flex items-center justify-center gap-2 animate-in fade-in">
            <span>
              ⚠️ Olá, <strong>{profile?.full_name || user?.email}</strong>! Falta você finalizar o pagamento para liberar seu cronograma adaptativo.
            </span>
            <Link
              href="/pagamento"
              className="underline font-bold text-amber-200 hover:text-white inline-flex items-center gap-0.5 ml-1"
            >
              Finalizar Pagamento Agora <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )
      )}

      {/* BARRA DE CLAREZA DA PROPOSTA: COMPATIBILIDADE UNIVERSAL */}
      <div className="bg-gradient-to-r from-blue-950/40 via-card to-emerald-950/40 border-b border-border/80 py-2.5 px-4 text-center">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground flex-wrap">
          <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[11px]">
            <CheckCircle2 className="h-3 w-3" /> Compatibilidade Total
          </span>
          <span>
            Você estuda e resolve questões <strong>no seu banco ou cursinho habitual</strong> (Medcurso, Estratégia, Medcel, Sanar, Hardwork, etc.).
          </span>
          <span className="text-foreground font-semibold">
            O AdaptiveMed é o cérebro que organiza sua repetição espaçada e diagnostica sua retenção.
          </span>
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-blue-500/15 via-indigo-500/10 to-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold tracking-wide animate-in fade-in">
            <Sparkles className="h-3.5 w-3.5" />
            <span>O Cérebro da sua Aprovação na Residência Médica</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground leading-[1.12] max-w-4xl mx-auto">
            Sua aprovação não depende de sorte.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400">
              Depende de repetição adaptativa.
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Elimine a curva do esquecimento de Ebbinghaus. Resolva suas questões e simulados onde você já estuda e registre seus resultados no <strong>AdaptiveMed</strong>: nosso motor calcula automaticamente os ciclos ideais de revisão (R1 a R8), diagnostica suas falhas e dimensiona o esforço na sua Grade Semanal.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-12 px-8 font-bold text-sm shadow-xl shadow-primary/25 gap-2"
            >
              <a href="#planos">
                Garantir Meu Acesso com Desconto <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="w-full sm:w-auto h-12 px-6 font-semibold text-sm border-border hover:bg-muted"
            >
              <a href="#como-funciona">Entender Como Funciona</a>
            </Button>
          </div>

          {/* Destaque com 4 Métricas Chave */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-8 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-card/70 border border-border text-center shadow-2xs">
              <div className="text-2xl sm:text-3xl font-black text-primary">5 Níveis</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Diagnósticos Pedagógicos</div>
            </div>
            <div className="p-4 rounded-2xl bg-card/70 border border-border text-center shadow-2xs">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">Grade Semanal</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Com Arraste & Atrasados</div>
            </div>
            <div className="p-4 rounded-2xl bg-card/70 border border-border text-center shadow-2xs">
              <div className="text-2xl sm:text-3xl font-black text-amber-400">Top Banca</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Hierarquia de Prevalência</div>
            </div>
            <div className="p-4 rounded-2xl bg-card/70 border border-border text-center shadow-2xs">
              <div className="text-2xl sm:text-3xl font-black text-blue-400">0 Acúmulo</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Reorganização Flexível</div>
            </div>
          </div>

          {/* MOCKUP INTERATIVO DA GRADE SEMANAL DO DIÁRIO */}
          <div className="pt-8 max-w-5xl mx-auto text-left">
            <div className="rounded-2xl border-2 border-border/80 bg-card/90 shadow-2xl p-4 sm:p-6 space-y-4 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-border/70 pb-3.5 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                      Grade Semanal Interativa do Diário
                      <Badge variant="outline" className="text-[10px] font-bold text-emerald-400 border-emerald-500/30">
                        Ao Vivo
                      </Badge>
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Cards coloridos pela Grande Área, métricas de rendimento e suporte a Drag-and-Drop
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                    Semana Atual
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-primary text-primary-foreground">
                    Hoje
                  </span>
                </div>
              </div>

              {/* Grid das Colunas Simuladas da Semana */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
                {/* Coluna 1: Segunda (Clínica Médica) */}
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-2.5">
                  <div className="flex items-center justify-between text-xs pb-1.5 border-b border-border/40 font-bold">
                    <span>Segunda-feira</span>
                    <span className="text-[10px] text-muted-foreground">28/09</span>
                  </div>

                  {/* Card Clínica Médica */}
                  <div className="p-2.5 rounded-xl border border-l-4 border-l-blue-500 bg-blue-500/12 dark:bg-blue-500/20 border-blue-500/30 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9.5px] font-black px-2 py-0.5 rounded bg-background/80 text-blue-600 dark:text-blue-300 border border-blue-500/40">
                        Clínica Médica
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
                        ✓ R0 Feito
                      </span>
                    </div>
                    <h5 className="font-bold text-xs text-foreground leading-snug">
                      Insuficiência Cardíaca Aguda
                    </h5>
                    <div className="text-[10px] flex items-center justify-between p-1.5 rounded-lg bg-background/60 border border-border/50 font-bold">
                      <span className="text-muted-foreground">16/20 Qs</span>
                      <span className="text-emerald-500">80.0% acerto</span>
                    </div>
                  </div>
                </div>

                {/* Coluna 2: Terça (Cirurgia Geral + Top Banca) */}
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-2.5">
                  <div className="flex items-center justify-between text-xs pb-1.5 border-b border-border/40 font-bold text-primary">
                    <span className="flex items-center gap-1 font-black">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" /> Terça-feira (Hoje)
                    </span>
                    <span className="text-[10px]">29/09</span>
                  </div>

                  {/* Card Cirurgia Geral */}
                  <div className="p-2.5 rounded-xl border border-l-4 border-l-emerald-500 bg-emerald-500/12 dark:bg-emerald-500/20 border-emerald-500/30 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9.5px] font-black px-2 py-0.5 rounded bg-background/80 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
                        Cirurgia Geral
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                        <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-500" /> Top Banca
                      </span>
                    </div>
                    <h5 className="font-bold text-xs text-foreground leading-snug">
                      Abdome Agudo Inflamatório
                    </h5>
                    <div className="text-[10px] flex items-center justify-between p-1.5 rounded-lg bg-background/60 border border-border/50 font-bold">
                      <span className="text-muted-foreground">Revisão R1</span>
                      <span className="text-primary font-black">Revisar Hoje →</span>
                    </div>
                  </div>
                </div>

                {/* Coluna 3: Quarta (Pediatria) */}
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-2.5">
                  <div className="flex items-center justify-between text-xs pb-1.5 border-b border-border/40 font-bold">
                    <span>Quarta-feira</span>
                    <span className="text-[10px] text-muted-foreground">30/09</span>
                  </div>

                  {/* Card Pediatria */}
                  <div className="p-2.5 rounded-xl border border-l-4 border-l-amber-500 bg-amber-500/12 dark:bg-amber-500/20 border-amber-500/30 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9.5px] font-black px-2 py-0.5 rounded bg-background/80 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                        Pediatria
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/40">
                        R2 Agendado
                      </span>
                    </div>
                    <h5 className="font-bold text-xs text-foreground leading-snug">
                      Bronquiolite Viral Aguda
                    </h5>
                    <div className="text-[10px] flex items-center justify-between p-1.5 rounded-lg bg-background/60 border border-border/50 font-bold">
                      <span className="text-muted-foreground">Meta: 14 Qs</span>
                      <span className="text-muted-foreground">Programado</span>
                    </div>
                  </div>
                </div>

                {/* Coluna 4: Barra Lateral com Revisões Atrasadas */}
                <div className="p-3 rounded-xl bg-rose-500/[0.06] dark:bg-rose-950/20 border border-rose-500/30 space-y-2.5">
                  <div className="flex items-center justify-between text-xs pb-1.5 border-b border-rose-500/30 font-bold text-rose-600 dark:text-rose-400">
                    <span className="flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> Revisões Atrasadas
                    </span>
                    <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                      1 Pendente
                    </Badge>
                  </div>

                  {/* Card de Revisão Atrasada */}
                  <div className="p-2.5 rounded-xl border border-l-4 border-l-purple-500 bg-purple-500/12 dark:bg-purple-500/20 border-purple-500/30 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9.5px] font-black px-2 py-0.5 rounded bg-background/80 text-purple-700 dark:text-purple-300 border border-purple-500/40">
                        Medicina Preventiva
                      </span>
                      <span className="text-[9px] font-black text-rose-500 bg-rose-500/15 border border-rose-500/30 px-1 rounded">
                        -2 dias
                      </span>
                    </div>
                    <h5 className="font-bold text-xs text-foreground leading-snug">
                      Sensibilidade e Especificidade
                    </h5>
                    <div className="text-[10px] flex items-center justify-between pt-1 border-t border-border/40 text-muted-foreground">
                      <span className="italic flex items-center gap-0.5">
                        <GripVertical className="h-3 w-3" /> Arraste para o dia
                      </span>
                      <span className="font-bold text-primary">Concluir →</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center text-xs text-muted-foreground">
                ✨ <em>Reagende qualquer revisão ou tema pendente apenas arrastando o card para o dia desejado da semana.</em>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO: COMO FUNCIONA EM 3 PASSOS SIMPLES */}
      <section id="como-funciona" className="py-16 md:py-24 bg-muted/20 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="outline" className="border-primary/30 text-primary font-semibold">
              Transparência & Liberdade de Estudo
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Como funciona o AdaptiveMed na sua rotina médica?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Você não precisa abandonar os materiais ou cursinhos que já contratou. O AdaptiveMed entra como o cérebro estratégico que dita o cronograma com base no seu desempenho real.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Passo 1 */}
            <div className="p-6 rounded-2xl bg-card border border-border space-y-4 relative shadow-xs">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black text-xl">
                1
              </div>
              <h3 className="font-bold text-base text-foreground">
                Faça suas questões onde preferir
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Estude pelo seu cursinho (Medcurso, Estratégia MED, Medcel, Sanar, Hardwork, etc.), banco de questões digital ou provas na íntegra impressas.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Compatível com 100% dos materiais
              </div>
            </div>

            {/* Passo 2 */}
            <div className="p-6 rounded-2xl bg-card border border-border space-y-4 relative shadow-xs">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-black text-xl">
                2
              </div>
              <h3 className="font-bold text-base text-foreground">
                Alimente a plataforma em 15 segundos
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Após terminar o estudo do tema ou simulado, entre no AdaptiveMed e digite apenas a especialidade, quantas questões realizou e quantas acertou.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-indigo-400 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Registro rápido sem burocracia
              </div>
            </div>

            {/* Passo 3 */}
            <div className="p-6 rounded-2xl bg-card border border-border space-y-4 relative shadow-xs">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black text-xl">
                3
              </div>
              <h3 className="font-bold text-base text-foreground">
                A inteligência assume o seu cronograma
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                O motor calcula a curva de retenção, emite o diagnóstico clínico, define o volume ideal de questões e agenda a revisão exata na sua Grade Semanal.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
                <Brain className="h-3.5 w-3.5" /> Repetição Espaçada sem sobrecarga
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO DOS 4 PILARES DA PLATAFORMA */}
      <section id="pilares" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 font-semibold">
              Arquitetura de Alta Performance
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Os 4 Pilares da Nova Versão do AdaptiveMed
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Projetado meticulosamente para médicos e estudantes que precisam de máxima eficiência sem perder tempo com planilhas que quebram.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            {/* Pilar 1: Diário & Grade Semanal */}
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Calendar className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  1. Diário Completo & Grade Semanal com Drag-and-Drop
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Alterne entre visualizações por <strong>Dia</strong>, <strong>Semana</strong> e <strong>Mês</strong>. Na Grade Semanal, visualize os assuntos de Segunda a Domingo com identificação de cores exclusivas para as Grandes Áreas médicas, rendimento por bloco e barra lateral de revisões atrasadas com reagendamento instantâneo por arraste.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground pt-3 border-t border-border/60">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Cards coloridos por especialidade médica com borda lateral de destaque</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Reorganização rápida: arraste temas pendentes diretamente para o dia que estudou</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Seção recolhível de revisões atrasadas para nunca perder uma pendência de vista</span>
                </li>
              </ul>
            </div>

            {/* Pilar 2: Motor Pedagógico & Diagnósticos */}
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Activity className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  2. Motor de Diagnósticos Pedagógicos Clínicos
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Não tratamos todos os temas como iguais. Cada revisão recebe um diagnóstico clínico baseado no seu aproveitamento percentual real, com justificativa pedagógica e dimensionamento dinâmico do número de questões necessárias para consolidar a retenção de longo prazo.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground pt-3 border-t border-border/60">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>5 faixas clínicas: de Ruptura Crítica a Domínio Pleno</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Curva contínua de esforço cognitivo: quem erra mais recebe mais suporte</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Intervalos adaptativos de R1 até R8 sem datas arbitrárias</span>
                </li>
              </ul>
            </div>

            {/* Pilar 3: Assuntos Prevalentes da Banca */}
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Star className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  3. Hierarquia de Assuntos Prevalentes da Banca Alvo
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Cadastre ou ordene os temas que mais caem nas suas bancas de interesse (ENARE, SES-PE, PSU-BA, USP, etc.). A plataforma prioriza temas de alta relevância com o selo especial <strong>Top Banca</strong> em destaque na sua Grade Semanal e no Diário.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground pt-3 border-t border-border/60">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Hierarquização dentro das 5 Grandes Áreas ou especialidades personalizadas</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Selo Top Banca nos cards para orientar prioridade em dias de pouco tempo</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Sugestões inteligentes de temas prevalentes a estudar</span>
                </li>
              </ul>
            </div>

            {/* Pilar 4: Simulados Gerais & Provas na Íntegra */}
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  4. Central de Simulados & Provas na Íntegra
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Alimente suas notas de simulados gerais e provas reais de qualquer instituição (suporta anos completos como 2024 ou semestrais como 24.1 e 24.2). Acompanhe sua curva de evolução em tempo real contra a meta de corte da sua vaga desejada.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground pt-3 border-t border-border/60">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Gráfico de evolução com linha da nota de corte configurável</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Ofensiva Diária (Streak) com regras personalizadas pelo próprio aluno</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Histórico detalhado por instituição e ano da prova</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO DOS DIAGNÓSTICOS CLÍNICOS E PEDAGÓGICOS */}
      <section id="diagnosticos" className="py-16 md:py-24 bg-muted/20 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="outline" className="border-blue-500/30 text-blue-400 font-semibold">
              Motor Pedagógico Dinâmico
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Os 5 Diagnósticos Pedagógicos por Faixa de Rendimento
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Em vez de regras rígidas e engessadas, o AdaptiveMed analisa o aproveitamento das questões que você realizou e aplica justificativas pedagógicas transparentes.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/70 text-muted-foreground font-bold border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Faixa de Acerto</th>
                    <th className="py-3 px-4">Diagnóstico Clínico</th>
                    <th className="py-3 px-4">Prazo Recomendado</th>
                    <th className="py-3 px-4">Justificativa Pedagógica do Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-rose-500">&lt; 50%</td>
                    <td className="py-3.5 px-4 font-extrabold text-foreground">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-500 border border-rose-500/30">
                        🔴 Ruptura Crítica (Lapse)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-medium">Reteste em 48h</td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      Bloco corretivo enxuto para retestar os erros em 48h sem causar fadiga cognitiva.
                    </td>
                  </tr>

                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-amber-500">50% a 69%</td>
                    <td className="py-3.5 px-4 font-extrabold text-foreground">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-500 border border-amber-500/30">
                        🟡 Retenção Instável
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-medium">Ciclo curto</td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      Volume em esforço máximo para treinar diferenciação diagnóstica e eliminação de distratores.
                    </td>
                  </tr>

                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-emerald-500">70% a 84%</td>
                    <td className="py-3.5 px-4 font-extrabold text-foreground">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                        🟢 Dificuldade Desejável
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-medium">Zona Ideal</td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      Amostragem equilibrada para manutenção sólida e consolidação na zona ideal de aprendizado.
                    </td>
                  </tr>

                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-blue-500">85% a 94%</td>
                    <td className="py-3.5 px-4 font-extrabold text-foreground">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-500 border border-blue-500/30">
                        🔵 Fixação Sólida
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-medium">Intervalo expandido</td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      Validação rápida de memória para comprovar retenção estável sem sobrecarga desnecessária.
                    </td>
                  </tr>

                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-purple-500">&ge; 95%</td>
                    <td className="py-3.5 px-4 font-extrabold text-foreground">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-500 border border-purple-500/30">
                        🟣 Domínio Pleno
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-medium">Manutenção longa</td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      Micro-checagem pontual de alto nível para evitar perda de tempo e sobreaprendizagem (overlearning).
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO BANCAS & FOCO REGIONAL (DESTAQUE NORDESTE & SUDESTE) */}
      <section id="bancas" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 font-semibold">
              Foco Regional e Nacional
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Calibrado para as bancas mais disputadas do Brasil
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Cadastre suas provas alvo e registre suas notas de simulados com foco na nota de corte exata do seu concurso.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card Nordeste em Destaque */}
            <div className="p-5 rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-b from-emerald-500/10 to-transparent space-y-3 relative overflow-hidden sm:col-span-2 lg:col-span-1 shadow-sm">
              <div className="absolute top-2 right-2">
                <Badge className="bg-emerald-500 text-slate-950 font-bold text-[10px]">
                  🌟 Foco Nordeste
                </Badge>
              </div>
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg">ENARE, SES-PE & PSU-BA</h3>
              <p className="text-xs text-muted-foreground">
                Cobertura especializada nas principais provas do Nordeste: Residência Médica SES-PE, PSU-BA (CEREM-BA), PSU-AL e universidades federais (UFRN, UFPB, UFMA, UFPI, UFS).
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['ENARE', 'SES-PE', 'PSU-BA', 'PSU-AL', 'UFRN', 'UFPB'].map(b => (
                  <span key={b} className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Card Sudeste */}
            <div className="p-5 rounded-2xl border border-border bg-card space-y-3 shadow-2xs">
              <div className="h-9 w-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg">USP, UNICAMP & SUS-SP</h3>
              <p className="text-xs text-muted-foreground">
                As bancas de São Paulo e Minas Gerais com a maior densidade de inscritos do Brasil. Mapeamento de incidência de questões e notas de corte competitivas.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['USP-SP', 'UNICAMP', 'UNIFESP', 'SUS-SP', 'PSU-MG'].map(b => (
                  <span key={b} className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-300">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Card Qualquer Ano de Formatura */}
            <div className="p-5 rounded-2xl border border-border bg-card space-y-3 shadow-2xs">
              <div className="h-9 w-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg">Do Ciclo Clínico ao Internato</h3>
              <p className="text-xs text-muted-foreground">
                Seja você interno no ano de prova ou estudante no internato construindo base para residência futura, o cronograma adapta a densidade dos ciclos de estudo.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['2026', '2027', '2028', '2029', '2030+'].map(y => (
                  <span key={y} className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300">
                    Concurso {y}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO PLANOS E PREÇOS COM STRIPE */}
      <section id="planos" className="py-16 md:py-24 bg-muted/20 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="outline" className="border-primary/30 text-primary font-semibold">
              Assinatura Transparente e Sem Pegadinhas
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Invista no método que garante sua aprovação
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Tenha acesso completo ao cronograma adaptativo. Cancele quando quiser com apenas 1 clique.
            </p>
          </div>

          {user && !hasPaid && (
            <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-200 text-center space-y-1.5 animate-in zoom-in-95 shadow-xl shadow-amber-500/10">
              <p className="font-bold text-base text-amber-300">
                Falta finalizar o pagamento da sua assinatura
              </p>
              <p className="text-xs text-muted-foreground">
                Escolha o plano mensal ou anual abaixo para concluir o pagamento com segurança e liberar imediatamente seu cronograma adaptativo.
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-center">
            {/* PLANO MENSAL */}
            <Card className="border-border bg-card shadow-lg relative">
              <CardHeader className="space-y-1">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Flexibilidade Total
                </div>
                <CardTitle className="text-2xl font-black">Plano Mensal</CardTitle>
                <CardDescription className="text-xs">
                  Acesso completo à repetição espaçada adaptativa e Diário Semanal.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-foreground">R$ 7,99</span>
                  <span className="text-xs text-muted-foreground">/mês</span>
                </div>

                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-[11px] text-primary font-bold flex items-center gap-1.5">
                  <span>🏷️</span>
                  <span>Com cupom de desconto: apenas R$ 4,99 no 1º mês!</span>
                </div>

                <ul className="space-y-2.5 text-xs text-muted-foreground pt-1 border-t border-border">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>Algoritmo de repetição espaçada adaptativa</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>Grade Semanal interativa com Drag-and-Drop</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>Seção de Revisões Atrasadas e reagendamento fácil</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>Módulo de registro de simulados vs. nota de corte</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>Acesso pelo celular, tablet e computador (PWA)</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="pt-2">
                <Button
                  onClick={() => handleCheckout('monthly')}
                  disabled={checkoutLoading === 'monthly'}
                  variant="outline"
                  className="w-full font-bold text-sm h-11 border-border hover:bg-muted"
                >
                  {checkoutLoading === 'monthly' ? 'Carregando Checkout...' : 'Assinar Plano Mensal (R$ 7,99)'}
                </Button>
              </CardFooter>
            </Card>

            {/* PLANO ANUAL (DESTAQUE) */}
            <Card className="border-2 border-primary bg-card shadow-2xl relative scale-[1.02]">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-black text-xs px-3.5 py-1 shadow-md shadow-blue-500/25">
                  🔥 MAIS ESCOLHIDO (ECONOMIZE 27%)
                </Badge>
              </div>

              <CardHeader className="space-y-1 pt-7">
                <div className="text-xs font-bold text-primary uppercase tracking-wider">
                  Ano Letivo Completo
                </div>
                <CardTitle className="text-2xl font-black">Plano Anual VIP</CardTitle>
                <CardDescription className="text-xs">
                  Garanta a cobertura de todo o seu ano de preparação com economia máxima.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-emerald-400">R$ 69,90</span>
                  <span className="text-xs text-muted-foreground">/ano</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Equivalente a apenas <strong className="text-foreground">R$ 5,82/mês</strong> (menos de R$ 0,20 por dia).
                </p>

                <ul className="space-y-2.5 text-xs text-foreground pt-2 border-t border-border">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span><strong>Tudo do plano mensal</strong> incluso</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span><strong>Suporte prioritário</strong> para dúvidas de cronograma</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span><strong>Recalibração automática</strong> de metas pós-simulados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Garantia incondicional de 7 dias</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="pt-2">
                <Button
                  onClick={() => handleCheckout('annual')}
                  disabled={checkoutLoading === 'annual'}
                  className="w-full font-bold text-sm h-11 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:opacity-95 text-white shadow-xl shadow-blue-500/25"
                >
                  {checkoutLoading === 'annual' ? 'Carregando Checkout...' : 'Garantir Acesso Anual (R$ 69,90)'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-16 md:py-24 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black">Perguntas Frequentes</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Tire todas as suas dúvidas sobre o funcionamento do AdaptiveMed.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* PERGUNTA CRUCIAL: TEM QUESTÕES PRÓPRIAS OU O ALUNO ALIMENTA? */}
            <div className="p-4 rounded-xl border-2 border-primary/40 bg-primary/5 space-y-2">
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                O AdaptiveMed tem banco de questões ou simulados próprios embutidos?
              </h3>
              <p className="text-muted-foreground leading-relaxed text-xs">
                <strong>Não. O AdaptiveMed é uma plataforma de gestão, inteligência pedagógica e repetição espaçada.</strong> Você resolve questões e simulados onde você já estuda (seja Medcurso, Estratégia MED, Medcel, Sanar, Hardwork, apostilas físicas ou provas na íntegra da internet). Você apenas alimenta o AdaptiveMed com as quantidades de questões realizadas e acertos. A nossa inteligência cuida de todo o agendamento, diagnósticos de retenção e organização semanal.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
              <h3 className="font-bold text-sm text-foreground">
                Quanto tempo eu gasto alimentando a plataforma?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Menos de 15 a 20 segundos por tema. Basta selecionar a matéria, colocar quantas questões fez e quantas acertou. O sistema faz o cálculo imediato da acurácia e já programa os ciclos de revisão futuros na sua Grade Semanal.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
              <h3 className="font-bold text-sm text-foreground">
                Estou nos primeiros anos de medicina, a plataforma já serve para mim?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Com certeza. Você pode selecionar o ano da sua prova no cadastro (2027, 2028, 2029, 2030+). O sistema permitirá que você cadastre os temas estudados na faculdade e mantenha revisões contínuas para chegar no internato com uma base sólida incomparável.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
              <h3 className="font-bold text-sm text-foreground">
                Como as bancas do Nordeste são tratadas na plataforma?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                O AdaptiveMed foi projetado com suporte especial para as bancas do Nordeste (ENARE, SES-PE, PSU-BA, PSU-AL, UFRN, etc.), além das tradicionais de São Paulo (USP, UNICAMP, SUS-SP) e permite digitar qualquer banca e ano (incluindo provas semestrais como 24.1 e 24.2).
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
              <h3 className="font-bold text-sm text-foreground">
                Existe fidelidade ou taxa de cancelamento?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Não. No Plano Mensal você tem total flexibilidade para cancelar a qualquer momento sem qualquer multa ou fidelidade, diretamente pelo painel de controle da sua conta. Além disso, você conta com garantia incondicional de 7 dias.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
              <h3 className="font-bold text-sm text-foreground">
                Como funciona o pagamento via Stripe?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                O processamento é feito pela Stripe, a maior e mais segura operadora de pagamentos da internet mundial. Aceita cartões de crédito com cancelamento fácil a qualquer momento.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-8 bg-card text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center">
              <Stethoscope className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-foreground">AdaptiveMed</span>
            <span>&copy; {new Date().getFullYear()} - Todos os direitos reservados.</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/login" className="hover:text-foreground">
              Área do Aluno
            </Link>
            <Link href="/signup" className="hover:text-foreground">
              Criar Conta
            </Link>
            <a href="#planos" className="hover:text-foreground">
              Planos
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
