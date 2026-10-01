'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
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
} from '@/types/database';
import {
  getInitialDemoTopics,
  getInitialDemoReviews,
  getInitialDemoMockExams,
  getInitialDemoInstitutionExams,
  getInitialDemoPrevalentTopics,
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
} from '@/lib/spaced-repetition';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface DataContextType {
  topics: StudyTopic[];
  reviews: TopicReview[];
  mockExams: MockExam[];
  institutionExams: InstitutionExam[];
  prevalentTopics: PrevalentTopic[];
  profile: Profile | null;
  areas: StudyArea[];
  allTags: string[];
  user: any;
  isLoading: boolean;
  isDemoMode: boolean;
  stats: UserStats;
  streakConfig: StreakConfig;
  workloadConfig: WorkloadConfig;
  updateStreakConfig: (config: StreakConfig) => Promise<void>;
  updateWorkloadConfig: (config: WorkloadConfig) => Promise<void>;
  addTopic: (data: {
    area: string;
    subject_name: string;
    tags?: string[];
    initial_date: string;
    initial_questions: number;
    initial_correct: number;
    initial_duration_minutes?: number;
  }) => Promise<void>;
  updateTopic: (topicId: string, data: Partial<StudyTopic>) => Promise<void>;
  updateTopicR0: (
    topicId: string,
    questionsDone: number,
    questionsCorrect: number,
    initialDate?: string,
    durationMinutes?: number,
    extraTopicData?: Partial<StudyTopic>
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
    }
  ) => Promise<{ nextReviewDate?: string }>;
  updateTopicWeeklyGoal: (topicId: string, is_weekly_goal: boolean) => Promise<void>;
  updatePlannedTopicDate: (topicId: string, planned_date: string | null) => Promise<void>;
  rescheduleReview: (reviewId: string, newScheduledDate: string) => Promise<void>;
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
    durationMinutes?: number
  ) => Promise<{ nextReviewDate?: string }>;
  updateCompletedReview: (
    reviewId: string,
    questionsDone: number,
    questionsCorrect: number,
    completedDate?: string
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
  addPrevalentTopic: (data: Omit<PrevalentTopic, 'id' | 'created_at'>) => Promise<void>;
  updatePrevalentTopic: (id: string, data: Partial<PrevalentTopic>) => Promise<void>;
  deletePrevalentTopic: (id: string) => Promise<void>;
  reorderPrevalentTopics: (orderedIds: string[]) => Promise<void>;
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
  PROFILE: 'adaptivemed_profile_v1',
  AREAS: 'adaptivemed_areas_v1',
  STREAK_CONFIG: 'adaptivemed_streak_config_v1',
  WORKLOAD_CONFIG: 'adaptivemed_workload_config_v1',
  DEMO_ACTIVE: 'adaptivemed_demo_active',
};

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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [areas, setAreas] = useState<StudyArea[]>(DEFAULT_STUDY_AREAS);
  const [streakConfig, setStreakConfig] = useState<StreakConfig>(DEFAULT_STREAK_CONFIG);
  const [workloadConfig, setWorkloadConfig] = useState<WorkloadConfig>(DEFAULT_WORKLOAD_CONFIG);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(true);


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
      setTopics([]);
      setReviews([]);
      setMockExams([]);
      setInstitutionExams([]);
      setPrevalentTopics([]);
      setAreas(DEFAULT_STUDY_AREAS);
      setIsDemoMode(false);
      setIsLoading(false);
    }

    init();
  }, []);

  const loadSupabaseData = async (userId: string) => {
    const supabase = createClient();
    try {
      const loadPromise = Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('study_topics').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('topic_reviews').select('*').eq('user_id', userId).order('scheduled_date', { ascending: true }),
        supabase.from('mock_exams').select('*').eq('user_id', userId).order('exam_date', { ascending: false }),
        supabase.from('institution_exams').select('*').eq('user_id', userId).order('exam_year', { ascending: true }),
        supabase.from('prevalent_topics').select('*').eq('user_id', userId).order('rank_order', { ascending: true }),
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
        const hasActivePlan = Boolean(
          profData.is_subscribed || profData.subscription_status === 'active'
        );
        if (!hasActivePlan && typeof window !== 'undefined') {
          const path = window.location.pathname;
          if (
            path.startsWith('/dashboard') ||
            path.startsWith('/diario') ||
            path.startsWith('/revisoes') ||
            path.startsWith('/simulados') ||
            path.startsWith('/evolucao') ||
            path.startsWith('/prevalencia') ||
            path.startsWith('/onboarding') ||
            path.startsWith('/conta')
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
            isLocalCompleted = Boolean(JSON.parse(localProf).onboarding_completed);
          }
        } catch {}

        const isFullyCompleted = Boolean(profData.onboarding_completed || isLocalCompleted);

        if (
          (profData.is_subscribed || profData.subscription_status === 'active') &&
          !isFullyCompleted &&
          typeof window !== 'undefined'
        ) {
          const path = window.location.pathname;
          if (
            path.startsWith('/dashboard') ||
            path.startsWith('/revisoes') ||
            path.startsWith('/simulados') ||
            path.startsWith('/evolucao')
          ) {
            window.location.href = '/onboarding';
            return;
          }
        }
      }

      // 1. MERGE INTELIGENTE DE TÓPICOS (Preserva tópicos locais que ainda não subiram ao banco)
      let mergedTopics: StudyTopic[] = (topData as StudyTopic[]) || [];
      const storedTopicsRaw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEYS.TOPICS) : null;
      if (storedTopicsRaw) {
        try {
          const localTopics = JSON.parse(storedTopicsRaw) as StudyTopic[];
          const remoteIds = new Set(mergedTopics.map(t => t.id));
          const pendingTopics = localTopics.filter(lt => !remoteIds.has(lt.id));
          if (pendingTopics.length > 0) {
            mergedTopics = [...pendingTopics, ...mergedTopics];
            // Sincroniza os tópicos pendentes com o Supabase em background
            pendingTopics.forEach(pt => safeInsertStudyTopic(supabase, pt));
          }
        } catch {}
      }
      setTopics(mergedTopics);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEYS.TOPICS, JSON.stringify(mergedTopics));
      }

      // 2. MERGE INTELIGENTE DE REVISÕES (Preserva revisões locais se o banco estiver vazio ou desatualizado)
      let mergedReviews: TopicReview[] = (revData as TopicReview[]) || [];
      const storedReviewsRaw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEYS.REVIEWS) : null;
      if (storedReviewsRaw) {
        try {
          const localReviews = JSON.parse(storedReviewsRaw) as TopicReview[];
          const remoteRevIds = new Set(mergedReviews.map(r => r.id));
          const pendingReviews = localReviews.filter(lr => !remoteRevIds.has(lr.id));
          if (pendingReviews.length > 0) {
            mergedReviews = [...mergedReviews, ...pendingReviews];
            pendingReviews.forEach(pr => safeInsertTopicReview(supabase, pr));
          }
        } catch {}
      }

      // 3. AUTO-CURA PEDAGÓGICA (Gera R1 para qualquer estudo que tenha ficado sem revisão)
      const missingReviews: TopicReview[] = [];
      mergedTopics.forEach(topic => {
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

      setReviews(mergedReviews);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEYS.REVIEWS, JSON.stringify(mergedReviews));
      }

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
        if (storedPrevalent) {
          try {
            setPrevalentTopics(JSON.parse(storedPrevalent));
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Aviso ou timeout no carregamento do Supabase. Carregando dados locais de segurança:', err);
      // Fallback seguro: se falhar a rede/timeout, carrega todos os dados locais do localStorage
      if (typeof window !== 'undefined') {
        try {
          const storedTopics = localStorage.getItem(LOCAL_STORAGE_KEYS.TOPICS);
          if (storedTopics) setTopics(JSON.parse(storedTopics));
          const storedReviews = localStorage.getItem(LOCAL_STORAGE_KEYS.REVIEWS);
          if (storedReviews) setReviews(JSON.parse(storedReviews));
          const storedMocks = localStorage.getItem(LOCAL_STORAGE_KEYS.MOCK_EXAMS);
          if (storedMocks) setMockExams(JSON.parse(storedMocks));
          const storedInsts = localStorage.getItem(LOCAL_STORAGE_KEYS.INST_EXAMS);
          if (storedInsts) setInstitutionExams(JSON.parse(storedInsts));
          const storedPrev = localStorage.getItem(LOCAL_STORAGE_KEYS.PREVALENT_TOPICS);
          if (storedPrev) setPrevalentTopics(JSON.parse(storedPrev));
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
    const dProf = INITIAL_DEMO_PROFILE;

    setTopics(dTopics);
    setReviews(dReviews);
    setMockExams(dMocks);
    setInstitutionExams(dInsts);
    setPrevalentTopics(dPrevalent);
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
    setTopics([]);
    setReviews([]);
    setMockExams([]);
    setInstitutionExams([]);
    setPrevalentTopics([]);
    setProfile(null);
    if (typeof window !== 'undefined') {
      document.cookie = 'adaptivemed_demo=; path=/; max-age=0; SameSite=Lax';
      localStorage.removeItem(LOCAL_STORAGE_KEYS.DEMO_ACTIVE);
      window.location.href = '/login';
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    setProfile(prev => (prev ? { ...prev, ...data } : ({ id: user?.id || 'demo-user-id', ...data } as Profile)));
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          LOCAL_STORAGE_KEYS.PROFILE,
          JSON.stringify({ ...(profile || INITIAL_DEMO_PROFILE), ...data })
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
    setWorkloadConfig(newConfig);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEYS.WORKLOAD_CONFIG, JSON.stringify(newConfig));
      } catch {}
    }
    await updateProfile({ workload_config: newConfig });
  };

  // Salvar no localStorage de forma contínua
  useEffect(() => {
    if (typeof window !== 'undefined' && topics.length > 0) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEYS.TOPICS, JSON.stringify(topics));
        localStorage.setItem(LOCAL_STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
        localStorage.setItem(LOCAL_STORAGE_KEYS.MOCK_EXAMS, JSON.stringify(mockExams));
        localStorage.setItem(LOCAL_STORAGE_KEYS.INST_EXAMS, JSON.stringify(institutionExams));
        localStorage.setItem(LOCAL_STORAGE_KEYS.PREVALENT_TOPICS, JSON.stringify(prevalentTopics));
      } catch {}
    }
  }, [topics, reviews, mockExams, institutionExams, prevalentTopics]);

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

    // Se o nome foi alterado, faz o cascade nos tópicos e tópicos prevalentes
    if (oldName && oldName !== newName) {
      setTopics(prev => {
        const up = prev.map(t => (t.area === oldName ? { ...t, area: newName } : t));
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEYS.TOPICS, JSON.stringify(up));
        }
        return up;
      });

      setPrevalentTopics(prev => {
        const up = prev.map(p => (p.area === oldName ? { ...p, area: newName } : p));
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEYS.PREVALENT_TOPICS, JSON.stringify(up));
        }
        return up;
      });
    }

    if (!isDemoMode && user) {
      const supabase = createClient();
      const calls: PromiseLike<any>[] = [
        supabase.from('profiles').update({ custom_areas: updated }).eq('id', user.id)
      ];
      if (oldName && oldName !== newName) {
        calls.push(
          supabase.from('study_topics').update({ area: newName }).eq('user_id', user.id).eq('area', oldName),
          supabase.from('prevalent_topics').update({ area: newName }).eq('user_id', user.id).eq('area', oldName)
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

    if (targetArea) {
      setTopics(prev => {
        const up = prev.map(t => (t.area === targetArea.name ? { ...t, area: fallbackAreaName } : t));
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEYS.TOPICS, JSON.stringify(up));
        }
        return up;
      });
    }

    if (!isDemoMode && user) {
      const supabase = createClient();
      const calls: PromiseLike<any>[] = [
        supabase.from('profiles').update({ custom_areas: updated }).eq('id', user.id)
      ];
      if (targetArea) {
        calls.push(
          supabase.from('study_topics').update({ area: fallbackAreaName }).eq('user_id', user.id).eq('area', targetArea.name)
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

  // AÇÃO 1: Adicionar Novo Assunto
  const addTopic = async (data: {
    area: string;
    subject_name: string;
    tags?: string[];
    initial_date: string;
    initial_questions: number;
    initial_correct: number;
    initial_duration_minutes?: number;
  }) => {
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
      base_questions_count: data.initial_questions,
      created_at: new Date().toISOString(),
    };

    // Calcula o primeiro ciclo de revisão (R1) usando o motor científico
    const reviewCalc = calculateNextReview({
      currentCycle: 0,
      accuracy: percentage,
      baseQuestionsCount: data.initial_questions,
    });
    const targetR1Date = addDaysToDate(data.initial_date, reviewCalc.nextIntervalDays);

    // Gestão de carga diária e rolagem automática (anti-sobrecarga)
    const scheduledCounts = new Map<string, number>();
    reviews.forEach(r => {
      if (!r.completed_date) {
        scheduledCounts.set(r.scheduled_date, (scheduledCounts.get(r.scheduled_date) || 0) + 1);
      }
    });
    const maxDailyLimit = workloadConfig?.maxDailyReviews || 3;
    const r1ScheduledDate = findNextAvailableDate(targetR1Date, scheduledCounts, maxDailyLimit);

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

    // 1. Atualização Otimista Imediata
    setTopics(prev => {
      const up = [newTopic, ...prev];
      if (typeof window !== 'undefined') localStorage.setItem(LOCAL_STORAGE_KEYS.TOPICS, JSON.stringify(up));
      return up;
    });
    setReviews(prev => {
      const up = [...prev, r1Review];
      if (typeof window !== 'undefined') localStorage.setItem(LOCAL_STORAGE_KEYS.REVIEWS, JSON.stringify(up));
      return up;
    });

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(
        (async () => {
          await safeInsertStudyTopic(supabase, newTopic);
          await safeInsertTopicReview(supabase, r1Review);
        })()
      );
    }
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
    const newTopic: StudyTopic = {
      id: topicId,
      user_id: userId,
      area: data.area,
      subject_name: data.subject_name.trim(),
      tags: data.tags || [],
      initial_date: data.planned_date || '',
      planned_date: data.planned_date,
      initial_questions: 0,
      initial_correct: 0,
      initial_percentage: 0,
      is_planned: true,
      is_weekly_goal: data.is_weekly_goal ?? false,
      notes: data.notes,
      created_at: new Date().toISOString(),
    };

    // 1. Atualização Otimista Imediata (zero latência)
    setTopics(prev => {
      const updated = [newTopic, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEYS.TOPICS, JSON.stringify(updated));
      }
      return updated;
    });

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
    }
  ): Promise<{ nextReviewDate?: string }> => {
    const percentage =
      data.questions_done > 0
        ? Math.round((data.questions_correct / data.questions_done) * 1000) / 10
        : 0;

    const reviewCalc = calculateNextReview({
      currentCycle: 0,
      accuracy: percentage,
      baseQuestionsCount: data.questions_done,
    });
    const targetR1Date = addDaysToDate(data.study_date, reviewCalc.nextIntervalDays);

    // Gestão de carga diária e rolagem automática (anti-sobrecarga)
    const scheduledCounts = new Map<string, number>();
    reviews.forEach(r => {
      if (!r.completed_date) {
        scheduledCounts.set(r.scheduled_date, (scheduledCounts.get(r.scheduled_date) || 0) + 1);
      }
    });
    const maxDailyLimit = workloadConfig?.maxDailyReviews || 3;
    const r1ScheduledDate = findNextAvailableDate(targetR1Date, scheduledCounts, maxDailyLimit);

    const targetTopic = topics.find(t => t.id === topicId);
    const userId = user?.id || 'demo-user-id';

    const updatedTopic: StudyTopic = targetTopic
      ? {
          ...targetTopic,
          initial_date: data.study_date,
          initial_questions: data.questions_done,
          initial_correct: data.questions_correct,
          initial_percentage: percentage,
          initial_duration_minutes: data.duration_minutes || null,
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
    setTopics(prev => {
      const updated = prev.map(t => (t.id === topicId ? updatedTopic : t));
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEYS.TOPICS, JSON.stringify(updated));
      }
      return updated;
    });
    setReviews(prev => {
      const updated = [...prev, r1Review];
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEYS.REVIEWS, JSON.stringify(updated));
      }
      return updated;
    });

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(
        (async () => {
          await safeUpdateStudyTopic(supabase, topicId, {
            initial_date: data.study_date,
            initial_questions: data.questions_done,
            initial_correct: data.questions_correct,
            initial_percentage: percentage,
            initial_duration_minutes: data.duration_minutes || null,
            base_questions_count: data.questions_done,
            is_planned: false,
          });
          await safeInsertTopicReview(supabase, r1Review);
        })()
      );
    }

    return { nextReviewDate: r1ScheduledDate };
  };

  // AÇÃO 1.2b: Editar Conteúdo / Tópico de Estudo (nome, área, tags, data prevista, notas)
  const updateTopic = async (topicId: string, data: Partial<StudyTopic>) => {
    setTopics(prev => {
      const updated = prev.map(t => (t.id === topicId ? { ...t, ...data } : t));
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEYS.TOPICS, JSON.stringify(updated));
      }
      return updated;
    });

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
    durationMinutes?: number,
    extraTopicData?: Partial<StudyTopic>
  ) => {
    const targetTopic = topics.find(t => t.id === topicId);
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
    const r1Review = reviews.find(r => r.topic_id === topicId && r.review_number === 1);
    if (r1Review && !r1Review.completed_date) {
      const reviewCalc = calculateNextReview({
        currentCycle: 0,
        accuracy: percentage,
        baseQuestionsCount: questionsDone,
      });
      const targetR1Date = addDaysToDate(finalInitialDate, reviewCalc.nextIntervalDays);

      const scheduledCounts = new Map<string, number>();
      reviews.forEach(r => {
        if (!r.completed_date && r.id !== r1Review.id) {
          scheduledCounts.set(r.scheduled_date, (scheduledCounts.get(r.scheduled_date) || 0) + 1);
        }
      });
      const maxDailyLimit = workloadConfig?.maxDailyReviews || 3;
      const newScheduledDate = findNextAvailableDate(targetR1Date, scheduledCounts, maxDailyLimit);

      updatedR1 = {
        ...r1Review,
        scheduled_date: newScheduledDate,
        recommended_questions: reviewCalc.recommendedQuestions,
        previous_interval_days: reviewCalc.nextIntervalDays,
        diagnosis: reviewCalc.diagnosis,
        diagnosis_badge: reviewCalc.diagnosisBadge,
        pedagogical_note: reviewCalc.pedagogicalNote,
      };
    }

    setTopics(prev => {
      const updated = prev.map(t => (t.id === topicId ? updatedTopic : t));
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEYS.TOPICS, JSON.stringify(updated));
      }
      return updated;
    });

    if (updatedR1) {
      setReviews(prev => {
        const updated = prev.map(r => (r.id === updatedR1!.id ? updatedR1! : r));
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEYS.REVIEWS, JSON.stringify(updated));
        }
        return updated;
      });
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
    setTopics(prev => {
      const updated = prev.map(t => (t.id === topicId ? { ...t, is_weekly_goal } : t));
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEYS.TOPICS, JSON.stringify(updated));
      }
      return updated;
    });
    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(supabase.from('study_topics').update({ is_weekly_goal }).eq('id', topicId));
    }
  };

  // AÇÃO 1.4: Mover / Agendar / Desagendar assunto planejado (Drag & Drop e Remoção do Calendário)
  const updatePlannedTopicDate = async (topicId: string, planned_date: string | null) => {
    setTopics(prev => {
      const updated = prev.map(t =>
        t.id === topicId
          ? {
              ...t,
              planned_date: planned_date || undefined,
              is_planned: true,
              initial_date: planned_date || '',
            }
          : t
      );
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEYS.TOPICS, JSON.stringify(updated));
      }
      return updated;
    });

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(
        supabase
          .from('study_topics')
          .update({
            planned_date: planned_date,
            is_planned: true,
            initial_date: planned_date || null,
          })
          .eq('id', topicId)
      );
    }
  };

  // AÇÃO 1.4b: Reprogramar Data de uma Revisão Agendada/Atrasada no Calendário
  const rescheduleReview = async (reviewId: string, newScheduledDate: string) => {
    setReviews(prev => {
      const updated = prev.map(r =>
        r.id === reviewId
          ? {
              ...r,
              scheduled_date: newScheduledDate,
            }
          : r
      );
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEYS.REVIEWS, JSON.stringify(updated));
      }
      return updated;
    });

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

  // AÇÃO 1.5: Distribuir Automaticamente os Assuntos da Semana (Auto-Estudo)
  const distributeWeeklyAutoStudy = async (weekStartStr: string): Promise<number> => {
    const [year, month, day] = weekStartStr.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);
    const weekDays: string[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      weekDays.push(d.toISOString().split('T')[0]);
    }

    // Assuntos pendentes de agendamento: is_planned = true e (sem data ou de semanas passadas)
    const pendingTopics = topics.filter(
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

    const updatedTopics = topics.map(t => {
      const newDate = topicDateMap.get(t.id);
      return newDate ? { ...t, planned_date: newDate, initial_date: newDate } : t;
    });

    setTopics(updatedTopics);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.TOPICS, JSON.stringify(updatedTopics));
    }

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
    durationMinutes?: number
  ): Promise<{ nextReviewDate?: string }> => {
    const today = getTodayDateString();
    const percentage =
      questionsDone > 0 ? Math.round((questionsCorrect / questionsDone) * 1000) / 10 : 0;

    const currentReview = reviews.find(r => r.id === reviewId);
    if (!currentReview) throw new Error('Revisão não encontrada');

    const targetTopic = topics.find(t => t.id === currentReview.topic_id);
    const baseQuestions = targetTopic?.base_questions_count || targetTopic?.initial_questions || 20;

    // Intervalo anterior: se tiver previous_interval_days gravado usa ele, senão calcula a diferença de dias
    let prevInterval = currentReview.previous_interval_days;
    if (!prevInterval && targetTopic?.initial_date) {
      prevInterval = Math.max(1, diffInDays(currentReview.scheduled_date, targetTopic.initial_date));
    }
    if (!prevInterval) prevInterval = 7;

    const reviewCalc = calculateNextReview({
      currentCycle: currentReview.review_number,
      accuracy: percentage,
      baseQuestionsCount: baseQuestions,
      previousIntervalDays: prevInterval,
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

    // Se o próximo ciclo for <= 8 e a revisão atual < 8, agenda o próximo ciclo
    if (reviewCalc.nextCycle <= 8 && currentReview.review_number < 8) {
      const targetNextDate = addDaysToDate(today, reviewCalc.nextIntervalDays);

      // Gestão de carga diária e rolagem automática (anti-sobrecarga)
      const scheduledCounts = new Map<string, number>();
      reviews.forEach(r => {
        if (!r.completed_date && r.id !== reviewId) {
          scheduledCounts.set(r.scheduled_date, (scheduledCounts.get(r.scheduled_date) || 0) + 1);
        }
      });
      const maxDailyLimit = workloadConfig?.maxDailyReviews || 3;
      nextScheduledDate = findNextAvailableDate(targetNextDate, scheduledCounts, maxDailyLimit);

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
        previous_interval_days: reviewCalc.nextIntervalDays,
        diagnosis: reviewCalc.diagnosis,
        diagnosis_badge: reviewCalc.diagnosisBadge,
        pedagogical_note: reviewCalc.pedagogicalNote,
        created_at: new Date().toISOString(),
      };
    }

    setReviews(prev => {
      const updated = prev.map(r => (r.id === reviewId ? updatedReview : r));
      const finalRev = nextReviewObj ? [...updated, nextReviewObj] : updated;
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEYS.REVIEWS, JSON.stringify(finalRev));
      }
      return finalRev;
    });

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
    completedDate?: string
  ) => {
    const targetRev = reviews.find(r => r.id === reviewId);
    if (!targetRev) return;

    const percentage =
      questionsDone > 0 ? Math.round((questionsCorrect / questionsDone) * 1000) / 10 : 0;
    const finalDate = completedDate || targetRev.completed_date || getTodayDateString();

    const targetTopic = topics.find(t => t.id === targetRev.topic_id);
    const baseQuestions = targetTopic?.base_questions_count || questionsDone || 20;
    const prevInterval = targetRev.previous_interval_days || 7;

    const reviewCalc = calculateNextReview({
      currentCycle: targetRev.review_number,
      accuracy: percentage,
      baseQuestionsCount: baseQuestions,
      previousIntervalDays: prevInterval,
    });

    const updatedReview: TopicReview = {
      ...targetRev,
      questions_done: questionsDone,
      questions_correct: questionsCorrect,
      percentage,
      completed_date: finalDate,
      diagnosis: reviewCalc.diagnosis,
      diagnosis_badge: reviewCalc.diagnosisBadge,
      pedagogical_note: reviewCalc.pedagogicalNote,
    };

    // Se a próxima revisão existir e não estiver concluída, recalcula seus parâmetros de agendamento
    let updatedNextRev: TopicReview | null = null;
    if (targetRev.review_number < 8) {
      const nextRev = reviews.find(
        r => r.topic_id === targetRev.topic_id && r.review_number === targetRev.review_number + 1
      );
      if (nextRev && !nextRev.completed_date) {
        const targetNextDate = addDaysToDate(finalDate, reviewCalc.nextIntervalDays);
        const scheduledCounts = new Map<string, number>();
        reviews.forEach(r => {
          if (!r.completed_date && r.id !== nextRev.id) {
            scheduledCounts.set(r.scheduled_date, (scheduledCounts.get(r.scheduled_date) || 0) + 1);
          }
        });
        const maxDailyLimit = workloadConfig?.maxDailyReviews || 3;
        const newScheduledDate = findNextAvailableDate(targetNextDate, scheduledCounts, maxDailyLimit);

        updatedNextRev = {
          ...nextRev,
          scheduled_date: newScheduledDate,
          recommended_questions: reviewCalc.recommendedQuestions,
          previous_interval_days: reviewCalc.nextIntervalDays,
          diagnosis: reviewCalc.diagnosis,
          diagnosis_badge: reviewCalc.diagnosisBadge,
          pedagogical_note: reviewCalc.pedagogicalNote,
        };
      }
    }

    setReviews(prev => {
      const updated = prev.map(r => {
        if (r.id === reviewId) return updatedReview;
        if (updatedNextRev && r.id === updatedNextRev.id) return updatedNextRev;
        return r;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEYS.REVIEWS, JSON.stringify(updated));
      }
      return updated;
    });

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(
        (async () => {
          await safeUpdateTopicReview(supabase, reviewId, {
            questions_done: questionsDone,
            questions_correct: questionsCorrect,
            percentage,
            completed_date: finalDate,
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
    setTopics(prev => {
      const up = prev.filter(t => t.id !== topicId);
      if (typeof window !== 'undefined') localStorage.setItem(LOCAL_STORAGE_KEYS.TOPICS, JSON.stringify(up));
      return up;
    });
    setReviews(prev => {
      const up = prev.filter(r => r.topic_id !== topicId);
      if (typeof window !== 'undefined') localStorage.setItem(LOCAL_STORAGE_KEYS.REVIEWS, JSON.stringify(up));
      return up;
    });

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(supabase.from('study_topics').delete().eq('id', topicId));
    }
  };

  // AÇÃO 3b: Excluir um ciclo de revisão e os posteriores (mantém R0 e ciclos anteriores)
  const deleteReviewsFromCycle = async (topicId: string, fromReviewNumber: number) => {
    setReviews(prev => {
      const up = prev.filter(r => !(r.topic_id === topicId && r.review_number >= fromReviewNumber));
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEYS.REVIEWS, JSON.stringify(up));
      }
      return up;
    });

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
    const targetTopic = topics.find(t => t.id === topicId);
    if (!targetTopic) return;

    const topicRevs = reviews.filter(r => r.topic_id === topicId);
    const completedRevs = topicRevs
      .filter(r => Boolean(r.completed_date))
      .sort((a, b) => a.review_number - b.review_number);

    let nextCycleNum = 1;
    let baseAccuracy = targetTopic.initial_percentage || 80;
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
    });

    const today = getTodayDateString();
    const targetDate = addDaysToDate(today, reviewCalc.nextIntervalDays);

    const scheduledCounts = new Map<string, number>();
    reviews.forEach(r => {
      if (!r.completed_date) {
        scheduledCounts.set(r.scheduled_date, (scheduledCounts.get(r.scheduled_date) || 0) + 1);
      }
    });
    const maxDailyLimit = workloadConfig?.maxDailyReviews || 3;
    const newScheduledDate = findNextAvailableDate(targetDate, scheduledCounts, maxDailyLimit);

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
      previous_interval_days: reviewCalc.nextIntervalDays,
      diagnosis: reviewCalc.diagnosis,
      diagnosis_badge: reviewCalc.diagnosisBadge,
      pedagogical_note: reviewCalc.pedagogicalNote,
      created_at: new Date().toISOString(),
    };

    setReviews(prev => {
      const filtered = prev.filter(r => !(r.topic_id === topicId && r.review_number >= nextCycleNum));
      const updated = [...filtered, newReview];
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEYS.REVIEWS, JSON.stringify(updated));
      }
      return updated;
    });

    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(safeInsertTopicReview(supabase, newReview));
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
  const addPrevalentTopic = async (data: Omit<PrevalentTopic, 'id' | 'created_at'>) => {
    const newPrev: PrevalentTopic = {
      id: isDemoMode ? `prev-${Date.now()}` : crypto.randomUUID(),
      user_id: user?.id || 'demo-user-id',
      ...data,
      created_at: new Date().toISOString(),
    };
    const updated = [...prevalentTopics, newPrev];
    setPrevalentTopics(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.PREVALENT_TOPICS, JSON.stringify(updated));
    }
    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(supabase.from('prevalent_topics').insert(newPrev));
    }
  };

  const updatePrevalentTopic = async (id: string, data: Partial<PrevalentTopic>) => {
    const updated = prevalentTopics.map(p => (p.id === id ? { ...p, ...data } : p));
    setPrevalentTopics(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.PREVALENT_TOPICS, JSON.stringify(updated));
    }
    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(supabase.from('prevalent_topics').update(data).eq('id', id));
    }
  };

  const deletePrevalentTopic = async (id: string) => {
    const updated = prevalentTopics.filter(p => p.id !== id);
    setPrevalentTopics(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.PREVALENT_TOPICS, JSON.stringify(updated));
    }
    if (!isDemoMode && user) {
      const supabase = createClient();
      syncSupabase(supabase.from('prevalent_topics').delete().eq('id', id));
    }
  };

  const reorderPrevalentTopics = async (orderedIds: string[]) => {
    const rankMap = new Map<string, number>();
    orderedIds.forEach((id, index) => rankMap.set(id, index + 1));
    const updated = prevalentTopics
      .map(p => {
        const newRank = rankMap.get(p.id);
        return newRank !== undefined ? { ...p, rank_order: newRank } : p;
      })
      .sort((a, b) => a.rank_order - b.rank_order);

    setPrevalentTopics(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.PREVALENT_TOPICS, JSON.stringify(updated));
    }
    if (!isDemoMode && user) {
      const supabase = createClient();
      const updates = updated.map(item =>
        supabase.from('prevalent_topics').update({ rank_order: item.rank_order }).eq('id', item.id)
      );
      syncSupabase(Promise.allSettled(updates));
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
        profile,
        areas,
        allTags,
        user,
        isLoading,
        isDemoMode,
        stats,
        streakConfig,
        workloadConfig,
        updateStreakConfig,
        updateWorkloadConfig,
        addTopic,
        updateTopic,
        updateTopicR0,
        addPlannedTopic,
        recordPlannedTopicStudy,
        updateTopicWeeklyGoal,
        updatePlannedTopicDate,
        rescheduleReview,
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
