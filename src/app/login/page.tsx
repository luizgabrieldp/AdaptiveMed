'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useData } from '@/lib/store/data-context';
import { Stethoscope, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signInDemo } = useData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

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
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Verifica se completou o onboarding
        const { data: prof } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', data.user.id)
          .single();

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

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setErrorMessage(null);
    if (!isSupabaseConfigured()) {
      setErrorMessage(
        'Autenticação social requer chaves ativas do Supabase. Utilize seu E-mail e Senha ou o acesso admin123.'
      );
      return;
    }

    try {
      setSocialLoading(provider);
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        if (
          error.message.includes('not enabled') ||
          error.message.includes('provider') ||
          error.message.includes('Unsupported')
        ) {
          setErrorMessage(
            `O login com ${provider === 'google' ? 'Google' : 'Apple'} ainda está sendo ativado no painel do Supabase. Por favor, utilize seu E-mail e Senha no momento.`
          );
        } else {
          setErrorMessage(error.message);
        }
        setSocialLoading(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao conectar provedor social.');
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
            {errorMessage && (
              <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Botões de Login Social (Google e Apple) */}
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialLogin('google')}
                disabled={Boolean(socialLoading) || isLoading}
                className="w-full text-xs font-semibold h-10 border-border hover:bg-muted gap-2.5"
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
                {socialLoading === 'google' ? 'Conectando...' : 'Continuar com o Google'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialLogin('apple')}
                disabled={Boolean(socialLoading) || isLoading}
                className="w-full text-xs font-semibold h-10 border-border hover:bg-muted gap-2.5"
              >
                {/* SVG Apple Oficial */}
                <svg className="h-4 w-4 fill-current" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.05-7.62-7.85-11.77-14.39-6.41-10.12-11.22-21.78-14.42-34.98-3.21-13.2-4.81-25.26-4.81-36.18 0-16.12 4.12-29.58 12.35-40.38 8.24-10.8 18.57-16.32 30.98-16.57 5.98 0 12.35 1.54 19.12 4.63 6.77 3.09 11.05 4.63 12.83 4.63 1.52 0 6.09-1.63 13.69-4.89 7.61-3.26 13.79-4.63 18.55-4.13 14.13.76 25.13 6.26 33 16.51-12.61 7.61-18.78 17.85-18.53 30.72.25 10.5 4.3 19.26 12.14 26.28 7.84 7.02 17.27 11.05 28.3 12.09-2.54 7.7-5.59 15.1-9.15 22.18zM119.22 33.15c-.25-7.85 2.65-15.35 8.7-22.5 6.06-7.15 13.56-11.37 22.5-12.65.25 1.01.38 2.03.38 3.04 0 7.85-2.91 15.65-8.73 23.4-5.82 7.75-13.42 12.09-22.85 13.01z" />
                </svg>
                {socialLoading === 'apple' ? 'Conectando...' : 'Continuar com a Apple'}
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
