-- ==============================================================================
-- AdaptiveMed - Caderno de Erros Estruturado (error_logs) com RLS Estrito
-- Data: 13/11/2026
-- ==============================================================================

create table if not exists public.error_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  topic_id uuid references public.study_topics(id) on delete cascade not null,
  review_id uuid references public.topic_reviews(id) on delete set null,
  cause text not null check (
    cause in (
      'Lacuna teórica',
      'Interpretação',
      'Pegadinha da banca',
      'Distração'
    )
  ),
  concept_summary text not null,
  question_ref text null,
  is_reviewed boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.error_logs enable row level security;

create policy "Isolamento total por usuário em error_logs - SELECT"
  on public.error_logs for select
  using (auth.uid() = user_id);

create policy "Isolamento total por usuário em error_logs - INSERT"
  on public.error_logs for insert
  with check (auth.uid() = user_id);

create policy "Isolamento total por usuário em error_logs - UPDATE"
  on public.error_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Isolamento total por usuário em error_logs - DELETE"
  on public.error_logs for delete
  using (auth.uid() = user_id);

create index if not exists idx_error_logs_user on public.error_logs(user_id);
create index if not exists idx_error_logs_topic on public.error_logs(user_id, topic_id);
create index if not exists idx_error_logs_reviewed on public.error_logs(user_id, is_reviewed);

-- Recarrega schema cache do PostgREST
notify pgrst, 'reload schema';
