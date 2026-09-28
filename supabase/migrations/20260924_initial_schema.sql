-- ==============================================================================
-- AdaptiveMed - Schema de Banco de Dados PostgreSQL (Supabase) com RLS Estrito
-- ==============================================================================

-- 1. TABELA DE PERFIS DE USUÁRIOS
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null default '',
  target_specialty text not null default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Usuários podem visualizar o seu próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuários podem atualizar o seu próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Usuários podem inserir o seu próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Trigger para criar perfil automaticamente no cadastro
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, target_specialty)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'target_specialty', '')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. TABELA DE ASSUNTOS ESTUDADOS (study_topics)
create table if not exists public.study_topics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  area text not null check (area in (
    'Clínica Médica',
    'Cirurgia Geral',
    'Pediatria',
    'Ginecologia e Obstetrícia',
    'Medicina Preventiva'
  )),
  subject_name text not null,
  initial_date date not null default current_date,
  initial_questions integer not null default 0,
  initial_correct integer not null default 0,
  initial_percentage numeric(5,2) not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.study_topics enable row level security;

create policy "Isolamento total por usuário em study_topics - SELECT"
  on public.study_topics for select
  using (auth.uid() = user_id);

create policy "Isolamento total por usuário em study_topics - INSERT"
  on public.study_topics for insert
  with check (auth.uid() = user_id);

create policy "Isolamento total por usuário em study_topics - UPDATE"
  on public.study_topics for update
  using (auth.uid() = user_id);

create policy "Isolamento total por usuário em study_topics - DELETE"
  on public.study_topics for delete
  using (auth.uid() = user_id);

-- Índices para performance
create index if not exists idx_study_topics_user on public.study_topics(user_id);
create index if not exists idx_study_topics_area on public.study_topics(user_id, area);

-- 3. TABELA DE CICLOS DE REVISÃO DO ASSUNTO (topic_reviews)
create table if not exists public.topic_reviews (
  id uuid default gen_random_uuid() primary key,
  topic_id uuid references public.study_topics(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  review_number integer not null check (review_number >= 1 and review_number <= 8),
  scheduled_date date not null,
  completed_date date null,
  questions_done integer null,
  questions_correct integer null,
  percentage numeric(5,2) null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.topic_reviews enable row level security;

create policy "Isolamento total por usuário em topic_reviews - SELECT"
  on public.topic_reviews for select
  using (auth.uid() = user_id);

create policy "Isolamento total por usuário em topic_reviews - INSERT"
  on public.topic_reviews for insert
  with check (auth.uid() = user_id);

create policy "Isolamento total por usuário em topic_reviews - UPDATE"
  on public.topic_reviews for update
  using (auth.uid() = user_id);

create policy "Isolamento total por usuário em topic_reviews - DELETE"
  on public.topic_reviews for delete
  using (auth.uid() = user_id);

-- Índices para performance
create index if not exists idx_topic_reviews_user on public.topic_reviews(user_id);
create index if not exists idx_topic_reviews_topic on public.topic_reviews(topic_id);
create index if not exists idx_topic_reviews_scheduled on public.topic_reviews(user_id, scheduled_date);

-- 4. TABELA DE SIMULADOS GERAIS (mock_exams)
create table if not exists public.mock_exams (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  exam_name text not null,
  exam_date date not null default current_date,
  total_questions integer not null default 100,
  correct_answers integer not null default 0,
  score_percentage numeric(5,2) not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.mock_exams enable row level security;

create policy "Isolamento total por usuário em mock_exams - SELECT"
  on public.mock_exams for select
  using (auth.uid() = user_id);

create policy "Isolamento total por usuário em mock_exams - INSERT"
  on public.mock_exams for insert
  with check (auth.uid() = user_id);

create policy "Isolamento total por usuário em mock_exams - UPDATE"
  on public.mock_exams for update
  using (auth.uid() = user_id);

create policy "Isolamento total por usuário em mock_exams - DELETE"
  on public.mock_exams for delete
  using (auth.uid() = user_id);

create index if not exists idx_mock_exams_user on public.mock_exams(user_id);

-- 5. TABELA DE PROVAS NA ÍNTEGRA POR INSTITUIÇÃO (institution_exams)
create table if not exists public.institution_exams (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  institution_name text not null,
  exam_year integer not null,
  score_percentage numeric(5,2) not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.institution_exams enable row level security;

create policy "Isolamento total por usuário em institution_exams - SELECT"
  on public.institution_exams for select
  using (auth.uid() = user_id);

create policy "Isolamento total por usuário em institution_exams - INSERT"
  on public.institution_exams for insert
  with check (auth.uid() = user_id);

create policy "Isolamento total por usuário em institution_exams - UPDATE"
  on public.institution_exams for update
  using (auth.uid() = user_id);

create policy "Isolamento total por usuário em institution_exams - DELETE"
  on public.institution_exams for delete
  using (auth.uid() = user_id);

create index if not exists idx_institution_exams_user on public.institution_exams(user_id);
create index if not exists idx_institution_exams_inst on public.institution_exams(user_id, institution_name);
