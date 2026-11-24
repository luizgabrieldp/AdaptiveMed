import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  FlaskConical,
  GraduationCap,
  Info,
  Lightbulb,
  ListChecks,
} from 'lucide-react';
import { PublicShell } from '@/components/seo/public-shell';
import {
  BANCA_LINKS_META,
  GUIAS_SEO,
  getGuiaBySlug,
  type GuiaSectionCallout,
} from '@/lib/seo/guias';
import { SITE_NAME, absoluteUrl } from '@/lib/seo/site';
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
} from '@/lib/seo/json-ld';

interface GuiaPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return GUIAS_SEO.map((guia) => ({ slug: guia.slug }));
}

export async function generateMetadata({ params }: GuiaPageProps): Promise<Metadata> {
  const { slug } = await params;
  const guia = getGuiaBySlug(slug);

  if (!guia) {
    return {
      title: 'Guia não encontrado',
      robots: { index: false, follow: false },
    };
  }

  const canonicalPath = `/guias/${guia.slug}`;

  return {
    title: guia.title,
    description: guia.description,
    keywords: guia.keywords,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: 'article',
      locale: 'pt_BR',
      url: canonicalPath,
      siteName: SITE_NAME,
      title: `${guia.title} | ${SITE_NAME}`,
      description: guia.description,
      publishedTime: guia.lastModified,
      modifiedTime: guia.lastModified,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${guia.title} | ${SITE_NAME}`,
      description: guia.description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

function formatDatePtBr(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function CalloutBox({ callout }: { callout: GuiaSectionCallout }) {
  const tone = callout.tone ?? 'info';

  const toneStyles = {
    info: {
      wrapper: 'border-blue-500/30 bg-blue-500/10',
      icon: 'text-blue-600 dark:text-blue-400',
      Icon: Info,
    },
    tip: {
      wrapper: 'border-emerald-500/30 bg-emerald-500/10',
      icon: 'text-emerald-600 dark:text-emerald-400',
      Icon: Lightbulb,
    },
    warning: {
      wrapper: 'border-amber-500/35 bg-amber-500/10',
      icon: 'text-amber-600 dark:text-amber-400',
      Icon: AlertTriangle,
    },
  }[tone];

  const IconComp = toneStyles.Icon;

  return (
    <aside
      className={`rounded-2xl border p-5 space-y-2 ${toneStyles.wrapper}`}
      aria-label={callout.title}
    >
      <div className="flex items-center gap-2 text-sm font-extrabold text-foreground">
        <IconComp className={`h-4 w-4 shrink-0 ${toneStyles.icon}`} aria-hidden="true" />
        <span>{callout.title}</span>
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed">{callout.body}</p>
    </aside>
  );
}

export default async function GuiaDetailPage({ params }: GuiaPageProps) {
  const { slug } = await params;
  const guia = getGuiaBySlug(slug);

  if (!guia) {
    notFound();
  }

  const canonicalPath = `/guias/${guia.slug}`;

  const articleJsonLd: Record<string, unknown> = {
    ...buildArticleJsonLd({
      title: guia.title,
      description: guia.description,
      urlPath: canonicalPath,
      datePublished: guia.lastModified,
      dateModified: guia.lastModified,
      keywords: guia.keywords,
    }),
    image: absoluteUrl(`${canonicalPath}/opengraph-image`),
  };

  const faqJsonLd = buildFaqJsonLd(guia.faqs);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Início', path: '/' },
    { name: 'Guias', path: '/guias' },
    { name: guia.shortTitle, path: canonicalPath },
  ]);

  const relatedGuiasList = guia.relatedGuias
    .map((relSlug) => getGuiaBySlug(relSlug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <PublicShell
      breadcrumbs={[
        { name: 'Início', href: '/' },
        { name: 'Guias', href: '/guias' },
        { name: guia.shortTitle },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-6">
          <Link
            href="/guias"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Voltar para todos os guias</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Artigo Principal */}
          <article className="lg:col-span-8 space-y-10 min-w-0">
            <header className="space-y-4 pb-6 border-b border-border">
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 font-bold text-primary">
                  {guia.category}
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground font-medium">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {guia.readingTimeMinutes} min de leitura
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground font-medium">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  Atualizado em{' '}
                  <time dateTime={guia.lastModified}>{formatDatePtBr(guia.lastModified)}</time>
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-tight">
                {guia.title}
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                {guia.description}
              </p>
            </header>

            {/* Resumo Executivo */}
            <section
              aria-labelledby="pontos-chave-heading"
              className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-3 shadow-sm"
            >
              <div className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                <ListChecks className="h-4 w-4 text-primary" aria-hidden="true" />
                <h2 id="pontos-chave-heading">Pontos-chave deste guia</h2>
              </div>
              <ul className="space-y-2.5">
                {guia.keyTakeaways.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2.5 text-sm sm:text-base text-foreground/90 leading-relaxed"
                  >
                    <CheckCircle2
                      className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-1"
                      aria-hidden="true"
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Seções Editoriais */}
            <div className="space-y-10">
              {guia.sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-24 space-y-4"
                >
                  <h2 className="text-2xl sm:text-[1.65rem] font-extrabold tracking-tight text-foreground leading-snug">
                    {section.heading}
                  </h2>

                  <div className="space-y-4">
                    {section.paragraphs.map((paragraph, idx) => (
                      <p
                        key={`${section.id}-p-${idx}`}
                        className="text-base text-foreground/90 leading-relaxed"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {section.bullets && section.bullets.length > 0 && (
                    <ul className="space-y-2.5 rounded-2xl border border-border bg-muted/35 p-5">
                      {section.bullets.map((bullet, idx) => (
                        <li
                          key={`${section.id}-b-${idx}`}
                          className="flex items-start gap-2.5 text-sm sm:text-base text-foreground/90 leading-relaxed"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0"
                          />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.table && (
                    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                      {section.table.caption && (
                        <div className="px-4 py-3 border-b border-border bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {section.table.caption}
                        </div>
                      )}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                          {section.table.caption && (
                            <caption className="sr-only">{section.table.caption}</caption>
                          )}
                          <thead>
                            <tr className="border-b border-border bg-muted/30">
                              {section.table.headers.map((header) => (
                                <th
                                  key={header}
                                  scope="col"
                                  className="px-4 py-3 font-bold text-foreground whitespace-nowrap"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/70">
                            {section.table.rows.map((row, rowIdx) => (
                              <tr
                                key={`${section.id}-r-${rowIdx}`}
                                className="hover:bg-muted/25 transition-colors"
                              >
                                {row.map((cell, cellIdx) => (
                                  <td
                                    key={`${section.id}-r-${rowIdx}-c-${cellIdx}`}
                                    className={`px-4 py-3 align-top leading-relaxed ${
                                      cellIdx === 0
                                        ? 'font-semibold text-foreground'
                                        : 'text-foreground/85'
                                    }`}
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {section.callout && <CalloutBox callout={section.callout} />}
                </section>
              ))}
            </div>

            {/* Perguntas Frequentes (100% SSR via details/summary) */}
            <section
              id="perguntas-frequentes"
              aria-labelledby="faq-heading"
              className="scroll-mt-24 pt-6 border-t border-border space-y-4"
            >
              <div className="space-y-1">
                <h2
                  id="faq-heading"
                  className="text-2xl font-extrabold tracking-tight text-foreground"
                >
                  Perguntas frequentes
                </h2>
                <p className="text-sm text-muted-foreground">
                  Dúvidas diretas de candidatos aplicando este método na prática.
                </p>
              </div>

              <div className="space-y-3">
                {guia.faqs.map((faq, index) => (
                  <details
                    key={faq.question}
                    open={index === 0}
                    className="group rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
                  >
                    <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none font-bold text-sm sm:text-base text-foreground hover:bg-muted/40 transition-colors [&::-webkit-details-marker]:hidden">
                      <span>{faq.question}</span>
                      <ChevronDown
                        className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 group-open:rotate-180"
                        aria-hidden="true"
                      />
                    </summary>
                    <div className="px-5 pb-5 pt-1 text-sm sm:text-base text-foreground/85 leading-relaxed border-t border-border/60">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </section>

            {/* Bancas Relacionadas */}
            <section
              aria-labelledby="bancas-relacionadas-heading"
              className="pt-6 border-t border-border space-y-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h2
                    id="bancas-relacionadas-heading"
                    className="text-xl font-extrabold tracking-tight text-foreground"
                  >
                    Bancas recomendadas para aplicar este guia
                  </h2>
                </div>
                <Link
                  href="/bancas"
                  className="text-xs font-bold text-primary hover:underline shrink-0"
                >
                  Ver todas
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {guia.relatedBancas.map((bancaSlug) => {
                  const banca = BANCA_LINKS_META[bancaSlug];
                  return (
                    <Link
                      key={bancaSlug}
                      href={`/bancas/${bancaSlug}`}
                      className="group rounded-2xl border border-border bg-card p-4 flex items-center justify-between gap-3 hover:border-primary/50 hover:bg-muted/30 transition-all"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-foreground group-hover:text-primary transition-colors">
                          {banca.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {banca.subtitle}
                        </p>
                      </div>
                      <ArrowRight
                        className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* Outros Guias */}
            {relatedGuiasList.length > 0 && (
              <section
                aria-labelledby="outros-guias-heading"
                className="pt-6 border-t border-border space-y-4"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h2
                    id="outros-guias-heading"
                    className="text-xl font-extrabold tracking-tight text-foreground"
                  >
                    Continue lendo
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {relatedGuiasList.map((rel) => (
                    <Link
                      key={rel.slug}
                      href={`/guias/${rel.slug}`}
                      className="group rounded-2xl border border-border bg-card p-4 flex flex-col justify-between gap-3 hover:border-primary/50 hover:shadow-sm transition-all"
                    >
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-primary">
                          {rel.category}
                        </span>
                        <h3 className="text-sm font-extrabold text-foreground leading-snug group-hover:text-primary transition-colors">
                          {rel.shortTitle}
                        </h3>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground group-hover:text-primary">
                        <span>{rel.readingTimeMinutes} min</span>
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* Barra Lateral Sticky */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {/* Sumário */}
            <nav
              aria-label="Sumário deste guia"
              className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-sm"
            >
              <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                Neste guia
              </p>
              <ol className="space-y-2 text-sm">
                {guia.sections.map((section, idx) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="flex items-start gap-2 text-muted-foreground hover:text-foreground transition-colors leading-snug"
                    >
                      <span className="text-xs font-mono font-bold text-primary mt-0.5">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span>{section.heading}</span>
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href="#perguntas-frequentes"
                    className="flex items-start gap-2 text-muted-foreground hover:text-foreground transition-colors leading-snug"
                  >
                    <span className="text-xs font-mono font-bold text-primary mt-0.5">
                      {String(guia.sections.length + 1).padStart(2, '0')}
                    </span>
                    <span>Perguntas frequentes</span>
                  </a>
                </li>
              </ol>
            </nav>

            {/* CTA Principal */}
            <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-blue-600/10 via-indigo-600/10 to-emerald-500/10 p-5 space-y-4 shadow-sm">
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  Plataforma {SITE_NAME}
                </p>
                <h2 className="text-lg font-black tracking-tight text-foreground leading-snug">
                  Automatize seu FSRS-6 e Caderno de Erros
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Planos acessíveis (Mensal R$ 7,99/mês ou Anual R$ 69,90/ano) sem fidelidade, com
                  cronograma semanal, simulados e exportação para Google/Apple Calendar.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm transition-all"
                >
                  <span>Começar Agora</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/metodologia"
                  className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-xs font-bold border border-border bg-card text-foreground hover:bg-muted transition-colors"
                >
                  <FlaskConical className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  <span>Ver Metodologia Científica</span>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PublicShell>
  );
}
