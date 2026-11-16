-- ==============================================================================
-- AdaptiveMed - Migração de Segurança: Hardening de Funções SQL e Políticas RLS
-- Data: 16/11/2026
-- Objetivo:
--   1. Definir public.has_active_subscription(uid uuid) com SECURITY DEFINER e
--      search_path fixo (public), evitando hijacking de search_path e enumeração.
--   2. Atualizar public.handle_new_user() com SECURITY DEFINER, search_path fixo
--      (public) e ON CONFLICT (id) DO NOTHING para idempotência no cadastro.
--   3. Recriar políticas FOR UPDATE explícitas com WITH CHECK (auth.uid() = user_id)
--      para study_topics, topic_reviews, mock_exams, institution_exams e
--      prevalent_topics, prevenindo transferência lateral de user_id via UPDATE.
-- ==============================================================================

-- 1. Função segura para checagem de assinatura ativa
create or replace function public.has_active_subscription(uid uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  jwt_role text;
begin
  if uid is null then
    return false;
  end if;

  jwt_role := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    auth.role()
  );

  if jwt_role is distinct from 'service_role'
     and current_user not in ('postgres', 'supabase_admin')
     and uid is distinct from auth.uid() then
    return false;
  end if;

  return exists (
    select 1
    from public.profiles p
    where p.id = uid
      and (
        coalesce(p.is_subscribed, false) = true
        or p.subscription_status in ('active', 'trial')
      )
  );
end;
$$;

revoke all on function public.has_active_subscription(uuid) from public, anon, authenticated;
grant execute on function public.has_active_subscription(uuid) to authenticated, service_role;

-- 2. Trigger function handle_new_user() com search_path fixo e idempotência
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Políticas FOR UPDATE explícitas com WITH CHECK (auth.uid() = user_id)

-- 3.1 study_topics
drop policy if exists "Isolamento total por usuário em study_topics - UPDATE" on public.study_topics;
create policy "Isolamento total por usuário em study_topics - UPDATE"
  on public.study_topics for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3.2 topic_reviews
drop policy if exists "Isolamento total por usuário em topic_reviews - UPDATE" on public.topic_reviews;
create policy "Isolamento total por usuário em topic_reviews - UPDATE"
  on public.topic_reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3.3 mock_exams
drop policy if exists "Isolamento total por usuário em mock_exams - UPDATE" on public.mock_exams;
create policy "Isolamento total por usuário em mock_exams - UPDATE"
  on public.mock_exams for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3.4 institution_exams
drop policy if exists "Isolamento total por usuário em institution_exams - UPDATE" on public.institution_exams;
create policy "Isolamento total por usuário em institution_exams - UPDATE"
  on public.institution_exams for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3.5 prevalent_topics
drop policy if exists "Usuários podem gerenciar seus próprios assuntos prevalentes - UPDATE" on public.prevalent_topics;
create policy "Usuários podem gerenciar seus próprios assuntos prevalentes - UPDATE"
  on public.prevalent_topics for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. Recarrega schema cache do PostgREST
notify pgrst, 'reload schema';
