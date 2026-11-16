import Link from 'next/link';
import { Stethoscope, LayoutDashboard, Home, Compass } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.14),transparent_60%)]"
      />

      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-border bg-card/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 shadow-lg shadow-blue-500/25">
            <Stethoscope className="h-7 w-7 text-white stroke-[2.2]" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-xs font-bold text-primary">
            <Compass className="h-3.5 w-3.5" /> Erro 404 • Página não encontrada
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Rota fora do cronograma
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            O endereço que você tentou acessar não existe ou foi movido. Retorne ao seu painel de estudos ou à página inicial do AdaptiveMed.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: 'default', size: 'lg' }),
              'gap-2 font-bold text-sm shadow-md shadow-primary/20'
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Ir para o Painel
          </Link>

          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'lg' }),
              'gap-2 font-semibold text-sm'
            )}
          >
            <Home className="h-4 w-4" />
            Voltar para a Página Inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
