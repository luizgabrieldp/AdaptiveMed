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

const SubscriptionActionSchema = z.object({
  action: z.enum(['cancel', 'reactivate']),
  reason: z.string().max(500).optional(),
});

function extractPeriodEndSec(sub: Stripe.Subscription | null | undefined): number | null {
  if (!sub) return null;
  const periodEndSec =
    (sub as { current_period_end?: number | null }).current_period_end ??
    sub.items?.data?.[0]?.current_period_end;
  return typeof periodEndSec === 'number' && periodEndSec > 0 ? periodEndSec : null;
}

// GET: Retorna os detalhes da assinatura do usuário autenticado
export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select(
        'is_subscribed, subscription_status, cancel_at_period_end, current_period_end, stripe_subscription_id, stripe_customer_id'
      )
      .eq('id', user.id)
      .maybeSingle();

    if (!stripe) {
      return NextResponse.json({
        isSubscribed: profile?.is_subscribed ?? false,
        status: profile?.subscription_status || 'inactive',
        cancelAtPeriodEnd: profile?.cancel_at_period_end ?? false,
        currentPeriodEnd: profile?.current_period_end || null,
        planName: profile?.is_subscribed ? 'Plano Pro' : 'Nenhum plano ativo',
        amount: 'R$ 7,99/mês',
      });
    }

    let stripeSubscription: Stripe.Subscription | null = null;

    if (profile?.stripe_subscription_id) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
      } catch (err) {
        console.warn('Erro ao buscar assinatura direta:', err);
      }
    }

    if (!stripeSubscription) {
      let customerId = profile?.stripe_customer_id || null;
      if (!customerId && user.email) {
        const customers = await stripe.customers.list({
          email: user.email,
          limit: 1,
        });
        customerId = customers.data[0]?.id || null;
      }

      if (customerId) {
        const subs = await stripe.subscriptions.list({
          customer: customerId,
          status: 'all',
          limit: 10,
        });

        if (subs.data.length > 0) {
          stripeSubscription =
            subs.data.find(s => s.status === 'active' || s.status === 'trialing') || subs.data[0];
        }
      }
    }

    if (stripeSubscription) {
      const currentPeriodEndSec = extractPeriodEndSec(stripeSubscription);
      const periodEnd = currentPeriodEndSec
        ? new Date(currentPeriodEndSec * 1000).toISOString()
        : profile?.current_period_end || null;
      const planItem = stripeSubscription.items.data[0]?.price;
      const unitAmount = planItem?.unit_amount ? planItem.unit_amount / 100 : 7.99;
      const interval = planItem?.recurring?.interval === 'year' ? 'ano' : 'mês';

      return NextResponse.json({
        isSubscribed:
          stripeSubscription.status === 'active' || stripeSubscription.status === 'trialing',
        status: stripeSubscription.status,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        currentPeriodEnd: periodEnd,
        planName: unitAmount > 20 ? 'Plano Anual VIP' : 'Plano Mensal Pro',
        amount: `R$ ${unitAmount.toFixed(2).replace('.', ',')}/${interval}`,
      });
    }

    return NextResponse.json({
      isSubscribed: profile?.is_subscribed ?? false,
      status: profile?.subscription_status || 'inactive',
      cancelAtPeriodEnd: profile?.cancel_at_period_end ?? false,
      currentPeriodEnd: profile?.current_period_end || null,
      planName: profile?.is_subscribed ? 'Plano Pro' : 'Nenhum plano ativo',
      amount: 'R$ 7,99/mês',
    });
  } catch (error: any) {
    console.error('Erro na rota GET /api/subscription:', error);
    return NextResponse.json({ error: 'Erro interno ao consultar assinatura' }, { status: 500 });
  }
}

// POST: Ações de Cancelamento ou Reativação do usuário autenticado
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    const rawBody = await req.json().catch(() => ({}));
    const parsed = SubscriptionActionSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ação ou parâmetros inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { action, reason } = parsed.data;

    if (!stripe) {
      return NextResponse.json(
        { error: 'Serviço de assinatura não configurado no servidor.' },
        { status: 503 }
      );
    }

    const { data: prof } = await supabase
      .from('profiles')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    let subscriptionId: string | null = prof?.stripe_subscription_id || null;

    if (!subscriptionId) {
      let customerId = prof?.stripe_customer_id || null;
      if (!customerId && user.email) {
        const customers = await stripe.customers.list({
          email: user.email,
          limit: 1,
        });
        customerId = customers.data[0]?.id || null;
      }

      if (customerId) {
        const subs = await stripe.subscriptions.list({
          customer: customerId,
          status: 'all',
          limit: 10,
        });
        const activeOrTrialSub = subs.data.find(
          s => s.status === 'active' || s.status === 'trialing'
        );
        if (activeOrTrialSub) {
          subscriptionId = activeOrTrialSub.id;
        }
      }
    }

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Nenhuma assinatura ativa encontrada para esta conta.' },
        { status: 404 }
      );
    }

    if (action === 'cancel') {
      const updatedSub = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
        metadata: {
          cancellation_reason: reason || 'Não informado',
          cancelled_at: new Date().toISOString(),
        },
      });

      const endSec = extractPeriodEndSec(updatedSub);
      const periodEndIso = endSec ? new Date(endSec * 1000).toISOString() : null;
      const periodEndDate = endSec
        ? new Date(endSec * 1000).toLocaleDateString('pt-BR')
        : 'o final do ciclo';

      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const admin = createAdminClient();
        const profileUpdate: Record<string, unknown> = {
          cancel_at_period_end: true,
        };
        if (periodEndIso) {
          profileUpdate.current_period_end = periodEndIso;
        }
        await admin
          .from('profiles')
          .update(profileUpdate)
          .eq('id', user.id);
      }

      return NextResponse.json({
        success: true,
        action: 'cancel',
        periodEnd: periodEndDate,
        message: `Assinatura cancelada. Não haverá novas cobranças no seu cartão e seu acesso permanecerá liberado até ${periodEndDate}.`,
      });
    }

    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const admin = createAdminClient();
      await admin
        .from('profiles')
        .update({
          cancel_at_period_end: false,
        })
        .eq('id', user.id);
    }

    return NextResponse.json({
      success: true,
      action: 'reactivate',
      message: 'Assinatura reativada com sucesso! A renovação automática foi restabelecida.',
    });
  } catch (error: any) {
    console.error('Erro na rota POST /api/subscription:', error);
    return NextResponse.json({ error: 'Erro interno ao atualizar assinatura' }, { status: 500 });
  }
}
