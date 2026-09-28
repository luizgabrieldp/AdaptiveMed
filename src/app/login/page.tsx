'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useData } from '@/lib/store/data-context';
import { Stethoscope, ArrowRight, Lock, Mail, AlertCircle, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signInDemo } = useData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [contractWarning, setContractWarning] = useState<boolean>(false);
  const [uncontractedEmail, setUncontractedEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | null>(null);

  // DETECÇÃO AUTOMÁTICA DE SESSÃO ATIVA (ELIMINA A NECESSIDADE DE 2 CLIQUES)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const reason = params.get('reason');
      const emailParam = params.get('email');
      if (emailParam) setEmail(emailParam);
      if (reason === 'inactive_account') {
        setContractWarning(true);
        if (emailParam) setUncontractedEmail(emailParam);
      }
    }

    if (!isSupabaseConfigured()) return;
    const supabase = createClient();

    // 1. Checa se o usuário já chegou autenticado pelo Google
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const userEmail = session.user.email || '';
        const isAdmin = userEmail.toLowerCase().includes('admin123');

        supabase
          .from('profiles')
          .select('onboarding_completed, is_subscribed, subscription_status')
          .eq('id', session.user.id)
          .single()
          .then(({ data: prof }) => {
            const hasActivePlan =
              isAdmin ||
              (prof && (prof.is_subscribed || prof.subscription_status === 'active'));

            if (!hasActivePlan) {
              supabase.auth.signOut().then(() => {
                setContractWarning(true);
                setUncontractedEmail(userEmail);
              });
              return;
            }

            if (prof && prof.onboarding_completed) {
              router.replace('/dashboard');
            } else {
              router.replace('/onboarding');
            }
          });
      }
    });

    // 2. Escuta mudanças imediatas de autenticação do OAuth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        const userEmail = session.user.email || '';
        const isAdmin = userEmail.toLowerCase().includes('admin123');

        supabase
          .from('profiles')
          .select('onboarding_completed, is_subscribed, subscription_status')
          .eq('id', session.user.id)
          .single()
          .then(({ data: prof }) => {
            const hasActivePlan =
              isAdmin ||
              (prof && (prof.is_subscribed || prof.subscription_status === 'active'));

            if (!hasActivePlan) {
              supabase.auth.signOut().then(() => {
                setContractWarning(true);
                setUncontractedEmail(userEmail);
              });
              return;
            }

            if (prof && prof.onboarding_completed) {
              router.replace('/dashboard');
            } else {
              router.replace('/onboarding');
            }
          });
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    // BACKDOOR ESPECIAL DE DEMONSTRAÇÃO (admin123 / admin123)
    if (
      (cleanEmail === 'admin123' || cleanEmail === 'admin123@adaptivemed.app') &&
      password === 'admin123'
    ) {
      signInDemo();
      router.push('/dashboard');
      router.refresh();
      return;
    }

    if (!isSupabaseConfigured()) {
      setErrorMessage(
        'Supabase ainda não configurado no .env.local. Para acessar a demonstração, utilize admin123 com senha admin123.'
      );
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setIsLoading(false);
        setErrorMessage('E-mail ou senha inválidos. Verifique seus dados.');
        return;
      }

      if (data.user) {
        // Verifica assinatura ativa e onboarding
        const { data: prof } = await supabase
          .from('profiles')
          .select('onboarding_completed, is_subscribed, subscription_status')
          .eq('id', data.user.id)
          .single();

        const isAdmin = cleanEmail.includes('admin123');
        const hasActivePlan =
          isAdmin ||
          (prof && (prof.is_subscribed || prof.subscription_status === 'active'));

        // Se a conta não tiver assinatura paga ativa
        if (!hasActivePlan) {
          await supabase.auth.signOut();
          setIsLoading(false);
          setContractWarning(true);
          setUncontractedEmail(cleanEmail);
          return;
        }

        if (prof && prof.onboarding_completed) {
          router.push('/dashboard');
        } else {
          router.push('/onboarding');
        }
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado ao efetuar login.');
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async () => {
    setErrorMessage(null);
    if (!isSupabaseConfigured()) {
      setErrorMessage(
        'Autenticação social requer chaves ativas do Supabase. Utilize seu E-mail e Senha ou o acesso admin123.'
      );
      return;
    }

    try {
      setSocialLoading('google');
      const supabase = createClient();
      const origin =
        typeof window !== 'undefined' && window.location.origin
          ? window.location.origin
          : 'https://adaptive-med.vercel.app';

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=/dashboard`,
        },
      });

      if (error) {
        if (
          error.message.includes('not enabled') ||
          error.message.includes('provider') ||
          error.message.includes('Unsupported')
        ) {
          setErrorMessage(
            'O login com Google ainda está sendo ativado no painel do Supabase. Por favor, utilize seu E-mail e Senha no momento.'
          );
        } else {
          setErrorMessage(error.message);
        }
        setSocialLoading(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao conectar com Google.');
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Luzes de fundo sutis */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 shadow-xl shadow-blue-500/25 mb-1">
            <Stethoscope className="h-7 w-7 text-white stroke-[2.2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            AdaptiveMed
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Repetição espaçada adaptativa para candidatos à Residência Médica
          </p>
        </div>

        {/* Card do Formulário */}
        <Card className="border-border shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-bold">Acesse sua conta</CardTitle>
            <CardDescription className="text-xs">
              Entre para visualizar suas métricas, simulados e cronograma de revisões.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {contractWarning && (
              <div className="p-4 rounded-xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-200 text-xs space-y-3 animate-in fade-in slide-in-from-top-2 shadow-lg shadow-amber-500/10">
                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-amber-300">
                      Você não tem contrato finalizado
                    </p>
                    <p className="text-muted-foreground leading-relaxed text-[11px]">
                      Finalize um contrato escolhendo um dos planos para liberar seu cronograma adaptativo e simulados.
                    </p>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between gap-2 border-t border-amber-500/20">
                  <span className="text-[10px] text-amber-400/80 font-medium">
                    Ativação imediata no pagamento
                  </span>
                  <Link
                    href={`/#planos?reason=inactive_account&email=${encodeURIComponent(uncontractedEmail || email)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors shadow-sm"
                  >
                    <span>Finalizar Contrato</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {errorMessage && !contractWarning && (
              <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Botão de Login Social (Google) */}
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={handleSocialLogin}
                disabled={Boolean(socialLoading) || isLoading}
                className="w-full text-xs font-semibold h-11 border-border hover:bg-muted gap-2.5 shadow-sm"
              >
                {/* SVG Google Oficial */}
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                {socialLoading ? 'Conectando ao Google...' : 'Continuar com o Google'}
              </Button>
            </div>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground text-[10px] font-semibold">
                  ou acesse com e-mail
                </span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> E-mail ou Usuário
                </label>
                <Input
                  type="text"
                  required
                  placeholder="seu.email@medicina.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" /> Senha
                  </label>
                </div>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="text-sm"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full font-bold text-sm shadow-md shadow-primary/20 mt-2"
              >
                {isLoading ? 'Autenticando...' : 'Entrar na Plataforma'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="pt-0 flex justify-center text-xs text-muted-foreground">
            Ainda não possui conta?{' '}
            <Link
              href="/signup"
              className="font-bold text-primary hover:underline ml-1 inline-flex items-center gap-0.5"
            >
              Criar conta gratuita <ArrowRight className="h-3 w-3" />
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
