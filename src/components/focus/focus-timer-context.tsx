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
import {
  FocusMode,
  ForestBoostType,
  ForestGardenState,
  MaturedGardenTree,
  NurserySlotState,
} from '@/types/database';
import { getTodayDateString } from '@/lib/spaced-repetition';
import {
  BOOST_CONFIG,
  DEFAULT_MAX_CONTINUOUS_MINUTES,
  FULL_TREE_SECONDS,
  STAGE_BLOCK_SECONDS,
  STOPWATCH_CHIME_OPTIONS,
  STOPWATCH_MAX_CONTINUOUS_OPTIONS,
  TreeGrowthStage,
  advanceNurserySlot,
  applyBoostToGarden,
  calculateFocusOutcome,
  evaluatePersistedTimerRecovery,
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
  stopwatchChimeMinutes: number;
  soundEnabled: boolean;
  isFloatingExpanded: boolean;
  pauseOnClose: boolean;
  pauseOnTabSwitch: boolean;
  maxContinuousMinutes: number;
  lastActiveAtMs: number | null;
  ownerTabId: string | null;
  unloadedAtMs: number | null;
}

interface TabReloadMarker {
  tabId: string;
  unloadedAtMs: number;
  wasRunning: boolean;
}

interface BroadcastSyncMessage {
  type: 'STATE_SYNC';
  senderTabId: string;
  state: PersistedTimerState;
}

const STORAGE_KEY = 'adaptivemed_focus_timer_state_v1';
const TAB_ID_SESSION_KEY = 'adaptivemed_focus_tab_id_v1';
const RELOAD_MARKER_SESSION_KEY = 'adaptivemed_focus_tab_reload_v1';
const BROADCAST_CHANNEL_NAME = 'adaptivemed_focus_timer_sync';

const HEARTBEAT_INTERVAL_MS = 5_000;
const OS_SUSPEND_THRESHOLD_MS = 180_000; // 3 min (seguro contra throttling de 60s em background)
const OWNER_TAKEOVER_STALE_MS = 75_000;

