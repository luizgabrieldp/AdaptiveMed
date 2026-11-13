'use client';

import React, { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/lib/store/data-context';
import { useFocusTimer } from '@/components/focus/focus-timer-context';
import { Forest3DScene } from '@/components/focus/forest-3d-scene';
import {
  BOOST_CONFIG,
  FULL_TREE_SECONDS,
  STAGE_BLOCK_SECONDS,
  TREE_BLOCK_SECONDS,
  formatDurationCompact,
  formatSecondsHMS,
  getNurserySlotProgress,
  getTreeStageLabel,
} from '@/lib/focus-timer';
import { getTodayDateString, addDaysToDate, formatDateBR } from '@/lib/spaced-repetition';
import { ForestBoostType, getAreaStyle } from '@/types/database';
import {
  Trees,
  Timer,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  SkipForward,
  Clock,
  Flame,
  Trash2,
  CheckCircle2,
  X,
  BarChart3,
  Sprout,
  Droplets,
  Flower2,
  Sparkles,
} from 'lucide-react';

type ForestPeriodFilter = 'today' | 'week' | 'month' | 'all';

export default function FocoFlorestaPage() {
  const { areas, topics, stats, studySessions, deleteStudySession } = useData();
  const {
    mode,
    phase,
    status,
    focusMinutes,
    breakMinutes,
    displaySeconds,
    elapsedSeconds,
    progressRatio,
    treeStage,
    slotProgressRatio,
    slotStageNumber,
    slotLiveSeconds,
    pendingTreesPreview,
    selectedArea,
    selectedTopicId,
    forestGarden,
    activeSlotIndex,
    boostWallet,
    soundEnabled,
    lastNotice,
    clearNotice,
    setMode,
    setPomodoroDurations,
    setSelectedArea,
    setSelectedTopicId,
    selectNurserySlot,
    applyBoost,
    toggleSound,
    start,
    pause,
    finishAndSave,
    abandonSession,
    skipBreak,
  } = useFocusTimer();

  const [periodFilter, setPeriodFilter] = useState<ForestPeriodFilter>('week');
  const [customFocusInput, setCustomFocusInput] = useState(String(focusMinutes));
  const [customBreakInput, setCustomBreakInput] = useState(String(breakMinutes));

  const todayStr = useMemo(() => getTodayDateString(), []);
  const weekStartStr = useMemo(() => {
    const [y, m, d] = todayStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const dow = dt.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    return addDaysToDate(todayStr, diff);
  }, [todayStr]);
  const monthPrefix = useMemo(() => todayStr.slice(0, 7), [todayStr]);

  const filteredTopics = useMemo(
    () => topics.filter(t => t.area === selectedArea),
    [topics, selectedArea]
  );

  // Estatísticas globais (Hoje / Semana / Mês / Total)
  const kpis = useMemo(() => {
    let todaySec = 0;
    let weekSec = 0;
    let monthSec = 0;
    let totalTrees = forestGarden.maturedTrees.length;

    for (const s of studySessions) {
      if (s.session_date === todayStr) todaySec += s.duration_seconds;
      if (s.session_date >= weekStartStr && s.session_date <= todayStr) weekSec += s.duration_seconds;
      if (s.session_date.startsWith(monthPrefix)) monthSec += s.duration_seconds;
      if (s.status === 'completed') totalTrees += s.trees_earned;
    }

    return { todaySec, weekSec, monthSec, totalTrees };
  }, [studySessions, forestGarden.maturedTrees.length, todayStr, weekStartStr, monthPrefix]);

  // Sessões e árvores de boost filtradas para a Floresta 3D e distribuição por Área
  const periodSessions = useMemo(() => {
    return studySessions.filter(s => {
      if (periodFilter === 'today') return s.session_date === todayStr;
      if (periodFilter === 'week') return s.session_date >= weekStartStr && s.session_date <= todayStr;
      if (periodFilter === 'month') return s.session_date.startsWith(monthPrefix);
      return true;
    });
  }, [studySessions, periodFilter, todayStr, weekStartStr, monthPrefix]);

  const periodMaturedFromGarden = useMemo(() => {
    return forestGarden.maturedTrees.filter(t => {
      if (periodFilter === 'today') return t.sessionDate === todayStr;
      if (periodFilter === 'week') return t.sessionDate >= weekStartStr && t.sessionDate <= todayStr;
      if (periodFilter === 'month') return t.sessionDate.startsWith(monthPrefix);
      return true;
    });
  }, [forestGarden.maturedTrees, periodFilter, todayStr, weekStartStr, monthPrefix]);

  const areaBreakdown = useMemo(() => {
    const map = new Map<string, { seconds: number; trees: number }>();
    let totalSec = 0;

    for (const s of periodSessions) {
      totalSec += s.duration_seconds;
      const curr = map.get(s.area) || { seconds: 0, trees: 0 };
      curr.seconds += s.duration_seconds;
      if (s.status === 'completed') curr.trees += s.trees_earned;
      map.set(s.area, curr);
    }

    for (const m of periodMaturedFromGarden) {
      const curr = map.get(m.area) || { seconds: 0, trees: 0 };
      curr.trees += 1;
      map.set(m.area, curr);
    }

    return Array.from(map.entries())
      .map(([area, info]) => ({
        area,
        seconds: info.seconds,
        trees: info.trees,
        pct: totalSec > 0 ? Math.round((info.seconds / totalSec) * 100) : 0,
      }))
      .sort((a, b) => b.seconds - a.seconds);
  }, [periodSessions, periodMaturedFromGarden]);

  const activeAreaStyle = getAreaStyle(selectedArea, areas);
  const isBreak = mode === 'pomodoro' && phase === 'break';

  const applyCustomDurations = (focusVal: string, breakVal: string) => {
    setCustomFocusInput(focusVal);
    setCustomBreakInput(breakVal);
    const f = parseInt(focusVal, 10);
    const b = parseInt(breakVal, 10);
    if (!isNaN(f) && f >= 5 && f <= 180) {
      setPomodoroDurations(f, !isNaN(b) && b >= 1 && b <= 60 ? b : breakMinutes);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Foco & Floresta
              </h1>
              <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Trees className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Cronometre seus blocos de estudo com Pomodoro ou Cronômetro Livre e cultive sua floresta por Grande Área.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleSound}
            className="text-xs font-semibold gap-1.5 self-start md:self-auto"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-4 w-4 text-emerald-500" /> Alerta Sonoro Ativo
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 text-muted-foreground" /> Alerta Silenciado
              </>
            )}
          </Button>
        </div>

        {/* Banner de feedback */}
        {lastNotice && (
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold animate-fade-in ${
              lastNotice.type === 'withered'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{lastNotice.message}</span>
            </div>
            <button type="button" onClick={clearNotice} className="hover:opacity-75" aria-label="Fechar">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Foco Hoje
                </p>
                <p className="text-2xl font-black text-foreground mt-0.5 tabular-nums">
                  {formatDurationCompact(kpis.todaySec)}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                <Clock className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Esta Semana
                </p>
                <p className="text-2xl font-black text-foreground mt-0.5 tabular-nums">
                  {formatDurationCompact(kpis.weekSec)}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                <Timer className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Neste Mês
                </p>
                <p className="text-2xl font-black text-foreground mt-0.5 tabular-nums">
                  {formatDurationCompact(kpis.monthSec)}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Flame className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Árvores Totais
                </p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
                  {kpis.totalTrees}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Trees className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grid Principal: Console do Timer + Floresta 3D Viva */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Coluna Esquerda (5 cols): Relógio & Controles */}
          <Card className="lg:col-span-5 border-border bg-card shadow-md">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Timer className="h-4 w-4 text-primary" />
                  Sessão de Estudo ao Vivo
                </CardTitle>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-bold ${
                    status === 'running'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      : ''
                  }`}
                >
                  {status === 'running' ? 'Em andamento' : status === 'paused' ? 'Pausado' : 'Pronto'}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                O relógio continua rodando mesmo se você navegar para o Diário ou Caderno de Erros.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-5">
              {/* Modo */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/60">
                <button
                  type="button"
                  disabled={status !== 'idle'}
                  onClick={() => setMode('pomodoro')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-60 ${
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
                  className={`py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-60 ${
                    mode === 'stopwatch'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Cronômetro Livre
                </button>
              </div>

              {/* Presets do Pomodoro */}
              {mode === 'pomodoro' && status === 'idle' && phase === 'focus' && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => applyCustomDurations('25', '5')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        focusMinutes === 25 && breakMinutes === 5
                          ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/40'
                          : 'bg-muted/30 text-muted-foreground border-border hover:text-foreground'
                      }`}
                    >
                      25 min / 5 min (Clássico)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyCustomDurations('50', '10')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        focusMinutes === 50 && breakMinutes === 10
                          ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/40'
                          : 'bg-muted/30 text-muted-foreground border-border hover:text-foreground'
                      }`}
                    >
                      50 min / 10 min (Bloco)
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/60">
                    <span className="font-semibold shrink-0">Personalizado:</span>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={customFocusInput}
                      onChange={e => applyCustomDurations(e.target.value, customBreakInput)}
                      className="w-14 h-7 rounded-lg border border-border bg-background px-2 text-center font-mono font-bold text-foreground"
                      aria-label="Minutos de foco"
                    />
                    <span>min foco •</span>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={customBreakInput}
                      onChange={e => applyCustomDurations(customFocusInput, e.target.value)}
                      className="w-12 h-7 rounded-lg border border-border bg-background px-2 text-center font-mono font-bold text-foreground"
                      aria-label="Minutos de pausa"
                    />
                    <span>min pausa</span>
                  </div>
                </div>
              )}

              {/* Display Central do Relógio */}
              <div className="p-5 rounded-2xl border border-border bg-gradient-to-b from-muted/40 to-card text-center space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-[11px] font-bold">
                  <Sprout
                    className="h-3.5 w-3.5"
                    style={{ color: isBreak ? '#0ea5e9' : activeAreaStyle.primary }}
                  />
                  <span>
                    {isBreak
                      ? 'Descanso programado'
                      : `Canteiro ${activeSlotIndex + 1} • ${getTreeStageLabel(treeStage)}`}
                  </span>
                </div>

                <div className="font-mono text-5xl sm:text-6xl font-black tracking-tight tabular-nums text-foreground">
                  {formatSecondsHMS(displaySeconds)}
                </div>

                <div className="space-y-1.5">
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${Math.round((isBreak ? progressRatio : slotProgressRatio) * 100)}%`,
                        backgroundColor: isBreak ? '#0ea5e9' : activeAreaStyle.primary,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {isBreak
                      ? 'Recupere o fôlego antes do próximo bloco de estudo.'
                      : `Estágio ${slotStageNumber}/4 (${Math.round(
                          slotLiveSeconds / 60
                        )} de ${Math.round(
                          FULL_TREE_SECONDS / 60
                        )} min) • Cada 25 min sobe 1 estágio${
                          pendingTreesPreview > 0 ? ` • +${pendingTreesPreview} madura(s) nesta meta` : ''
                        }`}
                  </p>
                </div>
              </div>

              {/* Seleção de Grande Área e Assunto */}
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Grande Área Estudada (define a cor da árvore)
                  </label>
                  <select
                    value={selectedArea}
                    onChange={e => setSelectedArea(e.target.value)}
                    className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground"
                  >
                    {areas.map(a => (
                      <option key={a.id} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Assunto Relacionado (opcional)
                  </label>
                  <select
                    value={selectedTopicId || ''}
                    onChange={e => setSelectedTopicId(e.target.value || null)}
                    className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs text-foreground"
                  >
                    <option value="">Estudo geral da área (sem assunto fixo)</option>
                    {filteredTopics.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.subject_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ações Principais */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {status === 'running' ? (
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    onClick={pause}
                    className="flex-1 h-11 text-sm font-bold gap-2 border-amber-500/40 text-amber-600 dark:text-amber-400"
                  >
                    <Pause className="h-4 w-4" /> Pausar
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="lg"
                    onClick={start}
                    className="flex-1 h-11 text-sm font-extrabold gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    {status === 'paused' ? 'Retomar Foco' : isBreak ? 'Iniciar Pausa' : 'Plantar & Iniciar'}
                  </Button>
                )}

                {isBreak && (
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    onClick={skipBreak}
                    className="h-11 text-xs font-bold gap-1.5 px-4"
                  >
                    <SkipForward className="h-4 w-4" /> Pular Pausa
                  </Button>
                )}

                {mode === 'stopwatch' && (status !== 'idle' || elapsedSeconds > 0) && (
                  <Button
                    type="button"
                    size="lg"
                    onClick={finishAndSave}
                    className="h-11 text-xs font-extrabold gap-1.5 px-4"
                  >
                    <Square className="h-3.5 w-3.5 fill-current" /> Finalizar & Salvar
                  </Button>
                )}

                {mode === 'pomodoro' && phase === 'focus' && status !== 'idle' && (
                  <Button
                    type="button"
                    size="lg"
                    variant="ghost"
                    onClick={abandonSession}
                    className="h-11 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 px-4"
                  >
                    Desistir
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Coluna Direita (7 cols): Floresta 3D Viva */}
          <Card className="lg:col-span-7 border-border bg-card shadow-md overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Trees className="h-4 w-4 text-emerald-500" />
                    Sua Floresta 3D de Foco
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Cada bloco concluído planta uma árvore viva na cor da Grande Área estudada.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60 self-start sm:self-auto">
                  {[
                    { id: 'today', label: 'Hoje' },
                    { id: 'week', label: 'Semana' },
                    { id: 'month', label: 'Mês' },
                    { id: 'all', label: 'Tudo' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPeriodFilter(tab.id as ForestPeriodFilter)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        periodFilter === tab.id
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              <Forest3DScene
                sessions={periodSessions}
                maturedFromGarden={periodMaturedFromGarden}
                nurserySlots={forestGarden.slots}
                activeSlotIndex={activeSlotIndex}
                activeSlotLiveSeconds={slotLiveSeconds}
                isTimerRunningOrPaused={status !== 'idle' && !isBreak}
                areas={areas}
                onSelectSlot={selectNurserySlot}
              />

              {/* Viveiro Paralelo: 3 Plantas Simultâneas por Estágios de 25 min */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                    <Sprout className="h-3.5 w-3.5 text-emerald-500" />
                    Viveiro Paralelo (3 Plantas Simultâneas • 4 Estágios de 25 min)
                  </p>
                  <span className="text-[11px] text-muted-foreground">
                    Alterne entre os canteiros a qualquer momento
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {forestGarden.slots.map(slot => {
                    const isSelected = slot.slotIndex === activeSlotIndex;
                    const sStyle = getAreaStyle(slot.area, areas);
                    const liveSec = isSelected ? slotLiveSeconds : slot.accumulatedSeconds;
                    const prog = getNurserySlotProgress(liveSec);
                    const hasBees = Boolean(
                      slot.beesActiveUntilMs && slot.beesActiveUntilMs > Date.now()
                    );

                    return (
                      <button
                        key={slot.slotIndex}
                        type="button"
                        onClick={() => selectNurserySlot(slot.slotIndex)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-emerald-500/70 bg-emerald-500/10 ring-1 ring-emerald-500/30 shadow-sm'
                            : 'border-border bg-muted/25 hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-[11px] font-extrabold text-foreground">
                            Canteiro #{slot.slotIndex + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            {hasBees && (
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300"
                                title="Abelhas polinizando este canteiro"
                              >
                                Abelhas
                              </span>
                            )}
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-border bg-card"
                              style={{ color: sStyle.primary }}
                            >
                              Estágio {prog.stageNumber}/4
                            </span>
                          </div>
                        </div>

                        <p className="text-xs font-bold text-foreground truncate mt-1">
                          {slot.area}
                        </p>
                        {slot.subjectName && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {slot.subjectName}
                          </p>
                        )}

                        {/* 4 Barrinhas de Estágio (25 min cada) */}
                        <div className="grid grid-cols-4 gap-1 mt-2">
                          {[0, 1, 2, 3].map(seg => {
                            const segStart = seg * STAGE_BLOCK_SECONDS;
                            const segFill = Math.max(
                              0,
                              Math.min(1, (liveSec - segStart) / STAGE_BLOCK_SECONDS)
                            );
                            return (
                              <div
                                key={seg}
                                className="h-1.5 rounded-full bg-muted overflow-hidden"
                              >
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${Math.round(segFill * 100)}%`,
                                    backgroundColor: sStyle.primary,
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>

                        <p className="text-[10px] text-muted-foreground mt-1.5 tabular-nums">
                          {Math.round(liveSec / 60)}/100 min • faltam{' '}
                          {Math.ceil(prog.remainingToNextStageSec / 60)} min p/ próx. estágio
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Boosts por Questões Resolvidas (Água / Adubo / Abelhas) */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <p className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    Nutrição pelas suas Questões ({stats.totalQuestions.toLocaleString('pt-BR')} questões feitas)
                  </p>
                  <span className="text-[10.5px] text-muted-foreground">
                    Aplica no <strong>Canteiro #{activeSlotIndex + 1}</strong> (Abelhas acelera os 3!)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(
                    [
                      {
                        type: 'water' as ForestBoostType,
                        icon: Droplets,
                        accent: 'text-sky-600 dark:text-sky-400 bg-sky-500/15 border-sky-500/30',
                      },
                      {
                        type: 'fertilizer' as ForestBoostType,
                        icon: Flower2,
                        accent:
                          'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
                      },
                      {
                        type: 'bees' as ForestBoostType,
                        icon: Sparkles,
                        accent:
                          'text-amber-600 dark:text-amber-400 bg-amber-500/15 border-amber-500/30',
                      },
                    ] as const
                  ).map(item => {
                    const cfg = BOOST_CONFIG[item.type];
                    const avail = boostWallet.available[item.type];
                    const nextQ = boostWallet.nextInQuestions[item.type];
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.type}
                        className="p-2.5 rounded-xl border border-border bg-card flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`p-1.5 rounded-lg border shrink-0 ${item.accent}`}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">
                                {cfg.label}
                              </p>
                              <p className="text-[10px] text-muted-foreground leading-tight">
                                {cfg.effectDesc}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-extrabold shrink-0 tabular-nums"
                          >
                            {avail}x
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-muted-foreground">
                            +1 a cada {cfg.questionsRequired} Qs (falta {nextQ})
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            disabled={avail <= 0}
                            onClick={() => void applyBoost(item.type, activeSlotIndex)}
                            className="h-7 px-2.5 text-[11px] font-bold"
                          >
                            Aplicar
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legenda de Cores por Grande Área */}
              <div className="flex flex-wrap items-center gap-2">
                {areas.map(a => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-border bg-muted/30 text-foreground"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: a.color }}
                    />
                    {a.name}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Distribuição de Horas + Histórico */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Distribuição por Grande Área */}
          <Card className="lg:col-span-5 border-border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Horas por Grande Área (Período Selecionado)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {areaBreakdown.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-6 text-center">
                  Nenhuma sessão registrada neste período ainda. Inicie o cronômetro para começar!
                </p>
              ) : (
                areaBreakdown.map(item => {
                  const style = getAreaStyle(item.area, areas);
                  return (
                    <div key={item.area} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground flex items-center gap-1.5">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: style.primary }}
                          />
                          {item.area}
                        </span>
                        <span className="font-mono font-semibold text-muted-foreground">
                          {formatDurationCompact(item.seconds)} • {item.trees}🌳 ({item.pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.max(4, item.pct)}%`,
                            backgroundColor: style.primary,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Histórico de Sessões */}
          <Card className="lg:col-span-7 border-border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Histórico de Sessões ({periodSessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {periodSessions.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-6 text-center">
                  Suas sessões concluídas no Pomodoro ou Cronômetro Livre aparecerão aqui automaticamente.
                </p>
              ) : (
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
                  {periodSessions.map(sess => {
                    const style = getAreaStyle(sess.area, areas);
                    const isWithered = sess.status === 'withered';

                    return (
                      <div
                        key={sess.id}
                        className="p-3 rounded-xl border border-border/80 bg-muted/20 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center flex-wrap gap-1.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${style.bg} ${style.text} ${style.border}`}
                            >
                              {sess.area}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-semibold">
                              {sess.mode === 'pomodoro' ? 'Pomodoro' : 'Cronômetro'}
                            </Badge>
                            {isWithered ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                              >
                                Galho seco (interrompido)
                              </Badge>
                            ) : sess.trees_earned > 0 ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                              >
                                +{sess.trees_earned} {sess.trees_earned === 1 ? 'árvore' : 'árvores'}
                              </Badge>
                            ) : null}
                          </div>

                          <p className="text-xs font-semibold text-foreground truncate">
                            {sess.subject_name || 'Estudo Geral da Grande Área'}
                          </p>
                          <p className="text-[10.5px] text-muted-foreground">
                            {formatDateBR(sess.session_date)} • Duração: {formatDurationCompact(sess.duration_seconds)}
                          </p>
                        </div>

                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteStudySession(sess.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                          title="Excluir sessão do histórico"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
