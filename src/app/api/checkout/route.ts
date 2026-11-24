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

function extractPeriodEndIso(sub: Stripe.Subscription | null | undefined): string | undefined {
  if (!sub) return undefined;
  const periodEndSec =
    (sub as { current_period_end?: number | null }).current_period_end ??
    sub.items?.data?.[0]?.current_period_end;
  return typeof periodEndSec === 'number' && periodEndSec > 0
    ? new Date(periodEndSec * 1000).toISOString()
    : undefined;
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

    const profileClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;
    const { data: profile, error: profileError } = await profileClient
      .from('profiles')
      .select('stripe_customer_id, is_subscribed, subscription_status')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Erro ao consultar perfil no checkout:', profileError.message);
      return NextResponse.json(
        { error: 'Erro ao verificar status da assinatura no servidor.' },
        { status: 500 }
      );
    }

    if (
      profile?.is_subscribed ||
      profile?.subscription_status === 'active' ||
      profile?.subscription_status === 'trial' ||
      profile?.subscription_status === 'trialing'
    ) {
      return NextResponse.json(
        { error: 'Você já possui uma assinatura ativa.' },
        { status: 409 }
      );
    }

    const existingCustomerId = profile?.stripe_customer_id?.trim() || null;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      client_reference_id: user.id,
      ...(existingCustomerId
        ? { customer: existingCustomerId }
        : { customer_email: user.email || undefined }),
      allow_promotion_codes: true,
      payment_method_collection: 'if_required',
      metadata: {
        userId: user.id,
        planId,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planId,
        },
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

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    // Verifica propriedade da sessão de checkout
    const sessionUserId = session.client_reference_id || session.metadata?.userId;
    const sessionEmail = session.customer_details?.email || session.customer_email;
    const isOwner =
      (sessionUserId && sessionUserId === user.id) ||
      (!sessionUserId && sessionEmail && user.email && sessionEmail.toLowerCase() === user.email.toLowerCase());

    if (!isOwner) {
      return NextResponse.json({ error: 'Acesso negado a esta sessão de pagamento' }, { status: 403 });
    }

    const sub =
      session.subscription && typeof session.subscription === 'object'
        ? (session.subscription as Stripe.Subscription)
        : null;
    const isSubscriptionCurrentlyActive = sub
      ? sub.status === 'active' || sub.status === 'trialing'
      : true;

    const isValid =
      session.status === 'complete' &&
      (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') &&
      isSubscriptionCurrentlyActive;

    // Ativação idempotente no servidor via service_role (complementa o webhook)
    if (isValid) {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('SUPABASE_SERVICE_ROLE_KEY não configurada para ativar assinatura.');
        return NextResponse.json(
          { error: 'Serviço administrativo de assinatura não configurado no servidor.' },
          { status: 500 }
        );
      }

      const admin = createAdminClient();
      if (!admin) {
        return NextResponse.json(
          { error: 'Cliente administrativo indisponível no servidor.' },
          { status: 500 }
        );
      }

      const customerId =
        typeof session.customer === 'string' ? session.customer : session.customer?.id || null;
      const subscriptionId =
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id || null;

      const currentPeriodEnd = extractPeriodEndIso(sub);
      const updatePayload: Record<string, unknown> = {
        is_subscribed: true,
        subscription_status: sub?.status === 'trialing' ? 'trial' : 'active',
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        cancel_at_period_end: Boolean(sub?.cancel_at_period_end),
      };
      if (currentPeriodEnd !== undefined) {
        updatePayload.current_period_end = currentPeriodEnd;
      }

      const { data: updatedRows, error: updateError } = await admin
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id)
        .select('id');

      if (updateError) {
        console.error('Erro ao ativar assinatura no Supabase via GET /api/checkout:', updateError);
        return NextResponse.json(
          { error: 'Erro ao registrar ativação da assinatura' },
          { status: 500 }
        );
      }

      if (!updatedRows || updatedRows.length === 0) {
        const { error: upsertError } = await admin
          .from('profiles')
          .upsert(
            {
              id: user.id,
              full_name:
                typeof user.user_metadata?.full_name === 'string'
                  ? user.user_metadata.full_name
                  : '',
              target_specialty:
                typeof user.user_metadata?.target_specialty === 'string'
                  ? user.user_metadata.target_specialty
                  : '',
              ...updatePayload,
            },
            { onConflict: 'id' }
          );

        if (upsertError) {
          console.error(
            'Erro ao criar/ativar perfil ausente no Supabase via GET /api/checkout:',
            upsertError
          );
          return NextResponse.json(
            { error: 'Erro ao registrar ativação da assinatura' },
            { status: 500 }
          );
        }
      }
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
