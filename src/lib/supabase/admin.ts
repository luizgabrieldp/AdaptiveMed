import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente administrativo Supabase usando SUPABASE_SERVICE_ROLE_KEY.
 * Uso exclusivo em Route Handlers / Webhooks do servidor para operações
 * privilegiadas (ex: atualização de colunas de faturamento em public.profiles).
 */
export function createAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias no servidor.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
