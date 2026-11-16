import {
  fsrs,
  createEmptyCard,
  Rating,
  State,
  type Card,
  type Grade,
} from 'ts-fsrs';
import {
  ErrorLogCause,
  ReviewStatus,
  ReviewCalculationInput,
  ReviewCalculationResult,
  PedagogicalDiagnosis,
  StreakConfig,
  DEFAULT_STREAK_CONFIG,
  FsrsCardState,
  TopicReview,
} from '@/types/database';

export const ERROR_CAUSE_WEIGHTS: Record<
  ErrorLogCause,
  { intervalFactor: number; extraQuestions: number; shortLabel: string }
> = {
  'Lacuna teórica': {
    intervalFactor: 0.78,
    extraQuestions: 3,
    shortLabel: '-22% intervalo • +3 questões',
  },
  Interpretação: {
    intervalFactor: 0.88,
    extraQuestions: 2,
    shortLabel: '-12% intervalo • +2 questões',
  },
  'Pegadinha da banca': {
    intervalFactor: 0.92,
    extraQuestions: 1,
    shortLabel: '-8% intervalo • +1 questão',
  },
  Distração: {
    intervalFactor: 0.98,
    extraQuestions: 0,
    shortLabel: '-2% intervalo • sem questões extras',
  },
};

export function computeErrorCauseAdjustment(errorCauses?: ErrorLogCause[]): {
  activeCount: number;
  dominantCause: ErrorLogCause | null;
  intervalMultiplier: number;
  bonusQuestions: number;
} {
  if (!errorCauses || errorCauses.length === 0) {
    return {
      activeCount: 0,
      dominantCause: null,
      intervalMultiplier: 1,
      bonusQuestions: 0,
    };
  }

  let prod = 1;
  let totalExtra = 0;
  let dominantCause: ErrorLogCause | null = null;
  let lowestFactor = 1.01;

  for (const cause of errorCauses) {
    const cfg = ERROR_CAUSE_WEIGHTS[cause];
    if (!cfg) continue;
    prod *= cfg.intervalFactor;
    totalExtra += cfg.extraQuestions;
    if (cfg.intervalFactor < lowestFactor) {
      lowestFactor = cfg.intervalFactor;
      dominantCause = cause;
    }
  }

  if (dominantCause === null) {
    return {
      activeCount: 0,
      dominantCause: null,
      intervalMultiplier: 1,
      bonusQuestions: 0,
    };
  }

  return {
    activeCount: errorCauses.filter(c => Boolean(ERROR_CAUSE_WEIGHTS[c])).length,
    dominantCause,
    intervalMultiplier: Math.max(0.55, Number(prod.toFixed(3))),
    bonusQuestions: Math.min(8, totalExtra),
  };
}

/**
 * Normaliza o valor de porcentagem para uma escala de 0 a 100.
 * Suporta tanto entradas de 0.0 a 1.0 quanto de 0 a 100.
 */
export function normalizePercentage(percentage: number): number {
  if (!Number.isFinite(percentage) || percentage <= 0) return 0;
  if (percentage <= 1) {
    return Math.round(percentage * 100 * 10) / 10;
  }
  return Math.min(100, Math.round(percentage * 10) / 10);
}

/**
 * Mapeia o percentual de acerto (0-100) para os 4 ratings do FSRS-6:
 * - < 50%: Rating.Again (Ruptura Crítica / Lapse)
 * - 50% a 69.9%: Rating.Hard (Retenção Instável)
 * - 70% a 89.9%: Rating.Good (Dificuldade Desejável / Fixação Sólida)
 * - >= 90%: Rating.Easy (Domínio Pleno)
 */
export function mapAccuracyToFsrsRating(rawAccuracy: number): Grade {
  const accuracy = normalizePercentage(rawAccuracy);
  if (accuracy < 50) return Rating.Again;
  if (accuracy < 70) return Rating.Hard;
  if (accuracy < 90) return Rating.Good;
  return Rating.Easy;
}

