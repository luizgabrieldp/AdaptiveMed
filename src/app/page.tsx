'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { user, isDemoMode, profile } = useData();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const isLoggedIn = Boolean(user || isDemoMode);
  const [redirectNotice, setRedirectNotice] = useState<string | null>(null);
  const [isContractInactive, setIsContractInactive] = useState<boolean>(false);

  React.useEffect(() => {
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
        setIsContractInactive(true);
        setRedirectNotice(
          '🔒 Você não tem contrato finalizado. Finalize um contrato escolhendo um dos planos abaixo para liberar seu acesso:'
        );
        const el = document.getElementById('planos');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  const handleCheckout = async (planId: 'monthly' | 'annual') => {
    try {
      setCheckoutLoading(planId);
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          email: user?.email,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        // Fallback para signup se houver redirecionamento
        router.push(`/signup?plan=${planId}`);
      }
    } catch (err) {
      console.error(err);
      router.push(`/signup?plan=${planId}`);
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* NAVBAR FIXO */}
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Stethoscope className="h-5 w-5 text-white stroke-[2.2]" />
            </div>
            <span className="text-xl font-black tracking-tight">AdaptiveMed</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-muted-foreground">
            <a href="#metodo" className="hover:text-foreground transition-colors">
              Como Funciona
            </a>
            <a href="#bancas" className="hover:text-foreground transition-colors">
              Bancas & Regiões
            </a>
            <a href="#recursos" className="hover:text-foreground transition-colors">
              Diferenciais
            </a>
            <a href="#planos" className="hover:text-foreground transition-colors">
              Planos & Preços
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              Dúvidas
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            {isLoggedIn ? (
              <Button
                onClick={() => router.push('/dashboard')}
                size="sm"
                className="gap-2 font-bold text-xs shadow-md shadow-primary/20"
              >
                Meu Painel <ArrowRight className="h-3.5 w-3.5" />
              </Button>
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

      {/* BANNER DE REDIRECIONAMENTO POR CONTA INATIVA OU NÃO ENCONTRADA */}
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

      {/* BANNER PARA USUÁRIO LOGADO */}
      {isLoggedIn && !redirectNotice && (
        <div className="bg-primary/10 border-b border-primary/20 py-2.5 px-4 text-center text-xs font-medium text-primary flex items-center justify-center gap-2">
          <span>
            Você já está autenticado{' '}
            <strong className="font-bold">
              ({profile?.full_name || user?.email || 'Modo Demonstração'})
            </strong>
            .
          </span>
          <Link
            href="/dashboard"
            className="underline font-bold hover:text-primary/80 inline-flex items-center gap-0.5 ml-1"
          >
            Acessar meu cronograma <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-500/15 via-indigo-500/10 to-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold tracking-wide animate-in fade-in">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Algoritmo Adaptativo Calibrado para ENARE, SES-PE, SURCE e Sudeste</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground leading-[1.12]">
            Sua aprovação na residência médica não é sorte.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400">
              É repetição científica.
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Elimine a curva do esquecimento de Ebbinghaus. A única plataforma de cronograma adaptativo que ajusta os intervalos de revisão com base no seu percentual de acerto real em cada tema.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-12 px-8 font-bold text-sm shadow-xl shadow-primary/25 gap-2"
            >
              <a href="#planos">
                Garantir Minha Vaga com Desconto <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="w-full sm:w-auto h-12 px-6 font-semibold text-sm border-border hover:bg-muted"
            >
              <Link href="/login">Ver Demonstração Interativa</Link>
            </Button>
          </div>

          {/* Números e Destaques */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 border-t border-border/60 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-card/60 border border-border text-center">
              <div className="text-2xl sm:text-3xl font-black text-primary">92%</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Retenção de Longo Prazo</div>
            </div>
            <div className="p-4 rounded-2xl bg-card/60 border border-border text-center">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">+50</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Especialidades Mapeadas</div>
            </div>
            <div className="p-4 rounded-2xl bg-card/60 border border-border text-center">
              <div className="text-2xl sm:text-3xl font-black text-amber-400">0 Acúmulo</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Recalibração sem Frustração</div>
            </div>
            <div className="p-4 rounded-2xl bg-card/60 border border-border text-center">
              <div className="text-2xl sm:text-3xl font-black text-blue-400">Nordeste & SE</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">ENARE, SES-PE, SURCE, USP</div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO O MÉTODO: Curva do Esquecimento */}
      <section id="metodo" className="py-16 md:py-24 bg-muted/20 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="outline" className="border-blue-500/30 text-blue-400 font-semibold">
              Ciência Cognitiva Aplicada à Medicina
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Por que médicos esquecem 70% do que estudam em 48 horas?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Estudar passivamente por resumos ou videoaulas gera uma falsa sensação de domínio. Sem recuperação ativa no momento exato do limiar de esquecimento, o esforço se perde.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 items-stretch">
            {/* O Jeito Tradicional */}
            <div className="p-6 rounded-2xl border border-destructive/30 bg-destructive/5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive font-black text-lg">
                  ✕
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">O Modelo Tradicional Falho</h3>
                  <p className="text-xs text-muted-foreground">Cronogramas lineares e fixos</p>
                </div>
              </div>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold mt-0.5">✕</span>
                  <span>Você estuda Cardiologia hoje e só volta a ver daqui a 4 meses na véspera da prova.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold mt-0.5">✕</span>
                  <span>Revisões estáticas fixas (24h/7d/30d) geram centenas de pendências acumuladas inatingíveis.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold mt-0.5">✕</span>
                  <span>Você revisa no mesmo ritmo o que já domina e o que vive errando.</span>
                </li>
              </ul>
            </div>

            {/* O Jeito AdaptiveMed */}
            <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black text-lg">
                  ✓
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">O Método AdaptiveMed</h3>
                  <p className="text-xs text-muted-foreground">Repetição Espaçada com Feedback Ativo</p>
                </div>
              </div>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                  <span>Intervalos dinâmicos calculados conforme seu percentual de acerto real nas questões.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                  <span>Temas difíceis voltam mais cedo; temas consolidados são espaçados progressivamente.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                  <span>Sem sobrecarga: o algoritmo redistribui revisões atrasadas automaticamente.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO BANCAS & FOCO REGIONAL (DESTAQUE NORDESTE) */}
      <section id="bancas" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 font-semibold">
              Foco Regional e Nacional
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Preparado para as bancas mais concorridas do Nordeste e Sudeste
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Cadastre suas provas alvo e tenha pesos calibrados para a nota de corte exata do seu concurso.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card Nordeste em Destaque */}
            <div className="p-5 rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-b from-emerald-500/10 to-transparent space-y-3 relative overflow-hidden sm:col-span-2 lg:col-span-1">
              <div className="absolute top-2 right-2">
                <Badge className="bg-emerald-500 text-slate-950 font-bold text-[10px]">
                  🌟 Foco Nordeste
                </Badge>
              </div>
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg">ENARE, SES-PE & SURCE</h3>
              <p className="text-xs text-muted-foreground">
                Cobertura especializada nas principais provas do Nordeste: Seleção Unificada do Ceará (SURCE), Residência Médica SES-PE, PSU-BA, PSU-AL e universidades federais (UFRN, UFPB, UFMA, UFPI, UFS).
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['ENARE', 'SES-PE', 'SURCE', 'PSU-BA', 'UFRN', 'UFPB'].map(b => (
                  <span key={b} className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Card Sudeste */}
            <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
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
            <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
              <div className="h-9 w-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg">Do 1º Ano ao Internato</h3>
              <p className="text-xs text-muted-foreground">
                Seja você interno no ano de prova ou estudante no ciclo básico construindo base para residência futura, o cronograma adapta a densidade dos ciclos de estudo.
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

      {/* SEÇÃO DIFERENCIAIS DA PLATAFORMA */}
      <section id="recursos" className="py-16 md:py-24 bg-muted/20 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="outline" className="border-primary/30 text-primary font-semibold">
              Arquitetura de Alta Performance
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Tudo o que você precisa em uma única plataforma
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Sem planilhas manuais que quebram, sem métodos engessados. Apenas clareza no que estudar hoje.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl border border-border bg-card space-y-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <Brain className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm">Painel de Revisões do Dia</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Abra a plataforma e veja exatamente quais temas médicos atingiram o limiar de repetição hoje. Complete a sessão em bloco com foco total.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card space-y-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm">Métricas das 5 Grandes Áreas</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Acompanhe gráficos detalhados de Clínica Médica, Cirurgia Geral, Pediatria, GO e Preventiva com identificação automática dos seus pontos fracos.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card space-y-2.5">
              <div className="h-9 w-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <Target className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm">Simulados vs. Nota de Corte</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Registre cada simulado realizado e veja se você já ultrapassou o ponto de corte almejado para a sua especialidade médica.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card space-y-2.5">
              <div className="h-9 w-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                <Smartphone className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm">Instalável como App (PWA)</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Adicione à tela inicial do seu celular (iOS e Android) com um toque. Acesse rapidamente no intervalo do plantão sem precisar abrir o navegador.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card space-y-2.5">
              <div className="h-9 w-9 rounded-xl bg-pink-500/15 text-pink-400 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm">Privacidade Total e RLS</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Banco de dados seguro com Row Level Security. Seus simulados, notas e cronogramas ficam 100% isolados no seu perfil.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card space-y-2.5">
              <div className="h-9 w-9 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center">
                <Zap className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm">Resistência a Dias Sem Estudo</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Teve semana de prova ou plantão pesado? O sistema não te pune com avalanches. As pendências são redistribuídas em ondas administráveis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO PLANOS E PREÇOS COM STRIPE */}
      <section id="planos" className="py-16 md:py-24">
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

          {isContractInactive && (
            <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-200 text-center space-y-1.5 animate-in zoom-in-95 shadow-xl shadow-amber-500/10">
              <p className="font-bold text-base text-amber-300">
                Você não tem contrato finalizado.
              </p>
              <p className="text-xs text-muted-foreground">
                Escolha o plano mensal ou anual abaixo para finalizar seu contrato e liberar imediatamente seu acesso à plataforma.
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-center">
            {/* PLANO MENSAL */}
            <Card className="border-border bg-card/70 shadow-lg relative">
              <CardHeader className="space-y-1">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Flexibilidade Total
                </div>
                <CardTitle className="text-2xl font-black">Plano Mensal</CardTitle>
                <CardDescription className="text-xs">
                  Acesso completo à repetição espaçada e análise das 5 grandes áreas.
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
                    <span>Todas as bancas do Nordeste e Sudeste</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>Dashboard de métricas das 5 Grandes Áreas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>Módulo de registro e metas de simulados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>Acesso pelo celular e computador (PWA)</span>
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
      <section id="faq" className="py-16 md:py-24 bg-muted/20 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black">Perguntas Frequentes</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Tire suas dúvidas sobre o funcionamento do AdaptiveMed.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
              <h3 className="font-bold text-sm text-foreground">
                Estou nos primeiros anos de medicina, a plataforma já serve para mim?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Com certeza. Você pode selecionar o ano da sua prova no cadastro (2028, 2029, 2030+). O sistema permitirá que você cadastre os temas estudados na faculdade e mantenha revisões contínuas para chegar no internato com uma base sólida incomparável.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
              <h3 className="font-bold text-sm text-foreground">
                Como as bancas do Nordeste são tratadas na plataforma?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                O AdaptiveMed foi projetado com seletor e suporte especial para as bancas do Nordeste (ENARE, SES-PE, SURCE, PSU-BA, PSU-AL, UFRN, etc.), além das tradicionais de São Paulo (USP, UNICAMP, SUS-SP).
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
              <h3 className="font-bold text-sm text-foreground">
                Como funciona a demonstração da plataforma?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Você pode clicar em &quot;Área do Aluno&quot; e utilizar o login especial <strong>admin123</strong> com senha <strong>admin123</strong> para explorar a plataforma completa com dados médicos simulados em tempo real antes de assinar.
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
