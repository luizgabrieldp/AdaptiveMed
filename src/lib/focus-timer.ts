import {
  ErrorLogCause,
  FocusMode,
  FocusSessionStatus,
  ForestBoostType,
  ForestGardenState,
  MaturedGardenTree,
  NurserySlotState,
  StudySession,
  StudyTopic,
  TopicReview,
} from '@/types/database';
import { getTodayDateString } from './spaced-repetition';

export const STOPWATCH_CHIME_OPTIONS = [0, 15, 20, 25, 30] as const;
export const STOPWATCH_MAX_CONTINUOUS_OPTIONS = [0, 120, 180, 240] as const;
export const DEFAULT_MAX_CONTINUOUS_MINUTES = 180;
export const DEFAULT_SAME_TAB_RELOAD_WINDOW_MS = 8_000;
export const DEFAULT_STALE_HEARTBEAT_THRESHOLD_MS = 120_000;

export interface PersistedTimerRecoveryParams {
  status: 'idle' | 'running' | 'paused';
  mode: FocusMode;
  startedAtMs: number | null;
  accumulatedSeconds: number;
  lastActiveAtMs: number | null;
  ownerTabId?: string | null;
  currentTabId: string;
  nowMs: number;
  pauseOnClose: boolean;
  unloadedAtMs?: number | null;
  sameTabReloadWindowMs?: number;
  staleHeartbeatThresholdMs?: number;
}

export interface PersistedTimerRecoveryResult {
  shouldAutoPause: boolean;
  recoveredAccumulatedSeconds: number;
  pausedAtMs: number | null;
  reason: 'none' | 'page_closed' | 'stale_heartbeat';
}

/**
 * Avalia deterministicamente, ao hidratar uma sessão persistida no localStorage,
 * se um timer salvo como `running` deve continuar rodando (ex: F5 rápido na mesma aba
 * ou outra aba ainda ativa enviando heartbeat recente) ou se deve ser congelado
 * no último momento ativo (`unloadedAtMs` / `lastActiveAtMs` / `startedAtMs`),
 * evitando computar horas com a página fechada ou o computador hibernado.
 */
export function evaluatePersistedTimerRecovery(
  params: PersistedTimerRecoveryParams
): PersistedTimerRecoveryResult {
  const safeAccumulated = Math.max(0, Math.floor(Number(params.accumulatedSeconds) || 0));
  const rawSameTabWindow = params.sameTabReloadWindowMs;
  const sameTabWindow =
    typeof rawSameTabWindow === 'number' && Number.isFinite(rawSameTabWindow)
      ? Math.max(0, rawSameTabWindow)
      : DEFAULT_SAME_TAB_RELOAD_WINDOW_MS;
  const rawStaleThreshold = params.staleHeartbeatThresholdMs;
  const staleThreshold =
    typeof rawStaleThreshold === 'number' && Number.isFinite(rawStaleThreshold)
      ? Math.max(0, rawStaleThreshold)
      : DEFAULT_STALE_HEARTBEAT_THRESHOLD_MS;

  if (params.status !== 'running' || !params.pauseOnClose) {
    return {
      shouldAutoPause: false,
      recoveredAccumulatedSeconds: safeAccumulated,
      pausedAtMs: null,
      reason: 'none',
    };
  }

  const startedAtMs =
    typeof params.startedAtMs === 'number' && Number.isFinite(params.startedAtMs)
      ? params.startedAtMs
      : null;
  const lastActiveAtMs =
    typeof params.lastActiveAtMs === 'number' && Number.isFinite(params.lastActiveAtMs)
      ? params.lastActiveAtMs
      : null;
  const unloadedAtMs =
    typeof params.unloadedAtMs === 'number' && Number.isFinite(params.unloadedAtMs)
      ? params.unloadedAtMs
      : null;
  const nowMs = Number.isFinite(params.nowMs) ? params.nowMs : Date.now();

  const freezeAtTimestamp = (
    targetMs: number,
    reason: 'page_closed' | 'stale_heartbeat'
  ): PersistedTimerRecoveryResult => {
    const clampedPauseMs = Math.min(nowMs, targetMs);
    const deltaSec =
      startedAtMs !== null
        ? Math.max(0, Math.floor((clampedPauseMs - startedAtMs) / 1000))
        : 0;
    return {
      shouldAutoPause: true,
      recoveredAccumulatedSeconds: safeAccumulated + deltaSec,
      pausedAtMs: clampedPauseMs,
      reason,
    };
  };

  // Caso 1: a aba registrou descarregamento explícito (pagehide / beforeunload / freeze)
  if (unloadedAtMs !== null) {
    const isSameTab = Boolean(params.ownerTabId && params.ownerTabId === params.currentTabId);
    const unloadGapMs = nowMs - unloadedAtMs;
    if (isSameTab && unloadGapMs >= 0 && unloadGapMs <= sameTabWindow) {
      return {
        shouldAutoPause: false,
        recoveredAccumulatedSeconds: safeAccumulated,
        pausedAtMs: null,
        reason: 'none',
      };
    }
    return freezeAtTimestamp(unloadedAtMs, 'page_closed');
  }

  // Caso 2: sem unload explícito (crash, kill do navegador, hibernação ou outra aba ainda aberta)
  const referenceActiveMs = lastActiveAtMs ?? startedAtMs;
  if (referenceActiveMs === null) {
    return {
      shouldAutoPause: true,
      recoveredAccumulatedSeconds: safeAccumulated,
      pausedAtMs: nowMs,
      reason: 'stale_heartbeat',
    };
  }

  const heartbeatAgeMs = nowMs - referenceActiveMs;
  if (heartbeatAgeMs <= staleThreshold) {
    return {
      shouldAutoPause: false,
      recoveredAccumulatedSeconds: safeAccumulated,
      pausedAtMs: null,
      reason: 'none',
    };
  }

  return freezeAtTimestamp(referenceActiveMs, 'stale_heartbeat');
}

