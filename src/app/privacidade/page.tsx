import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Database,
  Lock,
  Mail,
  ShieldCheck,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { PublicShell } from '@/components/seo/public-shell';
import {
  LAST_CONTENT_UPDATE,
  SITE_NAME,
  SITE_URL,
  SUPPORT_EMAIL,
} from '@/lib/seo/site';
import { buildBreadcrumbJsonLd } from '@/lib/seo/json-ld';

const PAGE_TITLE = 'Política de Privacidade (LGPD)';
const PAGE_DESCRIPTION =
  'Política de Privacidade do AdaptiveMed em conformidade com a LGPD (Lei nº 13.709/2018): dados de conta, histórico de estudos, pagamentos via Stripe, portabilidade e exclusão de conta.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: '/privacidade',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/privacidade',
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

export default function PrivacidadePage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Início', path: '/' },
    { name: 'Política de Privacidade', path: '/privacidade' },
  ]);

  return (
    <PublicShell
      breadcrumbs={[
        { name: 'Início', href: '/' },
        { name: 'Política de Privacidade' },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
        {/* Header */}
        <header className="space-y-4 pb-6 border-b border-border">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Conformidade LGPD • Lei nº 13.709/2018</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-tight">
            Política de Privacidade
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Esta Política descreve de forma transparente como o <strong className="text-foreground">{SITE_NAME}</strong>{' '}
            (<span className="font-mono text-xs">{SITE_URL}</span>) coleta, utiliza, protege e
            permite a exclusão dos seus dados pessoais e de estudo.
          </p>
          <p className="text-xs font-semibold text-muted-foreground">
            Última atualização:{' '}
            <time dateTime={LAST_CONTENT_UPDATE}>{formatDatePtBr(LAST_CONTENT_UPDATE)}</time>
          </p>
        </header>

        {/* Resumo Visual */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="Compromissos de privacidade">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1.5">
            <Lock className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-extrabold text-foreground">Sem dados de cartão</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Pagamentos e faturas são processados exclusivamente pela Stripe com certificação PCI-DSS.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1.5">
            <Database className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-extrabold text-foreground">Seus dados são seus</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Não vendemos nem compartilhamos seus registros de estudo com cursinhos ou anunciantes.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-1.5">
            <Trash2 className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-extrabold text-foreground">Portabilidade e exclusão</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Exporte revisões e simulados em CSV/ICS a qualquer momento ou solicite exclusão definitiva.
            </p>
          </div>
        </section>

        {/* Seções */}
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              1. Dados pessoais e de estudo que coletamos
            </h2>
            <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
              Coletamos apenas os dados estritamente necessários para operar a sua conta, calcular o
              algoritmo FSRS-6 e gerenciar sua assinatura:
            </p>
            <ul className="space-y-2.5 rounded-2xl border border-border bg-card p-5 text-sm sm:text-base text-foreground/90 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>
                  <strong className="text-foreground">Dados de conta e autenticação:</strong> endereço
                  de e-mail, nome de exibição, ano/banca-alvo configurados no perfil e credenciais de
                  acesso protegidas com criptografia via Supabase Auth.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>
                  <strong className="text-foreground">Dados educacionais e de estudo:</strong> áreas,
                  assuntos cadastrados, histórico de revisões FSRS-6 (percentuais de acerto, datas,
                  estabilidade e dificuldade), registros do Caderno de Erros, notas de Simulados
                  Gerais e Provas por Instituição, sessões do Modo Foco e metas diárias.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>
                  <strong className="text-foreground">Dados de assinatura (Stripe):</strong>{' '}
                  identificadores técnicos de cliente e assinatura na Stripe (como status ativo,
                  cancelado ou data de renovação) para liberar e manter o acesso. O {SITE_NAME}{' '}
                  <strong>não coleta nem armazena</strong> número completo de cartão, validade ou CVV.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>
                  <strong className="text-foreground">Dados técnicos essenciais:</strong> cookies de
                  sessão necessários para autenticação segura e preferência local de tema (Claro ou
                  Escuro) salva em <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">localStorage</code>.
                </span>
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              2. Finalidade e bases legais (LGPD)
            </h2>
            <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
              O tratamento de dados ocorre com fundamento no Art. 7º da Lei nº 13.709/2018 (LGPD):
            </p>
            <ul className="space-y-2 text-sm sm:text-base text-foreground/90 leading-relaxed list-disc pl-5">
              <li>
                <strong className="text-foreground">Execução de contrato (Art. 7º, V):</strong>{' '}
                autenticar seu acesso, sincronizar cronograma FSRS-6, Caderno de Erros, simulados e
                processar a assinatura contratada.
              </li>
              <li>
                <strong className="text-foreground">Cumprimento de obrigação legal ou regulatória (Art. 7º, II):</strong>{' '}
                registros fiscais e comprovantes de pagamento mantidos conforme a legislação vigente.
              </li>
              <li>
                <strong className="text-foreground">Legítimo interesse (Art. 7º, IX):</strong>{' '}
                proteger a plataforma contra acessos não autorizados, abusos automatizados e falhas
                operacionais.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              3. Operadores de infraestrutura e pagamento
            </h2>
            <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
              Para entregar a plataforma com alta disponibilidade e segurança, compartilhamos apenas
              os dados estritamente necessários com operadores tecnológicos confiáveis:
            </p>
            <ul className="space-y-2 text-sm sm:text-base text-foreground/90 leading-relaxed list-disc pl-5">
              <li>
                <strong className="text-foreground">Stripe:</strong> processamento de checkout,
                cobrança recorrente, emissão de recibos e Portal do Cliente para gerenciamento ou
                cancelamento de assinatura.
              </li>
              <li>
                <strong className="text-foreground">Supabase:</strong> autenticação segura e banco
                de dados relacional com isolamento de acesso por usuário (Row Level Security).
              </li>
              <li>
                <strong className="text-foreground">Vercel:</strong> hospedagem da aplicação web e
                transmissão criptografada via HTTPS/TLS.
              </li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Não comercializamos, alugamos ou cedemos dados pessoais ou métricas de desempenho a
              terceiros, cursinhos preparatórios ou redes de publicidade comportamental.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              4. Direitos do titular e portabilidade
            </h2>
            <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
              Nos termos do Art. 18 da LGPD, você tem direito a confirmar a existência de tratamento,
              acessar seus dados, corrigir informações incompletas ou desatualizadas, solicitar
              anonimização ou eliminação e exercer a portabilidade.
            </p>
            <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
              Dentro da página{' '}
              <Link href="/conta" className="font-bold text-primary hover:underline">
                Minha Conta
              </Link>
              , você pode exportar imediatamente seu histórico completo de assuntos e revisões em{' '}
              <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">.csv</code>, seus
              simulados e provas em{' '}
              <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">.csv</code> e sua
              agenda de revisões em{' '}
              <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">.ics</code>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              5. Retenção e exclusão de conta e dados
            </h2>
            <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
              Mantemos seus dados de estudo enquanto sua conta permanecer ativa para que você não
              perca seu histórico entre ciclos de preparação. Caso decida encerrar o uso da plataforma:
            </p>
            <ol className="space-y-2 text-sm sm:text-base text-foreground/90 leading-relaxed list-decimal pl-5">
              <li>
                Cancele sua assinatura ativa (se houver) diretamente pelo Portal do Cliente Stripe em{' '}
                <Link href="/conta" className="font-bold text-primary hover:underline">
                  Minha Conta
                </Link>{' '}
                para interromper futuras cobranças.
              </li>
              <li>
                Solicite a exclusão definitiva da conta e de todos os registros de estudo pelo canal
                de atendimento indicado abaixo. Após a confirmação de titularidade, os dados pessoais
                e educacionais são removidos de forma permanente em até 15 dias úteis, ressalvados
                apenas registros mínimos exigidos por obrigação legal ou fiscal (como comprovantes de
                transação na Stripe).
              </li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              6. Canal de contato e Encarregado (DPO)
            </h2>
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                {SUPPORT_EMAIL ? (
                  <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
                ) : (
                  <UserCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                )}
                <span>Atendimento para solicitações LGPD e exclusão de conta</span>
              </div>

              {SUPPORT_EMAIL ? (
                <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
                  Para exercer qualquer direito previsto na LGPD, tirar dúvidas sobre privacidade ou
                  solicitar exclusão definitiva da sua conta, escreva para{' '}
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="font-bold text-primary hover:underline"
                  >
                    {SUPPORT_EMAIL}
                  </a>{' '}
                  ou utilize as opções de gerenciamento na sua área{' '}
                  <Link href="/conta" className="font-bold text-primary hover:underline">
                    Minha Conta
                  </Link>
                  .
                </p>
              ) : (
                <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
                  Para exercer seus direitos previstos na LGPD, exportar seus dados, cancelar sua
                  assinatura pelo Portal Stripe ou abrir uma solicitação de exclusão definitiva de
                  conta, acesse a área do assinante em{' '}
                  <Link href="/conta" className="font-bold text-primary hover:underline">
                    Minha Conta (/conta)
                  </Link>
                  .
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Rodapé de Navegação Legal */}
        <footer className="pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/termos"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
          >
            <span>Ler Termos de Uso</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/metodologia"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Ver Metodologia Científica
          </Link>
        </footer>
      </div>
    </PublicShell>
  );
}
