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
  getTodayDateString,
  addDaysToDate,
  calculateStreak,
  calculateQualifiedStreak,
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
  addTopic: (data: {
    area: string;
    subject_name: string;
    tags?: string[];
    initial_date: string;
    initial_questions: number;
    initial_correct: number;
  }) => Promise<void>;
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
    }
  ) => Promise<{ nextReviewDate?: string }>;
  updateTopicWeeklyGoal: (topicId: string, is_weekly_goal: boolean) => Promise<void>;
  updatePlannedTopicDate: (topicId: string, planned_date: string | null) => Promise<void>;
  addArea: (name: string, colorHex: string) => Promise<void>;
  updateArea: (id: string, name: string, colorHex: string) => Promise<void>;
  deleteArea: (id: string) => Promise<void>;
  resetDefaultAreas: () => Promise<void>;
  completeReview: (
    reviewId: string,
    questionsDone: number,
    questionsCorrect: number
  ) => Promise<{ nextReviewDate?: string }>;
  deleteTopic: (topicId: string) => Promise<void>;
  addMockExam: (data: {
    exam_name: string;
    exam_date: string;
    total_questions: number;
    correct_answers: number;
  }) => Promise<void>;
  deleteMockExam: (examId: string) => Promise<void>;
  addInstitutionExam: (data: {
    institution_name: string;
    exam_year: number;
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
  DEMO_ACTIVE: 'adaptivemed_demo_active',
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [reviews, setReviews] = useState<TopicReview[]>([]);
  const [mockExams, setMockExams] = useState<MockExam[]>([]);
  const [institutionExams, setInstitutionExams] = useState<InstitutionExam[]>([]);
  const [prevalentTopics, setPrevalentTopics] = useState<PrevalentTopic[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [areas, setAreas] = useState<StudyArea[]>(DEFAULT_STUDY_AREAS);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(true);

  // Inicialização e detecção do Supabase vs Demo
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

      // Se não autenticado no Supabase, inicializa / recupera dados de demonstração
      loadLocalStorageDemo();
      setIsLoading(false);
    }

    init();
  }, []);

  const loadLocalStorageDemo = () => {
    try {
      const isDemoActive =
        typeof window !== 'undefined' &&
        localStorage.getItem(LOCAL_STORAGE_KEYS.DEMO_ACTIVE) === 'true';

      if (!isDemoActive) {
        setIsDemoMode(false);
        setTopics([]);
        setReviews([]);
        setMockExams([]);
        setInstitutionExams([]);
        setPrevalentTopics([]);
        setProfile(null);
        setAreas(DEFAULT_STUDY_AREAS);
        return;
      }

      const storedTopics = localStorage.getItem(LOCAL_STORAGE_KEYS.TOPICS);
      const storedReviews = localStorage.getItem(LOCAL_STORAGE_KEYS.REVIEWS);
      const storedMocks = localStorage.getItem(LOCAL_STORAGE_KEYS.MOCK_EXAMS);
      const storedInsts = localStorage.getItem(LOCAL_STORAGE_KEYS.INST_EXAMS);
      const storedPrevalent = localStorage.getItem(LOCAL_STORAGE_KEYS.PREVALENT_TOPICS);
      const storedProfile = localStorage.getItem(LOCAL_STORAGE_KEYS.PROFILE);
      const storedAreas = localStorage.getItem(LOCAL_STORAGE_KEYS.AREAS);

      if (storedTopics && storedReviews) {
        setTopics(JSON.parse(storedTopics));
        setReviews(JSON.parse(storedReviews));
        setMockExams(storedMocks ? JSON.parse(storedMocks) : getInitialDemoMockExams());
        setInstitutionExams(storedInsts ? JSON.parse(storedInsts) : getInitialDemoInstitutionExams());
        setPrevalentTopics(storedPrevalent ? JSON.parse(storedPrevalent) : getInitialDemoPrevalentTopics());
        setProfile(storedProfile ? JSON.parse(storedProfile) : INITIAL_DEMO_PROFILE);
        setAreas(storedAreas ? JSON.parse(storedAreas) : DEFAULT_STUDY_AREAS);
      } else {
        resetToDemo();
      }
      setIsDemoMode(true);
    } catch {
      setIsDemoMode(false);
    }
  };

  const loadSupabaseData = async (userId: string) => {
    const supabase = createClient();
    try {
      const [
        { data: profData },
        { data: topData },
        { data: revData },
        { data: mockData },
        { data: instData },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('study_topics').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('topic_reviews').select('*').eq('user_id', userId).order('scheduled_date', { ascending: true }),
        supabase.from('mock_exams').select('*').eq('user_id', userId).order('exam_date', { ascending: false }),
        supabase.from('institution_exams').select('*').eq('user_id', userId).order('exam_year', { ascending: true }),
      ]);

      if (profData) {
        setProfile(profData);
        if (
          profData.custom_areas &&
          Array.isArray(profData.custom_areas) &&
          profData.custom_areas.length > 0
        ) {
          setAreas(profData.custom_areas);
        } else {
          setAreas(DEFAULT_STUDY_AREAS);
        }

        // Se usuário logado não possui assinatura ativa e tenta acessar rotas internas de estudo
        if (
          !profData.is_subscribed &&
          profData.subscription_status !== 'active' &&
          typeof window !== 'undefined'
        ) {
          const path = window.location.pathname;
          if (
            path.startsWith('/dashboard') ||
            path.startsWith('/revisoes') ||
            path.startsWith('/simulados') ||
            path.startsWith('/evolucao') ||
            path.startsWith('/onboarding')
          ) {
            window.location.href = '/pagamento';
            return;
          }
        }

        // Se usuário possui assinatura ativa MAS ainda não concluiu o Onboarding obrigatório
        if (
          (profData.is_subscribed || profData.subscription_status === 'active') &&
          !profData.onboarding_completed &&
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
      setTopics(topData ? (topData as StudyTopic[]) : []);
      setReviews(revData ? (revData as TopicReview[]) : []);
      setMockExams(mockData ? (mockData as MockExam[]) : []);
      setInstitutionExams(instData ? (instData as InstitutionExam[]) : []);
    } catch (err) {
      console.error('Erro ao carregar dados do Supabase:', err);
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
    setIsDemoMode(true);

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.TOPICS, JSON.stringify(dTopics));
      localStorage.setItem(LOCAL_STORAGE_KEYS.REVIEWS, JSON.stringify(dReviews));
      localStorage.setItem(LOCAL_STORAGE_KEYS.MOCK_EXAMS, JSON.stringify(dMocks));
      localStorage.setItem(LOCAL_STORAGE_KEYS.INST_EXAMS, JSON.stringify(dInsts));
      localStorage.setItem(LOCAL_STORAGE_KEYS.PREVALENT_TOPICS, JSON.stringify(dPrevalent));
      localStorage.setItem(LOCAL_STORAGE_KEYS.PROFILE, JSON.stringify(dProf));
      localStorage.setItem(LOCAL_STORAGE_KEYS.AREAS, JSON.stringify(DEFAULT_STUDY_AREAS));
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
    if (!isDemoMode && user) {
      const supabase = createClient();
      const { error } = await supabase.from('profiles').update(data).eq('id', user.id);
      if (error) throw error;
    }
    setProfile(prev => (prev ? { ...prev, ...data } : ({ id: user?.id || 'demo-user-id', ...data } as Profile)));
    if (isDemoMode && typeof window !== 'undefined') {
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.PROFILE,
        JSON.stringify({ ...(profile || INITIAL_DEMO_PROFILE), ...data })
      );
    }
  };

  // Salvar no localStorage quando em modo Demo
  useEffect(() => {
    if (isDemoMode && typeof window !== 'undefined' && topics.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.TOPICS, JSON.stringify(topics));
      localStorage.setItem(LOCAL_STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
      localStorage.setItem(LOCAL_STORAGE_KEYS.MOCK_EXAMS, JSON.stringify(mockExams));
      localStorage.setItem(LOCAL_STORAGE_KEYS.INST_EXAMS, JSON.stringify(institutionExams));
      localStorage.setItem(LOCAL_STORAGE_KEYS.PREVALENT_TOPICS, JSON.stringify(prevalentTopics));
    }
  }, [topics, reviews, mockExams, institutionExams, prevalentTopics, isDemoMode]);

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
      await supabase.from('profiles').update({ custom_areas: updated }).eq('id', user.id);
    }
  };

  const updateArea = async (id: string, name: string, colorHex: string) => {
    const palette = COLOR_PALETTE.find(c => c.hex === colorHex) || COLOR_PALETTE[0];
    const updated = areas.map(a =>
      a.id === id
        ? {
            ...a,
            name: name.trim(),
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

    if (!isDemoMode && user) {
      const supabase = createClient();
      await supabase.from('profiles').update({ custom_areas: updated }).eq('id', user.id);
    }
  };

  const deleteArea = async (id: string) => {
    if (areas.length <= 1) return;
    const updated = areas.filter(a => a.id !== id);
    setAreas(updated);

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AREAS, JSON.stringify(updated));
    }

    if (!isDemoMode && user) {
      const supabase = createClient();
      await supabase.from('profiles').update({ custom_areas: updated }).eq('id', user.id);
    }
  };

  const resetDefaultAreas = async () => {
    setAreas(DEFAULT_STUDY_AREAS);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AREAS, JSON.stringify(DEFAULT_STUDY_AREAS));
    }
    if (!isDemoMode && user) {
      const supabase = createClient();
      await supabase.from('profiles').update({ custom_areas: DEFAULT_STUDY_AREAS }).eq('id', user.id);
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
      created_at: new Date().toISOString(),
    };

    // Calcula o primeiro ciclo de revisão (R1)
    const intervalDays = calculateNextReviewInterval(percentage, 1);
    const r1ScheduledDate = addDaysToDate(data.initial_date, intervalDays);

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
      created_at: new Date().toISOString(),
    };

    if (!isDemoMode && user) {
      const supabase = createClient();
      const { error: topicErr } = await supabase.from('study_topics').insert(newTopic);
      if (topicErr) throw topicErr;

      const { error: revErr } = await supabase.from('topic_reviews').insert(r1Review);
      if (revErr) throw revErr;
    }

    setTopics(prev => [newTopic, ...prev]);
    setReviews(prev => [...prev, r1Review]);
  };

  // AÇÃO 1.1: Adicionar Assunto Planejado para Estudo Futuro
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
    const fallbackDate = new Date().toISOString().split('T')[0];

    const newTopic: StudyTopic = {
      id: topicId,
      user_id: userId,
      area: data.area,
      subject_name: data.subject_name.trim(),
      tags: data.tags || [],
      initial_date: data.planned_date || fallbackDate,
      planned_date: data.planned_date,
      initial_questions: 0,
      initial_correct: 0,
      initial_percentage: 0,
      is_planned: true,
      is_weekly_goal: data.is_weekly_goal ?? false,
      notes: data.notes,
      created_at: new Date().toISOString(),
    };

    if (!isDemoMode && user) {
      const supabase = createClient();
      await supabase.from('study_topics').insert(newTopic);
    }

    setTopics(prev => [newTopic, ...prev]);
  };

  // AÇÃO 1.2: Registrar Estudo de Assunto Planejado (Dispara Algoritmo Adaptativo R1)
  const recordPlannedTopicStudy = async (
    topicId: string,
    data: {
      study_date: string;
      questions_done: number;
      questions_correct: number;
    }
  ): Promise<{ nextReviewDate?: string }> => {
    const percentage =
      data.questions_done > 0
        ? Math.round((data.questions_correct / data.questions_done) * 1000) / 10
        : 0;

    const intervalDays = calculateNextReviewInterval(percentage, 1);
    const r1ScheduledDate = addDaysToDate(data.study_date, intervalDays);

    const targetTopic = topics.find(t => t.id === topicId);
    const userId = user?.id || 'demo-user-id';

    const updatedTopic: StudyTopic = targetTopic
      ? {
          ...targetTopic,
          initial_date: data.study_date,
          initial_questions: data.questions_done,
          initial_correct: data.questions_correct,
          initial_percentage: percentage,
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
      created_at: new Date().toISOString(),
    };

    if (!isDemoMode && user) {
      const supabase = createClient();
      await supabase
        .from('study_topics')
        .update({
          initial_date: data.study_date,
          initial_questions: data.questions_done,
          initial_correct: data.questions_correct,
          initial_percentage: percentage,
          is_planned: false,
        })
        .eq('id', topicId);

      await supabase.from('topic_reviews').insert(r1Review);
    }

    setTopics(prev => prev.map(t => (t.id === topicId ? updatedTopic : t)));
    setReviews(prev => [...prev, r1Review]);

    return { nextReviewDate: r1ScheduledDate };
  };

  // AÇÃO 1.3: Alternar se assunto é meta da semana
  const updateTopicWeeklyGoal = async (topicId: string, is_weekly_goal: boolean) => {
    setTopics(prev =>
      prev.map(t => (t.id === topicId ? { ...t, is_weekly_goal } : t))
    );
    if (!isDemoMode && user) {
      const supabase = createClient();
      await supabase
        .from('study_topics')
        .update({ is_weekly_goal })
        .eq('id', topicId);
    }
  };

  // AÇÃO 1.4: Mover / Agendar assunto planejado para data específica (Drag & Drop)
  const updatePlannedTopicDate = async (topicId: string, planned_date: string | null) => {
    setTopics(prev =>
      prev.map(t => (t.id === topicId ? { ...t, planned_date: planned_date || undefined } : t))
    );
    if (!isDemoMode && user) {
      const supabase = createClient();
      await supabase
        .from('study_topics')
        .update({ planned_date })
        .eq('id', topicId);
    }
  };

  // AÇÃO 2: Concluir Revisão e Agendar Próximo Ciclo (Adaptativo)
  const completeReview = async (
    reviewId: string,
    questionsDone: number,
    questionsCorrect: number
  ): Promise<{ nextReviewDate?: string }> => {
    const today = getTodayDateString();
    const percentage =
      questionsDone > 0 ? Math.round((questionsCorrect / questionsDone) * 1000) / 10 : 0;

    const currentReview = reviews.find(r => r.id === reviewId);
    if (!currentReview) throw new Error('Revisão não encontrada');

    const updatedReview: TopicReview = {
      ...currentReview,
      completed_date: today,
      questions_done: questionsDone,
      questions_correct: questionsCorrect,
      percentage,
    };

    let nextReviewObj: TopicReview | null = null;
    let nextScheduledDate: string | undefined = undefined;

    // Se o ciclo concluído for menor que 8, agenda o ciclo seguinte (reviewNumber + 1)
    if (currentReview.review_number < 8) {
      const nextReviewNumber = currentReview.review_number + 1;
      const intervalDays = calculateNextReviewInterval(percentage, nextReviewNumber);
      nextScheduledDate = addDaysToDate(today, intervalDays);

      nextReviewObj = {
        id: isDemoMode ? `rev-${Date.now()}-${nextReviewNumber}` : crypto.randomUUID(),
        topic_id: currentReview.topic_id,
        user_id: currentReview.user_id,
        review_number: nextReviewNumber,
        scheduled_date: nextScheduledDate,
        completed_date: null,
        questions_done: null,
        questions_correct: null,
        percentage: null,
        created_at: new Date().toISOString(),
      };
    }

    if (!isDemoMode && user) {
      const supabase = createClient();
      const { error: updErr } = await supabase
        .from('topic_reviews')
        .update({
          completed_date: today,
          questions_done: questionsDone,
          questions_correct: questionsCorrect,
          percentage,
        })
        .eq('id', reviewId);
      if (updErr) throw updErr;

      if (nextReviewObj) {
        const { error: insErr } = await supabase.from('topic_reviews').insert(nextReviewObj);
        if (insErr) throw insErr;
      }
    }

    setReviews(prev => {
      const updated = prev.map(r => (r.id === reviewId ? updatedReview : r));
      return nextReviewObj ? [...updated, nextReviewObj] : updated;
    });

    return { nextReviewDate: nextScheduledDate };
  };

  // AÇÃO 3: Excluir Assunto e suas Revisões
  const deleteTopic = async (topicId: string) => {
    if (!isDemoMode && user) {
      const supabase = createClient();
      const { error } = await supabase.from('study_topics').delete().eq('id', topicId);
      if (error) throw error;
    }

    setTopics(prev => prev.filter(t => t.id !== topicId));
    setReviews(prev => prev.filter(r => r.topic_id !== topicId));
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

    if (!isDemoMode && user) {
      const supabase = createClient();
      const { error } = await supabase.from('mock_exams').insert(newMock);
      if (error) throw error;
    }

    setMockExams(prev => [newMock, ...prev]);
  };

  const deleteMockExam = async (examId: string) => {
    if (!isDemoMode && user) {
      const supabase = createClient();
      const { error } = await supabase.from('mock_exams').delete().eq('id', examId);
      if (error) throw error;
    }

    setMockExams(prev => prev.filter(m => m.id !== examId));
  };

  // AÇÃO 5: Adicionar Prova por Instituição
  const addInstitutionExam = async (data: {
    institution_name: string;
    exam_year: number;
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

    if (!isDemoMode && user) {
      const supabase = createClient();
      const { error } = await supabase.from('institution_exams').insert(newInst);
      if (error) throw error;
    }

    setInstitutionExams(prev => [...prev, newInst]);
  };

  const deleteInstitutionExam = async (examId: string) => {
    if (!isDemoMode && user) {
      const supabase = createClient();
      const { error } = await supabase.from('institution_exams').delete().eq('id', examId);
      if (error) throw error;
    }

    setInstitutionExams(prev => prev.filter(i => i.id !== examId));
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
  };

  const updatePrevalentTopic = async (id: string, data: Partial<PrevalentTopic>) => {
    const updated = prevalentTopics.map(p => (p.id === id ? { ...p, ...data } : p));
    setPrevalentTopics(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.PREVALENT_TOPICS, JSON.stringify(updated));
    }
  };

  const deletePrevalentTopic = async (id: string) => {
    const updated = prevalentTopics.filter(p => p.id !== id);
    setPrevalentTopics(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.PREVALENT_TOPICS, JSON.stringify(updated));
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
  };

  // Estatísticas Dinâmicas Computadas
  const stats = useMemo<UserStats>(() => {
    const today = getTodayDateString();

    // 1. Revisões de Hoje (pendentes com scheduled_date <= today)
    const todayPending = reviews.filter(
      r => !r.completed_date && r.scheduled_date <= today
    );
    const todayReviewsCount = todayPending.length;

    // 2. Ofensiva do Dia (Streak) Qualificada:
    // O estudante só pontua se fizer pelo menos 10 questões no dia OU concluir 1 simulado
    const {
      currentStreak,
      todayQuestionsCount,
      todayMockCompleted,
      streakQualifiedToday,
    } = calculateQualifiedStreak(topics, reviews, mockExams, today);

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
      currentStreak,
      overallAccuracy,
      totalQuestions,
      todayQuestionsCount,
      todayMockCompleted,
      streakQualifiedToday,
      vulnerableArea,
      areaAccuracy: areaStats,
    };
  }, [topics, reviews, mockExams, areas]);

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
        addTopic,
        addPlannedTopic,
        recordPlannedTopicStudy,
        updateTopicWeeklyGoal,
        updatePlannedTopicDate,
        addArea,
        updateArea,
        deleteArea,
        resetDefaultAreas,
        completeReview,
        deleteTopic,
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
