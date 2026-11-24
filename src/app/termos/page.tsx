import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  CreditCard,
  FileText,
  GraduationCap,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { PublicShell } from '@/components/seo/public-shell';
import {
  LAST_CONTENT_UPDATE,
  SITE_NAME,
  SITE_URL,
  SUPPORT_EMAIL,
} from '@/lib/seo/site';
import { buildBreadcrumbJsonLd } from '@/lib/seo/json-ld';

const PAGE_TITLE = 'Termos de Uso';
const PAGE_DESCRIPTION =
  'Termos de Uso do AdaptiveMed: condições dos planos Mensal (R$ 7,99/mês) e Anual (R$ 69,90/ano), renovação automática, cancelamento pelo Portal Stripe e escopo educacional.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: '/termos',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/termos',
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

export default function TermosPage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Início', path: '/' },
    { name: 'Termos de Uso', path: '/termos' },
  ]);

  return (
    <PublicShell
      breadcrumbs={[
        { name: 'Início', href: '/' },
        { name: 'Termos de Uso' },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
        {/* Header */}
        <header className="space-y-4 pb-6 border-b border-border">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Condições de Uso &amp; Assinatura</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-tight">
            Termos de Uso
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Ao criar uma conta ou assinar o <strong className="text-foreground">{SITE_NAME}</strong>{' '}
            (<span className="font-mono text-xs">{SITE_URL}</span>), você concorda com as regras
            descritas abaixo sobre uso educacional, planos, renovação e cancelamento.
          </p>
          <p className="text-xs font-semibold text-muted-foreground">
            Última atualização:{' '}
            <time dateTime={LAST_CONTENT_UPDATE}>{formatDatePtBr(LAST_CONTENT_UPDATE)}</time>
          </p>
        </header>

        {/* Resumo de Planos */}
        <section aria-label="Resumo dos planos vigentes" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Plano Mensal (Pro)
              </span>
              <CreditCard className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <p className="text-2xl font-black text-foreground">R$ 7,99 / mês</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Cobrança recorrente mensal via Stripe, sem fidelidade ou multa. Cancele a qualquer
              momento no Portal do Cliente Stripe.
            </p>
          </div>

          <div className="rounded-2xl border border-primary/35 bg-primary/5 p-5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Plano Anual (VIP)
              </span>
              <RefreshCw className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <p className="text-2xl font-black text-foreground">R$ 69,90 / ano</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Cobrança anual via Stripe com economia frente ao plano mensal. Renovação anual
              gerenciável ou cancelável a qualquer momento no Portal Stripe.
            </p>
          </div>
        </section>

        {/* Cláusulas */}
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              1. Objeto e natureza educacional da plataforma
            </h2>
            <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
              O {SITE_NAME} é uma plataforma web de organização e inteligência de estudos voltada a
              estudantes de Medicina e médicos em preparação para provas de Residência Médica e
              Revalida, oferecendo repetição espaçada adaptativa (FSRS-6), Caderno de Erros, Diário
              Semanal, Hub de Simulados e Provas, análise de prevalência e Modo Foco.
            </p>
            <aside className="rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4 flex items-start gap-3">
              <ShieldAlert
                className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="space-y-1 text-sm text-foreground/90 leading-relaxed">
                <p className="font-extrabold text-foreground">
                  Finalidade exclusivamente educacional e independência institucional
                </p>
                <p>
                  O {SITE_NAME} é uma ferramenta independente de apoio ao estudo. Não oferecemos
                  aconselhamento médico clínico, não substituímos faculdades, diretrizes oficiais ou
                  cursinhos preparatórios, não garantimos aprovação em exames e não possuímos
                  vínculo oficial com instituições ou bancas citadas (como ENARE, USP-SP, SUS-SP,
                  UNICAMP, UNIFESP, SES-PE, PSU-BA, PSU-MG, AMRIGS ou INEP/Revalida).
                </p>
              </div>
            </aside>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              2. Cadastro e uso pessoal da conta
            </h2>
            <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
              O acesso às funcionalidades da plataforma requer cadastro individual com e-mail válido.
              A assinatura é estritamente pessoal e intransferível: compartilhar credenciais com
              terceiros compromete a calibração individual do algoritmo FSRS-6 e viola estes Termos.
              Você é responsável por manter a confidencialidade da sua senha.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              3. Planos, valores e cobrança recorrente
            </h2>
            <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
              Atualmente o {SITE_NAME} oferece duas modalidades de assinatura com acesso completo às
              ferramentas da plataforma:
            </p>
            <ul className="space-y-2 text-sm sm:text-base text-foreground/90 leading-relaxed list-disc pl-5">
              <li>
                <strong className="text-foreground">Plano Mensal (AdaptiveMed Pro):</strong> R$
                7,99 por mês, com renovação automática a cada 30 dias/ciclo mensal.
              </li>
              <li>
                <strong className="text-foreground">Plano Anual (AdaptiveMed VIP):</strong> R$
                69,90 por ano, com renovação automática a cada 12 meses.
              </li>
            </ul>
            <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
              Todos os pagamentos são processados em ambiente seguro pela{' '}
              <strong className="text-foreground">Stripe</strong>. Eventuais reajustes futuros de
              preço serão comunicados previamente e nunca aplicados retroativamente a ciclos já
              pagos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              4. Renovação, cancelamento pelo Portal Stripe e arrependimento
            </h2>
            <ul className="space-y-2.5 text-sm sm:text-base text-foreground/90 leading-relaxed list-disc pl-5">
              <li>
                <strong className="text-foreground">Autoatendimento sem burocracia:</strong> você
                pode atualizar seu cartão, consultar recibos/faturas ou cancelar a renovação
                automática diretamente pelo <strong>Portal do Cliente Stripe</strong>, acessível na
                página{' '}
                <Link href="/conta" className="font-bold text-primary hover:underline">
                  Minha Conta
                </Link>
                .
              </li>
              <li>
                <strong className="text-foreground">Sem fidelidade ou multa:</strong> ao cancelar a
                renovação, nenhuma nova cobrança será realizada e seu acesso permanece ativo até o
                término do período já pago.
              </li>
              <li>
                <strong className="text-foreground">Direito de arrependimento (CDC):</strong> em
                conformidade com o Art. 49 do Código de Defesa do Consumidor, contratações realizadas
                online podem ser canceladas com reembolso integral dentro de 7 (sete) dias corridos
                a partir da contratação inicial.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              5. Propriedade intelectual e seus dados de estudo
            </h2>
            <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
              O código-fonte, design, marca, textos editoriais, estrutura de interface e
              implementação do motor adaptativo pertencem ao {SITE_NAME} e não podem ser copiados,
              revendidos ou explorados comercialmente sem autorização expressa.
            </p>
            <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
              Os registros individuais que você insere na plataforma (suas notas de revisão, resumos
              no Caderno de Erros e resultados de simulados) continuam pertencendo a você e podem ser
              exportados a qualquer momento em{' '}
              <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">.csv</code> e{' '}
              <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">.ics</code> pela
              página{' '}
              <Link href="/conta" className="font-bold text-primary hover:underline">
                Minha Conta
              </Link>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              6. Conduta aceitável e disponibilidade do serviço
            </h2>
            <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
              É proibido tentar contornar controles de autenticação, realizar engenharia reversa
              abusiva, automatizar raspagem massiva ou interferir na disponibilidade da plataforma.
              Empenhamo-nos em manter o serviço continuamente disponível, mas manutenções técnicas
              ou indisponibilidades pontuais de provedores de nuvem podem ocorrer sem configurar
              dano indenizável.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              7. Atualizações destes Termos, contato e legislação aplicável
            </h2>
            <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
              Estes Termos podem ser atualizados para refletir melhorias da plataforma ou requisitos
              legais, mantendo sempre a data da última revisão visível no topo desta página. Estes
              Termos são regidos pelas leis da República Federativa do Brasil.
            </p>
            <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
              {SUPPORT_EMAIL ? (
                <>
                  Dúvidas sobre cobranças, reembolso ou uso da plataforma podem ser enviadas para{' '}
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="font-bold text-primary hover:underline"
                  >
                    {SUPPORT_EMAIL}
                  </a>{' '}
                  ou gerenciadas diretamente em{' '}
                  <Link href="/conta" className="font-bold text-primary hover:underline">
                    Minha Conta
                  </Link>
                  .
                </>
              ) : (
                <>
                  Para gerenciar sua assinatura, acessar faturas ou solicitar suporte sobre estes
                  Termos, utilize a área do assinante em{' '}
                  <Link href="/conta" className="font-bold text-primary hover:underline">
                    Minha Conta (/conta)
                  </Link>
                  .
                </>
              )}
            </p>
          </section>
        </div>

        {/* Rodapé */}
        <footer className="pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/privacidade"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
          >
            <span>Ler Política de Privacidade (LGPD)</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground hover:text-primary transition-colors"
          >
            <GraduationCap className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>Criar conta no {SITE_NAME}</span>
          </Link>
        </footer>
      </div>
    </PublicShell>
  );
}
