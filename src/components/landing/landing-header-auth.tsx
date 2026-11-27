'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/theme-toggle';

interface AuthState {
  checked: boolean;
  email: string | null;
  hasPaid: boolean;
}

const INITIAL_AUTH: AuthState = {
  checked: false,
  email: null,
  hasPaid: false,
};

const NAV_LINKS = [
  { href: '/bancas', label: 'Bancas', isRoute: true },
  { href: '/guias', label: 'Guias', isRoute: true },
  { href: '/metodologia', label: 'Metodologia FSRS-6', isRoute: true },
  { href: '#simulador', label: 'Simulador', isRoute: false },
  { href: '#vitrine', label: 'Demo ao Vivo', isRoute: false },
  { href: '#planos', label: 'Planos & Preços', isRoute: false },
  { href: '#faq', label: 'Dúvidas', isRoute: false },
] as const;

let cachedAuthPromise: Promise<AuthState> | null = null;
const authListeners = new Set<(state: AuthState) => void>();

function hasSupabaseCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return /(?:^|;\s*)sb-[^=]+=/.test(document.cookie || '');
}

async function resolveCookieGatedAuth(): Promise<AuthState> {
  if (!hasSupabaseCookie()) {
    return { checked: true, email: null, hasPaid: false };
  }

  try {
    const { createClient, isSupabaseConfigured } = await import('@/lib/supabase/client');
    if (!isSupabaseConfigured()) {
      return { checked: true, email: null, hasPaid: false };
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { checked: true, email: null, hasPaid: false };
    }

    const { data: prof } = await supabase
      .from('profiles')
      .select('is_subscribed, subscription_status')
      .eq('id', user.id)
      .single();

    const hasPaid = Boolean(
      prof?.is_subscribed ||
        prof?.subscription_status === 'active' ||
        prof?.subscription_status === 'trial' ||
        prof?.subscription_status === 'trialing'
    );

    return {
      checked: true,
      email: user.email ?? '',
      hasPaid,
    };
  } catch {
    return { checked: true, email: null, hasPaid: false };
  }
}

function getAuthStateOnce(): Promise<AuthState> {
  if (!cachedAuthPromise) {
    cachedAuthPromise = resolveCookieGatedAuth();
  }
  return cachedAuthPromise;
}

function broadcastAuthState(next: AuthState) {
  cachedAuthPromise = Promise.resolve(next);
  authListeners.forEach(listener => listener(next));
}

function useCookieGatedAuth(): AuthState {
  const [auth, setAuth] = useState<AuthState>(INITIAL_AUTH);

  useEffect(() => {
    let active = true;
    authListeners.add(setAuth);

    if (hasSupabaseCookie()) {
      getAuthStateOnce().then(result => {
        if (active) setAuth(result);
      });
    } else {
      cachedAuthPromise = null;
      setAuth({ checked: true, email: null, hasPaid: false });
    }

    return () => {
      active = false;
      authListeners.delete(setAuth);
      if (authListeners.size === 0) {
        cachedAuthPromise = null;
      }
    };
  }, []);

  return auth;
}

async function performSignOut() {
  try {
    if (hasSupabaseCookie()) {
      const { createClient, isSupabaseConfigured } = await import('@/lib/supabase/client');
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.auth.signOut();
      }
    }
  } catch {
    // Fallback local cleanup below
  }

  if (typeof window !== 'undefined') {
    try {
      const preservedUiKeys = new Set([
        'adaptivemed_theme',
        'adaptivemed_sidebar_collapsed',
      ]);
      Object.keys(localStorage)
        .filter(key => key.startsWith('adaptivemed_') && !preservedUiKeys.has(key))
        .forEach(key => localStorage.removeItem(key));
      document.cookie = 'adaptivemed_demo=; path=/; max-age=0; SameSite=Lax';
    } catch {
      // Ignore storage access errors
    }
  }

  broadcastAuthState({ checked: true, email: null, hasPaid: false });
}