export type TreeGrowthStage = 'seed' | 'sprout' | 'sapling' | 'mature';

export const TREE_BLOCK_SECONDS = 25 * 60; // 25 minutos por estágio de crescimento
export const STAGE_BLOCK_SECONDS = TREE_BLOCK_SECONDS;
export const STAGES_PER_TREE = 4;
export const FULL_TREE_SECONDS = STAGE_BLOCK_SECONDS * STAGES_PER_TREE; // 100 min (4 estágios de 25 min)

export const BOOST_CONFIG: Record<
  ForestBoostType,
  {
    questionsRequired: number;
    bonusSeconds: number;
    label: string;
    shortLabel: string;
    effectDesc: string;
    appliesToAllSlots?: boolean;
  }
> = {
  water: {
    questionsRequired: 10,
    bonusSeconds: 10 * 60,
    label: 'Água Cristalina',
    shortLabel: 'Água',
    effectDesc: '+10 min no canteiro selecionado',
  },
  fertilizer: {
    questionsRequired: 25,
    bonusSeconds: 25 * 60,
    label: 'Adubo Orgânico',
    shortLabel: 'Adubo',
    effectDesc: '+25 min (+1 estágio) no canteiro',
  },
  bees: {
    questionsRequired: 50,
    bonusSeconds: 25 * 60,
    label: 'Enxame de Abelhas',
    shortLabel: 'Abelhas',
    effectDesc: '+1 estágio nos 3 canteiros ao mesmo tempo',
    appliesToAllSlots: true,
  },
};

/**
 * Calcula quantas árvores foram cultivadas em uma sessão ao vivo e seu status final.
 * - Pomodoro: ganha >= 1 árvore somente se atingir o tempo planejado (mínimo 60s se custom).
 *   Se interrompido antes do término com >= 60s, registra galho seco ('withered', 0 árvores).
 * - Cronômetro Livre: ganha 1 árvore a cada 25 minutos completos (1500s) sem penalidade.
 */
export function calculateFocusOutcome(
  mode: FocusMode,
  durationSeconds: number,
  plannedSeconds?: number | null
): { status: FocusSessionStatus; treesEarned: number; shouldRecord: boolean } {
  const safeDuration = Math.max(0, Math.floor(durationSeconds));

  if (safeDuration < 60) {
    return { status: 'withered', treesEarned: 0, shouldRecord: false };
  }

  if (mode === 'pomodoro') {
    const target = Math.max(60, Math.floor(plannedSeconds || TREE_BLOCK_SECONDS));
    if (safeDuration >= target) {
      const treesEarned = Math.max(1, Math.floor(safeDuration / TREE_BLOCK_SECONDS));
      return { status: 'completed', treesEarned, shouldRecord: true };
    }
    return { status: 'withered', treesEarned: 0, shouldRecord: true };
  }

  // Modo cronômetro livre: 1 árvore a cada 25 min completos
  const treesEarned = Math.floor(safeDuration / TREE_BLOCK_SECONDS);
  return { status: 'completed', treesEarned, shouldRecord: true };
}