/**
 * Modula o intervalo máximo de revisão pelo horizonte até a prova alvo (Cepeda et al., 2008).
 * Evita que revisões ultrapassem a data da prova ou fiquem espaçadas demais perto do exame.
 */
export function computeMaxIntervalForExamHorizon(
  targetYear?: number,
  referenceDate?: string
): number {
  if (!targetYear || !Number.isFinite(targetYear)) {
    return 75;
  }

  const today = referenceDate || getTodayDateString();
  const examDate = `${Math.round(targetYear)}-11-15`;
  const daysToExam = diffInDays(examDate, today);

  if (daysToExam <= 0) {
    return 21;
  }

  // Cepeda et al. (2008): ISI ótimo ~ 10% a 20% do intervalo de retenção até a prova
  return Math.min(90, Math.max(14, Math.round(daysToExam * 0.2)));
}

function serializeFsrsCard(card: Card): FsrsCardState {
  return {
    stability: Number(card.stability.toFixed(4)),
    difficulty: Number(card.difficulty.toFixed(4)),
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    lastReview: card.last_review ? card.last_review.toISOString().slice(0, 10) : undefined,
  };
}

function parseDateUTC(dateStr: string): Date {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1, 12, 0, 0));
}

/**
 * Retorna o diagnóstico pedagógico completo, badge e justificativa por faixa de aproveitamento.
 */
export function getPedagogicalDiagnosis(accuracy: number): PedagogicalDiagnosis {
  const norm = normalizePercentage(accuracy);

  if (norm < 50) {
    return {
      level: 'lapse',
      badge: 'Ruptura Crítica (Lapse)',
      title: 'Ruptura Crítica (Lapse)',
      pedagogicalNote:
        'Foco em bloco corretivo enxuto para retestar os erros em 48h sem causar fadiga cognitiva.',
      colorVariant: 'destructive',
    };
  }

  if (norm < 70) {
    return {
      level: 'unstable',
      badge: 'Retenção Instável',
      title: 'Retenção Instável',
      pedagogicalNote:
        'Volume em esforço máximo para treinar diferenciação diagnóstica e eliminação de distratores.',
      colorVariant: 'warning',
    };
  }

  if (norm < 85) {
    return {
      level: 'desirable',
      badge: 'Dificuldade Desejável',
      title: 'Dificuldade Desejável',
      pedagogicalNote:
        'Amostragem equilibrada para manutenção sólida e consolidação na zona ideal de aprendizado.',
      colorVariant: 'success',
    };
  }

  if (norm < 95) {
    return {
      level: 'solid',
      badge: 'Fixação Sólida',
      title: 'Fixação Sólida',
      pedagogicalNote:
        'Validação rápida de memória para comprovar retenção estável sem sobrecarga desnecessária.',
      colorVariant: 'info',
    };
  }

  return {
    level: 'mastery',
    badge: 'Domínio Pleno',
    title: 'Domínio Pleno',
    pedagogicalNote:
      'Micro-checagem pontual de alto nível para evitar perda de tempo e sobreaprendizagem (overlearning).',
    colorVariant: 'purple',
  };
}

/**
 * Dimensionamento Dinâmico do Volume de Questões via Curva Contínua de Esforço Cognitivo
 * (Dificuldades Desejáveis de Bjork & Bjork; anti-overlearning de Rohrer & Pashler):
 * - Pico máximo em 60% de acerto (~67% da base).
 * - Decai suavemente para notas baixas (bloco corretivo) e notas altas (anti-overlearning).
 * - Fator = 0.25 + (0.67 - 0.25) * exp(- ((acuracia - 60)^2) / (2 * 25^2))
 * - Piso geral: 10 questões; Teto geral: 30 questões.
 */
