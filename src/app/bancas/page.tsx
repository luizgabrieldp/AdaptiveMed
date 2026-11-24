import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Compass,
  FileText,
  GraduationCap,
  MapPin,
  Sparkles,
  Target,
} from 'lucide-react';
import { PublicShell } from '@/components/seo/public-shell';
import {
  BANCAS_REGIONS,
  BANCAS_SEO,
  formatRegionLabel,
  getBancasByRegion,
  type BancaRegion,
} from '@/lib/seo/bancas';
import { buildBreadcrumbJsonLd } from '@/lib/seo/json-ld';
import { SITE_NAME, absoluteUrl } from '@/lib/seo/site';

const PAGE_TITLE = 'Bancas de Residência Médica e Revalida: Guia Completo por Prova';
const PAGE_DESCRIPTION =
  'Analise o perfil das 10 principais bancas médicas do Brasil — ENARE, USP-SP, SUS-SP, UNICAMP, UNIFESP, SES-PE, PSU-BA, PSU-MG, AMRIGS e Revalida INEP — com temas mais cobrados, formato e estratégia FSRS-6.';

function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: '/bancas',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: SITE_NAME,
    url: '/bancas',
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: `${PAGE_TITLE} — ${SITE_NAME}`,
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

const REGION_META: Record<
  BancaRegion,
  { id: string; subtitle: string; badgeClass: string }
