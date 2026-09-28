'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useData } from '@/lib/store/data-context';
import { Stethoscope, Sparkles, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signInDemo } = useData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isSupabaseConfigured()) {
      setErrorMessage(
        'Supabase ainda não configurado no .env.local. Use o botão "Entrar no Modo Demonstração" abaixo para testar tudo de imediato.'
      );
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado ao efetuar login.');
      setIsLoading(false);
    }
  };

  const handleDemoAccess = () => {
    signInDemo();
    router.push('/dashboard');
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
              Entre com suas credenciais para visualizar suas métricas e cronograma exclusivo.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> E-mail
                </label>
                <Input
                  type="email"
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

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground text-[11px] font-semibold">
                  ou experimente agora
                </span>
              </div>
            </div>

            {/* Botão de Modo Demonstração 1 Clique */}
            <Button
              type="button"
              variant="outline"
              onClick={handleDemoAccess}
              className="w-full border-blue-500/30 hover:bg-blue-500/10 text-blue-400 font-bold text-xs gap-2"
            >
              <Sparkles className="h-4 w-4 text-blue-400" />
              Entrar no Modo Demonstração (Sem Cadastro)
            </Button>
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