export function calculateDynamicQuestionVolume(
  rawAccuracy: number,
  baseQuestionsCount = 30
): {
  volume: number;
  factor: number;
  diagnosis: PedagogicalDiagnosis;
} {
  const accuracy = normalizePercentage(rawAccuracy);
  const base = Math.max(baseQuestionsCount || 30, 15);

  const exponent = -Math.pow(accuracy - 60, 2) / (2 * Math.pow(25, 2));
  const factor = 0.25 + (0.67 - 0.25) * Math.exp(exponent);

  const rawVolume = Math.round(base * factor);
  const volume = Math.min(30, Math.max(10, rawVolume));

  const diagnosis = getPedagogicalDiagnosis(accuracy);

  return {
    volume,
    factor,
    diagnosis,
  };
}

/**
 * Motor Científico de Repetição Espaçada AdaptiveMed (FSRS-6 via ts-fsrs)
 *
 * - Usa FSRS-6 (enable_short_term: false, request_retention: 0.90)
 * - Mapeia acurácia -> Rating.Again / Hard / Good / Easy
 * - Considera o tempo real decorrido (actualElapsedDays)
 * - Modula intervalo máximo pelo horizonte até a prova (target_year, Cepeda et al., 2008)
 * - Desacopla review_number sequencial monotônico (sem regressão/colisão em lapses)
 */
export function calculateNextReview(input: ReviewCalculationInput): ReviewCalculationResult {
  const {
    currentCycle,
    accuracy: rawAccuracy,
    baseQuestionsCount = 30,
    previousIntervalDays = 7,
    actualElapsedDays,
    targetYear,
    fsrsState,
    reviewHistory,
    referenceDate,
  } = input;

  const accuracy = normalizePercentage(rawAccuracy);
  const base = Math.max(baseQuestionsCount || 30, 15);
  const volumeData = calculateDynamicQuestionVolume(accuracy, base);
  const maxInterval = computeMaxIntervalForExamHorizon(targetYear, referenceDate);

  const scheduler = fsrs({
    enable_short_term: false,
    request_retention: 0.9,
    maximum_interval: maxInterval,
    enable_fuzz: false,
  });

  const nowStr = referenceDate || getTodayDateString();
  const nowDate = parseDateUTC(nowStr);
  const rating = mapAccuracyToFsrsRating(accuracy);

  let card: Card;

  if (fsrsState) {
    const lastRevDate = fsrsState.lastReview
      ? parseDateUTC(fsrsState.lastReview)
      : new Date(nowDate.getTime() - Math.max(1, actualElapsedDays ?? previousIntervalDays) * 86400000);

    card = {
      due: nowDate,
      stability: fsrsState.stability,
      difficulty: fsrsState.difficulty,
      elapsed_days: Math.max(0, actualElapsedDays ?? previousIntervalDays),
      scheduled_days: previousIntervalDays,
      reps: fsrsState.reps,
      lapses: fsrsState.lapses,
      learning_steps: 0,
      state: fsrsState.state as State,
      last_review: lastRevDate,
    };
  } else if (reviewHistory && reviewHistory.length > 0) {
    // Reconstrói o estado FSRS-6 deterministicamente a partir do histórico real de revisões
    const sortedHist = [...reviewHistory].sort((a, b) => a.date.localeCompare(b.date));
    card = createEmptyCard(parseDateUTC(sortedHist[0].date));
    for (const entry of sortedHist) {
      const entryDate = parseDateUTC(entry.date);
      const entryRating = mapAccuracyToFsrsRating(entry.accuracy);
      card = scheduler.next(card, entryDate, entryRating).card;
    }
  } else if (currentCycle === 0) {
    card = createEmptyCard(nowDate);
  } else {
    // Fallback determinístico quando não há histórico nem estado FSRS salvo:
    // sintetiza um estado compatível com o ciclo e intervalo real decorrido
    const elapsed = Math.max(1, actualElapsedDays ?? previousIntervalDays ?? 7);
    const synthInitDate = new Date(nowDate.getTime() - elapsed * 86400000);
    card = createEmptyCard(synthInitDate);
    card = scheduler.next(card, synthInitDate, Rating.Good).card;

    for (let step = 1; step < currentCycle; step++) {
      const stepDays = Math.max(1, Math.round(card.scheduled_days || elapsed));
      const stepDate = new Date(
        Math.min(
          nowDate.getTime() - 86400000,
          (card.last_review?.getTime() || synthInitDate.getTime()) + stepDays * 86400000
        )
      );
      card = scheduler.next(card, stepDate, Rating.Good).card;
    }
    // Ajusta last_review para refletir exatamente actualElapsedDays antes do review atual
    card = {
      ...card,
      last_review: new Date(nowDate.getTime() - elapsed * 86400000),
    };
  }

  const nextResult = scheduler.next(card, nowDate, rating);
  const nextCard = nextResult.card;

  let nextIntervalDays = Math.round(nextCard.scheduled_days);

  if (rating === Rating.Again) {
    // Reteste corretivo em 48h para ruptura crítica
    nextIntervalDays = 2;
  } else if (currentCycle === 0) {
    nextIntervalDays = Math.min(maxInterval, Math.max(3, nextIntervalDays));
  } else {
    nextIntervalDays = Math.min(maxInterval, Math.max(3, nextIntervalDays));
  }

  const adj = computeErrorCauseAdjustment(input.errorCauses);
  let recommendedQuestions = volumeData.volume;
  let pedagogicalNote = volumeData.diagnosis.pedagogicalNote;

  if (adj.activeCount > 0) {
    if (rating !== Rating.Again) {
      const minDays = input.errorCauses?.includes('Lacuna teórica') ? 2 : 3;
      nextIntervalDays = Math.min(
        maxInterval,
        Math.max(minDays, Math.round(nextIntervalDays * adj.intervalMultiplier))
      );
    }
    recommendedQuestions = Math.min(30, volumeData.volume + adj.bonusQuestions);
    pedagogicalNote = `${pedagogicalNote} Peso do Caderno de Erros aplicado (${adj.activeCount} ativo(s), destaque: ${adj.dominantCause}).`;
  }

  // review_number é estritamente monotônico (desacoplado da estabilidade FSRS para evitar colisão em lapses)
  const nextCycle = currentCycle === 0 ? 1 : Math.min(8, currentCycle + 1);

  return {
    nextIntervalDays,
    nextCycle,
    recommendedQuestions,
    diagnosis: volumeData.diagnosis.title,
    diagnosisBadge: volumeData.diagnosis.badge,
    pedagogicalNote,
    fsrsState: serializeFsrsCard(nextCard),
    fsrsRating: rating,
    ...(adj.activeCount > 0 ? { errorWeightApplied: adj } : {}),
  };
}