/**
 * Retorna o estágio visual de crescimento da árvore com base na fração de progresso (0..1).
 * 4 estágios (4 × 25 min = 100 min no viveiro paralelo):
 *  - [0.00, 0.25): Estágio 1 — Semente germinando
 *  - [0.25, 0.50): Estágio 2 — Broto folhoso
 *  - [0.50, 0.75): Estágio 3 — Árvore jovem
 *  - [0.75, 1.00]: Estágio 4 — Copa em floração (quase pronta para a floresta)
 */
export function getTreeGrowthStage(progressRatio: number): TreeGrowthStage {
  const p = Math.max(0, Math.min(1, progressRatio));
  if (p < 0.25) return 'seed';
  if (p < 0.5) return 'sprout';
  if (p < 0.75) return 'sapling';
  return 'mature';
}

export function getTreeStageLabel(stage: TreeGrowthStage): string {
  switch (stage) {
    case 'seed':
      return 'Estágio 1/4 • Semente germinando';
    case 'sprout':
      return 'Estágio 2/4 • Broto em crescimento';
    case 'sapling':
      return 'Estágio 3/4 • Árvore jovem';
    case 'mature':
      return 'Estágio 4/4 • Copa em floração';
  }
}

export function createDefaultForestGarden(areaNames: string[]): ForestGardenState {
  const fallback = [
    'Clínica Médica',
    'Cirurgia Geral',
    'Pediatria',
    'Ginecologia e Obstetrícia',
    'Medicina Preventiva',
  ];
  const getArea = (idx: number) => areaNames[idx] || areaNames[0] || fallback[idx] || 'Clínica Médica';

  return {
    activeSlotIndex: 0,
    slots: [
      { slotIndex: 0, area: getArea(0), topicId: null, subjectName: null, accumulatedSeconds: 0, boostedSeconds: 0, plotSeed: 137 },
      { slotIndex: 1, area: getArea(1), topicId: null, subjectName: null, accumulatedSeconds: 0, boostedSeconds: 0, plotSeed: 491 },
      { slotIndex: 2, area: getArea(2), topicId: null, subjectName: null, accumulatedSeconds: 0, boostedSeconds: 0, plotSeed: 829 },
    ],
    boostsSpent: { water: 0, fertilizer: 0, bees: 0 },
    maturedTrees: [],
  };
}

export function normalizeForestGarden(raw: unknown, areaNames: string[]): ForestGardenState {
  const base = createDefaultForestGarden(areaNames);
  if (!raw || typeof raw !== 'object') return base;
  const obj = raw as Partial<ForestGardenState>;

  const activeIdx = obj.activeSlotIndex === 1 || obj.activeSlotIndex === 2 ? obj.activeSlotIndex : 0;
  const rawSlots = Array.isArray(obj.slots) ? obj.slots : [];

  const normalizedSlots: [NurserySlotState, NurserySlotState, NurserySlotState] = [0, 1, 2].map(idx => {
    const src = rawSlots[idx];
    const def = base.slots[idx];
    if (!src || typeof src !== 'object') return def;
    const validArea =
      typeof src.area === 'string' && (areaNames.length === 0 || areaNames.includes(src.area))
        ? src.area
        : def.area;
    return {
      slotIndex: idx as 0 | 1 | 2,
      area: validArea,
      topicId: typeof src.topicId === 'string' ? src.topicId : null,
      subjectName: typeof src.subjectName === 'string' ? src.subjectName : null,
      accumulatedSeconds: Math.max(0, Math.min(FULL_TREE_SECONDS - 1, Math.floor(Number(src.accumulatedSeconds) || 0))),
      boostedSeconds: Math.max(0, Math.min(FULL_TREE_SECONDS - 1, Math.floor(Number(src.boostedSeconds) || 0))),
      plotSeed: typeof src.plotSeed === 'number' ? src.plotSeed : def.plotSeed,
      beesActiveUntilMs: typeof src.beesActiveUntilMs === 'number' ? src.beesActiveUntilMs : undefined,
      lastBoostAtMs: typeof src.lastBoostAtMs === 'number' ? src.lastBoostAtMs : undefined,
    };
  }) as [NurserySlotState, NurserySlotState, NurserySlotState];

  const spent = obj.boostsSpent || { water: 0, fertilizer: 0, bees: 0 };
  const matured: MaturedGardenTree[] = Array.isArray(obj.maturedTrees)
    ? obj.maturedTrees
        .filter(
          (t): t is MaturedGardenTree =>
            Boolean(t && typeof t === 'object' && typeof t.id === 'string' && typeof t.area === 'string')
        )
        .slice(-120)
    : [];

  return {
    activeSlotIndex: activeIdx,
    slots: normalizedSlots,
    boostsSpent: {
      water: Math.max(0, Math.floor(Number(spent.water) || 0)),
      fertilizer: Math.max(0, Math.floor(Number(spent.fertilizer) || 0)),
      bees: Math.max(0, Math.floor(Number(spent.bees) || 0)),
    },
    maturedTrees: matured,
  };
}

