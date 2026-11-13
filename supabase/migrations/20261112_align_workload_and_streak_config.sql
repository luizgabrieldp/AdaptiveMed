-- ==============================================================================
-- AdaptiveMed - Migração de Higiene: Alinhamento de workload_config e streak_config
-- Data: 12/11/2026
-- Objetivo: Alinhar os defaults e payloads de workload_config e streak_config em
--           public.profiles com a tipagem oficial em src/types/database.ts.
-- ==============================================================================

-- 1. Atualiza os valores default das colunas JSONB em public.profiles
alter table public.profiles
  alter column workload_config
    set default '{"maxDailyReviews": 3, "maxDailyOverdue": 2, "maxDailyNewTopics": 1}'::jsonb;

alter table public.profiles
  alter column streak_config
    set default '{"minDailyQuestions": 10, "ruleType": "questions_or_mock"}'::jsonb;

-- 2. Migra registros legados de workload_config que possuam chaves antigas (autoRollOver)
update public.profiles
set workload_config = jsonb_build_object(
  'maxDailyReviews', coalesce((workload_config->>'maxDailyReviews')::int, 3),
  'maxDailyOverdue', coalesce((workload_config->>'maxDailyOverdue')::int, 2),
  'maxDailyNewTopics', coalesce((workload_config->>'maxDailyNewTopics')::int, 1)
)
where workload_config is null
   or not (workload_config ? 'maxDailyOverdue')
   or not (workload_config ? 'maxDailyNewTopics')
   or (workload_config ? 'autoRollOver');

-- 3. Migra registros legados de streak_config que possuam chaves antigas (minQuestions/requireMockExam/requireBoth)
update public.profiles
set streak_config = jsonb_build_object(
  'minDailyQuestions', coalesce(
    (streak_config->>'minDailyQuestions')::int,
    (streak_config->>'minQuestions')::int,
    10
  ),
  'ruleType', coalesce(
    streak_config->>'ruleType',
    case
      when coalesce((streak_config->>'requireBoth')::boolean, false) then 'questions_and_mock'
      when coalesce((streak_config->>'requireMockExam')::boolean, false) then 'mock_only'
      else 'questions_or_mock'
    end
  )
)
where streak_config is null
   or not (streak_config ? 'minDailyQuestions')
   or not (streak_config ? 'ruleType')
   or (streak_config ? 'minQuestions');

-- 4. Recarrega o schema cache do PostgREST
notify pgrst, 'reload schema';
