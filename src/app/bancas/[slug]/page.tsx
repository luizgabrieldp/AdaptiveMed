import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  Compass,
  Flame,
  HelpCircle,
  Layers,
  MapPin,
  Sparkles,
  Target,
} from 'lucide-react';
import { PublicShell } from '@/components/seo/public-shell';
import {
  AREA_VISUAL_STYLE,
  BANCAS_SEO,
  RELATED_GUIA_META,
  formatRegionLabel,
  getBancaArticles,
  getBancaBySlug,
  type BancaSeoEntry,
} from '@/lib/seo/bancas';
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
} from '@/lib/seo/json-ld';
import { SITE_NAME, absoluteUrl } from '@/lib/seo/site';

interface BancaPageProps {
  params: Promise<{ slug: string }>;
}

function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function formatPtBrDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

export function generateStaticParams(): Array<{ slug: string }> {
  return BANCAS_SEO.map((banca) => ({ slug: banca.slug }));
}

export async function generateMetadata({
  params,
}: BancaPageProps): Promise<Metadata> {
  const { slug } = await params;
  const banca = getBancaBySlug(slug);

  if (!banca) {
    return {
      title: 'Banca não encontrada',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonicalPath = `/bancas/${banca.slug}`;
  const isRevalida = banca.slug === 'revalida';

  return {
    title: banca.title,
    description: banca.description,
    keywords: [
      banca.shortName,
      isRevalida
        ? 'Revalida INEP revalidação de diploma médico'
        : `${banca.shortName} residência médica`,
      `temas que mais caem ${banca.shortName}`,
      `nota de corte ${banca.shortName}`,
      `como estudar ${banca.shortName}`,
      isRevalida
        ? 'repetição espaçada Revalida INEP'
        : 'repetição espaçada residência médica',
      'FSRS-6',
      SITE_NAME,
    ],
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: 'article',
      locale: 'pt_BR',
      siteName: SITE_NAME,
      url: canonicalPath,
      title: `${banca.title} | ${SITE_NAME}`,
      description: banca.description,
      publishedTime: banca.lastModified,
      modifiedTime: banca.lastModified,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${banca.title} | ${SITE_NAME}`,
      description: banca.description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function BancaDetailPage({ params }: BancaPageProps) {
  const { slug } = await params;
  const banca = getBancaBySlug(slug);

  if (!banca) {
    notFound();
  }

  const canonicalPath = `/bancas/${banca.slug}`;
  const regionLabel = formatRegionLabel(banca.region);
  const g = getBancaArticles(banca);
  const isRevalida = banca.slug === 'revalida';

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Início', path: '/' },
    { name: 'Bancas de Residência', path: '/bancas' },
    { name: banca.shortName, path: canonicalPath },
  ]);

  const faqJsonLd = buildFaqJsonLd(banca.faqs);

  const articleJsonLd: Record<string, unknown> = {
    ...buildArticleJsonLd({
      title: banca.title,
      description: banca.description,
      urlPath: canonicalPath,
      datePublished: banca.lastModified,
      dateModified: banca.lastModified,
      keywords: [
        banca.shortName,
        banca.name,
        regionLabel,
        isRevalida ? 'Revalidação de Diploma Médico' : 'Residência Médica',
        'Repetição Espaçada FSRS-6',
      ],
    }),
    image: absoluteUrl(`/bancas/${banca.slug}/opengraph-image`),
  };

  const relatedBancaEntries: BancaSeoEntry[] = banca.relatedBancas
    .map((relatedSlug) => getBancaBySlug(relatedSlug))
    .filter((entry): entry is BancaSeoEntry => Boolean(entry));

  return (
    <PublicShell
      breadcrumbs={[
        { name: 'Início', href: '/' },
        { name: 'Bancas de Residência', href: '/bancas' },
        { name: banca.shortName },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleJsonLd) }}
      />

      {/* HERO DA BANCA */}
      <section className="border-b border-border/70 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-6">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/35 bg-blue-500/10 px-3 py-1 text-blue-700 dark:text-blue-300 font-bold">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {regionLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-muted-foreground">
              {banca.organizer}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>
                Atualizado em{' '}
                <time dateTime={banca.lastModified}>
                  {formatPtBrDate(banca.lastModified)}
                </time>
              </span>
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black tracking-tight text-foreground leading-[1.12]">
              {banca.name}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
              {banca.description}
            </p>
          </div>

          {/* RESUMO RÁPIDO EM 3 CARDS */}
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="rounded-2xl border border-border bg-card p-4 space-y-1.5">
              <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ClipboardList className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
                Formato &amp; Questões
              </dt>
              <dd className="text-sm font-bold text-foreground leading-snug">
                {banca.questionCount}
              </dd>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 space-y-1.5">
              <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                Faixa de Corte Histórica
              </dt>
              <dd className="text-sm font-bold text-foreground leading-snug">
                {banca.cutoffRange}
              </dd>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 space-y-1.5">
              <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" aria-hidden="true" />
                Abrangência
              </dt>
              <dd className="text-sm font-bold text-foreground leading-snug">
                {banca.stateOrScope}
              </dd>
            </div>
          </dl>

          {/* AÇÕES PRINCIPAIS + ÂNCORAS */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/20 transition-all"
            >
              <span>Montar cronograma FSRS-6 para {g.art} {banca.shortName}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href="#temas-alta-incidencia"
              className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold border border-border bg-card hover:bg-muted text-foreground transition-colors"
            >
              <Flame className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <span>Ver temas que mais caem</span>
            </a>
            <a
              href="#perguntas-frequentes"
              className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold border border-border bg-card hover:bg-muted text-foreground transition-colors"
            >
              <HelpCircle className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Perguntas frequentes</span>
            </a>
          </div>
        </div>
      </section>

      {/* CORPO EDITORIAL */}
      <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-14">
        {/* 1. PERFIL E FORMATO DA PROVA */}
        <section id="formato-prova" className="scroll-mt-24 space-y-5">
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Análise da Banca
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Como é a prova {g.de} {banca.shortName} na prática
            </h2>
          </div>

          <div className="space-y-4 text-base text-muted-foreground leading-relaxed">
            {banca.profileSummary.map((paragraph, idx) => (
              <p key={idx} className="text-foreground/90 leading-7">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" aria-hidden="true" />
              Estrutura oficial e etapas do exame
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {banca.examFormat}
            </p>
            <p className="text-xs text-muted-foreground/90 pt-1">
              Nota: consulte sempre o edital vigente da edição atual para confirmar datas,
              eventuais alterações de pesos curriculares e lista de instituições participantes.
            </p>
          </div>
        </section>

        {/* 2. DISTRIBUIÇÃO DAS 5 GRANDES ÁREAS */}
        <section id="distribuicao-areas" className="scroll-mt-24 space-y-6">
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
              Peso por Grande Área
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Distribuição das 5 Grandes Áreas {g.em} {banca.shortName}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Além da divisão proporcional das questões, cada banca imprime um perfil clínico
              próprio dentro das cinco áreas clássicas da medicina.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {banca.areaDistribution.map((item) => {
              const style = AREA_VISUAL_STYLE[item.area];
              return (
                <div
                  key={item.area}
                  className="rounded-2xl border border-border bg-card p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`h-2.5 w-2.5 rounded-full shrink-0 ${style.dotClass}`}
                        aria-hidden="true"
                      />
                      <h3 className="text-base font-bold text-foreground">{item.area}</h3>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold tabular-nums ${style.badgeClass}`}
                    >
                      {item.percentage}% da prova
                    </span>
                  </div>

                  <div
                    className="h-2 w-full rounded-full bg-muted overflow-hidden"
                    role="progressbar"
                    aria-valuenow={item.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${item.area}: ${item.percentage}%`}
                  >
                    <div
                      className={`h-full rounded-full ${style.barClass}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.focusNote}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. TEMAS DE ALTA INCIDÊNCIA */}
        <section id="temas-alta-incidencia" className="scroll-mt-24 space-y-6">
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5" aria-hidden="true" />
              Prevalência Clínica &amp; Estratégica
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {banca.topTopics.length} temas que mais caem {g.em} {banca.shortName}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Priorize estes blocos nas suas sessões de questões e garanta estabilidade de memória
              elevada antes de avançar para rodapés de baixa incidência.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banca.topTopics.map((topic, index) => {
              const areaStyle = AREA_VISUAL_STYLE[topic.area];
              const isVeryHigh = topic.incidence === 'Muito Alta';

              return (
                <div
                  key={topic.topic}
                  className="rounded-2xl border border-border bg-card p-5 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${areaStyle.badgeClass}`}
                      >
                        {topic.area}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                          isVeryHigh
                            ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : 'border-border bg-muted text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Incidência {topic.incidence}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-foreground leading-snug">
                      <span className="text-muted-foreground font-mono text-xs mr-2">
                        {String(index + 1).padStart(2, '0')}.
                      </span>
                      {topic.topic}
                    </h3>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {topic.rationale}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. ESTRATÉGIA DE ESTUDO E FSRS-6 */}
        <section id="estrategia-estudo" className="scroll-mt-24 space-y-6">
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <BrainCircuit className="h-3.5 w-3.5" aria-hidden="true" />
              Plano de Revisões Adaptativas
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Estratégia em {banca.studyStrategy.length} passos para pontuar alto {g.em}{' '}
              {banca.shortName}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Como alinhar resolução de provas antigas, caderno de erros e algoritmo FSRS-6 ao
              perfil exato desta banca.
            </p>
          </div>

          <ol className="space-y-4">
            {banca.studyStrategy.map((step) => (
              <li
                key={step.step}
                className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-3"
              >
                <div className="flex items-start gap-3.5">
                  <span className="h-8 w-8 rounded-xl bg-blue-500/15 border border-blue-500/25 text-blue-700 dark:text-blue-300 font-black text-sm flex items-center justify-center shrink-0 tabular-nums">
                    {step.step}
                  </span>
                  <div className="space-y-2 min-w-0">
                    <h3 className="text-base sm:text-lg font-extrabold text-foreground leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs sm:text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed">
                      <span className="font-bold">Na prática com FSRS-6: </span>
                      {step.fsrsAction}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* 5. PERGUNTAS FREQUENTES (SSR <details>/<summary> 1:1 com FAQPage JSON-LD) */}
        <section id="perguntas-frequentes" className="scroll-mt-24 space-y-6">
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Dúvidas Comuns
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Perguntas frequentes sobre {g.art} {banca.shortName}
            </h2>
          </div>

          <div className="space-y-3">
            {banca.faqs.map((faq, idx) => (
              <details
                key={faq.question}
                open={idx === 0}
                className="group rounded-2xl border border-border bg-card overflow-hidden transition-colors open:border-primary/40"
              >
                <summary className="list-none cursor-pointer p-5 flex items-center justify-between gap-4 hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
                  <span className="text-sm sm:text-base font-bold text-foreground leading-snug">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 group-open:rotate-180 group-open:text-primary"
                    aria-hidden="true"
                  />
                </summary>
                <div className="px-5 pb-5 pt-3 border-t border-border/60 text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* 6. GUIAS RELACIONADOS */}
        <section className="space-y-5" aria-labelledby="guias-relacionados">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                Aprofunde seu Método
              </span>
              <h2
                id="guias-relacionados"
                className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground"
              >
                Guias práticos recomendados para quem presta {g.art} {banca.shortName}
              </h2>
            </div>
            <Link
              href="/guias"
              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>Ver todos os guias</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {banca.relatedGuias.map((guiaSlug) => {
              const guia = RELATED_GUIA_META[guiaSlug];
              return (
                <Link
                  key={guiaSlug}
                  href={`/guias/${guiaSlug}`}
                  className="group rounded-2xl border border-border bg-card p-5 flex flex-col justify-between gap-3 hover:border-primary/50 hover:shadow-sm transition-all"
                >
                  <div className="space-y-2">
                    <h3 className="text-sm font-extrabold text-foreground group-hover:text-primary transition-colors leading-snug">
                      {guia.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {guia.summary}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                    <span>Ler guia</span>
                    <ArrowRight
                      className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 7. OUTRAS BANCAS RELACIONADAS */}
        {relatedBancaEntries.length > 0 && (
          <section className="space-y-5" aria-labelledby="bancas-relacionadas">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div className="space-y-1">
                <h2
                  id="bancas-relacionadas"
                  className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground"
                >
                  Outras bancas que combinam com {g.art} {banca.shortName}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Compare o perfil de provas frequentemente prestadas em conjunto pelos candidatos.
                </p>
              </div>
              <Link
                href="/bancas"
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>Ver todas as 10 bancas</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedBancaEntries.map((related) => (
                <Link
                  key={related.slug}
                  href={`/bancas/${related.slug}`}
                  className="group rounded-2xl border border-border bg-card p-4 flex flex-col justify-between gap-3 hover:border-primary/50 hover:shadow-sm transition-all"
                >
                  <div className="space-y-1.5">
                    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {related.region}
                    </span>
                    <h3 className="text-base font-extrabold text-foreground group-hover:text-primary transition-colors">
                      {related.shortName}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                      {related.questionCount}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                    <span>Explorar banca</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA FINAL */}
        <section className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-emerald-500/10 p-6 sm:p-10 space-y-5">
          <div className="space-y-2.5 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Pronto para aplicar na sua rotina
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Deixe o algoritmo FSRS-6 blindar sua memória para {g.art} {banca.shortName}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Registre seus blocos de questões em segundos, acompanhe sua curva de acertos contra a
              nota de corte e elimine revisões atrasadas até o dia da prova.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/20 transition-all"
            >
              <span>Começar Agora</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/metodologia"
              className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold border border-border bg-card hover:bg-muted text-foreground transition-colors"
            >
              <span>Como funciona o FSRS-6</span>
            </Link>
          </div>
        </section>
      </article>
    </PublicShell>
  );
}
