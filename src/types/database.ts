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

export const AREA_COLORS: Record<string, { primary: string; bg: string; text: string; border: string }> = {
  'Clínica Médica': {
    primary: '#3B82F6',
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    border: 'border-blue-500/20',
  },
  'Cirurgia Geral': {
    primary: '#10B981',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    border: 'border-emerald-500/20',
  },
  'Pediatria': {
    primary: '#F59E0B',
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    border: 'border-amber-500/20',
  },
  'Ginecologia e Obstetrícia': {
    primary: '#EC4899',
    bg: 'bg-pink-500/10',
    text: 'text-pink-500',
    border: 'border-pink-500/20',
  },
  'Medicina Preventiva': {
    primary: '#8B5CF6',
    bg: 'bg-purple-500/10',
    text: 'text-purple-500',
    border: 'border-purple-500/20',
  },
};

export function getAreaStyle(areaName: string, customAreas: StudyArea[] = []) {
  // Procura primeiro nas áreas do usuário
  const found = customAreas.find(a => a.name.toLowerCase() === areaName.toLowerCase());
  if (found) {
    return {
      primary: found.color,
      bg: found.bg,
      text: found.text,
      border: found.border,
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

export interface Profile {
  id: string;
  full_name: string;
  target_specialty: string;
  target_exams?: string[];
  target_cutoff_percentage?: number;
  target_year?: number;
  custom_areas?: StudyArea[];
  streak_config?: StreakConfig;
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
  recommended_questions?: number;
  previous_interval_days?: number;
  diagnosis?: string;
  created_at: string;
}

export interface ReviewCalculationInput {
  currentCycle: number; // 0 para Estudo Inicial, 1 para R1, etc.
  accuracy: number; // 0 a 100
  baseQuestionsCount: number;
  previousIntervalDays?: number;
}

export interface ReviewCalculationResult {
  nextIntervalDays: number;
  nextCycle: number;
  recommendedQuestions: number;
  diagnosis: string;
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

export interface UserStats {
  todayReviewsCount: number;
  currentStreak: number;
  overallAccuracy: number;
  totalQuestions: number;
  todayQuestionsCount: number;
  todayMockCompleted: boolean;
  streakQualifiedToday: boolean;
  streakConfig?: StreakConfig;
  vulnerableArea: {
    area: string;
    accuracy: number;
    topicsCount: number;
  } | null;
  areaAccuracy: Record<string, { correct: number; total: number; percentage: number; topicsCount: number }>;
}

