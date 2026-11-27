import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function sanitizeRedirectPath(rawNext: string | null): string {
  if (!rawNext) return '/dashboard';
  // Previne Open Redirect e header/control-char injection
  if (/[\x00-\x1f\x7f\\]/.test(rawNext)) return '/dashboard';
  if (!rawNext.startsWith('/') || rawNext.startsWith('//')) {
    return '/dashboard';
  }
  try {
    const parsed = new URL(rawNext, 'http://localhost');
    if (parsed.origin !== 'http://localhost') return '/dashboard';
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return '/dashboard';
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = sanitizeRedirectPath(requestUrl.searchParams.get('next'));

  let parsedNext: URL | null = null;
  try {
    parsedNext = new URL(next, requestUrl.origin);
  } catch {
    parsedNext = null;
  }

  const isContaResetAccess = Boolean(
    parsedNext &&
      parsedNext.pathname === '/conta' &&
      parsedNext.searchParams.get('reset') === 'true'
  );

  const sessionId =
    requestUrl.searchParams.get('session_id')?.trim() ||
    parsedNext?.searchParams.get('session_id')?.trim() ||
    null;

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
      // Fluxo de redefinição de senha deve acessar /conta?reset=true mesmo sem assinatura ativa ou onboarding completo
      if (isContaResetAccess) {
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.redirect(new URL('/login', requestUrl.origin));
      }

      // Verifica status da conta e onboarding diretamente do banco (sem backdoors nem query params)
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, is_subscribed, subscription_status')
        .eq('id', user.id)
        .single();

      const hasActivePlan = Boolean(
        profile &&
          (profile.is_subscribed ||
            profile.subscription_status === 'active' ||
            profile.subscription_status === 'trial' ||
            profile.subscription_status === 'trialing')
      );

      // Se NÃO tem plano ativo, mas veio do signup com ?session_id= válido, valida/ativa no servidor em /pagamento/sucesso
      if (!hasActivePlan) {
        if (sessionId && sessionId !== 'demo_session') {
          return NextResponse.redirect(
            new URL(
              `/pagamento/sucesso?session_id=${encodeURIComponent(sessionId)}`,
              requestUrl.origin
            )
          );
        }

        let planSuffix = '';
        const planParam =
          parsedNext?.searchParams.get('plan') || requestUrl.searchParams.get('plan');
        if (planParam === 'monthly' || planParam === 'annual') {
          planSuffix = `?plan=${planParam}`;
        }
        return NextResponse.redirect(new URL(`/pagamento${planSuffix}`, requestUrl.origin));
      }

      if (profile && !profile.onboarding_completed) {
        return NextResponse.redirect(new URL('/onboarding', requestUrl.origin));
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // Fallback seguro para login se não houver code válido
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}