function formatTimeHHMM(ms: number): string {
  try {
    return new Date(ms).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function getOrCreateTabId(): string {
  const fallback = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  if (typeof window === 'undefined') return fallback;
  try {
    const existing = window.sessionStorage.getItem(TAB_ID_SESSION_KEY);
    if (existing) return existing;
    window.sessionStorage.setItem(TAB_ID_SESSION_KEY, fallback);
    return fallback;
  } catch {
    return fallback;
  }
}

function sanitizeChimeMinutes(raw: unknown): number {
  const parsed = Number(raw);
  return STOPWATCH_CHIME_OPTIONS.includes(
    parsed as (typeof STOPWATCH_CHIME_OPTIONS)[number]
  )
    ? parsed
    : 25;
}

function sanitizeMaxContinuousMinutes(raw: unknown): number {
  const parsed = Number(raw);
  return STOPWATCH_MAX_CONTINUOUS_OPTIONS.includes(
    parsed as (typeof STOPWATCH_MAX_CONTINUOUS_OPTIONS)[number]
  )
    ? parsed
    : DEFAULT_MAX_CONTINUOUS_MINUTES;
}

function sanitizePersistedState(
  parsed: Partial<PersistedTimerState>,
  fallbackArea: string,
  base: PersistedTimerState
): PersistedTimerState {
  const validMode: FocusMode =
    parsed.mode === 'stopwatch' || parsed.mode === 'pomodoro' ? parsed.mode : base.mode;
  const validPhase: TimerPhase =
    parsed.phase === 'break' || parsed.phase === 'focus' ? parsed.phase : base.phase;
  const validStatus: TimerRunStatus =
    parsed.status === 'running' || parsed.status === 'paused' || parsed.status === 'idle'
      ? parsed.status
      : base.status;

  const startedAtMs =
    typeof parsed.startedAtMs === 'number' && Number.isFinite(parsed.startedAtMs)
      ? parsed.startedAtMs
      : null;
  const accumulatedSeconds = Math.max(0, Math.floor(Number(parsed.accumulatedSeconds) || 0));
  const lastActiveAtMs =
    typeof parsed.lastActiveAtMs === 'number' && Number.isFinite(parsed.lastActiveAtMs)
      ? parsed.lastActiveAtMs
      : null;
  const unloadedAtMs =
    typeof parsed.unloadedAtMs === 'number' && Number.isFinite(parsed.unloadedAtMs)
      ? parsed.unloadedAtMs
      : null;

  return {
    ...base,
    mode: validMode,
    phase: validPhase,
    status: validStatus,
    focusMinutes: Math.max(5, Math.min(180, Math.round(Number(parsed.focusMinutes) || 25))),
    breakMinutes: Math.max(1, Math.min(60, Math.round(Number(parsed.breakMinutes) || 5))),
    startedAtMs: validStatus === 'running' ? startedAtMs : null,
    accumulatedSeconds: validStatus === 'idle' ? 0 : accumulatedSeconds,
    sessionStartIso: typeof parsed.sessionStartIso === 'string' ? parsed.sessionStartIso : null,
    selectedArea: typeof parsed.selectedArea === 'string' && parsed.selectedArea ? parsed.selectedArea : fallbackArea,
    selectedTopicId: typeof parsed.selectedTopicId === 'string' ? parsed.selectedTopicId : null,
    stopwatchChimeMinutes: sanitizeChimeMinutes(parsed.stopwatchChimeMinutes),
    soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : base.soundEnabled,
    isFloatingExpanded:
      typeof parsed.isFloatingExpanded === 'boolean'
        ? parsed.isFloatingExpanded
        : base.isFloatingExpanded,
    pauseOnClose:
      typeof parsed.pauseOnClose === 'boolean' ? parsed.pauseOnClose : true,
    pauseOnTabSwitch:
      typeof parsed.pauseOnTabSwitch === 'boolean' ? parsed.pauseOnTabSwitch : false,
    maxContinuousMinutes: sanitizeMaxContinuousMinutes(parsed.maxContinuousMinutes),
    lastActiveAtMs,
    ownerTabId: typeof parsed.ownerTabId === 'string' ? parsed.ownerTabId : null,
    unloadedAtMs,
  };
}

function isHeartbeatOnlyDiff(a: PersistedTimerState, b: PersistedTimerState): boolean {
  return (
    a.mode === b.mode &&
    a.phase === b.phase &&
    a.status === b.status &&
    a.focusMinutes === b.focusMinutes &&
    a.breakMinutes === b.breakMinutes &&
    a.startedAtMs === b.startedAtMs &&
    a.accumulatedSeconds === b.accumulatedSeconds &&
    a.sessionStartIso === b.sessionStartIso &&
    a.selectedArea === b.selectedArea &&
    a.selectedTopicId === b.selectedTopicId &&
    a.stopwatchChimeMinutes === b.stopwatchChimeMinutes &&
    a.soundEnabled === b.soundEnabled &&
    a.pauseOnClose === b.pauseOnClose &&
    a.pauseOnTabSwitch === b.pauseOnTabSwitch &&
    a.maxContinuousMinutes === b.maxContinuousMinutes &&
    a.ownerTabId === b.ownerTabId &&
    a.unloadedAtMs === b.unloadedAtMs
  );
}

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
  stopwatchChimeMinutes: number;
  pauseOnClose: boolean;
  pauseOnTabSwitch: boolean;
  maxContinuousMinutes: number;
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
  setStopwatchChimeMinutes: (minutes: number) => void;
  setPauseOnClose: (enabled: boolean) => void;
  setPauseOnTabSwitch: (enabled: boolean) => void;
  setMaxContinuousMinutes: (minutes: number) => void;
  setSelectedArea: (area: string) => void;
  setSlotArea: (slotIndex: 0 | 1 | 2, area: string) => void;
  setSelectedTopicId: (topicId: string | null) => void;
  selectNurserySlot: (slotIndex: 0 | 1 | 2) => void;
  applyBoost: (boostType: ForestBoostType, targetSlotIndex?: 0 | 1 | 2) => Promise<void>;
  toggleSound: () => void;
  setFloatingExpanded: (expanded: boolean) => void;
  focusOnTopic: (area: string, topicId?: string | null, autoStart?: boolean) => void;
  start: () => void;
  pause: () => void;
  finishAndSave: () => Promise<void>;
  abandonSession: () => Promise<void>;
  skipBreak: () => void;
}

const FocusTimerContext = createContext<FocusTimerContextType | undefined>(undefined);

export const FocusTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    areas,
    topics,
    stats,
    forestGarden,
    updateForestGarden,
    addStudySession,
    isLoading,
  } = useData();
  const defaultArea = areas[0]?.name || 'Clínica Médica';
  const defaultAreaRef = useRef(defaultArea);
  defaultAreaRef.current = defaultArea;

  const activeSlotIndex = forestGarden.activeSlotIndex;
  const activeSlot = forestGarden.slots[activeSlotIndex];

  const [state, setState] = useState<PersistedTimerState>(() => ({
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
    stopwatchChimeMinutes: 25,
    soundEnabled: true,
    isFloatingExpanded: false,
    pauseOnClose: true,
    pauseOnTabSwitch: false,
    maxContinuousMinutes: DEFAULT_MAX_CONTINUOUS_MINUTES,
    lastActiveAtMs: null,
    ownerTabId: null,
    unloadedAtMs: null,
  }));

  const [isHydrated, setIsHydrated] = useState(false);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [lastNotice, setLastNotice] = useState<{
    type: 'success' | 'info' | 'withered';
    message: string;
  } | null>(null);

  const hasHydratedRef = useRef(false);
  const stateRef = useRef<PersistedTimerState>(state);
  stateRef.current = state;

  const tabIdRef = useRef<string>('');
  const channelRef = useRef<BroadcastChannel | null>(null);
  const isApplyingRemoteSyncRef = useRef(false);
  const didPersistUnloadPauseRef = useRef(false);
  const pendingUnloadPauseStateRef = useRef<PersistedTimerState | null>(null);
  const isMutatingSessionRef = useRef(false);

  const completionLockRef = useRef(false);
  const lastStopwatchChimeMilestoneRef = useRef(0);
  const lastContinuousLimitMilestoneRef = useRef(0);
  const lastTickMsRef = useRef<number>(Date.now());
  const lastHeartbeatMsRef = useRef<number>(Date.now());

  const broadcastState = useCallback((nextState: PersistedTimerState) => {
    try {
      if (channelRef.current && tabIdRef.current) {
        const msg: BroadcastSyncMessage = {
          type: 'STATE_SYNC',
          senderTabId: tabIdRef.current,
          state: nextState,
        };
        channelRef.current.postMessage(msg);
      }
    } catch {
      // Ignora caso o canal tenha sido fechado ou indisponível
    }
  }, []);

  const persistStateNow = useCallback(
    (nextState: PersistedTimerState, shouldBroadcast = true) => {
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      } catch {
        // Ignora erro de quota/privacidade
      }
      if (shouldBroadcast) {
        broadcastState(nextState);
      }
    },
    [broadcastState]
  );

  // Hidratação única do localStorage + detecção de F5 rápido vs fechamento/crash (StrictMode-safe)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (hasHydratedRef.current) {
      setIsHydrated(true);
      return;
    }
    hasHydratedRef.current = true;

    const currentTabId = getOrCreateTabId();
    tabIdRef.current = currentTabId;

    const now = Date.now();
    let reloadMarker: TabReloadMarker | null = null;
    try {
      const rawMarker = window.sessionStorage.getItem(RELOAD_MARKER_SESSION_KEY);
      if (rawMarker) {
        window.sessionStorage.removeItem(RELOAD_MARKER_SESSION_KEY);
        const parsedMarker = JSON.parse(rawMarker) as Partial<TabReloadMarker>;
        if (
          typeof parsedMarker.tabId === 'string' &&
          typeof parsedMarker.unloadedAtMs === 'number' &&
          Number.isFinite(parsedMarker.unloadedAtMs) &&
          typeof parsedMarker.wasRunning === 'boolean'
        ) {
          reloadMarker = {
            tabId: parsedMarker.tabId,
            unloadedAtMs: parsedMarker.unloadedAtMs,
            wasRunning: parsedMarker.wasRunning,
          };
        }
      }
    } catch {
      // Ignora erro ao acessar sessionStorage
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedTimerState>;
        const base = sanitizePersistedState(parsed, defaultAreaRef.current, stateRef.current);

        let hydrated: PersistedTimerState = base;
        let notice: { type: 'success' | 'info' | 'withered'; message: string } | null = null;

        // Caso A: F5 / reload nesta mesma aba após Camada 1 ter gravado pause em beforeunload/pagehide
        if (
          reloadMarker &&
          reloadMarker.wasRunning &&
          reloadMarker.tabId === currentTabId &&
          base.status === 'paused' &&
          base.unloadedAtMs !== null
        ) {
          const recovery = evaluatePersistedTimerRecovery({
            status: 'running',
            mode: base.mode,
            startedAtMs: null,
            accumulatedSeconds: base.accumulatedSeconds,
            lastActiveAtMs: base.lastActiveAtMs,
            ownerTabId: reloadMarker.tabId,
            currentTabId,
            nowMs: now,
            pauseOnClose: base.pauseOnClose,
            unloadedAtMs: reloadMarker.unloadedAtMs,
          });

          if (!recovery.shouldAutoPause) {
            hydrated = {
              ...base,
              status: 'running',
              startedAtMs: now,
              accumulatedSeconds: base.accumulatedSeconds,
              lastActiveAtMs: now,
              ownerTabId: currentTabId,
              unloadedAtMs: null,
            };
          } else {
            const pauseTs = recovery.pausedAtMs ?? base.unloadedAtMs ?? now;
            hydrated = {
              ...base,
              status: 'paused',
              startedAtMs: null,
              accumulatedSeconds: recovery.recoveredAccumulatedSeconds,
              lastActiveAtMs: pauseTs,
              unloadedAtMs: null,
            };
            notice = {
              type: 'info',
              message: `Sessão pausada automaticamente às ${formatTimeHHMM(
                pauseTs
              )} ao fechar/recarregar a página para não computar horas extras. Clique em Retomar ou Salvar.`,
            };
          }
        } else if (base.status === 'paused' && base.unloadedAtMs !== null) {
          // Caso B: aba foi fechada pela Camada 1 e reaberta em outra aba/momento
          const pauseTs = base.unloadedAtMs;
          hydrated = {
            ...base,
            status: 'paused',
            startedAtMs: null,
            unloadedAtMs: null,
          };
          notice = {
            type: 'info',
            message: `Sessão pausada automaticamente às ${formatTimeHHMM(
              pauseTs
            )} ao fechar a página para não computar horas com o navegador fechado. Clique em Retomar ou Salvar.`,
          };
        } else if (base.status === 'running') {
          // Caso C: estava salvo como running (crash sem pagehide, legado ou outra aba aberta)
          const recovery = evaluatePersistedTimerRecovery({
            status: base.status,
            mode: base.mode,
            startedAtMs: base.startedAtMs,
            accumulatedSeconds: base.accumulatedSeconds,
            lastActiveAtMs: base.lastActiveAtMs,
            ownerTabId: base.ownerTabId,
            currentTabId,
            nowMs: now,
            pauseOnClose: base.pauseOnClose,
            unloadedAtMs: base.unloadedAtMs,
          });

          if (recovery.shouldAutoPause) {
            const pauseTs = recovery.pausedAtMs ?? base.lastActiveAtMs ?? now;
            hydrated = {
              ...base,
              status: 'paused',
              startedAtMs: null,
              accumulatedSeconds: recovery.recoveredAccumulatedSeconds,
              lastActiveAtMs: pauseTs,
              unloadedAtMs: null,
            };
            notice = {
              type: 'info',
              message:
                recovery.reason === 'page_closed'
                  ? `Sessão pausada automaticamente às ${formatTimeHHMM(
                      pauseTs
                    )} ao fechar a página para não computar horas extras. Clique em Retomar ou Salvar.`
                  : `Sessão pausada automaticamente às ${formatTimeHHMM(
                      pauseTs
                    )} (fechamento/hibernação detectada) para não contar horas com a página fechada. Clique em Retomar ou Salvar.`,
            };
          } else {
            hydrated = {
              ...base,
              unloadedAtMs: null,
              ownerTabId: base.ownerTabId || currentTabId,
            };
          }
        }

        const initialElapsed =
          hydrated.status === 'running' && hydrated.startedAtMs
            ? hydrated.accumulatedSeconds +
              Math.max(0, Math.floor((now - hydrated.startedAtMs) / 1000))
            : hydrated.accumulatedSeconds;

        lastStopwatchChimeMilestoneRef.current =
          hydrated.stopwatchChimeMinutes > 0
            ? Math.floor(initialElapsed / (hydrated.stopwatchChimeMinutes * 60))
            : 0;
        lastContinuousLimitMilestoneRef.current =
          hydrated.maxContinuousMinutes > 0
            ? Math.floor(initialElapsed / (hydrated.maxContinuousMinutes * 60))
            : 0;

        lastTickMsRef.current = now;
        lastHeartbeatMsRef.current = hydrated.lastActiveAtMs ?? now;
        stateRef.current = hydrated;
        setNowMs(now);
        setState(hydrated);
        if (notice) {
          setLastNotice(notice);
        }
      }
    } catch {
      // Ignora JSON corrompido no localStorage
    }

    setIsHydrated(true);
  }, []);

  // Persiste no localStorage somente após a hidratação commitar (evita sobrescrever com idle no StrictMode)
  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;

    if (isApplyingRemoteSyncRef.current) {
      isApplyingRemoteSyncRef.current = false;
      return;
    }

    const toPersist: PersistedTimerState =
      state.status === 'running'
        ? {
            ...state,
            lastActiveAtMs:
              Math.max(state.lastActiveAtMs ?? 0, lastHeartbeatMsRef.current) || Date.now(),
          }
        : state;

    stateRef.current = toPersist;
    persistStateNow(toPersist, true);
  }, [state, isHydrated, persistStateNow]);

  // Garante que a área selecionada exista caso o usuário personalize áreas
  useEffect(() => {
    if (areas.length > 0 && !areas.some(a => a.name === state.selectedArea)) {
      setState(prev => ({ ...prev, selectedArea: areas[0].name }));
    }
  }, [areas, state.selectedArea]);

  // Destrava completionLockRef deterministicamente sempre que não estiver rodando
  useEffect(() => {
    if (state.status !== 'running') {
      completionLockRef.current = false;
    }
  }, [state.status]);

  // Helper de auto-pausa por suspensão/hibernação do SO
  const autoPauseFromSuspension = useCallback(
    (fallbackPauseMs: number, now: number) => {
      const curr = stateRef.current;
      if (curr.status !== 'running' || !curr.pauseOnClose || !curr.startedAtMs) return;

      // Usa o timestamp mais recente de atividade conhecida (nunca perde minutos estudados
      // caso state.lastActiveAtMs não tenha disparado re-render durante os heartbeats de 5s)
      const latestKnownActiveMs = Math.max(
        curr.startedAtMs,
        curr.lastActiveAtMs ?? 0,
        lastHeartbeatMsRef.current,
        fallbackPauseMs
      );
      const freezeAt = Math.min(now, latestKnownActiveMs);
      const deltaSec = Math.max(0, Math.floor((freezeAt - curr.startedAtMs) / 1000));
      const pausedState: PersistedTimerState = {
        ...curr,
        status: 'paused',
        startedAtMs: null,
        accumulatedSeconds: curr.accumulatedSeconds + deltaSec,
        lastActiveAtMs: freezeAt,
        unloadedAtMs: null,
      };

      pendingUnloadPauseStateRef.current = null;
      didPersistUnloadPauseRef.current = false;
      lastTickMsRef.current = now;
      lastHeartbeatMsRef.current = freezeAt;
      stateRef.current = pausedState;
      persistStateNow(pausedState, true);
      setNowMs(now);
      setState(pausedState);
      setLastNotice({
        type: 'info',
        message: `Sessão pausada automaticamente às ${formatTimeHHMM(
          freezeAt
        )} (suspensão/hibernação do computador detectada). Clique em Retomar ou Salvar.`,
      });
    },
    [persistStateNow]
  );

  // Camada 1 (pagehide + beforeunload + freeze) e Camada 3 (visibilitychange)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelBeforeUnloadRestoreTimer: number | null = null;

    const clearBeforeUnloadRestoreTimer = () => {
      if (cancelBeforeUnloadRestoreTimer !== null) {
        window.clearTimeout(cancelBeforeUnloadRestoreTimer);
        cancelBeforeUnloadRestoreTimer = null;
      }
    };

    const handleUnloadOrFreeze = (event: Event) => {
      if (event.type === 'pagehide' || event.type === 'freeze') {
        clearBeforeUnloadRestoreTimer();
      }
      const curr = stateRef.current;
      if (curr.status !== 'running' || !curr.pauseOnClose || !curr.startedAtMs) return;
      if (didPersistUnloadPauseRef.current) {
        // Se beforeunload já persistiu, garante que pagehide/freeze também atualize o estado React
        if ((event.type === 'pagehide' || event.type === 'freeze') && pendingUnloadPauseStateRef.current) {
          setState(pendingUnloadPauseStateRef.current);
        }
        return;
      }
      // Somente a aba dona pausa ao fechar; fechar uma aba secundária mantém o timer da aba principal rodando
      if (curr.ownerTabId && tabIdRef.current && curr.ownerTabId !== tabIdRef.current) {
        return;
      }

      const now = Date.now();
      const deltaSec = Math.max(0, Math.floor((now - curr.startedAtMs) / 1000));
      const pausedState: PersistedTimerState = {
        ...curr,
        status: 'paused',
        startedAtMs: null,
        accumulatedSeconds: curr.accumulatedSeconds + deltaSec,
        lastActiveAtMs: now,
        unloadedAtMs: now,
        ownerTabId: tabIdRef.current || curr.ownerTabId,
      };

      didPersistUnloadPauseRef.current = true;
      pendingUnloadPauseStateRef.current = pausedState;
      lastHeartbeatMsRef.current = now;
      persistStateNow(pausedState, true);

      try {
        const marker: TabReloadMarker = {
          tabId: tabIdRef.current || getOrCreateTabId(),
          unloadedAtMs: now,
          wasRunning: true,
        };
        window.sessionStorage.setItem(RELOAD_MARKER_SESSION_KEY, JSON.stringify(marker));
      } catch {
        // Ignora erro de sessionStorage
      }

      if (event.type === 'freeze' || event.type === 'pagehide') {
        stateRef.current = pausedState;
        setState(pausedState);
      } else if (event.type === 'beforeunload') {
        // Se o beforeunload não resultou em fechamento real (ex: download ou navegação cancelada), restaura
        const previousRunning = curr;
        clearBeforeUnloadRestoreTimer();
        cancelBeforeUnloadRestoreTimer = window.setTimeout(() => {
          cancelBeforeUnloadRestoreTimer = null;
          if (
            didPersistUnloadPauseRef.current &&
            pendingUnloadPauseStateRef.current !== null &&
            document.visibilityState === 'visible' &&
            stateRef.current.status === 'running'
          ) {
            didPersistUnloadPauseRef.current = false;
            pendingUnloadPauseStateRef.current = null;
            try {
              window.sessionStorage.removeItem(RELOAD_MARKER_SESSION_KEY);
            } catch {
              // Ignora
            }
            const restoredNow = Date.now();
            lastHeartbeatMsRef.current = restoredNow;
            const restored: PersistedTimerState = {
              ...previousRunning,
              lastActiveAtMs: restoredNow,
              unloadedAtMs: null,
            };
            persistStateNow(restored, true);
          }
        }, 1500);
      }
    };

    const handlePageShowOrResume = (event: Event) => {
      const wasFrozenOrBfcache =
        event.type === 'resume' ||
        (event instanceof PageTransitionEvent && event.persisted);
      if (!wasFrozenOrBfcache) return;

      const hadPersistedPause = didPersistUnloadPauseRef.current;
      const savedPauseState = pendingUnloadPauseStateRef.current;
      didPersistUnloadPauseRef.current = false;
      pendingUnloadPauseStateRef.current = null;

      if (hadPersistedPause) {
        const basePaused = savedPauseState ?? stateRef.current;
        const pauseTs = basePaused.unloadedAtMs ?? basePaused.lastActiveAtMs ?? Date.now();
        const cleanedState: PersistedTimerState = {
          ...basePaused,
          status: 'paused',
          startedAtMs: null,
          unloadedAtMs: null,
        };
        const now = Date.now();
        lastTickMsRef.current = now;
        lastHeartbeatMsRef.current = pauseTs;
        stateRef.current = cleanedState;
        persistStateNow(cleanedState, true);
        setState(cleanedState);
        setNowMs(now);
        setLastNotice({
          type: 'info',
          message: `Sessão pausada automaticamente às ${formatTimeHHMM(
            pauseTs
          )} ao suspender/sair da página. Clique em Retomar ou Salvar.`,
        });
      }
    };

    const handleVisibilityChange = () => {
      const curr = stateRef.current;
      const now = Date.now();

      if (document.visibilityState === 'hidden') {
        if (curr.status === 'running' && curr.startedAtMs) {
          if (curr.pauseOnTabSwitch) {
            const deltaSec = Math.max(0, Math.floor((now - curr.startedAtMs) / 1000));
            const pausedState: PersistedTimerState = {
              ...curr,
              status: 'paused',
              startedAtMs: null,
              accumulatedSeconds: curr.accumulatedSeconds + deltaSec,
              lastActiveAtMs: now,
              unloadedAtMs: null,
            };
            pendingUnloadPauseStateRef.current = null;
            didPersistUnloadPauseRef.current = false;
            stateRef.current = pausedState;
            lastTickMsRef.current = now;
            lastHeartbeatMsRef.current = now;
            persistStateNow(pausedState, true);
            setState(pausedState);
            setLastNotice({
              type: 'info',
              message: `Sessão pausada automaticamente às ${formatTimeHHMM(
                now
              )} ao sair da aba ("Pausar ao sair da aba" está ativo).`,
            });
          } else if (!curr.ownerTabId || curr.ownerTabId === tabIdRef.current) {
            // Atualiza heartbeat imediatamente antes de ir para segundo plano
            lastHeartbeatMsRef.current = now;
            const heartbeatState: PersistedTimerState = {
              ...curr,
              lastActiveAtMs: now,
              ownerTabId: tabIdRef.current || curr.ownerTabId,
            };
            persistStateNow(heartbeatState, false);
          }
        }
      } else if (document.visibilityState === 'visible') {
        if (curr.status === 'running' && curr.pauseOnClose) {
          const referenceMs = Math.max(
            lastTickMsRef.current,
            curr.lastActiveAtMs ?? 0,
            lastHeartbeatMsRef.current
          );
          if (referenceMs > 0 && now - referenceMs > OS_SUSPEND_THRESHOLD_MS) {
            autoPauseFromSuspension(referenceMs, now);
            return;
          }
        }
        lastTickMsRef.current = now;
        setNowMs(now);
      }
    };

    window.addEventListener('pagehide', handleUnloadOrFreeze);
    window.addEventListener('beforeunload', handleUnloadOrFreeze);
    document.addEventListener('freeze', handleUnloadOrFreeze);
    window.addEventListener('pageshow', handlePageShowOrResume);
    document.addEventListener('resume', handlePageShowOrResume);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearBeforeUnloadRestoreTimer();
      window.removeEventListener('pagehide', handleUnloadOrFreeze);
      window.removeEventListener('beforeunload', handleUnloadOrFreeze);
      document.removeEventListener('freeze', handleUnloadOrFreeze);
      window.removeEventListener('pageshow', handlePageShowOrResume);
      document.removeEventListener('resume', handlePageShowOrResume);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [autoPauseFromSuspension, persistStateNow]);

  // Camada 4: Sincronização Multi-Aba (BroadcastChannel + window storage event)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const applyRemoteState = (rawState: Partial<PersistedTimerState>) => {
      const prevState = stateRef.current;
      const sanitized = sanitizePersistedState(
        rawState,
        defaultAreaRef.current,
        prevState
      );
      // Preserva o estado expandido/recolhido do flutuante de forma independente por aba
      const merged: PersistedTimerState = {
        ...sanitized,
        isFloatingExpanded: prevState.isFloatingExpanded,
      };

      const now = Date.now();
      if (isHeartbeatOnlyDiff(prevState, merged)) {
        // Apenas atualização de heartbeat: atualiza ref monotônica sem disparar re-render
        if (merged.lastActiveAtMs) {
          lastHeartbeatMsRef.current = Math.max(
            lastHeartbeatMsRef.current,
            merged.lastActiveAtMs
          );
        }
        return;
      }

      const remoteElapsed =
        merged.status === 'running' && merged.startedAtMs
          ? merged.accumulatedSeconds +
            Math.max(0, Math.floor((now - merged.startedAtMs) / 1000))
          : merged.accumulatedSeconds;

      lastStopwatchChimeMilestoneRef.current =
        merged.stopwatchChimeMinutes > 0
          ? Math.floor(remoteElapsed / (merged.stopwatchChimeMinutes * 60))
          : 0;
      lastContinuousLimitMilestoneRef.current =
        merged.maxContinuousMinutes > 0
          ? Math.floor(remoteElapsed / (merged.maxContinuousMinutes * 60))
          : 0;

      if (merged.status !== 'running') {
        completionLockRef.current = false;
      }
      didPersistUnloadPauseRef.current = false;
      pendingUnloadPauseStateRef.current = null;
      lastTickMsRef.current = now;
      lastHeartbeatMsRef.current = merged.lastActiveAtMs ?? now;
      stateRef.current = merged;
      isApplyingRemoteSyncRef.current = true;
      setNowMs(now);
      setState(merged);

      if (
        prevState.status === 'running' &&
        merged.status === 'paused' &&
        merged.unloadedAtMs !== null
      ) {
        setLastNotice({
          type: 'info',
          message: `A aba principal foi fechada às ${formatTimeHHMM(
            merged.unloadedAtMs
          )} e o timer foi pausado automaticamente. Clique em Retomar se quiser continuar nesta aba.`,
        });
      } else if (prevState.status !== 'running' && merged.status === 'running') {
        setLastNotice(null);
      }
    };

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channelRef.current = bc;
        bc.onmessage = (event: MessageEvent<BroadcastSyncMessage>) => {
          const data = event.data;
          if (!data || data.type !== 'STATE_SYNC') return;
          if (data.senderTabId === tabIdRef.current) return;
          if (data.state && typeof data.state === 'object') {
            applyRemoteState(data.state);
          }
        };
      }
    } catch {
      bc = null;
      channelRef.current = null;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue) as Partial<PersistedTimerState>;
        applyRemoteState(parsed);
      } catch {
        // Ignora payload malformado
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (bc) {
        try {
          bc.close();
        } catch {
          // Ignora
        }
      }
      if (channelRef.current === bc) {
        channelRef.current = null;
      }
    };
  }, []);

  // Camada 2: Intervalo ativo (500ms) + Heartbeat (5s) + Detecção de suspensão/hibernação do SO
  useEffect(() => {
    if (state.status !== 'running') return;

    const initialNow = Date.now();
    lastTickMsRef.current = initialNow;
    didPersistUnloadPauseRef.current = false;
    setNowMs(initialNow);

    const id = window.setInterval(() => {
      const now = Date.now();
      const curr = stateRef.current;
      if (curr.status !== 'running') return;

      const prevTick = lastTickMsRef.current;
      if (curr.pauseOnClose && now - prevTick > OS_SUSPEND_THRESHOLD_MS) {
        autoPauseFromSuspension(prevTick, now);
        return;
      }

      lastTickMsRef.current = now;
      setNowMs(now);

      // Heartbeat a cada 5s pela aba dona (ou assumindo liderança se a dona ficou obsoleta)
      const isOwner = !curr.ownerTabId || curr.ownerTabId === tabIdRef.current;
      const latestHeartbeatMs = Math.max(curr.lastActiveAtMs ?? 0, lastHeartbeatMsRef.current);
      const ownerIsStale = Boolean(
        !isOwner &&
          document.visibilityState === 'visible' &&
          latestHeartbeatMs > 0 &&
          now - latestHeartbeatMs > OWNER_TAKEOVER_STALE_MS
      );

      if ((isOwner || ownerIsStale) && now - lastHeartbeatMsRef.current >= HEARTBEAT_INTERVAL_MS) {
        lastHeartbeatMsRef.current = now;
        const nextOwner = tabIdRef.current || curr.ownerTabId;
        const heartbeatState: PersistedTimerState = {
          ...curr,
          lastActiveAtMs: now,
          ownerTabId: nextOwner,
        };
        persistStateNow(heartbeatState, false);
        if (ownerIsStale && nextOwner !== curr.ownerTabId) {
          setState(prev =>
            prev.status === 'running'
              ? { ...prev, ownerTabId: nextOwner, lastActiveAtMs: now }
              : prev
          );
        }
      }
    }, 500);

    return () => window.clearInterval(id);
  }, [state.status, autoPauseFromSuspension, persistStateNow]);

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
      const nowMsValue = Date.now();
      const nowIso = new Date(nowMsValue).toISOString();
      const startedIso =
        state.sessionStartIso || new Date(nowMsValue - durationSec * 1000).toISOString();
      const today = getTodayDateString();
      const resolvedArea = topic?.area || effectiveArea || defaultArea;
      const resolvedSubject = topic?.subject_name || activeSlot.subjectName || null;
      const roundedDuration = Math.round(durationSec);

      let harvestedCount = 0;
      let updatedSlotResult: NurserySlotState | null = null;
      let harvestedTreesResult: MaturedGardenTree[] = [];

      if (outcome.status === 'completed') {
        const { updatedSlot, harvestedTrees } = advanceNurserySlot(
          activeSlot,
          roundedDuration,
          false,
          today,
          nowMsValue,
          {
            source: 'session',
            durationSeconds: roundedDuration,
            areaOverride: resolvedArea,
            subjectNameOverride: resolvedSubject,
          }
        );
        harvestedCount = harvestedTrees.length;
        updatedSlotResult = updatedSlot;
        harvestedTreesResult = harvestedTrees;
      }

      const savedSession = await addStudySession({
        topic_id: topic?.id || null,
        area: resolvedArea,
        subject_name: resolvedSubject,
        mode,
        status: outcome.status,
        duration_seconds: roundedDuration,
        planned_seconds: plannedSec ?? null,
        trees_earned: outcome.status === 'completed' ? harvestedCount : 0,
        session_date: today,
        started_at: startedIso,
        ended_at: nowIso,
      });

      if (outcome.status === 'completed' && updatedSlotResult) {
        const enrichedHarvested: MaturedGardenTree[] = harvestedTreesResult.map(tree => ({
          ...tree,
          completedAtIso: nowIso,
          sessionId: savedSession.id,
        }));

        const nextSlots = forestGarden.slots.map((s, idx) =>
          idx === activeSlotIndex ? updatedSlotResult! : s
        ) as [NurserySlotState, NurserySlotState, NurserySlotState];

        await updateForestGarden({
          ...forestGarden,
          slots: nextSlots,
          maturedTrees: [...(forestGarden.maturedTrees || []), ...enrichedHarvested].slice(-120),
        });
      }

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

  // Detecta término natural do Pomodoro (foco ou pausa) — aguarda isLoading === false e evita duplicação multi-aba
  useEffect(() => {
    if (
      !isHydrated ||
      isLoading ||
      state.mode !== 'pomodoro' ||
      state.status !== 'running' ||
      elapsedSeconds < targetSeconds ||
      completionLockRef.current
    ) {
      return;
    }

    const isOwner = !state.ownerTabId || state.ownerTabId === tabIdRef.current;
    const latestHeartbeatMs = Math.max(state.lastActiveAtMs ?? 0, lastHeartbeatMsRef.current);
    const ownerIsStale = Boolean(
      !isOwner &&
        latestHeartbeatMs > 0 &&
        Date.now() - latestHeartbeatMs > OWNER_TAKEOVER_STALE_MS
    );
    if (!isOwner && !ownerIsStale) {
      return;
    }

    completionLockRef.current = true;
    const finishedPhase = state.phase;
    const finishedTarget = targetSeconds;
    const finishedSlotIndex = activeSlotIndex;
    const finishedArea = effectiveArea;

    if (state.soundEnabled) {
      playGentleChime();
    }

    if (finishedPhase === 'focus') {
      void recordSession('pomodoro', finishedTarget, finishedTarget)
        .then(outcome => {
          if (outcome.harvestedCount > 0) {
            setLastNotice({
              type: 'success',
              message: `Ciclo de ${formatDurationCompact(finishedTarget)} concluído! +${outcome.harvestedCount} ${
                outcome.harvestedCount === 1
                  ? 'árvore frondosa colhida'
                  : 'árvores frondosas colhidas'
              } para sua Floresta Permanente!`,
            });
          } else {
            setLastNotice({
              type: 'success',
              message: `Ciclo de ${formatDurationCompact(
                finishedTarget
              )} concluído! O Canteiro ${finishedSlotIndex + 1} (${finishedArea}) avançou no viveiro.`,
            });
          }
        })
        .catch(() => {
          setLastNotice({
            type: 'info',
            message:
              'Ciclo concluído, mas houve um erro ao sincronizar a sessão. Verifique sua conexão.',
          });
        });

      setState(prev => ({
        ...prev,
        phase: 'break',
        status: 'idle',
        startedAtMs: null,
        accumulatedSeconds: 0,
        sessionStartIso: null,
        lastActiveAtMs: null,
        ownerTabId: null,
        unloadedAtMs: null,
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
        lastActiveAtMs: null,
        ownerTabId: null,
        unloadedAtMs: null,
      }));
    }
  }, [
    isHydrated,
    isLoading,
    state.mode,
    state.status,
    state.phase,
    state.soundEnabled,
    state.ownerTabId,
    state.lastActiveAtMs,
    elapsedSeconds,
    targetSeconds,
    recordSession,
    activeSlotIndex,
    effectiveArea,
  ]);

  // Auto-pausa por limite contínuo no Cronômetro Livre (evita horas esquecidas)
  useEffect(() => {
    if (!isHydrated) return;
    if (state.status === 'idle' || elapsedSeconds === 0) {
      lastContinuousLimitMilestoneRef.current = 0;
      return;
    }
    if (
      state.mode !== 'stopwatch' ||
      state.status !== 'running' ||
      state.maxContinuousMinutes <= 0
    ) {
      return;
    }
    const isOwner = !state.ownerTabId || state.ownerTabId === tabIdRef.current;
    const latestHeartbeatMs = Math.max(state.lastActiveAtMs ?? 0, lastHeartbeatMsRef.current);
    const ownerIsStale = Boolean(
      !isOwner &&
        latestHeartbeatMs > 0 &&
        Date.now() - latestHeartbeatMs > OWNER_TAKEOVER_STALE_MS
    );
    if (!isOwner && !ownerIsStale) {
      return;
    }

    const limitSec = state.maxContinuousMinutes * 60;
    const milestone = Math.floor(elapsedSeconds / limitSec);
    if (milestone >= 1 && milestone > lastContinuousLimitMilestoneRef.current) {
      lastContinuousLimitMilestoneRef.current = milestone;
      const now = Date.now();
      const cappedSeconds = Math.min(elapsedSeconds, milestone * limitSec);
      const pausedState: PersistedTimerState = {
        ...stateRef.current,
        status: 'paused',
        startedAtMs: null,
        accumulatedSeconds: cappedSeconds,
        lastActiveAtMs: now,
        unloadedAtMs: null,
      };
      pendingUnloadPauseStateRef.current = null;
      didPersistUnloadPauseRef.current = false;
      lastHeartbeatMsRef.current = now;
      stateRef.current = pausedState;
      setState(pausedState);
      if (state.soundEnabled) {
        playGentleChime();
      }
      const hoursLabel =
        state.maxContinuousMinutes % 60 === 0
          ? `${state.maxContinuousMinutes / 60}h`
          : `${state.maxContinuousMinutes} min`;
      setLastNotice({
        type: 'info',
        message: `Cronômetro pausado automaticamente após ${hoursLabel} contínuas para evitar horas esquecidas. Clique em Retomar ou Salvar.`,
      });
    }
  }, [
    isHydrated,
    state.mode,
    state.status,
    state.maxContinuousMinutes,
    state.ownerTabId,
    state.lastActiveAtMs,
    state.soundEnabled,
    elapsedSeconds,
  ]);

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
        lastActiveAtMs: null,
        ownerTabId: null,
        unloadedAtMs: null,
      };
    });
  }, []);

  const setPomodoroDurations = useCallback((focusMins: number, breakMins: number) => {
    const safeFocus = Math.max(5, Math.min(180, Math.round(focusMins)));
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

  const setPauseOnClose = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, pauseOnClose: Boolean(enabled) }));
  }, []);

  const setPauseOnTabSwitch = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, pauseOnTabSwitch: Boolean(enabled) }));
  }, []);

  const setMaxContinuousMinutes = useCallback(
    (minutes: number) => {
      const sanitized = sanitizeMaxContinuousMinutes(minutes);
      lastContinuousLimitMilestoneRef.current =
        sanitized > 0 ? Math.floor(elapsedSeconds / (sanitized * 60)) : 0;
      setState(prev => ({ ...prev, maxContinuousMinutes: sanitized }));
    },
    [elapsedSeconds]
  );

  const setSlotArea = useCallback(
    (slotIndex: 0 | 1 | 2, area: string) => {
      if (slotIndex === activeSlotIndex && stateRef.current.status !== 'idle') {
        setLastNotice({
          type: 'info',
          message: 'Finalize/salve ou cancele a sessão ativa antes de alterar a Grande Área.',
        });
        return;
      }
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
      if (
        stateRef.current.status !== 'idle' &&
        found?.area &&
        found.area !== activeSlot.area
      ) {
        setLastNotice({
          type: 'info',
          message: 'Finalize/salve ou cancele a sessão ativa antes de trocar para outra Grande Área.',
        });
        return;
      }
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
    [topics, forestGarden, activeSlotIndex, activeSlot.area, updateForestGarden]
  );

  const selectNurserySlot = useCallback(
    (slotIndex: 0 | 1 | 2) => {
      if (state.status !== 'idle') {
        setLastNotice({
          type: 'info',
          message: 'Finalize/salve ou cancele a sessão ativa antes de trocar para outro canteiro.',
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
            result.harvestedCount === 1
              ? 'árvore completou o ciclo'
              : 'árvores completaram o ciclo'
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

  const setStopwatchChimeMinutes = useCallback(
    (minutes: number) => {
      const sanitized = sanitizeChimeMinutes(minutes);
      lastStopwatchChimeMilestoneRef.current =
        sanitized > 0 ? Math.floor(elapsedSeconds / (sanitized * 60)) : 0;
      setState(prev => ({ ...prev, stopwatchChimeMinutes: sanitized }));
    },
    [elapsedSeconds]
  );

  // Sinal sonoro periódico no Cronômetro Livre sem interromper a contagem
  useEffect(() => {
    if (!isHydrated) return;
    if (state.status === 'idle' || elapsedSeconds === 0) {
      lastStopwatchChimeMilestoneRef.current = 0;
      return;
    }
    if (
      state.mode !== 'stopwatch' ||
      state.status !== 'running' ||
      state.stopwatchChimeMinutes <= 0
    ) {
      return;
    }
    if (state.ownerTabId && state.ownerTabId !== tabIdRef.current) {
      return;
    }
    const intervalSec = state.stopwatchChimeMinutes * 60;
    const milestone = Math.floor(elapsedSeconds / intervalSec);
    if (milestone >= 1 && milestone > lastStopwatchChimeMilestoneRef.current) {
      lastStopwatchChimeMilestoneRef.current = milestone;
      if (state.soundEnabled) {
        playGentleChime();
      }
      setLastNotice({
        type: 'info',
        message: `Aviso do Cronômetro: ${milestone * state.stopwatchChimeMinutes} min atingidos — contagem continua!`,
      });
    }
  }, [
    isHydrated,
    state.mode,
    state.status,
    state.stopwatchChimeMinutes,
    state.soundEnabled,
    state.ownerTabId,
    elapsedSeconds,
  ]);

  const toggleSound = useCallback(() => {
    setState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const setFloatingExpanded = useCallback((expanded: boolean) => {
    setState(prev => ({ ...prev, isFloatingExpanded: expanded }));
  }, []);

  const focusOnTopic = useCallback(
    (area: string, topicId?: string | null, autoStart = true) => {
      const foundTopic = topicId ? topics.find(t => t.id === topicId) : undefined;
      const resolvedTopicId = foundTopic
        ? foundTopic.id
        : topics.length === 0
        ? topicId || null
        : null;
      const rawArea = foundTopic?.area || area || defaultArea;
      const resolvedArea =
        areas.length === 0 || areas.some(a => a.name === rawArea) ? rawArea : defaultArea;
      const resolvedSubject = foundTopic?.subject_name || null;

      // Se há sessão em andamento (rodando ou pausada), NÃO trocar de canteiro/área para não transferir segundos entre áreas
      if (state.status !== 'idle') {
        setState(prev => ({
          ...prev,
          isFloatingExpanded: true,
        }));
        const targetLabel = resolvedSubject ? `${resolvedSubject} (${resolvedArea})` : resolvedArea;
        setLastNotice({
          type: 'info',
          message: `Há uma sessão ${
            state.status === 'paused' ? 'pausada' : 'em andamento'
          } no Canteiro ${activeSlotIndex + 1} (${effectiveArea}). Finalize/salve ou cancele antes de trocar para ${targetLabel}.`,
        });
        return;
      }

      let targetSlotIndex: 0 | 1 | 2 = activeSlotIndex;
      if (activeSlot.area !== resolvedArea && activeSlot.accumulatedSeconds > 0) {
        const sameAreaIdx = forestGarden.slots.findIndex(s => s.area === resolvedArea);
        if (sameAreaIdx === 0 || sameAreaIdx === 1 || sameAreaIdx === 2) {
          targetSlotIndex = sameAreaIdx;
        } else {
          const emptyIdx = forestGarden.slots.findIndex(s => s.accumulatedSeconds === 0);
          if (emptyIdx === 0 || emptyIdx === 1 || emptyIdx === 2) {
            targetSlotIndex = emptyIdx;
          }
        }
      }

      const nextSlots = forestGarden.slots.map((s, idx) =>
        idx === targetSlotIndex
          ? {
              ...s,
              area: resolvedArea,
              topicId: resolvedTopicId,
              subjectName: resolvedSubject,
            }
          : s
      ) as [NurserySlotState, NurserySlotState, NurserySlotState];

      void updateForestGarden({
        ...forestGarden,
        activeSlotIndex: targetSlotIndex,
        slots: nextSlots,
      });

      const now = Date.now();
      const shouldStart = autoStart !== false;
      if (shouldStart) {
        completionLockRef.current = false;
        didPersistUnloadPauseRef.current = false;
        pendingUnloadPauseStateRef.current = null;
        lastTickMsRef.current = now;
        lastHeartbeatMsRef.current = now;
        setNowMs(now);
      }

      setState(prev => {
        const base = {
          ...prev,
          selectedArea: resolvedArea,
          selectedTopicId: resolvedTopicId,
          isFloatingExpanded: true,
        };
        if (shouldStart) {
          return {
            ...base,
            phase: 'focus' as TimerPhase,
            status: 'running' as TimerRunStatus,
            startedAtMs: now,
            accumulatedSeconds: 0,
            sessionStartIso: new Date(now).toISOString(),
            lastActiveAtMs: now,
            ownerTabId: tabIdRef.current || getOrCreateTabId(),
            unloadedAtMs: null,
          };
        }
        return {
          ...base,
          phase: 'focus' as TimerPhase,
          startedAtMs: null,
          accumulatedSeconds: 0,
          sessionStartIso: null,
          lastActiveAtMs: null,
          ownerTabId: null,
          unloadedAtMs: null,
        };
      });

      const labelSuffix = resolvedSubject ? ` (${resolvedSubject})` : ` (${resolvedArea})`;
      setLastNotice({
        type: 'info',
        message: `Foco vinculado ao assunto!${labelSuffix}`,
      });
    },
    [
      areas,
      topics,
      defaultArea,
      activeSlotIndex,
      activeSlot,
      effectiveArea,
      forestGarden,
      state.status,
      updateForestGarden,
    ]
  );

  const start = useCallback(() => {
    const now = Date.now();
    if (!tabIdRef.current) {
      tabIdRef.current = getOrCreateTabId();
    }
    completionLockRef.current = false;
    didPersistUnloadPauseRef.current = false;
    pendingUnloadPauseStateRef.current = null;
    lastTickMsRef.current = now;
    lastHeartbeatMsRef.current = now;
    setLastNotice(null);
    setNowMs(now);
    setState(prev => ({
      ...prev,
      status: 'running',
      startedAtMs: now,
      sessionStartIso: prev.sessionStartIso || new Date(now).toISOString(),
      lastActiveAtMs: now,
      ownerTabId: tabIdRef.current,
      unloadedAtMs: null,
    }));
  }, []);

  const pause = useCallback(() => {
    const now = Date.now();
    didPersistUnloadPauseRef.current = false;
    pendingUnloadPauseStateRef.current = null;
    lastTickMsRef.current = now;
    lastHeartbeatMsRef.current = now;
    setState(prev => {
      if (prev.status !== 'running' || !prev.startedAtMs) return prev;
      const delta = Math.max(0, Math.floor((now - prev.startedAtMs) / 1000));
      return {
        ...prev,
        status: 'paused',
        startedAtMs: null,
        accumulatedSeconds: prev.accumulatedSeconds + delta,
        lastActiveAtMs: now,
        unloadedAtMs: null,
      };
    });
  }, []);

  const finishAndSave = useCallback(async () => {
    if (isMutatingSessionRef.current) return;
    const curr = stateRef.current;
    const now = Date.now();
    const currentElapsed =
      curr.status === 'running' && curr.startedAtMs
        ? curr.accumulatedSeconds + Math.max(0, Math.floor((now - curr.startedAtMs) / 1000))
        : curr.accumulatedSeconds;
    if (curr.status === 'idle' && currentElapsed === 0) return;

    isMutatingSessionRef.current = true;
    const currentMode = curr.mode;
    const planned = currentMode === 'pomodoro' ? curr.focusMinutes * 60 : null;
    completionLockRef.current = false;
    didPersistUnloadPauseRef.current = false;
    pendingUnloadPauseStateRef.current = null;
    lastStopwatchChimeMilestoneRef.current = 0;
    lastContinuousLimitMilestoneRef.current = 0;

    const resetState: PersistedTimerState = {
      ...curr,
      status: 'idle',
      phase: 'focus',
      startedAtMs: null,
      accumulatedSeconds: 0,
      sessionStartIso: null,
      lastActiveAtMs: null,
      ownerTabId: null,
      unloadedAtMs: null,
    };
    stateRef.current = resetState;
    setState(resetState);

    try {
      if (currentElapsed < 60) {
        setLastNotice({
          type: 'info',
          message: 'Sessão com menos de 1 minuto não foi registrada no histórico.',
        });
        return;
      }

      const outcome = await recordSession(currentMode, currentElapsed, planned);
      if (curr.soundEnabled && outcome.treesEarned > 0) {
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
    } catch {
      setLastNotice({
        type: 'info',
        message: 'Não foi possível salvar a sessão no momento. Verifique sua conexão.',
      });
    } finally {
      isMutatingSessionRef.current = false;
    }
  }, [recordSession, activeSlotIndex, effectiveArea]);

  const abandonSession = useCallback(async () => {
    if (isMutatingSessionRef.current) return;
    const curr = stateRef.current;
    const now = Date.now();
    const currentElapsed =
      curr.status === 'running' && curr.startedAtMs
        ? curr.accumulatedSeconds + Math.max(0, Math.floor((now - curr.startedAtMs) / 1000))
        : curr.accumulatedSeconds;
    if (curr.status === 'idle' && currentElapsed === 0) return;

    isMutatingSessionRef.current = true;
    const wasFocusPomodoro = curr.mode === 'pomodoro' && curr.phase === 'focus';
    const planned = curr.focusMinutes * 60;
    completionLockRef.current = false;
    didPersistUnloadPauseRef.current = false;
    pendingUnloadPauseStateRef.current = null;
    lastStopwatchChimeMilestoneRef.current = 0;
    lastContinuousLimitMilestoneRef.current = 0;

    const resetState: PersistedTimerState = {
      ...curr,
      status: 'idle',
      phase: 'focus',
      startedAtMs: null,
      accumulatedSeconds: 0,
      sessionStartIso: null,
      lastActiveAtMs: null,
      ownerTabId: null,
      unloadedAtMs: null,
    };
    stateRef.current = resetState;
    setState(resetState);

    try {
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
    } catch {
      setLastNotice({
        type: 'info',
        message: 'Sessão encerrada, mas houve um erro ao registrar o cancelamento.',
      });
    } finally {
      isMutatingSessionRef.current = false;
    }
  }, [recordSession]);

  const skipBreak = useCallback(() => {
    completionLockRef.current = false;
    didPersistUnloadPauseRef.current = false;
    pendingUnloadPauseStateRef.current = null;
    setState(prev => ({
      ...prev,
      phase: 'focus',
      status: 'idle',
      startedAtMs: null,
      accumulatedSeconds: 0,
      sessionStartIso: null,
      lastActiveAtMs: null,
      ownerTabId: null,
      unloadedAtMs: null,
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
        stopwatchChimeMinutes: state.stopwatchChimeMinutes,
        pauseOnClose: state.pauseOnClose,
        pauseOnTabSwitch: state.pauseOnTabSwitch,
        maxContinuousMinutes: state.maxContinuousMinutes,
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
        setStopwatchChimeMinutes,
        setPauseOnClose,
        setPauseOnTabSwitch,
        setMaxContinuousMinutes,
        setSelectedArea,
        setSlotArea,
        setSelectedTopicId,
        selectNurserySlot,
        applyBoost,
        toggleSound,
        setFloatingExpanded,
        focusOnTopic,
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
