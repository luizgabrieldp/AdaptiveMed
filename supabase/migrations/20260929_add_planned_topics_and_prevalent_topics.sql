-- ==============================================================================
-- AdaptiveMed - Migração: Campos de Planejamento de Estudos e Assuntos Prevalentes
-- ==============================================================================

-- 1. CAMPOS DE PLANEJAMENTO NA TABELA study_topics
alter table public.study_topics
  add column if not exists is_planned boolean default false,
  add column if not exists planned_date date null,
  add column if not exists is_weekly_goal boolean default false,
  add column if not exists notes text null;

create index if not exists idx_study_topics_planned 
  on public.study_topics(user_id, is_planned, planned_date);

-- 2. TABELA DE ASSUNTOS PREVALENTES DA BANCA (prevalent_topics)
create table if not exists public.prevalent_topics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  area text not null,
  subject_name text not null,
  prevalence_level text not null check (prevalence_level in ('ALTA', 'MEDIA', 'BAIXA')),
  rank_order integer not null default 1,
  banca text null,
  frequency_notes text null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.prevalent_topics enable row level security;

create policy "Usuários podem gerenciar seus próprios assuntos prevalentes - SELECT"
  on public.prevalent_topics for select
  using (auth.uid() = user_id);

create policy "Usuários podem gerenciar seus próprios assuntos prevalentes - INSERT"
  on public.prevalent_topics for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem gerenciar seus próprios assuntos prevalentes - UPDATE"
  on public.prevalent_topics for update
  using (auth.uid() = user_id);

create policy "Usuários podem gerenciar seus próprios assuntos prevalentes - DELETE"
  on public.prevalent_topics for delete
  using (auth.uid() = user_id);

create index if not exists idx_prevalent_topics_user on public.prevalent_topics(user_id);
create index if not exists idx_prevalent_topics_rank on public.prevalent_topics(user_id, rank_order);