export function getNurserySlotProgress(accumulatedSeconds: number) {
  const clamped = Math.max(0, Math.min(FULL_TREE_SECONDS, accumulatedSeconds));
  const progressRatio = clamped / FULL_TREE_SECONDS;
  const stage = getTreeGrowthStage(progressRatio);
  const stageNumber: 1 | 2 | 3 | 4 =
    clamped < STAGE_BLOCK_SECONDS
      ? 1
      : clamped < STAGE_BLOCK_SECONDS * 2
      ? 2
      : clamped < STAGE_BLOCK_SECONDS * 3
      ? 3
      : 4;
  const currentStageElapsed = clamped % STAGE_BLOCK_SECONDS;
  const stageProgressRatio = clamped >= FULL_TREE_SECONDS ? 1 : currentStageElapsed / STAGE_BLOCK_SECONDS;
  const remainingToNextStageSec =
    clamped >= FULL_TREE_SECONDS ? 0 : STAGE_BLOCK_SECONDS - currentStageElapsed;
  const remainingToMatureSec = Math.max(0, FULL_TREE_SECONDS - clamped);

  return {
    stageNumber,
    stage,
    progressRatio,
    stageProgressRatio,
    remainingToNextStageSec,
    remainingToMatureSec,
  };
}

export function getBoostWallet(
  totalQuestions: number,
  boostsSpent: ForestGardenState['boostsSpent']
) {
  const safeQ = Math.max(0, Math.floor(totalQuestions));
  const earned = {
    water: Math.floor(safeQ / BOOST_CONFIG.water.questionsRequired),
    fertilizer: Math.floor(safeQ / BOOST_CONFIG.fertilizer.questionsRequired),
    bees: Math.floor(safeQ / BOOST_CONFIG.bees.questionsRequired),
  };

  return {
    earned,
    available: {
      water: Math.max(0, earned.water - Math.max(0, boostsSpent.water)),
      fertilizer: Math.max(0, earned.fertilizer - Math.max(0, boostsSpent.fertilizer)),
      bees: Math.max(0, earned.bees - Math.max(0, boostsSpent.bees)),
    },
    nextInQuestions: {
      water:
        BOOST_CONFIG.water.questionsRequired -
        (safeQ % BOOST_CONFIG.water.questionsRequired),
      fertilizer:
        BOOST_CONFIG.fertilizer.questionsRequired -
        (safeQ % BOOST_CONFIG.fertilizer.questionsRequired),
      bees:
        BOOST_CONFIG.bees.questionsRequired -
        (safeQ % BOOST_CONFIG.bees.questionsRequired),
    },
  };
}