/**
 * Interleaving de Grandes Áreas (Rohrer & Taylor, 2007; Kornell & Bjork, 2008):
 * Reordena a fila priorizada para evitar blocos consecutivos da mesma Grande Área
 * sempre que houver outra área disponível na fila.
 */
export function interleaveQueueByArea<T>(
  items: T[],
  getArea: (item: T) => string | undefined
): T[] {
  if (items.length <= 2) return items;

  const remaining = [...items];
  const result: T[] = [];
  let lastArea: string | undefined = undefined;

  while (remaining.length > 0) {
    let pickIndex = remaining.findIndex(item => {
      const area = getArea(item);
      return area && area !== lastArea;
    });

    if (pickIndex === -1) {
      pickIndex = 0;
    }

    const [picked] = remaining.splice(pickIndex, 1);
    result.push(picked);
    lastArea = getArea(picked);
  }

  return result;
}

/**
 * Algoritmo Anti-Sobrecarga de Verificação de Vagas no Agendamento:
 * Se a Data_Alvo já tiver atingido a capacidade diária máxima (ex: 3 revisões),
 * empurra sucessivamente para o próximo dia livre.
 */
export function findNextAvailableDate(
  targetDateStr: string,
  existingScheduledCounts: Map<string, number>,
  maxDailyLimit = 3
): string {
  let dateStr = targetDateStr;
  let safetyCounter = 0;
  const limit = Math.max(1, maxDailyLimit);

  while ((existingScheduledCounts.get(dateStr) || 0) >= limit && safetyCounter < 180) {
    dateStr = addDaysToDate(dateStr, 1);
    safetyCounter++;
  }

  return dateStr;
}

