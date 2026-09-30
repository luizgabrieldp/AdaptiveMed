import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const path = request.nextUrl.pathname;
  const isAuthPage = path === '/login' || path === '/signup';
  const isPaymentPage = path.startsWith('/pagamento');
  const isPaymentSuccessPage = path.startsWith('/pagamento/sucesso');

  // Rotas restritas que exigem assinatura paga ativa
  const isRestrictedAppPage =
    path.startsWith('/dashboard') ||
    path.startsWith('/diario') ||
    path.startsWith('/revisoes') ||
    path.startsWith('/evolucao') ||
    path.startsWith('/simulados') ||
    path.startsWith('/prevalencia') ||
    path.startsWith('/onboarding') ||
    path.startsWith('/conta');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    !supabaseKey ||
    supabaseUrl.includes('placeholder') ||
    supabaseKey.includes('placeholder')
  ) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Se tentar acessar páginas do app sem estar autenticado
  if (isRestrictedAppPage && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirectedFrom', path);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Se tentar acessar a tela de pagamento sem estar autenticado
  if (isPaymentPage && !isPaymentSuccessPage && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirectedFrom', '/pagamento');
    return NextResponse.redirect(loginUrl);
  }

  // 3. Se usuário autenticado tentar acessar páginas do app ou de pagamento
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_subscribed, subscription_status, onboarding_completed')
      .eq('id', user.id)
      .single();

    const hasActiveSubscription = Boolean(
      profile?.is_subscribed || profile?.subscription_status === 'active'
    );

    // Se NÃO pagou e está tentando entrar no app
    if (isRestrictedAppPage && !hasActiveSubscription) {
      const paymentUrl = request.nextUrl.clone();
      paymentUrl.pathname = '/pagamento';
      return NextResponse.redirect(paymentUrl);
    }

    // Se JÁ pagou e está tentando acessar /pagamento
    if (isPaymentPage && !isPaymentSuccessPage && hasActiveSubscription) {
      const redirectUrl = request.nextUrl.clone();
      if (profile?.onboarding_completed) {
        redirectUrl.pathname = '/dashboard';
      } else {
        redirectUrl.pathname = '/onboarding';
      }
      return NextResponse.redirect(redirectUrl);
    }

    // Se está em /login ou /signup já autenticado
    if (isAuthPage) {
      const redirectUrl = request.nextUrl.clone();
      if (hasActiveSubscription) {
        redirectUrl.pathname = profile?.onboarding_completed ? '/dashboard' : '/onboarding';
      } else {
        redirectUrl.pathname = '/pagamento';
      }
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
