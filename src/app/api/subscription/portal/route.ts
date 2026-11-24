import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClientServer as createServerSupabase } from '@/lib/supabase/server';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20' as any,
    })
  : null;

function getAppUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ];
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (!trimmed) continue;
    try {
      const parsed = new URL(trimmed);
      if (
        (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
        parsed.hostname
      ) {
        return trimmed.replace(/\/+$/, '');
      }
    } catch {
      // ignora URL inválida e tenta o próximo fallback
    }
  }
  return 'https://adaptive-med.vercel.app';
}

export async function POST() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    const appUrl = getAppUrl();

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe Billing Portal requer STRIPE_SECRET_KEY configurado no servidor.' },
        { status: 503 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    let customerId: string | null = profile?.stripe_customer_id || null;

    if (!customerId && user.email) {
      const customers = await stripe.customers.list({
        email: user.email,
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
            'Nenhum cadastro de faturamento do Stripe foi encontrado para sua conta.',
        },
        { status: 404 }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/conta`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Erro na criação do Stripe Billing Portal:', error);
    return NextResponse.json({ error: 'Erro ao abrir portal de faturamento' }, { status: 500 });
  }
}
