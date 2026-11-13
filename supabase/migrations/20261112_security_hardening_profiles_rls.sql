-- ==============================================================================
-- AdaptiveMed - Migração de Segurança: Blindagem de Colunas de Faturamento (profiles)
-- Data: 12/11/2026
-- Objetivo: Impedir que usuários autenticados alterem diretamente via PostgREST/RLS
--           campos sensíveis de assinatura (is_subscribed, subscription_status,
--           stripe_customer_id, stripe_subscription_id, current_period_end,
--           cancel_at_period_end). Apenas service_role / postgres podem modificá-los.
-- ==============================================================================

create or replace function public.protect_profile_billing_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text;
begin
  jwt_role := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    auth.role()
  );

  -- Permite alterações apenas quando executadas pelo backend com service_role
  -- ou por superusuários/roles administrativas do banco (triggers/migrations).
  if jwt_role = 'service_role' or current_user in ('postgres', 'supabase_admin') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.is_subscribed := false;
    new.subscription_status := 'inactive';
    new.stripe_customer_id := null;
    new.stripe_subscription_id := null;
    new.current_period_end := null;
    new.cancel_at_period_end := false;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    new.is_subscribed := old.is_subscribed;
    new.subscription_status := old.subscription_status;
    new.stripe_customer_id := old.stripe_customer_id;
    new.stripe_subscription_id := old.stripe_subscription_id;
    new.current_period_end := old.current_period_end;
    new.cancel_at_period_end := old.cancel_at_period_end;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_profile_billing_columns on public.profiles;
create trigger trg_protect_profile_billing_columns
  before insert or update on public.profiles
  for each row
  execute function public.protect_profile_billing_columns();

-- Garante que o schema cache do PostgREST seja atualizado
notify pgrst, 'reload schema';
