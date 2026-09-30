-- ==============================================================================
-- AdaptiveMed - Migração: Campos do Motor Adaptativo v2, Diagnósticos e Carga
-- Data: 30/09/2026
-- ==============================================================================

-- 1. CAMPOS NA TABELA study_topics
alter table public.study_topics
  add column if not exists initial_duration_minutes integer null,
  add column if not exists base_questions_count integer null default 20;

-- 2. CAMPOS NA TABELA topic_reviews
alter table public.topic_reviews
  add column if not exists duration_minutes integer null,
  add column if not exists recommended_questions integer null default 10,
  add column if not exists previous_interval_days integer null default 7,
  add column if not exists diagnosis text null,
  add column if not exists diagnosis_badge text null,
  add column if not exists pedagogical_note text null;

-- 3. CAMPOS NA TABELA profiles
alter table public.profiles
  add column if not exists workload_config jsonb default '{"maxDailyReviews": 3, "autoRollOver": true}'::jsonb,
  add column if not exists streak_config jsonb default '{"minQuestions": 10, "requireMockExam": false, "requireBoth": false}'::jsonb;

-- 4. Notificar recarregamento do schema cache no PostgREST
notify pgrst, 'reload schema';
