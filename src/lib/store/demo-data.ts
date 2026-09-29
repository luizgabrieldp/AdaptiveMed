import {
  StudyTopic,
  TopicReview,
  MockExam,
  InstitutionExam,
  Profile,
  PrevalentTopic,
} from '@/types/database';
import { getTodayDateString, addDaysToDate } from '@/lib/spaced-repetition';

export const INITIAL_DEMO_PROFILE: Profile = {
  id: 'demo-user-id',
  full_name: 'Dr. Lucas Medeiros',
  target_specialty: 'Cardiologia',
  target_exams: ['USP-SP', 'ENARE', 'UNICAMP', 'SUS-SP'],
  target_cutoff_percentage: 82.0,
  target_year: 2026,
  onboarding_completed: true,
  is_subscribed: true,
  subscription_status: 'active',
  created_at: new Date().toISOString(),
};

export function getInitialDemoTopics(): StudyTopic[] {
  const today = getTodayDateString();
  return [
    {
      id: 'topic-1',
      user_id: 'demo-user-id',
      area: 'Clínica Médica',
      subject_name: 'Pneumonia Adquirida na Comunidade (PAC)',
      initial_date: addDaysToDate(today, -35),
      initial_questions: 30,
      initial_correct: 25,
      initial_percentage: 83.3,
      created_at: addDaysToDate(today, -35),
    },
    {
      id: 'topic-2',
      user_id: 'demo-user-id',
      area: 'Cirurgia Geral',
      subject_name: 'Apendicite Aguda e Abdome Agudo Inflamatório',
      initial_date: addDaysToDate(today, -28),
      initial_questions: 25,
      initial_correct: 21,
      initial_percentage: 84.0,
      created_at: addDaysToDate(today, -28),
    },
    {
      id: 'topic-3',
      user_id: 'demo-user-id',
      area: 'Pediatria',
      subject_name: 'Bronquiolite Viral Aguda e Crises Asmáticas',
      initial_date: addDaysToDate(today, -20),
      initial_questions: 20,
      initial_correct: 13,
      initial_percentage: 65.0,
      created_at: addDaysToDate(today, -20),
    },
    {
      id: 'topic-4',
      user_id: 'demo-user-id',
      area: 'Ginecologia e Obstetrícia',
      subject_name: 'Hemorragias da 1ª Metade da Gravidez (Abortamento, Ectópica, Mola)',
      initial_date: addDaysToDate(today, -15),
      initial_questions: 35,
      initial_correct: 24,
      initial_percentage: 68.6,
      created_at: addDaysToDate(today, -15),
    },
    {
      id: 'topic-5',
      user_id: 'demo-user-id',
      area: 'Medicina Preventiva',
      subject_name: 'Estudos Epidemiológicos e Testes Diagnósticos (Sensibilidade, Especificidade, VPP, VPN)',
      initial_date: addDaysToDate(today, -10),
      initial_questions: 25,
      initial_correct: 14,
      initial_percentage: 56.0,
      created_at: addDaysToDate(today, -10),
    },
    {
      id: 'topic-6',
      user_id: 'demo-user-id',
      area: 'Clínica Médica',
      subject_name: 'Insuficiência Cardíaca com Fração de Ejeção Reduzida (ICFER)',
      initial_date: addDaysToDate(today, -5),
      initial_questions: 40,
      initial_correct: 36,
      initial_percentage: 90.0,
      created_at: addDaysToDate(today, -5),
    },
    {
      id: 'topic-7',
      user_id: 'demo-user-id',
      area: 'Cirurgia Geral',
      subject_name: 'Trauma Torácico e Abdominal (ATLS 10ª Ed)',
      initial_date: addDaysToDate(today, -2),
      initial_questions: 30,
      initial_correct: 20,
      initial_percentage: 66.7,
      created_at: addDaysToDate(today, -2),
    },
    {
      id: 'topic-8',
      user_id: 'demo-user-id',
      area: 'Clínica Médica',
      subject_name: 'Diabetes Mellitus: Diagnóstico e Manejo Ambulatorial',
      initial_date: today,
      planned_date: today,
      initial_questions: 0,
      initial_correct: 0,
      initial_percentage: 0,
      is_planned: true,
      is_weekly_goal: true,
      created_at: today,
    },
    {
      id: 'topic-9',
      user_id: 'demo-user-id',
      area: 'Pediatria',
      subject_name: 'Calendário Nacional de Vacinação do PNI',
      initial_date: addDaysToDate(today, 2),
      planned_date: addDaysToDate(today, 2),
      initial_questions: 0,
      initial_correct: 0,
      initial_percentage: 0,
      is_planned: true,
      is_weekly_goal: true,
      created_at: today,
    },
  ];
}

