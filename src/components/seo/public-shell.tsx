import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronRight,
  Menu,
  Stethoscope,
} from 'lucide-react';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { SITE_NAME } from '@/lib/seo/site';

export interface PublicShellProps {
  children: React.ReactNode;
  breadcrumbs?: Array<{ name: string; href?: string }>;
}

const PRIMARY_NAV_LINKS = [
  { href: '/', label: 'Início' },
  { href: '/bancas', label: 'Bancas' },
  { href: '/guias', label: 'Guias' },
  { href: '/metodologia', label: 'Metodologia' },
] as const;

const FOOTER_EXPLORE_LINKS = [
  { href: '/', label: 'Início' },
  { href: '/bancas', label: 'Bancas de Residência' },
  { href: '/guias', label: 'Guias de Estudo' },
  { href: '/metodologia', label: 'Metodologia FSRS-6' },
] as const;

const FOOTER_LEGAL_LINKS = [
  { href: '/signup', label: 'Começar Agora' },
  { href: '/login', label: 'Entrar na Plataforma' },
  { href: '/privacidade', label: 'Política de Privacidade' },
  { href: '/termos', label: 'Termos de Uso' },
] as const;

export function PublicShell({ children, breadcrumbs }: PublicShellProps) {
  const hasBreadcrumbs = Boolean(breadcrumbs && breadcrumbs.length > 0);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/25 selection:text-primary overflow-x-clip">
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg"
      >
        Pular para o conteúdo principal
      </a>

      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 group shrink-0 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
          >
            <span className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform shrink-0">
              <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 text-white stroke-[2.2]" aria-hidden="true" />
            </span>
            <span className="text-base sm:text-lg font-black tracking-tight text-foreground truncate">
              {SITE_NAME}
            </span>
          </Link>

          <nav aria-label="Navegação principal" className="hidden md:flex items-center gap-1">
            {PRIMARY_NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            <Link
              href="/login"
              className="hidden lg:inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Entrar
            </Link>

            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm shadow-blue-600/25 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span>Começar Agora</span>
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
            </Link>

            <details className="md:hidden relative">
              <summary
                aria-label="Abrir menu de navegação"
                className="list-none cursor-pointer h-9 w-9 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden"
              >
                <Menu className="h-4 w-4" aria-hidden="true" />
              </summary>
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-border bg-card p-3 shadow-xl z-50 space-y-2">
                <nav aria-label="Navegação móvel" className="flex flex-col gap-1">
                  {PRIMARY_NAV_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="px-3 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Link
                    href="/login"
                    className="px-3 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    Entrar
                  </Link>
                </nav>
                <div className="pt-2 border-t border-border flex items-center justify-between gap-2 sm:hidden">
                  <span className="text-xs font-medium text-muted-foreground">Tema</span>
                  <ThemeToggle />
                </div>
              </div>
            </details>
          </div>
        </div>
      </header>

      {hasBreadcrumbs && breadcrumbs && (
        <div className="border-b border-border/60 bg-muted/30">
          <nav
            aria-label="Breadcrumb"
            className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5"
          >
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <li key={`${crumb.name}-${index}`} className="inline-flex items-center gap-1.5 min-w-0 max-w-full">
                    {index > 0 && (
                      <ChevronRight
                        className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    {crumb.href && !isLast ? (
                      <Link
                        href={crumb.href}
                        className="hover:text-foreground transition-colors truncate"
                      >
                        {crumb.name}
                      </Link>
                    ) : (
                      <span
                        aria-current={isLast ? 'page' : undefined}
                        className="font-semibold text-foreground truncate"
                      >
                        {crumb.name}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      )}

      <main id="conteudo-principal" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border/80 bg-card/60 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-border/70">
            <div className="md:col-span-6 space-y-3">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <span className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-sm">
                  <Stethoscope className="h-4 w-4 text-white stroke-[2.2]" aria-hidden="true" />
                </span>
                <span className="text-base font-black tracking-tight text-foreground">
                  {SITE_NAME}
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                Plataforma de repetição espaçada adaptativa (FSRS-6), caderno de erros inteligente e
                cronograma semanal projetados para candidatos à Residência Médica e Revalida no Brasil.
              </p>
              <div className="pt-1">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                >
                  <span>Organizar revisões com FSRS-6</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="md:col-span-3 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Conteúdo &amp; Método
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {FOOTER_EXPLORE_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-3 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Acesso &amp; Legal
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {FOOTER_LEGAL_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} {SITE_NAME}. Todos os direitos reservados.
            </p>
            <p className="max-w-xl sm:text-right">
              Conteúdo educacional independente voltado à preparação médica. Não há vínculo institucional
              com bancas, universidades ou órgãos organizadores citados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
