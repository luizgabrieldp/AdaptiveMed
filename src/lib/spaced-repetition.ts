import { ReviewStatus } from '@/types/database';

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
 * Motor de Repetição Espaçada Adaptativa (Algoritmo da Planilha)
 * 
 * - Se reviewNumber === 1 (Intervalo entre o Contato Inicial e a 1ª Revisão):
 *   * Acerto < 60%: somar 3 dias.
 *   * Acerto entre 60% e 65%: somar 10 dias.
 *   * Acerto entre 66% e 70%: somar 13 dias.
 *   * Acerto entre 71% e 80%: somar 20 dias.
 *   * Acerto > 80%: somar 23 dias.
 * 
 * - Se reviewNumber >= 2 (Intervalo entre revisões subsequentes, 2ª a 8ª):
 *   * Acerto < 60%: somar 7 dias.
 *   * Acerto entre 60% e 65%: somar 13 dias.
 *   * Acerto entre 66% e 70%: somar 18 dias.
 *   * Acerto entre 71% e 80%: somar 25 dias.
 *   * Acerto > 80%: somar 30 dias.
 */
export function calculateNextReviewInterval(percentage: number, reviewNumber: number): number {
  const normPct = normalizePercentage(percentage);

  if (reviewNumber <= 1) {
    if (normPct < 60) return 3;
    if (normPct <= 65) return 10;
    if (normPct <= 70) return 13;
    if (normPct <= 80) return 20;
    return 23;
  }

  // reviewNumber >= 2
  if (normPct < 60) return 7;
  if (normPct <= 65) return 13;
  if (normPct <= 70) return 18;
  if (normPct <= 80) return 25;
  return 30;
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
