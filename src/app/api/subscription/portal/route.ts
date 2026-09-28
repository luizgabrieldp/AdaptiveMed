import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20' as any,
    })
  : null;

async function getSupabase() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {}
      },
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin') || 'https://adaptive-med.vercel.app';

    if (!stripe) {
      return NextResponse.json({
        url: `${origin}/conta?notice=stripe_pending`,
        message: 'Stripe Billing Portal requer STRIPE_SECRET_KEY.',
      });
    }

    const supabase = await getSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json().catch(() => ({}));
    const targetEmail = user?.email || body.email;

    if (!targetEmail) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    let customerId: string | null = null;

    if (user?.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.stripe_customer_id) {
        customerId = profile.stripe_customer_id;
      }
    }

    if (!customerId && targetEmail) {
      const customers = await stripe.customers.list({
        email: targetEmail,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    if (!customerId) {
      return NextResponse.json(
        {
          error:
            'Nenhum cadastro de faturamento do Stripe foi encontrado para este e-mail. Caso utilize o modo demonstração ou cupom 100%, não há cobranças ativas no cartão.',
        },
        { status: 404 }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/conta`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Erro na criação do Stripe Billing Portal:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