/**
 * Redistribui revisões atrasadas (scheduled_date < hoje) para as próximas datas disponíveis
 * a partir de hoje, respeitando o limite diário (maxDailyLimit) e as revisões já agendadas.
 */
export function computeRebalancedSchedule(
  reviews: TopicReview[],
  maxDailyLimit = 3,
  referenceDate?: string
): Array<{ reviewId: string; newScheduledDate: string }> {
  const today = referenceDate || getTodayDateString();
  const overdue = reviews
    .filter(r => !r.completed_date && r.scheduled_date < today)
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));

  if (overdue.length === 0) return [];

  const scheduledCounts = new Map<string, number>();
  reviews.forEach(r => {
    if (!r.completed_date && r.scheduled_date >= today) {
      scheduledCounts.set(r.scheduled_date, (scheduledCounts.get(r.scheduled_date) || 0) + 1);
    }
  });

  const updates: Array<{ reviewId: string; newScheduledDate: string }> = [];
  overdue.forEach(rev => {
    const nextDate = findNextAvailableDate(today, scheduledCounts, maxDailyLimit);
    scheduledCounts.set(nextDate, (scheduledCounts.get(nextDate) || 0) + 1);
    updates.push({ reviewId: rev.id, newScheduledDate: nextDate });
  });

  return updates;
}

export function calculateNextReviewInterval(percentage: number, reviewNumber: number): number {
  const result = calculateNextReview({
    currentCycle: reviewNumber <= 1 ? 0 : reviewNumber - 1,
    accuracy: percentage,
    baseQuestionsCount: 30,
    previousIntervalDays: reviewNumber <= 1 ? 7 : 14,
  });
  return result.nextIntervalDays;
}

/**
 * Retorna a data atual no formato YYYY-MM-DD respeitando o fuso local do navegador.
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adiciona um número de dias a uma data string no formato YYYY-MM-DD.
 */
