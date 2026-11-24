import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { HeroBackground } from '@/components/landing/hero-background';
import {
  LandingHeaderAuth,
  LandingNoticeBanner,
  LandingPlanCta,
} from '@/components/landing/landing-header-auth';
import { PerspectiveDashboardMockup } from '@/components/landing/perspective-dashboard-mockup';
import { FsrsLiveSimulator } from '@/components/landing/fsrs-live-simulator';
import { InteractiveDemoShowcase } from '@/components/landing/interactive-demo-showcase';
import { AnimatedBeamBento } from '@/components/landing/animated-beam-bento';
import {
  buildSoftwareApplicationJsonLd,
  buildFaqJsonLd,
} from '@/lib/seo/json-ld';
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
  GraduationCap,
  BookOpen,
} from 'lucide-react';

export const metadata: Metadata = {
  title: {
    absolute: 'AdaptiveMed — Repetição Espaçada FSRS-6 para Residência Médica',
  },
  description:
    'Plataforma de repetição espaçada adaptativa (FSRS-6) para Residência Médica e Revalida. Organize revisões R1 a R8, caderno de erros inteligente, simulados e temas prevalentes do ENARE, USP-SP, SUS-SP, SES-PE e PSU-BA.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    siteName: 'AdaptiveMed',
    title: 'AdaptiveMed — Repetição Espaçada FSRS-6 para Residência Médica',
    description:
      'Transforme seu estudo para Residência Médica com algoritmo FSRS-6, caderno de erros estruturado, rebalanceamento em 1 clique e temas prevalentes por banca.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const FAQ_ITEMS: Array<{ question: string; answer: string }> = [
  {
    question:
      'O AdaptiveMed substitui meu cursinho (Medcurso, Estratégia, Sanar, Medcel)?',
    answer:
      'Não — ele potencializa o seu cursinho. Você continua assistindo às aulas e resolvendo questões na sua plataforma favorita e registra seus acertos em 10 segundos no AdaptiveMed. O motor FSRS-6 calcula exatamente quando e quantas questões revisar de cada assunto até a prova.',
  },
  {
    question:
      'Como funciona o algoritmo FSRS-6 comparado a revisões fixas (1-7-15-30)?',
    answer:
      'Cronogramas fixos tratam um tema em que você tirou 95% igual a um tema em que tirou 52%. O FSRS-6 (Free Spaced Repetition Scheduler) mede dificuldade e estabilidade da sua memória a cada revisão R0..R8 e ajusta intervalos e volume de questões dinamicamente até a data da sua prova.',
  },
  {
    question:
      'E se eu atrasar revisões em uma semana puxada de internato ou plantão?',
    answer:
      'Você nunca fica refém de uma bola de neve. Na Grade Semanal, o botão "Rebalancear Atrasados" redistribui automaticamente todas as revisões pendentes para os próximos dias disponíveis respeitando sua cota máxima diária.',
  },
  {
    question:
      'Consigo levar meu cronograma para o Google Calendar, Apple Calendar ou planilhas?',
    answer:
      'Sim. Em 1 clique você exporta todas as próximas revisões para arquivos .ics (compatível com Google Calendar, Apple Calendar e Outlook) e também baixa relatórios completos de revisões e simulados em .csv.',
  },
  {
    question: 'Posso cancelar quando quiser? Há fidelidade?',
    answer:
      'Sem fidelidade ou multa. Tanto no Plano Mensal (R$ 7,99/mês) quanto no Plano Anual (R$ 69,90/ano), você gerencia ou cancela sua assinatura direto na página Minha Conta pelo portal seguro da Stripe.',
  },
];

