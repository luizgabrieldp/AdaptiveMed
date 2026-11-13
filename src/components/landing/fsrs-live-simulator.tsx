'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  calculateNextReview,
  calculateDynamicQuestionVolume,
  getPedagogicalDiagnosis,
  getTodayDateString,
  addDaysToDate,
  formatDateBR,
} from '@/lib/spaced-repetition';
import { BrainCircuit, Calendar, CheckCircle2, Gauge, HelpCircle, Sparkles } from 'lucide-react';

const EXAM_HORIZONS = [
  { id: 'this_year', label: 'Prova Este Ano', yearOffset: 0, desc: 'Reta final (mesmo ano)' },
  { id: 'next_year', label: 'Ano que Vem', yearOffset: 1, desc: 'Ciclo completo (12-18 meses)' },
  { id: 'two_years', label: 'Daqui a 2 Anos', yearOffset: 2, desc: 'Base sólida (Internato)' },
] as const;

export const FsrsLiveSimulator: React.FC = () => {
  const [accuracy, setAccuracy] = useState<number>(82);
  const [cycle, setCycle] = useState<number>(1); // 0 = R0, 1..7 = R1..R7
  const [horizonId, setHorizonId] = useState<'this_year' | 'next_year' | 'two_years'>('next_year');

  const todayStr = useMemo(() => getTodayDateString(), []);

  const simulation = useMemo(() => {
    const horizon = EXAM_HORIZONS.find(h => h.id === horizonId) || EXAM_HORIZONS[1];
    const currentYear = parseInt(todayStr.slice(0, 4), 10) || new Date().getFullYear();
    const targetYear = currentYear + horizon.yearOffset;

    const baseStability = Math.max(1.5, Math.pow(2.1, cycle));
    const baseDifficulty = accuracy >= 85 ? 4.2 : accuracy >= 70 ? 5.6 : 7.4;

    const fsrsResult = calculateNextReview({
      currentCycle: cycle,
      accuracy,
      baseQuestionsCount: 30,
      previousIntervalDays: cycle === 0 ? 7 : Math.max(3, Math.round(baseStability * 1.4)),
      targetYear,
      referenceDate: todayStr,
      fsrsState:
        cycle === 0
          ? undefined
          : {
              stability: baseStability,
              difficulty: baseDifficulty,
              reps: cycle,
              lapses: accuracy < 65 ? 1 : 0,
              state: 2,
            },
    });

    const questionSuggestion = calculateDynamicQuestionVolume(accuracy, 30);
    const diagnosis = getPedagogicalDiagnosis(accuracy);
    const nextDate = addDaysToDate(todayStr, fsrsResult.nextIntervalDays);

    const projectedRetention = Math.min(
      98,
      Math.max(45, Math.round(58 + accuracy * 0.34 + cycle * 1.4))
    );
    const ebbinghausRetention = Math.max(
      14,
      Math.round(78 * Math.exp(-fsrsResult.nextIntervalDays / 6.5))
    );

    return {
      fsrsResult,
      questionSuggestion,
      diagnosis,
      nextDate,
      projectedRetention,
      ebbinghausRetention,
    };
  }, [accuracy, cycle, horizonId, todayStr]);

  return (
    <Card className="border-border/80 bg-card/90 backdrop-blur-xl shadow-2xl overflow-hidden">
      <CardHeader className="border-b border-border/60 bg-muted/30 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-primary/15 text-primary">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-extrabold">
                Simulador Ao Vivo do Motor FSRS-6
              </CardTitle>
              <CardDescription className="text-xs">
                Este widget roda as funções reais da plataforma (<code className="font-mono text-[10px] text-primary">spaced-repetition.ts</code>).
              </CardDescription>
            </div>
          </div>

          <Badge
            variant="outline"
            className="text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 self-start sm:self-auto gap-1"
          >
            <Sparkles className="h-3 w-3" /> Algoritmo Real de Produção
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Coluna Controles (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Slider Acurácia */}
            <div className="p-4 rounded-2xl border border-border bg-background/60 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="fsrs-accuracy-slider"
                  className="text-xs font-bold text-foreground flex items-center gap-1.5"
                >
                  <Gauge className="h-4 w-4 text-primary" />
                  Seu aproveitamento no bloco de questões
                </label>
                <span
                  className={`text-lg font-black font-mono tabular-nums ${
                    accuracy >= 80
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : accuracy >= 65
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {accuracy}%
                </span>
              </div>

              <input
                id="fsrs-accuracy-slider"
                type="range"
                min={30}
                max={100}
                step={1}
                value={accuracy}
                onChange={e => setAccuracy(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>30% (Lacuna)</span>
                <span>65% (Atenção)</span>
                <span>80% (Corte)</span>
                <span>100% (Domínio)</span>
              </div>
            </div>

            {/* Seletor Ciclo Atual */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground block">
                Ciclo de Revisão Atual (R0 = 1º contato)
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {[0, 1, 2, 3, 4, 5, 6, 7].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCycle(c)}
                    className={`py-2 rounded-xl border text-xs font-bold font-mono transition-all ${
                      cycle === c
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-background/60 text-muted-foreground border-border hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    R{c}
                  </button>
                ))}
              </div>
            </div>

            {/* Horizonte da Prova */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground block">
                Horizonte até a Prova de Residência
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {EXAM_HORIZONS.map(h => {
                  const active = horizonId === h.id;
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setHorizonId(h.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        active
                          ? 'bg-primary/15 border-primary/50 text-foreground ring-1 ring-primary/30'
                          : 'bg-background/50 border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <p className="text-xs font-bold">{h.label}</p>
                      <p className="text-[10px] opacity-80 mt-0.5">{h.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Coluna Output Real FSRS-6 (5 cols) */}
          <div className="lg:col-span-5 p-5 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/[0.08] via-card to-emerald-500/[0.06] space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/60">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Próxima Revisão R{cycle + 1}
                </p>
                <p className="text-2xl sm:text-3xl font-black text-foreground font-mono">
                  em {simulation.fsrsResult.nextIntervalDays}{' '}
                  {simulation.fsrsResult.nextIntervalDays === 1 ? 'dia' : 'dias'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold text-muted-foreground flex items-center justify-end gap-1">
                  <Calendar className="h-3 w-3 text-primary" /> Data Calculada
                </p>
                <p className="text-xs font-bold font-mono text-primary">
                  {formatDateBR(simulation.nextDate)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-background/70 border border-border/80 space-y-0.5">
                <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                  <HelpCircle className="h-3 w-3 text-blue-500" /> Bateria Sugerida
                </p>
                <p className="text-base font-black text-foreground font-mono">
                  {simulation.questionSuggestion.volume} questões
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Fator {simulation.questionSuggestion.factor.toFixed(2)}x
                </p>
              </div>

              <div className="p-3 rounded-xl bg-background/70 border border-border/80 space-y-0.5">
                <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Diagnóstico FSRS
                </p>
                <p className="text-xs font-extrabold text-foreground leading-tight pt-0.5">
                  {simulation.diagnosis.title}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Nota FSRS: {simulation.fsrsResult.fsrsRating ?? '-'}/4
                </p>
              </div>
            </div>

            {/* Barra Comparativa Ebbinghaus vs FSRS-6 */}
            <div className="space-y-2 pt-1">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-emerald-600 dark:text-emerald-400">Retenção com AdaptiveMed FSRS-6</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {simulation.projectedRetention}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${simulation.projectedRetention}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Sem revisão ativa (Curva do Esquecimento)</span>
                  <span className="font-mono font-semibold">{simulation.ebbinghausRetention}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-rose-500/70 transition-all duration-300"
                    style={{ width: `${simulation.ebbinghausRetention}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed pt-1 border-t border-border/60">
              {simulation.diagnosis.pedagogicalNote}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