export function getInitialDemoReviews(): TopicReview[] {
  const today = getTodayDateString();
  return [
    // topic-1 (Pneumonia): R1 feita, R2 agendada para HOJE!
    {
      id: 'rev-1-1',
      topic_id: 'topic-1',
      user_id: 'demo-user-id',
      review_number: 1,
      scheduled_date: addDaysToDate(today, -12),
      completed_date: addDaysToDate(today, -12),
      questions_done: 20,
      questions_correct: 18,
      percentage: 90.0,
      created_at: addDaysToDate(today, -35),
    },
    {
      id: 'rev-1-2',
      topic_id: 'topic-1',
      user_id: 'demo-user-id',
      review_number: 2,
      scheduled_date: today, // HOJE
      completed_date: null,
      questions_done: null,
      questions_correct: null,
      percentage: null,
      created_at: addDaysToDate(today, -12),
    },

    // topic-2 (Apendicite): R1 feita, R2 agendada para HOJE!
    {
      id: 'rev-2-1',
      topic_id: 'topic-2',
      user_id: 'demo-user-id',
      review_number: 1,
      scheduled_date: addDaysToDate(today, -5),
      completed_date: addDaysToDate(today, -5),
      questions_done: 25,
      questions_correct: 22,
      percentage: 88.0,
      created_at: addDaysToDate(today, -28),
    },
    {
      id: 'rev-2-2',
      topic_id: 'topic-2',
      user_id: 'demo-user-id',
      review_number: 2,
      scheduled_date: today, // HOJE
      completed_date: null,
      questions_done: null,
      questions_correct: null,
      percentage: null,
      created_at: addDaysToDate(today, -5),
    },

    // topic-3 (Bronquiolite): R1 atrasada por 2 dias!
    {
      id: 'rev-3-1',
      topic_id: 'topic-3',
      user_id: 'demo-user-id',
      review_number: 1,
      scheduled_date: addDaysToDate(today, -2), // ATRASADA
      completed_date: null,
      questions_done: null,
      questions_correct: null,
      percentage: null,
      created_at: addDaysToDate(today, -20),
    },

    // topic-4 (Hemorragias da 1ª metade): R1 atrasada por 1 dia!
    {
      id: 'rev-4-1',
      topic_id: 'topic-4',
      user_id: 'demo-user-id',
      review_number: 1,
      scheduled_date: addDaysToDate(today, -1), // ATRASADA
      completed_date: null,
      questions_done: null,
      questions_correct: null,
      percentage: null,
      created_at: addDaysToDate(today, -15),
    },

    // topic-5 (Preventiva): R1 programada para daqui a 3 dias
    {
      id: 'rev-5-1',
      topic_id: 'topic-5',
      user_id: 'demo-user-id',
      review_number: 1,
      scheduled_date: addDaysToDate(today, 3), // PROGRAMADO
      completed_date: null,
      questions_done: null,
      questions_correct: null,
      percentage: null,
      created_at: addDaysToDate(today, -10),
    },

    // topic-6 (ICFER): R1 programada para daqui a 18 dias
    {
      id: 'rev-6-1',
      topic_id: 'topic-6',
      user_id: 'demo-user-id',
      review_number: 1,
      scheduled_date: addDaysToDate(today, 18), // PROGRAMADO
      completed_date: null,
      questions_done: null,
      questions_correct: null,
      percentage: null,
      created_at: addDaysToDate(today, -5),
    },

    // topic-7 (Trauma): R1 programada para daqui a 11 dias
    {
      id: 'rev-7-1',
      topic_id: 'topic-7',
      user_id: 'demo-user-id',
      review_number: 1,
      scheduled_date: addDaysToDate(today, 11), // PROGRAMADO
      completed_date: null,
      questions_done: null,
      questions_correct: null,
      percentage: null,
      created_at: addDaysToDate(today, -2),
    },
  ];
}

