import { ReviewStatus, ReviewCalculationInput, ReviewCalculationResult } from '@/types/database';

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
 * Motor Científico de Repetição Espaçada e Volume Adaptativo de Questões
 * 
 * Fase 1: Estudo Inicial (Primeiro Contato / R0) -> R1
 *   - < 50%: +2 dias | Ruptura Crítica (Reforço Imediato) | 50% da base (mín 10 Qs)
 *   - 50% a 69%: +4 dias | Retenção Instável (Risco de Esquecimento) | 65% da base (mín 12 Qs)
 *   - 70% a 84%: +7 dias | Dificuldade Desejável (Consolidação Ótima) | 45% da base (mín 10 Qs)
 *   - 85% a 94%: +14 dias | Fixação Eficaz | 30% da base (mín 8 Qs)
 *   - >= 95%: +21 dias | Domínio Pleno | 20% da base (mín 5 Qs)
 * 
 * Fase 2: Revisões Subsequentes (R1 a R7 -> agendando até R8)
 *   - >= 85%: Expansão agressiva (Intervalo Anterior * 2.2, min 14d, max 60d) | 25% da base (mín 6 Qs)
 *   - 70% a 84%: Expansão moderada (Intervalo Anterior * 1.6, min 10d, max 60d) | 45% da base (mín 10 Qs)
 *   - 50% a 69%: Trava de intervalo (5 dias fixos para recuperação rápida) | 65% da base (mín 12 Qs)
 *   - < 50%: Reset / Lapse (2 dias, penalidade de ciclo: volta 1 nível) | 50% da base (mín 10 Qs)
 */
export function calculateNextReview(input: ReviewCalculationInput): ReviewCalculationResult {
  const { currentCycle, accuracy: rawAccuracy, baseQuestionsCount, previousIntervalDays = 7 } = input;
  const accuracy = normalizePercentage(rawAccuracy);
  const base = Math.max(baseQuestionsCount || 20, 10);

  // FASE 1: Estudo Inicial -> R1
  if (currentCycle === 0) {
    if (accuracy < 50) {
      return {
        nextIntervalDays: 2,
        nextCycle: 1,
        recommendedQuestions: Math.max(10, Math.round(base * 0.5)),
        diagnosis: 'Ruptura Crítica (Reforço Imediato)',
      };
    } else if (accuracy < 70) {
      return {
        nextIntervalDays: 4,
        nextCycle: 1,
        recommendedQuestions: Math.max(12, Math.round(base * 0.65)),
        diagnosis: 'Retenção Instável (Risco de Esquecimento)',
      };
    } else if (accuracy < 85) {
      return {
        nextIntervalDays: 7,
        nextCycle: 1,
        recommendedQuestions: Math.max(10, Math.round(base * 0.45)),
        diagnosis: 'Dificuldade Desejável (Consolidação Ótima)',
      };
    } else if (accuracy < 95) {
      return {
        nextIntervalDays: 14,
        nextCycle: 1,
        recommendedQuestions: Math.max(8, Math.round(base * 0.3)),
        diagnosis: 'Fixação Eficaz',
      };
    } else {
      return {
        nextIntervalDays: 21,
        nextCycle: 1,
        recommendedQuestions: Math.max(5, Math.round(base * 0.2)),
        diagnosis: 'Domínio Pleno',
      };
    }
  }

  // FASE 2: Revisões Subsequentes (R1 a R7 -> agendando até R8)
  let nextInterval: number;
  let nextCycle = Math.min(currentCycle + 1, 8);
  let recommendedQuestions: number;
  let diagnosis: string;

  if (accuracy < 50) {
    nextInterval = 2;
    nextCycle = Math.max(1, currentCycle - 1); // Penalidade de lapse
    recommendedQuestions = Math.max(10, Math.round(base * 0.5));
    diagnosis = 'Lapse de Memória (Reset Preventivo)';
  } else if (accuracy < 70) {
    nextInterval = 5;
    recommendedQuestions = Math.max(12, Math.round(base * 0.65));
    diagnosis = 'Alerta de Retenção (Intervalo Travado)';
  } else if (accuracy < 85) {
    nextInterval = Math.min(60, Math.max(10, Math.round(previousIntervalDays * 1.6)));
    recommendedQuestions = Math.max(10, Math.round(base * 0.45));
    diagnosis = 'Retenção Consolidada (Expansão Moderada)';
  } else {
    // >= 85%
    nextInterval = Math.min(60, Math.max(14, Math.round(previousIntervalDays * 2.2)));
    recommendedQuestions = Math.max(6, Math.round(base * 0.25));
    diagnosis = 'Alta Estabilidade (Expansão Agressiva)';
  }

  return {
    nextIntervalDays: nextInterval,
    nextCycle,
    recommendedQuestions,
    diagnosis,
  };
}

export function calculateNextReviewInterval(percentage: number, reviewNumber: number): number {
  const result = calculateNextReview({
    currentCycle: reviewNumber <= 1 ? 0 : reviewNumber - 1,
    accuracy: percentage,
    baseQuestionsCount: 20,
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
  referenceDate?: string
): {
  currentStreak: number;
  todayQuestionsCount: number;
  todayMockCompleted: boolean;
  streakQualifiedToday: boolean;
} {
  const today = referenceDate || getTodayDateString();

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
  const streakQualifiedToday = todayQuestionsCount >= 10 || todayMockCompleted;

  // Dias que qualificam: >= 10 questões OU >= 1 simulado
  const allDates = new Set([
    ...Object.keys(dailyQuestions),
    ...Object.keys(dailyMocks),
  ]);

  const qualifyingDates: string[] = [];
  allDates.forEach(date => {
    const q = dailyQuestions[date] || 0;
    const m = dailyMocks[date] || 0;
    if (q >= 10 || m >= 1) {
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