> = {
  Nacional: {
    id: 'regiao-nacional',
    subtitle:
      'Processos unificados de alcance nacional com foco em protocolos do Ministério da Saúde e aplicação em todos os estados.',
    badgeClass:
      'border-blue-500/35 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  },
  Sudeste: {
    id: 'regiao-sudeste',
    subtitle:
      'Principais bancas de São Paulo e Minas Gerais — de provas autorais com 2ª fase prática a exames objetivos unificados de alta concorrência.',
    badgeClass:
      'border-indigo-500/35 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  },
  Nordeste: {
    id: 'regiao-nordeste',
    subtitle:
      'Grandes seleções estaduais do Nordeste com forte identidade clínica, infectologia regional e formatos próprios de avaliação.',
    badgeClass:
      'border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  Sul: {
    id: 'regiao-sul',
    subtitle:
      'Exame unificado referência para os principais hospitais do Rio Grande do Sul e região Sul.',
    badgeClass:
      'border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-300',
  },
};

export default function BancasHubPage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Início', path: '/' },
    { name: 'Bancas de Residência', path: '/bancas' },
  ]);

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Principais Bancas de Residência Médica e Revalida no Brasil',
    description: PAGE_DESCRIPTION,
    url: absoluteUrl('/bancas'),
    inLanguage: 'pt-BR',
    numberOfItems: BANCAS_SEO.length,
    itemListElement: BANCAS_SEO.map((banca, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: banca.name,
      url: absoluteUrl(`/bancas/${banca.slug}`),
    })),
  };

  return (
    <PublicShell
      breadcrumbs={[
        { name: 'Início', href: '/' },
        { name: 'Bancas de Residência' },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(itemListJsonLd) }}
      />

      {/* HERO */}
      <section className="relative border-b border-border/70 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/35 bg-blue-500/10 px-3.5 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">
            <Compass className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Mapeamento Estratégico — 10 Bancas Principais</span>
          </div>

          <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.12]">
              Bancas de Residência Médica e Revalida: entenda cada prova antes de revisar
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Estudar para a USP-SP exige uma estratégia completamente diferente do ENARE, do PSU-BA
              ou do Revalida INEP. Explore abaixo o formato, a distribuição das 5 grandes áreas, os
              temas mais incidentes e o plano de repetição espaçada FSRS-6 para cada banca.
            </p>
          </div>

          {/* Navegação rápida por região */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {BANCAS_REGIONS.map((region) => {
              const count = getBancasByRegion(region).length;
              const meta = REGION_META[region];
              return (
                <a
                  key={region}
                  href={`#${meta.id}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs sm:text-sm font-semibold text-foreground hover:border-primary/50 hover:bg-muted/60 transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  <span>{region}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                    {count}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* SEÇÕES POR REGIÃO */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
        {BANCAS_REGIONS.map((region) => {
          const bancas = getBancasByRegion(region);
          const meta = REGION_META[region];
          const regionHeading =
            region === 'Nacional'
              ? 'Bancas de Abrangência Nacional'
              : `Bancas da Região ${region}`;

          return (
            <section
              key={region}
              id={meta.id}
              className="scroll-mt-24 space-y-6"
              aria-labelledby={`heading-${meta.id}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-border/70 pb-4">
                <div className="space-y-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${meta.badgeClass}`}
                  >
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {formatRegionLabel(region)}
                  </span>
                  <h2
                    id={`heading-${meta.id}`}
                    className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground"
                  >
                    {regionHeading}
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-2xl">{meta.subtitle}</p>
                </div>
                <span className="text-xs font-semibold text-muted-foreground tabular-nums shrink-0">
                  {bancas.length} {bancas.length === 1 ? 'guia disponível' : 'guias disponíveis'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bancas.map((banca) => (
                  <article
                    key={banca.slug}
                    className="group rounded-2xl border border-border bg-card p-6 flex flex-col justify-between gap-5 hover:border-primary/50 hover:shadow-md transition-all"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${meta.badgeClass}`}
                            >
                              {banca.region}
                            </span>
                            <span className="text-xs font-medium text-muted-foreground">
                              {banca.organizer}
                            </span>
                          </div>
                          <h3 className="text-xl font-extrabold tracking-tight text-foreground group-hover:text-primary transition-colors">
                            <Link href={`/bancas/${banca.slug}`} className="focus-visible:outline-none focus-visible:underline">
                              {banca.name}
                            </Link>
                          </h3>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {banca.description}
                      </p>

                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-border/70 bg-muted/35 p-3.5 text-xs">
                        <div className="space-y-0.5">
                          <dt className="font-semibold text-muted-foreground flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
                            Estrutura
                          </dt>
                          <dd className="font-bold text-foreground leading-snug">
                            {banca.questionCount}
                          </dd>
                        </div>
                        <div className="space-y-0.5">
                          <dt className="font-semibold text-muted-foreground flex items-center gap-1.5">
                            <Target className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                            Faixa de Corte
                          </dt>
                          <dd className="font-medium text-foreground leading-snug line-clamp-2">
                            {banca.cutoffRange}
                          </dd>
                        </div>
                      </dl>

                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Destaques de Alta Incidência
                        </p>
                        <ul className="space-y-1.5">
                          {banca.topTopics.slice(0, 3).map((item) => (
                            <li
                              key={item.topic}
                              className="text-xs text-foreground flex items-start gap-2"
                            >
                              <span
                                className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0"
                                aria-hidden="true"
                              />
                              <span className="leading-snug">{item.topic}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/70 flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">
                        {banca.topTopics.length} temas mapeados &bull; {banca.faqs.length} FAQs
                      </span>
                      <Link
                        href={`/bancas/${banca.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                      >
                        <span>Ver guia da banca</span>
                        <ArrowRight
                          className="h-4 w-4 group-hover:translate-x-0.5 transition-transform"
                          aria-hidden="true"
                        />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}

        {/* QUADRO COMPARATIVO RÁPIDO */}
        <section className="space-y-5" aria-labelledby="comparativo-bancas">
          <div className="space-y-1.5">
            <h2
              id="comparativo-bancas"
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground"
            >
              Resumo comparativo das 10 bancas
            </h2>
            <p className="text-sm text-muted-foreground">
              Compare rapidamente abrangência, formato de questões e referência histórica de nota de
              corte para planejar quais provas combinam com sua rotina.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <th className="py-3.5 px-4 font-bold">Banca</th>
                  <th className="py-3.5 px-4 font-bold">Região</th>
                  <th className="py-3.5 px-4 font-bold">Organizadora</th>
                  <th className="py-3.5 px-4 font-bold">Questões / Etapas</th>
                  <th className="py-3.5 px-4 font-bold text-right">Guia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {BANCAS_SEO.map((banca) => (
                  <tr key={banca.slug} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground whitespace-nowrap">
                      <Link href={`/bancas/${banca.slug}`} className="hover:text-primary hover:underline">
                        {banca.shortName}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                      {banca.region}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {banca.organizer}
                    </td>
                    <td className="py-3.5 px-4 text-foreground">
                      {banca.questionCount}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/bancas/${banca.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                      >
                        <span>Abrir</span>
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA FINAL + LINKS PARA GUIAS E METODOLOGIA */}
        <section className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-emerald-500/10 p-6 sm:p-10 space-y-6">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>FSRS-6 aplicado à sua banca alvo</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Transforme o perfil da sua banca em um cronograma adaptativo de revisões
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              No AdaptiveMed você cadastra suas bancas prioritárias, acompanha simulados contra a
              nota de corte e deixa o algoritmo FSRS-6 calcular exatamente quando revisar cada tema
              até a data da prova.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/20 transition-all"
            >
              <span>Começar Agora com FSRS-6</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/guias"
              className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold border border-border bg-card hover:bg-muted text-foreground transition-colors"
            >
              <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Ler Guias de Estudo</span>
            </Link>
            <Link
              href="/metodologia"
              className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold border border-border bg-card hover:bg-muted text-foreground transition-colors"
            >
              <GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>Entender a Metodologia FSRS-6</span>
            </Link>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