export function getInitialDemoMockExams(): MockExam[] {
  const today = getTodayDateString();
  return [
    {
      id: 'mock-1',
      user_id: 'demo-user-id',
      exam_name: 'Simulado Diagnóstico Inicial Residência',
      exam_date: addDaysToDate(today, -75),
      total_questions: 100,
      correct_answers: 64,
      score_percentage: 64.0,
      created_at: addDaysToDate(today, -75),
    },
    {
      id: 'mock-2',
      user_id: 'demo-user-id',
      exam_name: 'Simulado Nacional ENARE - Etapa 01',
      exam_date: addDaysToDate(today, -50),
      total_questions: 100,
      correct_answers: 73,
      score_percentage: 73.0,
      created_at: addDaysToDate(today, -50),
    },
    {
      id: 'mock-3',
      user_id: 'demo-user-id',
      exam_name: 'Simulado Geral Paulistas (USP / UNICAMP)',
      exam_date: addDaysToDate(today, -25),
      total_questions: 120,
      correct_answers: 95,
      score_percentage: 79.2,
      created_at: addDaysToDate(today, -25),
    },
    {
      id: 'mock-4',
      user_id: 'demo-user-id',
      exam_name: 'Simulado R1 Consolidado 2026',
      exam_date: addDaysToDate(today, -5),
      total_questions: 100,
      correct_answers: 86,
      score_percentage: 86.0,
      created_at: addDaysToDate(today, -5),
    },
  ];
}

export function getInitialDemoInstitutionExams(): InstitutionExam[] {
  const today = getTodayDateString();
  return [
    // USP-SP
    { id: 'inst-1', user_id: 'demo-user-id', institution_name: 'USP-SP', exam_year: 2021, score_percentage: 71.5, created_at: today },
    { id: 'inst-2', user_id: 'demo-user-id', institution_name: 'USP-SP', exam_year: 2022, score_percentage: 75.0, created_at: today },
    { id: 'inst-3', user_id: 'demo-user-id', institution_name: 'USP-SP', exam_year: 2023, score_percentage: 79.0, created_at: today },
    { id: 'inst-4', user_id: 'demo-user-id', institution_name: 'USP-SP', exam_year: 2024, score_percentage: 82.5, created_at: today },
    { id: 'inst-5', user_id: 'demo-user-id', institution_name: 'USP-SP', exam_year: 2025, score_percentage: 85.0, created_at: today },

    // ENARE
    { id: 'inst-6', user_id: 'demo-user-id', institution_name: 'ENARE', exam_year: 2021, score_percentage: 74.0, created_at: today },
    { id: 'inst-7', user_id: 'demo-user-id', institution_name: 'ENARE', exam_year: 2022, score_percentage: 77.5, created_at: today },
    { id: 'inst-8', user_id: 'demo-user-id', institution_name: 'ENARE', exam_year: 2023, score_percentage: 81.0, created_at: today },
    { id: 'inst-9', user_id: 'demo-user-id', institution_name: 'ENARE', exam_year: 2024, score_percentage: 84.0, created_at: today },
    { id: 'inst-10', user_id: 'demo-user-id', institution_name: 'ENARE', exam_year: 2025, score_percentage: 87.5, created_at: today },

    // UNICAMP
    { id: 'inst-11', user_id: 'demo-user-id', institution_name: 'UNICAMP', exam_year: 2021, score_percentage: 68.0, created_at: today },
    { id: 'inst-12', user_id: 'demo-user-id', institution_name: 'UNICAMP', exam_year: 2022, score_percentage: 73.0, created_at: today },
    { id: 'inst-13', user_id: 'demo-user-id', institution_name: 'UNICAMP', exam_year: 2023, score_percentage: 77.5, created_at: today },
    { id: 'inst-14', user_id: 'demo-user-id', institution_name: 'UNICAMP', exam_year: 2024, score_percentage: 81.0, created_at: today },
    { id: 'inst-15', user_id: 'demo-user-id', institution_name: 'UNICAMP', exam_year: 2025, score_percentage: 84.5, created_at: today },

    // SUS-SP
    { id: 'inst-16', user_id: 'demo-user-id', institution_name: 'SUS-SP', exam_year: 2022, score_percentage: 73.0, created_at: today },
    { id: 'inst-17', user_id: 'demo-user-id', institution_name: 'SUS-SP', exam_year: 2023, score_percentage: 78.0, created_at: today },
    { id: 'inst-18', user_id: 'demo-user-id', institution_name: 'SUS-SP', exam_year: 2024, score_percentage: 82.0, created_at: today },
    { id: 'inst-19', user_id: 'demo-user-id', institution_name: 'SUS-SP', exam_year: 2025, score_percentage: 86.0, created_at: today },
  ];
}

