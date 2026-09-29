-- ==============================================================================
-- AdaptiveMed - Migração: Campos do Motor Científico de Repetição Espaçada
-- ==============================================================================

-- 1. BASE DE QUESTÕES NO MODELO DE ASSUNTO
alter table public.study_topics
  add column if not exists base_questions_count integer null default 20;

-- 2. CAMPOS DE RECOMENDAÇÃO E INTERVALOS NAS REVISÕES
alter table public.topic_reviews
  add column if not exists recommended_questions integer null default 10,
  add column if not exists previous_interval_days integer null default 7,
  add column if not exists diagnosis text null;