export function addDaysToDate(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calcula a diferença em dias entre duas datas (dateA - dateB).
 */
export function diffInDays(dateStrA: string, dateStrB: string): number {
  const [yA, mA, dA] = dateStrA.split('-').map(Number);
  const [yB, mB, dB] = dateStrB.split('-').map(Number);
  const dateA = new Date(yA, mA - 1, dA).getTime();
  const dateB = new Date(yB, mB - 1, dB).getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((dateA - dateB) / oneDay);
}

/**
 * Formata data YYYY-MM-DD para visualização PT-BR DD/MM/YYYY
 */
export function formatDateBR(dateStr?: string | null): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Cálculo Dinâmico de Status em relação à data atual (hoje)
 */
export function calculateReviewStatus(
  scheduledDate: string,
  completedDate: string | null,
  referenceDate?: string
): {
  status: ReviewStatus;
  daysDiff: number;
  badgeText: string;
} {
  const today = referenceDate || getTodayDateString();

  if (completedDate) {
    return {
      status: 'CONCLUÍDO',
      daysDiff: 0,
      badgeText: 'Concluído',
    };
  }

  const daysDifference = diffInDays(today, scheduledDate);

  if (daysDifference > 0) {
    return {
      status: 'ATRASADO',
      daysDiff: daysDifference,
      badgeText: `${daysDifference} ${daysDifference === 1 ? 'dia' : 'dias'} em atraso`,
    };
  }

  if (daysDifference === 0) {
    return {
      status: 'REVISAR HOJE',
      daysDiff: 0,
      badgeText: 'Revisar Hoje',
    };
  }

  const remaining = Math.abs(daysDifference);
  return {
    status: 'PROGRAMADO',
    daysDiff: daysDifference,
    badgeText: `Em ${remaining} ${remaining === 1 ? 'dia' : 'dias'}`,
  };
}

/**
 * Calcula a sequência de estudos ativa (streak em dias consecutivos).
 */
export function calculateStreak(activityDates: string[], referenceDate?: string): number {
  if (!activityDates || activityDates.length === 0) return 0;

  const today = referenceDate || getTodayDateString();
  const yesterday = addDaysToDate(today, -1);

  const uniqueDates = Array.from(new Set(activityDates.map(d => d.slice(0, 10)))).sort((a, b) =>
    b.localeCompare(a)
  );

  if (uniqueDates.length === 0) return 0;

  const mostRecent = uniqueDates[0];
  if (mostRecent !== today && mostRecent !== yesterday) {
    return 0;
  }

  let streak = 0;
  let expectedDate = mostRecent;

  for (const date of uniqueDates) {
    if (date === expectedDate) {
      streak++;
      expectedDate = addDaysToDate(expectedDate, -1);
    } else if (date < expectedDate) {
      break;
    }
  }

  return streak;
}

/**
 * Regra da Ofensiva
 */
export function calculateQualifiedStreak(
  topics: Array<{ initial_date: string; initial_questions: number; is_planned?: boolean }>,
  reviews: Array<{ completed_date: string | null; questions_done: number | null }>,
  mockExams: Array<{ exam_date: string }>,
  referenceDate?: string,
  streakConfig?: StreakConfig
): {
  currentStreak: number;
  todayQuestionsCount: number;
  todayMockCompleted: boolean;
  streakQualifiedToday: boolean;
} {
  const today = referenceDate || getTodayDateString();
  const config = streakConfig || DEFAULT_STREAK_CONFIG;
  const minQ = config.minDailyQuestions ?? 10;
  const ruleType = config.ruleType ?? 'questions_or_mock';

  const isQualified = (q: number, m: number): boolean => {
    switch (ruleType) {
      case 'questions_only':
        return q >= minQ;
      case 'mock_only':
        return m >= 1;
      case 'questions_and_mock':
        return q >= minQ && m >= 1;
      case 'questions_or_mock':
      default:
        return q >= minQ || m >= 1;
    }
  };

  const dailyQuestions: Record<string, number> = {};
  const dailyMocks: Record<string, number> = {};

  topics.forEach(t => {
    if (!t.is_planned && t.initial_questions > 0 && t.initial_date) {
      const d = t.initial_date.slice(0, 10);
      dailyQuestions[d] = (dailyQuestions[d] || 0) + t.initial_questions;
    }
  });

  reviews.forEach(r => {
    if (r.completed_date && r.questions_done && r.questions_done > 0) {
      const d = r.completed_date.slice(0, 10);
      dailyQuestions[d] = (dailyQuestions[d] || 0) + r.questions_done;
    }
  });

  mockExams.forEach(m => {
    if (m.exam_date) {
      const d = m.exam_date.slice(0, 10);
      dailyMocks[d] = (dailyMocks[d] || 0) + 1;
    }
  });

  const todayQuestionsCount = dailyQuestions[today] || 0;
  const todayMockCompleted = (dailyMocks[today] || 0) >= 1;
  const streakQualifiedToday = isQualified(todayQuestionsCount, todayMockCompleted ? 1 : 0);

  const allDates = new Set([...Object.keys(dailyQuestions), ...Object.keys(dailyMocks)]);

  const qualifyingDates: string[] = [];
  allDates.forEach(date => {
    const q = dailyQuestions[date] || 0;
    const m = dailyMocks[date] || 0;
    if (isQualified(q, m)) {
      qualifyingDates.push(date);
    }
  });

  const currentStreak = calculateStreak(qualifyingDates, today);

  return {
    currentStreak,
    todayQuestionsCount,
    todayMockCompleted,
    streakQualifiedToday,
  };
}