export const LandingHeaderAuth: React.FC = () => {
  const router = useRouter();
  const auth = useCookieGatedAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthenticated = auth.email !== null;

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    await performSignOut();
    router.refresh();
  };

  return (
    <>
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <ThemeToggle className="hidden sm:flex" />

        {isAuthenticated ? (
          auth.hasPaid ? (
            <>
              <Button
                asChild
                size="sm"
                className="gap-1.5 font-bold text-[11px] sm:text-xs px-2.5 sm:px-3 shadow-md shadow-primary/20"
              >
                <Link href="/dashboard">
                  Meu Painel <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="hidden sm:inline-flex text-xs text-muted-foreground hover:text-foreground px-2.5"
              >
                Sair
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                size="sm"
                className="gap-1.5 font-black text-[11px] sm:text-xs px-2.5 sm:px-3 shadow-md bg-amber-500 hover:bg-amber-600 text-slate-950"
              >
                <Link href="/pagamento">
                  <span className="sm:hidden">Assinar</span>
                  <span className="hidden sm:inline">Finalizar Assinatura</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="hidden sm:inline-flex text-xs text-muted-foreground hover:text-foreground px-2.5"
              >
                Sair
              </Button>
            </>
          )
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden sm:inline-flex font-bold text-xs text-muted-foreground hover:text-foreground"
            >
              <Link href="/login">Área do Aluno</Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="gap-1.5 font-bold text-[11px] sm:text-xs px-2.5 sm:px-3 shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <a href="#planos">Começar Agora</a>
            </Button>
          </>
        )}

        <button
          type="button"
          onClick={() => setMobileMenuOpen(prev => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-landing-nav"
          aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/80 text-foreground hover:bg-muted transition-colors shrink-0"
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div
          id="mobile-landing-nav"
          className="lg:hidden absolute inset-x-0 top-full z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-border/80 bg-background/98 px-4 py-4 space-y-3 shadow-xl animate-fade-in"
        >
          <nav aria-label="Navegação mobile" className="flex flex-col space-y-1 text-sm font-semibold text-muted-foreground">
            {NAV_LINKS.map(item =>
              item.isRoute ? (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl hover:bg-muted/70 hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl hover:bg-muted/70 hover:text-foreground transition-colors"
                >
                  {item.label}
                </a>
              )
            )}
          </nav>

          <div className="pt-3 border-t border-border/70 space-y-3 sm:hidden">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-muted-foreground">Aparência</span>
              <ThemeToggle showLabel />
            </div>

            {isAuthenticated ? (
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  asChild
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full justify-center font-bold text-xs gap-1.5 ${
                    auth.hasPaid ? '' : 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black'
                  }`}
                >
                  <Link href={auth.hasPaid ? '/dashboard' : '/pagamento'}>
                    {auth.hasPaid ? 'Meu Painel' : 'Finalizar Assinatura'}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="w-full text-xs"
                >
                  Sair
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full font-bold text-xs"
                >
                  <Link href="/login">Área do Aluno</Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <a href="#planos">Começar Agora</a>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export const LandingNoticeBanner: React.FC = () => {
  const auth = useCookieGatedAuth();
  const [redirectNotice, setRedirectNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const reason = params.get('reason');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scrollBehavior: ScrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';
    if (reason === 'no_account') {
      setRedirectNotice(
        'Não encontramos uma conta cadastrada com este e-mail. Escolha seu plano abaixo para liberar seu acesso imediato.'
      );
      document.getElementById('planos')?.scrollIntoView({ behavior: scrollBehavior });
    } else if (reason === 'inactive_account') {
      setRedirectNotice(
        'Sua conta ainda não possui assinatura ativa. Escolha um dos planos abaixo para liberar seu acesso.'
      );
      document.getElementById('planos')?.scrollIntoView({ behavior: scrollBehavior });
    }
  }, []);

  const showUnpaidBanner = auth.email !== null && !auth.hasPaid;

  if (!redirectNotice && !showUnpaidBanner) {
    return null;
  }

  return (
    <>
      {redirectNotice && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 py-3 px-4 text-center text-xs font-semibold text-amber-800 dark:text-amber-300 flex flex-wrap items-center justify-center gap-2 animate-fade-in">
          <span>{redirectNotice}</span>
          <a
            href="#planos"
            className="underline font-bold hover:opacity-80 inline-flex items-center gap-0.5 ml-1"
          >
            Ver Planos <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      )}

      {showUnpaidBanner && (
        <div className="bg-amber-500/10 border-b border-amber-500/25 py-2.5 px-4 text-center text-xs font-medium text-amber-800 dark:text-amber-200 flex flex-wrap items-center justify-center gap-3 animate-fade-in">
          <span>
            Conectado como <strong className="font-bold">{auth.email}</strong>. Ative um plano abaixo para liberar seu cronograma.
          </span>
          <Button
            size="sm"
            variant="outline"
            asChild
            className="h-7 text-[11px] font-bold border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20"
          >
            <Link href="/pagamento">Ir para Pagamento</Link>
          </Button>
        </div>
      )}
    </>
  );
};

interface LandingPlanCtaProps {
  planId: 'monthly' | 'annual';
  label: string;
  variant?: 'default' | 'outline';
  className?: string;
}

export const LandingPlanCta: React.FC<LandingPlanCtaProps> = ({
  planId,
  label,
  variant = 'default',
  className,
}) => {
  const auth = useCookieGatedAuth();
  const href = auth.email !== null ? `/pagamento?plan=${planId}` : `/signup?plan=${planId}`;

  return (
    <Button size="lg" variant={variant} asChild className={className}>
      <Link href={href}>
        <span>{label}</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Button>
  );
};