const POPULAR_BANCAS = [
  {
    slug: 'enare',
    name: 'ENARE',
    region: 'Nacional (Ebserh)',
    summary:
      'Exame Nacional de Residência com foco nas 5 grandes áreas e diretrizes atualizadas do SUS e Ministério da Saúde.',
  },
  {
    slug: 'usp-sp',
    name: 'USP-SP',
    region: 'São Paulo',
    summary:
      'Questões de raciocínio clínico aprofundado, casos integrados e alta exigência em condutas hospitalares.',
  },
  {
    slug: 'sus-sp',
    name: 'SUS-SP',
    region: 'São Paulo',
    summary:
      'Concorrência elevada em rede estadual, combinando prevalência clássica e pegadinhas objetivas em urgência e ambulatório.',
  },
  {
    slug: 'ses-pe',
    name: 'SES-PE',
    region: 'Pernambuco',
    summary:
      'Principal processo seletivo do Nordeste com forte cobrança de saúde pública, doenças infecciosas e manejo obstétrico.',
  },
  {
    slug: 'psu-ba',
    name: 'PSU-BA',
    region: 'Bahia',
    summary:
      'Processo Seletivo Unificado da Bahia com foco em situações-problema clínicas e raciocínio passo a passo.',
  },
  {
    slug: 'revalida',
    name: 'Revalida',
    region: 'INEP • Nacional',
    summary:
      'Exame de revalidação de diplomas médicos cobrindo atenção primária, urgências e protocolos oficiais brasileiros.',
  },
] as const;

