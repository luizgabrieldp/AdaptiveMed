'use client';

import React, { useState } from 'react';
import {
  BrainCircuit,
  CalendarDays,
  RotateCcw,
  AlertTriangle,
  Flame,
  Star,
  Download,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const CURSINHOS = ['Medcurso', 'Estratégia Med', 'Sanar', 'Medcel', 'Aristo', 'Qbank Próprio'];

interface SpotlightCardProps {
  icon: React.ReactNode;
  badge: string;
  title: string;
  description: string;
  accentClass: string;
  spanClass?: string;
}

const SpotlightCard: React.FC<SpotlightCardProps> = ({
  icon,
  badge,
  title,
  description,
  accentClass,
  spanClass = '',
}) => {
  const [coords, setCoords] = useState<{ x: number; y: number; active: boolean }>({
    x: 50,
    y: 50,
    active: false,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      active: true,
    });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setCoords(prev => ({ ...prev, active: false }))}
      className={`group relative rounded-3xl border border-border/80 bg-card/85 backdrop-blur-md p-6 transition-transform duration-300 hover:-translate-y-1 hover:border-primary/40 overflow-hidden shadow-sm ${spanClass}`}
    >
      {/* Spotlight radial dinâmico no cursor */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: coords.active ? 1 : 0,
          background: `radial-gradient(360px circle at ${coords.x}% ${coords.y}%, rgba(59, 130, 246, 0.14), transparent 65%)`,
        }}
      />

      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className={`p-2.5 rounded-2xl border ${accentClass}`}>{icon}</div>
          <Badge variant="outline" className="text-[10px] font-bold">
            {badge}
          </Badge>
        </div>

        <h3 className="text-base sm:text-lg font-extrabold text-foreground leading-snug">{title}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

