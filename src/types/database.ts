export type MedicalArea =
  | 'Clínica Médica'
  | 'Cirurgia Geral'
  | 'Pediatria'
  | 'Ginecologia e Obstetrícia'
  | 'Medicina Preventiva';

export const MEDICAL_AREAS: MedicalArea[] = [
  'Clínica Médica',
  'Cirurgia Geral',
  'Pediatria',
  'Ginecologia e Obstetrícia',
  'Medicina Preventiva',
];

export const AREA_COLORS: Record<MedicalArea, { primary: string; bg: string; text: string; border: string }> = {
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

export interface Profile {
  id: string;
  full_name: string;
  target_specialty: string;
  target_exams?: string[];
  target_cutoff_percentage?: number;
  target_year?: number;
  onboarding_completed?: boolean;
  created_at: string;
}

export interface StudyTopic {
  id: string;
  user_id: string;
  area: MedicalArea;
  subject_name: string;
  initial_date: string;
  initial_questions: number;
  initial_correct: number;
  initial_percentage: number;
  created_at: string;
}

export type ReviewStatus = 'CONCLUÍDO' | 'ATRASADO' | 'REVISAR HOJE' | 'PROGRAMADO';

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
  created_at: string;
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
  exam_year: number;
  score_percentage: number;
  created_at: string;
}

export interface UserStats {
  todayReviewsCount: number;
  currentStreak: number;
  overallAccuracy: number;
  totalQuestions: number;
  vulnerableArea: {
    area: MedicalArea;
    accuracy: number;
    topicsCount: number;
  } | null;
  areaAccuracy: Record<MedicalArea, { correct: number; total: number; percentage: number; topicsCount: number }>;
}
