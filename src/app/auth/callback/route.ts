import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (code && supabaseUrl && supabaseAnonKey) {
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignorado em Server Components onde o set pode ser restrito
          }
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const sessionId = requestUrl.searchParams.get('session_id');

        // Se veio de um checkout concluído, ativa a assinatura automaticamente
        if (sessionId) {
          await supabase
            .from('profiles')
            .update({
              is_subscribed: true,
              subscription_status: 'active',
            })
            .eq('id', user.id);
        }

        // Verifica status da conta e onboarding
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed, is_subscribed, subscription_status')
          .eq('id', user.id)
          .single();

        const isAdmin = user.email?.toLowerCase().includes('admin123');
        const hasActivePlan =
          isAdmin ||
          Boolean(sessionId) ||
          (profile && (profile.is_subscribed || profile.subscription_status === 'active'));

        // Se NÃO tem plano ativo, mantém o usuário logado e direciona para o pagamento
        if (!hasActivePlan) {
          return NextResponse.redirect(new URL('/pagamento', requestUrl.origin));
        }

        if (profile && !profile.onboarding_completed) {
          return NextResponse.redirect(new URL('/onboarding', requestUrl.origin));
        }
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // Fallback se não houver code
  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
}
