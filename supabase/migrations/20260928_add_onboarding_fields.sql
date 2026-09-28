-- ==============================================================================
-- AdaptiveMed - Migração: Campos de Onboarding e Personalização de Metas
-- ==============================================================================

-- Adiciona campos de provas-alvo, nota de corte personalizada e ano do concurso
alter table public.profiles
  add column if not exists target_exams text[] default '{}',
  add column if not exists target_cutoff_percentage numeric(5,2) default 80.0,
  add column if not exists target_year integer default 2026,
  add column if not exists onboarding_completed boolean default false;

-- Atualiza a função do trigger para novos cadastros
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    full_name,
    target_specialty,
    target_exams,
    target_cutoff_percentage,
    target_year,
    onboarding_completed
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'target_specialty', ''),
    '{}',
    80.0,
    2026,
    false
  );
  return new;
end;
$$ language plpgsql security definer;