export function advanceNurserySlot(
  slot: NurserySlotState,
  addSeconds: number,
  isBoost: boolean,
  todayDate: string,
  nowMs = Date.now(),
  extraFlags?: {
    activateBees?: boolean;
    source?: 'session' | 'boost';
    durationSeconds?: number;
    areaOverride?: string;
    subjectNameOverride?: string | null;
    sessionId?: string;
  }
): { updatedSlot: NurserySlotState; harvestedTrees: MaturedGardenTree[] } {
  const safeAdd = Math.max(0, Math.floor(addSeconds));
  const rawTotal = Math.max(0, Math.floor(slot.accumulatedSeconds)) + safeAdd;
  const maturedCount = Math.floor(rawTotal / FULL_TREE_SECONDS);
  const remainderSeconds = rawTotal % FULL_TREE_SECONDS;

  const resolvedArea = extraFlags?.areaOverride || slot.area;
  const resolvedSubject =
    extraFlags?.subjectNameOverride !== undefined
      ? extraFlags.subjectNameOverride
      : slot.subjectName || null;
  const resolvedSource = extraFlags?.source || (isBoost ? 'boost' : 'session');

  const harvestedTrees: MaturedGardenTree[] = [];
  for (let i = 0; i < maturedCount; i++) {
    harvestedTrees.push({
      id: `mature-${slot.slotIndex}-${nowMs}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      area: resolvedArea,
      subjectName: resolvedSubject,
      completedAtIso: new Date(nowMs).toISOString(),
      sessionDate: todayDate,
      durationSeconds: extraFlags?.durationSeconds ?? FULL_TREE_SECONDS,
      source: resolvedSource,
      ...(extraFlags?.sessionId ? { sessionId: extraFlags.sessionId } : {}),
    });
  }

  const nextBoosted =
    maturedCount > 0
      ? isBoost
        ? Math.min(remainderSeconds, safeAdd)
        : 0
      : Math.min(remainderSeconds, (slot.boostedSeconds || 0) + (isBoost ? safeAdd : 0));

  const updatedSlot: NurserySlotState = {
    ...slot,
    accumulatedSeconds: remainderSeconds,
    boostedSeconds: nextBoosted,
    plotSeed:
      maturedCount > 0
        ? Math.floor(((nowMs % 99991) + (slot.plotSeed || 1) * 7 + slot.slotIndex * 131 + 17) % 100000)
        : slot.plotSeed,
    lastBoostAtMs: isBoost ? nowMs : slot.lastBoostAtMs,
    beesActiveUntilMs: extraFlags?.activateBees ? nowMs + 6 * 60 * 60 * 1000 : slot.beesActiveUntilMs,
  };

  return { updatedSlot, harvestedTrees };
}

export function applyBoostToGarden(
  garden: ForestGardenState,
  totalQuestions: number,
  boostType: ForestBoostType,
  targetSlotIndex: 0 | 1 | 2,
  todayDate: string,
  nowMs = Date.now()
): { nextGarden: ForestGardenState; harvestedCount: number; applied: boolean } {
  const wallet = getBoostWallet(totalQuestions, garden.boostsSpent);
  if (wallet.available[boostType] <= 0) {
    return { nextGarden: garden, harvestedCount: 0, applied: false };
  }

  const cfg = BOOST_CONFIG[boostType];
  const allHarvested: MaturedGardenTree[] = [];

  const nextSlots = garden.slots.map((slot, idx) => {
    const shouldApply = cfg.appliesToAllSlots || idx === targetSlotIndex;
    if (!shouldApply) return slot;

    const { updatedSlot, harvestedTrees } = advanceNurserySlot(
      slot,
      cfg.bonusSeconds,
      true,
      todayDate,
      nowMs,
      {
        activateBees: boostType === 'bees',
        source: 'boost',
        durationSeconds: FULL_TREE_SECONDS,
      }
    );
    allHarvested.push(...harvestedTrees);
    return updatedSlot;
  }) as [NurserySlotState, NurserySlotState, NurserySlotState];

  const nextGarden: ForestGardenState = {
    ...garden,
    slots: nextSlots,
    boostsSpent: {
      ...garden.boostsSpent,
      [boostType]: (garden.boostsSpent[boostType] || 0) + 1,
    },
    maturedTrees: [...(garden.maturedTrees || []), ...allHarvested].slice(-120),
  };

  return {
    nextGarden,
    harvestedCount: allHarvested.length,
    applied: true,
  };
}

/**
 * Filtra árvores de `forestGarden.maturedTrees` evitando duplicação com árvores já contabilizadas
 * em `study_sessions` (`trees_earned > 0`).
 * - Árvores com `source === 'boost'` (ou legado sem `source`/`sessionId`) são sempre mantidas.
 * - Árvores com `source === 'session'` que já correspondem a uma sessão presente em `sessions`
 *   (por `sessionId`) não são duplicadas na contagem nem na renderização.
 */
export function getExtraMaturedGardenTrees(
  sessions: Array<Pick<StudySession, 'id'>>,
  maturedTrees: MaturedGardenTree[]
): MaturedGardenTree[] {
  if (!maturedTrees || maturedTrees.length === 0) return [];
  const sessionIds = new Set(sessions.map(s => s.id));
  return maturedTrees.filter(tree => {
    if (tree.source === 'session') {
      if (tree.sessionId && sessionIds.has(tree.sessionId)) {
        return false;
      }
      // Se veio de sessão mas o id não está em `sessions` (ex: filtro/histórico antigo sem id), evita duplicar se não houver sessionId
      if (!tree.sessionId) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Formata segundos em MM:SS (ou HH:MM:SS quando >= 1 hora).
 */
export function formatSecondsHMS(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
      seconds
    ).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Formata duração total em texto legível (ex: "2h 15min" ou "45min").
 */
export function formatDurationCompact(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const totalMinutes = Math.floor(safe / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${totalMinutes}min`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}min`;
}

/**
 * Toca um acorde sinusoidal suave via Web Audio API ao finalizar ciclo Pomodoro.
 */
export function playGentleChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // Dó5, Mi5, Sol5 (acorde calmo)

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);

      gain.gain.setValueAtTime(0.0001, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.09, now + idx * 0.14 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.95);
    });

    window.setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 1400);
  } catch {
    // Ignora silenciosamente se o navegador bloquear autoplay de áudio
  }
}

/**
 * Identifica o momento atual de estudo de um assunto (R0, R1, R2... ou Concluído).
 */
export function getTopicCurrentMomentLabel(
  topic: Pick<StudyTopic, 'id' | 'is_planned'>,
  reviews: Array<Pick<TopicReview, 'topic_id' | 'review_number' | 'completed_date'>>
): string {
  if (topic.is_planned) {
    return 'R0';
  }
  const topicRevs = reviews.filter(r => r.topic_id === topic.id);
  const pending = topicRevs
    .filter(r => !r.completed_date)
    .sort((a, b) => a.review_number - b.review_number);

  if (pending.length > 0) {
    return `R${pending[0].review_number}`;
  }
  if (topicRevs.some(r => Boolean(r.completed_date))) {
    return 'Concluído (R8)';
  }
  return 'R1';
}

/**
 * Busca a última sessão cronometrada (>= 60s) de hoje para pré-preencher o campo
 * de tempo de estudo ao validar R0 ou R1..R8 (mantendo editável pelo aluno).
 * Prioriza match exato por topic_id; se não houver, faz fallback para sessão geral da mesma área hoje.
 */
export function getLastStudiedMinutesForTopic(
  studySessions: StudySession[],
  topicId?: string | null,
  area?: string | null,
  referenceDateStr?: string
): { minutes: number; session: StudySession } | null {
  if (!studySessions || studySessions.length === 0) return null;
  const today = referenceDateStr || getTodayDateString();

  const todayValid = studySessions
    .filter(s => s.session_date === today && s.duration_seconds >= 60)
    .sort((a, b) => {
      const ta = new Date(a.ended_at || a.created_at).getTime();
      const tb = new Date(b.ended_at || b.created_at).getTime();
      return tb - ta;
    });

  if (todayValid.length === 0) return null;

  let matched: StudySession | undefined;
  if (topicId) {
    matched = todayValid.find(s => s.topic_id === topicId);
  }
  if (!matched && area) {
    matched = todayValid.find(s => !s.topic_id && s.area === area);
  }
  if (!matched) return null;

  return {
    minutes: Math.max(1, Math.round(matched.duration_seconds / 60)),
    session: matched,
  };
}

export interface DraftErrorLogItem {
  localId: string;
  cause: ErrorLogCause;
  concept_summary: string;
  question_ref: string;
}

export interface QuickErrorLogState {
  drafts: DraftErrorLogItem[];
  pendingCause: ErrorLogCause;
  pendingSummary: string;
  pendingRef: string;
}

/**
 * Cria o estado inicial do bloco de pré-preenchimento do Caderno de Erros nos modais.
 */
export function createInitialQuickErrorState(): QuickErrorLogState {
  return {
    drafts: [],
    pendingCause: 'Lacuna teórica',
    pendingSummary: '',
    pendingRef: '',
  };
}

/**
 * Consolida os rascunhos adicionados e qualquer linha em digitação para salvar em error_logs.
 */
export function collectFinalErrorDrafts(
  state: QuickErrorLogState
): Array<Omit<DraftErrorLogItem, 'localId'>> {
  const result = state.drafts.map(({ cause, concept_summary, question_ref }) => ({
    cause,
    concept_summary: concept_summary.trim(),
    question_ref: question_ref.trim(),
  }));

  const pendingTrimmed = state.pendingSummary.trim();
  if (pendingTrimmed) {
    result.push({
      cause: state.pendingCause,
      concept_summary: pendingTrimmed,
      question_ref: state.pendingRef.trim(),
    });
  }

  return result.filter(item => item.concept_summary.length > 0);
}
