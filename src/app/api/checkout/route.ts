import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { createClientServer as createServerSupabase } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20' as any,
    })
  : null;

function getAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured && configured.startsWith('http')) {
    return configured.replace(/\/+$/, '');
  }
  return 'https://adaptive-med.vercel.app';
}

interface PlanConfig {
  name: string;
  description: string;
  priceInCents: number;
  interval: 'month' | 'year';
}

const PLANS: Record<'monthly' | 'annual', PlanConfig> = {
  monthly: {
    name: 'Plano Mensal - AdaptiveMed Pro',
    description: 'Acesso completo a repetição espaçada adaptativa, simulados e métricas por 1 mês.',
    priceInCents: 799,
    interval: 'month',
  },
  annual: {
    name: 'Plano Anual - AdaptiveMed VIP',
    description: 'Acesso anual com todas as bancas do Brasil, cronograma adaptativo e suporte prioritário.',
    priceInCents: 6990,
    interval: 'year',
  },
};

const CheckoutPostSchema = z.object({
  planId: z.enum(['monthly', 'annual']).default('monthly'),
});

const CheckoutGetSchema = z.object({
  session_id: z.string().min(1).max(255),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const rawBody = await req.json().catch(() => ({}));
    const parsed = CheckoutPostSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload inválido', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { planId } = parsed.data;
    const plan = PLANS[planId];
    const appUrl = getAppUrl();

    if (!stripe) {
      return NextResponse.json(
        { error: 'Serviço de pagamento não configurado no servidor.' },
        { status: 503 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      client_reference_id: user.id,
      customer_email: user.email || undefined,
      allow_promotion_codes: true,
      payment_method_collection: 'if_required',
      metadata: {
        userId: user.id,
        planId,
      },
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: plan.name,
              description: plan.description,
            },
            unit_amount: plan.priceInCents,
            recurring: {
              interval: plan.interval,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pagamento`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Erro ao gerar Stripe Checkout:', error);
    return NextResponse.json(
      { error: 'Erro ao processar checkout do Stripe' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parsed = CheckoutGetSchema.safeParse({
      session_id: searchParams.get('session_id') ?? '',
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'session_id inválido ou obrigatório' }, { status: 400 });
    }

    const { session_id: sessionId } = parsed.data;

    if (!stripe) {
      return NextResponse.json(
        { error: 'Serviço de pagamento não configurado no servidor.' },
        { status: 503 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verifica propriedade da sessão de checkout
    const sessionUserId = session.client_reference_id || session.metadata?.userId;
    const sessionEmail = session.customer_details?.email || session.customer_email;
    const isOwner =
      (sessionUserId && sessionUserId === user.id) ||
      (!sessionUserId && sessionEmail && user.email && sessionEmail.toLowerCase() === user.email.toLowerCase());

    if (!isOwner) {
      return NextResponse.json({ error: 'Acesso negado a esta sessão de pagamento' }, { status: 403 });
    }

    const isValid =
      session.status === 'complete' &&
      (session.payment_status === 'paid' || session.payment_status === 'no_payment_required');

    // Ativação idempotente no servidor via service_role (complementa o webhook)
    if (isValid && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const admin = createAdminClient();
      const customerId =
        typeof session.customer === 'string' ? session.customer : session.customer?.id || null;
      const subscriptionId =
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id || null;

      await admin
        .from('profiles')
        .update({
          is_subscribed: true,
          subscription_status: 'active',
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
        })
        .eq('id', user.id);
    }

    return NextResponse.json({
      valid: isValid,
      status: session.status,
      payment_status: session.payment_status,
      planId: session.metadata?.planId || 'monthly',
    });
  } catch (error: any) {
    console.error('Erro ao validar sessão de checkout:', error);
    return NextResponse.json({ error: 'Erro ao validar sessão de pagamento' }, { status: 500 });
  }
}
