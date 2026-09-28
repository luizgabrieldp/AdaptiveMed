'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useData } from '@/lib/store/data-context';
import { Stethoscope, Sparkles, ArrowRight, Lock, Mail, User, Target, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { signInDemo } = useData();
  const [fullName, setFullName] = useState('');
  const [targetSpecialty, setTargetSpecialty] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isSupabaseConfigured()) {
      setErrorMessage(
        'Supabase não configurado no .env.local. Use o botão "Entrar no Modo Demonstração" abaixo para navegar instantaneamente.'
      );
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            target_specialty: targetSpecialty.trim(),
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      if (data.session) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setSuccessMessage('Conta criada com sucesso! Verifique seu e-mail para confirmar seu cadastro.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado ao criar conta.');
      setIsLoading(false);
    }
  };

  const handleDemoAccess = () => {
    signInDemo();
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 shadow-xl shadow-blue-500/25 mb-1">
            <Stethoscope className="h-7 w-7 text-white stroke-[2.2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            AdaptiveMed
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Crie sua conta para isolar seu histórico e cronograma com RLS estrito
          </p>
        </div>

        <Card className="border-border shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-bold">Criar conta de estudante</CardTitle>
            <CardDescription className="text-xs">
              Preencha seus dados para personalizar seu ritmo de repetição espaçada.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Nome Completo
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Ex: Dra. Mariana Costa"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" /> Especialidade / Concurso Alvo
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Ex: Dermatologia - USP / ENARE"
                  value={targetSpecialty}
                  onChange={e => setTargetSpecialty(e.target.value)}
                  className="text-sm"
                />
              </div>

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
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> Senha (mínimo 6 caracteres)
                </label>
                <Input
                  type="password"
                  required
                  minLength={6}
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
                {isLoading ? 'Criando Conta...' : 'Cadastrar e Iniciar'}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground text-[11px] font-semibold">
                  ou teste sem cadastro
                </span>
              </div>
            </div>

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
            Já possui cadastro?{' '}
            <Link
              href="/login"
              className="font-bold text-primary hover:underline ml-1 inline-flex items-center gap-0.5"
            >
              Fazer login <ArrowRight className="h-3 w-3" />
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