export const AnimatedBeamBento: React.FC = () => {
  return (
    <div className="space-y-10">
      {/* Diagrama Animated Beam: Seu Cursinho -> Motor FSRS-6 -> Grade sem Acúmulo */}
      <div className="rounded-3xl border border-border/80 bg-card/80 backdrop-blur-xl p-5 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-center">
          {/* Nó 1: Fontes do Aluno */}
          <div className="lg:col-span-4 p-4 rounded-2xl border border-border bg-background/70 space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                1. Seu Cursinho / Qbank
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Você continua assistindo às aulas e fazendo questões onde preferir:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {CURSINHOS.map(name => (
                <span
                  key={name}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-muted/70 border border-border text-foreground"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

          {/* Conector Animado 1 */}
          <div className="hidden lg:flex lg:col-span-1 items-center justify-center">
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 80 24" aria-hidden="true">
              <line
                x1="2"
                y1="12"
                x2="74"
                y2="12"
                stroke="currentColor"
                strokeWidth="2"
                className="text-border"
              />
              <line
                x1="2"
                y1="12"
                x2="74"
                y2="12"
                stroke="#3B82F6"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                className="animate-beam-flow"
              />
              <circle cx="74" cy="12" r="3.5" fill="#3B82F6" />
            </svg>
          </div>

          <div className="flex lg:hidden justify-center">
            <ArrowRight className="h-5 w-5 text-primary rotate-90" />
          </div>

          {/* Nó 2 Central: Motor FSRS-6 */}
          <div className="lg:col-span-3 p-5 rounded-2xl border-2 border-primary/50 bg-gradient-to-br from-primary/15 via-card to-indigo-500/10 text-center space-y-2 shadow-lg shadow-primary/10">
            <div className="h-11 w-11 mx-auto rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
              2. Motor FSRS-6 AdaptiveMed
            </p>
            <h3 className="text-sm font-black text-foreground">Cálculo de Estabilidade Neural</h3>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Ajusta intervalos R1→R8, volume de questões e teto diário pela sua curva real e data da prova.
            </p>
          </div>

          {/* Conector Animado 2 */}
          <div className="hidden lg:flex lg:col-span-1 items-center justify-center">
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 80 24" aria-hidden="true">
              <line
                x1="2"
                y1="12"
                x2="74"
                y2="12"
                stroke="currentColor"
                strokeWidth="2"
                className="text-border"
              />
              <line
                x1="2"
                y1="12"
                x2="74"
                y2="12"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                className="animate-beam-flow"
              />
              <circle cx="74" cy="12" r="3.5" fill="#10B981" />
            </svg>
          </div>

          <div className="flex lg:hidden justify-center">
            <ArrowRight className="h-5 w-5 text-emerald-500 rotate-90" />
          </div>

          {/* Nó 3: Saída Grade Semanal */}
          <div className="lg:col-span-2 p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/[0.08] space-y-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                3. Grade Sem Acúmulo
              </span>
            </div>
            <ul className="text-[11px] text-muted-foreground space-y-1.5">
              <li className="text-foreground font-semibold">• Revisões no dia certo</li>
              <li className="text-foreground font-semibold">• Cota anti-burnout</li>
              <li className="text-foreground font-semibold">• Rebalanceamento 1-clique</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bento Grid 3D com Spotlight */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SpotlightCard
          icon={<BrainCircuit className="h-5 w-5 text-blue-500" />}
          badge="FSRS-6 Oficial"
          title="Algoritmo de Retenção de Nova Geração"
          description="Calcula dificuldade e estabilidade reais de cada assunto com ts-fsrs, adaptando o intervalo R1..R8 e a quantidade exata de questões."
          accentClass="bg-blue-500/10 border-blue-500/25"
          spanClass="lg:col-span-2"
        />

        <SpotlightCard
          icon={<RotateCcw className="h-5 w-5 text-rose-500" />}
          badge="1-Clique"
          title="Rebalancear Atrasados Sem Culpa"
          description="Teve plantão pesado e acumulou revisões? Redistribua tudo automaticamente nos próximos dias livres sem estourar sua cota diária."
          accentClass="bg-rose-500/10 border-rose-500/25"
        />

        <SpotlightCard
          icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
          badge="Caderno de Erros"
          title="Diagnóstico Estruturado por Causa"
          description="Cataloga se o erro foi Lacuna teórica, Interpretação, Pegadinha da banca ou Distração, com regra de ouro e status revisado."
          accentClass="bg-amber-500/10 border-amber-500/25"
        />

        <SpotlightCard
          icon={<Flame className="h-5 w-5 text-emerald-500" />}
          badge="365 Dias"
          title="Heatmap Anual Estilo GitHub/Anki"
          description="Acompanhe sua consistência diária de estudos, revisões e simulados com ofensiva qualificada e meta personalizável."
          accentClass="bg-emerald-500/10 border-emerald-500/25"
        />

        <SpotlightCard
          icon={<Star className="h-5 w-5 text-purple-500" />}
          badge="Top Banca"
          title="Prevalência por Instituição & Auto-Estudo"
          description="Filtre temas de alta incidência (ENARE, USP-SP, SUS-SP, UNIFESP) e distribua automaticamente na sua semana."
          accentClass="bg-purple-500/10 border-purple-500/25"
        />

        <SpotlightCard
          icon={<CalendarDays className="h-5 w-5 text-sky-500" />}
          badge="Grade D&D"
          title="Agenda Semanal Drag-and-Drop"
          description="Visão Dia, Semana, Mês e Tabela completa para mover revisões, pausar trilhas e ajustar qualquer nota de desempenho."
          accentClass="bg-sky-500/10 border-sky-500/25"
          spanClass="lg:col-span-2"
        />

        <SpotlightCard
          icon={<Download className="h-5 w-5 text-indigo-500" />}
          badge=".csv + .ics"
          title="Portabilidade Total dos Seus Dados"
          description="Exporte histórico de revisões e simulados em CSV ou sincronize suas próximas revisões direto no Google Calendar e Apple Calendar."
          accentClass="bg-indigo-500/10 border-indigo-500/25"
        />
      </div>
    </div>
  );
};
