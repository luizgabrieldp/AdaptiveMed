'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import {
  StudyTopic,
  TopicReview,
  MockExam,
  InstitutionExam,
  Profile,
  MedicalArea,
  StudyArea,
  DEFAULT_STUDY_AREAS,
  COLOR_PALETTE,
  UserStats,
  PrevalentTopic,
  StreakConfig,
  DEFAULT_STREAK_CONFIG,
  WorkloadConfig,
  DEFAULT_WORKLOAD_CONFIG,
  ErrorLog,
  ErrorLogCause,
  StudySession,
  ForestGardenState,
} from '@/types/database';
import { normalizeForestGarden } from '@/lib/focus-timer';
import {
  getInitialDemoTopics,
  getInitialDemoReviews,
  getInitialDemoMockExams,
  getInitialDemoInstitutionExams,
  getInitialDemoPrevalentTopics,
  getInitialDemoErrorLogs,
  getInitialDemoStudySessions,
  INITIAL_DEMO_PROFILE,
} from './demo-data';
import {
  calculateNextReviewInterval,
  calculateNextReview,
  diffInDays,
  getTodayDateString,
  addDaysToDate,
  calculateStreak,
  calculateQualifiedStreak,
  findNextAvailableDate,
  computeRebalancedSchedule,
} from '@/lib/spaced-repetition';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface DataContextType {
  topics: StudyTopic[];
  reviews: TopicReview[];
  mockExams: MockExam[];
  institutionExams: InstitutionExam[];
  prevalentTopics: PrevalentTopic[];
  errorLogs: ErrorLog[];
  studySessions: StudySession[];
  profile: Profile | null;
  areas: StudyArea[];
  allTags: string[];
  user: any;
  isLoading: boolean;
  isDemoMode: boolean;
  stats: UserStats;
  streakConfig: StreakConfig;
  workloadConfig: WorkloadConfig;
  forestGarden: ForestGardenState;
  updateStreakConfig: (config: StreakConfig) => Promise<void>;
  updateWorkloadConfig: (config: WorkloadConfig) => Promise<void>;
  updateForestGarden: (garden: ForestGardenState) => Promise<void>;
  addTopic: (data: {
    area: string;
    subject_name: string;
    tags?: string[];
    initial_date: string;
    initial_questions: number;
    initial_correct: number;
    initial_duration_minutes?: number;
    notes?: string;
    errorCauses?: ErrorLogCause[];
  }) => Promise<string>;
  updateTopic: (topicId: string, data: Partial<StudyTopic>) => Promise<void>;
  updateTopicR0: (
    topicId: string,
    questionsDone: number,
    questionsCorrect: number,
    initialDate?: string,
    durationMinutes?: number | null,
    extraTopicData?: Partial<StudyTopic>,
    errorCauses?: ErrorLogCause[]
  ) => Promise<void>;
  addPlannedTopic: (data: {
    area: string;
    subject_name: string;
    planned_date?: string;
    tags?: string[];
    is_weekly_goal?: boolean;
    notes?: string;
  }) => Promise<void>;
  recordPlannedTopicStudy: (
    topicId: string,
    data: {
      study_date: string;
      questions_done: number;
      questions_correct: number;
      duration_minutes?: number;
      notes?: string;
      errorCauses?: ErrorLogCause[];
    }
  ) => Promise<{ nextReviewDate?: string }>;
  updateTopicWeeklyGoal: (topicId: string, is_weekly_goal: boolean) => Promise<void>;
  updatePlannedTopicDate: (topicId: string, planned_date: string | null) => Promise<void>;
  rescheduleReview: (reviewId: string, newScheduledDate: string) => Promise<void>;
  rebalanceOverdueReviews: () => Promise<number>;
  distributeWeeklyAutoStudy: (weekStartStr: string) => Promise<number>;
  addArea: (name: string, colorHex: string) => Promise<void>;
  updateArea: (id: string, name: string, colorHex: string) => Promise<void>;
  reorderAreas: (newAreas: StudyArea[]) => Promise<void>;
  deleteArea: (id: string) => Promise<void>;
  resetDefaultAreas: () => Promise<void>;
  completeReview: (
    reviewId: string,
    questionsDone: number,
    questionsCorrect: number,
    durationMinutes?: number,
    errorCauses?: ErrorLogCause[]
  ) => Promise<{ nextReviewDate?: string }>;
  updateCompletedReview: (
    reviewId: string,
    questionsDone: number,
    questionsCorrect: number,
    completedDate?: string,
    durationMinutes?: number | null,
    errorCauses?: ErrorLogCause[]
  ) => Promise<void>;
  deleteTopic: (topicId: string) => Promise<void>;
  deleteReviewsFromCycle: (topicId: string, fromReviewNumber: number) => Promise<void>;
  recalculateTopicReviews: (topicId: string) => Promise<void>;
  addMockExam: (data: {
    exam_name: string;
    exam_date: string;
    total_questions: number;
    correct_answers: number;
  }) => Promise<void>;
  deleteMockExam: (examId: string) => Promise<void>;
  addInstitutionExam: (data: {
    institution_name: string;
    exam_year: string | number;
    score_percentage: number;
  }) => Promise<void>;
  deleteInstitutionExam: (examId: string) => Promise<void>;
  addPrevalentTopic: (data: Omit<PrevalentTopic, 'id' | 'created_at'>) => Promise<string>;
  updatePrevalentTopic: (id: string, data: Partial<PrevalentTopic>) => Promise<void>;
  deletePrevalentTopic: (id: string) => Promise<void>;
  reorderPrevalentTopics: (orderedIds: string[]) => Promise<void>;
  addErrorLog: (data: {
    topic_id: string;
    review_id?: string | null;
    cause: ErrorLogCause;
    concept_summary: string;
    question_ref?: string;
  }) => Promise<void>;
  toggleErrorLogReviewed: (id: string, is_reviewed?: boolean) => Promise<void>;
  updateErrorLog: (id: string, data: Partial<ErrorLog>) => Promise<void>;
  deleteErrorLog: (id: string) => Promise<void>;
  addStudySession: (
    data: Omit<StudySession, 'id' | 'user_id' | 'created_at'>
  ) => Promise<StudySession>;
  deleteStudySession: (id: string) => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  resetToDemo: () => void;
  signInDemo: () => void;
  signOut: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const LOCAL_STORAGE_KEYS = {
  TOPICS: 'adaptivemed_topics_v1',
  REVIEWS: 'adaptivemed_reviews_v1',
  MOCK_EXAMS: 'adaptivemed_mock_exams_v1',
  INST_EXAMS: 'adaptivemed_inst_exams_v1',
  PREVALENT_TOPICS: 'adaptivemed_prevalent_topics_v1',
  ERROR_LOGS: 'adaptivemed_error_logs_v1',
  STUDY_SESSIONS: 'adaptivemed_study_sessions_v1',
  PROFILE: 'adaptivemed_profile_v1',
  AREAS: 'adaptivemed_areas_v1',
  STREAK_CONFIG: 'adaptivemed_streak_config_v1',
  WORKLOAD_CONFIG: 'adaptivemed_workload_config_v1',
  PAUSED_TRACKS: 'adaptivemed_paused_tracks_v1',
  DEMO_ACTIVE: 'adaptivemed_demo_active',
};

function isProfileSubscribed(
  prof?: { is_subscribed?: boolean | null; subscription_status?: string | null } | null
): boolean {
  if (!prof) return false;
  const status = prof.subscription_status as string | null | undefined;
  return Boolean(
    prof.is_subscribed ||
      status === 'active' ||
      status === 'trial' ||
      status === 'trialing'
  );
}

function getPausedTrackIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.PAUSED_TRACKS);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((id): id is string => typeof id === 'string'));
    }
  } catch {}
  return new Set();
}

function savePausedTrackIds(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.PAUSED_TRACKS, JSON.stringify(Array.from(ids)));
  } catch {}
}

function markTrackPaused(topicId: string) {
  const ids = getPausedTrackIds();
  ids.add(topicId);
  savePausedTrackIds(ids);
}

function unmarkTrackPaused(topicId: string) {
  const ids = getPausedTrackIds();
  if (ids.delete(topicId)) {
    savePausedTrackIds(ids);
  }
}

// Campos homologados no schema base do PostgreSQL
const BASE_STUDY_TOPIC_FIELDS = [
  'id',
  'user_id',
  'area',
  'subject_name',
  'initial_date',
  'initial_questions',
  'initial_correct',
  'initial_percentage',
  'tags',
  'is_planned',
  'planned_date',
  'is_weekly_goal',
  'notes',
  'base_questions_count',
  'created_at',
];

const BASE_TOPIC_REVIEW_FIELDS = [
  'id',
  'topic_id',
  'user_id',
  'review_number',
  'scheduled_date',
  'completed_date',
  'questions_done',
  'questions_correct',
  'percentage',
  'recommended_questions',
  'previous_interval_days',
  'diagnosis',
  'created_at',
];

