-- ==============================================================================
-- AdaptiveMed - Migração: Suporte a Provas Semestrais (exam_year texto) e Configuração da Ofensiva
-- ==============================================================================

-- 1. Permite ano de provas institucionais em formato textual (ex: '2024', '24.1', '24.2', '2024.1')
alter table public.institution_exams
  alter column exam_year type text using exam_year::text;

-- 2. Permite streak_config no perfil do usuário
alter table public.profiles
  add column if not exists streak_config jsonb default '{"minDailyQuestions": 10, "ruleType": "questions_or_mock"}';

-- 3. Garante que qualquer restrição residual de área em study_topics seja removida para áreas customizadas
alter table public.study_topics
  drop constraint if exists study_topics_area_check;
