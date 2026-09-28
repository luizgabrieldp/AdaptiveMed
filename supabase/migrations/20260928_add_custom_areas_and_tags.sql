-- ==============================================================================
-- AdaptiveMed - Migração: Grandes Áreas Customizáveis e Subáreas (Tags)
-- ==============================================================================

-- 1. Permite custom_areas no perfil do usuário
alter table public.profiles
  add column if not exists custom_areas jsonb default '[]';

-- 2. Permite tags (subáreas) nos tópicos de estudo
alter table public.study_topics
  add column if not exists tags text[] default '{}';

-- 3. Cria índice para buscas rápidas por tag
create index if not exists idx_study_topics_tags on public.study_topics using gin(tags);
