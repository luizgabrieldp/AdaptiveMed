import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CalendarClock,
  FlaskConical,
  GraduationCap,
  Layers,
  Scale,
  Sliders,
} from 'lucide-react';
import { PublicShell } from '@/components/seo/public-shell';
import { LAST_CONTENT_UPDATE, SITE_NAME } from '@/lib/seo/site';
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from '@/lib/seo/json-ld';

const PAGE_TITLE = 'Metodologia Científica: FSRS-6, Cepeda, Bjork e Interleaving';
const PAGE_DESCRIPTION =
  'Conheça os fundamentos científicos do motor adaptativo do AdaptiveMed: FSRS-6 com retenção de 90%, horizonte até a prova (Cepeda et al., 2008), Dificuldades Desejáveis (Bjork & Bjork), Interleaving (Rohrer & Taylor) e Peso da Causa do Erro.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: [
    'metodologia AdaptiveMed',
    'FSRS-6 residência médica',
    'Cepeda 2008 espaçamento ótimo',
    'Dificuldades Desejáveis Bjork',
    'Interleaving Rohrer Taylor',
    'peso caderno de erros FSRS',
  ],
  alternates: {
    canonical: '/metodologia',
  },
  openGraph: {
    type: 'article',
    locale: 'pt_BR',
    url: '/metodologia',
    siteName: SITE_NAME,
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    publishedTime: LAST_CONTENT_UPDATE,
    modifiedTime: LAST_CONTENT_UPDATE,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: `${PAGE_TITLE} | ${SITE_NAME}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    images: ['/twitter-image'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

function formatDatePtBr(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export default function MetodologiaPage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Início', path: '/' },
    { name: 'Metodologia Científica', path: '/metodologia' },
  ]);

  const articleJsonLd = buildArticleJsonLd({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    urlPath: '/metodologia',
    datePublished: LAST_CONTENT_UPDATE,
    dateModified: LAST_CONTENT_UPDATE,
    keywords: [
      'FSRS-6',
      'Cepeda 2008',
      'Bjork & Bjork',
      'Rohrer & Taylor',
      'Interleaving',
      'Residência Médica',
    ],
  });

  return (
    <PublicShell
      breadcrumbs={[
        { name: 'Início', href: '/' },
        { name: 'Metodologia Científica' },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleJsonLd) }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
        {/* Hero */}
        <header className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-sm space-y-5 relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
          />
          <div className="relative space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Base Científica &amp; Arquitetura do Algoritmo</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-tight">
              A ciência cognitiva por trás do motor {SITE_NAME}
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
              Diferente de cronogramas arbitrários de 1-7-15-30 dias, cada decisão de agendamento,
              volume de questões e ordenação da fila no {SITE_NAME} é ancorada em modelos
              psicométricos validados e literatura peer-reviewed sobre memória de longo prazo.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold text-muted-foreground pt-1">
              <span className="rounded-lg border border-border bg-muted/60 px-3 py-1.5 text-foreground">
                FSRS-6 (ts-fsrs) • Retenção alvo 90%
              </span>
              <span className="rounded-lg border border-border bg-muted/60 px-3 py-1.5">
                Última revisão técnica:{' '}
                <time dateTime={LAST_CONTENT_UPDATE}>{formatDatePtBr(LAST_CONTENT_UPDATE)}</time>
              </span>
            </div>
          </div>
        </header>

        {/* Índice Rápido */}
        <nav
          aria-label="Seções da metodologia"
          className="rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-3">
            Os 5 pilares científicos do algoritmo
          </p>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-sm">
            {[
              { href: '#fsrs-6', label: '01. Motor FSRS-6 (Modelo DSR)' },
              { href: '#cepeda-horizonte', label: '02. Horizonte até a Prova (Cepeda, 2008)' },
              { href: '#bjork-volume', label: '03. Dificuldades Desejáveis & Volume' },
              { href: '#interleaving', label: '04. Interleaving (Rohrer & Taylor)' },
              { href: '#peso-erros', label: '05. Peso da Causa do Erro no FSRS' },
              { href: '#referencias', label: '06. Referências Bibliográficas' },
            ].map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="block rounded-xl border border-border/80 bg-muted/40 px-3.5 py-2.5 font-semibold text-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Pilar 1: FSRS-6 */}
        <section id="fsrs-6" className="scroll-mt-24 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <BrainCircuit className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              1. Motor FSRS-6 (Free Spaced Repetition Scheduler)
            </h2>
          </div>

          <p className="text-base text-foreground/90 leading-relaxed">
            O FSRS-6 representa o estado da arte em repetição espaçada baseada no modelo{' '}
            <strong className="font-bold text-foreground">
              DSR (Difficulty, Stability, Retrievability)
            </strong>
            . Em vez de aplicar multiplicadores rígidos ou datas fixas, o algoritmo acompanha três
            variáveis contínuas para cada assunto médico cadastrado:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
              <h3 className="text-base font-extrabold text-foreground">Estabilidade (S)</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Intervalo em dias necessário para que a probabilidade de recuperação daquele assunto
                caia de 100% para 90%. Cresce a cada revisão bem-sucedida e recua diante de lapsos.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
              <h3 className="text-base font-extrabold text-foreground">Dificuldade (D)</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Complexidade intrínseca percebida por você naquele tema (ex.: Glomerulopatias vs
                Pré-Natal). Temas com dificuldade alta ganham estabilidade mais lentamente.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
              <h3 className="text-base font-extrabold text-foreground">Recuperabilidade (R)</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Probabilidade instantânea de acerto levando em conta o tempo real decorrido desde a
                última revisão (<code className="font-mono text-xs text-primary">actualElapsedDays</code>).
              </p>
            </div>
          </div>

          <p className="text-base text-foreground/90 leading-relaxed">
            No {SITE_NAME}, o scheduler opera em modo de longo prazo (
            <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
              request_retention = 0.90
            </code>
            ,{' '}
            <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
              enable_short_term = false
            </code>
            ) traduzindo o percentual de acerto de cada bateria de questões diretamente para as 4
            notas oficiais do FSRS-6. Os ciclos <strong className="font-bold text-foreground">R0 até R8</strong>{' '}
            são estritamente monotônicos (desacoplados da estabilidade), preservando o histórico
            completo mesmo quando ocorre uma recaída.
          </p>

          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-border bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Tradução de Acurácia para Ratings FSRS-6 no {SITE_NAME}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <caption className="sr-only">
                  Tradução de Acurácia para Ratings FSRS-6 no {SITE_NAME}
                </caption>
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th scope="col" className="px-4 py-3 font-bold text-foreground">
                      Faixa de Acerto
                    </th>
                    <th scope="col" className="px-4 py-3 font-bold text-foreground">
                      Rating FSRS-6
                    </th>
                    <th scope="col" className="px-4 py-3 font-bold text-foreground">
                      Comportamento do Agendamento
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-foreground">&lt; 50%</td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-red-600 dark:text-red-400">
                      Rating.Again (Lapse)
                    </td>
                    <td className="px-4 py-3 text-foreground/85 leading-relaxed">
                      Reduz a estabilidade e agenda reteste corretivo em 48h (2 dias) para conter o
                      esquecimento imediatamente.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-foreground">50% a 69,9%</td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                      Rating.Hard
                    </td>
                    <td className="px-4 py-3 text-foreground/85 leading-relaxed">
                      Eleva a dificuldade do card e encurta a expansão do intervalo, mantendo o
                      assunto próximo na fila.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-foreground">70% a 89,9%</td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Rating.Good
                    </td>
                    <td className="px-4 py-3 text-foreground/85 leading-relaxed">
                      Expansão nominal de estabilidade dentro da zona de consolidação sólida.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-foreground">&ge; 90%</td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      Rating.Easy
                    </td>
                    <td className="px-4 py-3 text-foreground/85 leading-relaxed">
                      Bônus de estabilidade e intervalo alongado (respeitando o teto até a prova),
                      liberando carga horária para temas frágeis.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Pilar 2: Cepeda et al. 2008 */}
        <section id="cepeda-horizonte" className="scroll-mt-24 pt-6 border-t border-border space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <CalendarClock className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              2. Horizonte até a Prova (Cepeda et al., 2008)
            </h2>
          </div>

          <p className="text-base text-foreground/90 leading-relaxed">
            Em um estudo clássico publicado na <em>Psychological Science</em> (2008), Nicholas
            Cepeda e colaboradores demonstraram que o intervalo ótimo entre revisões (<em>interstudy
            interval — ISI</em>) depende diretamente do intervalo de retenção desejado até o teste
            final (<em>retention interval — RI</em>), situando-se tipicamente entre{' '}
            <strong className="font-bold text-foreground">10% e 20% do tempo restante até a prova</strong>.
          </p>

          <p className="text-base text-foreground/90 leading-relaxed">
            Em softwares genéricos de flashcards, uma revisão com bom desempenho em julho pode ser
            jogada para 140 dias depois — caindo após as provas de novembro. No {SITE_NAME}, o
            parâmetro <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">maximum_interval</code>{' '}
            do FSRS-6 é modulado dinamicamente pelo ano-alvo da sua prova:
          </p>

          <div className="rounded-2xl border border-border bg-muted/40 p-5 font-mono text-xs sm:text-sm text-foreground space-y-1.5 overflow-x-auto">
            <p className="font-bold text-primary">
              teto_dias = min(90, max(14, round(dias_ate_a_prova × 0.20)))
            </p>
            <p className="text-muted-foreground">
              • A 300 dias da prova: teto = 60 dias • A 120 dias da prova: teto = 24 dias • Reta final (1 a 70 dias): piso de 14 dias • Sem ano-alvo configurado: padrão de 75 dias • Data-alvo já atingida (&le; 0 dias): 21 dias.
            </p>
          </div>
        </section>

        {/* Pilar 3: Bjork & Bjork */}
        <section id="bjork-volume" className="scroll-mt-24 pt-6 border-t border-border space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Sliders className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              3. Dificuldades Desejáveis &amp; Volume Dinâmico (Bjork &amp; Bjork)
            </h2>
          </div>

          <p className="text-base text-foreground/90 leading-relaxed">
            Robert e Elizabeth Bjork formularam o conceito de{' '}
            <strong className="font-bold text-foreground">Dificuldades Desejáveis</strong>: o
            aprendizado de longo prazo é maximizado quando a tarefa exige esforço produtivo de
            recuperação — nem fácil demais a ponto de gerar <em>overlearning</em> com retorno
            decrescente (Rohrer &amp; Pashler, 2007), nem tão esmagador a ponto de causar fadiga
            cognitiva improdutiva.
          </p>

          <p className="text-base text-foreground/90 leading-relaxed">
            Por isso o {SITE_NAME} não manda você fazer sempre 30 questões em toda revisão. O volume
            recomendado segue uma curva gaussiana contínua centrada em{' '}
            <strong className="font-bold text-foreground">60% de acerto</strong> (pico de esforço
            produtivo), com piso de <strong className="font-bold text-foreground">10 questões</strong>{' '}
            e teto de <strong className="font-bold text-foreground">30 questões</strong>:
          </p>

          <div className="rounded-2xl border border-border bg-muted/40 p-5 font-mono text-xs sm:text-sm text-foreground overflow-x-auto">
            Fator(acurácia) = 0,25 + 0,42 × exp( −(acurácia − 60)² / (2 × 25²) )
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-border bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              As 5 Faixas de Diagnóstico Pedagógico no {SITE_NAME}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <caption className="sr-only">
                  As 5 Faixas de Diagnóstico Pedagógico no {SITE_NAME}
                </caption>
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th scope="col" className="px-4 py-3 font-bold text-foreground">
                      Acurácia
                    </th>
                    <th scope="col" className="px-4 py-3 font-bold text-foreground">
                      Diagnóstico
                    </th>
                    <th scope="col" className="px-4 py-3 font-bold text-foreground">
                      Racional Pedagógico
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-foreground">&lt; 50%</td>
                    <td className="px-4 py-3 font-semibold text-foreground">Ruptura Crítica (Lapse)</td>
                    <td className="px-4 py-3 text-foreground/85">
                      Bloco corretivo enxuto para retestar erros em 48h sem fadiga cognitiva.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-foreground">50% a 69,9%</td>
                    <td className="px-4 py-3 font-semibold text-foreground">Retenção Instável</td>
                    <td className="px-4 py-3 text-foreground/85">
                      Pico de volume para treinar diferenciação diagnóstica e eliminação de distratores.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-foreground">70% a 84,9%</td>
                    <td className="px-4 py-3 font-semibold text-foreground">Dificuldade Desejável</td>
                    <td className="px-4 py-3 text-foreground/85">
                      Amostragem equilibrada na zona ideal de consolidação de memória.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-foreground">85% a 94,9%</td>
                    <td className="px-4 py-3 font-semibold text-foreground">Fixação Sólida</td>
                    <td className="px-4 py-3 text-foreground/85">
                      Validação rápida para comprovar retenção estável sem sobrecarga.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-foreground">&ge; 95%</td>
                    <td className="px-4 py-3 font-semibold text-foreground">Domínio Pleno</td>
                    <td className="px-4 py-3 text-foreground/85">
                      Micro-checagem pontual (anti-overlearning) para redirecionar tempo a áreas fracas.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Pilar 4: Interleaving */}
        <section id="interleaving" className="scroll-mt-24 pt-6 border-t border-border space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Layers className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              4. Interleaving de Grandes Áreas (Rohrer &amp; Taylor, 2007)
            </h2>
          </div>

          <p className="text-base text-foreground/90 leading-relaxed">
            Estudos conduzidos por Doug Rohrer e Kelli Taylor (2007) e por Nate Kornell e Robert
            Bjork (2008) mostraram que alternar categorias de problemas dentro da mesma sessão
            (<em>interleaved practice</em>) supera consistentemente a prática em blocos homogêneos (
            <em>blocked practice</em>) em testes posteriores de discriminação.
          </p>

          <p className="text-base text-foreground/90 leading-relaxed">
            Na prova de Residência Médica, as questões exigem alternar raciocínio clínico entre
            Clínica Médica, Cirurgia Geral, Ginecologia e Obstetrícia, Pediatria e Medicina
            Preventiva. O algoritmo <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">interleaveQueueByArea</code>{' '}
            do {SITE_NAME} reordena automaticamente a sua fila diária priorizada para evitar blocos
            consecutivos da mesma Grande Área sempre que existir outra área pendente naquele dia.
          </p>
        </section>

        {/* Pilar 5: Peso da Causa do Erro */}
        <section id="peso-erros" className="scroll-mt-24 pt-6 border-t border-border space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Scale className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              5. Peso da Causa do Erro no Agendamento FSRS-6
            </h2>
          </div>

          <p className="text-base text-foreground/90 leading-relaxed">
            Apenas medir percentual de acerto esconde a natureza do erro: errar por desconhecer um
            critério diagnóstico exige uma intervenção muito mais intensa do que errar por leitura
            apressada no fim de um plantão. Por isso, o Caderno de Erros do {SITE_NAME} é acoplado
            diretamente ao cálculo da próxima revisão FSRS-6 para todos os erros ainda ativos daquele
            assunto:
          </p>

          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <caption className="sr-only">
                  Peso da causa registrada no Caderno de Erros sobre o agendamento FSRS-6
                </caption>
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th scope="col" className="px-4 py-3 font-bold text-foreground">
                      Causa Registrada
                    </th>
                    <th scope="col" className="px-4 py-3 font-bold text-foreground">
                      Multiplicador no Intervalo
                    </th>
                    <th scope="col" className="px-4 py-3 font-bold text-foreground">
                      Questões Extras
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-foreground">Lacuna teórica</td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">× 0,78 (−22% no intervalo)</td>
                    <td className="px-4 py-3 text-foreground/85">+3 questões</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-foreground">Interpretação</td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">× 0,88 (−12% no intervalo)</td>
                    <td className="px-4 py-3 text-foreground/85">+2 questões</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-foreground">Pegadinha da banca</td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">× 0,92 (−8% no intervalo)</td>
                    <td className="px-4 py-3 text-foreground/85">+1 questão</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-foreground">Distração</td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">× 0,98 (−2% no intervalo)</td>
                    <td className="px-4 py-3 text-foreground/85">0 questões extras</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <aside className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 flex items-start gap-3">
            <AlertCircle
              className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="space-y-1 text-sm text-foreground/90 leading-relaxed">
              <p className="font-extrabold text-foreground">
                Limites de segurança anti-sobrecarga e rebalanceamento
              </p>
              <p>
                Os pesos de múltiplos erros ativos são combinados com piso multiplicador de{' '}
                <strong>0,55</strong> (compressão máxima de 45% no intervalo) e teto de{' '}
                <strong>+8 questões bônus</strong> (nunca ultrapassando 30 questões/revisão). Além
                disso, o controle de cota máxima diária e o botão &ldquo;Rebalancear Atrasados&rdquo;
                no Diário Semanal impedem acúmulo de passivos em semanas de plantão.
              </p>
            </div>
          </aside>
        </section>

        {/* Referências */}
        <section id="referencias" className="scroll-mt-24 pt-6 border-t border-border space-y-4">
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
            6. Referências Bibliográficas
          </h2>
          <ol className="space-y-2.5 text-sm text-muted-foreground leading-relaxed list-decimal pl-5">
            <li>
              <strong className="text-foreground">Cepeda, N. J., Vul, E., Rohrer, D., Wixted, J. T., &amp; Pashler, H. (2008).</strong>{' '}
              Spacing effects in learning: A temporal ridgeline of optimal retention.{' '}
              <em>Psychological Science</em>, 19(11), 1095–1102.
            </li>
            <li>
              <strong className="text-foreground">Bjork, E. L., &amp; Bjork, R. A. (2011).</strong>{' '}
              Making things hard on yourself, but in a good way: Creating desirable difficulties to
              enhance learning. In <em>Psychology and the Real World</em> (pp. 56–64). Worth
              Publishers.
            </li>
            <li>
              <strong className="text-foreground">Rohrer, D., &amp; Taylor, K. (2007).</strong>{' '}
              The shuffling of mathematics problems improves learning.{' '}
              <em>Instructional Science</em>, 35(6), 481–498.
            </li>
            <li>
              <strong className="text-foreground">Kornell, N., &amp; Bjork, R. A. (2008).</strong>{' '}
              Learning concepts and categories: Is spacing the &ldquo;enemy of induction&rdquo;?{' '}
              <em>Psychological Science</em>, 19(6), 585–592.
            </li>
            <li>
              <strong className="text-foreground">Rohrer, D., &amp; Pashler, H. (2007).</strong>{' '}
              Increasing retention without increasing study time.{' '}
              <em>Current Directions in Psychological Science</em>, 16(4), 183–186.
            </li>
            <li>
              <strong className="text-foreground">Ye, J. et al. / Open Spaced Repetition.</strong>{' '}
              FSRS (Free Spaced Repetition Scheduler) — A stochastic shortest path algorithm and DSR
              memory model for optimizing spaced repetition (implementação baseada em{' '}
              <code className="font-mono text-xs">ts-fsrs</code>).
            </li>
          </ol>
        </section>

        {/* CTA & Interlinking */}
        <section className="rounded-3xl border border-primary/25 bg-gradient-to-br from-blue-600/10 via-indigo-600/10 to-emerald-500/10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              Experimente a metodologia aplicada às suas provas
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Leia os guias práticos ou comece agora a organizar seu cronograma adaptativo para
              Residência Médica.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md transition-all"
            >
              <span>Começar Agora</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/guias"
              className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-bold border border-border bg-card text-foreground hover:bg-muted transition-colors"
            >
              <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Guias Práticos</span>
            </Link>
            <Link
              href="/bancas"
              className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-bold border border-border bg-card text-foreground hover:bg-muted transition-colors"
            >
              <GraduationCap className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Bancas</span>
            </Link>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
