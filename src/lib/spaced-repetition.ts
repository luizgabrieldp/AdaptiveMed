import {
  ReviewStatus,
  ReviewCalculationInput,
  ReviewCalculationResult,
  PedagogicalDiagnosis,
  StreakConfig,
  DEFAULT_STREAK_CONFIG,
} from '@/types/database';

/**
 * Normaliza o valor de porcentagem para uma escala de 0 a 100.
 * Suporta tanto entradas de 0.0 a 1.0 quanto de 0 a 100.
 */
export function normalizePercentage(percentage: number): number {
  if (percentage <= 1 && percentage > 0) {
    return Math.round(percentage * 100 * 10) / 10;
  }
  return Math.round(percentage * 10) / 10;
}

/**
 * Retorna o diagnóstico pedagógico completo, badge e justificativa por faixa de aproveitamento.
 */
export function getPedagogicalDiagnosis(accuracy: number): PedagogicalDiagnosis {
  const norm = normalizePercentage(accuracy);

  if (norm < 50) {
    return {
      level: 'lapse',
      badge: '🔴 Ruptura Crítica (Lapse)',
      title: 'Ruptura Crítica (Lapse)',
      pedagogicalNote: 'Foco em bloco corretivo enxuto para retestar os erros em 48h sem causar fadiga cognitiva.',
      colorVariant: 'destructive',
    };
  }

  if (norm < 70) {
    return {
      level: 'unstable',
      badge: '🟡 Retenção Instável',
      title: 'Retenção Instável',
      pedagogicalNote: 'Volume em esforço máximo para treinar diferenciação diagnóstica e eliminação de distratores.',
      colorVariant: 'warning',
    };
  }

  if (norm < 85) {
    return {
      level: 'desirable',
      badge: '🟢 Dificuldade Desejável',
      title: 'Dificuldade Desejável',
      pedagogicalNote: 'Amostragem equilibrada para manutenção sólida e consolidação na zona ideal de aprendizado.',
      colorVariant: 'success',
    };
  }

  if (norm < 95) {
    return {
      level: 'solid',
      badge: '🔵 Fixação Sólida',
      title: 'Fixação Sólida',
      pedagogicalNote: 'Validação rápida de memória para comprovar retenção estável sem sobrecarga desnecessária.',
      colorVariant: 'info',
    };
  }

  return {
    level: 'mastery',
    badge: '🟣 Domínio Pleno',
    title: 'Domínio Pleno',
    pedagogicalNote: 'Micro-checagem pontual de alto nível para evitar perda de tempo e sobreaprendizagem (overlearning).',
    colorVariant: 'purple',
  };
}

/**
 * Dimensionamento Dinâmico do Volume de Questões via Curva Contínua de Esforço Cognitivo:
 * - Pico máximo em 60% de acerto (~67% da base).
 * - Decai suavemente para notas baixas (bloco corretivo) e notas altas (anti-overlearning).
 * - Fator = 0.25 + (0.67 - 0.25) * exp(- ((acuracia - 60)^2) / (2 * 25^2))
 * - Piso geral: 10 a 12 questões
 * - Teto geral: 28 a 30 questões
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

  // Curva contínua gaussiana de esforço cognitivo centrada em 60%
  const exponent = -Math.pow(accuracy - 60, 2) / (2 * Math.pow(25, 2));
  const factor = 0.25 + (0.67 - 0.25) * Math.exp(exponent);

  const rawVolume = Math.round(base * factor);
  // Travas de segurança: piso mínimo de 10 e teto máximo de 30 questões
  const volume = Math.min(30, Math.max(10, rawVolume));

  const diagnosis = getPedagogicalDiagnosis(accuracy);

  return {
    volume,
    factor,
    diagnosis,
  };
}

/**
 * Motor Científico de Repetição Espaçada AdaptiveMed
 * 
 * Fase 1: Do Estudo Inicial para a Revisão 1 (R1)
 *   - < 50%: 2 dias fixos (reteste corretivo em 48h)
 *   - >= 50%: dias = 1.5 * exp(0.028 * acuracia) -> floor(dias), min 3d, max 21d
 * 
 * Fase 2: Entre Revisões Subsequentes (R2 a R8)
 *   - < 50%: 2 dias fixos (reset) e regride 1 nível de ciclo
 *   - 50% a 64%: 5 dias fixos (intervalo travado para reforço intermediário)
 *   - >= 65%: multiplicador = 1.0 + 1.5 * ((acuracia - 65) / 35)^1.2 -> floor(anterior * mult)
 *             piso de expansão de +8 dias, teto de 75 dias
 */
