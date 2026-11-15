'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useFocusTimer } from './focus-timer-context';
import { useData } from '@/lib/store/data-context';
import { Button } from '@/components/ui/button';
import {
  STOPWATCH_CHIME_OPTIONS,
  formatSecondsHMS,
  getTopicCurrentMomentLabel,
  getTreeStageLabel,
} from '@/lib/focus-timer';
import { getAreaStyle } from '@/types/database';
import {
  Play,
  Pause,
  Square,
  Trees,
  Timer,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  ArrowUpRight,
  SkipForward,
  CheckCircle2,
  X,
  Bell,
} from 'lucide-react';

export const FloatingFocusTimer: React.FC = () => {
  const pathname = usePathname();
  const { areas, topics, reviews } = useData();
  const {
    mode,
    phase,
    status,
    focusMinutes,
    breakMinutes,
    stopwatchChimeMinutes,
    displaySeconds,
    elapsedSeconds,
    progressRatio,
    treeStage,
    slotProgressRatio,
    slotStageNumber,
    forestGarden,
    activeSlotIndex,
    selectedArea,
    selectedTopicId,
    soundEnabled,
    isFloatingExpanded,
    lastNotice,
    clearNotice,
    setMode,
    setPomodoroDurations,
    setStopwatchChimeMinutes,
    setSelectedArea,
    setSelectedTopicId,
    selectNurserySlot,
    toggleSound,
    setFloatingExpanded,
    start,
    pause,
    finishAndSave,
    abandonSession,
    skipBreak,
  } = useFocusTimer();

  const [customMinutesInput, setCustomMinutesInput] = useState(String(focusMinutes));

  const filteredTopics = useMemo(
    () => topics.filter(t => t.area === selectedArea),
    [topics, selectedArea]
  );

  const topicMomentById = useMemo(() => {
    const map = new Map<string, string>();
    for (const topic of filteredTopics) {
      map.set(topic.id, getTopicCurrentMomentLabel(topic, reviews));
    }
    return map;
  }, [filteredTopics, reviews]);

  const selectedTopic = useMemo(
    () => (selectedTopicId ? topics.find(t => t.id === selectedTopicId) : undefined),
    [topics, selectedTopicId]
  );
  const selectedTopicMoment = selectedTopic
    ? getTopicCurrentMomentLabel(selectedTopic, reviews)
    : null;

  // Na própria página /foco o console completo já está em destaque no topo
  if (pathname === '/foco') {
    return null;
  }

  const areaStyle = getAreaStyle(selectedArea, areas);
  const isBreak = mode === 'pomodoro' && phase === 'break';

  // Modo Mini-Pílula Retrátil
  if (!isFloatingExpanded) {
    return (
      <div className="fixed bottom-20 right-3 lg:bottom-6 lg:right-6 z-40 flex flex-col items-end gap-2">
        {lastNotice && (
          <div className="max-w-[290px] p-2.5 rounded-xl bg-card/95 backdrop-blur-xl border border-emerald-500/40 shadow-xl text-[11px] font-medium text-foreground flex items-start gap-2 animate-fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <span className="block leading-snug">{lastNotice.message}</span>
              {lastNotice.type === 'success' && (
                <Link
                  href="/diario"
                  onClick={clearNotice}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
                >
                  Validar no Diário <ArrowUpRight className="h-3 w-3" />
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={clearNotice}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Fechar aviso"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 p-1.5 pl-3 rounded-full bg-card/95 backdrop-blur-xl border-2 border-border shadow-2xl hover:border-primary/50 transition-all">
          <button
            type="button"
            onClick={() => setFloatingExpanded(true)}
            className="flex items-center gap-2 text-left"
            title="Abrir controles de Pomodoro e Cronômetro"
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                status === 'running'
                  ? isBreak
                    ? 'bg-sky-500 animate-pulse'
                    : 'bg-emerald-500 animate-pulse'
                  : status === 'paused'
                  ? 'bg-amber-500'
                  : 'bg-muted-foreground/50'
              }`}
            />
            <Trees className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="font-mono font-black text-sm tabular-nums text-foreground">
              {formatSecondsHMS(displaySeconds)}
            </span>
            <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {mode === 'stopwatch' ? 'Livre' : isBreak ? 'Pausa' : 'Foco'}
            </span>
          </button>

          <div className="flex items-center gap-1 pl-1 border-l border-border/70">
            {status === 'running' ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={pause}
                className="h-7 w-7 rounded-full hover:bg-amber-500/15 text-amber-600 dark:text-amber-400"
                title="Pausar"
              >
                <Pause className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={start}
                className="h-7 w-7 rounded-full hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                title="Iniciar foco"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
              </Button>
            )}

            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setFloatingExpanded(true)}
              className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
              title="Expandir relógio"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Modo Expandido Suspenso
  return (
    <div className="fixed bottom-20 right-3 lg:bottom-6 lg:right-6 z-40 w-[330px] sm:w-[356px] rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-2xl overflow-hidden animate-fade-in">
      {/* Cabeçalho */}
      <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-500">
            <Timer className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-foreground">Relógio de Foco</p>
            <p className="text-[10px] text-muted-foreground">
              {mode === 'pomodoro'
                ? isBreak
                  ? 'Intervalo de descanso'
                  : `Pomodoro ${focusMinutes}/${breakMinutes}`
                : 'Cronômetro livre contínuo'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={toggleSound}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title={soundEnabled ? 'Silenciar alerta' : 'Ativar alerta sonoro'}
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setFloatingExpanded(false)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title="Minimizar para mini-pílula"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-3.5">
        {lastNotice && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <span className="block leading-snug">{lastNotice.message}</span>
              {lastNotice.type === 'success' && (
                <Link
                  href="/diario"
                  onClick={() => {
                    clearNotice();
                    setFloatingExpanded(false);
                  }}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
                >
                  Validar no Diário <ArrowUpRight className="h-3 w-3" />
                </Link>
              )}
            </div>
            <button type="button" onClick={clearNotice} aria-label="Fechar">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Alternador de Modo (bloqueado quando em andamento para evitar perda de sessão) */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-muted/60 border border-border/60">
          <button
            type="button"
            disabled={status !== 'idle'}
            onClick={() => setMode('pomodoro')}
            className={`py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-60 ${
              mode === 'pomodoro'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Pomodoro
          </button>
          <button
            type="button"
            disabled={status !== 'idle'}
            onClick={() => setMode('stopwatch')}
            className={`py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-60 ${
              mode === 'stopwatch'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Cronômetro Livre
          </button>
        </div>

        {/* Presets rápidos quando Pomodoro ocioso */}
        {mode === 'pomodoro' && status === 'idle' && phase === 'focus' && (
          <div className="flex items-center gap-1.5">
            {[
              { f: 25, b: 5, label: '25 / 5' },
              { f: 50, b: 10, label: '50 / 10' },
            ].map(p => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setPomodoroDurations(p.f, p.b);
                  setCustomMinutesInput(String(p.f));
                }}
                className={`flex-1 py-1 rounded-lg border text-[11px] font-bold transition-all ${
                  focusMinutes === p.f && breakMinutes === p.b
                    ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/40'
                    : 'bg-muted/30 text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {p.label} min
              </button>
            ))}

            <div className="flex items-center gap-1">
              <input
                type="number"
                min={5}
                max={180}
                value={customMinutesInput}
                onChange={e => {
                  setCustomMinutesInput(e.target.value);
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 5 && val <= 180) {
                    setPomodoroDurations(val, val >= 45 ? 10 : 5);
                  }
                }}
                className="w-12 h-7 rounded-lg border border-border bg-background px-1.5 text-center text-[11px] font-mono font-bold text-foreground"
                title="Minutos customizados"
              />
              <span className="text-[10px] text-muted-foreground">min</span>
            </div>
          </div>
        )}

        {/* Seletor de aviso sonoro periódico para Cronômetro Livre */}
        {mode === 'stopwatch' && (
          <div className="flex items-center justify-between gap-1.5 rounded-xl bg-muted/30 border border-border/60 px-2.5 py-1.5">
            <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 shrink-0">
              <Bell className="h-3 w-3 text-primary" />
              Sinal a cada:
            </span>
            <div className="flex items-center gap-1 flex-wrap justify-end">
              {STOPWATCH_CHIME_OPTIONS.map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setStopwatchChimeMinutes(mins)}
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                    stopwatchChimeMinutes === mins
                      ? 'bg-primary/15 text-primary border-primary/40'
                      : 'bg-background text-muted-foreground border-border/70 hover:text-foreground'
                  }`}
                >
                  {mins === 0 ? 'Off' : `${mins}m`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Seletor rápido dos 3 Canteiros Paralelos */}
        <div className="grid grid-cols-3 gap-1.5">
          {forestGarden.slots.map(slot => {
            const sStyle = getAreaStyle(slot.area, areas);
            const isSelected = slot.slotIndex === activeSlotIndex;
            const pct = Math.min(100, Math.round((slot.accumulatedSeconds / (4 * 25 * 60)) * 100));
            return (
              <button
                key={slot.slotIndex}
                type="button"
                onClick={() => selectNurserySlot(slot.slotIndex)}
                className={`p-1.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-emerald-500/60 bg-emerald-500/10 shadow-sm'
                    : 'border-border/70 bg-muted/25 hover:bg-muted/50'
                }`}
                title={`Canteiro ${slot.slotIndex + 1} (${slot.area})`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-extrabold text-foreground">
                    Canteiro {slot.slotIndex + 1}
                  </span>
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: sStyle.primary }}
                  />
                </div>
                <p className="text-[9.5px] text-muted-foreground truncate mt-0.5">{slot.area}</p>
                <div className="w-full h-1 rounded-full bg-muted overflow-hidden mt-1">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(8, pct)}%`, backgroundColor: sStyle.primary }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Mostrador Principal + Barra de Crescimento da Árvore */}
        <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/20 text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Trees
              className="h-4 w-4 transition-transform"
              style={{ color: isBreak ? '#0ea5e9' : areaStyle.primary }}
            />
            <span className="text-[11px] font-semibold text-muted-foreground">
              {isBreak
                ? 'Descanso programado'
                : `Canteiro ${activeSlotIndex + 1} • ${getTreeStageLabel(treeStage)}`}
            </span>
          </div>

          <div className="font-mono text-4xl font-black tracking-tight tabular-nums text-foreground">
            {formatSecondsHMS(displaySeconds)}
          </div>

          <div className="space-y-1">
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${Math.round((isBreak ? progressRatio : slotProgressRatio) * 100)}%`,
                  backgroundColor: isBreak ? '#0ea5e9' : areaStyle.primary,
                }}
              />
            </div>
            {!isBreak && (
              <p className="text-[9.5px] text-muted-foreground">
                Ciclo do canteiro: Estágio {slotStageNumber}/4 ({Math.round(slotProgressRatio * 100)}%)
              </p>
            )}
          </div>
        </div>

        {/* Vínculo Opcional de Grande Área / Assunto */}
        <div className="grid grid-cols-1 gap-2">
          <select
            value={selectedArea}
            onChange={e => setSelectedArea(e.target.value)}
            aria-label="Grande Área estudada"
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-[11px] font-semibold text-foreground"
          >
            {areas.map(a => (
              <option key={a.id} value={a.name}>
                Área: {a.name}
              </option>
            ))}
          </select>

          {filteredTopics.length > 0 && (
            <div className="space-y-1.5">
              <select
                value={selectedTopicId || ''}
                onChange={e => setSelectedTopicId(e.target.value || null)}
                aria-label="Assunto opcional"
                className="w-full h-8 rounded-lg border border-border bg-background px-2.5 text-[11px] text-foreground"
              >
                <option value="">Assunto específico (opcional)</option>
                {filteredTopics.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.subject_name} ({topicMomentById.get(t.id) || 'R0'})
                  </option>
                ))}
              </select>
              {selectedTopic && selectedTopicMoment && (
                <div className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-primary/10 border border-primary/25 text-[10px]">
                  <span className="truncate font-semibold text-foreground">
                    {selectedTopic.subject_name}
                  </span>
                  <span className="shrink-0 font-extrabold text-primary bg-background/80 px-1.5 py-0.5 rounded border border-primary/30">
                    {selectedTopicMoment}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botões de Controle */}
        <div className="flex items-center gap-2">
          {status === 'running' ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={pause}
              className="flex-1 h-9 text-xs font-bold gap-1.5 border-amber-500/40 text-amber-600 dark:text-amber-400"
            >
              <Pause className="h-3.5 w-3.5" /> Pausar
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={start}
              className="flex-1 h-9 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              {status === 'paused' ? 'Retomar' : isBreak ? 'Iniciar Pausa' : 'Iniciar Foco'}
            </Button>
          )}

          {isBreak && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={skipBreak}
              className="h-9 text-xs font-semibold gap-1 px-2.5"
              title="Pular descanso"
            >
              <SkipForward className="h-3.5 w-3.5" /> Pular
            </Button>
          )}

          {mode === 'stopwatch' && (status !== 'idle' || elapsedSeconds > 0) && (
            <Button
              type="button"
              size="sm"
              onClick={finishAndSave}
              className="h-9 text-xs font-bold gap-1 px-3"
              title="Finalizar cronômetro e salvar sessão na Floresta"
            >
              <Square className="h-3 w-3 fill-current" /> Salvar
            </Button>
          )}

          {mode === 'pomodoro' && phase === 'focus' && status !== 'idle' && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={abandonSession}
              className="h-9 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 px-2.5"
              title="Cancelar Pomodoro (após 1min gera galho seco)"
            >
              Desistir
            </Button>
          )}
        </div>

        <Link
          href="/foco"
          onClick={() => setFloatingExpanded(false)}
          className="w-full py-2 px-3 rounded-xl border border-border/80 bg-muted/30 hover:bg-muted/60 text-xs font-bold text-primary flex items-center justify-between transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Trees className="h-3.5 w-3.5 text-emerald-500" />
            Ver minha Floresta 3D & Horas
          </span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
};
