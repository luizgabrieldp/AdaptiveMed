'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import {
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Flame,
  RotateCcw,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const PREVIEW_DAYS = [
  {
    day: 'Seg',
    date: 'Hoje',
    isToday: true,
    items: [
      { area: 'Clínica Médica', topic: 'Insuficiência Cardíaca', tag: 'R2 • FSRS 11d', pct: 86, color: 'blue' },
      { area: 'Cirurgia Geral', topic: 'Abdome Agudo Perfurativo', tag: 'R0 Estudo', pct: null, color: 'emerald' },
    ],
  },
  {
    day: 'Ter',
    date: 'Amanhã',
    isToday: false,
    items: [
      { area: 'Ginecologia e Obstetrícia', topic: 'Pré-Eclâmpsia & Eclâmpsia', tag: 'R1 • FSRS 4d', pct: 74, color: 'pink' },
    ],
  },
  {
    day: 'Qua',
    date: 'Dia +2',
    isToday: false,
    items: [
      { area: 'Pediatria', topic: 'Bronquiolite Viral Aguda', tag: 'R3 • FSRS 21d', pct: 91, color: 'amber' },
      { area: 'Medicina Preventiva', topic: 'Estudos Epidemiológicos', tag: 'R4 • FSRS 30d', pct: 88, color: 'purple' },
    ],
  },
  {
    day: 'Qui',
    date: 'Dia +3',
    isToday: false,
    items: [
      { area: 'Clínica Médica', topic: 'Cetoacidose Diabética', tag: 'R1 • FSRS 5d', pct: 79, color: 'blue' },
    ],
  },
];

const CARD_TONE: Record<string, string> = {
  blue: 'border-l-blue-500 bg-blue-500/10 border-blue-500/25',
  emerald: 'border-l-emerald-500 bg-emerald-500/10 border-emerald-500/25',
  pink: 'border-l-pink-500 bg-pink-500/10 border-pink-500/25',
  amber: 'border-l-amber-500 bg-amber-500/10 border-amber-500/25',
  purple: 'border-l-purple-500 bg-purple-500/10 border-purple-500/25',
};

export const PerspectiveDashboardMockup: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'center center'],
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [14, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [1, 1] : [0.94, 1]);
  const yFloatLeft = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [26, -6]);
  const yFloatRight = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [-20, 8]);

  return (
    <div ref={containerRef} className="relative pt-6 pb-8 [perspective:1400px]">
      {/* Cards Flutuantes Satélites com Profundidade */}
      <motion.div
        style={{ y: yFloatLeft }}
        className="hidden lg:flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border border-emerald-500/40 bg-card/90 backdrop-blur-xl shadow-2xl shadow-emerald-500/10 absolute -left-6 top-16 z-20"
      >
        <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500">
          <TrendingUp className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Retenção FSRS-6</p>
          <p className="text-sm font-black text-foreground font-mono">88.4% Consolidado</p>
        </div>
      </motion.div>

      <motion.div
        style={{ y: yFloatRight }}
        className="hidden lg:flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border border-rose-500/40 bg-card/90 backdrop-blur-xl shadow-2xl shadow-rose-500/10 absolute -right-5 bottom-14 z-20"
      >
        <div className="p-2 rounded-xl bg-rose-500/15 text-rose-500">
          <RotateCcw className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Anti-Bola de Neve</p>
          <p className="text-sm font-black text-foreground">Rebalancear em 1 clique</p>
        </div>
      </motion.div>

      {/* Janela Principal em Perspectiva 3D */}
      <motion.div
        style={{ rotateX, scale }}
        className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-[0_32px_90px_-20px_rgba(37,99,235,0.28)] overflow-hidden"
      >
        {/* Top Bar Window Chrome */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border/70 bg-muted/40">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            <span className="ml-2 text-[11px] font-mono text-muted-foreground hidden sm:inline">
              adaptivemed.app/diario — Grade Semanal FSRS-6
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30">
              <Flame className="h-3 w-3 text-amber-500" /> 14 dias de ofensiva
            </Badge>
            <Badge variant="outline" className="text-[10px] gap-1 bg-primary/10 text-primary border-primary/30 hidden sm:inline-flex">
              <BrainCircuit className="h-3 w-3" /> Cota: 3/5 revisões hoje
            </Badge>
          </div>
        </div>

        {/* Grade Preview */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span className="text-xs sm:text-sm font-bold text-foreground">
                Semana Adaptativa • Residência Médica R1
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold">
                <Sparkles className="h-3 w-3" /> Auto-Estudo Ativo
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PREVIEW_DAYS.map(col => (
              <div
                key={col.day}
                className={`p-3 rounded-2xl border space-y-2.5 ${
                  col.isToday
                    ? 'bg-blue-500/[0.06] border-blue-500/40 ring-1 ring-blue-500/20'
                    : 'bg-background/50 border-border/80'
                }`}
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                  <div>
                    <p className={`text-xs font-bold ${col.isToday ? 'text-primary' : 'text-foreground'}`}>
                      {col.day}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{col.date}</p>
                  </div>
                  {col.isToday && (
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                      HOJE
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {col.items.map(item => (
                    <div
                      key={item.topic}
                      className={`p-2.5 rounded-xl border border-l-4 space-y-1.5 ${CARD_TONE[item.color]}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[9px] font-bold text-muted-foreground truncate">
                          {item.area}
                        </span>
                        <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500 shrink-0" />
                      </div>
                      <p className="text-xs font-bold text-foreground leading-snug">{item.topic}</p>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-mono font-semibold text-primary">{item.tag}</span>
                        {item.pct !== null && (
                          <span className="inline-flex items-center gap-0.5 font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-2.5 w-2.5" /> {item.pct}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