export function calculateNextReview(input: ReviewCalculationInput): ReviewCalculationResult {
  const { currentCycle, accuracy: rawAccuracy, baseQuestionsCount = 30, previousIntervalDays = 7 } = input;
  const accuracy = normalizePercentage(rawAccuracy);
  const base = Math.max(baseQuestionsCount || 30, 15);

  // 1. Volume de questões e diagnóstico pedagógico dinâmico
  const volumeData = calculateDynamicQuestionVolume(accuracy, base);

  // 2. FASE 1: Estudo Inicial (R0) -> Agendamento da R1
  if (currentCycle === 0) {
    let nextIntervalDays: number;
    if (accuracy < 50) {
      nextIntervalDays = 2; // Reteste corretivo rápido em 48h
    } else {
      const calcDays = 1.5 * Math.exp(0.028 * accuracy);
      nextIntervalDays = Math.min(21, Math.max(3, Math.floor(calcDays)));
    }

    return {
      nextIntervalDays,
      nextCycle: 1,
      recommendedQuestions: volumeData.volume,
      diagnosis: volumeData.diagnosis.title,
      diagnosisBadge: volumeData.diagnosis.badge,
      pedagogicalNote: volumeData.diagnosis.pedagogicalNote,
    };
  }

  // 3. FASE 2: Revisões Subsequentes (R1 a R7 -> agendando R2 a R8)
  let nextIntervalDays: number;
  let nextCycle = Math.min(8, currentCycle + 1);

  if (accuracy < 50) {
    // Reset corretivo para 2 dias e penalidade de 1 ciclo
    nextIntervalDays = 2;
    nextCycle = Math.max(1, currentCycle - 1);
  } else if (accuracy < 65) {
    // Congela em 5 dias para reforço intermediário
    nextIntervalDays = 5;
  } else {
    // Expansão dinâmica contínua (>= 65%)
    const normalizedProgress = (accuracy - 65) / 35; // 0.0 a 1.0
    const multiplier = 1.0 + 1.5 * Math.pow(Math.max(0, normalizedProgress), 1.2);
    const calculatedInterval = Math.floor(previousIntervalDays * multiplier);

    // Piso mínimo de expansão de pelo menos +8 dias e teto de 75 dias
    const minExpanded = previousIntervalDays + 8;
    nextIntervalDays = Math.min(75, Math.max(minExpanded, calculatedInterval));
  }

  return {
    nextIntervalDays,
    nextCycle,
    recommendedQuestions: volumeData.volume,
    diagnosis: volumeData.diagnosis.title,
    diagnosisBadge: volumeData.diagnosis.badge,
    pedagogicalNote: volumeData.diagnosis.pedagogicalNote,
  };
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
 * Cálculo Dinâmico de Status em relação à data atual (hoje):
 * - Se completed_date estiver preenchido -> Status: "CONCLUÍDO"
 * - Se completed_date for nulo:
 *   * Se scheduled_date < hoje -> Status: "ATRASADO"
 *   * Se scheduled_date === hoje -> Status: "REVISAR HOJE"
 *   * Se scheduled_date > hoje -> Status: "PROGRAMADO"
 */
export function calculateReviewStatus(
  scheduledDate: string,
  completedDate: string | null,
  referenceDate?: string
): {
  status: ReviewStatus;
  daysDiff: number; // positivo se atrasado, negativo se dias restantes, 0 se hoje
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
 * Considera dias de atividade contíguos terminando em hoje ou ontem.
 */
export function calculateStreak(activityDates: string[], referenceDate?: string): number {
  if (!activityDates || activityDates.length === 0) return 0;

  const today = referenceDate || getTodayDateString();
  const yesterday = addDaysToDate(today, -1);

  // Normaliza e remove duplicatas
  const uniqueDates = Array.from(new Set(activityDates.map(d => d.slice(0, 10)))).sort((a, b) => b.localeCompare(a));
  
  if (uniqueDates.length === 0) return 0;

  // A sequência está ativa se houver atividade hoje ou ontem
  const mostRecent = uniqueDates[0];
  if (mostRecent !== today && mostRecent !== yesterday) {
    return 0; // Sequência interrompida
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
 * Regra da Ofensiva:
 * O estudante só pontua a ofensiva do dia se realizar pelo menos 10 questões
 * (soma de questões feitas em estudos/revisões daquele dia) OU concluir 1 simulado no dia.
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

  // Questões de estudos iniciais não planejados
  topics.forEach(t => {
    if (!t.is_planned && t.initial_questions > 0 && t.initial_date) {
      const d = t.initial_date.slice(0, 10);
      dailyQuestions[d] = (dailyQuestions[d] || 0) + t.initial_questions;
    }
  });

  // Questões de revisões concluídas
  reviews.forEach(r => {
    if (r.completed_date && r.questions_done && r.questions_done > 0) {
      const d = r.completed_date.slice(0, 10);
      dailyQuestions[d] = (dailyQuestions[d] || 0) + r.questions_done;
    }
  });

  // Simulados concluídos
  mockExams.forEach(m => {
    if (m.exam_date) {
      const d = m.exam_date.slice(0, 10);
      dailyMocks[d] = (dailyMocks[d] || 0) + 1;
    }
  });

  const todayQuestionsCount = dailyQuestions[today] || 0;
  const todayMockCompleted = (dailyMocks[today] || 0) >= 1;
  const streakQualifiedToday = isQualified(todayQuestionsCount, todayMockCompleted ? 1 : 0);

  // Dias que qualificam com base na regra configurada
  const allDates = new Set([
    ...Object.keys(dailyQuestions),
    ...Object.keys(dailyMocks),
  ]);

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

