export type MedicalArea = string;

export interface StudyArea {
  id: string;
  name: string;
  color: string;   // Ex: '#3B82F6'
  bg: string;      // Ex: 'bg-blue-500/10'
  text: string;    // Ex: 'text-blue-500'
  border: string;  // Ex: 'border-blue-500/20'
}

export const COLOR_PALETTE = [
  { name: 'Azul', hex: '#3B82F6', bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
  { name: 'Esmeralda', hex: '#10B981', bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
  { name: 'Âmbar', hex: '#F59E0B', bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
  { name: 'Rosa', hex: '#EC4899', bg: 'bg-pink-500/10', text: 'text-pink-500', border: 'border-pink-500/20' },
  { name: 'Roxo', hex: '#8B5CF6', bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
  { name: 'Vermelho', hex: '#EF4444', bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20' },
  { name: 'Ciano', hex: '#06B6D4', bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/20' },
  { name: 'Índigo', hex: '#6366F1', bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/20' },
  { name: 'Laranja', hex: '#F97316', bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/20' },
  { name: 'Verde Lima', hex: '#84CC16', bg: 'bg-lime-500/10', text: 'text-lime-500', border: 'border-lime-500/20' },
];

export const DEFAULT_STUDY_AREAS: StudyArea[] = [
  {
    id: 'area-clinica',
    name: 'Clínica Médica',
    color: '#3B82F6',
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    border: 'border-blue-500/20',
  },
  {
    id: 'area-cirurgia',
    name: 'Cirurgia Geral',
    color: '#10B981',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    border: 'border-emerald-500/20',
  },
  {
    id: 'area-pediatria',
    name: 'Pediatria',
    color: '#F59E0B',
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    border: 'border-amber-500/20',
  },
  {
    id: 'area-go',
    name: 'Ginecologia e Obstetrícia',
    color: '#EC4899',
    bg: 'bg-pink-500/10',
    text: 'text-pink-500',
    border: 'border-pink-500/20',
  },
  {
    id: 'area-preventiva',
    name: 'Medicina Preventiva',
    color: '#8B5CF6',
    bg: 'bg-purple-500/10',
    text: 'text-purple-500',
    border: 'border-purple-500/20',
  },
];

export const MEDICAL_AREAS: string[] = DEFAULT_STUDY_AREAS.map(a => a.name);

export interface AreaStyle {
  primary: string;
  bg: string;
  text: string;
  border: string;
  cardBg: string;
  cardBorder: string;
  cardHover: string;
}

export const AREA_COLORS: Record<string, AreaStyle> = {
  'Clínica Médica': {
    primary: '#3B82F6',
    bg: 'bg-blue-500/15 dark:bg-blue-500/25',
    text: 'text-blue-700 dark:text-blue-300 font-bold',
    border: 'border-blue-500/40 dark:border-blue-500/50',
    cardBg: 'bg-blue-500/15 dark:bg-blue-500/20',
    cardBorder: 'border-blue-500/30 dark:border-blue-500/40 border-l-4 border-l-blue-500',
    cardHover: 'hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-sm',
  },
  'Cirurgia Geral': {
    primary: '#10B981',
    bg: 'bg-emerald-500/15 dark:bg-emerald-500/25',
    text: 'text-emerald-700 dark:text-emerald-300 font-bold',
    border: 'border-emerald-500/40 dark:border-emerald-500/50',
    cardBg: 'bg-emerald-500/15 dark:bg-emerald-500/20',
    cardBorder: 'border-emerald-500/30 dark:border-emerald-500/40 border-l-4 border-l-emerald-500',
    cardHover: 'hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-sm',
  },
  'Pediatria': {
    primary: '#F59E0B',
    bg: 'bg-amber-500/15 dark:bg-amber-500/25',
    text: 'text-amber-700 dark:text-amber-300 font-bold',
    border: 'border-amber-500/40 dark:border-amber-500/50',
    cardBg: 'bg-amber-500/15 dark:bg-amber-500/20',
    cardBorder: 'border-amber-500/30 dark:border-amber-500/40 border-l-4 border-l-amber-500',
    cardHover: 'hover:border-amber-500 dark:hover:border-amber-400 hover:shadow-sm',
  },
  'Ginecologia e Obstetrícia': {
    primary: '#EC4899',
    bg: 'bg-pink-500/15 dark:bg-pink-500/25',
    text: 'text-pink-700 dark:text-pink-300 font-bold',
    border: 'border-pink-500/40 dark:border-pink-500/50',
    cardBg: 'bg-pink-500/15 dark:bg-pink-500/20',
    cardBorder: 'border-pink-500/30 dark:border-pink-500/40 border-l-4 border-l-pink-500',
    cardHover: 'hover:border-pink-500 dark:hover:border-pink-400 hover:shadow-sm',
  },
  'Medicina Preventiva': {
    primary: '#8B5CF6',
    bg: 'bg-purple-500/15 dark:bg-purple-500/25',
    text: 'text-purple-700 dark:text-purple-300 font-bold',
    border: 'border-purple-500/40 dark:border-purple-500/50',
    cardBg: 'bg-purple-500/15 dark:bg-purple-500/20',
    cardBorder: 'border-purple-500/30 dark:border-purple-500/40 border-l-4 border-l-purple-500',
    cardHover: 'hover:border-purple-500 dark:hover:border-purple-400 hover:shadow-sm',
  },
};

export function getAreaStyle(areaName: string, customAreas: StudyArea[] = []): AreaStyle {
  // Procura primeiro nas áreas do usuário
  const found = customAreas.find(a => a.name.toLowerCase() === areaName.toLowerCase());
  if (found) {
    // Se o customArea coincidir com uma das áreas padrão
    if (AREA_COLORS[found.name]) {
      return AREA_COLORS[found.name];
    }
    return {
      primary: found.color,
      bg: found.bg || 'bg-primary/10',
      text: found.text || 'text-primary font-bold',
      border: found.border || 'border-primary/20',
      cardBg: found.bg ? `${found.bg.replace('/10', '/15')} dark:${found.bg.replace('/10', '/20')}` : 'bg-primary/15 dark:bg-primary/20',
      cardBorder: found.border ? `${found.border.replace('/20', '/30')} border-l-4 border-l-primary` : 'border-primary/30 border-l-4 border-l-primary',
      cardHover: 'hover:border-primary hover:shadow-sm',
    };
  }

  // Fallback para mapa padrão
  if (AREA_COLORS[areaName]) {
    return AREA_COLORS[areaName];
  }

  // Fallback hash baseado no nome para cores consistentes
  let hash = 0;
  for (let i = 0; i < areaName.length; i++) {
    hash = areaName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % COLOR_PALETTE.length;
  const c = COLOR_PALETTE[colorIndex];
  return {
    primary: c.hex,
    bg: c.bg,
    text: c.text,
    border: c.border,
    cardBg: `${c.bg.replace('/10', '/15')} dark:${c.bg.replace('/10', '/20')}`,
    cardBorder: `${c.border.replace('/20', '/30')} border-l-4 border-l-primary`,
    cardHover: 'hover:border-primary hover:shadow-sm',
  };
}

export type StreakRuleType =
  | 'questions_or_mock'
  | 'questions_only'
  | 'questions_and_mock'
  | 'mock_only';

export interface StreakConfig {
  minDailyQuestions: number;
  ruleType: StreakRuleType;
}

export const DEFAULT_STREAK_CONFIG: StreakConfig = {
  minDailyQuestions: 10,
  ruleType: 'questions_or_mock',
};

export interface WorkloadConfig {
  maxDailyReviews: number;      // Padrão: 3 revisões/dia
  maxDailyOverdue: number;      // Padrão: 2 atrasados puxados para a fila de hoje
  maxDailyNewTopics: number;    // Padrão: 1 novo assunto por dia
  forestGarden?: ForestGardenState; // Viveiro paralelo de 3 canteiros + boosts (sync em profiles.workload_config JSONB)
}

export const DEFAULT_WORKLOAD_CONFIG: WorkloadConfig = {
  maxDailyReviews: 3,
  maxDailyOverdue: 2,
  maxDailyNewTopics: 1,
};

export interface PedagogicalDiagnosis {
  level: 'lapse' | 'unstable' | 'desirable' | 'solid' | 'mastery';
  badge: string;           // Ex: "Ruptura Crítica (Lapse)"
  title: string;           // Ex: "Ruptura Crítica (Lapse)"
  pedagogicalNote: string; // Ex: "Foco em bloco corretivo enxuto para retestar os erros em 48h sem causar fadiga cognitiva."
  colorVariant: 'destructive' | 'warning' | 'success' | 'info' | 'purple';
}

export interface FsrsCardState {
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  state: number;
  lastReview?: string;
}

export interface Profile {
  id: string;
  full_name: string;
  target_specialty: string;
  target_exams?: string[];
  target_cutoff_percentage?: number;
  target_year?: number;
  custom_areas?: StudyArea[];
  streak_config?: StreakConfig;
  workload_config?: WorkloadConfig;
  onboarding_completed?: boolean;
  is_subscribed?: boolean;
  subscription_status?: 'active' | 'inactive' | 'trial' | 'canceled';
  cancel_at_period_end?: boolean;
  current_period_end?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  created_at: string;
}

export interface StudyTopic {
  id: string;
  user_id: string;
  area: string;
  subject_name: string;
  tags?: string[];
  initial_date: string;
  initial_questions: number;
  initial_correct: number;
  initial_percentage: number;
  initial_duration_minutes?: number | null;
  is_planned?: boolean;
  planned_date?: string;
  is_weekly_goal?: boolean;
  notes?: string;
  base_questions_count?: number;
  created_at: string;
}

export interface PrevalentTopic {
  id: string;
  user_id?: string;
  area: string;
  subject_name: string;
  prevalence_level: 'ALTA' | 'MEDIA' | 'BAIXA';
  rank_order: number;
  banca?: string;
  frequency_notes?: string;
  created_at: string;
}

export type ReviewStatus = 'CONCLUÍDO' | 'ATRASADO' | 'REVISAR HOJE' | 'PROGRAMADO' | 'PENDENTE DE ESTUDO';

export interface TopicReview {
  id: string;
  topic_id: string;
  user_id: string;
  review_number: number; // 1 a 8
  scheduled_date: string;
  completed_date: string | null;
  questions_done: number | null;
  questions_correct: number | null;
  percentage: number | null;
  duration_minutes?: number | null;
  recommended_questions?: number;
  previous_interval_days?: number;
  diagnosis?: string;
  diagnosis_badge?: string;
  pedagogical_note?: string;
  created_at: string;
}

export interface ReviewCalculationInput {
  currentCycle: number; // 0 para Estudo Inicial, 1 para R1, etc.
  accuracy: number; // 0 a 100
  baseQuestionsCount: number;
  previousIntervalDays?: number;
  actualElapsedDays?: number; // Tempo real decorrido desde o último estudo/revisão
  targetYear?: number; // Ano da prova alvo (modulação Cepeda et al., 2008)
  fsrsState?: FsrsCardState;
  reviewHistory?: Array<{ date: string; accuracy: number }>;
  referenceDate?: string;
}

export interface ReviewCalculationResult {
  nextIntervalDays: number;
  nextCycle: number;
  recommendedQuestions: number;
  diagnosis: string;
  diagnosisBadge: string;
  pedagogicalNote: string;
  fsrsState?: FsrsCardState;
  fsrsRating?: number;
}

export interface TopicWithReviews extends StudyTopic {
  reviews: TopicReview[];
  currentReview?: TopicReview;
  status?: ReviewStatus;
  daysDiff?: number;
}

export interface MockExam {
  id: string;
  user_id: string;
  exam_name: string;
  exam_date: string;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  created_at: string;
}

export interface InstitutionExam {
  id: string;
  user_id: string;
  institution_name: string;
  exam_year: string | number;
  score_percentage: number;
  created_at: string;
}

export type ErrorLogCause =
  | 'Lacuna teórica'
  | 'Interpretação'
  | 'Pegadinha da banca'
  | 'Distração';

export const ERROR_LOG_CAUSES: ErrorLogCause[] = [
  'Lacuna teórica',
  'Interpretação',
  'Pegadinha da banca',
  'Distração',
];

export const ERROR_LOG_CAUSE_STYLES: Record<ErrorLogCause, string> = {
  'Lacuna teórica': 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  'Interpretação': 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  'Pegadinha da banca': 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
  'Distração': 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
};

export interface ErrorLog {
  id: string;
  user_id: string;
  topic_id: string;
  review_id?: string | null;
  cause: ErrorLogCause;
  concept_summary: string;
  question_ref?: string | null;
  is_reviewed: boolean;
  created_at: string;
}

export type FocusMode = 'pomodoro' | 'stopwatch';
export type FocusSessionStatus = 'completed' | 'withered';
export type ForestBoostType = 'water' | 'fertilizer' | 'bees';

export interface NurserySlotState {
  slotIndex: 0 | 1 | 2;
  area: string;
  topicId?: string | null;
  subjectName?: string | null;
  accumulatedSeconds: number; // Progresso no ciclo atual (0 até 6000s = 4 estágios de 25 min)
  boostedSeconds: number;     // Quanto deste ciclo veio de Água / Adubo / Abelhas
  plotSeed?: number;          // Semente determinística de posição aleatória na ilha 3D
  beesActiveUntilMs?: number; // Timestamp até quando as abelhas polinizam visualmente este canteiro
  lastBoostAtMs?: number;     // Timestamp do último boost para efeito visual imediato na cena 3D
}

export interface MaturedGardenTree {
  id: string;
  area: string;
  subjectName?: string | null;
  completedAtIso: string;
  sessionDate: string; // YYYY-MM-DD
  durationSeconds?: number;
  source?: 'session' | 'boost';
  sessionId?: string;
}

export interface ForestGardenState {
  activeSlotIndex: 0 | 1 | 2;
  slots: [NurserySlotState, NurserySlotState, NurserySlotState];
  boostsSpent: {
    water: number;
    fertilizer: number;
    bees: number;
  };
  maturedTrees: MaturedGardenTree[];
}

export interface StudySession {
  id: string;
  user_id: string;
  topic_id?: string | null;
  area: string;
  subject_name?: string | null;
  mode: FocusMode;
  status: FocusSessionStatus;
  duration_seconds: number;
  planned_seconds?: number | null;
  trees_earned: number;
  session_date: string; // YYYY-MM-DD
  started_at: string;
  ended_at: string;
  created_at: string;
}

export interface UserStats {
  todayReviewsCount: number;
  currentStreak: number;
  overallAccuracy: number;
  totalQuestions: number;
  todayQuestionsCount: number;
  todayMockCompleted: boolean;
  streakQualifiedToday: boolean;
  streakConfig?: StreakConfig;
  workloadConfig?: WorkloadConfig;
  todayPriorityQueueCount?: number;
  backlogOverdueCount?: number;
  overdueCount?: number;
  vulnerableArea: {
    area: string;
    accuracy: number;
    topicsCount: number;
  } | null;
  areaAccuracy: Record<string, { correct: number; total: number; percentage: number; topicsCount: number }>;
}