function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export default function LandingPage() {
  const softwareAppJsonLd = buildSoftwareApplicationJsonLd();
  const faqJsonLd = buildFaqJsonLd(FAQ_ITEMS);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/25 selection:text-primary overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(softwareAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJsonLd) }}
      />

      {/* NAVBAR FIXO */}
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-3">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0 min-w-0">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 text-white stroke-[2.2]" />
            </div>
            <span className="text-[15px] sm:text-xl font-black tracking-tight truncate">AdaptiveMed</span>
          </Link>

          <nav
            aria-label="Navegação principal"
            className="hidden lg:flex items-center gap-5 text-xs font-semibold text-muted-foreground"
          >
            <Link href="/bancas" className="hover:text-foreground transition-colors">
              Bancas
            </Link>
            <Link href="/guias" className="hover:text-foreground transition-colors">
              Guias
            </Link>
            <Link href="/metodologia" className="hover:text-foreground transition-colors">
              Metodologia
            </Link>
            <a href="#simulador" className="hover:text-foreground transition-colors">
              Simulador FSRS-6
            </a>
            <a href="#vitrine" className="hover:text-foreground transition-colors">
              Demo ao Vivo
            </a>
            <a href="#planos" className="hover:text-foreground transition-colors">
              Planos & Preços
            </a>
          </nav>

          <LandingHeaderAuth />
        </div>
      </header>

      <main className="flex-1">
        {/* BANNERS DE STATUS / REDIRECIONAMENTO (ILHA CLIENT COOKIE-GATED) */}
        <LandingNoticeBanner />

        {/* SEÇÃO 1: HERO MOBILE-FIRST (CSS/SVG NO MOBILE, WEBGL IDLE NO DESKTOP) */}
        <section className="relative pt-14 pb-16 sm:pt-20 sm:pb-24 border-b border-border/60 overflow-hidden">
          <HeroBackground />

          {/* Gradiente sutil para legibilidade do texto */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none bg-gradient-to-b from-background/55 via-background/35 to-background"
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/35 bg-primary/10 text-primary text-xs font-bold tracking-wide backdrop-blur-md">
                <BrainCircuit className="h-3.5 w-3.5" />
                <span>Motor Cognitivo FSRS-6 • Residência Médica & Revalida</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-foreground">
                Repetição Espaçada para{' '}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 dark:from-blue-500 dark:via-indigo-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  Residência Médica
                </span>{' '}
                sem acumular revisões.
              </h1>

              <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                O AdaptiveMed calcula o dia exato de cada revisão (R1 a R8) com o algoritmo científico FSRS-6, ajusta sua bateria de questões pelo rendimento real, organiza seu Caderno de Erros e rebalanceia atrasos em 1 clique.
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
                  className="w-full sm:w-auto h-12 px-6 text-sm font-bold gap-2 bg-card/95 text-foreground border border-border hover:bg-muted shadow-sm backdrop-blur-md"
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

            {/* Mockup em Perspectiva 3D CSS Puro (zero framer-motion) */}
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

        {/* SEÇÃO 4: ARQUITETURA ANIMATED BEAM + BENTO GRID */}
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

        {/* SEÇÃO 5: BANCAS DE RESIDÊNCIA MÉDICA & CONTEÚDO ESTRATÉGICO */}
        <section id="bancas" className="py-16 sm:py-24 border-b border-border/60 bg-muted/15">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <Badge variant="outline" className="text-xs font-bold gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30">
                <GraduationCap className="h-3.5 w-3.5" /> Estratégia por Instituição
              </Badge>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
                Prepare-se com foco nas principais bancas de Residência Médica
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Consulte o perfil de cobrança, os temas mais prevalentes e a estratégia de revisões espaçadas para o edital da sua banca-alvo.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {POPULAR_BANCAS.map(banca => (
                <Link
                  key={banca.slug}
                  href={`/bancas/${banca.slug}`}
                  className="group rounded-2xl border border-border/80 bg-card/90 p-5 flex flex-col justify-between gap-4 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-extrabold text-foreground group-hover:text-primary transition-colors">
                        {banca.name}
                      </h3>
                      <Badge variant="outline" className="text-[10px] font-semibold">
                        {banca.region}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {banca.summary}
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                    Ver temas prevalentes e estratégia
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" asChild className="font-bold text-xs gap-1.5">
                <Link href="/bancas">
                  <GraduationCap className="h-3.5 w-3.5 text-primary" />
                  Explorar todas as bancas
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="font-bold text-xs gap-1.5">
                <Link href="/guias">
                  <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                  Ler guias de estudo para R1
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="font-bold text-xs gap-1.5">
                <Link href="/metodologia">
                  <BrainCircuit className="h-3.5 w-3.5 text-indigo-500" />
                  Entender a metodologia FSRS-6
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* SEÇÃO 6: PLANOS & PREÇOS TRANSPARENTES */}
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
                  <LandingPlanCta
                    planId="monthly"
                    label="Assinar Plano Mensal"
                    variant="outline"
                    className="w-full h-11 font-bold text-sm border-primary/40 hover:bg-primary/10 gap-2"
                  />
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
                        Equivale a R$ 5,82/mês
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
                  <LandingPlanCta
                    planId="annual"
                    label="Assinar Plano Anual — R$ 69,90"
                    className="w-full h-11 font-extrabold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-primary/25 gap-2"
                  />
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

        {/* SEÇÃO 7: FAQ 100% SSR EM <details>/<summary> COM PARIDADE JSON-LD */}
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
              {FAQ_ITEMS.map((item, idx) => (
                <details
                  key={item.question}
                  open={idx === 0}
                  className="group rounded-2xl border border-border bg-card overflow-hidden transition-colors"
                >
                  <summary className="list-none cursor-pointer w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors [&::-webkit-details-marker]:hidden">
                    <h3 className="text-xs sm:text-sm font-bold text-foreground">
                      {item.question}
                    </h3>
                    <ChevronDown
                      aria-hidden="true"
                      className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 group-open:rotate-180 group-open:text-primary"
                    />
                  </summary>
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border/80 bg-card/40 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6 text-xs text-muted-foreground">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center shrink-0">
                <Stethoscope className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-foreground">AdaptiveMed</span>
              <span>• Repetição Espaçada FSRS-6 para Residência Médica</span>
            </div>

            <nav aria-label="Links do rodapé" className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link href="/bancas" className="hover:text-foreground transition-colors">
                Bancas
              </Link>
              <Link href="/guias" className="hover:text-foreground transition-colors">
                Guias
              </Link>
              <Link href="/metodologia" className="hover:text-foreground transition-colors">
                Metodologia
              </Link>
              <a href="#planos" className="hover:text-foreground transition-colors">
                Planos
              </a>
              <Link href="/login" className="hover:text-foreground transition-colors">
                Entrar
              </Link>
              <Link href="/signup" className="hover:text-foreground transition-colors">
                Criar Conta
              </Link>
              <Link href="/privacidade" className="hover:text-foreground transition-colors">
                Privacidade
              </Link>
              <Link href="/termos" className="hover:text-foreground transition-colors">
                Termos
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