export function getInitialDemoPrevalentTopics(): PrevalentTopic[] {
  const today = getTodayDateString();
  return [
    // Clínica Médica
    {
      id: 'prev-1',
      area: 'Clínica Médica',
      subject_name: 'Hipertensão Arterial Sistêmica e Crise Hipertensiva',
      prevalence_level: 'ALTA',
      rank_order: 1,
      banca: 'ENARE / USP',
      frequency_notes: 'Tema recorrente em todas as edições (estratificação e conduta)',
      created_at: today,
    },
    {
      id: 'prev-2',
      area: 'Clínica Médica',
      subject_name: 'Diabetes Mellitus: Critérios Diagnósticos e Metas Terapêuticas',
      prevalence_level: 'ALTA',
      rank_order: 2,
      banca: 'USP / UNICAMP',
      frequency_notes: 'Foco em novas classes de hipoglicemiantes (iSGLT2 e GLP-1)',
      created_at: today,
    },
    {
      id: 'prev-3',
      area: 'Clínica Médica',
      subject_name: 'Síndrome Coronariana Aguda (com e sem supra de ST)',
      prevalence_level: 'ALTA',
      rank_order: 3,
      banca: 'Todas as Bancas',
      frequency_notes: 'Tempo porta-balão, ECG e terapia antitrombótica',
      created_at: today,
    },
    {
      id: 'prev-4',
      area: 'Clínica Médica',
      subject_name: 'Pneumonia Adquirida na Comunidade (PAC) e Escore CURB-65',
      prevalence_level: 'MEDIA',
      rank_order: 4,
      banca: 'SUS-SP / ENARE',
      frequency_notes: 'Critérios de internação e antibioticoterapia empírica',
      created_at: today,
    },

    // Cirurgia Geral
    {
      id: 'prev-5',
      area: 'Cirurgia Geral',
      subject_name: 'Abdome Agudo Inflamatório: Apendicite Aguda',
      prevalence_level: 'ALTA',
      rank_order: 1,
      banca: 'Todas as Bancas',
      frequency_notes: 'Diagnóstico clínico vs tomográfico e conduta operatória',
      created_at: today,
    },
    {
      id: 'prev-6',
      area: 'Cirurgia Geral',
      subject_name: 'Trauma Torácico e Abdominal (ATLS 10ª Edição)',
      prevalence_level: 'ALTA',
      rank_order: 2,
      banca: 'USP / ENARE',
      frequency_notes: 'Indicações de FAST, laparotomia de emergência e drenagem de tórax',
      created_at: today,
    },
    {
      id: 'prev-7',
      area: 'Cirurgia Geral',
      subject_name: 'Doença Litiásica Biliar: Colecistite e Coledocolitíase',
      prevalence_level: 'MEDIA',
      rank_order: 3,
      banca: 'UNICAMP / SUS-SP',
      frequency_notes: 'Critérios de Tokyo, momento cirúrgico e CPRE',
      created_at: today,
    },

    // Pediatria
    {
      id: 'prev-8',
      area: 'Pediatria',
      subject_name: 'Calendário Nacional de Imunização e Vacinação Infantil',
      prevalence_level: 'ALTA',
      rank_order: 1,
      banca: 'ENARE / SUS-SP',
      frequency_notes: 'Esquemas vacinais, eventos adversos e contraindicações',
      created_at: today,
    },
    {
      id: 'prev-9',
      area: 'Pediatria',
      subject_name: 'Bronquiolite Viral Aguda e Crises de Asma na Infância',
      prevalence_level: 'ALTA',
      rank_order: 2,
      banca: 'USP / UNICAMP',
      frequency_notes: 'Manejo oxigenoterapia de suporte e broncodilatadores',
      created_at: today,
    },
    {
      id: 'prev-10',
      area: 'Pediatria',
      subject_name: 'Diarreia Aguda e Terapia de Reidratação Oral (Planos A, B e C)',
      prevalence_level: 'MEDIA',
      rank_order: 3,
      banca: 'Todas as Bancas',
      frequency_notes: 'Reidratação endovenosa rápida e uso de zinco',
      created_at: today,
    },

    // Ginecologia e Obstetrícia
    {
      id: 'prev-11',
      area: 'Ginecologia e Obstetrícia',
      subject_name: 'Síndromes Hipertensivas da Gestação (Pré-eclâmpsia e Eclâmpsia)',
      prevalence_level: 'ALTA',
      rank_order: 1,
      banca: 'Todas as Bancas',
      frequency_notes: 'Uso de Sulfato de Magnésio (Zuspan/Pritchard) e anti-hipertensivos',
      created_at: today,
    },
    {
      id: 'prev-12',
      area: 'Ginecologia e Obstetrícia',
      subject_name: 'Hemorragias da Primeira Metade da Gestação',
      prevalence_level: 'ALTA',
      rank_order: 2,
      banca: 'USP / ENARE',
      frequency_notes: 'Diagnóstico diferencial: Abortamento, Gravidez Ectópica e Mola',
      created_at: today,
    },
    {
      id: 'prev-13',
      area: 'Ginecologia e Obstetrícia',
      subject_name: 'Rastreamento de Câncer de Colo Uterino e Mama',
      prevalence_level: 'MEDIA',
      rank_order: 3,
      banca: 'SUS-SP / UNICAMP',
      frequency_notes: 'Diretrizes do Ministério da Saúde / INCA',
      created_at: today,
    },

    // Medicina Preventiva
    {
      id: 'prev-14',
      area: 'Medicina Preventiva',
      subject_name: 'Estudos Epidemiológicos: Coorte, Caso-Controle e Ensaio Clínico',
      prevalence_level: 'ALTA',
      rank_order: 1,
      banca: 'Todas as Bancas',
      frequency_notes: 'Vieses, cálculo de Risco Relativo e Odds Ratio',
      created_at: today,
    },
    {
      id: 'prev-15',
      area: 'Medicina Preventiva',
      subject_name: 'Testes Diagnósticos: Sensibilidade, Especificidade, VPP e VPN',
      prevalence_level: 'ALTA',
      rank_order: 2,
      banca: 'ENARE / USP',
      frequency_notes: 'Influência da prevalência nos valores preditivos',
      created_at: today,
    },
    {
      id: 'prev-16',
      area: 'Medicina Preventiva',
      subject_name: 'Sistema Único de Saúde (SUS): Princípios, Leis 8.080 e 8.142',
      prevalence_level: 'ALTA',
      rank_order: 3,
      banca: 'Todas as Bancas',
      frequency_notes: 'Universalidade, equidade, integralidade e controle social',
      created_at: today,
    },
  ];
}

