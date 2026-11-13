'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useData } from '@/lib/store/data-context';
import { FocusMode, ForestBoostType, ForestGardenState, NurserySlotState } from '@/types/database';
import { getTodayDateString } from '@/lib/spaced-repetition';
import {
  BOOST_CONFIG,
  FULL_TREE_SECONDS,
  STAGE_BLOCK_SECONDS,
  TreeGrowthStage,
  advanceNurserySlot,
  applyBoostToGarden,
  calculateFocusOutcome,
  formatDurationCompact,
  getBoostWallet,
  getNurserySlotProgress,
  playGentleChime,
} from '@/lib/focus-timer';

export type TimerPhase = 'focus' | 'break';
export type TimerRunStatus = 'idle' | 'running' | 'paused';

interface PersistedTimerState {
  mode: FocusMode;
  phase: TimerPhase;
  status: TimerRunStatus;
  focusMinutes: number;
  breakMinutes: number;
  startedAtMs: number | null;
  accumulatedSeconds: number;
  sessionStartIso: string | null;
  selectedArea: string;
  selectedTopicId: string | null;
  soundEnabled: boolean;
  isFloatingExpanded: boolean;
}

const STORAGE_KEY = 'adaptivemed_focus_timer_state_v1';

interface FocusTimerContextType {
  mode: FocusMode;
  phase: TimerPhase;
  status: TimerRunStatus;
  focusMinutes: number;
  breakMinutes: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  displaySeconds: number;
  progressRatio: number;
  treeStage: TreeGrowthStage;
  slotProgressRatio: number;
  slotStageNumber: 1 | 2 | 3 | 4;
  slotLiveSeconds: number;
  pendingTreesPreview: number;
  selectedArea: string;
  selectedTopicId: string | null;
  forestGarden: ForestGardenState;
  activeSlotIndex: 0 | 1 | 2;
  activeSlot: NurserySlotState;
  boostWallet: ReturnType<typeof getBoostWallet>;
  soundEnabled: boolean;
  isFloatingExpanded: boolean;
  lastNotice: { type: 'success' | 'info' | 'withered'; message: string } | null;
  clearNotice: () => void;
  setMode: (mode: FocusMode) => void;
  setPomodoroDurations: (focusMins: number, breakMins: number) => void;
  setSelectedArea: (area: string) => void;
  setSlotArea: (slotIndex: 0 | 1 | 2, area: string) => void;
  setSelectedTopicId: (topicId: string | null) => void;
  selectNurserySlot: (slotIndex: 0 | 1 | 2) => void;
  applyBoost: (boostType: ForestBoostType, targetSlotIndex?: 0 | 1 | 2) => Promise<void>;
  toggleSound: () => void;
  setFloatingExpanded: (expanded: boolean) => void;
  start: () => void;
  pause: () => void;
  finishAndSave: () => Promise<void>;
  abandonSession: () => Promise<void>;
  skipBreak: () => void;
}

const FocusTimerContext = createContext<FocusTimerContextType | undefined>(undefined);

