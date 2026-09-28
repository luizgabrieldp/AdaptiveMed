-- ==============================================================================
-- AdaptiveMed - Migração: Campos de Assinatura e Controle de Acesso
-- ==============================================================================

alter table public.profiles
  add column if not exists is_subscribed boolean default false,
  add column if not exists subscription_status text default 'inactive',
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

-- Cria índice para pesquisas rápidas de status de assinatura
create index if not exists idx_profiles_subscription_status on public.profiles(subscription_status);
