-- ==============================================================================
-- AdaptiveMed - Migração: Controle de Cancelamento e Ciclo de Assinatura
-- ==============================================================================

alter table public.profiles
  add column if not exists cancel_at_period_end boolean default false,
  add column if not exists current_period_end timestamptz;