export const FocusTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { areas, topics, stats, forestGarden, updateForestGarden, addStudySession } = useData();
  const defaultArea = areas[0]?.name || 'Clínica Médica';
  const activeSlotIndex = forestGarden.activeSlotIndex;
  const activeSlot = forestGarden.slots[activeSlotIndex];

  const [state, setState] = useState<PersistedTimerState>({
    mode: 'pomodoro',
    phase: 'focus',
    status: 'idle',
    focusMinutes: 25,
    breakMinutes: 5,
    startedAtMs: null,
    accumulatedSeconds: 0,
    sessionStartIso: null,
    selectedArea: defaultArea,
    selectedTopicId: null,
    soundEnabled: true,
    isFloatingExpanded: false,
  });

  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [lastNotice, setLastNotice] = useState<{
    type: 'success' | 'info' | 'withered';
    message: string;
  } | null>(null);
  const hasHydratedRef = useRef(false);
  const completionLockRef = useRef(false);

  // Hidrata estado salvo do localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedTimerState>;
        setState(prev => ({
          ...prev,
          ...parsed,
          focusMinutes: Math.max(1, Math.min(180, Number(parsed.focusMinutes) || 25)),
          breakMinutes: Math.max(1, Math.min(60, Number(parsed.breakMinutes) || 5)),
          selectedArea: parsed.selectedArea || defaultArea,
        }));
      }
    } catch {}
    hasHydratedRef.current = true;
  }, [defaultArea]);

  // Persiste no localStorage sempre que alterar
  useEffect(() => {
    if (!hasHydratedRef.current || typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  // Garante que a área selecionada exista caso o usuário personalize áreas
  useEffect(() => {
    if (areas.length > 0 && !areas.some(a => a.name === state.selectedArea)) {
      setState(prev => ({ ...prev, selectedArea: areas[0].name }));
    }
  }, [areas, state.selectedArea]);

  // Intervalo ativo para atualizar o relógio em tempo real
  useEffect(() => {
    if (state.status !== 'running') return;
    setNowMs(Date.now());
    const id = window.setInterval(() => {
      setNowMs(Date.now());
    }, 500);
    return () => window.clearInterval(id);
  }, [state.status]);

  const elapsedSeconds = useMemo(() => {
    if (state.status === 'running' && state.startedAtMs) {
      const delta = Math.max(0, Math.floor((nowMs - state.startedAtMs) / 1000));
      return state.accumulatedSeconds + delta;
    }
    return state.accumulatedSeconds;
  }, [state.status, state.startedAtMs, state.accumulatedSeconds, nowMs]);

  const targetSeconds = useMemo(() => {
    if (state.mode === 'stopwatch') return STAGE_BLOCK_SECONDS;
    return (state.phase === 'focus' ? state.focusMinutes : state.breakMinutes) * 60;
  }, [state.mode, state.phase, state.focusMinutes, state.breakMinutes]);

  const remainingSeconds = useMemo(() => {
    if (state.mode === 'stopwatch') return 0;
    return Math.max(0, targetSeconds - elapsedSeconds);
  }, [state.mode, targetSeconds, elapsedSeconds]);

  const displaySeconds = state.mode === 'pomodoro' ? remainingSeconds : elapsedSeconds;

  const progressRatio = useMemo(() => {
    if (state.mode === 'pomodoro') {
      return targetSeconds > 0 ? Math.min(1, elapsedSeconds / targetSeconds) : 0;
    }
    if (elapsedSeconds === 0) return 0;
    const remainder = elapsedSeconds % STAGE_BLOCK_SECONDS;
    return remainder === 0 ? 1 : remainder / STAGE_BLOCK_SECONDS;
  }, [state.mode, targetSeconds, elapsedSeconds]);

  const isActiveFocus = state.status !== 'idle' && state.phase === 'focus';
  const slotLiveSeconds = activeSlot.accumulatedSeconds + (isActiveFocus ? elapsedSeconds : 0);
  const slotProgress = useMemo(() => getNurserySlotProgress(slotLiveSeconds), [slotLiveSeconds]);

  const treeStage = slotProgress.stage;
  const slotProgressRatio = slotProgress.progressRatio;
  const slotStageNumber = slotProgress.stageNumber;

  const pendingTreesPreview = useMemo(() => {
    const projectedTotal =
      activeSlot.accumulatedSeconds +
      (state.mode === 'stopwatch'
        ? elapsedSeconds
        : state.phase === 'focus'
        ? state.focusMinutes * 60
        : 0);
    return Math.floor(projectedTotal / FULL_TREE_SECONDS);
  }, [activeSlot.accumulatedSeconds, state.mode, state.phase, state.focusMinutes, elapsedSeconds]);

  const boostWallet = useMemo(
    () => getBoostWallet(stats.totalQuestions, forestGarden.boostsSpent),
    [stats.totalQuestions, forestGarden.boostsSpent]
  );

  const effectiveArea = activeSlot.area || state.selectedArea || defaultArea;
  const effectiveTopicId = activeSlot.topicId ?? state.selectedTopicId ?? null;

  const recordSession = useCallback(
    async (mode: FocusMode, durationSec: number, plannedSec?: number | null) => {
      const outcome = calculateFocusOutcome(mode, durationSec, plannedSec);
      if (!outcome.shouldRecord) {
        return { ...outcome, stagesGained: 0, harvestedCount: 0 };
      }

      const topic = effectiveTopicId ? topics.find(t => t.id === effectiveTopicId) : undefined;
      const nowIso = new Date().toISOString();
      const startedIso =
        state.sessionStartIso || new Date(Date.now() - durationSec * 1000).toISOString();
      const today = getTodayDateString();

      let harvestedCount = 0;
      if (outcome.status === 'completed') {
        const { updatedSlot, harvestedTrees } = advanceNurserySlot(
          activeSlot,
          Math.round(durationSec),
          false,
          today
        );
        harvestedCount = harvestedTrees.length;

        const nextSlots = forestGarden.slots.map((s, idx) =>
          idx === activeSlotIndex ? updatedSlot : s
        ) as [NurserySlotState, NurserySlotState, NurserySlotState];

        await updateForestGarden({
          ...forestGarden,
          slots: nextSlots,
        });
      }

      await addStudySession({
        topic_id: topic?.id || null,
        area: topic?.area || effectiveArea || defaultArea,
        subject_name: topic?.subject_name || activeSlot.subjectName || null,
        mode,
        status: outcome.status,
        duration_seconds: Math.round(durationSec),
        planned_seconds: plannedSec ?? null,
        trees_earned: outcome.status === 'completed' ? harvestedCount : 0,
        session_date: today,
        started_at: startedIso,
        ended_at: nowIso,
      });

      return { ...outcome, treesEarned: harvestedCount, harvestedCount };
    },
    [
      effectiveTopicId,
      effectiveArea,
      activeSlot,
      activeSlotIndex,
      forestGarden,
      updateForestGarden,
      state.sessionStartIso,
      topics,
      defaultArea,
      addStudySession,
    ]
  );

  // Detecta término natural do Pomodoro (foco ou pausa)
  useEffect(() => {
    if (
      state.mode !== 'pomodoro' ||
      state.status !== 'running' ||
      elapsedSeconds < targetSeconds ||
      completionLockRef.current
    ) {
      return;
    }

    completionLockRef.current = true;
    const finishedPhase = state.phase;
    const finishedTarget = targetSeconds;

    if (state.soundEnabled) {
      playGentleChime();
    }

    if (finishedPhase === 'focus') {
      void recordSession('pomodoro', finishedTarget, finishedTarget).then(outcome => {
        if (outcome.harvestedCount > 0) {
          setLastNotice({
            type: 'success',
            message: `Ciclo de ${formatDurationCompact(finishedTarget)} concluído! +${outcome.harvestedCount} ${
              outcome.harvestedCount === 1 ? 'árvore frondosa colhida' : 'árvores frondosas colhidas'
            } para sua Floresta Permanente!`,
          });
        } else {
          setLastNotice({
            type: 'success',
            message: `Ciclo de ${formatDurationCompact(
              finishedTarget
            )} concluído! O Canteiro ${activeSlotIndex + 1} (${effectiveArea}) avançou no viveiro.`,
          });
        }
      });

      setState(prev => ({
        ...prev,
        phase: 'break',
        status: 'idle',
        startedAtMs: null,
        accumulatedSeconds: 0,
        sessionStartIso: null,
      }));
    } else {
      setLastNotice({
        type: 'info',
        message: 'Pausa finalizada! Pronto para o próximo bloco de foco.',
      });
      setState(prev => ({
        ...prev,
        phase: 'focus',
        status: 'idle',
        startedAtMs: null,
        accumulatedSeconds: 0,
        sessionStartIso: null,
      }));
    }

    const unlockTimer = window.setTimeout(() => {
      completionLockRef.current = false;
    }, 300);
    return () => window.clearTimeout(unlockTimer);
  }, [state.mode, state.status, state.phase, state.soundEnabled, elapsedSeconds, targetSeconds, recordSession]);

  const setMode = useCallback((mode: FocusMode) => {
    setState(prev => {
      if (prev.status !== 'idle') return prev;
      return {
        ...prev,
        mode,
        phase: 'focus',
        startedAtMs: null,
        accumulatedSeconds: 0,
        sessionStartIso: null,
      };
    });
  }, []);

  const setPomodoroDurations = useCallback((focusMins: number, breakMins: number) => {
    const safeFocus = Math.max(1, Math.min(180, Math.round(focusMins)));
    const safeBreak = Math.max(1, Math.min(60, Math.round(breakMins)));
    setState(prev => {
      if (prev.status !== 'idle') return prev;
      return {
        ...prev,
        focusMinutes: safeFocus,
        breakMinutes: safeBreak,
      };
    });
  }, []);

  const setSlotArea = useCallback(
    (slotIndex: 0 | 1 | 2, area: string) => {
      if (slotIndex === activeSlotIndex) {
        setState(prev => ({
          ...prev,
          selectedArea: area,
          selectedTopicId: null,
        }));
      }
      const nextSlots = forestGarden.slots.map((s, idx) =>
        idx === slotIndex ? { ...s, area, topicId: null, subjectName: null } : s
      ) as [NurserySlotState, NurserySlotState, NurserySlotState];
      void updateForestGarden({
        ...forestGarden,
        slots: nextSlots,
      });
    },
    [forestGarden, activeSlotIndex, updateForestGarden]
  );

  const setSelectedArea = useCallback(
    (area: string) => {
      setSlotArea(activeSlotIndex, area);
    },
    [setSlotArea, activeSlotIndex]
  );

  const setSelectedTopicId = useCallback(
    (topicId: string | null) => {
      const found = topicId ? topics.find(t => t.id === topicId) : undefined;
      setState(prev => ({
        ...prev,
        selectedTopicId: topicId,
        selectedArea: found?.area || prev.selectedArea,
      }));
      const nextSlots = forestGarden.slots.map((s, idx) =>
        idx === activeSlotIndex
          ? {
              ...s,
              area: found?.area || s.area,
              topicId,
              subjectName: found?.subject_name || null,
            }
          : s
      ) as [NurserySlotState, NurserySlotState, NurserySlotState];
      void updateForestGarden({
        ...forestGarden,
        slots: nextSlots,
      });
    },
    [topics, forestGarden, activeSlotIndex, updateForestGarden]
  );

  const selectNurserySlot = useCallback(
    (slotIndex: 0 | 1 | 2) => {
      if (state.status !== 'idle') {
        setLastNotice({
          type: 'info',
          message: 'Finalize ou pause/cancele o timer antes de trocar para outro canteiro.',
        });
        return;
      }
      const target = forestGarden.slots[slotIndex];
      setState(prev => ({
        ...prev,
        selectedArea: target.area,
        selectedTopicId: target.topicId || null,
      }));
      void updateForestGarden({
        ...forestGarden,
        activeSlotIndex: slotIndex,
      });
    },
    [state.status, forestGarden, updateForestGarden]
  );

  const applyBoost = useCallback(
    async (boostType: ForestBoostType, targetSlotIndex?: 0 | 1 | 2) => {
      const targetIdx = targetSlotIndex ?? activeSlotIndex;
      const result = applyBoostToGarden(
        forestGarden,
        stats.totalQuestions,
        boostType,
        targetIdx,
        getTodayDateString()
      );
      if (!result.applied) {
        setLastNotice({
          type: 'info',
          message: `Você ainda não tem cargas de ${BOOST_CONFIG[boostType].shortLabel} disponíveis. Resolva mais questões nos assuntos, revisões ou simulados!`,
        });
        return;
      }

      await updateForestGarden(result.nextGarden);
      if (state.soundEnabled && result.harvestedCount > 0) {
        playGentleChime();
      }

      const cfg = BOOST_CONFIG[boostType];
      if (result.harvestedCount > 0) {
        setLastNotice({
          type: 'success',
          message: `${cfg.label} aplicado! +${result.harvestedCount} ${
            result.harvestedCount === 1 ? 'árvore completou o ciclo' : 'árvores completaram o ciclo'
          } e foi para a Floresta Permanente!`,
        });
      } else {
        setLastNotice({
          type: 'success',
          message: `${cfg.label} aplicado com sucesso (${cfg.effectDesc})!`,
        });
      }
    },
    [activeSlotIndex, forestGarden, stats.totalQuestions, updateForestGarden, state.soundEnabled]
  );

  const toggleSound = useCallback(() => {
    setState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const setFloatingExpanded = useCallback((expanded: boolean) => {
    setState(prev => ({ ...prev, isFloatingExpanded: expanded }));
  }, []);

  const start = useCallback(() => {
    const now = Date.now();
    setLastNotice(null);
    setNowMs(now);
    setState(prev => ({
      ...prev,
      status: 'running',
      startedAtMs: now,
      sessionStartIso: prev.sessionStartIso || new Date(now).toISOString(),
    }));
  }, []);

  const pause = useCallback(() => {
    const now = Date.now();
    setState(prev => {
      if (prev.status !== 'running' || !prev.startedAtMs) return prev;
      const delta = Math.max(0, Math.floor((now - prev.startedAtMs) / 1000));
      return {
        ...prev,
        status: 'paused',
        startedAtMs: null,
        accumulatedSeconds: prev.accumulatedSeconds + delta,
      };
    });
  }, []);

  const finishAndSave = useCallback(async () => {
    const currentElapsed = elapsedSeconds;
    const currentMode = state.mode;
    const planned = currentMode === 'pomodoro' ? state.focusMinutes * 60 : null;

    setState(prev => ({
      ...prev,
      status: 'idle',
      phase: 'focus',
      startedAtMs: null,
      accumulatedSeconds: 0,
      sessionStartIso: null,
    }));

    if (currentElapsed < 60) {
      setLastNotice({
        type: 'info',
        message: 'Sessão com menos de 1 minuto não foi registrada no histórico.',
      });
      return;
    }

    const outcome = await recordSession(currentMode, currentElapsed, planned);
    if (state.soundEnabled && outcome.treesEarned > 0) {
      playGentleChime();
    }

    if (outcome.status === 'withered') {
      setLastNotice({
        type: 'withered',
        message: `Pomodoro interrompido antes do fim (${formatDurationCompact(
          currentElapsed
        )}). Um galho seco ficou registrado na floresta.`,
      });
    } else if (outcome.harvestedCount > 0) {
      setLastNotice({
        type: 'success',
        message: `Sessão de ${formatDurationCompact(currentElapsed)} salva! +${outcome.harvestedCount} ${
          outcome.harvestedCount === 1 ? 'árvore madura plantada' : 'árvores maduras plantadas'
        } na Floresta Permanente.`,
      });
    } else {
      setLastNotice({
        type: 'success',
        message: `+${formatDurationCompact(currentElapsed)} adicionados ao Canteiro ${
          activeSlotIndex + 1
        } (${effectiveArea})! Suas fases ficam salvas mesmo ao alternar entre os canteiros.`,
      });
    }
  }, [
    elapsedSeconds,
    state.mode,
    state.focusMinutes,
    state.soundEnabled,
    recordSession,
    activeSlotIndex,
    effectiveArea,
  ]);

  const abandonSession = useCallback(async () => {
    const currentElapsed = elapsedSeconds;
    const wasFocusPomodoro = state.mode === 'pomodoro' && state.phase === 'focus';
    const planned = state.focusMinutes * 60;

    setState(prev => ({
      ...prev,
      status: 'idle',
      phase: 'focus',
      startedAtMs: null,
      accumulatedSeconds: 0,
      sessionStartIso: null,
    }));

    if (wasFocusPomodoro && currentElapsed >= 60) {
      await recordSession('pomodoro', currentElapsed, planned);
      setLastNotice({
        type: 'withered',
        message: `Pomodoro cancelado após ${formatDurationCompact(
          currentElapsed
        )}. Um galho seco foi marcado na Floresta.`,
      });
    } else {
      setLastNotice(null);
    }
  }, [elapsedSeconds, state.mode, state.phase, state.focusMinutes, recordSession]);

  const skipBreak = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'focus',
      status: 'idle',
      startedAtMs: null,
      accumulatedSeconds: 0,
      sessionStartIso: null,
    }));
  }, []);

  const clearNotice = useCallback(() => setLastNotice(null), []);

  return (
    <FocusTimerContext.Provider
      value={{
        mode: state.mode,
        phase: state.phase,
        status: state.status,
        focusMinutes: state.focusMinutes,
        breakMinutes: state.breakMinutes,
        elapsedSeconds,
        remainingSeconds,
        displaySeconds,
        progressRatio,
        treeStage,
        slotProgressRatio,
        slotStageNumber,
        slotLiveSeconds,
        pendingTreesPreview,
        selectedArea: effectiveArea,
        selectedTopicId: effectiveTopicId,
        forestGarden,
        activeSlotIndex,
        activeSlot,
        boostWallet,
        soundEnabled: state.soundEnabled,
        isFloatingExpanded: state.isFloatingExpanded,
        lastNotice,
        clearNotice,
        setMode,
        setPomodoroDurations,
        setSelectedArea,
        setSlotArea,
        setSelectedTopicId,
        selectNurserySlot,
        applyBoost,
        toggleSound,
        setFloatingExpanded,
        start,
        pause,
        finishAndSave,
        abandonSession,
        skipBreak,
      }}
    >
      {children}
    </FocusTimerContext.Provider>
  );
};

export const useFocusTimer = () => {
  const ctx = useContext(FocusTimerContext);
  if (!ctx) {
    throw new Error('useFocusTimer deve ser usado dentro de FocusTimerProvider');
  }
  return ctx;
};
