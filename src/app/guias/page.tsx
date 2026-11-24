import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Clock,
  FlaskConical,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { PublicShell } from '@/components/seo/public-shell';
import { GUIAS_SEO, BANCA_LINKS_META } from '@/lib/seo/guias';
import {
  LAST_CONTENT_UPDATE,
  SITE_NAME,
  absoluteUrl,
} from '@/lib/seo/site';
import { buildBreadcrumbJsonLd } from '@/lib/seo/json-ld';

const PAGE_TITLE = 'Guias de Estudo e Repetição Espaçada para Residência Médica';
const PAGE_DESCRIPTION =
  'Guias práticos e científicos sobre FSRS-6, Caderno de Erros inteligente, cronograma de revisões no internato, integração com cursinhos e simulados para Residência Médica.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: [
    'guias residência médica',
    'repetição espaçada medicina',
    'FSRS-6 residência médica',
    'caderno de erros medicina',
    'cronograma internato residência',
    'simulados residência médica',
  ],
  alternates: {
    canonical: '/guias',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/guias',
    siteName: SITE_NAME,
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
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

export default function GuiasIndexPage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Início', path: '/' },
    { name: 'Guias', path: '/guias' },
  ]);

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: absoluteUrl('/guias'),
    inLanguage: 'pt-BR',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: GUIAS_SEO.map((guia, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: guia.title,
        url: absoluteUrl(`/guias/${guia.slug}`),
      })),
    },
  };

  return (
    <PublicShell
      breadcrumbs={[
        { name: 'Início', href: '/' },
        { name: 'Guias de Estudo' },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(collectionJsonLd) }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
        {/* Hero */}
        <section className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-sm relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
          />
          <div className="relative space-y-5 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Biblioteca Editorial {SITE_NAME}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-tight">
              Guias práticos para dominar a preparação na Residência Médica
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Estratégias diretas ao ponto, fundamentadas em ciência cognitiva e conectadas ao fluxo
              real de quem concilia internato, cursinho, questões e simulados — sem planilhas frágeis
              e sem bola de neve de atrasos.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/60 px-3 py-1.5 text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                {GUIAS_SEO.length} guias aprofundados
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/60 px-3 py-1.5">
                Atualizado em{' '}
                <time dateTime={LAST_CONTENT_UPDATE}>{formatDatePtBr(LAST_CONTENT_UPDATE)}</time>
              </span>
              <Link
                href="/metodologia"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-primary hover:bg-muted transition-colors"
              >
                <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
                Ver base científica (FSRS-6)
              </Link>
              <Link
                href="/bancas"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-foreground hover:bg-muted transition-colors"
              >
                <GraduationCap className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                Explorar 10 bancas
              </Link>
            </div>
          </div>
        </section>

        {/* Lista de Guias */}
        <section aria-labelledby="lista-guias-heading" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2
                id="lista-guias-heading"
                className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground"
              >
                Todos os guias publicados
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Escolha o tema que resolve o maior gargalo da sua rotina hoje.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {GUIAS_SEO.map((guia, idx) => (
              <article
                key={guia.slug}
                className={`group rounded-2xl border border-border bg-card p-6 flex flex-col justify-between gap-5 shadow-sm hover:border-primary/50 hover:shadow-md transition-all ${
                  idx === 0 ? 'md:col-span-2 bg-gradient-to-br from-card via-card to-primary/5' : ''
                }`}
              >
                <div className="space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 font-bold text-primary">
                      {guia.category}
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {guia.readingTimeMinutes} min de leitura
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground leading-snug group-hover:text-primary transition-colors">
                    <Link
                      href={`/guias/${guia.slug}`}
                      className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                    >
                      {guia.title}
                    </Link>
                  </h3>

                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {guia.description}
                  </p>

                  <ul className="space-y-1.5 pt-1">
                    {guia.keyTakeaways.slice(0, idx === 0 ? 3 : 2).map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-2 text-xs sm:text-sm text-foreground/85 leading-relaxed"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0"
                        />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-border/70 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {guia.relatedBancas.slice(0, 4).map((bancaSlug) => (
                      <Link
                        key={bancaSlug}
                        href={`/bancas/${bancaSlug}`}
                        className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                      >
                        {BANCA_LINKS_META[bancaSlug].name}
                      </Link>
                    ))}
                  </div>

                  <Link
                    href={`/guias/${guia.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                  >
                    <span>Ler guia completo</span>
                    <ArrowRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* CTA Final */}
        <section className="rounded-3xl border border-primary/25 bg-gradient-to-br from-blue-600/10 via-indigo-600/10 to-emerald-500/10 p-6 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Coloque o FSRS-6 para trabalhar no seu cronograma hoje
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Chega de chutar datas em planilhas. Registre suas questões em 10 segundos e deixe o{' '}
              {SITE_NAME} calcular intervalos, volume dinâmico e peso do Caderno de Erros até a sua
              prova.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/20 transition-all"
            >
              <span>Começar Agora</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/metodologia"
              className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-bold border border-border bg-card text-foreground hover:bg-muted transition-colors"
            >
              <span>Ler Metodologia</span>
            </Link>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
