-- ==============================================================================
-- AdaptiveMed - Sessões de Estudo Cronometradas & Floresta de Foco (study_sessions)
-- Data: 13/11/2026
-- ==============================================================================

create table if not exists public.study_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  topic_id uuid references public.study_topics(id) on delete set null,
  area text not null,
  subject_name text null,
  mode text not null check (mode in ('pomodoro', 'stopwatch')),
  status text not null default 'completed' check (status in ('completed', 'withered')),
  duration_seconds integer not null check (duration_seconds >= 0),
  planned_seconds integer null,
  trees_earned integer not null default 0 check (trees_earned >= 0),
  session_date date not null,
  started_at timestamp with time zone not null,
  ended_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.study_sessions enable row level security;

create policy "Isolamento total por usuário em study_sessions - SELECT"
  on public.study_sessions for select
  using (auth.uid() = user_id);

create policy "Isolamento total por usuário em study_sessions - INSERT"
  on public.study_sessions for insert
  with check (auth.uid() = user_id);

create policy "Isolamento total por usuário em study_sessions - UPDATE"
  on public.study_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Isolamento total por usuário em study_sessions - DELETE"
  on public.study_sessions for delete
  using (auth.uid() = user_id);

create index if not exists idx_study_sessions_user_date on public.study_sessions(user_id, session_date);
create index if not exists idx_study_sessions_user_created on public.study_sessions(user_id, created_at desc);

notify pgrst, 'reload schema';