function pickFields<T extends Record<string, any>>(obj: T, allowedKeys: string[]): Partial<T> {
  const result: any = {};
  for (const key of allowedKeys) {
    if (key in obj && obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

// Inserção resiliente no study_topics com tolerância a colunas novas
async function safeInsertStudyTopic(supabase: any, topic: StudyTopic) {
  try {
    const { error } = await supabase.from('study_topics').insert(topic);
    if (!error) return;

    console.warn('Aviso ao inserir estudo completo no Supabase, tentando com campos base:', error.message || error);
    const basePayload = pickFields(topic, BASE_STUDY_TOPIC_FIELDS);
    const { error: retryError } = await supabase.from('study_topics').insert(basePayload);
    if (retryError) {
      console.error('Falha ao persistir study_topics no Supabase mesmo com campos base:', retryError);
    }
  } catch (err) {
    console.error('Exceção ao persistir study_topics no Supabase:', err);
  }
}

// Atualização resiliente no study_topics
async function safeUpdateStudyTopic(supabase: any, topicId: string, data: Partial<StudyTopic>) {
  try {
    const { error } = await supabase.from('study_topics').update(data).eq('id', topicId);
    if (!error) return;

    console.warn('Aviso ao atualizar estudo no Supabase, tentando com campos base:', error.message || error);
    const baseData = pickFields(data, BASE_STUDY_TOPIC_FIELDS);
    const { error: retryError } = await supabase.from('study_topics').update(baseData).eq('id', topicId);
    if (retryError) {
      console.error('Falha ao atualizar study_topics no Supabase mesmo com campos base:', retryError);
    }
  } catch (err) {
    console.error('Exceção ao atualizar study_topics no Supabase:', err);
  }
}

// Inserção resiliente no topic_reviews com tolerância a colunas novas
async function safeInsertTopicReview(supabase: any, review: TopicReview) {
  try {
    const { error } = await supabase.from('topic_reviews').insert(review);
    if (!error) return;

    console.warn('Aviso ao inserir revisão no Supabase, tentando com campos base:', error.message || error);
    const basePayload = pickFields(review, BASE_TOPIC_REVIEW_FIELDS);
    const { error: retryError } = await supabase.from('topic_reviews').insert(basePayload);
    if (retryError) {
      console.error('Falha ao persistir topic_reviews no Supabase mesmo com campos base:', retryError);
    }
  } catch (err) {
    console.error('Exceção ao persistir topic_reviews no Supabase:', err);
  }
}

// Atualização resiliente no topic_reviews
async function safeUpdateTopicReview(supabase: any, reviewId: string, data: Partial<TopicReview>) {
  try {
    const { error } = await supabase.from('topic_reviews').update(data).eq('id', reviewId);
    if (!error) return;

    console.warn('Aviso ao atualizar revisão no Supabase, tentando com campos base:', error.message || error);
    const baseData = pickFields(data, BASE_TOPIC_REVIEW_FIELDS);
    const { error: retryError } = await supabase.from('topic_reviews').update(baseData).eq('id', reviewId);
    if (retryError) {
      console.error('Falha ao atualizar topic_reviews no Supabase mesmo com campos base:', retryError);
    }
  } catch (err) {
    console.error('Exceção ao atualizar topic_reviews no Supabase:', err);
  }
}

// Sincronização segura e não-bloqueante em background com Supabase
const syncSupabase = (promise: PromiseLike<any>) => {
  Promise.resolve(promise)
    .then(res => {
      if (res && typeof res === 'object' && 'error' in res && (res as any).error) {
        console.warn('Aviso ao sincronizar com Supabase:', (res as any).error);
      }
    })
    .catch(err => {
      console.warn('Sincronização em background com Supabase adiada ou falhou:', err);
    });
};


export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [reviews, setReviews] = useState<TopicReview[]>([]);
  const [mockExams, setMockExams] = useState<MockExam[]>([]);
  const [institutionExams, setInstitutionExams] = useState<InstitutionExam[]>([]);
  const [prevalentTopics, setPrevalentTopics] = useState<PrevalentTopic[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [areas, setAreas] = useState<StudyArea[]>(DEFAULT_STUDY_AREAS);
  const [streakConfig, setStreakConfig] = useState<StreakConfig>(DEFAULT_STREAK_CONFIG);
  const [workloadConfig, setWorkloadConfig] = useState<WorkloadConfig>(DEFAULT_WORKLOAD_CONFIG);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(true);

  const topicsRef = useRef<StudyTopic[]>(topics);
  const reviewsRef = useRef<TopicReview[]>(reviews);
  const errorLogsRef = useRef<ErrorLog[]>(errorLogs);

  const applyTopicsUpdate = (
    updater: StudyTopic[] | ((prev: StudyTopic[]) => StudyTopic[]),
    persistLocal = false
  ): StudyTopic[] => {
    const next = typeof updater === 'function' ? updater(topicsRef.current) : updater;
    topicsRef.current = next;
    setTopics(next);
    if (persistLocal && typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEYS.TOPICS, JSON.stringify(next));
      } catch {}
    }
    return next;
  };

  const applyReviewsUpdate = (
    updater: TopicReview[] | ((prev: TopicReview[]) => TopicReview[]),
    persistLocal = false
  ): TopicReview[] => {
    const next = typeof updater === 'function' ? updater(reviewsRef.current) : updater;
    reviewsRef.current = next;
    setReviews(next);
    if (persistLocal && typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEYS.REVIEWS, JSON.stringify(next));
      } catch {}
    }
    return next;
  };

  const applyErrorLogsUpdate = (
    updater: ErrorLog[] | ((prev: ErrorLog[]) => ErrorLog[]),
    persistLocal = false
  ): ErrorLog[] => {
    const next = typeof updater === 'function' ? updater(errorLogsRef.current) : updater;
    errorLogsRef.current = next;
    setErrorLogs(next);
    if (persistLocal && typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEYS.ERROR_LOGS, JSON.stringify(next));
      } catch {}
    }
    return next;
  };

  const restoreProfileAndConfigsFromLocalStorage = (userId: string) => {
    if (typeof window === 'undefined') return;
    try {
      let restoredProfile: Profile | null = null;
      const storedProfileRaw = localStorage.getItem(LOCAL_STORAGE_KEYS.PROFILE);
      if (storedProfileRaw) {
        const parsedProf = JSON.parse(storedProfileRaw) as Profile;
        if (parsedProf && parsedProf.id === userId) {
          restoredProfile = parsedProf;
          setProfile(parsedProf);
        }
      }

      const storedAreasRaw = localStorage.getItem(LOCAL_STORAGE_KEYS.AREAS);
      if (storedAreasRaw) {
        try {
          const parsedAreas = JSON.parse(storedAreasRaw);
          if (Array.isArray(parsedAreas) && parsedAreas.length > 0) {
            setAreas(parsedAreas);
          }
        } catch {}
      } else if (restoredProfile?.custom_areas && restoredProfile.custom_areas.length > 0) {
        setAreas(restoredProfile.custom_areas);
      }

      const storedStreakRaw = localStorage.getItem(LOCAL_STORAGE_KEYS.STREAK_CONFIG);
      if (storedStreakRaw) {
        try {
          const parsedStreak = JSON.parse(storedStreakRaw);
          if (parsedStreak && typeof parsedStreak === 'object') {
            setStreakConfig(parsedStreak);
          }
        } catch {}
      } else if (restoredProfile?.streak_config) {
        setStreakConfig(restoredProfile.streak_config);
      }

      const storedWorkloadRaw = localStorage.getItem(LOCAL_STORAGE_KEYS.WORKLOAD_CONFIG);
      if (storedWorkloadRaw) {
        try {
          const parsedWorkload = JSON.parse(storedWorkloadRaw);
          if (parsedWorkload && typeof parsedWorkload === 'object') {
            setWorkloadConfig(parsedWorkload);
          }
        } catch {}
      } else if (restoredProfile?.workload_config) {
        setWorkloadConfig(restoredProfile.workload_config);
      }
    } catch (storageErr) {
      console.error('Erro ao restaurar perfil/configurações do localStorage:', storageErr);
    }
  };


  // Inicialização e detecção do Supabase
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      const configured = isSupabaseConfigured();

      if (configured) {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          setIsDemoMode(false);
          await loadSupabaseData(session.user.id);
          setIsLoading(false);
          return;
        }
      }

      // Se não autenticado no Supabase, limpa estados e não permite acesso
      setUser(null);
      setProfile(null);
      applyTopicsUpdate([]);
      applyReviewsUpdate([]);
      setMockExams([]);
      setInstitutionExams([]);
      setPrevalentTopics([]);
      applyErrorLogsUpdate([]);
      setStudySessions([]);
      setAreas(DEFAULT_STUDY_AREAS);
      setIsDemoMode(false);
      setIsLoading(false);
    }

    init();
  }, []);

  const loadSupabaseData = async (userId: string) => {
    // Se o localStorage pertence a outro usuário (ex.: troca de conta sem signOut), limpa resíduos locais
    if (typeof window !== 'undefined') {
      try {
        const localProfRaw = localStorage.getItem(LOCAL_STORAGE_KEYS.PROFILE);
        if (localProfRaw) {
          const parsedLocalProf = JSON.parse(localProfRaw);
          if (parsedLocalProf?.id && parsedLocalProf.id !== userId) {
            Object.values(LOCAL_STORAGE_KEYS).forEach(key => {
              localStorage.removeItem(key);
            });
            localStorage.removeItem('adaptivemed_focus_timer_state_v1');
          }
        }
      } catch {}
    }

    const supabase = createClient();
    try {
      const loadPromise = Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('study_topics').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('topic_reviews').select('*').eq('user_id', userId).order('scheduled_date', { ascending: true }),
        supabase.from('mock_exams').select('*').eq('user_id', userId).order('exam_date', { ascending: false }),
        supabase.from('institution_exams').select('*').eq('user_id', userId).order('exam_year', { ascending: true }),
        supabase.from('prevalent_topics').select('*').eq('user_id', userId).order('rank_order', { ascending: true }),
        supabase.from('error_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('study_sessions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      ]);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout de carregamento do Supabase')), 10000)
      );

      const [
        { data: profData },
        { data: topData },
        { data: revData },
        { data: mockData },
        { data: instData },
        prevResult,
        errResult,
        sessResult,
      ] = await Promise.race([loadPromise, timeoutPromise]);

      if (profData) {
        setProfile(profData);
        if (
          profData.custom_areas &&
          Array.isArray(profData.custom_areas) &&
          profData.custom_areas.length > 0
        ) {
          setAreas(profData.custom_areas);
        } else {
          const storedAreas = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEYS.AREAS) : null;
          if (storedAreas) {
            try {
              setAreas(JSON.parse(storedAreas));
            } catch {
              setAreas(DEFAULT_STUDY_AREAS);
            }
          } else {
            setAreas(DEFAULT_STUDY_AREAS);
          }
        }

        // Carrega streak_config persistido no Supabase ou no localStorage
        if (profData.streak_config) {
          setStreakConfig(profData.streak_config);
          if (typeof window !== 'undefined') {
            localStorage.setItem(LOCAL_STORAGE_KEYS.STREAK_CONFIG, JSON.stringify(profData.streak_config));
          }
        } else {
          const storedStreak = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEYS.STREAK_CONFIG) : null;
          if (storedStreak) {
            try {
              setStreakConfig(JSON.parse(storedStreak));
            } catch {
              setStreakConfig(DEFAULT_STREAK_CONFIG);
            }
          }
        }

        // Carrega workload_config persistido no Supabase ou no localStorage
        if (profData.workload_config) {
          setWorkloadConfig(profData.workload_config);
          if (typeof window !== 'undefined') {
            localStorage.setItem(LOCAL_STORAGE_KEYS.WORKLOAD_CONFIG, JSON.stringify(profData.workload_config));
          }
        } else {
          const storedWorkload = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEYS.WORKLOAD_CONFIG) : null;
          if (storedWorkload) {
            try {
              setWorkloadConfig(JSON.parse(storedWorkload));
            } catch {
              setWorkloadConfig(DEFAULT_WORKLOAD_CONFIG);
            }
          }
        }

        // Se usuário logado não possui assinatura ativa e tenta acessar rotas internas de estudo
        const hasActivePlan = isProfileSubscribed(profData);
        if (!hasActivePlan && typeof window !== 'undefined') {
          const path = window.location.pathname;
          const isContaResetAccess =
            path.startsWith('/conta') &&
            new URLSearchParams(window.location.search).get('reset') === 'true';
          if (
            !isContaResetAccess &&
            (path.startsWith('/dashboard') ||
              path.startsWith('/diario') ||
              path.startsWith('/revisoes') ||
              path.startsWith('/simulados') ||
              path.startsWith('/evolucao') ||
              path.startsWith('/prevalencia') ||
              path.startsWith('/erros') ||
              path.startsWith('/foco') ||
              path.startsWith('/onboarding') ||
              path.startsWith('/conta'))
          ) {
            window.location.href = '/pagamento';
            return;
          }
        }

        // Se usuário possui assinatura ativa MAS ainda não concluiu o Onboarding obrigatório
        // (Verifica também no localStorage para evitar redirecionamento indevido por latência de banco)
        let isLocalCompleted = false;
        try {
          const localProf = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEYS.PROFILE) : null;
          if (localProf) {
            const parsedProf = JSON.parse(localProf);
            isLocalCompleted = Boolean(
              parsedProf && parsedProf.id === userId && parsedProf.onboarding_completed === true
            );
          }
        } catch {}

        const isFullyCompleted = Boolean(profData.onboarding_completed || isLocalCompleted);

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(
              LOCAL_STORAGE_KEYS.PROFILE,
              JSON.stringify(
                isFullyCompleted ? { ...profData, onboarding_completed: true } : profData
              )
            );
          } catch {}
        }

        if (
          hasActivePlan &&
          !isFullyCompleted &&
          typeof window !== 'undefined'
        ) {
          const path = window.location.pathname;
          if (
            path.startsWith('/dashboard') ||
            path.startsWith('/diario') ||
            path.startsWith('/revisoes') ||
            path.startsWith('/erros') ||
            path.startsWith('/foco') ||
            path.startsWith('/evolucao') ||
            path.startsWith('/simulados') ||
            path.startsWith('/prevalencia')
          ) {
            window.location.href = '/onboarding';
            return;
          }
        }
      } else {
        // Fallback seguro se profData vier null (ex.: falha temporária na query de profiles)
        restoreProfileAndConfigsFromLocalStorage(userId);
      }

      // 1. MERGE INTELIGENTE DE TÓPICOS (Preserva tópicos locais do mesmo usuário que ainda não subiram ao banco)
      let mergedTopics: StudyTopic[] = (topData as StudyTopic[]) || [];
      const storedTopicsRaw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEYS.TOPICS) : null;
      if (storedTopicsRaw) {
        try {
          const localTopics = JSON.parse(storedTopicsRaw) as StudyTopic[];
          const remoteIds = new Set(mergedTopics.map(t => t.id));
          const pendingTopics = localTopics.filter(
            lt => lt.user_id === userId && !remoteIds.has(lt.id)
          );
          if (pendingTopics.length > 0) {
            mergedTopics = [...pendingTopics, ...mergedTopics];
            // Sincroniza os tópicos pendentes com o Supabase em background
            pendingTopics.forEach(pt => safeInsertStudyTopic(supabase, pt));
          }
        } catch {}
      }
      applyTopicsUpdate(mergedTopics, true);

      // 2. MERGE INTELIGENTE DE REVISÕES (Preserva revisões locais do mesmo usuário se o banco estiver desatualizado)
      let mergedReviews: TopicReview[] = (revData as TopicReview[]) || [];
      const storedReviewsRaw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEYS.REVIEWS) : null;
      if (storedReviewsRaw) {
        try {
          const localReviews = JSON.parse(storedReviewsRaw) as TopicReview[];
          const remoteReviewIds = new Set(mergedReviews.map(r => r.id));
          const pendingReviews = localReviews.filter(
            lr => lr.user_id === userId && !remoteReviewIds.has(lr.id)
          );
          if (pendingReviews.length > 0) {
            mergedReviews = [...mergedReviews, ...pendingReviews];
            pendingReviews.forEach(pr => safeInsertTopicReview(supabase, pr));
          }
        } catch {}
      }

      // 3. AUTO-CURA PEDAGÓGICA (Gera R1 para qualquer estudo que tenha ficado sem revisão, exceto trilhas pausadas manualmente)
      const pausedTrackIds = getPausedTrackIds();
      const missingReviews: TopicReview[] = [];
      mergedTopics.forEach(topic => {
        if (pausedTrackIds.has(topic.id)) return;
        if (!topic.is_planned && (topic.initial_questions > 0 || topic.initial_percentage > 0)) {
          const hasReview = mergedReviews.some(r => r.topic_id === topic.id);
          if (!hasReview) {
            const reviewCalc = calculateNextReview({
              currentCycle: 0,
              accuracy: topic.initial_percentage,
              baseQuestionsCount: topic.initial_questions || topic.base_questions_count || 20,
            });
            const targetDate = addDaysToDate(topic.initial_date || getTodayDateString(), reviewCalc.nextIntervalDays);
            const newR1: TopicReview = {
              id: crypto.randomUUID(),
              topic_id: topic.id,
              user_id: userId,
              review_number: 1,
              scheduled_date: targetDate,
              completed_date: null,
              questions_done: null,
              questions_correct: null,
              percentage: null,
              recommended_questions: reviewCalc.recommendedQuestions,
              previous_interval_days: reviewCalc.nextIntervalDays,
              diagnosis: reviewCalc.diagnosis,
              diagnosis_badge: reviewCalc.diagnosisBadge,
              pedagogical_note: reviewCalc.pedagogicalNote,
              created_at: new Date().toISOString(),
            };
            missingReviews.push(newR1);
            safeInsertTopicReview(supabase, newR1);
          }
        }
      });

      if (missingReviews.length > 0) {
        mergedReviews = [...mergedReviews, ...missingReviews];
      }

      applyReviewsUpdate(mergedReviews, true);

      // 4. Simulados e Assuntos Prevalentes
      setMockExams(mockData ? (mockData as MockExam[]) : []);
      setInstitutionExams(instData ? (instData as InstitutionExam[]) : []);

      if (prevResult?.data && prevResult.data.length > 0) {
        setPrevalentTopics(prevResult.data as PrevalentTopic[]);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEYS.PREVALENT_TOPICS, JSON.stringify(prevResult.data));
        }
      } else {
        const storedPrevalent = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEYS.PREVALENT_TOPICS) : null;
        let filteredPrev: PrevalentTopic[] = [];
        if (storedPrevalent) {
          try {
            const parsedPrev = JSON.parse(storedPrevalent) as PrevalentTopic[];
            if (Array.isArray(parsedPrev)) {
              filteredPrev = parsedPrev.filter(p => p.user_id === userId);
            }
          } catch {}
        }
        setPrevalentTopics(filteredPrev);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEYS.PREVALENT_TOPICS, JSON.stringify(filteredPrev));
        }
      }

      // 5. Caderno de Erros (error_logs) com merge local seguro
      let mergedErrorLogs: ErrorLog[] = (errResult?.data as ErrorLog[]) || [];
      const storedErrorsRaw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEYS.ERROR_LOGS) : null;
      if (storedErrorsRaw) {
        try {
          const localErrors = JSON.parse(storedErrorsRaw) as ErrorLog[];
          const remoteErrIds = new Set(mergedErrorLogs.map(e => e.id));
          const pendingErrors = localErrors.filter(le => !remoteErrIds.has(le.id) && le.user_id === userId);
          if (pendingErrors.length > 0) {
            mergedErrorLogs = [...pendingErrors, ...mergedErrorLogs];
            pendingErrors.forEach(pe => syncSupabase(supabase.from('error_logs').insert(pe)));
          }
        } catch {}
      }
      applyErrorLogsUpdate(mergedErrorLogs, true);

      // 6. Sessões de Foco & Floresta (study_sessions) com merge local seguro
      let mergedSessions: StudySession[] = (sessResult?.data as StudySession[]) || [];
      const storedSessionsRaw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEYS.STUDY_SESSIONS) : null;
      if (storedSessionsRaw) {
        try {
          const localSessions = JSON.parse(storedSessionsRaw) as StudySession[];
          const remoteSessIds = new Set(mergedSessions.map(s => s.id));
          const pendingSessions = localSessions.filter(ls => !remoteSessIds.has(ls.id) && ls.user_id === userId);
          if (pendingSessions.length > 0) {
            mergedSessions = [...pendingSessions, ...mergedSessions];
            pendingSessions.forEach(ps => syncSupabase(supabase.from('study_sessions').insert(ps)));
          }
        } catch {}
      }
      setStudySessions(mergedSessions);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(mergedSessions));
      }
    } catch (err) {
      console.warn('Aviso ou timeout no carregamento do Supabase. Carregando dados locais de segurança:', err);
      // Fallback seguro: se falhar a rede/timeout, carrega perfil, configs e dados locais do mesmo usuário
      restoreProfileAndConfigsFromLocalStorage(userId);
      if (typeof window !== 'undefined') {
        try {
          const parseForUser = <T extends { user_id?: string }>(raw: string | null): T[] | null => {
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            return parsed.filter((item: T) => item && item.user_id === userId);
          };

          const storedTopics = parseForUser<StudyTopic>(localStorage.getItem(LOCAL_STORAGE_KEYS.TOPICS));
          if (storedTopics) applyTopicsUpdate(storedTopics);
          const storedReviews = parseForUser<TopicReview>(localStorage.getItem(LOCAL_STORAGE_KEYS.REVIEWS));
          if (storedReviews) applyReviewsUpdate(storedReviews);
          const storedMocks = parseForUser<MockExam>(localStorage.getItem(LOCAL_STORAGE_KEYS.MOCK_EXAMS));
          if (storedMocks) setMockExams(storedMocks);
          const storedInsts = parseForUser<InstitutionExam>(localStorage.getItem(LOCAL_STORAGE_KEYS.INST_EXAMS));
          if (storedInsts) setInstitutionExams(storedInsts);
          const storedPrev = parseForUser<PrevalentTopic>(localStorage.getItem(LOCAL_STORAGE_KEYS.PREVALENT_TOPICS));
          if (storedPrev) setPrevalentTopics(storedPrev);
          const storedErrors = parseForUser<ErrorLog>(localStorage.getItem(LOCAL_STORAGE_KEYS.ERROR_LOGS));
          if (storedErrors) applyErrorLogsUpdate(storedErrors);
          const storedSessions = parseForUser<StudySession>(localStorage.getItem(LOCAL_STORAGE_KEYS.STUDY_SESSIONS));
          if (storedSessions) setStudySessions(storedSessions);
        } catch (storageErr) {
          console.error('Erro ao restaurar dados do localStorage no fallback:', storageErr);
        }
      }
    }
  };

  const resetToDemo = () => {
    const dTopics = getInitialDemoTopics();
    const dReviews = getInitialDemoReviews();
    const dMocks = getInitialDemoMockExams();
    const dInsts = getInitialDemoInstitutionExams();
    const dPrevalent = getInitialDemoPrevalentTopics();
    const dErrors = getInitialDemoErrorLogs();
    const dSessions = getInitialDemoStudySessions();
    const dProf = INITIAL_DEMO_PROFILE;

    applyTopicsUpdate(dTopics);
    applyReviewsUpdate(dReviews);
    setMockExams(dMocks);
    setInstitutionExams(dInsts);
    setPrevalentTopics(dPrevalent);
    applyErrorLogsUpdate(dErrors);
    setStudySessions(dSessions);
    setProfile(dProf);
    setAreas(DEFAULT_STUDY_AREAS);
    setStreakConfig(DEFAULT_STREAK_CONFIG);
    setIsDemoMode(true);

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.TOPICS, JSON.stringify(dTopics));
      localStorage.setItem(LOCAL_STORAGE_KEYS.REVIEWS, JSON.stringify(dReviews));
      localStorage.setItem(LOCAL_STORAGE_KEYS.MOCK_EXAMS, JSON.stringify(dMocks));
      localStorage.setItem(LOCAL_STORAGE_KEYS.INST_EXAMS, JSON.stringify(dInsts));
      localStorage.setItem(LOCAL_STORAGE_KEYS.PREVALENT_TOPICS, JSON.stringify(dPrevalent));
      localStorage.setItem(LOCAL_STORAGE_KEYS.ERROR_LOGS, JSON.stringify(dErrors));
      localStorage.setItem(LOCAL_STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(dSessions));
      localStorage.setItem(LOCAL_STORAGE_KEYS.PROFILE, JSON.stringify(dProf));
      localStorage.setItem(LOCAL_STORAGE_KEYS.AREAS, JSON.stringify(DEFAULT_STUDY_AREAS));
      localStorage.setItem(LOCAL_STORAGE_KEYS.STREAK_CONFIG, JSON.stringify(DEFAULT_STREAK_CONFIG));
      localStorage.setItem(LOCAL_STORAGE_KEYS.DEMO_ACTIVE, 'true');
      document.cookie = 'adaptivemed_demo=true; path=/; max-age=2592000; SameSite=Lax';
    }
  };

  const signInDemo = () => {
    setIsDemoMode(true);
    resetToDemo();
  };

  const signOut = async () => {
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Erro ao sair do Supabase:', err);
    }
    setUser(null);
    setIsDemoMode(false);
    applyTopicsUpdate([]);
    applyReviewsUpdate([]);
    setMockExams([]);
    setInstitutionExams([]);
    setPrevalentTopics([]);
    applyErrorLogsUpdate([]);
    setStudySessions([]);
    setProfile(null);
    setAreas(DEFAULT_STUDY_AREAS);
    setStreakConfig(DEFAULT_STREAK_CONFIG);
    setWorkloadConfig(DEFAULT_WORKLOAD_CONFIG);
    if (typeof window !== 'undefined') {
      document.cookie = 'adaptivemed_demo=; path=/; max-age=0; SameSite=Lax';
      try {
        Object.values(LOCAL_STORAGE_KEYS).forEach(key => {
          localStorage.removeItem(key);
        });
        localStorage.removeItem('adaptivemed_focus_timer_state_v1');
      } catch {}
      window.location.href = '/login';
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    const resolvedUserId = user?.id || 'demo-user-id';
    setProfile(prev => (prev ? { ...prev, ...data } : ({ id: resolvedUserId, ...data } as Profile)));
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          LOCAL_STORAGE_KEYS.PROFILE,
          JSON.stringify({
            ...(profile || (isDemoMode ? INITIAL_DEMO_PROFILE : { id: resolvedUserId })),
            ...data,
          })
        );
      } catch {}
    }

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(supabase.from('profiles').update(data).eq('id', user.id));
    }
  };

  const updateStreakConfig = async (newConfig: StreakConfig) => {
    setStreakConfig(newConfig);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEYS.STREAK_CONFIG, JSON.stringify(newConfig));
      } catch {}
    }
    await updateProfile({ streak_config: newConfig });
  };

  const updateWorkloadConfig = async (newConfig: WorkloadConfig) => {
    const merged: WorkloadConfig = {
      ...newConfig,
      forestGarden: newConfig.forestGarden ?? workloadConfig.forestGarden,
    };
    setWorkloadConfig(merged);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEYS.WORKLOAD_CONFIG, JSON.stringify(merged));
      } catch {}
    }
    await updateProfile({ workload_config: merged });
  };

  const forestGarden = useMemo(
    () => normalizeForestGarden(workloadConfig?.forestGarden, areas.map(a => a.name)),
    [workloadConfig?.forestGarden, areas]
  );

  const updateForestGarden = async (nextGarden: ForestGardenState) => {
    await updateWorkloadConfig({
      ...(workloadConfig || DEFAULT_WORKLOAD_CONFIG),
      forestGarden: nextGarden,
    });
  };

  // Salvar no localStorage de forma contínua
  useEffect(() => {
    if (typeof window !== 'undefined' && (topics.length > 0 || studySessions.length > 0 || errorLogs.length > 0)) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEYS.TOPICS, JSON.stringify(topics));
        localStorage.setItem(LOCAL_STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
        localStorage.setItem(LOCAL_STORAGE_KEYS.MOCK_EXAMS, JSON.stringify(mockExams));
        localStorage.setItem(LOCAL_STORAGE_KEYS.INST_EXAMS, JSON.stringify(institutionExams));
        localStorage.setItem(LOCAL_STORAGE_KEYS.PREVALENT_TOPICS, JSON.stringify(prevalentTopics));
        localStorage.setItem(LOCAL_STORAGE_KEYS.ERROR_LOGS, JSON.stringify(errorLogs));
        localStorage.setItem(LOCAL_STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(studySessions));
      } catch {}
    }
  }, [topics, reviews, mockExams, institutionExams, prevalentTopics, errorLogs, studySessions]);

  // GESTÃO DE GRANDES ÁREAS CUSTOMIZADAS
  const addArea = async (name: string, colorHex: string) => {
    const palette = COLOR_PALETTE.find(c => c.hex === colorHex) || COLOR_PALETTE[0];
    const newArea: StudyArea = {
      id: `area-${Date.now()}`,
      name: name.trim(),
      color: palette.hex,
      bg: palette.bg,
      text: palette.text,
      border: palette.border,
    };
    const updated = [...areas, newArea];
    setAreas(updated);

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AREAS, JSON.stringify(updated));
    }

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(supabase.from('profiles').update({ custom_areas: updated }).eq('id', user.id));
    }
  };

  const reorderAreas = async (newAreas: StudyArea[]) => {
    setAreas(newAreas);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AREAS, JSON.stringify(newAreas));
    }
    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(supabase.from('profiles').update({ custom_areas: newAreas }).eq('id', user.id));
    }
  };

  const updateArea = async (id: string, name: string, colorHex: string) => {
    const palette = COLOR_PALETTE.find(c => c.hex === colorHex) || COLOR_PALETTE[0];
    const oldArea = areas.find(a => a.id === id);
    const oldName = oldArea?.name;
    const newName = name.trim();

    const updated = areas.map(a =>
      a.id === id
        ? {
            ...a,
            name: newName,
            color: palette.hex,
            bg: palette.bg,
            text: palette.text,
            border: palette.border,
          }
        : a
    );
    setAreas(updated);

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AREAS, JSON.stringify(updated));
    }

    let nextWorkloadForProfile: WorkloadConfig | null = null;

    // Se o nome foi alterado, faz o cascade em topics, prevalent_topics, study_sessions e forestGarden
    if (oldName && oldName !== newName) {
      applyTopicsUpdate(
        prev => prev.map(t => (t.area === oldName ? { ...t, area: newName } : t)),
        true
      );

      setPrevalentTopics(prev => {
        const up = prev.map(p => (p.area === oldName ? { ...p, area: newName } : p));
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEYS.PREVALENT_TOPICS, JSON.stringify(up));
        }
        return up;
      });

      setStudySessions(prev => {
        const up = prev.map(s => (s.area === oldName ? { ...s, area: newName } : s));
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(up));
        }
        return up;
      });

      const gardenNeedsUpdate =
        forestGarden.slots.some(slot => slot.area === oldName) ||
        forestGarden.maturedTrees.some(tree => tree.area === oldName);
      if (gardenNeedsUpdate) {
        const updatedGarden: ForestGardenState = {
          ...forestGarden,
          slots: forestGarden.slots.map(slot =>
            slot.area === oldName ? { ...slot, area: newName } : slot
          ) as ForestGardenState['slots'],
          maturedTrees: forestGarden.maturedTrees.map(tree =>
            tree.area === oldName ? { ...tree, area: newName } : tree
          ),
        };
        const mergedWorkload: WorkloadConfig = {
          ...(workloadConfig || DEFAULT_WORKLOAD_CONFIG),
          forestGarden: updatedGarden,
        };
        nextWorkloadForProfile = mergedWorkload;
        setWorkloadConfig(mergedWorkload);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(LOCAL_STORAGE_KEYS.WORKLOAD_CONFIG, JSON.stringify(mergedWorkload));
          } catch {}
        }
      }
    }

    setProfile(prev => {
      if (!prev) return prev;
      const nextProf: Profile = nextWorkloadForProfile
        ? { ...prev, custom_areas: updated, workload_config: nextWorkloadForProfile }
        : { ...prev, custom_areas: updated };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEYS.PROFILE, JSON.stringify(nextProf));
        } catch {}
      }
      return nextProf;
    });

    if (!isDemoMode && user) {
      const supabase = createClient();
      const profilePatch: Record<string, any> = { custom_areas: updated };
      if (nextWorkloadForProfile) {
        profilePatch.workload_config = nextWorkloadForProfile;
      }
      const calls: PromiseLike<any>[] = [
        supabase.from('profiles').update(profilePatch).eq('id', user.id),
      ];
      if (oldName && oldName !== newName) {
        calls.push(
          supabase.from('study_topics').update({ area: newName }).eq('user_id', user.id).eq('area', oldName),
          supabase.from('prevalent_topics').update({ area: newName }).eq('user_id', user.id).eq('area', oldName),
          supabase.from('study_sessions').update({ area: newName }).eq('user_id', user.id).eq('area', oldName)
        );
      }
      syncSupabase(Promise.allSettled(calls));
    }
  };

  const deleteArea = async (id: string) => {
    if (areas.length <= 1) return;
    const targetArea = areas.find(a => a.id === id);
    const updated = areas.filter(a => a.id !== id);
    const fallbackAreaName = updated[0]?.name || 'Geral';

    setAreas(updated);

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AREAS, JSON.stringify(updated));
    }

    let nextWorkloadForProfile: WorkloadConfig | null = null;

    if (targetArea) {
      applyTopicsUpdate(
        prev => prev.map(t => (t.area === targetArea.name ? { ...t, area: fallbackAreaName } : t)),
        true
      );

      setPrevalentTopics(prev => {
        const up = prev.map(p => (p.area === targetArea.name ? { ...p, area: fallbackAreaName } : p));
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEYS.PREVALENT_TOPICS, JSON.stringify(up));
        }
        return up;
      });

      setStudySessions(prev => {
        const up = prev.map(s => (s.area === targetArea.name ? { ...s, area: fallbackAreaName } : s));
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(up));
        }
        return up;
      });

      const gardenNeedsUpdate =
        forestGarden.slots.some(slot => slot.area === targetArea.name) ||
        forestGarden.maturedTrees.some(tree => tree.area === targetArea.name);
      if (gardenNeedsUpdate) {
        const updatedGarden: ForestGardenState = {
          ...forestGarden,
          slots: forestGarden.slots.map(slot =>
            slot.area === targetArea.name ? { ...slot, area: fallbackAreaName } : slot
          ) as ForestGardenState['slots'],
          maturedTrees: forestGarden.maturedTrees.map(tree =>
            tree.area === targetArea.name ? { ...tree, area: fallbackAreaName } : tree
          ),
        };
        const mergedWorkload: WorkloadConfig = {
          ...(workloadConfig || DEFAULT_WORKLOAD_CONFIG),
          forestGarden: updatedGarden,
        };
        nextWorkloadForProfile = mergedWorkload;
        setWorkloadConfig(mergedWorkload);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(LOCAL_STORAGE_KEYS.WORKLOAD_CONFIG, JSON.stringify(mergedWorkload));
          } catch {}
        }
      }
    }

    setProfile(prev => {
      if (!prev) return prev;
      const nextProf: Profile = nextWorkloadForProfile
        ? { ...prev, custom_areas: updated, workload_config: nextWorkloadForProfile }
        : { ...prev, custom_areas: updated };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEYS.PROFILE, JSON.stringify(nextProf));
        } catch {}
      }
      return nextProf;
    });

    if (!isDemoMode && user) {
      const supabase = createClient();
      const profilePatch: Record<string, any> = { custom_areas: updated };
      if (nextWorkloadForProfile) {
        profilePatch.workload_config = nextWorkloadForProfile;
      }
      const calls: PromiseLike<any>[] = [
        supabase.from('profiles').update(profilePatch).eq('id', user.id),
      ];
      if (targetArea) {
        calls.push(
          supabase.from('study_topics').update({ area: fallbackAreaName }).eq('user_id', user.id).eq('area', targetArea.name),
          supabase.from('prevalent_topics').update({ area: fallbackAreaName }).eq('user_id', user.id).eq('area', targetArea.name),
          supabase.from('study_sessions').update({ area: fallbackAreaName }).eq('user_id', user.id).eq('area', targetArea.name)
        );
      }
      syncSupabase(Promise.allSettled(calls));
    }
  };

  const resetDefaultAreas = async () => {
    setAreas(DEFAULT_STUDY_AREAS);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AREAS, JSON.stringify(DEFAULT_STUDY_AREAS));
    }
    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(
        supabase.from('profiles').update({ custom_areas: DEFAULT_STUDY_AREAS }).eq('id', user.id)
      );
    }
  };


  // TAGS / SUBÁREAS ÚNICAS
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    topics.forEach(t => {
      if (t.tags && Array.isArray(t.tags)) {
        t.tags.forEach(tag => {
          if (tag.trim()) tagSet.add(tag.trim());
        });
      }
    });
    return Array.from(tagSet).sort();
  }, [topics]);

  const getPendingErrorCausesForTopic = (
    topicId?: string,
    extraCauses?: ErrorLogCause[]
  ): ErrorLogCause[] => {
    const existing = topicId
      ? errorLogsRef.current.filter(e => e.topic_id === topicId && !e.is_reviewed).map(e => e.cause)
      : [];
    return extraCauses && extraCauses.length > 0 ? [...existing, ...extraCauses] : existing;
  };

  // AÇÃO 1: Adicionar Novo Assunto
  const addTopic = async (data: {
    area: string;
    subject_name: string;
    tags?: string[];
    initial_date: string;
    initial_questions: number;
    initial_correct: number;
    initial_duration_minutes?: number;
    notes?: string;
    errorCauses?: ErrorLogCause[];
  }): Promise<string> => {
    const percentage =
      data.initial_questions > 0
        ? Math.round((data.initial_correct / data.initial_questions) * 1000) / 10
        : 0;

    const topicId = isDemoMode ? `topic-${Date.now()}` : crypto.randomUUID();
    const userId = user?.id || 'demo-user-id';

    const newTopic: StudyTopic = {
      id: topicId,
      user_id: userId,
      area: data.area,
      subject_name: data.subject_name.trim(),
      tags: data.tags || [],
      initial_date: data.initial_date,
      initial_questions: data.initial_questions,
      initial_correct: data.initial_correct,
      initial_percentage: percentage,
      initial_duration_minutes: data.initial_duration_minutes || null,
      notes: data.notes?.trim() || undefined,
      base_questions_count: data.initial_questions,
      created_at: new Date().toISOString(),
    };

    // Calcula o primeiro ciclo de revisão (R1) usando o motor científico FSRS-6
    const reviewCalc = calculateNextReview({
      currentCycle: 0,
      accuracy: percentage,
      baseQuestionsCount: data.initial_questions,
      targetYear: profile?.target_year,
      referenceDate: data.initial_date,
      errorCauses: data.errorCauses,
    });
    const targetR1Date = addDaysToDate(data.initial_date, reviewCalc.nextIntervalDays);

    // Gestão de carga diária e rolagem automática (anti-sobrecarga)
    const scheduledCounts = new Map<string, number>();
    reviewsRef.current.forEach(r => {
      if (!r.completed_date) {
        scheduledCounts.set(r.scheduled_date, (scheduledCounts.get(r.scheduled_date) || 0) + 1);
      }
    });
    const maxDailyLimit = workloadConfig?.maxDailyReviews || 3;
    const r1ScheduledDate = findNextAvailableDate(targetR1Date, scheduledCounts, maxDailyLimit);
    const actualR1Interval = Math.max(1, diffInDays(r1ScheduledDate, data.initial_date));

    const r1Review: TopicReview = {
      id: isDemoMode ? `rev-${Date.now()}-1` : crypto.randomUUID(),
      topic_id: topicId,
      user_id: userId,
      review_number: 1,
      scheduled_date: r1ScheduledDate,
      completed_date: null,
      questions_done: null,
      questions_correct: null,
      percentage: null,
      recommended_questions: reviewCalc.recommendedQuestions,
      previous_interval_days: actualR1Interval,
      diagnosis: reviewCalc.diagnosis,
      diagnosis_badge: reviewCalc.diagnosisBadge,
      pedagogical_note: reviewCalc.pedagogicalNote,
      created_at: new Date().toISOString(),
    };

    // 1. Atualização Otimista Imediata
    applyTopicsUpdate(prev => [newTopic, ...prev], true);
    applyReviewsUpdate(prev => [...prev, r1Review], true);

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(
        (async () => {
          await safeInsertStudyTopic(supabase, newTopic);
          await safeInsertTopicReview(supabase, r1Review);
        })()
      );
    }

    return topicId;
  };


  // AÇÃO 1.1: Adicionar Assunto Planejado para Estudo Futuro (Otimista e Instantâneo)
  const addPlannedTopic = async (data: {
    area: string;
    subject_name: string;
    planned_date?: string;
    tags?: string[];
    is_weekly_goal?: boolean;
    notes?: string;
  }) => {
    const topicId = isDemoMode ? `topic-${Date.now()}` : crypto.randomUUID();
    const userId = user?.id || 'demo-user-id';
    const normalizedPlannedDate = data.planned_date?.trim() || undefined;
    const safeInitialDate = normalizedPlannedDate || getTodayDateString();
    const newTopic: StudyTopic = {
      id: topicId,
      user_id: userId,
      area: data.area,
      subject_name: data.subject_name.trim(),
      tags: data.tags || [],
      initial_date: safeInitialDate,
      planned_date: normalizedPlannedDate,
      initial_questions: 0,
      initial_correct: 0,
      initial_percentage: 0,
      is_planned: true,
      is_weekly_goal: data.is_weekly_goal ?? false,
      notes: data.notes,
      created_at: new Date().toISOString(),
    };

    // 1. Atualização Otimista Imediata (zero latência)
    applyTopicsUpdate(prev => [newTopic, ...prev], true);

    // 2. Sincronização não-bloqueante com Supabase
    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(safeInsertStudyTopic(supabase, newTopic));
    }
  };

  // AÇÃO 1.2: Registrar Estudo de Assunto Planejado (Dispara Algoritmo Adaptativo R1)
  const recordPlannedTopicStudy = async (
    topicId: string,
    data: {
      study_date: string;
      questions_done: number;
      questions_correct: number;
      duration_minutes?: number;
      notes?: string;
      errorCauses?: ErrorLogCause[];
    }
  ): Promise<{ nextReviewDate?: string }> => {
    unmarkTrackPaused(topicId);

    const percentage =
      data.questions_done > 0
        ? Math.round((data.questions_correct / data.questions_done) * 1000) / 10
        : 0;

    const reviewCalc = calculateNextReview({
      currentCycle: 0,
      accuracy: percentage,
      baseQuestionsCount: data.questions_done,
      targetYear: profile?.target_year,
      referenceDate: data.study_date,
      errorCauses: getPendingErrorCausesForTopic(topicId, data.errorCauses),
    });
    const targetR1Date = addDaysToDate(data.study_date, reviewCalc.nextIntervalDays);

    // Gestão de carga diária e rolagem automática (anti-sobrecarga)
    const scheduledCounts = new Map<string, number>();
    reviewsRef.current.forEach(r => {
      if (!r.completed_date) {
        scheduledCounts.set(r.scheduled_date, (scheduledCounts.get(r.scheduled_date) || 0) + 1);
      }
    });
    const maxDailyLimit = workloadConfig?.maxDailyReviews || 3;
    const r1ScheduledDate = findNextAvailableDate(targetR1Date, scheduledCounts, maxDailyLimit);

    const targetTopic = topicsRef.current.find(t => t.id === topicId);
    const userId = user?.id || 'demo-user-id';
    const hasNotesUpdate = data.notes !== undefined;
    const normalizedNotes = hasNotesUpdate ? data.notes!.trim() : undefined;

    const updatedTopic: StudyTopic = targetTopic
      ? {
          ...targetTopic,
          initial_date: data.study_date,
          initial_questions: data.questions_done,
          initial_correct: data.questions_correct,
          initial_percentage: percentage,
          initial_duration_minutes: data.duration_minutes || null,
          notes: hasNotesUpdate ? normalizedNotes : targetTopic.notes,
          base_questions_count: data.questions_done,
          is_planned: false,
        }
      : {
          id: topicId,
          user_id: userId,
          area: 'Clínica Médica',
          subject_name: 'Assunto',
          initial_date: data.study_date,
          initial_questions: data.questions_done,
          initial_correct: data.questions_correct,
          initial_percentage: percentage,
          initial_duration_minutes: data.duration_minutes || null,
          notes: normalizedNotes || undefined,
          base_questions_count: data.questions_done,
          is_planned: false,
          created_at: new Date().toISOString(),
        };

    const r1Review: TopicReview = {
      id: isDemoMode ? `rev-${Date.now()}-1` : crypto.randomUUID(),
      topic_id: topicId,
      user_id: userId,
      review_number: 1,
      scheduled_date: r1ScheduledDate,
      completed_date: null,
      questions_done: null,
      questions_correct: null,
      percentage: null,
      recommended_questions: reviewCalc.recommendedQuestions,
      previous_interval_days: reviewCalc.nextIntervalDays,
      diagnosis: reviewCalc.diagnosis,
      diagnosis_badge: reviewCalc.diagnosisBadge,
      pedagogical_note: reviewCalc.pedagogicalNote,
      created_at: new Date().toISOString(),
    };

    // Atualização otimista imediata
    applyTopicsUpdate(prev => prev.map(t => (t.id === topicId ? updatedTopic : t)), true);
    applyReviewsUpdate(prev => [...prev, r1Review], true);

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(
        (async () => {
          const updatePayload: Partial<StudyTopic> = {
            initial_date: data.study_date,
            initial_questions: data.questions_done,
            initial_correct: data.questions_correct,
            initial_percentage: percentage,
            initial_duration_minutes: data.duration_minutes || null,
            base_questions_count: data.questions_done,
            is_planned: false,
          };
          if (hasNotesUpdate) {
            updatePayload.notes = normalizedNotes;
          }
          await safeUpdateStudyTopic(supabase, topicId, updatePayload);
          await safeInsertTopicReview(supabase, r1Review);
        })()
      );
    }

    return { nextReviewDate: r1ScheduledDate };
  };

  // AÇÃO 1.2b: Editar Conteúdo / Tópico de Estudo (nome, área, tags, data prevista, notas)
  const updateTopic = async (topicId: string, data: Partial<StudyTopic>) => {
    applyTopicsUpdate(prev => prev.map(t => (t.id === topicId ? { ...t, ...data } : t)), true);

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(safeUpdateStudyTopic(supabase, topicId, data));
    }
  };

  // AÇÃO 1.2c: Atualizar Rendimento do Primeiro Contato (R0) e Dados do Assunto (Área, Anotações, etc)
  const updateTopicR0 = async (
    topicId: string,
    questionsDone: number,
    questionsCorrect: number,
    initialDate?: string,
    durationMinutes?: number | null,
    extraTopicData?: Partial<StudyTopic>,
    errorCauses?: ErrorLogCause[]
  ) => {
    const targetTopic = topicsRef.current.find(t => t.id === topicId);
    if (!targetTopic) return;

    const percentage =
      questionsDone > 0 ? Math.round((questionsCorrect / questionsDone) * 1000) / 10 : 0;
    const finalInitialDate = initialDate || extraTopicData?.initial_date || targetTopic.initial_date;

    const updatedTopic: StudyTopic = {
      ...targetTopic,
      ...(extraTopicData || {}),
      initial_questions: questionsDone,
      initial_correct: questionsCorrect,
      initial_percentage: percentage,
      base_questions_count: questionsDone,
      initial_date: finalInitialDate,
      initial_duration_minutes: durationMinutes !== undefined ? durationMinutes : targetTopic.initial_duration_minutes,
    };

    // Se R1 ainda não foi concluído, recalcula os parâmetros de agendamento de R1
    let updatedR1: TopicReview | null = null;
    const r1Review = reviewsRef.current.find(r => r.topic_id === topicId && r.review_number === 1);
    if (r1Review && !r1Review.completed_date) {
      const reviewCalc = calculateNextReview({
        currentCycle: 0,
        accuracy: percentage,
        baseQuestionsCount: questionsDone,
        targetYear: profile?.target_year,
        referenceDate: finalInitialDate,
        errorCauses: getPendingErrorCausesForTopic(topicId, errorCauses),
      });
      const targetR1Date = addDaysToDate(finalInitialDate, reviewCalc.nextIntervalDays);

      const scheduledCounts = new Map<string, number>();
      reviewsRef.current.forEach(r => {
        if (!r.completed_date && r.id !== r1Review.id) {
          scheduledCounts.set(r.scheduled_date, (scheduledCounts.get(r.scheduled_date) || 0) + 1);
        }
      });
      const maxDailyLimit = workloadConfig?.maxDailyReviews || 3;
      const newScheduledDate = findNextAvailableDate(targetR1Date, scheduledCounts, maxDailyLimit);
      const actualR1Interval = Math.max(1, diffInDays(newScheduledDate, finalInitialDate));

      updatedR1 = {
        ...r1Review,
        scheduled_date: newScheduledDate,
        recommended_questions: reviewCalc.recommendedQuestions,
        previous_interval_days: actualR1Interval,
        diagnosis: reviewCalc.diagnosis,
        diagnosis_badge: reviewCalc.diagnosisBadge,
        pedagogical_note: reviewCalc.pedagogicalNote,
      };
    }

    applyTopicsUpdate(prev => prev.map(t => (t.id === topicId ? updatedTopic : t)), true);

    if (updatedR1) {
      applyReviewsUpdate(prev => prev.map(r => (r.id === updatedR1!.id ? updatedR1! : r)), true);
    }

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(
        (async () => {
          await safeUpdateStudyTopic(supabase, topicId, {
            ...(extraTopicData || {}),
            initial_questions: questionsDone,
            initial_correct: questionsCorrect,
            initial_percentage: percentage,
            base_questions_count: questionsDone,
            initial_date: finalInitialDate,
            initial_duration_minutes: durationMinutes !== undefined ? durationMinutes : targetTopic.initial_duration_minutes,
          });
          if (updatedR1) {
            await safeUpdateTopicReview(supabase, updatedR1.id, {
              scheduled_date: updatedR1.scheduled_date,
              recommended_questions: updatedR1.recommended_questions,
              previous_interval_days: updatedR1.previous_interval_days,
              diagnosis: updatedR1.diagnosis,
              diagnosis_badge: updatedR1.diagnosis_badge,
              pedagogical_note: updatedR1.pedagogical_note,
            });
          }
        })()
      );
    }
  };


  // AÇÃO 1.3: Alternar se assunto é meta da semana
  const updateTopicWeeklyGoal = async (topicId: string, is_weekly_goal: boolean) => {
    applyTopicsUpdate(
      prev => prev.map(t => (t.id === topicId ? { ...t, is_weekly_goal } : t)),
      true
    );
    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(supabase.from('study_topics').update({ is_weekly_goal }).eq('id', topicId));
    }
  };

  // AÇÃO 1.4: Mover / Agendar / Desagendar assunto planejado (Drag & Drop e Remoção do Calendário)
  const updatePlannedTopicDate = async (topicId: string, planned_date: string | null) => {
    const normalizedPlannedDate = planned_date?.trim() || null;
    const safeInitialDate = normalizedPlannedDate || getTodayDateString();
    applyTopicsUpdate(
      prev =>
        prev.map(t =>
          t.id === topicId
            ? {
                ...t,
                planned_date: normalizedPlannedDate || undefined,
                is_planned: true,
                initial_date: safeInitialDate,
              }
            : t
        ),
      true
    );

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(
        supabase
          .from('study_topics')
          .update({
            planned_date: normalizedPlannedDate,
            is_planned: true,
            initial_date: safeInitialDate,
          })
          .eq('id', topicId)
      );
    }
  };

  // AÇÃO 1.4b: Reprogramar Data de uma Revisão Agendada/Atrasada no Calendário
  const rescheduleReview = async (reviewId: string, newScheduledDate: string) => {
    applyReviewsUpdate(
      prev =>
        prev.map(r =>
          r.id === reviewId
            ? {
                ...r,
                scheduled_date: newScheduledDate,
              }
            : r
        ),
      true
    );

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(
        supabase
          .from('topic_reviews')
          .update({ scheduled_date: newScheduledDate })
          .eq('id', reviewId)
      );
    }
  };

  // AÇÃO 1.4c: Rebalanceamento em 1 Clique das Revisões Atrasadas respeitando cota diária
  const rebalanceOverdueReviews = async (): Promise<number> => {
    const maxDailyLimit = workloadConfig?.maxDailyReviews || 3;
    const updates = computeRebalancedSchedule(reviewsRef.current, maxDailyLimit, getTodayDateString());

    if (updates.length === 0) return 0;

    const updateMap = new Map<string, string>();
    updates.forEach(u => updateMap.set(u.reviewId, u.newScheduledDate));

    applyReviewsUpdate(
      prev =>
        prev.map(r => {
          const newDate = updateMap.get(r.id);
          return newDate ? { ...r, scheduled_date: newDate } : r;
        }),
      true
    );

    if (!isDemoMode && user) {
      const supabase = createClient();
      const calls = updates.map(u =>
        supabase
          .from('topic_reviews')
          .update({ scheduled_date: u.newScheduledDate })
          .eq('id', u.reviewId)
      );
      syncSupabase(Promise.allSettled(calls));
    }

    return updates.length;
  };

  // AÇÃO 1.5: Distribuir Automaticamente os Assuntos da Semana (Auto-Estudo)
  const distributeWeeklyAutoStudy = async (weekStartStr: string): Promise<number> => {
    const weekDays: string[] = [];
    for (let i = 0; i < 5; i++) {
      weekDays.push(addDaysToDate(weekStartStr, i));
    }

    // Assuntos pendentes de agendamento: is_planned = true e (sem data ou de semanas passadas)
    const pendingTopics = topicsRef.current.filter(
      t => t.is_planned && (!t.planned_date || t.planned_date < weekStartStr)
    );

    if (pendingTopics.length === 0) return 0;

    // Prioriza por prevalência da banca (ALTA -> MEDIA -> BAIXA -> outros)
    const sorted = [...pendingTopics].sort((a, b) => {
      const prevA = prevalentTopics.find(
        p => p.subject_name.toLowerCase() === a.subject_name.toLowerCase()
      );
      const prevB = prevalentTopics.find(
        p => p.subject_name.toLowerCase() === b.subject_name.toLowerCase()
      );
      const score = (p?: PrevalentTopic) => {
        if (!p) return 0;
        if (p.prevalence_level === 'ALTA') return 3;
        if (p.prevalence_level === 'MEDIA') return 2;
        return 1;
      };
      return score(prevB) - score(prevA);
    });

    const topicDateMap = new Map<string, string>();
    sorted.forEach((topic, idx) => {
      const targetDay = weekDays[idx % weekDays.length];
      topicDateMap.set(topic.id, targetDay);
    });

    applyTopicsUpdate(
      prev =>
        prev.map(t => {
          const newDate = topicDateMap.get(t.id);
          return newDate ? { ...t, planned_date: newDate, initial_date: newDate } : t;
        }),
      true
    );

    if (!isDemoMode && user) {
      const supabase = createClient();
      const updates = Array.from(topicDateMap.entries()).map(([id, date]) =>
        supabase.from('study_topics').update({ planned_date: date, initial_date: date }).eq('id', id)
      );
      syncSupabase(Promise.allSettled(updates));
    }

    return sorted.length;
  };

  // AÇÃO 2: Concluir Revisão e Agendar Próximo Ciclo (Adaptativo Científico)
  const completeReview = async (
    reviewId: string,
    questionsDone: number,
    questionsCorrect: number,
    durationMinutes?: number,
    errorCauses?: ErrorLogCause[]
  ): Promise<{ nextReviewDate?: string }> => {
    const today = getTodayDateString();
    const percentage =
      questionsDone > 0 ? Math.round((questionsCorrect / questionsDone) * 1000) / 10 : 0;

    const currentReview = reviewsRef.current.find(r => r.id === reviewId);
    if (!currentReview) throw new Error('Revisão não encontrada');

    const targetTopic = topicsRef.current.find(t => t.id === currentReview.topic_id);
    const baseQuestions = targetTopic?.base_questions_count || targetTopic?.initial_questions || 20;

    // Tempo real decorrido desde o último contato/revisão concluída
    const priorCompleted = reviewsRef.current
      .filter(
        r =>
          r.topic_id === currentReview.topic_id &&
          r.completed_date &&
          r.review_number < currentReview.review_number
      )
      .sort((a, b) => a.review_number - b.review_number);

    const lastActivityDate =
      priorCompleted.length > 0
        ? priorCompleted[priorCompleted.length - 1].completed_date!
        : targetTopic?.initial_date;

    const actualElapsedDays = lastActivityDate
      ? Math.max(1, diffInDays(today, lastActivityDate))
      : currentReview.previous_interval_days || 7;

    let prevInterval = currentReview.previous_interval_days;
    if (!prevInterval && targetTopic?.initial_date) {
      prevInterval = Math.max(1, diffInDays(currentReview.scheduled_date, targetTopic.initial_date));
    }
    if (!prevInterval) prevInterval = actualElapsedDays;

    // Reconstrói histórico real para o estado FSRS-6
    const reviewHistory: Array<{ date: string; accuracy: number }> = [];
    if (targetTopic?.initial_date) {
      reviewHistory.push({
        date: targetTopic.initial_date,
        accuracy: targetTopic.initial_percentage ?? 75,
      });
    }
    priorCompleted.forEach(pr => {
      if (pr.completed_date && pr.percentage !== null && pr.percentage !== undefined) {
        reviewHistory.push({ date: pr.completed_date, accuracy: pr.percentage });
      }
    });

    const reviewCalc = calculateNextReview({
      currentCycle: currentReview.review_number,
      accuracy: percentage,
      baseQuestionsCount: baseQuestions,
      previousIntervalDays: prevInterval,
      actualElapsedDays,
      targetYear: profile?.target_year,
      reviewHistory,
      referenceDate: today,
      errorCauses: getPendingErrorCausesForTopic(currentReview.topic_id, errorCauses),
    });

    const updatedReview: TopicReview = {
      ...currentReview,
      completed_date: today,
      questions_done: questionsDone,
      questions_correct: questionsCorrect,
      percentage,
      duration_minutes: durationMinutes || null,
      diagnosis: reviewCalc.diagnosis,
      diagnosis_badge: reviewCalc.diagnosisBadge,
      pedagogical_note: reviewCalc.pedagogicalNote,
    };

    let nextReviewObj: TopicReview | null = null;
    let nextScheduledDate: string | undefined = undefined;

    // Se o próximo ciclo for <= 8 e a revisão atual < 8, agenda o próximo ciclo (sem colisão)
    if (reviewCalc.nextCycle <= 8 && currentReview.review_number < 8) {
      const targetNextDate = addDaysToDate(today, reviewCalc.nextIntervalDays);

      // Gestão de carga diária e rolagem automática (anti-sobrecarga)
      const scheduledCounts = new Map<string, number>();
      reviewsRef.current.forEach(r => {
        if (!r.completed_date && r.id !== reviewId) {
          scheduledCounts.set(r.scheduled_date, (scheduledCounts.get(r.scheduled_date) || 0) + 1);
        }
      });
      const maxDailyLimit = workloadConfig?.maxDailyReviews || 3;
      nextScheduledDate = findNextAvailableDate(targetNextDate, scheduledCounts, maxDailyLimit);
      const actualScheduledInterval = Math.max(1, diffInDays(nextScheduledDate, today));

      nextReviewObj = {
        id: isDemoMode ? `rev-${Date.now()}-${reviewCalc.nextCycle}` : crypto.randomUUID(),
        topic_id: currentReview.topic_id,
        user_id: currentReview.user_id,
        review_number: reviewCalc.nextCycle,
        scheduled_date: nextScheduledDate,
        completed_date: null,
        questions_done: null,
        questions_correct: null,
        percentage: null,
        recommended_questions: reviewCalc.recommendedQuestions,
        previous_interval_days: actualScheduledInterval,
        diagnosis: reviewCalc.diagnosis,
        diagnosis_badge: reviewCalc.diagnosisBadge,
        pedagogical_note: reviewCalc.pedagogicalNote,
        created_at: new Date().toISOString(),
      };
    }

    applyReviewsUpdate(prev => {
      const updated = prev.map(r => (r.id === reviewId ? updatedReview : r));
      return nextReviewObj ? [...updated, nextReviewObj] : updated;
    }, true);

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(
        (async () => {
          await safeUpdateTopicReview(supabase, reviewId, {
            completed_date: today,
            questions_done: questionsDone,
            questions_correct: questionsCorrect,
            percentage,
            duration_minutes: durationMinutes || null,
            diagnosis: reviewCalc.diagnosis,
            diagnosis_badge: reviewCalc.diagnosisBadge,
            pedagogical_note: reviewCalc.pedagogicalNote,
          });
          if (nextReviewObj) {
            await safeInsertTopicReview(supabase, nextReviewObj);
          }
        })()
      );
    }

    return { nextReviewDate: nextScheduledDate };
  };

  // AÇÃO 2b: Atualizar Revisão já Concluída (Edição de Questões/Acertos em R1 a R8)
  const updateCompletedReview = async (
    reviewId: string,
    questionsDone: number,
    questionsCorrect: number,
    completedDate?: string,
    durationMinutes?: number | null,
    errorCauses?: ErrorLogCause[]
  ) => {
    const targetRev = reviewsRef.current.find(r => r.id === reviewId);
    if (!targetRev) return;

    const percentage =
      questionsDone > 0 ? Math.round((questionsCorrect / questionsDone) * 1000) / 10 : 0;
    const finalDate = completedDate || targetRev.completed_date || getTodayDateString();
    const resolvedDuration =
      durationMinutes !== undefined ? durationMinutes : targetRev.duration_minutes ?? null;

    const targetTopic = topicsRef.current.find(t => t.id === targetRev.topic_id);
    const baseQuestions = targetTopic?.base_questions_count || questionsDone || 20;
    const prevInterval = targetRev.previous_interval_days || 7;

    const priorCompleted = reviewsRef.current
      .filter(
        r =>
          r.topic_id === targetRev.topic_id &&
          r.completed_date &&
          r.review_number < targetRev.review_number
      )
      .sort((a, b) => a.review_number - b.review_number);

    const lastActivityDate =
      priorCompleted.length > 0
        ? priorCompleted[priorCompleted.length - 1].completed_date!
        : targetTopic?.initial_date;

    const actualElapsedDays = lastActivityDate
      ? Math.max(1, diffInDays(finalDate, lastActivityDate))
      : prevInterval;

    const reviewHistory: Array<{ date: string; accuracy: number }> = [];
    if (targetTopic?.initial_date) {
      reviewHistory.push({
        date: targetTopic.initial_date,
        accuracy: targetTopic.initial_percentage ?? 75,
      });
    }
    priorCompleted.forEach(pr => {
      if (pr.completed_date && pr.percentage !== null && pr.percentage !== undefined) {
        reviewHistory.push({ date: pr.completed_date, accuracy: pr.percentage });
      }
    });

    const reviewCalc = calculateNextReview({
      currentCycle: targetRev.review_number,
      accuracy: percentage,
      baseQuestionsCount: baseQuestions,
      previousIntervalDays: prevInterval,
      actualElapsedDays,
      targetYear: profile?.target_year,
      reviewHistory,
      referenceDate: finalDate,
      errorCauses: getPendingErrorCausesForTopic(targetRev.topic_id, errorCauses),
    });

    const updatedReview: TopicReview = {
      ...targetRev,
      questions_done: questionsDone,
      questions_correct: questionsCorrect,
      percentage,
      completed_date: finalDate,
      duration_minutes: resolvedDuration,
      diagnosis: reviewCalc.diagnosis,
      diagnosis_badge: reviewCalc.diagnosisBadge,
      pedagogical_note: reviewCalc.pedagogicalNote,
    };

    // Se a próxima revisão existir e não estiver concluída, recalcula seus parâmetros de agendamento
    let updatedNextRev: TopicReview | null = null;
    if (targetRev.review_number < 8) {
      const nextRev = reviewsRef.current.find(
        r => r.topic_id === targetRev.topic_id && r.review_number === targetRev.review_number + 1
      );
      if (nextRev && !nextRev.completed_date) {
        const targetNextDate = addDaysToDate(finalDate, reviewCalc.nextIntervalDays);
        const scheduledCounts = new Map<string, number>();
        reviewsRef.current.forEach(r => {
          if (!r.completed_date && r.id !== nextRev.id) {
            scheduledCounts.set(r.scheduled_date, (scheduledCounts.get(r.scheduled_date) || 0) + 1);
          }
        });
        const maxDailyLimit = workloadConfig?.maxDailyReviews || 3;
        const newScheduledDate = findNextAvailableDate(targetNextDate, scheduledCounts, maxDailyLimit);
        const actualScheduledInterval = Math.max(1, diffInDays(newScheduledDate, finalDate));

        updatedNextRev = {
          ...nextRev,
          scheduled_date: newScheduledDate,
          recommended_questions: reviewCalc.recommendedQuestions,
          previous_interval_days: actualScheduledInterval,
          diagnosis: reviewCalc.diagnosis,
          diagnosis_badge: reviewCalc.diagnosisBadge,
          pedagogical_note: reviewCalc.pedagogicalNote,
        };
      }
    }

    applyReviewsUpdate(
      prev =>
        prev.map(r => {
          if (r.id === reviewId) return updatedReview;
          if (updatedNextRev && r.id === updatedNextRev.id) return updatedNextRev;
          return r;
        }),
      true
    );

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(
        (async () => {
          await safeUpdateTopicReview(supabase, reviewId, {
            questions_done: questionsDone,
            questions_correct: questionsCorrect,
            percentage,
            completed_date: finalDate,
            duration_minutes: resolvedDuration,
            diagnosis: reviewCalc.diagnosis,
            diagnosis_badge: reviewCalc.diagnosisBadge,
            pedagogical_note: reviewCalc.pedagogicalNote,
          });
          if (updatedNextRev) {
            await safeUpdateTopicReview(supabase, updatedNextRev.id, {
              scheduled_date: updatedNextRev.scheduled_date,
              recommended_questions: updatedNextRev.recommended_questions,
              previous_interval_days: updatedNextRev.previous_interval_days,
              diagnosis: updatedNextRev.diagnosis,
              diagnosis_badge: updatedNextRev.diagnosis_badge,
              pedagogical_note: updatedNextRev.pedagogical_note,
            });
          }
        })()
      );
    }
  };

  // AÇÃO 3: Excluir Assunto e suas Revisões
  const deleteTopic = async (topicId: string) => {
    unmarkTrackPaused(topicId);
    applyTopicsUpdate(prev => prev.filter(t => t.id !== topicId), true);
    applyReviewsUpdate(prev => prev.filter(r => r.topic_id !== topicId), true);
    applyErrorLogsUpdate(prev => prev.filter(e => e.topic_id !== topicId), true);

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(supabase.from('study_topics').delete().eq('id', topicId));
    }
  };

  // AÇÃO 3b: Excluir um ciclo de revisão e os posteriores (mantém R0 e ciclos anteriores)
  const deleteReviewsFromCycle = async (topicId: string, fromReviewNumber: number) => {
    if (fromReviewNumber <= 1) {
      markTrackPaused(topicId);
    }
    applyReviewsUpdate(
      prev => prev.filter(r => !(r.topic_id === topicId && r.review_number >= fromReviewNumber)),
      true
    );

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(
        supabase
          .from('topic_reviews')
          .delete()
          .eq('topic_id', topicId)
          .gte('review_number', fromReviewNumber)
      );
    }
  };

  // AÇÃO 3c: Recalcular e reativar trilha de revisões a partir do último estágio concluído
  const recalculateTopicReviews = async (topicId: string) => {
    unmarkTrackPaused(topicId);
    const targetTopic = topicsRef.current.find(t => t.id === topicId);
    if (!targetTopic) return;

    const topicRevs = reviewsRef.current.filter(r => r.topic_id === topicId);
    const completedRevs = topicRevs
      .filter(r => Boolean(r.completed_date))
      .sort((a, b) => a.review_number - b.review_number);

    let nextCycleNum = 1;
    let baseAccuracy = targetTopic.initial_percentage ?? 80;
    const baseQuestions = targetTopic.base_questions_count || targetTopic.initial_questions || 20;
    let prevInterval = 7;

    if (completedRevs.length > 0) {
      const lastCompleted = completedRevs[completedRevs.length - 1];
      nextCycleNum = lastCompleted.review_number + 1;
      baseAccuracy = lastCompleted.percentage != null ? lastCompleted.percentage : 80;
      prevInterval = lastCompleted.previous_interval_days || 7;
    }

    if (nextCycleNum > 8) return;

    const reviewCalc = calculateNextReview({
      currentCycle: nextCycleNum - 1,
      accuracy: baseAccuracy,
      baseQuestionsCount: baseQuestions,
      previousIntervalDays: prevInterval,
      actualElapsedDays: prevInterval,
      targetYear: profile?.target_year,
      errorCauses: getPendingErrorCausesForTopic(topicId),
    });

    const today = getTodayDateString();
    const targetDate = addDaysToDate(today, reviewCalc.nextIntervalDays);

    const scheduledCounts = new Map<string, number>();
    reviewsRef.current.forEach(r => {
      if (!r.completed_date && !(r.topic_id === topicId && r.review_number >= nextCycleNum)) {
        scheduledCounts.set(r.scheduled_date, (scheduledCounts.get(r.scheduled_date) || 0) + 1);
      }
    });
    const maxDailyLimit = workloadConfig?.maxDailyReviews || 3;
    const newScheduledDate = findNextAvailableDate(targetDate, scheduledCounts, maxDailyLimit);
    const actualScheduledInterval = Math.max(1, diffInDays(newScheduledDate, today));

    const newReview: TopicReview = {
      id: isDemoMode ? `rev-${Date.now()}` : crypto.randomUUID(),
      topic_id: topicId,
      user_id: user?.id || 'demo-user-id',
      review_number: nextCycleNum,
      scheduled_date: newScheduledDate,
      completed_date: null,
      questions_done: null,
      questions_correct: null,
      percentage: null,
      duration_minutes: null,
      recommended_questions: reviewCalc.recommendedQuestions,
      previous_interval_days: actualScheduledInterval,
      diagnosis: reviewCalc.diagnosis,
      diagnosis_badge: reviewCalc.diagnosisBadge,
      pedagogical_note: reviewCalc.pedagogicalNote,
      created_at: new Date().toISOString(),
    };

    applyReviewsUpdate(prev => {
      const filtered = prev.filter(r => !(r.topic_id === topicId && r.review_number >= nextCycleNum));
      return [...filtered, newReview];
    }, true);

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(
        (async () => {
          try {
            const { error: deleteError } = await supabase
              .from('topic_reviews')
              .delete()
              .eq('topic_id', topicId)
              .gte('review_number', nextCycleNum);
            if (deleteError) {
              console.warn(
                'Aviso ao remover revisões futuras antes do recálculo no Supabase:',
                deleteError
              );
            }
          } catch (deleteErr) {
            console.warn('Exceção ao remover revisões futuras antes do recálculo:', deleteErr);
          }
          await safeInsertTopicReview(supabase, newReview);
        })()
      );
    }
  };

  // AÇÃO 4: Adicionar Simulado Geral
  const addMockExam = async (data: {
    exam_name: string;
    exam_date: string;
    total_questions: number;
    correct_answers: number;
  }) => {
    const percentage =
      data.total_questions > 0
        ? Math.round((data.correct_answers / data.total_questions) * 1000) / 10
        : 0;

    const newMock: MockExam = {
      id: isDemoMode ? `mock-${Date.now()}` : crypto.randomUUID(),
      user_id: user?.id || 'demo-user-id',
      exam_name: data.exam_name.trim(),
      exam_date: data.exam_date,
      total_questions: data.total_questions,
      correct_answers: data.correct_answers,
      score_percentage: percentage,
      created_at: new Date().toISOString(),
    };

    setMockExams(prev => {
      const up = [newMock, ...prev];
      if (typeof window !== 'undefined') localStorage.setItem(LOCAL_STORAGE_KEYS.MOCK_EXAMS, JSON.stringify(up));
      return up;
    });

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(supabase.from('mock_exams').insert(newMock));
    }
  };

  const deleteMockExam = async (examId: string) => {
    setMockExams(prev => {
      const up = prev.filter(m => m.id !== examId);
      if (typeof window !== 'undefined') localStorage.setItem(LOCAL_STORAGE_KEYS.MOCK_EXAMS, JSON.stringify(up));
      return up;
    });

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(supabase.from('mock_exams').delete().eq('id', examId));
    }
  };

  // AÇÃO 5: Adicionar Prova por Instituição
  const addInstitutionExam = async (data: {
    institution_name: string;
    exam_year: string | number;
    score_percentage: number;
  }) => {
    const newInst: InstitutionExam = {
      id: isDemoMode ? `inst-${Date.now()}` : crypto.randomUUID(),
      user_id: user?.id || 'demo-user-id',
      institution_name: data.institution_name.trim().toUpperCase(),
      exam_year: data.exam_year,
      score_percentage: Math.round(data.score_percentage * 10) / 10,
      created_at: new Date().toISOString(),
    };

    setInstitutionExams(prev => {
      const up = [...prev, newInst];
      if (typeof window !== 'undefined') localStorage.setItem(LOCAL_STORAGE_KEYS.INST_EXAMS, JSON.stringify(up));
      return up;
    });

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(supabase.from('institution_exams').insert(newInst));
    }
  };

  const deleteInstitutionExam = async (examId: string) => {
    setInstitutionExams(prev => {
      const up = prev.filter(i => i.id !== examId);
      if (typeof window !== 'undefined') localStorage.setItem(LOCAL_STORAGE_KEYS.INST_EXAMS, JSON.stringify(up));
      return up;
    });

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(supabase.from('institution_exams').delete().eq('id', examId));
    }
  };


  // AÇÃO 6: Gestão de Assuntos Prevalentes da Banca
  const addPrevalentTopic = async (
    data: Omit<PrevalentTopic, 'id' | 'created_at'>
  ): Promise<string> => {
    const newId = isDemoMode ? `prev-${Date.now()}` : crypto.randomUUID();
    const newPrev: PrevalentTopic = {
      id: newId,
      user_id: user?.id || 'demo-user-id',
      ...data,
      created_at: new Date().toISOString(),
    };
    setPrevalentTopics(prev => {
      const updated = [...prev, newPrev];
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEYS.PREVALENT_TOPICS, JSON.stringify(updated));
      }
      return updated;
    });
    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(supabase.from('prevalent_topics').insert(newPrev));
    }
    return newId;
  };

  const updatePrevalentTopic = async (id: string, data: Partial<PrevalentTopic>) => {
    setPrevalentTopics(prev => {
      const updated = prev.map(p => (p.id === id ? { ...p, ...data } : p));
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEYS.PREVALENT_TOPICS, JSON.stringify(updated));
      }
      return updated;
    });
    if (!isDemoMode && user) {
      const supabase = createClient();
      const dbPayload: Record<string, unknown> = { ...data };
      if ('banca' in data && data.banca === undefined) {
        dbPayload.banca = null;
      }
      if ('frequency_notes' in data && data.frequency_notes === undefined) {
        dbPayload.frequency_notes = null;
      }
      syncSupabase(supabase.from('prevalent_topics').update(dbPayload).eq('id', id));
    }
  };

  const deletePrevalentTopic = async (id: string) => {
    setPrevalentTopics(prev => {
      const updated = prev.filter(p => p.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEYS.PREVALENT_TOPICS, JSON.stringify(updated));
      }
      return updated;
    });
    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(supabase.from('prevalent_topics').delete().eq('id', id));
    }
  };

  const reorderPrevalentTopics = async (orderedIds: string[]) => {
    const rankMap = new Map<string, number>();
    orderedIds.forEach((id, index) => rankMap.set(id, index + 1));

    setPrevalentTopics(prev => {
      const updated = prev
        .map(p => {
          const newRank = rankMap.get(p.id);
          return newRank !== undefined ? { ...p, rank_order: newRank } : p;
        })
        .sort((a, b) => a.rank_order - b.rank_order);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEYS.PREVALENT_TOPICS, JSON.stringify(updated));
      }
      return updated;
    });

    if (!isDemoMode && user) {
      const supabase = createClient();
      const updates = Array.from(rankMap.entries()).map(([id, rank_order]) =>
        supabase.from('prevalent_topics').update({ rank_order }).eq('id', id)
      );
      syncSupabase(Promise.allSettled(updates));
    }
  };

  // AÇÃO 7: Caderno de Erros Estruturado (error_logs)
  const addErrorLog = async (data: {
    topic_id: string;
    review_id?: string | null;
    cause: ErrorLogCause;
    concept_summary: string;
    question_ref?: string;
  }) => {
    const newError: ErrorLog = {
      id: isDemoMode ? `err-${Date.now()}` : crypto.randomUUID(),
      user_id: user?.id || 'demo-user-id',
      topic_id: data.topic_id,
      review_id: data.review_id || null,
      cause: data.cause,
      concept_summary: data.concept_summary.trim(),
      question_ref: data.question_ref?.trim() || null,
      is_reviewed: false,
      created_at: new Date().toISOString(),
    };

    applyErrorLogsUpdate(prev => [newError, ...prev], true);

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(supabase.from('error_logs').insert(newError));
    }
  };

  const toggleErrorLogReviewed = async (id: string, is_reviewed?: boolean) => {
    const target = errorLogsRef.current.find(e => e.id === id);
    if (!target) return;
    const nextValue = is_reviewed !== undefined ? is_reviewed : !target.is_reviewed;

    applyErrorLogsUpdate(
      prev => prev.map(e => (e.id === id ? { ...e, is_reviewed: nextValue } : e)),
      true
    );

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(supabase.from('error_logs').update({ is_reviewed: nextValue }).eq('id', id));
    }
  };

  const updateErrorLog = async (id: string, data: Partial<ErrorLog>) => {
    applyErrorLogsUpdate(
      prev => prev.map(e => (e.id === id ? { ...e, ...data } : e)),
      true
    );

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(supabase.from('error_logs').update(data).eq('id', id));
    }
  };

  const deleteErrorLog = async (id: string) => {
    applyErrorLogsUpdate(prev => prev.filter(e => e.id !== id), true);

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(supabase.from('error_logs').delete().eq('id', id));
    }
  };

  // AÇÃO 8: Sessões de Estudo Cronometradas & Floresta (study_sessions)
  const addStudySession = async (
    data: Omit<StudySession, 'id' | 'user_id' | 'created_at'>
  ) => {
    const newSession: StudySession = {
      id: isDemoMode ? `sess-${Date.now()}` : crypto.randomUUID(),
      user_id: user?.id || 'demo-user-id',
      topic_id: data.topic_id || null,
      area: data.area,
      subject_name: data.subject_name || null,
      mode: data.mode,
      status: data.status,
      duration_seconds: Math.max(0, Math.round(data.duration_seconds)),
      planned_seconds: data.planned_seconds ?? null,
      trees_earned: Math.max(0, Math.round(data.trees_earned)),
      session_date: data.session_date,
      started_at: data.started_at,
      ended_at: data.ended_at,
      created_at: new Date().toISOString(),
    };

    setStudySessions(prev => {
      const updated = [newSession, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(updated));
      }
      return updated;
    });

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(supabase.from('study_sessions').insert(newSession));
    }

    return newSession;
  };

  const deleteStudySession = async (id: string) => {
    setStudySessions(prev => {
      const updated = prev.filter(s => s.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(updated));
      }
      return updated;
    });

    if (forestGarden.maturedTrees.some(t => t.sessionId === id)) {
      await updateForestGarden({
        ...forestGarden,
        maturedTrees: forestGarden.maturedTrees.filter(t => t.sessionId !== id),
      });
    }

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(supabase.from('study_sessions').delete().eq('id', id));
    }
  };

  // Estatísticas Dinâmicas Computadas
  const stats = useMemo<UserStats>(() => {
    const today = getTodayDateString();

    // 1. Revisões de Hoje e Gestão de Carga Diária
    const todayScheduled = reviews.filter(
      r => !r.completed_date && r.scheduled_date === today
    );
    const overduePending = reviews.filter(
      r => !r.completed_date && r.scheduled_date < today
    );
    const maxOverdueQuota = workloadConfig?.maxDailyOverdue ?? 2;
    const prioritizedOverdueCount = Math.min(overduePending.length, maxOverdueQuota);
    const backlogOverdueCount = Math.max(0, overduePending.length - maxOverdueQuota);

    // Fila prioritária de hoje = agendadas hoje + atrasadas prioritárias (cota)
    const todayPriorityQueueCount = todayScheduled.length + prioritizedOverdueCount;
    const todayReviewsCount = todayScheduled.length + overduePending.length;

    // 2. Ofensiva do Dia (Streak) Qualificada conforme regra configurada pelo assinante
    const {
      currentStreak,
      todayQuestionsCount,
      todayMockCompleted,
      streakQualifiedToday,
    } = calculateQualifiedStreak(topics, reviews, mockExams, today, streakConfig);

    // 3. Taxa Global de Acertos & Total de Questões
    let totalQuestions = 0;
    let totalCorrect = 0;

    topics.forEach(t => {
      if (!t.is_planned) {
        totalQuestions += t.initial_questions;
        totalCorrect += t.initial_correct;
      }
    });

    reviews.forEach(r => {
      if (r.completed_date && r.questions_done) {
        totalQuestions += r.questions_done;
        totalCorrect += r.questions_correct || 0;
      }
    });

    mockExams.forEach(m => {
      totalQuestions += m.total_questions;
      totalCorrect += m.correct_answers;
    });

    const overallAccuracy =
      totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 1000) / 10 : 0;

    // 4. Acurácia por Grande Área & Identificação de Vulnerabilidade
    const areaStats: Record<
      string,
      { correct: number; total: number; percentage: number; topicsCount: number }
    > = {};

    areas.forEach(a => {
      areaStats[a.name] = { correct: 0, total: 0, percentage: 0, topicsCount: 0 };
    });

    topics.forEach(t => {
      if (!t.is_planned) {
        if (!areaStats[t.area]) {
          areaStats[t.area] = { correct: 0, total: 0, percentage: 0, topicsCount: 0 };
        }
        areaStats[t.area].correct += t.initial_correct;
        areaStats[t.area].total += t.initial_questions;
        areaStats[t.area].topicsCount += 1;
      }
    });

    // Adiciona revisões concluídas para a respectiva área
    const topicAreaMap = new Map<string, string>();
    topics.forEach(t => topicAreaMap.set(t.id, t.area));

    reviews.forEach(r => {
      if (r.completed_date && r.questions_done) {
        const area = topicAreaMap.get(r.topic_id);
        if (area) {
          if (!areaStats[area]) {
            areaStats[area] = { correct: 0, total: 0, percentage: 0, topicsCount: 0 };
          }
          areaStats[area].correct += r.questions_correct || 0;
          areaStats[area].total += r.questions_done;
        }
      }
    });

    let vulnerableArea: UserStats['vulnerableArea'] = null;
    let minPercentage = Infinity;

    Object.keys(areaStats).forEach(areaName => {
      const item = areaStats[areaName];
      item.percentage =
        item.total > 0 ? Math.round((item.correct / item.total) * 1000) / 10 : 0;

      if (item.topicsCount > 0 && item.percentage < minPercentage) {
        minPercentage = item.percentage;
        vulnerableArea = {
          area: areaName,
          accuracy: item.percentage,
          topicsCount: item.topicsCount,
        };
      }
    });

    return {
      todayReviewsCount,
      todayPriorityQueueCount,
      backlogOverdueCount,
      overdueCount: overduePending.length,
      currentStreak,
      overallAccuracy,
      totalQuestions,
      todayQuestionsCount,
      todayMockCompleted,
      streakQualifiedToday,
      streakConfig,
      workloadConfig,
      vulnerableArea,
      areaAccuracy: areaStats,
    };
  }, [topics, reviews, mockExams, areas, streakConfig, workloadConfig]);

  return (
    <DataContext.Provider
      value={{
        topics,
        reviews,
        mockExams,
        institutionExams,
        prevalentTopics,
        errorLogs,
        studySessions,
        profile,
        areas,
        allTags,
        user,
        isLoading,
        isDemoMode,
        stats,
        streakConfig,
        workloadConfig,
        forestGarden,
        updateStreakConfig,
        updateWorkloadConfig,
        updateForestGarden,
        addTopic,
        updateTopic,
        updateTopicR0,
        addPlannedTopic,
        recordPlannedTopicStudy,
        updateTopicWeeklyGoal,
        updatePlannedTopicDate,
        rescheduleReview,
        rebalanceOverdueReviews,
        distributeWeeklyAutoStudy,
        addArea,
        updateArea,
        reorderAreas,
        deleteArea,
        resetDefaultAreas,
        completeReview,
        updateCompletedReview,
        deleteTopic,
        deleteReviewsFromCycle,
        recalculateTopicReviews,
        addMockExam,
        deleteMockExam,
        addInstitutionExam,
        deleteInstitutionExam,
        addPrevalentTopic,
        updatePrevalentTopic,
        deletePrevalentTopic,
        reorderPrevalentTopics,
        addErrorLog,
        toggleErrorLogReviewed,
        updateErrorLog,
        deleteErrorLog,
        addStudySession,
        deleteStudySession,
        updateProfile,
        resetToDemo,
        signInDemo,
        signOut,
      }}
    >

      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData deve ser usado dentro de um DataProvider');
  }
  return context;
};
